import * as THREE from 'three';
import { ProceduralWeapons } from '../models/ProceduralWeapons';

/**
 * First Person Weapon View System
 * Renders weapon and hands in front of the camera (Call of Duty style)
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

        // Recoil state
        this.recoilAmount = 0;
        this.recoilRecovery = 8;
        this.isRecoiling = false;

        // Recoil configuration per weapon type
        this.recoilConfig = {
            'Knight': { rotation: 0.2, kickback: 0.04, recovery: 12 },
            'Sniper': { rotation: 0.25, kickback: 0.1, recovery: 4 },
            'MachineGun': { rotation: 0.06, kickback: 0.02, recovery: 18 },
            'Archer': { rotation: 0.12, kickback: 0.05, recovery: 8 },
            'Wizard': { rotation: 0.1, kickback: 0.02, recovery: 10 }
        };

        // Sway (subtle idle movement)
        this.swayTime = 0;
        this.swayAmount = 0.003;

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
     * Trigger recoil animation
     */
    triggerRecoil(characterType) {
        const config = this.recoilConfig[characterType] || this.recoilConfig['Knight'];
        this.recoilAmount = 1.0;
        this.recoilRecovery = config.recovery;
        this.isRecoiling = true;

        // Flash effect for Wizard's crystal
        if (characterType === 'Wizard' && this.weaponContainer) {
            const weapon = this.weaponContainer.userData.weapon;
            if (weapon && weapon.userData.crystal) {
                const crystal = weapon.userData.crystal;
                const originalIntensity = crystal.material.emissiveIntensity;
                crystal.material.emissiveIntensity = 1.5;
                setTimeout(() => {
                    crystal.material.emissiveIntensity = originalIntensity;
                }, 100);
            }
        }
    }

    /**
     * Update weapon view (call every frame)
     */
    update(delta, movementState) {
        if (!this.weaponContainer) return;

        const isMoving = movementState?.isMoving || false;

        // Update animations
        this.updateSway(delta);
        this.updateBobbing(delta, isMoving);
        this.updateRecoil(delta);

        // Apply combined position
        this.applyTransforms();
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
     * Recoil animation
     */
    updateRecoil(delta) {
        if (this.recoilAmount > 0) {
            // Decay recoil
            this.recoilAmount -= delta * this.recoilRecovery;
            if (this.recoilAmount < 0) {
                this.recoilAmount = 0;
                this.isRecoiling = false;
            }
        }
    }

    /**
     * Apply all transforms to weapon container
     */
    applyTransforms() {
        if (!this.weaponContainer) return;

        const config = this.recoilConfig[this.currentWeaponType] || this.recoilConfig['Knight'];

        // Calculate recoil offsets
        const recoilRotX = -this.recoilAmount * config.rotation;
        const recoilPosZ = this.recoilAmount * config.kickback;
        const recoilPosY = this.recoilAmount * config.kickback * 0.3;

        // Combine all offsets
        const finalX = this.basePosition.x +
            (this.swayOffset?.x || 0) +
            (this.bobOffset?.x || 0);

        const finalY = this.basePosition.y +
            (this.swayOffset?.y || 0) +
            (this.bobOffset?.y || 0) +
            recoilPosY;

        const finalZ = this.basePosition.z + recoilPosZ;

        // Apply position
        this.weaponContainer.position.set(finalX, finalY, finalZ);

        // Apply rotation (recoil kicks weapon up)
        this.weaponContainer.rotation.set(
            this.baseRotation.x + recoilRotX,
            this.baseRotation.y,
            this.baseRotation.z
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
