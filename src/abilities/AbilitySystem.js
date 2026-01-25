import * as THREE from 'three';

/**
 * Ability System - Handles charged attacks and ultimate abilities
 * Like Overwatch, each character has unique abilities
 */

// Ultimate charge required (hits to charge)
const ULTIMATE_CHARGE_REQUIRED = 10;

// Charged attack settings
const CHARGE_TIME_MAX = 2.0; // seconds to full charge
const CHARGE_TIME_MIN = 0.3; // minimum charge time for effect

/**
 * Class-specific ability configurations
 */
export const ABILITY_CONFIG = {
    Wizard: {
        name: 'Wizard',
        // Charged Attack: Meteor - larger fireball that explodes
        chargedAttack: {
            name: 'Meteor',
            description: 'Charge a devastating meteor that explodes on impact',
            baseDamage: 25,
            maxDamageMultiplier: 4,
            projectileSpeed: 15,
            explosionRadius: 8,
            color: 0xff6600,
            chargeColor: 0xff3300
        },
        // Ultimate: Arcane Storm - rain of magic missiles
        ultimate: {
            name: 'Arcane Storm',
            description: 'Rain devastating magic from the sky',
            duration: 5,
            damagePerHit: 30,
            hitsPerSecond: 8,
            radius: 15,
            color: 0x9933ff
        }
    },
    Archer: {
        name: 'Archer',
        // Charged Attack: Piercing Arrow - goes through multiple enemies
        chargedAttack: {
            name: 'Piercing Arrow',
            description: 'Charge an arrow that pierces through enemies',
            baseDamage: 20,
            maxDamageMultiplier: 3,
            projectileSpeed: 40,
            maxPierceCount: 5,
            color: 0x00ff88,
            chargeColor: 0x00ffcc
        },
        // Ultimate: Arrow Rain - volley of arrows
        ultimate: {
            name: 'Arrow Rain',
            description: 'Call down a rain of arrows',
            duration: 3,
            arrowsPerSecond: 20,
            damagePerArrow: 15,
            radius: 12,
            color: 0x88ff00
        }
    },
    Sniper: {
        name: 'Sniper',
        // Charged Attack: Railgun - instant hit, penetrates
        chargedAttack: {
            name: 'Railgun',
            description: 'Charge a devastating railgun shot',
            baseDamage: 50,
            maxDamageMultiplier: 3,
            penetrateCount: 3,
            color: 0x00ffff,
            chargeColor: 0x0088ff
        },
        // Ultimate: Dead Eye - auto-target all visible enemies
        ultimate: {
            name: 'Dead Eye',
            description: 'Lock on and eliminate all visible targets',
            lockOnTime: 0.5,
            damagePerTarget: 100,
            maxTargets: 10,
            color: 0xff0000
        }
    },
    MachineGun: {
        name: 'MachineGun',
        // Charged Attack: Grenade - explosive projectile
        chargedAttack: {
            name: 'Grenade',
            description: 'Launch an explosive grenade',
            baseDamage: 15,
            maxDamageMultiplier: 3,
            projectileSpeed: 20,
            explosionRadius: 6,
            color: 0xffaa00,
            chargeColor: 0xff5500
        },
        // Ultimate: Bullet Storm - 360 spray
        ultimate: {
            name: 'Bullet Storm',
            description: 'Unleash a devastating 360-degree barrage',
            duration: 4,
            bulletsPerSecond: 30,
            damagePerBullet: 10,
            color: 0xffff00
        }
    },
    Knight: {
        name: 'Knight',
        // Charged Attack: Heavy Slam - AOE ground pound
        chargedAttack: {
            name: 'Heavy Slam',
            description: 'Charge a devastating ground slam',
            baseDamage: 15,
            maxDamageMultiplier: 5,
            radius: 5,
            knockbackForce: 10,
            color: 0xff8800,
            chargeColor: 0xff4400
        },
        // Ultimate: Berserker Rage - invincibility + damage boost
        ultimate: {
            name: 'Berserker Rage',
            description: 'Enter a rage state with invincibility and enhanced damage',
            duration: 6,
            damageMultiplier: 3,
            invincible: true,
            attackSpeedMultiplier: 2,
            color: 0xff0000
        }
    }
};

/**
 * AbilitySystem - Manages player abilities
 */
export class AbilitySystem {
    constructor(scene, camera, characterType) {
        this.scene = scene;
        this.camera = camera;
        this.characterType = characterType;
        this.config = ABILITY_CONFIG[characterType];

        // Charge state
        this.isCharging = false;
        this.chargeTime = 0;
        this.chargeProgress = 0; // 0 to 1

        // Ultimate state
        this.ultimateCharge = 0;
        this.ultimateReady = false;
        this.ultimateActive = false;
        this.ultimateTimer = 0;

        // Active effects
        this.activeEffects = [];
        this.projectiles = [];

        // Visual elements
        this.chargeIndicator = null;
        this.ultimateEffects = null;

        // Audio reference (set later)
        this.audioManager = null;

        this.setupChargeUI();
    }

    setAudioManager(audioManager) {
        this.audioManager = audioManager;
    }

