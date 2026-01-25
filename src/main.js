import * as THREE from 'three';
import { setupEnvironment } from './world/Environment';
import { PlayerController } from './controls/PlayerController';
import { GameState } from './logic/GameState';
import * as Characters from './logic/Characters';
import { Zombie } from './logic/Zombie';
import { ZombieEntity } from './entities/ZombieEntity';
import { WeaponSystem } from './entities/WeaponSystem';
import { FirstPersonWeaponView } from './entities/FirstPersonWeaponView';
import audioManager from './audio/AudioManager';
import { gameStateManager, GameStates } from './ui/GameStateManager';
import { MapObjects } from './world/MapObjects';
import { PowerUp } from './entities/items/PowerUp';
import { AbilitySystem } from './abilities/AbilitySystem';

// --- Initialization ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
const container = document.getElementById('game-container');
container.appendChild(renderer.domElement);

setupEnvironment(scene);

// Generate map objects (cover, obstacles, etc.)
const mapObjects = MapObjects.generateMapLayout(scene);

// Game State & Systems
const gameState = new GameState();
const weaponSystem = new WeaponSystem(scene);
const controller = new PlayerController(camera, renderer.domElement);
const fpWeaponView = new FirstPersonWeaponView(renderer);

// Connect weapon system to weapon view for recoil
weaponSystem.setFPWeaponView(fpWeaponView);

// Set weapon hit/kill callbacks
weaponSystem.setCallbacks(
    (enemy) => showHitMarker(false),  // onHit
    (enemy) => showHitMarker(true)    // onKill
);

// Entities
let playerChar = null;
const zombies = [];
const powerUps = [];
const ZOMBIES_PER_STAGE_BASE = 5;
let zombiesKilledInStage = 0;
let lastShotTime = 0;
let lastPlayerDamageTime = 0;
const PLAYER_IFRAME_MS = 500; // 0.5 seconds invulnerability
const isMobile = 'ontouchstart' in window;

// Ability System
let abilitySystem = null;
let isCharging = false;
let isHoldingFire = false;

// UI Elements
const hud = document.getElementById('hud');
const startScreen = document.getElementById('start-screen');
const crosshair = document.getElementById('crosshair');
const stageVal = document.getElementById('stage-val');
const hpVal = document.getElementById('hp-val');
const ammoVal = document.getElementById('ammo-val');

// Blood overlay for damage effect
const bloodOverlay = document.createElement('div');
bloodOverlay.id = 'blood-overlay';
bloodOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 100;
    opacity: 0;
    transition: opacity 0.1s ease-in;
    background: radial-gradient(ellipse at center, transparent 40%, rgba(139, 0, 0, 0.7) 100%);
    box-shadow: inset 0 0 100px rgba(255, 0, 0, 0.5);
`;
document.body.appendChild(bloodOverlay);

// Sniper scope overlay
const scopeOverlay = document.createElement('div');
scopeOverlay.id = 'scope-overlay';
scopeOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 50;
    display: none;
    background: radial-gradient(circle at center, transparent 20%, black 21%, black 100%);
`;
// Add crosshairs to scope
scopeOverlay.innerHTML = `
    <div style="position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(0,0,0,0.8);"></div>
    <div style="position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: rgba(0,0,0,0.8);"></div>
    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 4px; height: 4px; background: red; border-radius: 50%;"></div>
`;
document.body.appendChild(scopeOverlay);

// Minimap
const minimapContainer = document.createElement('div');
minimapContainer.id = 'minimap-container';
minimapContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    background: rgba(0, 20, 0, 0.7);
    border: 3px solid rgba(0, 255, 0, 0.5);
    box-shadow: 0 0 15px rgba(0, 255, 0, 0.3), inset 0 0 30px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    z-index: 80;
    display: none;
`;

// Minimap canvas for drawing
const minimapCanvas = document.createElement('canvas');
minimapCanvas.width = 150;
minimapCanvas.height = 150;
minimapCanvas.style.cssText = `width: 100%; height: 100%;`;
minimapContainer.appendChild(minimapCanvas);
const minimapCtx = minimapCanvas.getContext('2d');

// Minimap range rings
const minimapOverlay = document.createElement('div');
minimapOverlay.innerHTML = `
    <div style="position: absolute; top: 50%; left: 50%; width: 50px; height: 50px; border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 50%; transform: translate(-50%, -50%);"></div>
    <div style="position: absolute; top: 50%; left: 50%; width: 100px; height: 100px; border: 1px solid rgba(0, 255, 0, 0.2); border-radius: 50%; transform: translate(-50%, -50%);"></div>
    <div style="position: absolute; top: 50%; left: 50%; width: 6px; height: 6px; background: #00ff00; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 0 5px #00ff00;"></div>
