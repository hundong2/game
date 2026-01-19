export class Zombie {
    constructor(effectiveLevel) {
        this.level = effectiveLevel;
        // Exponential-ish or linear scaling
        this.maxHp = 50 + (effectiveLevel * 10) + (Math.pow(effectiveLevel, 1.2) * 5);
        this.hp = this.maxHp;
        this.damage = 5 + effectiveLevel;
        this.speed = 2 + (effectiveLevel * 0.1);
    }
}
