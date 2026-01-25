import * as THREE from 'three';

/**
 * Power-up types and their effects
 */
export const POWERUP_TYPES = {
    HEALTH: {
        name: 'Health Pack',
        color: 0x00ff00,
        glowColor: 0x33ff33,
        effect: (player) => {
            const healAmount = 50;
            player.hp = Math.min(player.hp + healAmount, player.maxHp || 100);
            return `+${healAmount} HP`;
        },
        duration: 0, // Instant
        dropChance: 0.15
    },
    SPEED: {
        name: 'Speed Boost',
        color: 0x00ffff,
        glowColor: 0x33ffff,
        effect: (player, controller) => {
            const originalSpeed = controller.baseSpeed;
            controller.setSpeed(originalSpeed * 1.5);

            // Speed visual indicator
            let speedOverlay = document.getElementById('speed-overlay');
            if (!speedOverlay) {
                speedOverlay = document.createElement('div');
                speedOverlay.id = 'speed-overlay';
                speedOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 40;
                    border: 3px solid rgba(0, 255, 255, 0.5);
                    box-shadow: inset 0 0 20px rgba(0, 255, 255, 0.2);
                    border-radius: 10px;
                    box-sizing: border-box;
                `;
                document.body.appendChild(speedOverlay);
            }
            speedOverlay.style.display = 'block';

            return 'Speed +50%';
        },
        onExpire: (player, controller) => {
            controller.setSpeed(controller.baseSpeed);
            const speedOverlay = document.getElementById('speed-overlay');
            if (speedOverlay) speedOverlay.style.display = 'none';
        },
        duration: 10000, // 10 seconds
        dropChance: 0.05
    },
    DAMAGE: {
        name: 'Damage Boost',
        color: 0xff0000,
        glowColor: 0xff3333,
        effect: (player) => {
            player.damageMultiplier = 2.0;

            // Damage visual indicator
            let damageOverlay = document.getElementById('damage-overlay');
            if (!damageOverlay) {
                damageOverlay = document.createElement('div');
                damageOverlay.id = 'damage-overlay';
                damageOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 40;
                    border: 3px solid rgba(255, 50, 50, 0.5);
                    box-shadow: inset 0 0 20px rgba(255, 50, 50, 0.2);
                    border-radius: 10px;
                    box-sizing: border-box;
                `;
                document.body.appendChild(damageOverlay);
            }
            damageOverlay.style.display = 'block';

            return 'Damage x2';
        },
        onExpire: (player) => {
            player.damageMultiplier = 1.0;
            const damageOverlay = document.getElementById('damage-overlay');
            if (damageOverlay) damageOverlay.style.display = 'none';
        },
        duration: 10000, // 10 seconds
        dropChance: 0.05
    },
    SHIELD: {
        name: 'Shield',
        color: 0x0066ff,
        glowColor: 0x3399ff,
        effect: (player) => {
            player.shieldActive = true;
            player.damageReduction = 0.5;

            // Create subtle shield visual (border glow, not full screen)
            let shieldOverlay = document.getElementById('shield-overlay');
            if (!shieldOverlay) {
                shieldOverlay = document.createElement('div');
                shieldOverlay.id = 'shield-overlay';
                shieldOverlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: 40;
                    border: 4px solid rgba(0, 150, 255, 0.6);
                    box-shadow: inset 0 0 30px rgba(0, 150, 255, 0.3);
                    border-radius: 10px;
                    box-sizing: border-box;
                `;
                document.body.appendChild(shieldOverlay);
            }
            shieldOverlay.style.display = 'block';

            return 'Shield Active - 50% Damage Reduction';
        },
        onExpire: (player) => {
            player.shieldActive = false;
            player.damageReduction = 0;

            // Remove shield visual
            const shieldOverlay = document.getElementById('shield-overlay');
            if (shieldOverlay) {
                shieldOverlay.style.display = 'none';
            }
        },
        duration: 8000, // 8 seconds
        dropChance: 0.03
    },
    NUKE: {
        name: 'Nuke',
        color: 0xffff00,
        glowColor: 0xffff66,
        effect: (player, controller, zombies, scene, audioManager) => {
            // Kill all zombies on screen
            let killCount = 0;
            zombies.forEach(zombie => {
                if (!zombie.isDead) {
                    zombie.takeDamage(9999);
                    killCount++;
                }
            });
            if (audioManager) {
                audioManager.playExplosion();
            }
            return `Nuke! ${killCount} kills`;
        },
        duration: 0, // Instant
        dropChance: 0.005
    }
};

/**
 * PowerUp Entity - Collectible item in the game world
 */
export class PowerUp {
    constructor(scene, x, z, type = 'HEALTH') {
        this.scene = scene;
        this.type = type;
        this.config = POWERUP_TYPES[type];
        this.isCollected = false;
        this.lifetime = 15000; // Despawn after 15 seconds
        this.spawnTime = Date.now();

        this.mesh = this.createMesh();
        this.mesh.position.set(x, 0.5, z);
        scene.add(this.mesh);

        // Animation state
        this.rotationSpeed = 2;
        this.bobSpeed = 3;
        this.bobAmount = 0.2;
        this.baseY = 0.5;
    }

    createMesh() {
        const group = new THREE.Group();

        // Main icon shape based on type
        let iconGeo;
        switch (this.type) {
            case 'HEALTH':
                // Cross shape
                iconGeo = this.createCrossGeometry();
                break;
            case 'SPEED':
                // Lightning bolt (simplified as cone)
                iconGeo = new THREE.ConeGeometry(0.2, 0.5, 4);
                break;
            case 'DAMAGE':
                // Sword (simplified as box)
                iconGeo = new THREE.BoxGeometry(0.1, 0.5, 0.1);
                break;
            case 'SHIELD':
                // Shield shape (sphere segment)
                iconGeo = new THREE.SphereGeometry(0.25, 8, 8, 0, Math.PI);
                break;
            case 'NUKE':
                // Radiation symbol (sphere)
                iconGeo = new THREE.IcosahedronGeometry(0.25, 0);
                break;
            default:
                iconGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        }

        const iconMat = new THREE.MeshStandardMaterial({
            color: this.config.color,
            emissive: this.config.glowColor,
            emissiveIntensity: 0.8,
            metalness: 0.5,
            roughness: 0.3
        });

        const icon = new THREE.Mesh(iconGeo, iconMat);
        group.add(icon);

        // Glow effect (no PointLight for performance)
        const glowGeo = new THREE.SphereGeometry(0.4, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: this.config.glowColor,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        group.add(glow);

        // Store references (no PointLight for performance)
        group.userData = {
            icon,
            glow,
            powerUp: this
        };

        return group;
    }

    createCrossGeometry() {
        // Create a plus/cross shape
        const group = new THREE.Group();

        const vertGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
        const horizGeo = new THREE.BoxGeometry(0.4, 0.1, 0.1);

        const mat = new THREE.MeshStandardMaterial({
            color: this.config.color,
            emissive: this.config.glowColor,
            emissiveIntensity: 0.8
        });

        const vert = new THREE.Mesh(vertGeo, mat);
        const horiz = new THREE.Mesh(horizGeo, mat);

        group.add(vert, horiz);

        // Return as BufferGeometry by merging
        return new THREE.BoxGeometry(0.3, 0.3, 0.1); // Simplified
    }

    update(delta, playerPosition) {
        if (this.isCollected) return;

        const time = Date.now() / 1000;

        // Rotate
        this.mesh.rotation.y += this.rotationSpeed * delta;

        // Bob up and down
        this.mesh.position.y = this.baseY + Math.sin(time * this.bobSpeed) * this.bobAmount;

        // Pulse glow
        const glow = this.mesh.userData.glow;
        if (glow) {
            const pulse = 0.3 + Math.sin(time * 4) * 0.1;
            glow.material.opacity = pulse;
            const scale = 1 + Math.sin(time * 3) * 0.1;
            glow.scale.setScalar(scale);
        }

        // Check for despawn
        if (Date.now() - this.spawnTime > this.lifetime) {
            this.remove();
            return true; // Signal removal
        }

        // Check for collection (player proximity) - use horizontal distance only
        const dx = this.mesh.position.x - playerPosition.x;
        const dz = this.mesh.position.z - playerPosition.z;
        const horizontalDistance = Math.sqrt(dx * dx + dz * dz);
        if (horizontalDistance < 2.0) {
            return 'collect';
        }

        return false;
    }

    collect(player, controller, zombies, scene, audioManager) {
        if (this.isCollected) return null;
        this.isCollected = true;

        // Apply effect
        const message = this.config.effect(player, controller, zombies, scene, audioManager);

        // Set up expiration if duration > 0
        if (this.config.duration > 0 && this.config.onExpire) {
            setTimeout(() => {
                this.config.onExpire(player, controller);
            }, this.config.duration);
        }

        // Remove from scene
        this.remove();

        return {
            message,
            type: this.type,
            duration: this.config.duration
        };
    }

    remove() {
        this.isCollected = true;
        this.scene.remove(this.mesh);

        // Dispose
        this.mesh.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
    }

    /**
     * Determine if a power-up should drop (called when zombie dies)
     */
    static shouldDrop(zombieType = 'walker') {
        // Higher drop chance for special zombies
        let multiplier = 1;
        if (zombieType === 'boss') multiplier = 5;
        else if (zombieType === 'tank') multiplier = 2;

        return Math.random() < 0.15 * multiplier;
    }

    /**
     * Get random power-up type based on drop chances
     */
    static getRandomType() {
        const roll = Math.random();
        let cumulative = 0;

        for (const [type, config] of Object.entries(POWERUP_TYPES)) {
            cumulative += config.dropChance;
            if (roll < cumulative) {
                return type;
            }
        }

        return 'HEALTH'; // Default
    }
}