`;
minimapOverlay.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;`;
minimapContainer.appendChild(minimapOverlay);

document.body.appendChild(minimapContainer);

const MINIMAP_RANGE = 40; // Units visible on minimap

// Hit marker overlay (COD style)
const hitMarker = document.createElement('div');
hitMarker.id = 'hit-marker';
hitMarker.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 90;
    opacity: 0;
    transition: opacity 0.05s ease-out;
`;
hitMarker.innerHTML = `
    <svg width="40" height="40" viewBox="0 0 40 40">
        <line x1="8" y1="8" x2="16" y2="16" stroke="white" stroke-width="3"/>
        <line x1="32" y1="8" x2="24" y2="16" stroke="white" stroke-width="3"/>
        <line x1="8" y1="32" x2="16" y2="24" stroke="white" stroke-width="3"/>
        <line x1="32" y1="32" x2="24" y2="24" stroke="white" stroke-width="3"/>
    </svg>
`;
document.body.appendChild(hitMarker);

// Kill marker (skull icon)
const killMarker = document.createElement('div');
killMarker.id = 'kill-marker';
killMarker.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 91;
    opacity: 0;
    font-size: 24px;
    color: #ff3333;
    text-shadow: 0 0 10px #ff0000;
`;
killMarker.innerHTML = '💀';
document.body.appendChild(killMarker);

// Kill feed (top right notifications)
const killFeed = document.createElement('div');
killFeed.id = 'kill-feed';
killFeed.style.cssText = `
    position: fixed;
    top: 180px;
    right: 20px;
    pointer-events: none;
    z-index: 85;
    font-family: 'Arial Black', Arial, sans-serif;
    font-size: 14px;
`;
document.body.appendChild(killFeed);

// Stage announcement overlay
const stageAnnouncement = document.createElement('div');
stageAnnouncement.id = 'stage-announcement';
stageAnnouncement.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 200;
    font-family: 'Arial Black', Arial, sans-serif;
    text-align: center;
    opacity: 0;
    transition: opacity 0.3s ease-in-out;
`;
stageAnnouncement.innerHTML = `
    <div style="font-size: 64px; color: #ff4444; text-shadow: 0 0 30px #ff0000, 0 0 60px #ff0000, 2px 2px 4px black; letter-spacing: 8px;">
        STAGE <span id="stage-num">1</span>
    </div>
    <div style="font-size: 24px; color: #ffaa00; text-shadow: 0 0 15px #ff6600; margin-top: 15px; letter-spacing: 4px;">
        ZOMBIES INCOMING
    </div>
`;
document.body.appendChild(stageAnnouncement);

// Show stage announcement
function showStageAnnouncement(stageNum, loopCount) {
    const stageNumEl = document.getElementById('stage-num');
    stageNumEl.textContent = stageNum;

    // Update subtitle based on loop
    const subtitle = stageAnnouncement.querySelector('div:last-child');
    if (loopCount > 1) {
        subtitle.textContent = `LOOP ${loopCount} - NIGHTMARE MODE`;
        subtitle.style.color = '#ff00ff';
    } else {
        subtitle.textContent = 'ZOMBIES INCOMING';
        subtitle.style.color = '#ffaa00';
    }

    // Show with animation
    stageAnnouncement.style.opacity = '1';
    stageAnnouncement.style.transform = 'translate(-50%, -50%) scale(1.1)';

    setTimeout(() => {
        stageAnnouncement.style.transform = 'translate(-50%, -50%) scale(1)';
    }, 100);

    // Hide after delay
    setTimeout(() => {
        stageAnnouncement.style.opacity = '0';
    }, 2500);
}

// Damage direction indicators
const damageIndicators = document.createElement('div');
damageIndicators.id = 'damage-indicators';
damageIndicators.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 200px;
    height: 200px;
    pointer-events: none;
    z-index: 95;
`;
document.body.appendChild(damageIndicators);

