import * as THREE from 'three';
import { ProceduralZombie } from '../models/ProceduralZombie';
import { ZOMBIE_TYPES } from '../logic/Zombie';

export class ZombieEntity {
    constructor(scene, x, z, zombieLogic, zombieType = 'walker') {
        this.scene = scene;
        this.logic = zombieLogic;
        this.zombieType = zombieType;
        this.typeConfig = ZOMBIE_TYPES[zombieType] || ZOMBIE_TYPES.walker;

        // Create humanoid zombie model with type-specific appearance
        this.mesh = ProceduralZombie.create(zombieType);
        this.mesh.position.set(x, 0, z);

        // Store initial Y position for animation
        this.initialY = 0;

        // Apply scale based on type
        this.mesh.scale.setScalar(this.typeConfig.scale);

        // Get body part references for animation
        this.head = this.mesh.userData.head;
        this.torso = this.mesh.userData.torso;
        this.leftArm = this.mesh.userData.leftArm;
        this.rightArm = this.mesh.userData.rightArm;
        this.leftLeg = this.mesh.userData.leftLeg;
        this.rightLeg = this.mesh.userData.rightLeg;
        this.materials = this.mesh.userData.materials;

        // Animation state
        this.walkCycle = Math.random() * Math.PI * 2;
        this.isMoving = false;
        this.animTime = Math.random() * 100;

        // Zombie behavior variations based on type
        this.swayAmount = this.getSwayAmount();
        this.walkSpeed = this.getWalkSpeed();
        this.aggressionLevel = 0;

        // Get head components for animation
        if (this.head && this.head.userData) {
            this.leftEye = this.head.userData.leftEye;
            this.rightEye = this.head.userData.rightEye;
            this.jaw = this.head.userData.jaw;
            this.mouth = this.head.userData.mouth;
        }

        // Special effects for certain types
        this.setupSpecialEffects();

        this.scene.add(this.mesh);
        this.isDead = false;

        // Screamer buff cooldown
        this.lastBuffTime = 0;
        this.buffCooldown = 5; // seconds
    }

    getSwayAmount() {
        switch (this.zombieType) {
            case 'runner': return 0.05; // Less sway, more controlled
            case 'tank': return 0.15; // Heavy lumbering
            case 'exploder': return 0.2; // Unstable
            default: return 0.1 + Math.random() * 0.1;
        }
    }

    getWalkSpeed() {
        switch (this.zombieType) {
            case 'runner': return 8; // Fast animation
            case 'tank': return 2; // Slow heavy steps
            default: return 4 + Math.random() * 2;
        }
    }

    setupSpecialEffects() {
        // Add special visual effects based on zombie type
        switch (this.zombieType) {
            case 'exploder':
                this.addGlowEffect(0xff3333, 2);
                this.addPulsingBelly();
                break;
            case 'spitter':
                this.addDrippingEffect();
                break;
            case 'screamer':
                this.addAuraEffect(0x9966ff);
                break;
            case 'boss':
                this.addGlowEffect(0x660066, 5);
                this.addBossAura();
                break;
        }
    }

    addGlowEffect(color, intensity) {
        // Use emissive material instead of PointLight for performance
        // Only add PointLight for boss (special case)
        if (this.zombieType === 'boss') {
            const light = new THREE.PointLight(color, intensity * 0.5, 8);
            light.position.set(0, 1, 0);
            this.mesh.add(light);
            this.glowLight = light;
        }
    }

    addPulsingBelly() {
        // Visual indicator of imminent explosion
        this.pulseTime = 0;
    }

    addDrippingEffect() {
        // Placeholder for dripping acid particles
        this.dripTime = 0;
    }

    addAuraEffect(color) {
        const auraGeo = new THREE.SphereGeometry(2, 16, 16);
        const auraMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        this.aura = new THREE.Mesh(auraGeo, auraMat);
        this.aura.position.y = 1;
        this.mesh.add(this.aura);
    }

