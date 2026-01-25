import * as THREE from 'three';
import { ProceduralWeapons } from '../models/ProceduralWeapons';

/**
 * First Person Weapon View System
 * Renders weapon and hands in front of the camera (Call of Duty style)
 * Enhanced with realistic fire animations, muzzle flash, and shell casings
 */
export class FirstPersonWeaponView {
    constructor(renderer) {
        this.renderer = renderer;

        // Weapon-specific scene and camera (prevents clipping issues)
        this.weaponScene = new THREE.Scene();
        this.weaponCamera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.01,  // Very small near plane for close weapons
            10
        );

        // Add lighting to weapon scene
        this.setupLighting();

        // Weapon container (attached to camera)
        this.weaponContainer = null;
        this.currentWeaponType = null;

        // Base position (right side, lower area of screen)
        this.basePosition = new THREE.Vector3(0.1, -0.15, -0.3);
        this.baseRotation = new THREE.Euler(0, 0, 0);

        // Animation states
        this.bobPhase = 0;
        this.bobAmplitude = { x: 0.008, y: 0.012 };
        this.bobSpeed = 10;

        // Enhanced recoil system with multiple phases
        this.recoilPhase = 'idle'; // 'idle', 'kickback', 'return', 'settle'
        this.recoilTimer = 0;
        this.recoilAmount = 0;
        this.recoilVelocity = 0;

        // Recoil configuration per weapon type (enhanced)
        this.recoilConfig = {
            'Knight': {
                rotation: 0.3, kickback: 0.06, recovery: 12,
                kickTime: 0.05, returnTime: 0.15, settleTime: 0.1,
                hasMuzzleFlash: false, hasShellEject: false
            },
            'Sniper': {
                rotation: 0.4, kickback: 0.15, recovery: 3,
                kickTime: 0.08, returnTime: 0.4, settleTime: 0.3,
                hasMuzzleFlash: true, hasShellEject: true,
                muzzleFlashSize: 0.15, muzzleFlashDuration: 0.08
            },
            'MachineGun': {
                rotation: 0.08, kickback: 0.025, recovery: 20,
                kickTime: 0.02, returnTime: 0.04, settleTime: 0.02,
                hasMuzzleFlash: true, hasShellEject: true,
                muzzleFlashSize: 0.08, muzzleFlashDuration: 0.03
            },
            'Archer': {
                rotation: 0.15, kickback: 0.08, recovery: 6,
                kickTime: 0.03, returnTime: 0.2, settleTime: 0.15,
                hasMuzzleFlash: false, hasShellEject: false
            },
            'Wizard': {
                rotation: 0.12, kickback: 0.03, recovery: 8,
                kickTime: 0.05, returnTime: 0.15, settleTime: 0.1,
                hasMuzzleFlash: false, hasShellEject: false,
                hasMagicEffect: true
            }
        };

        // Sway (subtle idle movement)
        this.swayTime = 0;
        this.swayAmount = 0.003;

        // Knight sword swing animation (enhanced)
        this.swingPhase = 0;
        this.isSwinging = false;
        this.swingDuration = 0.35;
        this.swingTimer = 0;
        this.swordTrail = [];

        // Archer bow draw animation
        this.isDrawing = false;
        this.drawAmount = 0;
        this.maxDrawTime = 2.0;

        // Muzzle flash effect
        this.muzzleFlash = null;
        this.muzzleFlashTimer = 0;

        // Shell casings
        this.shellCasings = [];

        // Magic particles for Wizard
        this.magicParticles = [];