// Sniper zoom state
let isZoomed = false;
const ZOOM_FOV = 20;
const NORMAL_FOV = 75;

// Camera Start Pos
camera.position.set(0, 1.6, 5);

// --- Game Logic ---

async function startGame(characterClass) {
    // Initialize audio system
    await audioManager.init();
    audioManager.startAmbientMusic();

    // Initialize game state manager
    gameStateManager.startGame();

    playerChar = new characterClass();

    // Apply character speed to controller
    controller.setSpeed(playerChar.speed);

    // Set weapon view based on character type
    fpWeaponView.setWeapon(playerChar.type);

    // Initialize ability system for this character
    if (abilitySystem) {
        abilitySystem.dispose();
    }
    abilitySystem = new AbilitySystem(scene, camera, playerChar.type);
    abilitySystem.setAudioManager(audioManager);

    // UI Update
    startScreen.style.display = 'none';
    hud.style.display = 'block';
    crosshair.style.display = 'block';
    minimapContainer.style.display = 'block';
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
    // Clear existing zombies with fade out effect
    for (const z of zombies) {
        if (!z.isDead) {
            z.isDead = true;
            scene.remove(z.mesh);
        }
    }
    zombies.length = 0;

    // Play stage clear sound (except for stage 1)
    if (gameState.currentStage > 1 || gameState.loopCount > 1) {
        audioManager.playStageClear();
    }

    // Show stage announcement
    showStageAnnouncement(gameState.currentStage, gameState.loopCount);

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

    // Determine zombie type based on stage
    const zombieType = getZombieType(gameState.currentStage, gameState.loopCount);
    const logic = new Zombie(gameState.getEffectiveLevel(), zombieType);
    const entity = new ZombieEntity(scene, x, z, logic, zombieType);
    zombies.push(entity);

    // Play spawn sound occasionally
    if (Math.random() < 0.3) {
        audioManager.playZombieSpawn();
    }
}

