export class Character {
    constructor(name, hp, speed, damage, defense, type) {
        this.name = name;
        this.type = type;
        this.maxHp = hp;
        this.hp = hp;
        this.speed = speed;
        this.baseDamage = damage;
        this.damage = damage;
        this.defense = defense;

        // Power-up related
        this.damageMultiplier = 1.0;
        this.damageReduction = 0;
        this.shieldActive = false;
        this.isDead = false;

        // Passive abilities
        this.passive = null;
    }

    // Calculate actual damage dealt
    getDamage() {
        return Math.floor(this.baseDamage * this.damageMultiplier);
    }

    // Calculate damage taken (with defense and damage reduction)
    takeDamage(incomingDamage) {
        // Defense reduces damage: reduction = defense / (defense + 100)
        const defenseReduction = this.defense / (this.defense + 100);
        let finalDamage = incomingDamage * (1 - defenseReduction);

        // Apply power-up damage reduction
        if (this.damageReduction > 0) {
            finalDamage *= (1 - this.damageReduction);
        }

        this.hp -= Math.floor(finalDamage);

        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }

        return Math.floor(finalDamage);
    }

    // Heal (capped at maxHp)
    heal(amount) {
        this.hp = Math.min(this.hp + amount, this.maxHp);
    }
}

export class Wizard extends Character {
    constructor() {
        super('Wizard', 80, 10, 25, 5, 'Wizard');
        this.passive = 'Kills charge ultimate (future feature)';
    }
}

export class Archer extends Character {
    constructor() {
        super('Archer', 100, 15, 20, 8, 'Archer');
        this.passive = 'Maintains accuracy while moving';
    }
}

export class Sniper extends Character {
    constructor() {
        super('Sniper', 80, 8, 50, 5, 'Sniper');
        this.passive = 'Headshots penetrate (up to 2 targets)';
    }
}

export class MachineGun extends Character {
    constructor() {
        super('MachineGun', 120, 9, 8, 10, 'MachineGun');
        this.passive = 'Accuracy increases with continuous fire';
    }
}

export class Knight extends Character {
    constructor() {
        super('Knight', 200, 8, 15, 20, 'Knight');
        this.passive = 'Melee kills restore 5% HP';
        this.lifestealPercent = 0.05;
    }

    // Knight specific: lifesteal on kill
    onKill() {
        const healAmount = Math.floor(this.maxHp * this.lifestealPercent);
        this.heal(healAmount);
        return healAmount;
    }
}
