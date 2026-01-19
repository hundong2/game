import * as THREE from 'three';

export class WeaponSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
    }

    fire(playerClass, camera, enemies) {
        const origin = camera.position;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);

        switch (playerClass.type) {
            case 'Knight':
                this.meleeAttack(origin, direction, enemies, playerClass.damage);
                break;
            case 'Sniper':
            case 'MachineGun':
                this.hitscanAttack(origin, direction, enemies, playerClass.damage);
                break;
            case 'Archer':
            case 'Wizard':
                this.spawnProjectile(origin, direction, playerClass.damage, playerClass.type);
                break;
        }
    }

    meleeAttack(origin, direction, enemies, damage) {
        // Short range raycast or box check
        const raycaster = new THREE.Raycaster(origin, direction, 0, 3); // 3 units range
        const intersects = raycaster.intersectObjects(enemies.map(e => e.mesh));

        if (intersects.length > 0) {
            const hitEnemy = enemies.find(e => e.mesh === intersects[0].object);
            if (hitEnemy) hitEnemy.takeDamage(damage);
        }
    }

    hitscanAttack(origin, direction, enemies, damage) {
        const raycaster = new THREE.Raycaster(origin, direction, 0, 100);
        const intersects = raycaster.intersectObjects(enemies.map(e => e.mesh));

        if (intersects.length > 0) {
            const hitEnemy = enemies.find(e => e.mesh === intersects[0].object);
            if (hitEnemy) hitEnemy.takeDamage(damage);
        }
    }

    spawnProjectile(origin, direction, damage, type) {
        const geometry = type === 'Wizard' ? new THREE.SphereGeometry(0.2) : new THREE.CylinderGeometry(0.05, 0.05, 1);
        const material = new THREE.MeshBasicMaterial({ color: type === 'Wizard' ? 0x00ffff : 0x8b4513 });
        const mesh = new THREE.Mesh(geometry, material);

        mesh.position.copy(origin).add(direction.clone().multiplyScalar(1)); // Start slightly in front
        if (type === 'Archer') mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

        this.scene.add(mesh);

        this.projectiles.push({
            mesh,
            velocity: direction.clone().multiplyScalar(type === 'Wizard' ? 15 : 25),
            damage,
            gravity: type === 'Archer' ? 5 : 0, // Arrows have gravity
            life: 2.0 // Seconds
        });
    }

    update(delta, enemies) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            // Movement
            p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));
            if (p.gravity > 0) p.velocity.y -= p.gravity * delta;

            // Rotation for arrows
            if (p.gravity > 0) {
                 const dir = p.velocity.clone().normalize();
                 p.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
            }

            p.life -= delta;

            // Collision
            // Simple distance check for optimization instead of raycast every frame
            let hit = false;
            for (const enemy of enemies) {
                if (p.mesh.position.distanceTo(enemy.mesh.position) < 1.0) {
                    enemy.takeDamage(p.damage);
                    hit = true;
                    break;
                }
            }

            if (hit || p.life <= 0 || p.mesh.position.y < 0) {
                this.scene.remove(p.mesh);
                this.projectiles.splice(i, 1);
            }
        }
    }
}
