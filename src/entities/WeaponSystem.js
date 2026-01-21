import * as THREE from 'three';

export class WeaponSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.fpWeaponView = null;
        this.onHit = null; // Callback when hitting enemy
        this.onKill = null; // Callback when killing enemy
    }

    /**
     * Set hit/kill callbacks
     */
    setCallbacks(onHit, onKill) {
        this.onHit = onHit;
        this.onKill = onKill;
    }

    /**
     * Connect to FirstPersonWeaponView for recoil animation
     */
    setFPWeaponView(fpWeaponView) {
        this.fpWeaponView = fpWeaponView;
    }

    fire(playerClass, camera, enemies) {
        const origin = camera.position;
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);

        // Trigger recoil animation on weapon view
        if (this.fpWeaponView) {
            this.fpWeaponView.triggerRecoil(playerClass.type);
        }

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

    /**
     * Find zombie entity from a hit mesh (could be child of zombie group)
     */
    findZombieFromHit(hitObject, enemies) {
        for (const enemy of enemies) {
            // Check if hit object is the zombie mesh or any of its children
            let current = hitObject;
            while (current) {
                if (current === enemy.mesh) {
                    return enemy;
                }
                current = current.parent;
            }
        }
        return null;
    }

    meleeAttack(origin, direction, enemies, damage) {
        // Short range raycast - check all children recursively
        const raycaster = new THREE.Raycaster(origin, direction, 0, 4); // 4 units range for melee
        const allMeshes = [];
        enemies.forEach(e => {
            e.mesh.traverse(child => {
                if (child.isMesh) allMeshes.push(child);
            });
        });

        const intersects = raycaster.intersectObjects(allMeshes);

        if (intersects.length > 0) {
            const hitEnemy = this.findZombieFromHit(intersects[0].object, enemies);
            if (hitEnemy && !hitEnemy.isDead) {
                const willKill = hitEnemy.logic.hp <= damage;
                hitEnemy.takeDamage(damage);

                // Trigger callbacks
                if (this.onHit) this.onHit(hitEnemy);
                if (willKill && this.onKill) this.onKill(hitEnemy);
            }
        }
    }

    hitscanAttack(origin, direction, enemies, damage) {
        const raycaster = new THREE.Raycaster(origin, direction, 0, 100);
        const allMeshes = [];
        enemies.forEach(e => {
            e.mesh.traverse(child => {
                if (child.isMesh) allMeshes.push(child);
            });
        });

        const intersects = raycaster.intersectObjects(allMeshes);

        if (intersects.length > 0) {
            const hitEnemy = this.findZombieFromHit(intersects[0].object, enemies);
            if (hitEnemy && !hitEnemy.isDead) {
                const willKill = hitEnemy.logic.hp <= damage;
                hitEnemy.takeDamage(damage);

                // Trigger callbacks
                if (this.onHit) this.onHit(hitEnemy);
                if (willKill && this.onKill) this.onKill(hitEnemy);
            }
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

            // Collision - check against zombie center (not foot position)
            let hit = false;
            for (const enemy of enemies) {
                if (enemy.isDead) continue;

                // Get zombie center position (y=1.0 is roughly center of zombie)
                const zombieCenter = enemy.mesh.position.clone();
                zombieCenter.y += 1.0;

                // Check distance to zombie center with larger hitbox
                if (p.mesh.position.distanceTo(zombieCenter) < 1.2) {
                    const willKill = enemy.logic.hp <= p.damage;
                    enemy.takeDamage(p.damage);

                    // Trigger callbacks
                    if (this.onHit) this.onHit(enemy);
                    if (willKill && this.onKill) this.onKill(enemy);

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
