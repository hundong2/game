import { describe, it, expect } from 'vitest';
import { Zombie, ZOMBIE_TYPES } from '../logic/Zombie';

/**
 * Tests for zombie type system
 * Ensures zombie variants have correct stats and abilities
 */

describe('Zombie Types Configuration', () => {
    const expectedTypes = ['walker', 'runner', 'tank', 'spitter', 'exploder', 'screamer', 'boss'];

    it('should have all expected zombie types', () => {
        for (const type of expectedTypes) {
            expect(ZOMBIE_TYPES).toHaveProperty(type);
        }
    });

    it('each type should have required properties', () => {
        for (const [type, config] of Object.entries(ZOMBIE_TYPES)) {
            expect(config).toHaveProperty('hpMultiplier');
            expect(config).toHaveProperty('damageMultiplier');
            expect(config).toHaveProperty('speedMultiplier');
            expect(config).toHaveProperty('scale');
            expect(config).toHaveProperty('color');

            expect(config.hpMultiplier).toBeGreaterThan(0);
            expect(config.damageMultiplier).toBeGreaterThan(0);
            expect(config.speedMultiplier).toBeGreaterThan(0);
            expect(config.scale).toBeGreaterThan(0);
        }
    });
});

describe('Walker Zombie (Default)', () => {
    it('should have baseline stats', () => {
        const config = ZOMBIE_TYPES.walker;
        expect(config.hpMultiplier).toBe(1);
        expect(config.damageMultiplier).toBe(1);
        expect(config.speedMultiplier).toBe(1);
        expect(config.scale).toBe(1);
    });
});

describe('Runner Zombie', () => {
    it('should be faster than walker', () => {
        expect(ZOMBIE_TYPES.runner.speedMultiplier).toBeGreaterThan(ZOMBIE_TYPES.walker.speedMultiplier);
    });

    it('should have lower HP than walker', () => {
        expect(ZOMBIE_TYPES.runner.hpMultiplier).toBeLessThan(ZOMBIE_TYPES.walker.hpMultiplier);
    });

    it('should be smaller in scale', () => {
        expect(ZOMBIE_TYPES.runner.scale).toBeLessThanOrEqual(ZOMBIE_TYPES.walker.scale);
    });
});

describe('Tank Zombie', () => {
    it('should have more HP than walker', () => {
        expect(ZOMBIE_TYPES.tank.hpMultiplier).toBeGreaterThan(ZOMBIE_TYPES.walker.hpMultiplier);
    });

    it('should be slower than walker', () => {
        expect(ZOMBIE_TYPES.tank.speedMultiplier).toBeLessThan(ZOMBIE_TYPES.walker.speedMultiplier);
    });

    it('should be larger in scale', () => {
        expect(ZOMBIE_TYPES.tank.scale).toBeGreaterThan(ZOMBIE_TYPES.walker.scale);
    });

    it('should deal more damage', () => {
        expect(ZOMBIE_TYPES.tank.damageMultiplier).toBeGreaterThan(ZOMBIE_TYPES.walker.damageMultiplier);
    });
});

describe('Exploder Zombie', () => {
    it('should have explode_on_death special', () => {
        expect(ZOMBIE_TYPES.exploder.special).toBe('explode_on_death');
    });

    it('should have lower HP (explosive)', () => {
        expect(ZOMBIE_TYPES.exploder.hpMultiplier).toBeLessThan(ZOMBIE_TYPES.tank.hpMultiplier);
    });

    it('should be faster to catch players', () => {
        expect(ZOMBIE_TYPES.exploder.speedMultiplier).toBeGreaterThan(ZOMBIE_TYPES.walker.speedMultiplier);
    });
});

describe('Screamer Zombie', () => {
    it('should have buff_nearby special', () => {
        expect(ZOMBIE_TYPES.screamer.special).toBe('buff_nearby');
    });

    it('should have lower damage (support role)', () => {
        expect(ZOMBIE_TYPES.screamer.damageMultiplier).toBeLessThan(ZOMBIE_TYPES.walker.damageMultiplier);
    });
});

describe('Boss Zombie', () => {
    it('should have significantly more HP', () => {
        expect(ZOMBIE_TYPES.boss.hpMultiplier).toBeGreaterThan(ZOMBIE_TYPES.tank.hpMultiplier);
    });

    it('should be the largest', () => {
        const maxScale = Math.max(...Object.values(ZOMBIE_TYPES)
            .filter((_, i, arr) => arr[i] !== ZOMBIE_TYPES.boss)
            .map(c => c.scale));
        expect(ZOMBIE_TYPES.boss.scale).toBeGreaterThanOrEqual(maxScale);
    });

    it('should deal significant damage', () => {
        expect(ZOMBIE_TYPES.boss.damageMultiplier).toBeGreaterThan(ZOMBIE_TYPES.walker.damageMultiplier);
    });
});

describe('Zombie Instance Creation', () => {
    it('should create zombie with correct type stats', () => {
        const walker = new Zombie(1, 'walker');
        const tank = new Zombie(1, 'tank');

        expect(tank.maxHp).toBeGreaterThan(walker.maxHp);
        expect(tank.speed).toBeLessThan(walker.speed);
    });

    it('should apply stage scaling', () => {
        const stage1 = new Zombie(1, 'walker');
        const stage5 = new Zombie(5, 'walker');

        expect(stage5.maxHp).toBeGreaterThan(stage1.maxHp);
    });

    it('should combine type and stage multipliers', () => {
        const stage1Walker = new Zombie(1, 'walker');
        const stage5Tank = new Zombie(5, 'tank');

        // Tank at stage 5 should be much stronger than walker at stage 1
        expect(stage5Tank.maxHp).toBeGreaterThan(stage1Walker.maxHp * 2);
    });
});

describe('Zombie Buff System', () => {
    it('should apply buff correctly', () => {
        const zombie = new Zombie(1, 'walker');
        const originalDamage = zombie.damage;
        const originalSpeed = zombie.speed;

        zombie.applyBuff();

        expect(zombie.isBuffed).toBe(true);
        expect(zombie.damage).toBeGreaterThan(originalDamage);
        expect(zombie.speed).toBeGreaterThan(originalSpeed);
    });

    it('buff should expire after duration', () => {
        const zombie = new Zombie(1, 'walker');
        zombie.applyBuff();
        expect(zombie.isBuffed).toBe(true);

        // Simulate time passing (buff duration is typically 5 seconds)
        zombie.updateBuff(10); // 10 seconds

        expect(zombie.isBuffed).toBe(false);
    });
});

describe('Exploder Zombie Explosion', () => {
    it('should return explosion data', () => {
        const exploder = new Zombie(1, 'exploder');
        const data = exploder.getExplosionDamage();

        expect(data).toBeGreaterThan(0);
    });

    it('should return explosion radius', () => {
        const exploder = new Zombie(1, 'exploder');
        const radius = exploder.getExplosionRadius();

        expect(radius).toBeGreaterThan(0);
    });
});
