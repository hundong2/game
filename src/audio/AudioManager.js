/**
 * AudioManager - Procedural Sound System
 * Generates game sounds using Web Audio API
 */

class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        this.initialized = false;

        this.settings = {
            masterVolume: 0.8,
            sfxVolume: 0.8,
            musicVolume: 0.5
        };

        // Ambient music oscillators
        this.ambientOscillators = [];
        this.isAmbientPlaying = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();

            // Master gain
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = this.settings.masterVolume;
            this.masterGain.connect(this.context.destination);

            // SFX gain
            this.sfxGain = this.context.createGain();
            this.sfxGain.gain.value = this.settings.sfxVolume;
            this.sfxGain.connect(this.masterGain);

            // Music gain
            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = this.settings.musicVolume;
            this.musicGain.connect(this.masterGain);

            this.initialized = true;
            console.log('AudioManager initialized');
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    resume() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    }

    // ==================== WEAPON SOUNDS ====================

    playGunshot(type = 'rifle') {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        switch(type) {
            case 'rifle':
            case 'sniper':
                this._playRifleShot(now);
                break;
            case 'machinegun':
                this._playMachineGunShot(now);
                break;
            case 'shotgun':
                this._playShotgunShot(now);
                break;
            default:
                this._playRifleShot(now);
        }
    }

    _playRifleShot(now) {
        // Noise burst for gunshot
        const noiseBuffer = this._createNoiseBuffer(0.15);
        const noiseSource = this.context.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        // Bandpass filter for punch
        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        filter.Q.value = 1;

        // Envelope
        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.8, now);
        envelope.gain.exponentialDecayTo(0.01, now + 0.15);

        noiseSource.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.sfxGain);

        noiseSource.start(now);
        noiseSource.stop(now + 0.15);

        // Low frequency thump
        const osc = this.context.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.1);

        const oscGain = this.context.createGain();
        oscGain.gain.setValueAtTime(0.5, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

        osc.connect(oscGain);
        oscGain.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    _playMachineGunShot(now) {
        // Shorter, sharper sound
        const noiseBuffer = this._createNoiseBuffer(0.08);
        const noiseSource = this.context.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 800;

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.4, now);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        noiseSource.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.sfxGain);

        noiseSource.start(now);
        noiseSource.stop(now + 0.08);
    }

    _playShotgunShot(now) {
        // Wide noise burst
        const noiseBuffer = this._createNoiseBuffer(0.25);
        const noiseSource = this.context.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 2000;

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(1.0, now);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        noiseSource.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.sfxGain);

        noiseSource.start(now);
        noiseSource.stop(now + 0.25);
    }

    playSwordSwing() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Whoosh sound - filtered noise with pitch sweep
        const noiseBuffer = this._createNoiseBuffer(0.3);
        const noiseSource = this.context.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, now);
        filter.frequency.exponentialRampToValueAtTime(1500, now + 0.15);
        filter.frequency.exponentialRampToValueAtTime(500, now + 0.3);
        filter.Q.value = 2;

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.01, now);
        envelope.gain.linearRampToValueAtTime(0.5, now + 0.1);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        noiseSource.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.sfxGain);

        noiseSource.start(now);
        noiseSource.stop(now + 0.3);
    }

    playBowRelease() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Twang sound
        const osc = this.context.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.3);

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.4, now);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(envelope);
        envelope.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.3);

        // String vibration
        const noiseBuffer = this._createNoiseBuffer(0.15);
        const noise = this.context.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 2000;
        filter.Q.value = 5;

        const noiseEnv = this.context.createGain();
        noiseEnv.gain.setValueAtTime(0.2, now);
        noiseEnv.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.connect(filter);
        filter.connect(noiseEnv);
        noiseEnv.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.15);
    }

    playMagicCast() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Mystical ascending tone
        const osc1 = this.context.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(200, now);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 0.2);

        const osc2 = this.context.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(300, now);
        osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.2);

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.3, now);
        envelope.gain.linearRampToValueAtTime(0.5, now + 0.1);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        // Reverb-like effect with delay
        const delay = this.context.createDelay();
        delay.delayTime.value = 0.05;

        const feedback = this.context.createGain();
        feedback.gain.value = 0.3;

        osc1.connect(envelope);
        osc2.connect(envelope);
        envelope.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        envelope.connect(this.sfxGain);
        delay.connect(this.sfxGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.4);
        osc2.stop(now + 0.4);

        // Sparkle
        for (let i = 0; i < 5; i++) {
            const sparkle = this.context.createOscillator();
            sparkle.type = 'sine';
            sparkle.frequency.value = 1000 + Math.random() * 2000;

            const sparkleEnv = this.context.createGain();
            sparkleEnv.gain.setValueAtTime(0.1, now + i * 0.05);
            sparkleEnv.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);

            sparkle.connect(sparkleEnv);
            sparkleEnv.connect(this.sfxGain);

            sparkle.start(now + i * 0.05);
            sparkle.stop(now + i * 0.05 + 0.1);
        }
    }

    // ==================== ZOMBIE SOUNDS ====================

    playZombieGroan() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;
        const baseFreq = 80 + Math.random() * 40;

        // Low growl
        const osc = this.context.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.linearRampToValueAtTime(baseFreq * 0.8, now + 0.5);
        osc.frequency.linearRampToValueAtTime(baseFreq * 1.1, now + 0.8);

        // Modulation for texture
        const lfo = this.context.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 5 + Math.random() * 10;

        const lfoGain = this.context.createGain();
        lfoGain.gain.value = 20;

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        // Filter for muffled sound
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 500;
        filter.Q.value = 2;

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.01, now);
        envelope.gain.linearRampToValueAtTime(0.25, now + 0.1);
        envelope.gain.linearRampToValueAtTime(0.2, now + 0.6);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 1.0);

        osc.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.sfxGain);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 1.0);
        osc.stop(now + 1.0);
    }

    playZombieAttack() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Aggressive snarl
        const osc = this.context.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.1);
        osc.frequency.linearRampToValueAtTime(80, now + 0.3);

        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.4, now);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    playZombieDeath() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Death groan - descending
        const osc = this.context.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);

        const lfo = this.context.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 8;

        const lfoGain = this.context.createGain();
        lfoGain.gain.value = 15;

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);

        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.8);

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.4, now);
        envelope.gain.linearRampToValueAtTime(0.3, now + 0.4);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        osc.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.sfxGain);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 0.8);
        osc.stop(now + 0.8);
    }

    playZombieSpawn() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Rising growl
        const osc = this.context.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.5);

        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.01, now);
        envelope.gain.linearRampToValueAtTime(0.2, now + 0.3);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    // ==================== FEEDBACK SOUNDS ====================

    playHitMarker() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Sharp click
        const osc = this.context.createOscillator();
        osc.type = 'square';
        osc.frequency.value = 1800;

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.3, now);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(envelope);
        envelope.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    playHeadshot() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Double click - higher pitched
        for (let i = 0; i < 2; i++) {
            const osc = this.context.createOscillator();
            osc.type = 'square';
            osc.frequency.value = 2200;

            const envelope = this.context.createGain();
            envelope.gain.setValueAtTime(0.35, now + i * 0.06);
            envelope.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.04);

            osc.connect(envelope);
            envelope.connect(this.sfxGain);

            osc.start(now + i * 0.06);
            osc.stop(now + i * 0.06 + 0.04);
        }
    }

    playPlayerHurt() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Low thud
        const osc = this.context.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.5, now);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(envelope);
        envelope.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.2);

        // Grunt sound
        const gruntOsc = this.context.createOscillator();
        gruntOsc.type = 'sawtooth';
        gruntOsc.frequency.setValueAtTime(200, now);
        gruntOsc.frequency.exponentialRampToValueAtTime(100, now + 0.15);

        const gruntFilter = this.context.createBiquadFilter();
        gruntFilter.type = 'lowpass';
        gruntFilter.frequency.value = 600;

        const gruntEnv = this.context.createGain();
        gruntEnv.gain.setValueAtTime(0.2, now);
        gruntEnv.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        gruntOsc.connect(gruntFilter);
        gruntFilter.connect(gruntEnv);
        gruntEnv.connect(this.sfxGain);

        gruntOsc.start(now);
        gruntOsc.stop(now + 0.15);
    }

    playStageClear() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Victory fanfare
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = this.context.createOscillator();
            osc.type = 'triangle';
            osc.frequency.value = freq;

            const envelope = this.context.createGain();
            envelope.gain.setValueAtTime(0.01, now + i * 0.15);
            envelope.gain.linearRampToValueAtTime(0.3, now + i * 0.15 + 0.05);
            envelope.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);

            osc.connect(envelope);
            envelope.connect(this.sfxGain);

            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.4);
        });
    }

    playPickup() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Positive chime
        const osc = this.context.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.1);

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.3, now);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.connect(envelope);
        envelope.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    playExplosion() {
        if (!this.initialized) return;
        this.resume();

        const now = this.context.currentTime;

        // Noise burst
        const noiseBuffer = this._createNoiseBuffer(0.8);
        const noise = this.context.createBufferSource();
        noise.buffer = noiseBuffer;

        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(200, now + 0.8);

        const envelope = this.context.createGain();
        envelope.gain.setValueAtTime(0.8, now);
        envelope.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

        noise.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.sfxGain);

        noise.start(now);
        noise.stop(now + 0.8);

        // Low boom
        const osc = this.context.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);

        const oscEnv = this.context.createGain();
        oscEnv.gain.setValueAtTime(0.8, now);
        oscEnv.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

        osc.connect(oscEnv);
        oscEnv.connect(this.sfxGain);

        osc.start(now);
        osc.stop(now + 0.5);
    }

    // ==================== AMBIENT MUSIC ====================

    startAmbientMusic() {
        if (!this.initialized || this.isAmbientPlaying) return;
        this.resume();

        this.isAmbientPlaying = true;
        const now = this.context.currentTime;

        // Dark drone
        const drone = this.context.createOscillator();
        drone.type = 'sawtooth';
        drone.frequency.value = 55; // A1

        const droneFilter = this.context.createBiquadFilter();
        droneFilter.type = 'lowpass';
        droneFilter.frequency.value = 200;

        const droneGain = this.context.createGain();
        droneGain.gain.value = 0.15;

        // LFO for subtle movement
        const lfo = this.context.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.1;

        const lfoGain = this.context.createGain();
        lfoGain.gain.value = 10;

        lfo.connect(lfoGain);
        lfoGain.connect(drone.frequency);

        drone.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(this.musicGain);

        drone.start(now);
        lfo.start(now);

        this.ambientOscillators.push(drone, lfo);

        // Second drone (fifth interval)
        const drone2 = this.context.createOscillator();
        drone2.type = 'triangle';
        drone2.frequency.value = 82.5; // E2

        const drone2Gain = this.context.createGain();
        drone2Gain.gain.value = 0.1;

        drone2.connect(drone2Gain);
        drone2Gain.connect(this.musicGain);

        drone2.start(now);
        this.ambientOscillators.push(drone2);
    }

    stopAmbientMusic() {
        this.ambientOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {}
        });
        this.ambientOscillators = [];
        this.isAmbientPlaying = false;
    }

    // ==================== LOW HEALTH HEARTBEAT ====================

    startHeartbeat() {
        if (!this.initialized || this.heartbeatInterval) return;
        this.resume();

        const playBeat = () => {
            const now = this.context.currentTime;

            // Double beat
            for (let i = 0; i < 2; i++) {
                const osc = this.context.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 60;

                const envelope = this.context.createGain();
                envelope.gain.setValueAtTime(0.4, now + i * 0.15);
                envelope.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.1);

                osc.connect(envelope);
                envelope.connect(this.sfxGain);

                osc.start(now + i * 0.15);
                osc.stop(now + i * 0.15 + 0.1);
            }
        };

        playBeat();
        this.heartbeatInterval = setInterval(playBeat, 800);
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }

    // ==================== UTILITY ====================

    _createNoiseBuffer(duration) {
        const sampleRate = this.context.sampleRate;
        const length = sampleRate * duration;
        const buffer = this.context.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        return buffer;
    }

    setMasterVolume(value) {
        this.settings.masterVolume = Math.max(0, Math.min(1, value));
        if (this.masterGain) {
            this.masterGain.gain.value = this.settings.masterVolume;
        }
    }

    setSFXVolume(value) {
        this.settings.sfxVolume = Math.max(0, Math.min(1, value));
        if (this.sfxGain) {
            this.sfxGain.gain.value = this.settings.sfxVolume;
        }
    }

    setMusicVolume(value) {
        this.settings.musicVolume = Math.max(0, Math.min(1, value));
        if (this.musicGain) {
            this.musicGain.gain.value = this.settings.musicVolume;
        }
    }
}

// Polyfill for exponentialDecayTo (not standard)
GainNode.prototype.exponentialDecayTo = function(value, endTime) {
    this.gain.exponentialRampToValueAtTime(Math.max(value, 0.0001), endTime);
};

// Singleton export
export const audioManager = new AudioManager();
export default audioManager;
