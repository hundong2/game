import * as THREE from 'three';

export class ZombieEntity {
    constructor(scene, x, z, zombieLogic) {
        this.scene = scene;
        this.logic = zombieLogic; // The Logic/Zombie.js instance

        // Visuals
        const geometry = new THREE.BoxGeometry(1, 2, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(x, 1, z);
        this.mesh.castShadow = true;

        this.scene.add(this.mesh);

        this.isDead = false;
    }

    update(delta, playerPosition) {
        if (this.isDead) return;

        // Simple Chase AI
        const direction = new THREE.Vector3()
            .subVectors(playerPosition, this.mesh.position)
            .normalize();

        // Ignore Y difference for movement (ground level)
        direction.y = 0;

        this.mesh.position.add(direction.multiplyScalar(this.logic.speed * delta));

        // Face player
        this.mesh.lookAt(playerPosition.x, 1, playerPosition.z);
    }

    takeDamage(amount) {
        this.logic.hp -= amount;

        // Flash red
        this.mesh.material.color.setHex(0xff0000);
        setTimeout(() => {
            if (!this.isDead) this.mesh.material.color.setHex(0x00ff00);
        }, 100);

        if (this.logic.hp <= 0) {
            this.die();
        }
    }

    die() {
        this.isDead = true;
        this.scene.remove(this.mesh);
        // Add particle effect or animation here if time permits
    }
}
