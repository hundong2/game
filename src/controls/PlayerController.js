import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class PlayerController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        this.controls = new PointerLockControls(camera, domElement);

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        this.speed = 10.0; // Default, will be overridden by Character stats
        this.isLocked = false;

        this.initListeners();
    }

    initListeners() {
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = true; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = true; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = true; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = true; break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW': this.moveForward = false; break;
                case 'ArrowLeft':
                case 'KeyA': this.moveLeft = false; break;
                case 'ArrowDown':
                case 'KeyS': this.moveBackward = false; break;
                case 'ArrowRight':
                case 'KeyD': this.moveRight = false; break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        this.controls.addEventListener('lock', () => { this.isLocked = true; });
        this.controls.addEventListener('unlock', () => { this.isLocked = false; });

        // Mobile Touch Listeners
        this.touchStart = { x: 0, y: 0 };
        this.lookSpeed = 2.0;

        this.domElement.addEventListener('touchstart', (e) => {
             // Basic touch logic
             if (e.touches.length > 0) {
                 this.moveForward = true; // Auto walk on touch for now as simple fallback
                 this.touchStart.x = e.touches[0].pageX;
                 this.touchStart.y = e.touches[0].pageY;
             }
        }, { passive: false });

        this.domElement.addEventListener('touchend', () => {
             this.moveForward = false;
        });

        this.domElement.addEventListener('touchmove', (e) => {
             if (e.touches.length > 0) {
                 const deltaX = (e.touches[0].pageX - this.touchStart.x) * 0.002;
                 const deltaY = (e.touches[0].pageY - this.touchStart.y) * 0.002;

                 this.controls.getObject().rotation.y -= deltaX * this.lookSpeed;

                 this.touchStart.x = e.touches[0].pageX;
                 this.touchStart.y = e.touches[0].pageY;
             }
             e.preventDefault();
        }, { passive: false });

        this.domElement.addEventListener('click', () => {
            if (!this.isLocked) this.controls.lock();
        });
    }

    update(delta) {
        // if (!this.isLocked) return; // Allow movement without lock for touch

        this.velocity.x -= this.velocity.x * 10.0 * delta;
        this.velocity.z -= this.velocity.z * 10.0 * delta;

        this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
        this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
        this.direction.normalize();

        if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * this.speed * 10.0 * delta;
        if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * this.speed * 10.0 * delta;

        this.controls.moveRight(-this.velocity.x * delta);
        this.controls.moveForward(-this.velocity.z * delta);
    }

    setSpeed(speed) {
        this.speed = speed;
    }
}