// Get zombie type based on stage progression
function getZombieType(stage, loop) {
    const effectiveStage = stage + (loop - 1) * 20;
    const roll = Math.random() * 100;

    // Boss spawn every 10 stages
    if (stage % 10 === 0 && zombies.filter(z => z.zombieType === 'boss').length === 0) {
        if (roll < 10) return 'boss';
    }

    // Type weights based on stage
    if (effectiveStage >= 12 && roll < 3) return 'screamer';
    if (effectiveStage >= 10 && roll < 8) return 'exploder';
    if (effectiveStage >= 7 && roll < 15) return 'spitter';
    if (effectiveStage >= 5 && roll < 20) return 'tank';
    if (effectiveStage >= 3 && roll < 35) return 'runner';

    return 'walker';
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

// Blood splatter effect when player takes damage
function showBloodEffect() {
    bloodOverlay.style.opacity = '1';
    setTimeout(() => {
        bloodOverlay.style.opacity = '0';
    }, 300);
}

// Show hit marker when hitting an enemy
function showHitMarker(isKill = false) {
    // Record hit for stats
    gameStateManager.recordHit();

    // Add ultimate charge on hit (like Overwatch)
    if (abilitySystem) {
        abilitySystem.addUltimateCharge(1);
    }

    if (isKill) {
        // Play zombie death sound
        audioManager.playZombieDeath();
        audioManager.playHeadshot();

        // Record kill for stats
        gameStateManager.recordKill();

        // Show kill marker
        killMarker.style.opacity = '1';
        killMarker.style.transform = 'translate(-50%, -50%) scale(1.5)';
        setTimeout(() => {
            killMarker.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 50);
        setTimeout(() => {
            killMarker.style.opacity = '0';
        }, 300);

        // Add to kill feed
        addKillFeedEntry();
    } else {
        // Play hit marker sound
        audioManager.playHitMarker();
    }

    // Show hit marker
    hitMarker.style.opacity = '1';
    setTimeout(() => {
        hitMarker.style.opacity = '0';
    }, 100);
}

// Show power-up collection message
function showPowerUpMessage(message) {
    const popup = document.createElement('div');
    popup.style.cssText = `
        position: fixed;
        top: 40%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-family: 'Arial Black', Arial, sans-serif;
        font-size: 24px;
        color: #00ff00;
        text-shadow: 0 0 10px rgba(0, 255, 0, 0.8), 2px 2px 4px black;
        text-transform: uppercase;
        letter-spacing: 3px;
        z-index: 150;
        pointer-events: none;
        opacity: 1;
        transition: all 0.5s ease-out;
    `;
    popup.textContent = message;
    document.body.appendChild(popup);

    // Animate up and fade out
    setTimeout(() => {
        popup.style.transform = 'translate(-50%, -100%)';
        popup.style.opacity = '0';
    }, 100);

    setTimeout(() => {
        popup.remove();
    }, 1000);
}

// Add entry to kill feed
let killCount = 0;
function addKillFeedEntry() {
    killCount++;
    const entry = document.createElement('div');
    entry.style.cssText = `
        background: rgba(0, 0, 0, 0.7);
        color: #ff4444;
        padding: 5px 12px;
        margin-bottom: 5px;
        border-left: 3px solid #ff0000;
        opacity: 1;
        transition: opacity 0.5s ease-out;
        text-transform: uppercase;
        letter-spacing: 1px;
    `;
    entry.innerHTML = `<span style="color: #fff;">YOU</span> ☠ <span style="color: #88ff88;">ZOMBIE</span>`;
    killFeed.insertBefore(entry, killFeed.firstChild);

    // Limit kill feed entries
    if (killFeed.children.length > 5) {
        killFeed.removeChild(killFeed.lastChild);
    }

    // Fade out and remove
    setTimeout(() => {
        entry.style.opacity = '0';
        setTimeout(() => {
            if (entry.parentNode) entry.parentNode.removeChild(entry);
        }, 500);
    }, 3000);
}

// Show damage direction indicator
function showDamageIndicator(zombiePosition) {
    const direction = new THREE.Vector3()
        .subVectors(zombiePosition, camera.position)
        .normalize();

    // Get camera's forward direction
    const cameraDir = new THREE.Vector3();
    camera.getWorldDirection(cameraDir);

    // Calculate angle between camera forward and zombie direction (on XZ plane)
    const angle = Math.atan2(direction.x, direction.z) - Math.atan2(cameraDir.x, cameraDir.z);

    // Create damage indicator
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: absolute;
        width: 60px;
        height: 20px;
        background: linear-gradient(to right, transparent, rgba(255, 0, 0, 0.8), transparent);
        transform-origin: center center;
        opacity: 1;
        transition: opacity 0.3s ease-out;
    `;

    // Position indicator based on angle
    const radius = 80;
    const x = Math.sin(angle) * radius;
    const y = -Math.cos(angle) * radius;
    indicator.style.left = `${100 + x - 30}px`;
    indicator.style.top = `${100 + y - 10}px`;
    indicator.style.transform = `rotate(${angle}rad)`;

    damageIndicators.appendChild(indicator);

    // Fade out and remove
    setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
            if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
        }, 300);
    }, 200);
}

// Screen shake effect
let shakeIntensity = 0;
let shakeDecay = 10;
function triggerScreenShake(intensity = 0.02) {
    shakeIntensity = intensity;
}

function updateScreenShake(delta) {
    if (shakeIntensity > 0.001) {
        const shakeX = (Math.random() - 0.5) * shakeIntensity;
        const shakeY = (Math.random() - 0.5) * shakeIntensity;
        camera.rotation.x += shakeX;
        camera.rotation.y += shakeY;
        shakeIntensity *= Math.pow(0.1, delta * shakeDecay);
    }
}

// Update minimap with zombie positions
function updateMinimap() {
    const ctx = minimapCtx;
    const size = 150;
    const center = size / 2;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Get player's forward direction for rotation
    // In Three.js, camera looks down -Z axis, so we need to adjust
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    // Get angle from player's view direction (atan2(x, z) gives angle from +Z axis)
    const playerAngle = Math.atan2(cameraDirection.x, cameraDirection.z);

    // Draw zombies
    for (const zombie of zombies) {
        if (zombie.isDead) continue;

        // Calculate relative position from player to zombie
        const dx = zombie.mesh.position.x - camera.position.x;
        const dz = zombie.mesh.position.z - camera.position.z;

        // Rotate to align player's forward direction with minimap's "up" (+Y)
        // Using rotation matrix where:
        // - rotatedX = right component (positive = zombie to player's right)
        // - rotatedZ = forward component (positive = zombie in front of player)
        const cos = Math.cos(playerAngle);
        const sin = Math.sin(playerAngle);
        const rotatedX = dz * sin - dx * cos;  // Right-left on minimap
        const rotatedZ = dx * sin + dz * cos;  // Forward-back on minimap

        // Scale to minimap coordinates
        // rotatedX: positive = right of player, negative = left
        // rotatedZ: positive = in front of player, negative = behind
        const mapX = center + (rotatedX / MINIMAP_RANGE) * (center * 0.9);
        const mapY = center - (rotatedZ / MINIMAP_RANGE) * (center * 0.9); // Negative because screen Y is inverted

        // Calculate distance for culling and intensity
        const distance = Math.sqrt(dx * dx + dz * dz);

        // Only draw if within range
        if (distance < MINIMAP_RANGE) {
            const intensity = Math.max(0.5, 1 - distance / MINIMAP_RANGE);

            // Pulsing effect for nearby zombies
            const pulseSpeed = distance < 10 ? 8 : 4;
            const pulse = 1 + Math.sin(Date.now() / 1000 * pulseSpeed) * 0.3;
            const dotSize = (distance < 10 ? 5 : 4) * pulse;

            // Draw zombie dot with glow
            ctx.save();
            ctx.beginPath();
            ctx.arc(mapX, mapY, dotSize, 0, Math.PI * 2);
            ctx.fillStyle = distance < 10 ? `rgba(255, 50, 50, ${intensity})` : `rgba(255, 0, 0, ${intensity})`;
            ctx.shadowColor = distance < 10 ? '#ff3333' : '#ff0000';
            ctx.shadowBlur = distance < 10 ? 12 : 6;
            ctx.fill();
            ctx.restore();

            // Inner bright dot
            ctx.beginPath();
            ctx.arc(mapX, mapY, 2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 200, 200, ${intensity})`;
            ctx.fill();
        }
    }

    // Draw player direction indicator (triangle pointing up = forward)
    ctx.save();
    ctx.translate(center, center);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(-6, 6);
    ctx.lineTo(6, 6);
    ctx.closePath();
    ctx.fillStyle = '#00ff00';
    ctx.shadowColor = '#00ff00';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
}