    /**
     * Setup charge indicator UI
     */
    setupChargeUI() {
        // Create charge bar container
        this.chargeBarContainer = document.createElement('div');
        this.chargeBarContainer.style.cssText = `
            position: fixed;
            bottom: 150px;
            left: 50%;
            transform: translateX(-50%);
            width: 200px;
            height: 8px;
            background: rgba(0, 0, 0, 0.7);
            border: 2px solid rgba(255, 255, 255, 0.5);
            border-radius: 4px;
            display: none;
            z-index: 100;
        `;

        this.chargeBar = document.createElement('div');
        this.chargeBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #ffaa00, #ff4400);
            border-radius: 2px;
            transition: width 0.05s linear;
        `;
        this.chargeBarContainer.appendChild(this.chargeBar);

        // Charge text
        this.chargeText = document.createElement('div');
        this.chargeText.style.cssText = `
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            color: #fff;
            font-family: 'Arial', sans-serif;
            font-size: 14px;
            font-weight: bold;
            text-shadow: 0 0 5px #000;
        `;
        this.chargeBarContainer.appendChild(this.chargeText);

        document.body.appendChild(this.chargeBarContainer);

        // Ultimate indicator
        this.ultimateIndicator = document.createElement('div');
        this.ultimateIndicator.style.cssText = `
            position: fixed;
            bottom: 180px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #ffaa00;
            border-radius: 8px;
            color: #fff;
            font-family: 'Arial', sans-serif;
            font-size: 16px;
            font-weight: bold;
            display: none;
            z-index: 100;
            text-align: center;
        `;
        document.body.appendChild(this.ultimateIndicator);
    }

    /**
     * Add ultimate charge on hit
     */
    addUltimateCharge(amount = 1) {
        if (this.ultimateActive) return;

        this.ultimateCharge = Math.min(this.ultimateCharge + amount, ULTIMATE_CHARGE_REQUIRED);

        if (this.ultimateCharge >= ULTIMATE_CHARGE_REQUIRED && !this.ultimateReady) {
            this.ultimateReady = true;
            this.showUltimateReady();
        }

        this.updateUltimateUI();
    }

    /**
     * Show ultimate ready notification
     */
    showUltimateReady() {
        this.ultimateIndicator.innerHTML = `
            <div style="color: #ffaa00; font-size: 20px;">⚡ ${this.config.ultimate.name} READY ⚡</div>
            <div style="font-size: 12px; color: #aaa;">Press RIGHT CLICK to activate</div>
        `;
        this.ultimateIndicator.style.display = 'block';
        this.ultimateIndicator.style.animation = 'pulse 1s infinite';

        // Add pulse animation
        if (!document.querySelector('#ability-animations')) {
            const style = document.createElement('style');
            style.id = 'ability-animations';
            style.textContent = `
                @keyframes pulse {
                    0%, 100% { transform: translateX(-50%) scale(1); border-color: #ffaa00; }
                    50% { transform: translateX(-50%) scale(1.05); border-color: #ff6600; }
                }
                @keyframes ultimateFlash {
                    0% { opacity: 0; }
                    50% { opacity: 0.8; }
                    100% { opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Update ultimate UI
     */
    updateUltimateUI() {
        if (!this.ultimateReady && !this.ultimateActive) {
            const progress = (this.ultimateCharge / ULTIMATE_CHARGE_REQUIRED) * 100;
            this.ultimateIndicator.innerHTML = `
                <div style="color: #888; font-size: 14px;">Ultimate: ${Math.floor(progress)}%</div>
                <div style="width: 100px; height: 4px; background: #333; margin-top: 5px; border-radius: 2px;">
                    <div style="width: ${progress}%; height: 100%; background: linear-gradient(90deg, #666, #ffaa00); border-radius: 2px;"></div>
                </div>
            `;
            this.ultimateIndicator.style.display = 'block';
            this.ultimateIndicator.style.animation = 'none';
        }
    }

    /**
     * Start charging attack
     */
    startCharge() {
        if (this.ultimateActive) return;

        this.isCharging = true;
        this.chargeTime = 0;
        this.chargeBarContainer.style.display = 'block';
        this.chargeText.textContent = this.config.chargedAttack.name;

        // Create charge visual effect at crosshair
        this.createChargeEffect();
    }

    /**
     * Update charge progress
     */
    updateCharge(delta) {
        if (!this.isCharging) return;

        this.chargeTime = Math.min(this.chargeTime + delta, CHARGE_TIME_MAX);
        this.chargeProgress = this.chargeTime / CHARGE_TIME_MAX;

        // Update UI
        this.chargeBar.style.width = `${this.chargeProgress * 100}%`;

        // Update color based on charge level
        if (this.chargeProgress >= 1) {
            this.chargeBar.style.background = 'linear-gradient(90deg, #ff0000, #ff6600)';
            this.chargeText.textContent = `${this.config.chargedAttack.name} - MAX!`;
            this.chargeText.style.color = '#ff4400';
        } else if (this.chargeProgress >= 0.5) {
            this.chargeBar.style.background = 'linear-gradient(90deg, #ffaa00, #ff4400)';
            this.chargeText.style.color = '#ffaa00';
        }

        // Update charge visual effect
        this.updateChargeEffect();
    }

    /**
     * Release charged attack
     */
    releaseCharge() {
        if (!this.isCharging) return null;

        const chargeLevel = this.chargeProgress;
        this.isCharging = false;
        this.chargeTime = 0;
        this.chargeProgress = 0;

        // Hide UI
        this.chargeBarContainer.style.display = 'none';
        this.chargeBar.style.width = '0%';
        this.chargeBar.style.background = 'linear-gradient(90deg, #ffaa00, #ff4400)';
        this.chargeText.style.color = '#fff';

        // Remove charge effect
        this.removeChargeEffect();

        // Only fire if charged enough
        if (chargeLevel < CHARGE_TIME_MIN / CHARGE_TIME_MAX) {
            return null;
        }

        return this.executeChargedAttack(chargeLevel);
    }

    /**
     * Cancel charge
     */
    cancelCharge() {
        this.isCharging = false;
        this.chargeTime = 0;
        this.chargeProgress = 0;
        this.chargeBarContainer.style.display = 'none';
        this.removeChargeEffect();
    }

    /**
     * Execute charged attack based on character type
     */
    executeChargedAttack(chargeLevel) {
        const config = this.config.chargedAttack;
        const damage = config.baseDamage * (1 + (config.maxDamageMultiplier - 1) * chargeLevel);

        switch (this.characterType) {
            case 'Wizard':
                return this.createMeteorProjectile(damage, chargeLevel);
            case 'Archer':
                return this.createPiercingArrow(damage, chargeLevel);
            case 'Sniper':
                return this.createRailgunShot(damage, chargeLevel);
            case 'MachineGun':
                return this.createGrenadeProjectile(damage, chargeLevel);
            case 'Knight':
                return this.createHeavySlam(damage, chargeLevel);
            default:
                return null;
        }
    }

    /**
     * Activate ultimate ability
     */
    activateUltimate() {
        if (!this.ultimateReady || this.ultimateActive) return false;

        this.ultimateReady = false;
        this.ultimateActive = true;
        this.ultimateCharge = 0;
        this.ultimateTimer = this.config.ultimate.duration || 0;

        // Show activation effect
        this.showUltimateActivation();

        // Execute ultimate based on character type
        switch (this.characterType) {
            case 'Wizard':
                this.startArcaneStorm();
                break;
            case 'Archer':
                this.startArrowRain();
                break;
            case 'Sniper':
                this.startDeadEye();
                break;
            case 'MachineGun':
                this.startBulletStorm();
                break;
            case 'Knight':
                this.startBerserkerRage();
                break;
        }

        return true;
    }

    /**
     * Show ultimate activation effect
     */
    showUltimateActivation() {
        // Full screen flash
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(255,170,0,0.8) 0%, rgba(255,100,0,0) 70%);
            pointer-events: none;
            z-index: 200;
            animation: ultimateFlash 0.5s ease-out forwards;
        `;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 500);

        // Update indicator
        this.ultimateIndicator.innerHTML = `
            <div style="color: #ff4400; font-size: 24px;">⚡ ${this.config.ultimate.name} ⚡</div>
            <div style="font-size: 14px; color: #fff;">ACTIVE</div>
        `;
        this.ultimateIndicator.style.borderColor = '#ff0000';
    }

    /**
     * Update ability system
     */
    update(delta, playerPosition, zombies) {
        // Update charge
        this.updateCharge(delta);

        // Update ultimate
        if (this.ultimateActive) {
            this.ultimateTimer -= delta;
            this.updateUltimateEffect(delta, playerPosition, zombies);

            if (this.ultimateTimer <= 0) {
                this.endUltimate();
            }
        }

        // Update projectiles
        this.updateProjectiles(delta, zombies);

        // Update active effects
        this.updateEffects(delta);
    }

    /**
     * Update ultimate effect
     */
    updateUltimateEffect(delta, playerPosition, zombies) {
        switch (this.characterType) {
            case 'Wizard':
                this.updateArcaneStorm(delta, playerPosition, zombies);
                break;
            case 'Archer':
                this.updateArrowRain(delta, playerPosition, zombies);
                break;
            case 'Sniper':
                this.updateDeadEye(delta, zombies);
                break;
            case 'MachineGun':
                this.updateBulletStorm(delta, playerPosition, zombies);
                break;
            case 'Knight':
                // Berserker rage just modifies player stats
                break;
        }
    }

    /**
     * End ultimate
     */
    endUltimate() {
        this.ultimateActive = false;
        this.ultimateTimer = 0;

        // Clean up ultimate effects
        this.cleanupUltimateEffects();

        // Reset UI
        this.ultimateIndicator.style.borderColor = '#ffaa00';
        this.updateUltimateUI();
    }

    // ============================================
    // CHARGE EFFECTS
    // ============================================

    createChargeEffect() {
        // Create glowing orb at gun/hand position
        const config = this.config.chargedAttack;
        const geo = new THREE.SphereGeometry(0.1, 16, 16);
        const mat = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.8
        });
        this.chargeOrb = new THREE.Mesh(geo, mat);
        this.chargeOrb.position.set(0.3, -0.2, -0.5);
        this.camera.add(this.chargeOrb);

        // Particle effect
        this.chargeParticles = [];
    }

    updateChargeEffect() {
        if (!this.chargeOrb) return;

        const scale = 0.1 + this.chargeProgress * 0.4;
        this.chargeOrb.scale.setScalar(scale);

        // Pulsing
        const pulse = 1 + Math.sin(Date.now() / 100) * 0.1 * this.chargeProgress;
        this.chargeOrb.scale.multiplyScalar(pulse);

        // Color intensity
        const config = this.config.chargedAttack;
        const intensity = 0.5 + this.chargeProgress * 0.5;
        this.chargeOrb.material.opacity = intensity;

        // Lerp color to charge color
        const baseColor = new THREE.Color(config.color);
        const chargeColor = new THREE.Color(config.chargeColor);
        this.chargeOrb.material.color.lerpColors(baseColor, chargeColor, this.chargeProgress);
    }

    removeChargeEffect() {
        if (this.chargeOrb) {
            this.camera.remove(this.chargeOrb);
            this.chargeOrb.geometry.dispose();
            this.chargeOrb.material.dispose();
            this.chargeOrb = null;
        }
    }

    // ============================================
    // WIZARD ABILITIES
    // ============================================

    createMeteorProjectile(damage, chargeLevel) {
        const config = this.config.chargedAttack;
        const size = 0.3 + chargeLevel * 0.5;

        // Create meteor mesh
        const geo = new THREE.SphereGeometry(size, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
            color: config.color,
            emissive: config.chargeColor,
            emissiveIntensity: 1.5
        });
        const meteor = new THREE.Mesh(geo, mat);

        // Position at camera
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        meteor.position.copy(this.camera.position).add(direction.multiplyScalar(1));

        // Trail effect
        const trailGeo = new THREE.SphereGeometry(size * 1.5, 8, 8);
        const trailMat = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.3
        });
        const trail = new THREE.Mesh(trailGeo, trailMat);
        meteor.add(trail);

        this.scene.add(meteor);

        const projectile = {
            mesh: meteor,
            velocity: new THREE.Vector3().copy(this.camera.getWorldDirection(new THREE.Vector3())).multiplyScalar(config.projectileSpeed),
            damage: damage,
            explosionRadius: config.explosionRadius * chargeLevel,
            type: 'meteor',
            chargeLevel: chargeLevel,
            lifetime: 5
        };

        this.projectiles.push(projectile);

        return { type: 'chargedAttack', damage, chargeLevel };
    }

    startArcaneStorm() {
        this.stormTimer = 0;
        this.stormHitTimer = 0;

        // Create storm cloud effect
        const cloudGeo = new THREE.SphereGeometry(this.config.ultimate.radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const cloudMat = new THREE.MeshBasicMaterial({
            color: this.config.ultimate.color,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide
        });
        this.stormCloud = new THREE.Mesh(cloudGeo, cloudMat);
        this.stormCloud.position.copy(this.camera.position);
        this.stormCloud.position.y = 15;
        this.scene.add(this.stormCloud);
    }

    updateArcaneStorm(delta, playerPosition, zombies) {
        const config = this.config.ultimate;

        // Move storm with player
        if (this.stormCloud) {
            this.stormCloud.position.x = playerPosition.x;
            this.stormCloud.position.z = playerPosition.z;
            this.stormCloud.rotation.y += delta;
        }

        // Spawn magic missiles
        this.stormHitTimer += delta;
        const hitInterval = 1 / config.hitsPerSecond;

        while (this.stormHitTimer >= hitInterval) {
            this.stormHitTimer -= hitInterval;

            // Random position within radius
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * config.radius;
            const x = playerPosition.x + Math.cos(angle) * dist;
            const z = playerPosition.z + Math.sin(angle) * dist;

            // Create magic bolt
            this.createMagicBolt(x, z, config.damagePerHit, zombies);
        }
    }

    createMagicBolt(x, z, damage, zombies) {
        const config = this.config.ultimate;

        // Visual effect - bolt from sky
        const boltGeo = new THREE.CylinderGeometry(0.1, 0.3, 15, 8);
        const boltMat = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.9
        });
        const bolt = new THREE.Mesh(boltGeo, boltMat);
        bolt.position.set(x, 7.5, z);
        this.scene.add(bolt);

        // Impact effect
        const impactGeo = new THREE.RingGeometry(0.5, 2, 32);
        const impactMat = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const impact = new THREE.Mesh(impactGeo, impactMat);
        impact.position.set(x, 0.1, z);
        impact.rotation.x = -Math.PI / 2;
        this.scene.add(impact);

        // Damage zombies in area
        const impactRadius = 2;
        for (const zombie of zombies) {
            if (zombie.isDead) continue;
            const dx = zombie.mesh.position.x - x;
            const dz = zombie.mesh.position.z - z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < impactRadius) {
                zombie.takeDamage(damage);
            }
        }

        // Animate and remove
        this.activeEffects.push({
            meshes: [bolt, impact],
            lifetime: 0.3,
            update: (dt, effect) => {
                bolt.material.opacity -= dt * 3;
                impact.scale.addScalar(dt * 5);
                impact.material.opacity -= dt * 3;
            }
        });
    }

    // ============================================
    // ARCHER ABILITIES
    // ============================================

    createPiercingArrow(damage, chargeLevel) {
        const config = this.config.chargedAttack;

        // Create glowing arrow
        const shaftGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
        const shaftMat = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.9
        });
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        shaft.rotation.x = Math.PI / 2;

        const headGeo = new THREE.ConeGeometry(0.05, 0.15, 8);
        const headMat = new THREE.MeshBasicMaterial({
            color: config.chargeColor
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.z = -0.45;
        head.rotation.x = -Math.PI / 2;
        shaft.add(head);

        // Trail
        const trailGeo = new THREE.PlaneGeometry(0.1, 0.6);
        const trailMat = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const trail = new THREE.Mesh(trailGeo, trailMat);
        trail.position.z = 0.3;
        shaft.add(trail);

        const arrow = new THREE.Group();
        arrow.add(shaft);

        // Position
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        arrow.position.copy(this.camera.position);
        arrow.lookAt(arrow.position.clone().add(direction));

        this.scene.add(arrow);

        const projectile = {
            mesh: arrow,
            velocity: direction.clone().multiplyScalar(config.projectileSpeed),
            damage: damage,
            pierceCount: Math.floor(config.maxPierceCount * chargeLevel),
            piercedEnemies: new Set(),
            type: 'piercingArrow',
            chargeLevel: chargeLevel,
            lifetime: 3
        };

        this.projectiles.push(projectile);

        return { type: 'chargedAttack', damage, chargeLevel };
    }

    startArrowRain() {
        this.arrowRainTimer = 0;
        this.arrowRainCenter = this.camera.position.clone();

        // Get target position (where player is aiming)
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        this.arrowRainCenter.add(direction.multiplyScalar(10));
        this.arrowRainCenter.y = 0;

        // Visual indicator
        const indicatorGeo = new THREE.RingGeometry(0.5, this.config.ultimate.radius, 32);
        const indicatorMat = new THREE.MeshBasicMaterial({
            color: this.config.ultimate.color,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        this.arrowRainIndicator = new THREE.Mesh(indicatorGeo, indicatorMat);
        this.arrowRainIndicator.position.copy(this.arrowRainCenter);
        this.arrowRainIndicator.position.y = 0.1;
        this.arrowRainIndicator.rotation.x = -Math.PI / 2;
        this.scene.add(this.arrowRainIndicator);
    }

    updateArrowRain(delta, playerPosition, zombies) {
        const config = this.config.ultimate;

        this.arrowRainTimer += delta;
        const arrowInterval = 1 / config.arrowsPerSecond;

        while (this.arrowRainTimer >= arrowInterval) {
            this.arrowRainTimer -= arrowInterval;

            // Random position within radius
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * config.radius;
            const x = this.arrowRainCenter.x + Math.cos(angle) * dist;
            const z = this.arrowRainCenter.z + Math.sin(angle) * dist;

            this.createRainArrow(x, z, config.damagePerArrow, zombies);
        }

        // Pulse indicator
        if (this.arrowRainIndicator) {
            const pulse = 1 + Math.sin(Date.now() / 100) * 0.1;
            this.arrowRainIndicator.scale.setScalar(pulse);
        }
    }

    createRainArrow(x, z, damage, zombies) {
        // Arrow falling from sky
        const arrowGeo = new THREE.ConeGeometry(0.05, 0.3, 6);
        const arrowMat = new THREE.MeshBasicMaterial({
            color: this.config.ultimate.color
        });
        const arrow = new THREE.Mesh(arrowGeo, arrowMat);
        arrow.position.set(x, 10, z);
        arrow.rotation.x = Math.PI;
        this.scene.add(arrow);

        // Animate falling
        this.activeEffects.push({
            meshes: [arrow],
            lifetime: 0.5,
            targetY: 0,
            update: (dt, effect) => {
                arrow.position.y -= dt * 40;
                if (arrow.position.y <= 0) {
                    // Impact - damage zombies
                    for (const zombie of zombies) {
                        if (zombie.isDead) continue;
                        const dx = zombie.mesh.position.x - x;
                        const dz = zombie.mesh.position.z - z;
                        const dist = Math.sqrt(dx * dx + dz * dz);
                        if (dist < 1) {
                            zombie.takeDamage(damage);
                        }
                    }
                    effect.lifetime = 0;
                }
            }
        });
    }

    // ============================================
    // SNIPER ABILITIES
    // ============================================

    createRailgunShot(damage, chargeLevel) {
        const config = this.config.chargedAttack;

        // Get direction
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        // Create beam effect
        const beamLength = 100;
        const beamGeo = new THREE.CylinderGeometry(0.05 + chargeLevel * 0.1, 0.05 + chargeLevel * 0.1, beamLength, 8);
        const beamMat = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.9
        });
        const beam = new THREE.Mesh(beamGeo, beamMat);

        // Position beam
        beam.position.copy(this.camera.position);
        beam.position.add(direction.clone().multiplyScalar(beamLength / 2));
        beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

        this.scene.add(beam);

        // Outer glow
        const glowGeo = new THREE.CylinderGeometry(0.2 + chargeLevel * 0.2, 0.2 + chargeLevel * 0.2, beamLength, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: config.chargeColor,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        beam.add(glow);

        // Animate fade out
        this.activeEffects.push({
            meshes: [beam],
            lifetime: 0.3,
            update: (dt, effect) => {
                beam.material.opacity -= dt * 3;
                glow.material.opacity -= dt;
                beam.scale.x = beam.scale.z = beam.scale.x * 0.9;
            }
        });

        return {
            type: 'railgun',
            damage,
            chargeLevel,
            direction: direction.clone(),
            origin: this.camera.position.clone(),
            penetrateCount: config.penetrateCount
        };
    }

    startDeadEye() {
        this.deadEyeTargets = [];
        this.deadEyeLockTimer = 0;

        // Red tint overlay
        this.deadEyeOverlay = document.createElement('div');
        this.deadEyeOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, transparent 30%, rgba(255,0,0,0.3) 100%);
            pointer-events: none;
            z-index: 50;
        `;
        document.body.appendChild(this.deadEyeOverlay);
    }

    updateDeadEye(delta, zombies) {
        const config = this.config.ultimate;

        this.deadEyeLockTimer += delta;

        // Lock onto targets
        if (this.deadEyeTargets.length < config.maxTargets) {
            for (const zombie of zombies) {
                if (zombie.isDead) continue;
                if (this.deadEyeTargets.find(t => t.zombie === zombie)) continue;

                // Check if in view
                const screenPos = this.worldToScreen(zombie.mesh.position);
                if (screenPos && screenPos.x > 0 && screenPos.x < window.innerWidth &&
                    screenPos.y > 0 && screenPos.y < window.innerHeight) {

                    // Add target marker
                    const marker = document.createElement('div');
                    marker.style.cssText = `
                        position: fixed;
                        width: 40px;
                        height: 40px;
                        border: 3px solid red;
                        border-radius: 50%;
                        left: ${screenPos.x - 20}px;
                        top: ${screenPos.y - 20}px;
                        pointer-events: none;
                        z-index: 60;
                        animation: targetLock 0.3s ease-out;
                    `;
                    document.body.appendChild(marker);

                    // Add animation style if not exists
                    if (!document.querySelector('#target-lock-style')) {
                        const style = document.createElement('style');
                        style.id = 'target-lock-style';
                        style.textContent = `
                            @keyframes targetLock {
                                0% { transform: scale(2); opacity: 0; }
                                100% { transform: scale(1); opacity: 1; }
                            }
                        `;
                        document.head.appendChild(style);
                    }

                    this.deadEyeTargets.push({ zombie, marker, locked: false, lockTime: 0 });
                    break;
                }
            }
        }

        // Update target markers and lock progress
        for (const target of this.deadEyeTargets) {
            if (target.zombie.isDead) {
                target.marker.remove();
                continue;
            }

            const screenPos = this.worldToScreen(target.zombie.mesh.position);
            if (screenPos) {
                target.marker.style.left = `${screenPos.x - 20}px`;
                target.marker.style.top = `${screenPos.y - 20}px`;
            }

            target.lockTime += delta;
            if (target.lockTime >= config.lockOnTime && !target.locked) {
                target.locked = true;
                target.marker.style.borderColor = '#ff0';
                target.marker.innerHTML = '<div style="color:#ff0;text-align:center;line-height:34px;font-size:20px;">☠</div>';
            }
        }

        // Fire at all locked targets when ultimate ends
        if (this.ultimateTimer <= 0.5 && !this.deadEyeFired) {
            this.deadEyeFired = true;
            for (const target of this.deadEyeTargets) {
                if (target.locked && !target.zombie.isDead) {
                    target.zombie.takeDamage(config.damagePerTarget);

                    // Hit effect
                    this.createDeadEyeHitEffect(target.zombie.mesh.position);
                }
            }
        }
    }

    createDeadEyeHitEffect(position) {
        const flashGeo = new THREE.SphereGeometry(1, 16, 16);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 1
        });
        const flash = new THREE.Mesh(flashGeo, flashMat);
        flash.position.copy(position);
        this.scene.add(flash);

        this.activeEffects.push({
            meshes: [flash],
            lifetime: 0.3,
            update: (dt, effect) => {
                flash.scale.addScalar(dt * 10);
                flash.material.opacity -= dt * 3;
            }
        });
    }

    worldToScreen(position) {
        const vector = position.clone();
        vector.project(this.camera);

        if (vector.z > 1) return null; // Behind camera

        return {
            x: (vector.x + 1) / 2 * window.innerWidth,
            y: (-vector.y + 1) / 2 * window.innerHeight
        };
    }

    // ============================================
    // MACHINEGUN ABILITIES
    // ============================================

    createGrenadeProjectile(damage, chargeLevel) {
        const config = this.config.chargedAttack;

        // Create grenade mesh
        const bodyGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.3
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);

        // Glowing band
        const bandGeo = new THREE.TorusGeometry(0.12, 0.03, 8, 16);
        const bandMat = new THREE.MeshBasicMaterial({
            color: config.color,
            emissive: config.color,
            emissiveIntensity: 1
        });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.rotation.x = Math.PI / 2;
        body.add(band);

        const grenade = new THREE.Group();
        grenade.add(body);

        // Position and velocity (arc)
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        grenade.position.copy(this.camera.position);

        const velocity = direction.clone().multiplyScalar(config.projectileSpeed);
        velocity.y += 5; // Arc upward

        this.scene.add(grenade);

        const projectile = {
            mesh: grenade,
            velocity: velocity,
            damage: damage,
            explosionRadius: config.explosionRadius * (0.5 + chargeLevel * 0.5),
            type: 'grenade',
            chargeLevel: chargeLevel,
            lifetime: 3,
            gravity: 15
        };

        this.projectiles.push(projectile);

        return { type: 'chargedAttack', damage, chargeLevel };
    }

    startBulletStorm() {
        this.bulletStormTimer = 0;
        this.bulletStormAngle = 0;
    }

    updateBulletStorm(delta, playerPosition, zombies) {
        const config = this.config.ultimate;

        this.bulletStormTimer += delta;
        const bulletInterval = 1 / config.bulletsPerSecond;

        while (this.bulletStormTimer >= bulletInterval) {
            this.bulletStormTimer -= bulletInterval;
            this.bulletStormAngle += 0.3;

            // Create bullet in current angle direction
            this.createStormBullet(playerPosition, this.bulletStormAngle, config.damagePerBullet, zombies);
        }
    }

    createStormBullet(position, angle, damage, zombies) {
        const direction = new THREE.Vector3(
            Math.cos(angle),
            0,
            Math.sin(angle)
        );

        // Tracer effect
        const tracerGeo = new THREE.CylinderGeometry(0.02, 0.02, 2, 4);
        const tracerMat = new THREE.MeshBasicMaterial({
            color: this.config.ultimate.color
        });
        const tracer = new THREE.Mesh(tracerGeo, tracerMat);
        tracer.position.copy(position);
        tracer.position.y = 1;
        tracer.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
        this.scene.add(tracer);

        // Raycast for hit detection
        const raycaster = new THREE.Raycaster(
            new THREE.Vector3(position.x, 1, position.z),
            direction,
            0,
            50
        );

        // Check zombie hits
        for (const zombie of zombies) {
            if (zombie.isDead) continue;
            const dx = zombie.mesh.position.x - position.x;
            const dz = zombie.mesh.position.z - position.z;

            // Simple line-circle intersection
            const dot = dx * direction.x + dz * direction.z;
            if (dot > 0 && dot < 50) {
                const closestX = position.x + direction.x * dot;
                const closestZ = position.z + direction.z * dot;
                const dist = Math.sqrt(
                    Math.pow(zombie.mesh.position.x - closestX, 2) +
                    Math.pow(zombie.mesh.position.z - closestZ, 2)
                );
                if (dist < 1) {
                    zombie.takeDamage(damage);
                }
            }
        }

        // Animate tracer
        this.activeEffects.push({
            meshes: [tracer],
            lifetime: 0.1,
            update: (dt, effect) => {
                tracer.position.add(direction.clone().multiplyScalar(100 * dt));
                tracer.material.opacity -= dt * 10;
            }
        });
    }

    // ============================================
    // KNIGHT ABILITIES
    // ============================================

    createHeavySlam(damage, chargeLevel) {
        const config = this.config.chargedAttack;
        const radius = config.radius * (0.5 + chargeLevel * 0.5);

        // Get position in front of player
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        const slamPos = this.camera.position.clone();
        slamPos.add(direction.multiplyScalar(2));
        slamPos.y = 0;

        // Ground crack effect
        const crackGeo = new THREE.RingGeometry(0.5, radius, 32);
        const crackMat = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const crack = new THREE.Mesh(crackGeo, crackMat);
        crack.position.copy(slamPos);
        crack.position.y = 0.1;
        crack.rotation.x = -Math.PI / 2;
        crack.scale.setScalar(0.1);
        this.scene.add(crack);

        // Shockwave ring
        const waveGeo = new THREE.RingGeometry(radius * 0.8, radius, 32);
        const waveMat = new THREE.MeshBasicMaterial({
            color: config.chargeColor,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide
        });
        const wave = new THREE.Mesh(waveGeo, waveMat);
        wave.position.copy(slamPos);
        wave.position.y = 0.2;
        wave.rotation.x = -Math.PI / 2;
        wave.scale.setScalar(0.1);
        this.scene.add(wave);

        // Animate expansion
        this.activeEffects.push({
            meshes: [crack, wave],
            lifetime: 0.5,
            update: (dt, effect) => {
                const scale = Math.min(crack.scale.x + dt * 8, 1);
                crack.scale.setScalar(scale);

                const waveScale = Math.min(wave.scale.x + dt * 10, 1.5);
                wave.scale.setScalar(waveScale);
                wave.material.opacity -= dt * 2;

                crack.material.opacity -= dt;
            }
        });

        return {
            type: 'heavySlam',
            damage,
            chargeLevel,
            position: slamPos.clone(),
            radius: radius,
            knockbackForce: config.knockbackForce * chargeLevel
        };
    }

    startBerserkerRage() {
        // Visual effect - red aura around player
        const auraGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const auraMat = new THREE.MeshBasicMaterial({
            color: this.config.ultimate.color,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        this.berserkerAura = new THREE.Mesh(auraGeo, auraMat);
        this.camera.add(this.berserkerAura);
        this.berserkerAura.position.set(0, -1, 0);

        // Red vignette
        this.berserkerVignette = document.createElement('div');
        this.berserkerVignette.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, transparent 50%, rgba(255,0,0,0.4) 100%);
            pointer-events: none;
            z-index: 50;
        `;
        document.body.appendChild(this.berserkerVignette);
    }

    getBerserkerStats() {
        if (this.ultimateActive && this.characterType === 'Knight') {
            return {
                damageMultiplier: this.config.ultimate.damageMultiplier,
                invincible: this.config.ultimate.invincible,
                attackSpeedMultiplier: this.config.ultimate.attackSpeedMultiplier
            };
        }
        return null;
    }

    // ============================================
    // PROJECTILE & EFFECT MANAGEMENT
    // ============================================

    updateProjectiles(delta, zombies) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.lifetime -= delta;

            if (proj.lifetime <= 0) {
                this.removeProjectile(i);
                continue;
            }

            // Apply gravity for grenades
            if (proj.gravity) {
                proj.velocity.y -= proj.gravity * delta;
            }

            // Move projectile
            proj.mesh.position.add(proj.velocity.clone().multiplyScalar(delta));

            // Rotate mesh to face direction
            if (proj.type !== 'grenade') {
                proj.mesh.lookAt(proj.mesh.position.clone().add(proj.velocity));
            } else {
                proj.mesh.rotation.x += delta * 5;
                proj.mesh.rotation.z += delta * 3;
            }

            // Check for ground collision (grenades)
            if (proj.mesh.position.y <= 0 && proj.explosionRadius) {
                this.createExplosion(proj.mesh.position, proj.explosionRadius, proj.damage, zombies);
                this.removeProjectile(i);
                continue;
            }

            // Check zombie collisions
            for (const zombie of zombies) {
                if (zombie.isDead) continue;

                const dist = proj.mesh.position.distanceTo(zombie.mesh.position);
                if (dist < 1.5) {
                    // Piercing arrow
                    if (proj.type === 'piercingArrow') {
                        if (!proj.piercedEnemies.has(zombie)) {
                            zombie.takeDamage(proj.damage);
                            proj.piercedEnemies.add(zombie);
                            proj.pierceCount--;

                            if (proj.pierceCount <= 0) {
                                this.removeProjectile(i);
                                break;
                            }
                        }
                    }
                    // Explosive projectiles
                    else if (proj.explosionRadius) {
                        this.createExplosion(proj.mesh.position, proj.explosionRadius, proj.damage, zombies);
                        this.removeProjectile(i);
                        break;
                    }
                    // Regular projectile
                    else {
                        zombie.takeDamage(proj.damage);
                        this.removeProjectile(i);
                        break;
                    }
                }
            }
        }
    }

    createExplosion(position, radius, damage, zombies) {
        // Explosion visual
        const explosionGeo = new THREE.SphereGeometry(radius, 16, 16);
        const explosionMat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0.8
        });
        const explosion = new THREE.Mesh(explosionGeo, explosionMat);
        explosion.position.copy(position);
        explosion.scale.setScalar(0.1);
        this.scene.add(explosion);

        // Inner core
        const coreGeo = new THREE.SphereGeometry(radius * 0.5, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        explosion.add(core);

        // Damage zombies
        for (const zombie of zombies) {
            if (zombie.isDead) continue;
            const dist = zombie.mesh.position.distanceTo(position);
            if (dist < radius) {
                const falloff = 1 - (dist / radius);
                zombie.takeDamage(damage * falloff);
            }
        }

        // Animate
        this.activeEffects.push({
            meshes: [explosion],
            lifetime: 0.4,
            update: (dt, effect) => {
                explosion.scale.addScalar(dt * 15);
                explosion.material.opacity -= dt * 2;
                core.material.opacity -= dt * 2.5;
            }
        });

        if (this.audioManager) {
            this.audioManager.playExplosion();
        }
    }

    removeProjectile(index) {
        const proj = this.projectiles[index];
        this.scene.remove(proj.mesh);
        proj.mesh.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
        });
        this.projectiles.splice(index, 1);
    }

    updateEffects(delta) {
        for (let i = this.activeEffects.length - 1; i >= 0; i--) {
            const effect = this.activeEffects[i];
            effect.lifetime -= delta;

            if (effect.update) {
                effect.update(delta, effect);
            }

            if (effect.lifetime <= 0) {
                for (const mesh of effect.meshes) {
                    this.scene.remove(mesh);
                    mesh.traverse(child => {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) child.material.dispose();
                    });
                }
                this.activeEffects.splice(i, 1);
            }
        }
    }

    cleanupUltimateEffects() {
        // Clean up based on character type
        switch (this.characterType) {
            case 'Wizard':
                if (this.stormCloud) {
                    this.scene.remove(this.stormCloud);
                    this.stormCloud = null;
                }
                break;
            case 'Archer':
                if (this.arrowRainIndicator) {
                    this.scene.remove(this.arrowRainIndicator);
                    this.arrowRainIndicator = null;
                }
                break;
            case 'Sniper':
                if (this.deadEyeOverlay) {
                    this.deadEyeOverlay.remove();
                    this.deadEyeOverlay = null;
                }
                for (const target of this.deadEyeTargets || []) {
                    target.marker?.remove();
                }
                this.deadEyeTargets = [];
                this.deadEyeFired = false;
                break;
            case 'Knight':
                if (this.berserkerAura) {
                    this.camera.remove(this.berserkerAura);
                    this.berserkerAura = null;
                }
                if (this.berserkerVignette) {
                    this.berserkerVignette.remove();
                    this.berserkerVignette = null;
                }
                break;
        }
    }

    /**
     * Dispose all resources
     */
    dispose() {
        this.cancelCharge();
        this.cleanupUltimateEffects();

        for (const proj of this.projectiles) {
            this.scene.remove(proj.mesh);
        }
        this.projectiles = [];

        for (const effect of this.activeEffects) {
            for (const mesh of effect.meshes) {
                this.scene.remove(mesh);
            }
        }
        this.activeEffects = [];

        this.chargeBarContainer?.remove();
        this.ultimateIndicator?.remove();
    }
}
