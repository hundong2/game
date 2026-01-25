import * as THREE from 'three';

/**
 * Map Objects - Creates various objects for the game environment
 */
export class MapObjects {

    /**
     * Create a concrete barrier (indestructible cover)
     */
    static createConcreteBarrier() {
        const group = new THREE.Group();

        const concreteMat = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.9,
            metalness: 0.1
        });

        // Main barrier
        const barrierGeo = new THREE.BoxGeometry(2, 1, 0.5);
        const barrier = new THREE.Mesh(barrierGeo, concreteMat);
        barrier.position.y = 0.5;
        barrier.castShadow = true;
        barrier.receiveShadow = true;

        // Damage marks
        const markMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
        for (let i = 0; i < 3; i++) {
            const markGeo = new THREE.PlaneGeometry(0.1, 0.15);
            const mark = new THREE.Mesh(markGeo, markMat);
            mark.position.set(
                (Math.random() - 0.5) * 1.8,
                0.2 + Math.random() * 0.6,
                0.26
            );
            mark.rotation.z = Math.random() * 0.5;
            group.add(mark);
        }

        group.add(barrier);
        group.userData = { type: 'cover', destructible: false, blocking: true };

        return group;
    }

    /**
     * Create a wooden crate (destructible)
     */
    static createWoodenCrate(size = 1) {
        const group = new THREE.Group();

        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.8
        });

        const darkWoodMat = new THREE.MeshStandardMaterial({
            color: 0x5C3317,
            roughness: 0.9
        });

        // Main crate
        const crateGeo = new THREE.BoxGeometry(size, size, size);
        const crate = new THREE.Mesh(crateGeo, woodMat);
        crate.position.y = size / 2;
        crate.castShadow = true;
        crate.receiveShadow = true;

        // Edge trim
        const trimGeo = new THREE.BoxGeometry(size + 0.05, 0.08, size + 0.05);
        const topTrim = new THREE.Mesh(trimGeo, darkWoodMat);
        topTrim.position.y = size;
        const bottomTrim = new THREE.Mesh(trimGeo.clone(), darkWoodMat);
        bottomTrim.position.y = 0;

        // Cross pattern on sides
        const crossGeo = new THREE.BoxGeometry(size * 0.1, size * 0.8, 0.02);
        const cross1 = new THREE.Mesh(crossGeo, darkWoodMat);
        cross1.position.set(0, size / 2, size / 2 + 0.02);
        cross1.rotation.z = Math.PI / 4;

        const cross2 = new THREE.Mesh(crossGeo.clone(), darkWoodMat);
        cross2.position.set(0, size / 2, size / 2 + 0.02);
        cross2.rotation.z = -Math.PI / 4;

        group.add(crate, topTrim, bottomTrim, cross1, cross2);
        group.userData = {
            type: 'crate',
            destructible: true,
            hp: 50,
            maxHp: 50,
            blocking: true
        };

        return group;
    }

    /**
     * Create a car wreck (partial cover)
     */
    static createCarWreck() {
        const group = new THREE.Group();

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a4a,
            roughness: 0.7,
            metalness: 0.3
        });

        const rustMat = new THREE.MeshStandardMaterial({
            color: 0x6b3a2a,
            roughness: 0.9
        });

        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x4a6a8a,
            transparent: true,
            opacity: 0.3,
            roughness: 0.1
        });

        // Car body
        const bodyGeo = new THREE.BoxGeometry(4, 1.2, 2);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, 0.6, 0);
        body.castShadow = true;

        // Roof
        const roofGeo = new THREE.BoxGeometry(2.5, 0.8, 1.8);
        const roof = new THREE.Mesh(roofGeo, bodyMat);
        roof.position.set(-0.2, 1.6, 0);

        // Windows (broken)
        const windowGeo = new THREE.PlaneGeometry(0.8, 0.5);
        const leftWindow = new THREE.Mesh(windowGeo, glassMat);
        leftWindow.position.set(-0.5, 1.5, 0.91);
        leftWindow.rotation.x = 0.1;

        // Hood (dented)
        const hoodGeo = new THREE.BoxGeometry(1.5, 0.2, 1.8);
        const hood = new THREE.Mesh(hoodGeo, rustMat);
        hood.position.set(1.5, 0.9, 0);
        hood.rotation.z = -0.1;

        // Wheels (flat)
        const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.2, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });

        const wheels = [];
        const wheelPositions = [
            [-1.2, 0.25, 1],
            [-1.2, 0.25, -1],
            [1.2, 0.25, 1],
            [1.2, 0.2, -1]
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(...pos);
            wheels.push(wheel);
            group.add(wheel);
        });

        // Rust patches
        for (let i = 0; i < 5; i++) {
            const rustGeo = new THREE.PlaneGeometry(0.3, 0.2);
            const rust = new THREE.Mesh(rustGeo, rustMat);
            rust.position.set(
                (Math.random() - 0.5) * 3,
                0.3 + Math.random() * 1,
                1.01
            );
            group.add(rust);
        }

        group.add(body, roof, leftWindow, hood);
        group.userData = { type: 'car', destructible: false, blocking: true };

        return group;
    }

    /**
     * Create sandbags (low cover)
     */
    static createSandbags() {
        const group = new THREE.Group();

        const sandMat = new THREE.MeshStandardMaterial({
            color: 0x8B7355,
            roughness: 1
        });

        // Create individual sandbags
        const bagGeo = new THREE.CapsuleGeometry(0.15, 0.4, 8, 16);

        // Bottom row
        for (let i = 0; i < 4; i++) {
            const bag = new THREE.Mesh(bagGeo, sandMat);
            bag.rotation.z = Math.PI / 2;
            bag.position.set(i * 0.45 - 0.7, 0.15, 0);
            bag.castShadow = true;
            group.add(bag);
        }

        // Second row (offset)
        for (let i = 0; i < 3; i++) {
            const bag = new THREE.Mesh(bagGeo, sandMat);
            bag.rotation.z = Math.PI / 2;
            bag.position.set(i * 0.45 - 0.45, 0.45, 0);
            bag.castShadow = true;
            group.add(bag);
        }

        // Top row
        for (let i = 0; i < 2; i++) {
            const bag = new THREE.Mesh(bagGeo, sandMat);
            bag.rotation.z = Math.PI / 2;
            bag.position.set(i * 0.45 - 0.2, 0.75, 0);
            bag.castShadow = true;
            group.add(bag);
        }

        group.userData = { type: 'sandbags', destructible: false, blocking: true };

        return group;
    }

    /**
     * Create explosive barrel (dangerous!)
     */
    static createExplosiveBarrel() {
        const group = new THREE.Group();

        const barrelMat = new THREE.MeshStandardMaterial({
            color: 0xcc3333,
            roughness: 0.6,
            metalness: 0.3
        });

        const stripeMat = new THREE.MeshStandardMaterial({
            color: 0xffcc00,
            roughness: 0.5
        });

        // Barrel body
        const barrelGeo = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.y = 0.6;
        barrel.castShadow = true;

        // Warning stripes
        const stripeGeo = new THREE.TorusGeometry(0.41, 0.03, 8, 32);
        const stripe1 = new THREE.Mesh(stripeGeo, stripeMat);
        stripe1.rotation.x = Math.PI / 2;
        stripe1.position.y = 0.3;

        const stripe2 = new THREE.Mesh(stripeGeo.clone(), stripeMat);
        stripe2.rotation.x = Math.PI / 2;
        stripe2.position.y = 0.9;

        // Hazard symbol (simplified)
        const symbolGeo = new THREE.PlaneGeometry(0.3, 0.3);
        const symbolMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.8
        });
        const symbol = new THREE.Mesh(symbolGeo, symbolMat);
        symbol.position.set(0, 0.6, 0.41);

        // Glowing effect when damaged
        const glowLight = new THREE.PointLight(0xff3300, 0, 5);
        glowLight.position.y = 0.6;

        group.add(barrel, stripe1, stripe2, symbol, glowLight);
        group.userData = {
            type: 'explosive',
            destructible: true,
            hp: 30,
            maxHp: 30,
            blocking: true,
            explodeRadius: 5,
            explodeDamage: 100,
            glowLight: glowLight
        };

        return group;
    }

    /**
     * Create a ruined wall piece
     */
    static createRuinedWall() {
        const group = new THREE.Group();

        const brickMat = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9
        });

        const concreteMat = new THREE.MeshStandardMaterial({
            color: 0x666666,
            roughness: 0.95
        });

        // Main wall section
        const wallGeo = new THREE.BoxGeometry(3, 2, 0.3);
        const wall = new THREE.Mesh(wallGeo, brickMat);
        wall.position.set(0, 1, 0);
        wall.castShadow = true;
        wall.receiveShadow = true;

        // Broken top edge (irregular)
        for (let i = 0; i < 5; i++) {
            const rubbleGeo = new THREE.BoxGeometry(
                0.3 + Math.random() * 0.3,
                0.2 + Math.random() * 0.3,
                0.3
            );
            const rubble = new THREE.Mesh(rubbleGeo, brickMat);
            rubble.position.set(
                -1 + i * 0.5,
                2 + Math.random() * 0.3,
                0
            );
            rubble.rotation.z = (Math.random() - 0.5) * 0.3;
            group.add(rubble);
        }

        // Rubble at base
        for (let i = 0; i < 4; i++) {
            const debrisGeo = new THREE.BoxGeometry(
                0.2 + Math.random() * 0.2,
                0.1 + Math.random() * 0.1,
                0.2 + Math.random() * 0.2
            );
            const debris = new THREE.Mesh(debrisGeo, Math.random() > 0.5 ? brickMat : concreteMat);
            debris.position.set(
                (Math.random() - 0.5) * 2,
                0.05,
                0.5 + Math.random() * 0.3
            );
            debris.rotation.y = Math.random() * Math.PI;
            group.add(debris);
        }

        group.add(wall);
        group.userData = { type: 'wall', destructible: false, blocking: true };

        return group;
    }

    /**
     * Create a street lamp (destroyable)
     */
    static createStreetLamp() {
        const group = new THREE.Group();

        const poleMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.7,
            metalness: 0.5
        });

        // Pole
        const poleGeo = new THREE.CylinderGeometry(0.08, 0.1, 4, 8);
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.y = 2;
        pole.castShadow = true;

        // Base
        const baseGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.2, 8);
        const base = new THREE.Mesh(baseGeo, poleMat);
        base.position.y = 0.1;

        // Arm
        const armGeo = new THREE.BoxGeometry(0.8, 0.06, 0.06);
        const arm = new THREE.Mesh(armGeo, poleMat);
        arm.position.set(0.4, 4, 0);

        // Lamp housing
        const lampGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.3, 8);
        const lamp = new THREE.Mesh(lampGeo, poleMat);
        lamp.position.set(0.8, 3.85, 0);

        // Light (dim, flickering)
        const light = new THREE.PointLight(0xffaa66, 0.5, 10);
        light.position.set(0.8, 3.7, 0);

        group.add(pole, base, arm, lamp, light);
        group.userData = {
            type: 'lamp',
            destructible: true,
            hp: 20,
            maxHp: 20,
            blocking: false,
            light: light
        };

        return group;
    }

    /**
     * Generate a random map layout with objects
     */
    static generateMapLayout(scene, difficulty = 1) {
        const objects = [];

        // Create concrete barriers in strategic positions
        const barrierPositions = [
            { x: -8, z: -5, rotation: 0 },
            { x: 8, z: -5, rotation: 0 },
            { x: 0, z: -12, rotation: Math.PI / 4 },
            { x: -15, z: 0, rotation: Math.PI / 2 },
            { x: 15, z: 0, rotation: Math.PI / 2 },
        ];

        barrierPositions.forEach(pos => {
            const barrier = this.createConcreteBarrier();
            barrier.position.set(pos.x, 0, pos.z);
            barrier.rotation.y = pos.rotation;
            scene.add(barrier);
            objects.push(barrier);
        });

        // Add wooden crates (clusters)
        const cratePositions = [
            { x: -5, z: 8 },
            { x: -4, z: 8 },
            { x: -5, z: 9 },
            { x: 12, z: -8 },
            { x: 13, z: -8 },
        ];

        cratePositions.forEach(pos => {
            const crate = this.createWoodenCrate(1);
            crate.position.set(pos.x, 0, pos.z);
            crate.rotation.y = Math.random() * 0.3;
            scene.add(crate);
            objects.push(crate);
        });

        // Add car wrecks
        const carPositions = [
            { x: -12, z: 10, rotation: 0.3 },
            { x: 10, z: 12, rotation: -0.5 },
        ];

        carPositions.forEach(pos => {
            const car = this.createCarWreck();
            car.position.set(pos.x, 0, pos.z);
            car.rotation.y = pos.rotation;
            scene.add(car);
            objects.push(car);
        });

        // Add sandbag positions
        const sandbagPositions = [
            { x: 0, z: -5, rotation: 0 },
            { x: -10, z: 8, rotation: Math.PI / 4 },
        ];

        sandbagPositions.forEach(pos => {
            const sandbags = this.createSandbags();
            sandbags.position.set(pos.x, 0, pos.z);
            sandbags.rotation.y = pos.rotation;
            scene.add(sandbags);
            objects.push(sandbags);
        });

        // Add explosive barrels (dangerous!)
        const barrelPositions = [
            { x: -6, z: -10 },
            { x: 8, z: 5 },
            { x: -3, z: 15 },
        ];

        barrelPositions.forEach(pos => {
            const barrel = this.createExplosiveBarrel();
            barrel.position.set(pos.x, 0, pos.z);
            scene.add(barrel);
            objects.push(barrel);
        });

        // Add ruined walls
        const wallPositions = [
            { x: -18, z: -15, rotation: 0.2 },
            { x: 18, z: 10, rotation: -0.3 },
        ];

        wallPositions.forEach(pos => {
            const wall = this.createRuinedWall();
            wall.position.set(pos.x, 0, pos.z);
            wall.rotation.y = pos.rotation;
            scene.add(wall);
            objects.push(wall);
        });

        // Add street lamps
        const lampPositions = [
            { x: -10, z: 0 },
            { x: 10, z: 0 },
            { x: 0, z: 15 },
            { x: 0, z: -15 },
        ];

        lampPositions.forEach(pos => {
            const lamp = this.createStreetLamp();
            lamp.position.set(pos.x, 0, pos.z);
            scene.add(lamp);
            objects.push(lamp);
        });

        return objects;
    }
}