        // Handle window resize
        window.addEventListener('resize', () => this.onResize());
    }

    setupLighting() {
        // Ambient light for base visibility
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.weaponScene.add(ambient);

        // Directional light from camera direction
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(0.5, 1, 0.5);
        this.weaponScene.add(directional);

        // Fill light from below
        const fill = new THREE.DirectionalLight(0xffffff, 0.3);
        fill.position.set(-0.5, -0.5, 0.5);
        this.weaponScene.add(fill);
    }

    /**
     * Set the current weapon based on character type
     */
    setWeapon(characterType) {
        // Remove existing weapon
        if (this.weaponContainer) {
            this.weaponScene.remove(this.weaponContainer);
        }

        this.currentWeaponType = characterType;

        // Create new weapon with hands
        this.weaponContainer = ProceduralWeapons.createWeaponWithHands(characterType);
        this.weaponScene.add(this.weaponContainer);

        // Reset position
        this.weaponContainer.position.copy(this.basePosition);
        this.weaponContainer.rotation.copy(this.baseRotation);

        // Adjust base position per weapon type
        this.adjustWeaponPosition(characterType);
    }

    /**
     * Adjust weapon position based on type
     */
    adjustWeaponPosition(characterType) {
        switch (characterType) {
            case 'Knight':
                this.basePosition.set(0.2, -0.2, -0.25);
                break;
            case 'Sniper':
                this.basePosition.set(0.12, -0.12, -0.35);
                break;
            case 'MachineGun':
                this.basePosition.set(0.1, -0.1, -0.3);
                break;
            case 'Archer':
                this.basePosition.set(-0.1, -0.12, -0.25);
                break;
            case 'Wizard':
                this.basePosition.set(0.15, -0.18, -0.25);
                break;
            default:
                this.basePosition.set(0.1, -0.15, -0.3);
        }
    }

    /**
     * Trigger recoil animation with enhanced effects
     */
    triggerRecoil(characterType) {
        // Knight uses sword swing instead of recoil
        if (characterType === 'Knight') {
            this.triggerSwordSwing();
            return;
        }

        const config = this.recoilConfig[characterType] || this.recoilConfig['MachineGun'];

        // Start enhanced recoil animation
        this.recoilPhase = 'kickback';
        this.recoilTimer = 0;
        this.recoilAmount = 0;
        this.recoilVelocity = 1.0 / config.kickTime; // Velocity to reach max in kickTime

        // Create muzzle flash
        if (config.hasMuzzleFlash) {
            this.createMuzzleFlash(config.muzzleFlashSize, config.muzzleFlashDuration);
        }

        // Eject shell casing
        if (config.hasShellEject) {
            this.ejectShellCasing();
        }

        // Magic effect for Wizard
        if (config.hasMagicEffect && characterType === 'Wizard') {
            this.createMagicCastEffect();
        }

        // Archer bow release effect
        if (characterType === 'Archer') {
            this.triggerBowRelease();
        }
    }

    /**
     * Create muzzle flash effect
     */
    createMuzzleFlash(size = 0.1, duration = 0.05) {
        if (this.muzzleFlash) {
            this.weaponScene.remove(this.muzzleFlash);
        }

        // Create flash geometry (multiple planes for 3D effect)
        const flashGroup = new THREE.Group();

        // Main flash sprite
        const flashGeo = new THREE.PlaneGeometry(size * 2, size * 2);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const flash1 = new THREE.Mesh(flashGeo, flashMat);
        flashGroup.add(flash1);

        // Cross flash for 3D look
        const flash2 = new THREE.Mesh(flashGeo, flashMat.clone());
        flash2.rotation.y = Math.PI / 2;
        flashGroup.add(flash2);

        // Orange core
        const coreGeo = new THREE.PlaneGeometry(size, size);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.z = 0.01;
        flashGroup.add(core);

        // Position at muzzle (approximate position based on weapon type)
        let muzzlePos = new THREE.Vector3(0, 0, -0.4);
        if (this.currentWeaponType === 'Sniper') {
            muzzlePos.set(0.02, 0.02, -0.6);
        } else if (this.currentWeaponType === 'MachineGun') {
            muzzlePos.set(0.02, 0.03, -0.45);
        }

        flashGroup.position.copy(muzzlePos);
        flashGroup.position.add(this.basePosition);

        this.muzzleFlash = flashGroup;
        this.muzzleFlashTimer = duration;
        this.weaponScene.add(flashGroup);
    }

    /**
     * Eject shell casing
     */
    ejectShellCasing() {
        // Create shell casing geometry
        const shellGeo = new THREE.CylinderGeometry(0.003, 0.004, 0.015, 6);
        const shellMat = new THREE.MeshStandardMaterial({
            color: 0xd4a84b,
            metalness: 0.8,
            roughness: 0.3
        });
        const shell = new THREE.Mesh(shellGeo, shellMat);

        // Start position (ejection port)
        let ejectPos = new THREE.Vector3(0.08, 0, -0.25);
        if (this.currentWeaponType === 'Sniper') {
            ejectPos.set(0.1, 0.02, -0.3);
        }
        shell.position.copy(ejectPos);
        shell.position.add(this.basePosition);

        // Random ejection velocity
        const velocity = new THREE.Vector3(
            0.3 + Math.random() * 0.2,  // Right
            0.2 + Math.random() * 0.1,  // Up
            0.1 + Math.random() * 0.1   // Back
        );

        // Random spin
        const spin = new THREE.Vector3(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20
        );

        this.shellCasings.push({
            mesh: shell,
            velocity: velocity,
            spin: spin,
            lifetime: 0.5
        });

        this.weaponScene.add(shell);
    }

    /**
     * Create magic cast effect for Wizard
     */
    createMagicCastEffect() {
        if (!this.weaponContainer) return;

        // Flash the crystal
        const weapon = this.weaponContainer.userData.weapon;
        if (weapon && weapon.userData.crystal) {
            const crystal = weapon.userData.crystal;
            const originalIntensity = crystal.material.emissiveIntensity;
            crystal.material.emissiveIntensity = 2.0;
            setTimeout(() => {
                if (crystal.material) {
                    crystal.material.emissiveIntensity = originalIntensity;
                }
            }, 150);
        }

        // Create magic particles
        for (let i = 0; i < 8; i++) {
            const particleGeo = new THREE.SphereGeometry(0.008, 4, 4);
            const particleMat = new THREE.MeshBasicMaterial({
                color: 0x9966ff,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(particleGeo, particleMat);

            // Start at staff tip
            particle.position.set(
                this.basePosition.x + 0.05,
                this.basePosition.y + 0.1,
                this.basePosition.z - 0.2
            );

            const angle = (i / 8) * Math.PI * 2;
            const speed = 0.3 + Math.random() * 0.2;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * speed * 0.3,
                Math.sin(angle) * speed * 0.3,
                -speed
            );

            this.magicParticles.push({
                mesh: particle,
                velocity: velocity,
                lifetime: 0.3
            });

            this.weaponScene.add(particle);
        }
    }

    /**
     * Trigger bow release animation
     */
    triggerBowRelease() {
        this.isDrawing = false;
        this.drawAmount = 0;

        // Quick bow snap forward animation handled in recoil
    }

    /**
     * Start bow draw (for charged attack)
     */
    startBowDraw() {
        if (this.currentWeaponType === 'Archer') {
            this.isDrawing = true;
        }
    }

    /**
     * Trigger sword swing animation for Knight (enhanced)
     */
    triggerSwordSwing() {
        if (this.isSwinging) return;
        this.isSwinging = true;
        this.swingTimer = 0;
        this.swingPhase = 0;
        this.swordTrail = [];
    }

    /**
     * Update weapon view (call every frame)
     */
    update(delta, movementState) {
        if (!this.weaponContainer) return;

        const isMoving = movementState?.isMoving || false;
        const isCharging = movementState?.isCharging || false;

        // Update animations
        this.updateSway(delta);
        this.updateBobbing(delta, isMoving);
        this.updateRecoil(delta);
        this.updateSwordSwing(delta);
        this.updateBowDraw(delta, isCharging);
        this.updateMuzzleFlash(delta);
        this.updateShellCasings(delta);
        this.updateMagicParticles(delta);

        // Apply combined position
        this.applyTransforms();
    }

    /**
     * Update bow draw animation
     */
    updateBowDraw(delta, isCharging) {
        if (this.currentWeaponType !== 'Archer') return;

        if (isCharging && this.isDrawing) {
            this.drawAmount = Math.min(this.drawAmount + delta / this.maxDrawTime, 1.0);
        } else if (!isCharging) {
            this.isDrawing = false;
            this.drawAmount *= 0.8; // Quick release
        }
    }

    /**
     * Update muzzle flash
     */
    updateMuzzleFlash(delta) {
        if (this.muzzleFlash) {
            this.muzzleFlashTimer -= delta;

            // Fade out and scale down
            const progress = Math.max(0, this.muzzleFlashTimer / 0.05);
            this.muzzleFlash.traverse(child => {
                if (child.material) {
                    child.material.opacity = progress;
                }
            });
            this.muzzleFlash.scale.setScalar(0.5 + progress * 0.5);

            // Random rotation for flickering effect
            this.muzzleFlash.rotation.z = Math.random() * Math.PI;

            if (this.muzzleFlashTimer <= 0) {
                this.weaponScene.remove(this.muzzleFlash);
                this.muzzleFlash.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                this.muzzleFlash = null;
            }
        }
    }

    /**
     * Update shell casings physics
     */
    updateShellCasings(delta) {
        for (let i = this.shellCasings.length - 1; i >= 0; i--) {
            const shell = this.shellCasings[i];
            shell.lifetime -= delta;

            if (shell.lifetime <= 0) {
                this.weaponScene.remove(shell.mesh);
                shell.mesh.geometry.dispose();
                shell.mesh.material.dispose();
                this.shellCasings.splice(i, 1);
                continue;
            }

            // Apply gravity
            shell.velocity.y -= 2 * delta;

            // Update position
            shell.mesh.position.add(shell.velocity.clone().multiplyScalar(delta));

            // Apply spin
            shell.mesh.rotation.x += shell.spin.x * delta;
            shell.mesh.rotation.y += shell.spin.y * delta;
            shell.mesh.rotation.z += shell.spin.z * delta;

            // Fade out
            const alpha = shell.lifetime / 0.5;
            shell.mesh.material.opacity = alpha;
            shell.mesh.material.transparent = true;
        }
    }

    /**
     * Update magic particles
     */
    updateMagicParticles(delta) {
        for (let i = this.magicParticles.length - 1; i >= 0; i--) {
            const particle = this.magicParticles[i];
            particle.lifetime -= delta;

            if (particle.lifetime <= 0) {
                this.weaponScene.remove(particle.mesh);
                particle.mesh.geometry.dispose();
                particle.mesh.material.dispose();
                this.magicParticles.splice(i, 1);
                continue;
            }

            // Update position
            particle.mesh.position.add(particle.velocity.clone().multiplyScalar(delta));

            // Fade out and shrink
            const alpha = particle.lifetime / 0.3;
            particle.mesh.material.opacity = alpha;
            particle.mesh.scale.setScalar(alpha);
        }
    }

    /**
     * Enhanced sword swing animation for Knight
     * More dynamic with anticipation, fast slash, and follow-through
     */
    updateSwordSwing(delta) {
        if (!this.isSwinging) return;

        this.swingTimer += delta;
        const progress = Math.min(this.swingTimer / this.swingDuration, 1.0);

        // Enhanced swing phases: anticipation -> slash -> impact -> follow-through
        if (progress < 0.15) {
            // Anticipation: pull back and up (coiling energy)
            const windUp = progress / 0.15;
            const easeIn = Math.pow(windUp, 2); // Ease in
            this.swingOffset = {
                x: -0.15 * easeIn,     // Pull right
                y: 0.1 * easeIn,       // Lift up
                z: 0.08 * easeIn,      // Pull back
                rotX: -0.2 * easeIn,   // Tilt back
                rotY: 0.4 * easeIn,    // Rotate right
                rotZ: 0.3 * easeIn     // Tilt sword up
            };
        } else if (progress < 0.35) {
            // Fast slash: explosive swing left and down
            const slash = (progress - 0.15) / 0.2;
            const easeSlash = 1 - Math.pow(1 - slash, 4); // Strong ease out
            this.swingOffset = {
                x: -0.15 + 0.5 * easeSlash,      // Swing far left
                y: 0.1 - 0.2 * easeSlash,        // Drop down
                z: 0.08 - 0.25 * easeSlash,      // Push forward
                rotX: -0.2 + 0.4 * easeSlash,    // Rotate forward
                rotY: 0.4 - 1.2 * easeSlash,     // Full rotation left
                rotZ: 0.3 - 0.8 * easeSlash      // Tilt sword down
            };
        } else if (progress < 0.5) {
            // Impact: slight pause/shake at the end of swing
            const impact = (progress - 0.35) / 0.15;
            const shake = Math.sin(impact * Math.PI * 4) * (1 - impact) * 0.02;
            this.swingOffset = {
                x: 0.35 + shake,
                y: -0.1 + shake,
                z: -0.17,
                rotX: 0.2,
                rotY: -0.8,
                rotZ: -0.5
            };
        } else {
            // Follow through and return to idle
            const returnProgress = (progress - 0.5) / 0.5;
            const easeReturn = 1 - Math.pow(1 - returnProgress, 3);
            this.swingOffset = {
                x: 0.35 * (1 - easeReturn),
                y: -0.1 * (1 - easeReturn),
                z: -0.17 * (1 - easeReturn),
                rotX: 0.2 * (1 - easeReturn),
                rotY: -0.8 * (1 - easeReturn),
                rotZ: -0.5 * (1 - easeReturn)
            };
        }

        // End swing
        if (progress >= 1.0) {
            this.isSwinging = false;
            this.swingOffset = { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0 };
        }
    }

    /**
     * Idle sway animation (breathing effect)
     */
    updateSway(delta) {
        this.swayTime += delta * 1.5;

        // Subtle figure-8 motion
        this.swayOffset = {
            x: Math.sin(this.swayTime) * this.swayAmount,
            y: Math.sin(this.swayTime * 2) * this.swayAmount * 0.5
        };
    }

    /**
     * Movement bobbing animation
     */
    updateBobbing(delta, isMoving) {
        if (isMoving) {
            this.bobPhase += delta * this.bobSpeed;

            this.bobOffset = {
                x: Math.cos(this.bobPhase * 0.5) * this.bobAmplitude.x,
                y: Math.abs(Math.sin(this.bobPhase)) * this.bobAmplitude.y
            };
        } else {
            // Smoothly return to center when stopped
            this.bobPhase = 0;
            this.bobOffset = this.bobOffset || { x: 0, y: 0 };
            this.bobOffset.x *= 0.9;
            this.bobOffset.y *= 0.9;
        }
    }

    /**
     * Enhanced multi-phase recoil animation
     * Phases: kickback (fast up) -> return (slower down) -> settle (slight overshoot)
     */
    updateRecoil(delta) {
        if (this.recoilPhase === 'idle') return;

        const config = this.recoilConfig[this.currentWeaponType] || this.recoilConfig['MachineGun'];
        this.recoilTimer += delta;

        switch (this.recoilPhase) {
            case 'kickback':
                // Fast kick up
                this.recoilAmount += this.recoilVelocity * delta;
                if (this.recoilAmount >= 1.0) {
                    this.recoilAmount = 1.0;
                    this.recoilPhase = 'return';
                    this.recoilTimer = 0;
                }
                break;

            case 'return':
                // Slower return with easing
                const returnProgress = Math.min(this.recoilTimer / config.returnTime, 1.0);
                const easeReturn = 1 - Math.pow(1 - returnProgress, 3); // Ease out cubic
                this.recoilAmount = 1.0 - easeReturn * 1.1; // Overshoot slightly

                if (returnProgress >= 1.0) {
                    this.recoilPhase = 'settle';
                    this.recoilTimer = 0;
                }
                break;

            case 'settle':
                // Settle back to zero with slight bounce
                const settleProgress = Math.min(this.recoilTimer / config.settleTime, 1.0);
                const bounce = Math.sin(settleProgress * Math.PI) * 0.1;
                this.recoilAmount = -0.1 * (1 - settleProgress) + bounce * (1 - settleProgress);

                if (settleProgress >= 1.0) {
                    this.recoilAmount = 0;
                    this.recoilPhase = 'idle';
                }
                break;
        }
    }

    /**
     * Apply all transforms to weapon container
     */
    applyTransforms() {
        if (!this.weaponContainer) return;

        const config = this.recoilConfig[this.currentWeaponType] || this.recoilConfig['MachineGun'];

        // Calculate recoil offsets (enhanced with horizontal kick for variety)
        const recoilRotX = -this.recoilAmount * config.rotation;
        const recoilRotZ = this.recoilAmount * config.rotation * 0.1; // Slight tilt
        const recoilPosZ = this.recoilAmount * config.kickback;
        const recoilPosY = this.recoilAmount * config.kickback * 0.4;
        const recoilPosX = this.recoilAmount * config.kickback * 0.1; // Slight horizontal kick

        // Calculate swing offsets (Knight only)
        const swingX = this.swingOffset?.x || 0;
        const swingY = this.swingOffset?.y || 0;
        const swingZ = this.swingOffset?.z || 0;
        const swingRotX = this.swingOffset?.rotX || 0;
        const swingRotY = this.swingOffset?.rotY || 0;
        const swingRotZ = this.swingOffset?.rotZ || 0;

        // Bow draw offset (Archer)
        let drawOffsetX = 0;
        let drawOffsetY = 0;
        let drawRotZ = 0;
        if (this.currentWeaponType === 'Archer' && this.drawAmount > 0) {
            // Pull bow back as drawing
            drawOffsetX = -0.05 * this.drawAmount;
            drawOffsetY = 0.02 * this.drawAmount;
            drawRotZ = -0.1 * this.drawAmount;
        }

        // Combine all offsets
        const finalX = this.basePosition.x +
            (this.swayOffset?.x || 0) +
            (this.bobOffset?.x || 0) +
            swingX +
            drawOffsetX +
            recoilPosX;

        const finalY = this.basePosition.y +
            (this.swayOffset?.y || 0) +
            (this.bobOffset?.y || 0) +
            recoilPosY +
            swingY +
            drawOffsetY;

        const finalZ = this.basePosition.z + recoilPosZ + swingZ;

        // Apply position
        this.weaponContainer.position.set(finalX, finalY, finalZ);

        // Apply rotation (recoil kicks weapon up, swing rotates)
        this.weaponContainer.rotation.set(
            this.baseRotation.x + recoilRotX + swingRotX,
            this.baseRotation.y + swingRotY,
            this.baseRotation.z + swingRotZ + recoilRotZ + drawRotZ
        );
    }

    /**
     * Render the weapon scene (call after main scene render)
     */
    render() {
        if (!this.weaponContainer) return;

        // Save current state
        const autoClear = this.renderer.autoClear;

        // Render weapon on top (clear depth only)
        this.renderer.autoClear = false;
        this.renderer.clearDepth();
        this.renderer.render(this.weaponScene, this.weaponCamera);

        // Restore state
        this.renderer.autoClear = autoClear;
    }

    /**
     * Handle window resize
     */
    onResize() {
        this.weaponCamera.aspect = window.innerWidth / window.innerHeight;
        this.weaponCamera.updateProjectionMatrix();
    }

    /**
     * Clean up resources
     */
    dispose() {
        if (this.weaponContainer) {
            this.weaponScene.remove(this.weaponContainer);
            // Dispose geometries and materials
            this.weaponContainer.traverse((child) => {
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
    }
}