// Toggle sniper zoom
function toggleZoom() {
    if (!playerChar || playerChar.type !== 'Sniper') return;

    isZoomed = !isZoomed;

    if (isZoomed) {
        camera.fov = ZOOM_FOV;
        scopeOverlay.style.display = 'block';
        crosshair.style.display = 'none';
        // Hide weapon view when zoomed
        fpWeaponView.weaponContainer.visible = false;
    } else {
        camera.fov = NORMAL_FOV;
        scopeOverlay.style.display = 'none';
        crosshair.style.display = 'block';
        fpWeaponView.weaponContainer.visible = true;
    }
    camera.updateProjectionMatrix();
}

// --- Input Handling ---

const handleFire = () => {
    if (!playerChar) return;
    // Allow firing if locked (PC) or if mobile (Touch)
    if (!controller.isLocked && !isMobile) return;
    // Don't fire if game is paused
    if (!gameStateManager.isPlaying()) return;

    const now = Date.now();
    // Simple fire rate limit (e.g., 500ms for Knight, 100ms for MachineGun)
    let fireRate = 500;
    if (playerChar instanceof Characters.MachineGun) fireRate = 100;
    if (playerChar instanceof Characters.Sniper) fireRate = 1000;

    if (now - lastShotTime > fireRate) {
        weaponSystem.fire(playerChar, camera, zombies);
        lastShotTime = now;

        // Record shot for stats
        gameStateManager.recordShot();

        // Play weapon sound based on character type
        switch (playerChar.type) {
            case 'Knight':
                audioManager.playSwordSwing();
                break;
            case 'Sniper':
                audioManager.playGunshot('sniper');
                break;
            case 'MachineGun':
                audioManager.playGunshot('machinegun');
                break;
            case 'Archer':
                audioManager.playBowRelease();
                break;
            case 'Wizard':
                audioManager.playMagicCast();
                break;
            default:
                audioManager.playGunshot('rifle');
        }

        // Screen shake based on weapon type
        let shakeAmount = 0.01;
        if (playerChar.type === 'Sniper') shakeAmount = 0.04;
        else if (playerChar.type === 'MachineGun') shakeAmount = 0.008;
        else if (playerChar.type === 'Knight') shakeAmount = 0.02;
        triggerScreenShake(shakeAmount);

        // Auto unzoom sniper after shooting
        if (playerChar.type === 'Sniper' && isZoomed) {
            setTimeout(() => {
                if (isZoomed) toggleZoom();
            }, 150); // Brief delay for impact effect
        }
    }
};