    addBossAura() {
        // Larger, more intimidating aura for boss
        const auraGeo = new THREE.SphereGeometry(4, 32, 32);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0x440044,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        this.bossAura = new THREE.Mesh(auraGeo, auraMat);
        this.bossAura.position.y = 1.5;
        this.mesh.add(this.bossAura);

        // Add ground crack effect placeholder
        const crackGeo = new THREE.RingGeometry(0.5, 3, 32);
        const crackMat = new THREE.MeshBasicMaterial({
            color: 0x220022,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        this.groundCrack = new THREE.Mesh(crackGeo, crackMat);
        this.groundCrack.rotation.x = -Math.PI / 2;
        this.groundCrack.position.y = 0.01;
        this.mesh.add(this.groundCrack);
    }

    update(delta, playerPosition, allZombies = []) {
        if (this.isDead) return;

        this.animTime += delta;
        this.logic.updateBuff(delta);

        // Simple Chase AI
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.mesh.position)
            .normalize();

        const distanceToPlayer = this.mesh.position.distanceTo(playerPosition);
        direction.y = 0;

        this.aggressionLevel = Math.max(0, 1 - distanceToPlayer / 15);

        // Move zombie (faster when aggressive)
        const speedMultiplier = 1 + this.aggressionLevel * 0.3;
        const moveSpeed = this.logic.speed * delta * speedMultiplier;
        this.mesh.position.add(direction.clone().multiplyScalar(moveSpeed));

        // Face player
        const targetAngle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = targetAngle;

        // Update animations
        this.isMoving = moveSpeed > 0.001;
        this.updateWalkAnimation(delta);
        this.updateFacialAnimation(delta, distanceToPlayer);
        this.updateEyeGlow(delta);
        this.updateSpecialEffects(delta, playerPosition, allZombies);
    }

    updateSpecialEffects(delta, playerPosition, allZombies) {
        // Type-specific updates
        switch (this.zombieType) {
            case 'exploder':
                this.updateExploderEffect(delta);
                break;
            case 'screamer':
                this.updateScreamerEffect(delta, allZombies);
                break;
            case 'boss':
                this.updateBossEffect(delta);
                break;
        }
    }

    updateExploderEffect(delta) {
        if (this.glowLight) {
            // Pulsing glow that speeds up as HP decreases
            const hpRatio = this.logic.hp / this.logic.maxHp;
            const pulseSpeed = 2 + (1 - hpRatio) * 8;
            this.pulseTime += delta * pulseSpeed;
            const intensity = 2 + Math.sin(this.pulseTime) * (1 + (1 - hpRatio) * 2);
            this.glowLight.intensity = intensity;
        }
    }

    updateScreamerEffect(delta, allZombies) {
        // Buff nearby zombies periodically
        this.lastBuffTime += delta;
        if (this.lastBuffTime >= this.buffCooldown) {
            this.lastBuffTime = 0;
            this.buffNearbyZombies(allZombies);
        }

        // Aura pulse
        if (this.aura) {
            const pulse = 0.15 + Math.sin(this.animTime * 3) * 0.05;
            this.aura.material.opacity = pulse;
            const scale = 1 + Math.sin(this.animTime * 2) * 0.1;
            this.aura.scale.setScalar(scale);
        }
    }

    updateBossEffect(delta) {
        if (this.bossAura) {
            const pulse = 0.2 + Math.sin(this.animTime * 2) * 0.1;
            this.bossAura.material.opacity = pulse;
            this.bossAura.rotation.y += delta * 0.5;
        }
        if (this.groundCrack) {
            const scale = 1 + Math.sin(this.animTime * 3) * 0.1;
            this.groundCrack.scale.setScalar(scale);
        }
    }

    buffNearbyZombies(allZombies) {
        const buffRange = 10;
        for (const zombie of allZombies) {
            if (zombie === this || zombie.isDead) continue;
            const dist = this.mesh.position.distanceTo(zombie.mesh.position);
            if (dist < buffRange) {
                zombie.logic.applyBuff();
                // Visual feedback
                zombie.showBuffEffect();
            }
        }
    }

    showBuffEffect() {
        // Brief purple flash when buffed
        this.mesh.traverse((child) => {
            if (child.isMesh && child.material && child.material.emissive) {
                const originalEmissive = child.material.emissive.getHex();
                child.material.emissive.setHex(0x9966ff);
                child.material.emissiveIntensity = 1.0;
                setTimeout(() => {
                    if (!this.isDead) {
                        child.material.emissive.setHex(originalEmissive);
                        child.material.emissiveIntensity = 0.3;
                    }
                }, 300);
            }
        });
    }

    /**
     * Zombie walk animation - shambling, arms outstretched
     */
    updateWalkAnimation(delta) {
        if (!this.isMoving) return;

        this.walkCycle += delta * this.walkSpeed * this.logic.speed;

        const swing = Math.sin(this.walkCycle);

        // Leg animation
        const legSwing = swing * 0.5;
        if (this.leftLeg) this.leftLeg.rotation.x = legSwing;
        if (this.rightLeg) this.rightLeg.rotation.x = -legSwing;

        // Arm animation - type specific
        let armForward = 1.3;
        let armSwing = swing * 0.2;

        if (this.zombieType === 'runner') {
            armForward = 0.5; // Arms more natural for running
            armSwing = swing * 0.5; // More swing
        } else if (this.zombieType === 'tank') {
            armForward = 0.8; // Arms more down
            armSwing = swing * 0.1; // Less swing, more power
        }

        if (this.leftArm) {
            this.leftArm.rotation.x = armForward + armSwing;
            this.leftArm.rotation.z = -0.2;
        }
        if (this.rightArm) {
            this.rightArm.rotation.x = armForward - armSwing;
            this.rightArm.rotation.z = 0.2;
        }

        // Head bobbing and swaying
        if (this.head) {
            this.head.rotation.x = Math.sin(this.walkCycle * 2) * 0.05;
            this.head.rotation.z = Math.sin(this.walkCycle) * this.swayAmount * 0.5;
        }

        // Torso sway
        if (this.torso) {
            this.torso.rotation.z = Math.sin(this.walkCycle) * this.swayAmount * 0.3;
            this.torso.rotation.x = Math.sin(this.walkCycle * 0.5) * 0.05;
        }

        // Vertical bobbing (relative to initial Y position)
        const verticalBob = Math.abs(Math.sin(this.walkCycle * 2)) * 0.03;
        this.mesh.position.y = this.initialY + verticalBob;
    }

    /**
     * Facial animation
     */
    updateFacialAnimation(delta, distanceToPlayer) {
        if (this.jaw && distanceToPlayer < 8) {
            const snapIntensity = Math.max(0, 1 - distanceToPlayer / 8);
            const snapFrequency = 5 + snapIntensity * 10;
            const jawOpen = (Math.sin(this.animTime * snapFrequency) + 1) * 0.5 * snapIntensity;
            this.jaw.rotation.x = jawOpen * 0.4;
            this.jaw.position.y = -0.12 - jawOpen * 0.02;
        }

        if (this.head && distanceToPlayer < 5) {
            const twitch = (Math.random() - 0.5) * 0.1 * this.aggressionLevel;
            this.head.rotation.y = twitch;
        }
    }

    /**
     * Eye glow pulsing effect
     */
    updateEyeGlow(delta) {
        if (!this.leftEye || !this.rightEye) return;

        const baseIntensity = 1.0;
        const pulseAmount = 0.5 + this.aggressionLevel * 0.5;
        const pulseSpeed = 3 + this.aggressionLevel * 5;
        const intensity = baseIntensity + Math.sin(this.animTime * pulseSpeed) * pulseAmount;

        if (this.leftEye.material) this.leftEye.material.emissiveIntensity = intensity;
        if (this.rightEye.material) this.rightEye.material.emissiveIntensity = intensity;

        const eyeScale = 1 + this.aggressionLevel * 0.2;
        this.leftEye.scale.setScalar(eyeScale);
        this.rightEye.scale.setScalar(eyeScale);
    }

    takeDamage(amount) {
        this.logic.hp -= amount;
        this.flashDamage();

        if (this.logic.hp <= 0) {
            this.die();
            return true;
        }
        return false;
    }

    /**
     * Flash damage effect
     */
    flashDamage() {
        const originalColors = [];

        this.mesh.traverse((child) => {
            if (child.isMesh && child.material && child.material.emissive) {
                originalColors.push({
                    material: child.material,
                    emissive: child.material.emissive.getHex(),
                    emissiveIntensity: child.material.emissiveIntensity
                });
                child.material.emissive.setHex(0xff0000);
                child.material.emissiveIntensity = 0.8;
            }
        });

        setTimeout(() => {
            if (this.isDead) return;
            originalColors.forEach(({ material, emissive, emissiveIntensity }) => {
                material.emissive.setHex(emissive);
                material.emissiveIntensity = emissiveIntensity;
            });
        }, 100);
    }

    die() {
        this.isDead = true;
        this.playDeathAnimation();
    }

    /**
     * Death animation
     */
    playDeathAnimation() {
        const startTime = Date.now();
        const duration = 500;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            this.mesh.rotation.x = -progress * (Math.PI / 2);
            this.mesh.position.y = -progress * 0.5;

            const scale = this.typeConfig.scale * (1 - progress * 0.2);
            this.mesh.scale.setScalar(scale);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(this.mesh);
                this.mesh.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
        };

        animate();
    }

    // Get explosion data for exploder zombie
    getExplosionData() {
        if (this.zombieType === 'exploder') {
            return {
                damage: this.logic.getExplosionDamage(),
                radius: this.logic.getExplosionRadius(),
                position: this.mesh.position.clone()
            };
        }
        return null;
    }
}
