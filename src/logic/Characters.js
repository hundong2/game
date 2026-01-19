export class Character {
    constructor(name, hp, speed, damage, defense, type) {
        this.name = name;
        this.type = type;
        this.maxHp = hp;
        this.hp = hp;
        this.speed = speed;
        this.damage = damage;
        this.defense = defense;
    }
}

export class Wizard extends Character {
    constructor() {
        super('Wizard', 80, 10, 25, 5, 'Wizard');
    }
}

export class Archer extends Character {
    constructor() {
        super('Archer', 100, 15, 20, 8, 'Archer'); // Fast, moderate damage
    }
}

export class Sniper extends Character {
    constructor() {
        super('Sniper', 80, 8, 50, 5, 'Sniper'); // High damage, slow
    }
}

export class MachineGun extends Character {
    constructor() {
        super('MachineGun', 120, 9, 8, 10, 'MachineGun'); // Fast fire (low dmg per shot), tanky
    }
}

export class Knight extends Character {
    constructor() {
        super('Knight', 200, 8, 15, 20, 'Knight'); // Tanky, high defense
    }
}