// Left click to fire / start charge
document.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left click
        isHoldingFire = true;
        // Start charging attack
        if (abilitySystem && !abilitySystem.ultimateActive) {
            abilitySystem.startCharge();
            isCharging = true;
        }
        handleFire();
    } else if (e.button === 2) { // Right click
        // Right click: Ultimate if ready, otherwise zoom for sniper
        if (abilitySystem && abilitySystem.ultimateReady) {
            e.preventDefault();
            abilitySystem.activateUltimate();
        } else if (playerChar && playerChar.type === 'Sniper') {
            toggleZoom();
        }
    }
});

// Left click release - release charged attack
document.addEventListener('mouseup', (e) => {
    if (e.button === 0) { // Left click release
        isHoldingFire = false;
        if (isCharging && abilitySystem) {
            const result = abilitySystem.releaseCharge();
            if (result) {
                // Handle charged attack result
                handleChargedAttack(result);
            }
            isCharging = false;
        }
    }
});

// Handle charged attack results
function handleChargedAttack(result) {
    if (!result) return;

    // Play appropriate sound
    switch (playerChar.type) {
        case 'Wizard':
            audioManager.playMagicCast();
            triggerScreenShake(0.05 * result.chargeLevel);
            break;
        case 'Archer':
            audioManager.playBowRelease();
            triggerScreenShake(0.03 * result.chargeLevel);
            break;
        case 'Sniper':
            audioManager.playGunshot('sniper');
            triggerScreenShake(0.08 * result.chargeLevel);
            // Handle railgun hit detection
            if (result.type === 'railgun') {
                handleRailgunHit(result);
            }
            break;
        case 'MachineGun':
            audioManager.playExplosion();
            triggerScreenShake(0.04 * result.chargeLevel);
            break;
        case 'Knight':
            audioManager.playSwordSwing();
            triggerScreenShake(0.06 * result.chargeLevel);
            // Handle heavy slam hit detection
            if (result.type === 'heavySlam') {
                handleHeavySlamHit(result);
            }
            break;
    }
}

// Handle railgun hit (instant hitscan)
function handleRailgunHit(result) {
    const raycaster = new THREE.Raycaster(result.origin, result.direction, 0, 100);
    let penetrateCount = result.penetrateCount;

    for (const zombie of zombies) {
        if (zombie.isDead || penetrateCount <= 0) continue;

        // Simple distance check along ray
        const toZombie = zombie.mesh.position.clone().sub(result.origin);
        const dot = toZombie.dot(result.direction);
        if (dot > 0 && dot < 100) {
            const closestPoint = result.origin.clone().add(result.direction.clone().multiplyScalar(dot));
            const dist = closestPoint.distanceTo(zombie.mesh.position);
            if (dist < 1.5) {
                zombie.takeDamage(result.damage);
                showHitMarker(zombie.isDead);
                penetrateCount--;
            }
        }
    }
}

// Handle heavy slam hit (AOE)
function handleHeavySlamHit(result) {
    for (const zombie of zombies) {
        if (zombie.isDead) continue;
        const dx = zombie.mesh.position.x - result.position.x;
        const dz = zombie.mesh.position.z - result.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < result.radius) {
            const falloff = 1 - (dist / result.radius) * 0.5;
            zombie.takeDamage(result.damage * falloff);
            showHitMarker(zombie.isDead);

            // Knockback effect
            const knockDir = new THREE.Vector3(dx, 0, dz).normalize();
            zombie.mesh.position.add(knockDir.multiplyScalar(result.knockbackForce * (1 - dist / result.radius)));
        }
    }
}

