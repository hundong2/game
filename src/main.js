import * as THREE from 'three';
import { setupEnvironment } from './world/Environment';
import { PlayerController } from './controls/PlayerController';
import { GameState } from './logic/GameState';
import * as Characters from './logic/Characters';
import { Zombie } from './logic/Zombie';
import { ZombieEntity } from './entities/ZombieEntity';
import { WeaponSystem } from './entities/WeaponSystem';

// --- Initialization ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
const container = document.getElementById('game-container');
container.appendChild(renderer.domElement);

setupEnvironment(scene);

// Game State & Systems
const gameState = new GameState();
const weaponSystem = new WeaponSystem(scene);
const controller = new PlayerController(camera, renderer.domElement);

// Entities
let playerChar = null;
const zombies = [];
const ZOMBIES_PER_STAGE_BASE = 5;
let zombiesKilledInStage = 0;
let lastShotTime = 0;
let lastPlayerDamageTime = 0;
const PLAYER_IFRAME_MS = 500; // 0.5 seconds invulnerability
const isMobile = 'ontouchstart' in window;

// UI Elements
const hud = document.getElementById('hud');
const startScreen = document.getElementById('start-screen');
const crosshair = document.getElementById('crosshair');
const stageVal = document.getElementById('stage-val');
const hpVal = document.getElementById('hp-val');
const ammoVal = document.getElementById('ammo-val');

// Camera Start Pos
camera.position.set(0, 1.6, 5);

// --- Game Logic ---

function startGame(characterClass) {
    playerChar = new characterClass();

    // Apply character speed to controller
    controller.setSpeed(playerChar.speed);

    // UI Update
    startScreen.style.display = 'none';
    hud.style.display = 'block';
    crosshair.style.display = 'block';
    if (isMobile) {
        document.getElementById('mobile-controls').style.display = 'block';
    }

    // Reset State
    gameState.currentStage = 1;
    gameState.loopCount = 1;
    resetStage();

    controller.controls.lock();
}

function resetStage() {
    zombiesKilledInStage = 0;
    // Clear existing zombies
    for (const z of zombies) scene.remove(z.mesh);
    zombies.length = 0;

    updateHUD();
}

function spawnZombie() {
    // Spawn limits
    const maxZombies = 5 + gameState.currentStage;
    if (zombies.length >= maxZombies) return;

    // Random position around player
    const angle = Math.random() * Math.PI * 2;
    const distance = 20 + Math.random() * 10;
    const x = camera.position.x + Math.cos(angle) * distance;
    const z = camera.position.z + Math.sin(angle) * distance;

    const logic = new Zombie(gameState.getEffectiveLevel());
    const entity = new ZombieEntity(scene, x, z, logic);
    zombies.push(entity);
}

function checkStageProgress() {
    const requiredKills = ZOMBIES_PER_STAGE_BASE * gameState.currentStage;
    if (zombiesKilledInStage >= requiredKills) {
        gameState.nextStage();
        resetStage();
        // Maybe show a "Stage Clear" message temporarily
    }
}

function updateHUD() {
    if (!playerChar) return;
    stageVal.innerText = `${gameState.currentStage} (Loop ${gameState.loopCount})`;
    hpVal.innerText = Math.ceil(playerChar.hp);
    ammoVal.innerText = '∞';
}

// --- Input Handling ---

const handleFire = () => {
    if (!playerChar) return;
    // Allow firing if locked (PC) or if mobile (Touch)
    if (!controller.isLocked && !isMobile) return;

    const now = Date.now();
    // Simple fire rate limit (e.g., 500ms for Knight, 100ms for MachineGun)
    let fireRate = 500;
    if (playerChar instanceof Characters.MachineGun) fireRate = 100;
    if (playerChar instanceof Characters.Sniper) fireRate = 1000;

    if (now - lastShotTime > fireRate) {
        weaponSystem.fire(playerChar, camera, zombies);
        lastShotTime = now;

        // Recoil / feedback could go here
    }
};

document.addEventListener('mousedown', handleFire);
document.addEventListener('touchstart', (e) => {
    // Basic mobile tap to fire (if not hitting a joystick)
    // In a real app, this would be a specific fire button
    if (e.target.id === 'game-container' || e.target.id === 'ui-layer') {
        handleFire();
    }
});

// --- Main Loop ---
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (playerChar && !playerChar.isDead) {
        controller.update(delta);
        weaponSystem.update(delta, zombies);

        // Zombie Logic
        for (let i = zombies.length - 1; i >= 0; i--) {
            const z = zombies[i];
            z.update(delta, camera.position);

            // Player Collision (Damage)
            if (z.mesh.position.distanceTo(camera.position) < 1.5) {
                const now = Date.now();
                if (now - lastPlayerDamageTime > PLAYER_IFRAME_MS) {
                    playerChar.hp -= z.logic.damage;
                    lastPlayerDamageTime = now;

                    // Visual damage feedback
                    document.body.style.backgroundColor = 'red';
                    setTimeout(() => document.body.style.backgroundColor = 'black', 100);

                    if (playerChar.hp <= 0) {
                        playerChar.hp = 0;
                        gameOver();
                    }
                }
            }

            if (z.isDead) {
                zombies.splice(i, 1);
                zombiesKilledInStage++;
                checkStageProgress();
            }
        }

        // Spawner
        if (Math.random() < 0.05) spawnZombie(); // 5% chance per frame if under limit

        updateHUD();
    }

    renderer.render(scene, camera);
}

function gameOver() {
    alert("Game Over! You reached Stage " + gameState.currentStage);
    location.reload();
}

// --- Setup UI ---
const classSelection = document.getElementById('class-selection');
const classes = [
    { name: 'Wizard', cls: Characters.Wizard },
    { name: 'Archer', cls: Characters.Archer },
    { name: 'Sniper', cls: Characters.Sniper },
    { name: 'Machine Gun', cls: Characters.MachineGun },
    { name: 'Knight', cls: Characters.Knight }
];

classes.forEach(c => {
    const btn = document.createElement('div');
    btn.className = 'class-btn';
    btn.innerText = c.name;
    btn.onclick = (e) => {
        e.stopPropagation(); // Prevent click from triggering pointerlock immediately if we want
        startGame(c.cls);
    };
    classSelection.appendChild(btn);
});

// Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
