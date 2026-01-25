import { describe, it, expect } from 'vitest';

/**
 * Tests for minimap coordinate transformation
 * These tests ensure zombies appear in the correct position relative to player's view
 */

describe('Minimap Coordinate Transformation', () => {
    const MINIMAP_SIZE = 150;
    const MINIMAP_RANGE = 40;
    const center = MINIMAP_SIZE / 2;

    /**
     * Calculate minimap position for a zombie
     * This mirrors the game's minimap calculation
     */
    function getMinimapPosition(zombiePos, playerPos, playerAngle) {
        const dx = zombiePos.x - playerPos.x;
        const dz = zombiePos.z - playerPos.z;

        // Rotation to align player's forward with minimap's "up"
        const cos = Math.cos(playerAngle);
        const sin = Math.sin(playerAngle);
        const rotatedX = dz * sin - dx * cos;  // Right-left on minimap
        const rotatedZ = dx * sin + dz * cos;  // Forward-back on minimap

        const mapX = center + (rotatedX / MINIMAP_RANGE) * (center * 0.9);
        const mapY = center - (rotatedZ / MINIMAP_RANGE) * (center * 0.9);

        return { mapX, mapY, rotatedX, rotatedZ };
    }

    describe('Player facing -Z (default Three.js forward)', () => {
        // Camera looking at -Z: playerAngle = atan2(0, -1) = Math.PI
        const playerAngle = Math.PI;
        const playerPos = { x: 0, z: 0 };

        it('zombie in front should appear above center', () => {
            const zombiePos = { x: 0, z: -10 }; // In front when facing -Z
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedZ).toBeGreaterThan(0); // Positive = in front
            expect(result.rotatedX).toBeCloseTo(0, 5); // Centered
            expect(result.mapY).toBeLessThan(center); // Above center on screen
        });

        it('zombie behind should appear below center', () => {
            const zombiePos = { x: 0, z: 10 }; // Behind when facing -Z
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedZ).toBeLessThan(0); // Negative = behind
            expect(result.mapY).toBeGreaterThan(center); // Below center on screen
        });

        it('zombie to right should appear on right side', () => {
            const zombiePos = { x: 10, z: 0 }; // Right when facing -Z
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedX).toBeGreaterThan(0); // Positive = right
            expect(result.mapX).toBeGreaterThan(center); // Right side of minimap
        });

        it('zombie to left should appear on left side', () => {
            const zombiePos = { x: -10, z: 0 }; // Left when facing -Z
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedX).toBeLessThan(0); // Negative = left
            expect(result.mapX).toBeLessThan(center); // Left side of minimap
        });
    });

    describe('Player facing +X', () => {
        // Camera looking at +X: playerAngle = atan2(1, 0) = Math.PI / 2
        const playerAngle = Math.PI / 2;
        const playerPos = { x: 0, z: 0 };

        it('zombie in front (+X direction) should appear above center', () => {
            const zombiePos = { x: 10, z: 0 }; // In front when facing +X
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedZ).toBeGreaterThan(0); // In front
            expect(result.rotatedX).toBeCloseTo(0, 5); // Centered
            expect(result.mapY).toBeLessThan(center); // Above center
        });

        it('zombie to right (+Z direction) should appear on right side', () => {
            const zombiePos = { x: 0, z: 10 }; // Right when facing +X
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedX).toBeGreaterThan(0); // Right
            expect(result.mapX).toBeGreaterThan(center);
        });

        it('zombie to left (-Z direction) should appear on left side', () => {
            const zombiePos = { x: 0, z: -10 }; // Left when facing +X
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedX).toBeLessThan(0); // Left
            expect(result.mapX).toBeLessThan(center);
        });
    });

    describe('Player facing +Z', () => {
        // Camera looking at +Z: playerAngle = atan2(0, 1) = 0
        const playerAngle = 0;
        const playerPos = { x: 0, z: 0 };

        it('zombie in front (+Z direction) should appear above center', () => {
            const zombiePos = { x: 0, z: 10 }; // In front when facing +Z
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedZ).toBeGreaterThan(0);
            expect(result.mapY).toBeLessThan(center);
        });

        it('zombie to right (-X direction) should appear on right side', () => {
            const zombiePos = { x: -10, z: 0 }; // Right when facing +Z
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedX).toBeGreaterThan(0);
            expect(result.mapX).toBeGreaterThan(center);
        });
    });

    describe('Player facing -X', () => {
        // Camera looking at -X: playerAngle = atan2(-1, 0) = -Math.PI / 2
        const playerAngle = -Math.PI / 2;
        const playerPos = { x: 0, z: 0 };

        it('zombie in front (-X direction) should appear above center', () => {
            const zombiePos = { x: -10, z: 0 }; // In front when facing -X
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedZ).toBeGreaterThan(0);
            expect(result.mapY).toBeLessThan(center);
        });
    });

    describe('Distance culling', () => {
        it('should only show zombies within MINIMAP_RANGE', () => {
            const playerPos = { x: 0, z: 0 };

            const nearZombie = { x: 30, z: 0 };
            const farZombie = { x: 50, z: 0 };

            const nearDist = Math.sqrt(nearZombie.x ** 2 + nearZombie.z ** 2);
            const farDist = Math.sqrt(farZombie.x ** 2 + farZombie.z ** 2);

            expect(nearDist).toBeLessThan(MINIMAP_RANGE);
            expect(farDist).toBeGreaterThan(MINIMAP_RANGE);
        });
    });

    describe('Diagonal positions', () => {
        const playerAngle = Math.PI; // Facing -Z
        const playerPos = { x: 0, z: 0 };

        it('zombie in front-right should appear above-right', () => {
            const zombiePos = { x: 10, z: -10 }; // Front-right when facing -Z
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedZ).toBeGreaterThan(0); // In front
            expect(result.rotatedX).toBeGreaterThan(0); // To right
            expect(result.mapY).toBeLessThan(center);
            expect(result.mapX).toBeGreaterThan(center);
        });

        it('zombie in back-left should appear below-left', () => {
            const zombiePos = { x: -10, z: 10 }; // Back-left when facing -Z
            const result = getMinimapPosition(zombiePos, playerPos, playerAngle);

            expect(result.rotatedZ).toBeLessThan(0); // Behind
            expect(result.rotatedX).toBeLessThan(0); // To left
            expect(result.mapY).toBeGreaterThan(center);
            expect(result.mapX).toBeLessThan(center);
        });
    });
});
