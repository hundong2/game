/**
 * Zombie Types Configuration
 */
export const ZOMBIE_TYPES = {
    walker: {
        name: 'Walker',
        hpMultiplier: 1.0,
        damageMultiplier: 1.0,
        speedMultiplier: 1.0,
        scale: 1.0,
        color: 0x4a5d4a,  // Sickly green-gray
        special: null
    },
    runner: {
        name: 'Runner',
        hpMultiplier: 0.6,
        damageMultiplier: 0.8,
        speedMultiplier: 2.5,
        scale: 0.9,
        color: 0x6b4a3a,  // Brown-ish
        special: 'fast'
    },
    tank: {
        name: 'Tank',
        hpMultiplier: 4.0,
        damageMultiplier: 2.5,
        speedMultiplier: 0.5,
        scale: 1.8,
        color: 0x3a3a4a,  // Dark gray-purple
        special: 'knockback_resist'
    },
    spitter: {
        name: 'Spitter',
        hpMultiplier: 0.8,
        damageMultiplier: 1.5,
        speedMultiplier: 1.2,
        scale: 1.1,
        color: 0x4a6b4a,  // Toxic green
        special: 'ranged'
    },
    exploder: {
        name: 'Exploder',
        hpMultiplier: 0.5,
        damageMultiplier: 5.0,
        speedMultiplier: 1.5,
        scale: 1.2,
        color: 0x8b4a4a,  // Reddish
        special: 'explode_on_death'
    },
    screamer: {
        name: 'Screamer',
        hpMultiplier: 0.7,
        damageMultiplier: 0.5,
        speedMultiplier: 1.0,
        scale: 1.0,
        color: 0x6a5a7a,  // Pale purple
        special: 'buff_nearby'
    },
    boss: {
        name: 'Abomination',
        hpMultiplier: 20.0,
        damageMultiplier: 4.0,
        speedMultiplier: 0.75,
        scale: 3.0,
        color: 0x2a1a2a,  // Dark purple-black
        special: 'boss'
    }
};

export class Zombie {
    constructor(effectiveLevel, type = 'walker') {
        this.level = effectiveLevel;
        this.type = type;
        this.typeConfig = ZOMBIE_TYPES[type] || ZOMBIE_TYPES.walker;

        // Base stats with type multipliers
        const baseHp = 50 + (effectiveLevel * 10) + (Math.pow(effectiveLevel, 1.2) * 5);
        const baseDamage = 5 + effectiveLevel;
        const baseSpeed = 2 + (effectiveLevel * 0.1);

        this.maxHp = Math.floor(baseHp * this.typeConfig.hpMultiplier);
        this.hp = this.maxHp;
        this.damage = Math.floor(baseDamage * this.typeConfig.damageMultiplier);
        this.speed = baseSpeed * this.typeConfig.speedMultiplier;
        this.scale = this.typeConfig.scale;
        this.color = this.typeConfig.color;
        this.special = this.typeConfig.special;

        // State flags
        this.isBuffed = false;
        this.buffTimer = 0;
    }

    // Apply screamer buff
    applyBuff() {
        if (!this.isBuffed) {
            this.isBuffed = true;
            this.buffTimer = 5; // 5 seconds
            this.speed *= 1.5;
            this.damage = Math.floor(this.damage * 1.3);
        }
    }

    // Update buff timer
    updateBuff(delta) {
        if (this.isBuffed) {
            this.buffTimer -= delta;
            if (this.buffTimer <= 0) {
                this.isBuffed = false;
                // Reset stats (simplified - doesn't perfectly restore)
                this.speed /= 1.5;
                this.damage = Math.floor(this.damage / 1.3);
            }
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        return this.hp <= 0;
    }

    getExplosionDamage() {
        if (this.special === 'explode_on_death') {
            return this.damage * 2;
        }
        return 0;
    }

    getExplosionRadius() {
        if (this.special === 'explode_on_death') {
            return 5;
        }
        return 0;
    }
}
