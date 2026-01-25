import { describe, it, expect, beforeEach } from 'vitest';
import { POWERUP_TYPES } from '../entities/items/PowerUp';
import { Knight, Wizard } from '../logic/Characters';

/**
 * Tests for power-up system
 * Ensures power-ups apply effects correctly
 */

describe('Power-up Types', () => {
    it('should have 5 distinct power-up types', () => {
        const types = Object.keys(POWERUP_TYPES);
        expect(types).toContain('HEALTH');
        expect(types).toContain('SPEED');
        expect(types).toContain('DAMAGE');
        expect(types).toContain('SHIELD');
        expect(types).toContain('NUKE');
        expect(types.length).toBe(5);
    });

    it('each power-up should have required properties', () => {
        for (const [type, config] of Object.entries(POWERUP_TYPES)) {
            expect(config).toHaveProperty('name');
            expect(config).toHaveProperty('color');
            expect(config).toHaveProperty('glowColor');
            expect(config).toHaveProperty('effect');
            expect(config).toHaveProperty('duration');
            expect(config).toHaveProperty('dropChance');

            expect(typeof config.effect).toBe('function');
            expect(typeof config.duration).toBe('number');
            expect(config.dropChance).toBeGreaterThanOrEqual(0);
            expect(config.dropChance).toBeLessThanOrEqual(1);
        }
    });
});

describe('Health Power-up', () => {
    let player;

    beforeEach(() => {
        player = new Wizard();
    });

    it('should heal player', () => {
        player.hp = 50;
        const originalHp = player.hp;

        POWERUP_TYPES.HEALTH.effect(player);

        expect(player.hp).toBeGreaterThan(originalHp);
    });

    it('should not exceed max HP', () => {
        player.hp = player.maxHp - 10;

        POWERUP_TYPES.HEALTH.effect(player);

        expect(player.hp).toBeLessThanOrEqual(player.maxHp);
    });

    it('should be instant (duration = 0)', () => {
        expect(POWERUP_TYPES.HEALTH.duration).toBe(0);
    });
});

describe('Damage Power-up', () => {
    let player;

    beforeEach(() => {
        player = new Wizard();
    });

    it('should double damage multiplier', () => {
        expect(player.damageMultiplier).toBe(1.0);

        POWERUP_TYPES.DAMAGE.effect(player);

        expect(player.damageMultiplier).toBe(2.0);
    });

    it('should reset on expire', () => {
        POWERUP_TYPES.DAMAGE.effect(player);
        expect(player.damageMultiplier).toBe(2.0);

        POWERUP_TYPES.DAMAGE.onExpire(player);
        expect(player.damageMultiplier).toBe(1.0);
    });

    it('should have non-zero duration', () => {
        expect(POWERUP_TYPES.DAMAGE.duration).toBeGreaterThan(0);
    });
});

describe('Shield Power-up', () => {
    let player;

    beforeEach(() => {
        player = new Knight();
    });

    it('should activate shield', () => {
        expect(player.shieldActive).toBe(false);

        POWERUP_TYPES.SHIELD.effect(player);

        expect(player.shieldActive).toBe(true);
        expect(player.damageReduction).toBe(0.5);
    });

    it('should deactivate on expire', () => {
        POWERUP_TYPES.SHIELD.effect(player);
        expect(player.shieldActive).toBe(true);

        POWERUP_TYPES.SHIELD.onExpire(player);
        expect(player.shieldActive).toBe(false);
        expect(player.damageReduction).toBe(0);
    });
});

describe('Speed Power-up', () => {
    it('should have correct effect structure', () => {
        const speedConfig = POWERUP_TYPES.SPEED;
        expect(speedConfig.duration).toBeGreaterThan(0);
        expect(typeof speedConfig.effect).toBe('function');
        expect(typeof speedConfig.onExpire).toBe('function');
    });
});

describe('Nuke Power-up', () => {
    it('should be instant (duration = 0)', () => {
        expect(POWERUP_TYPES.NUKE.duration).toBe(0);
    });

    it('should have very low drop chance', () => {
        expect(POWERUP_TYPES.NUKE.dropChance).toBeLessThan(0.01);
    });
});

describe('Drop Chance Totals', () => {
    it('total drop chances should not exceed 1', () => {
        const totalChance = Object.values(POWERUP_TYPES)
            .reduce((sum, config) => sum + config.dropChance, 0);

        expect(totalChance).toBeLessThanOrEqual(1);
    });

    it('health should have highest drop chance', () => {
        const healthChance = POWERUP_TYPES.HEALTH.dropChance;
        const otherChances = Object.entries(POWERUP_TYPES)
            .filter(([type]) => type !== 'HEALTH')
            .map(([, config]) => config.dropChance);

        for (const chance of otherChances) {
            expect(healthChance).toBeGreaterThanOrEqual(chance);
        }
    });
});
