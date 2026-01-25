import { describe, it, expect } from 'vitest';

/**
 * Tests for collision detection and distance calculations
 * These tests ensure items can be collected properly regardless of Y position
 */

describe('Item Collection Distance', () => {
    // Helper function that mirrors the game's horizontal distance calculation
    function calculateHorizontalDistance(itemPos, playerPos) {
        const dx = itemPos.x - playerPos.x;
        const dz = itemPos.z - playerPos.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    // Old (incorrect) method that used 3D distance
    function calculate3DDistance(itemPos, playerPos) {
        const dx = itemPos.x - playerPos.x;
        const dy = itemPos.y - playerPos.y;
        const dz = itemPos.z - playerPos.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    const COLLECTION_THRESHOLD = 2.0;
    const PLAYER_CAMERA_Y = 1.6;
    const ITEM_Y = 0.5;

    it('should use horizontal distance for item collection', () => {
        const itemPos = { x: 0, y: ITEM_Y, z: 0 };
        const playerPos = { x: 1.0, y: PLAYER_CAMERA_Y, z: 0 };

        const horizontalDist = calculateHorizontalDistance(itemPos, playerPos);
        const dist3D = calculate3DDistance(itemPos, playerPos);

        // Horizontal distance should be 1.0
        expect(horizontalDist).toBeCloseTo(1.0, 5);

        // 3D distance would be larger due to Y difference
        expect(dist3D).toBeGreaterThan(horizontalDist);

        // With horizontal distance, player is within range
        expect(horizontalDist).toBeLessThan(COLLECTION_THRESHOLD);
    });

    it('should collect items when player is directly above', () => {
        const itemPos = { x: 5, y: ITEM_Y, z: 5 };
        const playerPos = { x: 5, y: PLAYER_CAMERA_Y, z: 5 };

        const horizontalDist = calculateHorizontalDistance(itemPos, playerPos);
        expect(horizontalDist).toBe(0);
        expect(horizontalDist).toBeLessThan(COLLECTION_THRESHOLD);
    });

    it('should not collect items outside horizontal range', () => {
        const itemPos = { x: 0, y: ITEM_Y, z: 0 };
        const playerPos = { x: 3, y: PLAYER_CAMERA_Y, z: 0 };

        const horizontalDist = calculateHorizontalDistance(itemPos, playerPos);
        expect(horizontalDist).toBe(3);
        expect(horizontalDist).toBeGreaterThan(COLLECTION_THRESHOLD);
    });

    it('should handle diagonal distance correctly', () => {
        const itemPos = { x: 0, y: ITEM_Y, z: 0 };
        const playerPos = { x: 1, y: PLAYER_CAMERA_Y, z: 1 };

        const horizontalDist = calculateHorizontalDistance(itemPos, playerPos);
        // sqrt(1^2 + 1^2) = sqrt(2) ≈ 1.414
        expect(horizontalDist).toBeCloseTo(Math.sqrt(2), 5);
        expect(horizontalDist).toBeLessThan(COLLECTION_THRESHOLD);
    });

    it('Y position should not affect collection', () => {
        const itemPos1 = { x: 1, y: 0, z: 0 };
        const itemPos2 = { x: 1, y: 100, z: 0 };
        const playerPos = { x: 0, y: PLAYER_CAMERA_Y, z: 0 };

        const dist1 = calculateHorizontalDistance(itemPos1, playerPos);
        const dist2 = calculateHorizontalDistance(itemPos2, playerPos);

        // Both should have the same horizontal distance
        expect(dist1).toBe(dist2);
        expect(dist1).toBe(1);
    });
});

describe('Zombie Attack Range', () => {
    function calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    const ATTACK_RANGE = 1.5;

    it('should detect zombie in attack range', () => {
        const zombiePos = { x: 1, z: 0 };
        const playerPos = { x: 0, z: 0 };

        const dist = calculateDistance(zombiePos, playerPos);
        expect(dist).toBeLessThanOrEqual(ATTACK_RANGE);
    });

    it('should detect zombie outside attack range', () => {
        const zombiePos = { x: 2, z: 0 };
        const playerPos = { x: 0, z: 0 };

        const dist = calculateDistance(zombiePos, playerPos);
        expect(dist).toBeGreaterThan(ATTACK_RANGE);
    });
});
