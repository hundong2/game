import { describe, it, expect } from 'vitest';
import { GameState } from '../logic/GameState';
import { Character, Wizard, Archer, Sniper, MachineGun, Knight } from '../logic/Characters';
import { Zombie } from '../logic/Zombie';

describe('Character Classes', () => {
    it('should have 5 distinct classes', () => {
        expect(new Wizard()).toBeInstanceOf(Character);
        expect(new Archer()).toBeInstanceOf(Character);
        expect(new Sniper()).toBeInstanceOf(Character);
        expect(new MachineGun()).toBeInstanceOf(Character);
        expect(new Knight()).toBeInstanceOf(Character);
    });

    it('should have different stats for classes', () => {
        const archer = new Archer();
        const knight = new Knight();

        // Requirement: Archer is faster but weaker defense than Knight
        expect(archer.speed).toBeGreaterThan(knight.speed);
        expect(knight.defense).toBeGreaterThan(archer.defense);
    });
});

describe('Zombie Scaling', () => {
    it('should scale stats with stage', () => {
        const stage1Zombie = new Zombie(1);
        const stage2Zombie = new Zombie(2);

        expect(stage2Zombie.maxHp).toBeGreaterThan(stage1Zombie.maxHp);
        expect(stage2Zombie.damage).toBeGreaterThanOrEqual(stage1Zombie.damage);
    });

    it('should scale significantly after stage 20 (Loop reset)', () => {
        // Stage 21 is Loop 2 Stage 1 basically
        const stage1Zombie = new Zombie(1);
        const stage21Zombie = new Zombie(21);

        expect(stage21Zombie.maxHp).toBeGreaterThan(stage1Zombie.maxHp * 1.5); // Arbitrary scaling check
    });
});

describe('GameState', () => {
    it('should track current stage', () => {
        const game = new GameState();
        expect(game.currentStage).toBe(1);
    });

    it('should reset to stage 1 but increase difficulty loop after stage 20', () => {
        const game = new GameState();
        game.currentStage = 20;
        game.nextStage();

        expect(game.currentStage).toBe(1);
        expect(game.loopCount).toBe(2);
    });
});
