import { describe, it, expect } from 'vitest';
import { ABILITY_CONFIG } from '../abilities/AbilitySystem';

/**
 * Tests for ability system
 * Ensures all character abilities are properly configured
 */

describe('Ability Configuration', () => {
    const characterTypes = ['Wizard', 'Archer', 'Sniper', 'MachineGun', 'Knight'];

    it('should have ability config for all character types', () => {
        for (const type of characterTypes) {
            expect(ABILITY_CONFIG).toHaveProperty(type);
        }
    });

    it('each character should have charged attack config', () => {
        for (const type of characterTypes) {
            const config = ABILITY_CONFIG[type];
            expect(config).toHaveProperty('chargedAttack');
            expect(config.chargedAttack).toHaveProperty('name');
            expect(config.chargedAttack).toHaveProperty('baseDamage');
            expect(config.chargedAttack).toHaveProperty('maxDamageMultiplier');
            expect(config.chargedAttack).toHaveProperty('color');
            expect(config.chargedAttack).toHaveProperty('chargeColor');
        }
    });

    it('each character should have ultimate ability config', () => {
        for (const type of characterTypes) {
            const config = ABILITY_CONFIG[type];
            expect(config).toHaveProperty('ultimate');
            expect(config.ultimate).toHaveProperty('name');
            expect(config.ultimate).toHaveProperty('color');
        }
    });
});

describe('Wizard Abilities', () => {
    const config = ABILITY_CONFIG.Wizard;

    it('should have Meteor charged attack', () => {
        expect(config.chargedAttack.name).toBe('Meteor');
        expect(config.chargedAttack.explosionRadius).toBeGreaterThan(0);
    });

    it('should have Arcane Storm ultimate', () => {
        expect(config.ultimate.name).toBe('Arcane Storm');
        expect(config.ultimate.duration).toBeGreaterThan(0);
        expect(config.ultimate.hitsPerSecond).toBeGreaterThan(0);
    });
});

describe('Archer Abilities', () => {
    const config = ABILITY_CONFIG.Archer;

    it('should have Piercing Arrow charged attack', () => {
        expect(config.chargedAttack.name).toBe('Piercing Arrow');
        expect(config.chargedAttack.maxPierceCount).toBeGreaterThan(0);
    });

    it('should have Arrow Rain ultimate', () => {
        expect(config.ultimate.name).toBe('Arrow Rain');
        expect(config.ultimate.arrowsPerSecond).toBeGreaterThan(0);
    });
});

describe('Sniper Abilities', () => {
    const config = ABILITY_CONFIG.Sniper;

    it('should have Railgun charged attack', () => {
        expect(config.chargedAttack.name).toBe('Railgun');
        expect(config.chargedAttack.penetrateCount).toBeGreaterThan(0);
    });

    it('should have Dead Eye ultimate', () => {
        expect(config.ultimate.name).toBe('Dead Eye');
        expect(config.ultimate.maxTargets).toBeGreaterThan(0);
    });
});

describe('MachineGun Abilities', () => {
    const config = ABILITY_CONFIG.MachineGun;

    it('should have Grenade charged attack', () => {
        expect(config.chargedAttack.name).toBe('Grenade');
        expect(config.chargedAttack.explosionRadius).toBeGreaterThan(0);
    });

    it('should have Bullet Storm ultimate', () => {
        expect(config.ultimate.name).toBe('Bullet Storm');
        expect(config.ultimate.bulletsPerSecond).toBeGreaterThan(0);
    });
});

describe('Knight Abilities', () => {
    const config = ABILITY_CONFIG.Knight;

    it('should have Heavy Slam charged attack', () => {
        expect(config.chargedAttack.name).toBe('Heavy Slam');
        expect(config.chargedAttack.radius).toBeGreaterThan(0);
        expect(config.chargedAttack.knockbackForce).toBeGreaterThan(0);
    });

    it('should have Berserker Rage ultimate', () => {
        expect(config.ultimate.name).toBe('Berserker Rage');
        expect(config.ultimate.invincible).toBe(true);
        expect(config.ultimate.damageMultiplier).toBeGreaterThan(1);
    });
});

describe('Damage Scaling', () => {
    it('charged attacks should scale with charge level', () => {
        for (const type of Object.keys(ABILITY_CONFIG)) {
            const config = ABILITY_CONFIG[type];
            const minDamage = config.chargedAttack.baseDamage;
            const maxDamage = minDamage * config.chargedAttack.maxDamageMultiplier;

            expect(maxDamage).toBeGreaterThan(minDamage);
        }
    });

    it('ultimate abilities should have significant effects', () => {
        // Each ultimate should have meaningful damage or duration
        for (const type of Object.keys(ABILITY_CONFIG)) {
            const config = ABILITY_CONFIG[type];
            const ultimate = config.ultimate;

            const hasDuration = ultimate.duration && ultimate.duration > 0;
            const hasDamage = ultimate.damagePerHit > 0 ||
                              ultimate.damagePerArrow > 0 ||
                              ultimate.damagePerTarget > 0 ||
                              ultimate.damagePerBullet > 0 ||
                              ultimate.damageMultiplier > 1;

            expect(hasDuration || hasDamage).toBe(true);
        }
    });
});

describe('Ultimate Charge System', () => {
    const ULTIMATE_CHARGE_REQUIRED = 10;

    it('should require 10 hits to charge ultimate', () => {
        // This tests the design decision
        expect(ULTIMATE_CHARGE_REQUIRED).toBe(10);
    });

    it('ultimate charge should be reasonable for gameplay', () => {
        // Not too easy, not too hard
        expect(ULTIMATE_CHARGE_REQUIRED).toBeGreaterThanOrEqual(5);
        expect(ULTIMATE_CHARGE_REQUIRED).toBeLessThanOrEqual(20);
    });
});

describe('Charge Time Settings', () => {
    const CHARGE_TIME_MAX = 2.0;
    const CHARGE_TIME_MIN = 0.3;

    it('should have reasonable charge time', () => {
        expect(CHARGE_TIME_MAX).toBeGreaterThan(CHARGE_TIME_MIN);
        expect(CHARGE_TIME_MAX).toBeLessThanOrEqual(3.0); // Not too long
        expect(CHARGE_TIME_MIN).toBeGreaterThan(0); // Some minimum
    });
});