// Prevent context menu on right click
document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

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

    // Skip updates if paused
    if (gameStateManager.isPaused()) {
        renderer.render(scene, camera);
        return;
    }

    if (playerChar && !playerChar.isDead && gameStateManager.isPlaying()) {
        controller.update(delta);
        weaponSystem.update(delta, zombies);

        // Update ability system
        if (abilitySystem) {
            abilitySystem.update(delta, camera.position, zombies);

            // Apply berserker rage stats for Knight
            const berserkerStats = abilitySystem.getBerserkerStats();
            if (berserkerStats) {
                playerChar.damageMultiplier = berserkerStats.damageMultiplier;
                if (berserkerStats.invincible) {
                    playerChar.damageReduction = 1.0; // Full damage reduction
                }
            } else if (playerChar.type === 'Knight' && !playerChar.shieldActive) {
                // Reset stats when not in berserker mode (unless shield active)
                playerChar.damageMultiplier = 1.0;
                playerChar.damageReduction = 0;
            }
        }

        // Update screen shake
        updateScreenShake(delta);

        // Update first person weapon view with movement state
        const isMoving = controller.moveForward || controller.moveBackward ||
                         controller.moveLeft || controller.moveRight;
        fpWeaponView.update(delta, { isMoving });

        // Zombie Logic
        for (let i = zombies.length - 1; i >= 0; i--) {
            const z = zombies[i];
            z.update(delta, camera.position, zombies);

            // Player Collision (Damage) - use zombie center position
            const zombieCenter = z.mesh.position.clone();
            zombieCenter.y = camera.position.y; // Compare at same height for horizontal distance
            const horizontalDist = zombieCenter.distanceTo(camera.position);

            if (horizontalDist < 1.5) {
                const now = Date.now();
                if (now - lastPlayerDamageTime > PLAYER_IFRAME_MS) {
                    // Use takeDamage method which applies defense
                    const actualDamage = playerChar.takeDamage(z.logic.damage);
                    lastPlayerDamageTime = now;

                    // Record damage taken for stats
                    gameStateManager.recordDamageTaken(actualDamage);

                    // Play hurt sound and zombie attack sound
                    audioManager.playPlayerHurt();
                    audioManager.playZombieAttack();

                    // Blood splatter effect
                    showBloodEffect();

                    // Show damage direction indicator
                    showDamageIndicator(z.mesh.position);

                    // Screen shake from damage (more if no shield)
                    triggerScreenShake(playerChar.shieldActive ? 0.015 : 0.03);

                    // Start heartbeat if low HP
                    if (playerChar.hp <= 25 && playerChar.hp > 0) {
                        audioManager.startHeartbeat();
                    }

                    if (playerChar.isDead) {
                        audioManager.stopHeartbeat();
                        gameOver();
                    }
                }
            }

            if (z.isDead) {
                // Check for power-up drop
                if (PowerUp.shouldDrop(z.zombieType)) {
                    const powerUpType = PowerUp.getRandomType();
                    const powerUp = new PowerUp(
                        scene,
                        z.mesh.position.x,
                        z.mesh.position.z,
                        powerUpType
                    );
                    powerUps.push(powerUp);
                }

                zombies.splice(i, 1);
                zombiesKilledInStage++;
                checkStageProgress();
            }
        }

        // Update power-ups
        for (let i = powerUps.length - 1; i >= 0; i--) {
            const powerUp = powerUps[i];
            const result = powerUp.update(delta, camera.position);

            if (result === 'collect') {
                const collectResult = powerUp.collect(
                    playerChar,
                    controller,
                    zombies,
                    scene,
                    audioManager
                );
                if (collectResult) {
                    audioManager.playPickup();
                    showPowerUpMessage(collectResult.message);

                    // Stop heartbeat if health collected and HP restored
                    if (collectResult.type === 'HEALTH' && playerChar.hp > 25) {
                        audioManager.stopHeartbeat();
                    }
                }
                powerUps.splice(i, 1);
            } else if (result === true) {
                // Despawned
                powerUps.splice(i, 1);
            }
        }

        // Spawner
        if (Math.random() < 0.05) spawnZombie(); // 5% chance per frame if under limit

        updateHUD();
        updateMinimap();
    }

    // Render main scene
    renderer.render(scene, camera);

    // Render weapon view on top (if game is active)
    if (playerChar && !playerChar.isDead) {
        fpWeaponView.render();
    }
}

function gameOver() {
    audioManager.stopAmbientMusic();
    audioManager.stopHeartbeat();
    playerChar.isDead = true;
    gameStateManager.gameOver(gameState.currentStage, gameState.loopCount);
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
