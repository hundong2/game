/**
 * Game State Manager
 * Handles game states: MENU, PLAYING, PAUSED, GAME_OVER
 */

export const GameStates = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER'
};

export class GameStateManager {
    constructor() {
        this.currentState = GameStates.MENU;
        this.listeners = [];

        // Game statistics
        this.stats = {
            totalKills: 0,
            shotsFired: 0,
            shotsHit: 0,
            headshots: 0,
            damageDealt: 0,
            damageTaken: 0,
            timeSurvived: 0,
            stageReached: 1,
            loopReached: 1
        };

        this.startTime = 0;
        this.pausedTime = 0;

        this.createUI();
    }

    createUI() {
        // Pause Menu
        this.pauseMenu = document.createElement('div');
        this.pauseMenu.id = 'pause-menu';
        this.pauseMenu.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: 'Arial Black', Arial, sans-serif;
        `;
        this.pauseMenu.innerHTML = `
            <div style="text-align: center; color: white;">
                <h1 style="font-size: 48px; color: #ffaa00; text-shadow: 0 0 20px rgba(255, 150, 0, 0.5); margin-bottom: 40px; letter-spacing: 8px;">
                    ⏸ PAUSED
                </h1>
                <div id="pause-stats" style="margin-bottom: 30px; font-size: 16px; color: #aaa;">
                    Stage: <span id="pause-stage">1</span> | Kills: <span id="pause-kills">0</span>
                </div>
                <button class="menu-btn" id="resume-btn">▶ RESUME</button>
                <button class="menu-btn" id="quit-btn">🚪 QUIT TO MENU</button>
            </div>
        `;
        document.body.appendChild(this.pauseMenu);

        // Game Over Screen
        this.gameOverScreen = document.createElement('div');
        this.gameOverScreen.id = 'game-over-screen';
        this.gameOverScreen.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(50,0,0,0.95) 100%);
            display: none;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            font-family: 'Arial Black', Arial, sans-serif;
        `;
        this.gameOverScreen.innerHTML = `
            <div style="text-align: center; color: white;">
                <h1 style="font-size: 56px; color: #ff3333; text-shadow: 0 0 30px rgba(255, 0, 0, 0.7), 0 0 60px rgba(255, 0, 0, 0.4); margin-bottom: 20px; letter-spacing: 6px;">
                    💀 GAME OVER 💀
                </h1>
                <p style="font-size: 20px; color: #888; margin-bottom: 30px;">You survived until</p>
                <div style="font-size: 36px; color: #ffaa00; margin-bottom: 30px;">
                    STAGE <span id="final-stage">1</span> <span id="final-loop" style="color: #ff66ff; font-size: 24px;"></span>
                </div>

                <div style="background: rgba(0,0,0,0.5); border: 2px solid #333; border-radius: 10px; padding: 20px; margin: 20px auto; max-width: 300px;">
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 16px;">
                        <span style="color: #888;">Total Kills:</span>
                        <span id="stat-kills" style="color: #ff6666;">0</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 16px;">
                        <span style="color: #888;">Accuracy:</span>
                        <span id="stat-accuracy" style="color: #66ff66;">0%</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 16px;">
                        <span style="color: #888;">Time Survived:</span>
                        <span id="stat-time" style="color: #6666ff;">0:00</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 16px;">
                        <span style="color: #888;">Headshots:</span>
                        <span id="stat-headshots" style="color: #ffff66;">0</span>
                    </div>
                </div>

                <div style="margin-top: 30px;">
                    <button class="menu-btn" id="retry-btn">🔄 RETRY</button>
                    <button class="menu-btn" id="menu-btn">🏠 MAIN MENU</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.gameOverScreen);

        // Add button styles
        const style = document.createElement('style');
        style.textContent = `
            .menu-btn {
                background: linear-gradient(180deg, #444 0%, #222 100%);
                border: 2px solid #555;
                color: white;
                padding: 15px 40px;
                margin: 10px;
                font-size: 18px;
                font-family: 'Arial Black', Arial, sans-serif;
                cursor: pointer;
                border-radius: 5px;
                text-transform: uppercase;
                letter-spacing: 2px;
                transition: all 0.2s ease;
            }
            .menu-btn:hover {
                background: linear-gradient(180deg, #555 0%, #333 100%);
                border-color: #ff4444;
                box-shadow: 0 0 20px rgba(255, 0, 0, 0.3);
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);

        // Event listeners
        document.getElementById('resume-btn').addEventListener('click', () => this.resume());
        document.getElementById('quit-btn').addEventListener('click', () => this.quitToMenu());
        document.getElementById('retry-btn').addEventListener('click', () => this.retry());
        document.getElementById('menu-btn').addEventListener('click', () => this.quitToMenu());

        // ESC key for pause
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.currentState === GameStates.PLAYING) {
                    this.pause();
                } else if (this.currentState === GameStates.PAUSED) {
                    this.resume();
                }
            }
        });
    }

    setState(newState) {
        const oldState = this.currentState;
        this.currentState = newState;

        // Notify listeners
        this.listeners.forEach(listener => listener(newState, oldState));

        // Update UI visibility
        this.updateUIVisibility();
    }

    updateUIVisibility() {
        this.pauseMenu.style.display = this.currentState === GameStates.PAUSED ? 'flex' : 'none';
        this.gameOverScreen.style.display = this.currentState === GameStates.GAME_OVER ? 'flex' : 'none';
    }

    onStateChange(callback) {
        this.listeners.push(callback);
    }

    startGame() {
        this.resetStats();
        this.startTime = Date.now();
        this.setState(GameStates.PLAYING);
    }

    pause() {
        if (this.currentState !== GameStates.PLAYING) return;

        this.pausedTime = Date.now();

        // Update pause screen stats
        document.getElementById('pause-stage').textContent = this.stats.stageReached;
        document.getElementById('pause-kills').textContent = this.stats.totalKills;

        this.setState(GameStates.PAUSED);

        // Exit pointer lock
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    resume() {
        if (this.currentState !== GameStates.PAUSED) return;

        // Adjust start time for pause duration
        const pauseDuration = Date.now() - this.pausedTime;
        this.startTime += pauseDuration;

        this.setState(GameStates.PLAYING);
    }

    gameOver(stage, loop) {
        this.stats.stageReached = stage;
        this.stats.loopReached = loop;
        this.stats.timeSurvived = Math.floor((Date.now() - this.startTime) / 1000);

        this.updateGameOverScreen();
        this.setState(GameStates.GAME_OVER);

        // Exit pointer lock
        if (document.pointerLockElement) {
            document.exitPointerLock();
        }
    }

    updateGameOverScreen() {
        document.getElementById('final-stage').textContent = this.stats.stageReached;
        document.getElementById('final-loop').textContent =
            this.stats.loopReached > 1 ? `(Loop ${this.stats.loopReached})` : '';

        document.getElementById('stat-kills').textContent = this.stats.totalKills;

        const accuracy = this.stats.shotsFired > 0
            ? Math.round((this.stats.shotsHit / this.stats.shotsFired) * 100)
            : 0;
        document.getElementById('stat-accuracy').textContent = `${accuracy}%`;

        const minutes = Math.floor(this.stats.timeSurvived / 60);
        const seconds = this.stats.timeSurvived % 60;
        document.getElementById('stat-time').textContent =
            `${minutes}:${seconds.toString().padStart(2, '0')}`;

        document.getElementById('stat-headshots').textContent = this.stats.headshots;
    }

    retry() {
        location.reload();
    }

    quitToMenu() {
        location.reload();
    }

    resetStats() {
        this.stats = {
            totalKills: 0,
            shotsFired: 0,
            shotsHit: 0,
            headshots: 0,
            damageDealt: 0,
            damageTaken: 0,
            timeSurvived: 0,
            stageReached: 1,
            loopReached: 1
        };
    }

    // Stat tracking methods
    recordKill() {
        this.stats.totalKills++;
    }

    recordShot() {
        this.stats.shotsFired++;
    }

    recordHit() {
        this.stats.shotsHit++;
    }

    recordHeadshot() {
        this.stats.headshots++;
    }

    recordDamageDealt(amount) {
        this.stats.damageDealt += amount;
    }

    recordDamageTaken(amount) {
        this.stats.damageTaken += amount;
    }

    isPlaying() {
        return this.currentState === GameStates.PLAYING;
    }

    isPaused() {
        return this.currentState === GameStates.PAUSED;
    }
}

// Singleton export
export const gameStateManager = new GameStateManager();
export default gameStateManager;
