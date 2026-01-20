import * as THREE from 'three';
import { ProceduralZombie } from '../models/ProceduralZombie';

export class ZombieEntity {
    constructor(scene, x, z, zombieLogic) {
        this.scene = scene;
        this.logic = zombieLogic; // The Logic/Zombie.js instance

        // Create humanoid zombie model
        this.mesh = ProceduralZombie.create();
        this.mesh.position.set(x, 0, z); // Y=0 (feet on ground)

        // Get body part references for animation
        this.head = this.mesh.userData.head;
        this.torso = this.mesh.userData.torso;
        this.leftArm = this.mesh.userData.leftArm;
        this.rightArm = this.mesh.userData.rightArm;
        this.leftLeg = this.mesh.userData.leftLeg;
        this.rightLeg = this.mesh.userData.rightLeg;
        this.materials = this.mesh.userData.materials;

        // Animation state
        this.walkCycle = Math.random() * Math.PI * 2; // Random start phase
        this.isMoving = false;

        // Zombie behavior variations
        this.swayAmount = 0.1 + Math.random() * 0.1; // Random sway intensity
        this.walkSpeed = 4 + Math.random() * 2; // Random animation speed

        this.scene.add(this.mesh);
        this.isDead = false;
    }

    update(delta, playerPosition) {
        if (this.isDead) return;

        // Simple Chase AI
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.mesh.position)
            .normalize();

        // Ignore Y difference for movement (ground level)
        direction.y = 0;

        // Move zombie
        const moveSpeed = this.logic.speed * delta;
        this.mesh.position.add(direction.clone().multiplyScalar(moveSpeed));

        // Face player (only Y rotation)
        const targetAngle = Math.atan2(direction.x, direction.z);
        this.mesh.rotation.y = targetAngle;

        // Update walk animation
        this.isMoving = moveSpeed > 0.001;
        this.updateWalkAnimation(delta);
    }

    /**
     * Zombie walk animation - shambling, arms outstretched
     */
    updateWalkAnimation(delta) {
        if (!this.isMoving) return;

        // Advance walk cycle based on movement speed
        this.walkCycle += delta * this.walkSpeed * this.logic.speed;

        const swing = Math.sin(this.walkCycle);
        const swingAlt = Math.sin(this.walkCycle + Math.PI); // Opposite phase

        // Leg animation (walking motion)
        const legSwing = swing * 0.5; // Max angle for legs
        if (this.leftLeg) {
            this.leftLeg.rotation.x = legSwing;
        }
        if (this.rightLeg) {
            this.rightLeg.rotation.x = -legSwing;
        }

        // Arm animation - zombie style: arms outstretched forward with slight swing
        const armForward = 1.3; // Arms reaching forward
        const armSwing = swing * 0.2; // Subtle swing

        if (this.leftArm) {
            this.leftArm.rotation.x = armForward + armSwing;
            this.leftArm.rotation.z = -0.2; // Slightly outward
        }
        if (this.rightArm) {
            this.rightArm.rotation.x = armForward - armSwing;
            this.rightArm.rotation.z = 0.2; // Slightly outward
        }

        // Head bobbing and swaying (zombie shamble)
        if (this.head) {
            this.head.rotation.x = Math.sin(this.walkCycle * 2) * 0.05; // Subtle nod
            this.head.rotation.z = Math.sin(this.walkCycle) * this.swayAmount * 0.5; // Head tilt
        }

        // Torso sway (drunken zombie walk)
        if (this.torso) {
            this.torso.rotation.z = Math.sin(this.walkCycle) * this.swayAmount * 0.3;
            this.torso.rotation.x = Math.sin(this.walkCycle * 0.5) * 0.05; // Slight forward lean
        }

        // Vertical bobbing (up/down with each step)
        const verticalBob = Math.abs(Math.sin(this.walkCycle * 2)) * 0.03;
        this.mesh.position.y = verticalBob;
    }

    takeDamage(amount) {
        this.logic.hp -= amount;

        // Flash all materials red
        this.flashDamage();

        if (this.logic.hp <= 0) {
            this.die();
        }
    }

    /**
     * Flash damage effect - all body parts turn red briefly
     */
    flashDamage() {
        // Store original colors and set to red
        const originalColors = [];

        this.mesh.traverse((child) => {
            if (child.isMesh && child.material) {
                if (child.material.emissive) {
                    originalColors.push({
                        material: child.material,
                        emissive: child.material.emissive.getHex(),
                        emissiveIntensity: child.material.emissiveIntensity
                    });
                    child.material.emissive.setHex(0xff0000);
                    child.material.emissiveIntensity = 0.8;
                }
            }
        });

        // Restore after delay
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

        // Death animation: fall backward
        this.playDeathAnimation();
    }

    /**
     * Simple death animation - zombie falls backward
     */
    playDeathAnimation() {
        const startTime = Date.now();
        const duration = 500; // 0.5 seconds

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Fall backward rotation
            this.mesh.rotation.x = -progress * (Math.PI / 2);

            // Sink slightly into ground
            this.mesh.position.y = -progress * 0.5;

            // Fade out (scale down slightly)
            const scale = 1 - progress * 0.2;
            this.mesh.scale.set(scale, scale, scale);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Remove from scene after animation
                this.scene.remove(this.mesh);

                // Dispose geometries and materials
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
}
