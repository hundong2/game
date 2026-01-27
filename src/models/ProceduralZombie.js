import * as THREE from 'three';

/**
 * Procedural Zombie Model
 * Creates a humanoid zombie using Three.js primitives
 */
export class ProceduralZombie {

    // Zombie appearance colors
    static SKIN_COLOR = 0x4a6b3a;      // Sickly green-gray (zombie skin)
    static SKIN_COLOR_ALT = 0x3d5c2d;  // Darker shade for variation
    static SKIN_WOUND = 0x8b0000;      // Dark red for wounds
    static EYE_COLOR = 0xff0000;       // Glowing red eyes
    static EYE_GLOW = 0xff3333;        // Eye glow color
    static BLOOD_COLOR = 0x660000;     // Dried blood
    static CLOTH_DARK = 0x1a1a1a;      // Dark pants
    static CLOTH_TORN = 0x2d2d2d;      // Torn shirt
    static BONE_COLOR = 0xe0d8c8;      // Exposed bone

    // Skin color variations for diversity
    static SKIN_VARIATIONS = [
        { base: 0x4a6b3a, alt: 0x3d5c2d },  // Classic green
        { base: 0x5a6b4a, alt: 0x4a5c3d },  // Pale green
        { base: 0x6b6b5a, alt: 0x5c5c4d },  // Gray-green
        { base: 0x7a6b5a, alt: 0x6b5c4d },  // Brown-gray (fresh)
        { base: 0x4a4a5a, alt: 0x3d3d4d },  // Blue-gray (cold)
        { base: 0x5a5a4a, alt: 0x4d4d3d },  // Olive
        { base: 0x3a4a3a, alt: 0x2d3d2d },  // Dark green (decayed)
        { base: 0x6a5a5a, alt: 0x5d4d4d },  // Pale flesh
    ];

    // Clothing color variations
    static CLOTH_VARIATIONS = [
        { shirt: 0x2d2d2d, pants: 0x1a1a1a },  // Dark gray
        { shirt: 0x3d2d2d, pants: 0x2a1a1a },  // Dark red-brown
        { shirt: 0x2d3d2d, pants: 0x1a2a1a },  // Dark green
        { shirt: 0x2d2d3d, pants: 0x1a1a2a },  // Dark blue
        { shirt: 0x4a4a4a, pants: 0x2a2a2a },  // Medium gray
        { shirt: 0x5a4a3a, pants: 0x3a2a1a },  // Brown (worker)
        { shirt: 0xf0f0e8, pants: 0x2a2a3a },  // White shirt (office)
        { shirt: 0x8b0000, pants: 0x1a1a1a },  // Bloody shirt
    ];

    /**
     * Helper to blend two colors
     */
    static blendColors(color1, color2, factor) {
        const r1 = (color1 >> 16) & 0xff;
        const g1 = (color1 >> 8) & 0xff;
        const b1 = color1 & 0xff;
        const r2 = (color2 >> 16) & 0xff;
        const g2 = (color2 >> 8) & 0xff;
        const b2 = color2 & 0xff;
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        return (r << 16) | (g << 8) | b;
    }

    /**
     * Get type-specific colors with variation applied
     */
    static getTypeColorsWithVariation(zombieType, variation) {
        const baseColors = this.getTypeColors(zombieType);
        const skinVariant = this.SKIN_VARIATIONS[variation.skinVariantIndex];

        // Blend type color with random skin variant
        let skinColor = this.blendColors(baseColors.SKIN_COLOR, skinVariant.base, 0.3);
        let skinColorAlt = this.blendColors(baseColors.SKIN_COLOR_ALT, skinVariant.alt, 0.3);

        // Adjust for fresh vs decayed
        if (variation.isFresh) {
            skinColor = this.blendColors(skinColor, 0x8a7a6a, 0.2); // More flesh-colored
        }
        if (variation.isDecayed) {
            skinColor = this.blendColors(skinColor, 0x2a3a2a, 0.3); // Darker, more green
            skinColorAlt = this.blendColors(skinColorAlt, 0x1a2a1a, 0.3);
        }

        return {
            ...baseColors,
            SKIN_COLOR: skinColor,
            SKIN_COLOR_ALT: skinColorAlt
        };
    }

    /**
     * Get type-specific colors
     */
    static getTypeColors(zombieType) {
        const baseColors = {
            SKIN_COLOR: this.SKIN_COLOR,
            SKIN_COLOR_ALT: this.SKIN_COLOR_ALT,
            EYE_COLOR: this.EYE_COLOR,
            EYE_GLOW: this.EYE_GLOW
        };

        switch (zombieType) {
            case 'runner':
                return {
                    ...baseColors,
                    SKIN_COLOR: 0x6b4a3a,
                    SKIN_COLOR_ALT: 0x5a3a2a,
                    EYE_COLOR: 0xff6600,
                    EYE_GLOW: 0xff8833
                };
            case 'tank':
                return {
                    ...baseColors,
                    SKIN_COLOR: 0x3a3a4a,
                    SKIN_COLOR_ALT: 0x2a2a3a,
                    EYE_COLOR: 0xff0000,
                    EYE_GLOW: 0xff2222
                };
            case 'spitter':
                return {
                    ...baseColors,
                    SKIN_COLOR: 0x4a6b4a,
                    SKIN_COLOR_ALT: 0x3a5a3a,
                    EYE_COLOR: 0x00ff00,
                    EYE_GLOW: 0x33ff33
                };
            case 'exploder':
                return {
                    ...baseColors,
                    SKIN_COLOR: 0x8b4a4a,
                    SKIN_COLOR_ALT: 0x7a3a3a,
                    EYE_COLOR: 0xff3300,
                    EYE_GLOW: 0xff5533
                };
            case 'screamer':
                return {
                    ...baseColors,
                    SKIN_COLOR: 0x6a5a7a,
                    SKIN_COLOR_ALT: 0x5a4a6a,
                    EYE_COLOR: 0xcc00ff,
                    EYE_GLOW: 0xdd33ff
                };
            case 'boss':
                return {
                    ...baseColors,
                    SKIN_COLOR: 0x2a1a2a,
                    SKIN_COLOR_ALT: 0x1a0a1a,
                    EYE_COLOR: 0xff00ff,
                    EYE_GLOW: 0xff33ff
                };
            default:
                return baseColors;
        }
    }

    /**
     * Generate random appearance variation
     */
    static generateAppearanceVariation() {
        return {
            skinTone: Math.random(),
            woundCount: Math.floor(Math.random() * 4),
            hasMissingLimb: Math.random() < 0.1,
            clothingDamage: Math.random(),
            bloodAmount: Math.random(),
            isFresh: Math.random() < 0.3,
            isDecayed: Math.random() < 0.2,
            hasExposedBone: Math.random() < 0.15,
            skinVariantIndex: Math.floor(Math.random() * this.SKIN_VARIATIONS.length),
            clothVariantIndex: Math.floor(Math.random() * this.CLOTH_VARIATIONS.length),
        };
    }

    /**
     * Create a complete zombie model
     * @param {string} zombieType - Type of zombie (walker, runner, tank, etc.)
     * @param {object} appearanceVariation - Optional appearance variation data
     * @returns {THREE.Group} Zombie model group with animation references
     */
    static create(zombieType = 'walker', appearanceVariation = null) {
        const group = new THREE.Group();

        // Generate or use provided appearance variation
        const variation = appearanceVariation || this.generateAppearanceVariation();
        group.userData.appearanceVariation = variation;

        // Get type-specific colors with variation applied
        const colors = this.getTypeColorsWithVariation(zombieType, variation);
        const clothColors = this.CLOTH_VARIATIONS[variation.clothVariantIndex];

        // Create body parts with type-specific colors and variation
        const head = this.createHead(colors, variation);
        const torso = this.createTorso(colors, zombieType, clothColors, variation);
        const leftArm = this.createArm(colors, variation, clothColors);
        const rightArm = this.createArm(colors, variation, clothColors);
        const leftLeg = this.createLeg(colors, variation, clothColors);
        const rightLeg = this.createLeg(colors, variation, clothColors);

        // Position body parts
        head.position.set(0, 1.65, 0);
        torso.position.set(0, 1.15, 0);

        // Arms - positioned at shoulders
        leftArm.position.set(-0.32, 1.4, 0);
        rightArm.position.set(0.32, 1.4, 0);
        rightArm.scale.x = -1; // Mirror right arm

        // Legs - positioned at hips
        leftLeg.position.set(-0.12, 0.45, 0);
        rightLeg.position.set(0.12, 0.45, 0);

        // Add all parts to group
        group.add(head, torso, leftArm, rightArm, leftLeg, rightLeg);

        // Add type-specific visual features
        this.addTypeFeatures(group, zombieType, colors);

        // Add random wounds and blood based on variation
        this.addRandomWounds(group, variation, colors);
        this.addBloodSplatters(group, variation);

        // Add exposed bones if applicable
        if (variation.hasExposedBone) {
            this.addExposedBones(group);
        }

        // Store references for animation
        group.userData = {
            head,
            torso,
            leftArm,
            rightArm,
            leftLeg,
            rightLeg,
            zombieType,
            appearanceVariation: variation,
            // Store original materials for damage flash
            materials: []
        };

        // Collect all materials for damage flash
        group.traverse((child) => {
            if (child.isMesh && child.material) {
                group.userData.materials.push(child.material);
            }
        });

        // Enable shadows
        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        return group;
    }

    /**
     * Add random wounds to the zombie
     */
    static addRandomWounds(group, variation, colors) {
        const woundMat = new THREE.MeshStandardMaterial({
            color: this.SKIN_WOUND,
            roughness: 0.6,
            metalness: 0.2
        });

        const woundCount = variation.woundCount;
        for (let i = 0; i < woundCount; i++) {
            const woundType = Math.floor(Math.random() * 3);
            let wound;

            switch (woundType) {
                case 0: // Slash wound
                    const slashGeo = new THREE.BoxGeometry(0.01 + Math.random() * 0.02, 0.03 + Math.random() * 0.05, 0.008);
                    wound = new THREE.Mesh(slashGeo, woundMat);
                    break;
                case 1: // Bite mark (circular)
                    const biteGeo = new THREE.TorusGeometry(0.02 + Math.random() * 0.015, 0.005, 8, 16);
                    wound = new THREE.Mesh(biteGeo, woundMat);
                    break;
                case 2: // Gash
                    const gashGeo = new THREE.CylinderGeometry(0.008, 0.012, 0.04 + Math.random() * 0.03, 6);
                    wound = new THREE.Mesh(gashGeo, woundMat);
                    break;
            }

            // Random position on body
            const bodyPart = Math.floor(Math.random() * 4);
            switch (bodyPart) {
                case 0: // Head area
                    wound.position.set(
                        (Math.random() - 0.5) * 0.15,
                        1.55 + Math.random() * 0.2,
                        0.08 + Math.random() * 0.05
                    );
                    break;
                case 1: // Torso
                    wound.position.set(
                        (Math.random() - 0.5) * 0.3,
                        1.0 + Math.random() * 0.3,
                        0.1 + Math.random() * 0.03
                    );
                    break;
                case 2: // Arms
                    wound.position.set(
                        (Math.random() > 0.5 ? 0.35 : -0.35) + (Math.random() - 0.5) * 0.1,
                        1.1 + Math.random() * 0.4,
                        0.02
                    );
                    break;
                case 3: // Legs
                    wound.position.set(
                        (Math.random() > 0.5 ? 0.12 : -0.12),
                        0.2 + Math.random() * 0.4,
                        0.05
                    );
                    break;
            }

            wound.rotation.set(
                Math.random() * 0.5,
                Math.random() * 0.5,
                Math.random() * Math.PI
            );

            group.add(wound);
        }
    }

    /**
     * Add blood splatters to the zombie
     */
    static addBloodSplatters(group, variation) {
        if (variation.bloodAmount < 0.3) return; // Skip if low blood

        const bloodMat = new THREE.MeshStandardMaterial({
            color: this.BLOOD_COLOR,
            roughness: 0.3,
            metalness: 0.1,
            transparent: true,
            opacity: 0.8
        });

        const freshBloodMat = new THREE.MeshStandardMaterial({
            color: 0x8b0000,
            roughness: 0.2,
            metalness: 0.3,
            transparent: true,
            opacity: 0.9
        });

        const bloodCount = Math.floor(variation.bloodAmount * 8);
        for (let i = 0; i < bloodCount; i++) {
            const bloodType = Math.random();
            let blood;

            if (bloodType < 0.5) {
                // Blood splatter (flat)
                const splatterGeo = new THREE.CircleGeometry(0.02 + Math.random() * 0.03, 8);
                blood = new THREE.Mesh(splatterGeo, variation.isFresh ? freshBloodMat : bloodMat);
            } else if (bloodType < 0.8) {
                // Blood drip
                const dripGeo = new THREE.CylinderGeometry(0.003, 0.006, 0.02 + Math.random() * 0.04, 6);
                blood = new THREE.Mesh(dripGeo, variation.isFresh ? freshBloodMat : bloodMat);
            } else {
                // Blood pool (on clothes)
                const poolGeo = new THREE.PlaneGeometry(0.04 + Math.random() * 0.04, 0.03 + Math.random() * 0.03);
                blood = new THREE.Mesh(poolGeo, bloodMat);
            }

            // Random position
            blood.position.set(
                (Math.random() - 0.5) * 0.4,
                0.5 + Math.random() * 1.2,
                0.05 + Math.random() * 0.1
            );

            blood.rotation.set(
                Math.random() * 0.3,
                Math.random() * Math.PI * 2,
                Math.random() * 0.3
            );

            group.add(blood);
        }
    }

    /**
     * Add exposed bones to the zombie
     */
    static addExposedBones(group) {
        const boneMat = new THREE.MeshStandardMaterial({
            color: this.BONE_COLOR,
            roughness: 0.5,
            metalness: 0.1
        });

        // Random bone exposure location
        const location = Math.floor(Math.random() * 3);

        switch (location) {
            case 0: // Exposed ribs
                for (let i = 0; i < 3; i++) {
                    const ribGeo = new THREE.CylinderGeometry(0.008, 0.01, 0.08, 6);
                    const rib = new THREE.Mesh(ribGeo, boneMat);
                    rib.position.set(0.08, 0.95 + i * 0.06, 0.12);
                    rib.rotation.z = Math.PI / 2;
                    rib.rotation.y = 0.3;
                    group.add(rib);
                }
                break;
            case 1: // Exposed arm bone
                const armBoneGeo = new THREE.CylinderGeometry(0.012, 0.01, 0.15, 8);
                const armBone = new THREE.Mesh(armBoneGeo, boneMat);
                armBone.position.set(Math.random() > 0.5 ? 0.38 : -0.38, 1.0, 0.02);
                armBone.rotation.z = 0.2;
                group.add(armBone);
                break;
            case 2: // Exposed skull
                const skullGeo = new THREE.SphereGeometry(0.04, 8, 8);
                const skull = new THREE.Mesh(skullGeo, boneMat);
                skull.position.set((Math.random() - 0.5) * 0.08, 1.7, 0.05);
                skull.scale.set(1.2, 0.8, 0.5);
                group.add(skull);
                break;
        }
    }

    /**
     * Add type-specific visual features
     */
    static addTypeFeatures(group, zombieType, colors) {
        switch (zombieType) {
            case 'runner':
                // Longer, leaner limbs effect (handled by animation)
                break;
            case 'tank':
                // Add muscle bulges
                this.addTankFeatures(group, colors);
                break;
            case 'spitter':
                // Add bloated cheeks/neck
                this.addSpitterFeatures(group, colors);
                break;
            case 'exploder':
                // Add bloated belly with glow
                this.addExploderFeatures(group, colors);
                break;
            case 'screamer':
                // Add larger mouth
                this.addScreamerFeatures(group, colors);
                break;
            case 'boss':
                // Add intimidating features
                this.addBossFeatures(group, colors);
                break;
        }
    }

    static addTankFeatures(group, colors) {
        const muscleMat = new THREE.MeshStandardMaterial({
            color: colors.SKIN_COLOR,
            roughness: 0.8
        });

        // Extra shoulder bulk
        const shoulderGeo = new THREE.SphereGeometry(0.12, 10, 10);
        const leftShoulder = new THREE.Mesh(shoulderGeo, muscleMat);
        leftShoulder.position.set(-0.35, 1.5, 0);
        const rightShoulder = new THREE.Mesh(shoulderGeo, muscleMat);
        rightShoulder.position.set(0.35, 1.5, 0);

        // Back hump
        const humpGeo = new THREE.SphereGeometry(0.15, 10, 10);
        const hump = new THREE.Mesh(humpGeo, muscleMat);
        hump.position.set(0, 1.4, -0.15);
        hump.scale.set(1.5, 1, 1);

        group.add(leftShoulder, rightShoulder, hump);
    }

    static addSpitterFeatures(group, colors) {
        const bloatMat = new THREE.MeshStandardMaterial({
            color: 0x5a7a5a,
            roughness: 0.7,
            transparent: true,
            opacity: 0.9
        });

        // Bloated throat
        const throatGeo = new THREE.SphereGeometry(0.1, 10, 10);
        const throat = new THREE.Mesh(throatGeo, bloatMat);
        throat.position.set(0, 1.45, 0.08);
        throat.scale.set(0.8, 1.2, 0.8);

        // Dripping acid effect (static geometry)
        const dripMat = new THREE.MeshStandardMaterial({
            color: 0x66ff66,
            emissive: 0x33ff33,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.7
        });

        for (let i = 0; i < 3; i++) {
            const dripGeo = new THREE.CylinderGeometry(0.008, 0.003, 0.05 + Math.random() * 0.05, 6);
            const drip = new THREE.Mesh(dripGeo, dripMat);
            drip.position.set(
                (Math.random() - 0.5) * 0.08,
                1.55,
                0.12
            );
            group.add(drip);
        }

        group.add(throat);
    }

    static addExploderFeatures(group, colors) {
        const bloatMat = new THREE.MeshStandardMaterial({
            color: 0xaa4444,
            emissive: 0xff3333,
            emissiveIntensity: 0.5,
            roughness: 0.5,
            transparent: true,
            opacity: 0.9
        });

        // Bloated belly
        const bellyGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const belly = new THREE.Mesh(bellyGeo, bloatMat);
        belly.position.set(0, 1.0, 0.1);

        // Pustules/boils
        const boilMat = new THREE.MeshStandardMaterial({
            color: 0xff6666,
            emissive: 0xff3333,
            emissiveIntensity: 0.8
        });

        for (let i = 0; i < 5; i++) {
            const boilGeo = new THREE.SphereGeometry(0.03 + Math.random() * 0.03, 8, 8);
            const boil = new THREE.Mesh(boilGeo, boilMat);
            const angle = Math.random() * Math.PI;
            const radius = 0.2;
            boil.position.set(
                Math.cos(angle) * radius * 0.5,
                0.9 + Math.random() * 0.2,
                0.1 + Math.sin(angle) * radius
            );
            group.add(boil);
        }

        group.add(belly);
    }

    static addScreamerFeatures(group, colors) {
        const mouthMat = new THREE.MeshStandardMaterial({
            color: 0x1a0505,
            roughness: 1
        });

        // Extended jaw/mouth
        const jawGeo = new THREE.BoxGeometry(0.1, 0.08, 0.06);
        const jaw = new THREE.Mesh(jawGeo, mouthMat);
        jaw.position.set(0, 1.55, 0.12);
        jaw.rotation.x = 0.3;

        // Aura effect particles (static)
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0x9966ff,
            transparent: true,
            opacity: 0.3
        });

        for (let i = 0; i < 8; i++) {
            const auraGeo = new THREE.SphereGeometry(0.05, 6, 6);
            const aura = new THREE.Mesh(auraGeo, auraMat);
            const angle = (i / 8) * Math.PI * 2;
            aura.position.set(
                Math.cos(angle) * 0.4,
                1.2 + Math.sin(i) * 0.2,
                Math.sin(angle) * 0.4
            );
            group.add(aura);
        }

        group.add(jaw);
    }

    static addBossFeatures(group, colors) {
        // Spikes on back
        const spikeMat = new THREE.MeshStandardMaterial({
            color: 0x1a0a1a,
            roughness: 0.6
        });

        for (let i = 0; i < 5; i++) {
            const spikeGeo = new THREE.ConeGeometry(0.05, 0.2 + Math.random() * 0.15, 8);
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            spike.position.set(
                (Math.random() - 0.5) * 0.3,
                1.3 + i * 0.08,
                -0.15
            );
            spike.rotation.x = -0.5;
            spike.rotation.z = (Math.random() - 0.5) * 0.3;
            group.add(spike);
        }

        // Horns
        const hornMat = new THREE.MeshStandardMaterial({
            color: 0x2a1a2a,
            roughness: 0.5
        });

        const leftHornGeo = new THREE.ConeGeometry(0.04, 0.2, 8);
        const leftHorn = new THREE.Mesh(leftHornGeo, hornMat);
        leftHorn.position.set(-0.1, 1.8, 0);
        leftHorn.rotation.z = 0.4;

        const rightHorn = new THREE.Mesh(leftHornGeo.clone(), hornMat);
        rightHorn.position.set(0.1, 1.8, 0);
        rightHorn.rotation.z = -0.4;

        group.add(leftHorn, rightHorn);
    }

    /**
     * Create zombie head with realistic human proportions and horrific details
     */
    static createHead(colors = null, variation = null) {
        const group = new THREE.Group();

        const skinColor = colors?.SKIN_COLOR || this.SKIN_COLOR;
        const skinColorAlt = colors?.SKIN_COLOR_ALT || this.SKIN_COLOR_ALT;
        const eyeColor = colors?.EYE_COLOR || this.EYE_COLOR;
        const eyeGlow = colors?.EYE_GLOW || this.EYE_GLOW;

        const skinMat = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.85,
            metalness: 0.05
        });

        const skinMatDark = new THREE.MeshStandardMaterial({
            color: skinColorAlt,
            roughness: 0.9,
            metalness: 0.05
        });

        const woundMat = new THREE.MeshStandardMaterial({
            color: this.SKIN_WOUND,
            roughness: 0.6,
            metalness: 0.2
        });

        // Main skull - more human-like oval shape
        const headGeo = new THREE.SphereGeometry(0.12, 20, 16);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.scale.set(0.9, 1.05, 0.95); // Slightly elongated vertically

        // Forehead (more prominent)
        const foreheadGeo = new THREE.SphereGeometry(0.1, 12, 10);
        const forehead = new THREE.Mesh(foreheadGeo, skinMat);
        forehead.position.set(0, 0.06, 0.03);
        forehead.scale.set(1.1, 0.7, 0.7);

        // Cheekbones (gaunt, sunken look)
        const cheekGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const leftCheek = new THREE.Mesh(cheekGeo, skinMat);
        leftCheek.position.set(-0.08, -0.02, 0.07);
        leftCheek.scale.set(1.2, 0.8, 0.6);

        const rightCheek = new THREE.Mesh(cheekGeo, skinMat);
        rightCheek.position.set(0.08, -0.02, 0.07);
        rightCheek.scale.set(1.2, 0.8, 0.6);

        // Brow ridge (menacing but human)
        const browGeo = new THREE.BoxGeometry(0.18, 0.025, 0.06);
        const brow = new THREE.Mesh(browGeo, skinMatDark);
        brow.position.set(0, 0.05, 0.08);
        brow.rotation.x = 0.15;

        // Deep eye sockets (dark hollows - sunken eyes)
        const socketGeo = new THREE.SphereGeometry(0.032, 12, 12);
        const socketMat = new THREE.MeshStandardMaterial({
            color: 0x1a0a0a,
            roughness: 1
        });

        const leftSocket = new THREE.Mesh(socketGeo, socketMat);
        leftSocket.position.set(-0.045, 0.02, 0.08);
        leftSocket.scale.set(1, 1.1, 0.5);

        const rightSocket = new THREE.Mesh(socketGeo, socketMat);
        rightSocket.position.set(0.045, 0.02, 0.08);
        rightSocket.scale.set(1, 1.1, 0.5);

        // Human-like eyes with pupils
        const eyeWhiteGeo = new THREE.SphereGeometry(0.022, 12, 12);
        const eyeWhiteMat = new THREE.MeshStandardMaterial({
            color: 0xccccaa, // Yellowed/bloodshot
            roughness: 0.3
        });

        const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        leftEyeWhite.position.set(-0.042, 0.018, 0.095);

        const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
        rightEyeWhite.position.set(0.042, 0.018, 0.095);

        // Glowing red pupils
        const pupilGeo = new THREE.SphereGeometry(0.012, 10, 10);
        const eyeMat = new THREE.MeshStandardMaterial({
            color: eyeColor,
            emissive: eyeGlow,
            emissiveIntensity: 1.5
        });

        const leftEye = new THREE.Mesh(pupilGeo, eyeMat);
        leftEye.position.set(-0.04, 0.015, 0.115);
        leftEye.userData.isEye = true;

        const rightEye = new THREE.Mesh(pupilGeo, eyeMat);
        rightEye.position.set(0.04, 0.015, 0.115);
        rightEye.userData.isEye = true;

        group.userData.leftEye = leftEye;
        group.userData.rightEye = rightEye;

        // Human-like nose bridge and tip
        const noseBridgeGeo = new THREE.BoxGeometry(0.025, 0.04, 0.03);
        const noseBridge = new THREE.Mesh(noseBridgeGeo, skinMat);
        noseBridge.position.set(0, 0, 0.1);

        const noseTipGeo = new THREE.SphereGeometry(0.018, 8, 8);
        const noseTip = new THREE.Mesh(noseTipGeo, skinMat);
        noseTip.position.set(0, -0.025, 0.115);
        noseTip.scale.set(1.2, 0.8, 1);

        // Nostrils
        const nostrilGeo = new THREE.SphereGeometry(0.008, 6, 6);
        const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
        const leftNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
        leftNostril.position.set(-0.012, -0.035, 0.11);
        const rightNostril = new THREE.Mesh(nostrilGeo, nostrilMat);
        rightNostril.position.set(0.012, -0.035, 0.11);

        // Upper lip
        const upperLipGeo = new THREE.BoxGeometry(0.06, 0.015, 0.02);
        const upperLip = new THREE.Mesh(upperLipGeo, skinMatDark);
        upperLip.position.set(0, -0.055, 0.1);

        // Mouth cavity
        const mouthGeo = new THREE.BoxGeometry(0.055, 0.025, 0.025);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x1a0505 });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.position.set(0, -0.07, 0.095);
        mouth.userData.isMouth = true;
        group.userData.mouth = mouth;

        // Teeth (more realistic, slight gaps)
        const teethMat = new THREE.MeshStandardMaterial({ color: 0xcccc99, roughness: 0.4 });
        for (let i = 0; i < 6; i++) {
            const toothGeo = new THREE.BoxGeometry(0.007, 0.012, 0.008);
            const tooth = new THREE.Mesh(toothGeo, teethMat);
            tooth.position.set(-0.022 + i * 0.009, -0.06, 0.105);
            if (Math.random() > 0.8) tooth.visible = false;
            group.add(tooth);
        }

        // Jaw/chin (human-like)
        const jawGeo = new THREE.SphereGeometry(0.045, 10, 10);
        const jaw = new THREE.Mesh(jawGeo, skinMat);
        jaw.position.set(0, -0.09, 0.05);
        jaw.scale.set(1.5, 0.8, 1.2);
        jaw.userData.isJaw = true;
        group.userData.jaw = jaw;

        // Lower jaw for animation
        const lowerJawGeo = new THREE.BoxGeometry(0.08, 0.02, 0.04);
        const lowerJaw = new THREE.Mesh(lowerJawGeo, skinMat);
        lowerJaw.position.set(0, -0.085, 0.08);

        // Ears (more human-like)
        const earGeo = new THREE.SphereGeometry(0.025, 8, 8);
        const leftEar = new THREE.Mesh(earGeo, skinMat);
        leftEar.position.set(-0.115, 0, 0);
        leftEar.scale.set(0.4, 1.2, 0.8);

        const rightEar = new THREE.Mesh(earGeo, skinMat);
        rightEar.position.set(0.115, 0, 0);
        rightEar.scale.set(0.4, 1.2, 0.8);

        // Torn ear detail
        const tornEarGeo = new THREE.SphereGeometry(0.015, 6, 6);
        const tornEar = new THREE.Mesh(tornEarGeo, woundMat);
        tornEar.position.set(0.12, 0.02, 0);

        // Neck (thicker, more human proportions)
        const neckGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.12, 10);
        const neck = new THREE.Mesh(neckGeo, skinMat);
        neck.position.set(0, -0.17, -0.01);

        // Neck muscles/tendons visible
        const tendonGeo = new THREE.CylinderGeometry(0.008, 0.01, 0.1, 6);
        const leftTendon = new THREE.Mesh(tendonGeo, skinMatDark);
        leftTendon.position.set(-0.04, -0.16, 0.02);
        leftTendon.rotation.z = 0.15;
        const rightTendon = new THREE.Mesh(tendonGeo, skinMatDark);
        rightTendon.position.set(0.04, -0.16, 0.02);
        rightTendon.rotation.z = -0.15;

        // Some hair remnants (sparse)
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });
        for (let i = 0; i < 8; i++) {
            const hairGeo = new THREE.CylinderGeometry(0.003, 0.001, 0.04 + Math.random() * 0.03, 4);
            const hair = new THREE.Mesh(hairGeo, hairMat);
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.08 + Math.random() * 0.03;
            hair.position.set(
                Math.cos(angle) * radius,
                0.1 + Math.random() * 0.04,
                Math.sin(angle) * radius * 0.5 - 0.02
            );
            hair.rotation.x = Math.random() * 0.5 - 0.25;
            hair.rotation.z = Math.random() * 0.5 - 0.25;
            group.add(hair);
        }

        // Wound/gash on face
        const gashGeo = new THREE.BoxGeometry(0.015, 0.04, 0.01);
        const gash = new THREE.Mesh(gashGeo, woundMat);
        gash.position.set(-0.07, 0, 0.1);
        gash.rotation.z = 0.3;

        // Blood drip
        const bloodDripGeo = new THREE.CylinderGeometry(0.004, 0.002, 0.025, 6);
        const bloodMat = new THREE.MeshStandardMaterial({ color: this.BLOOD_COLOR, roughness: 0.3 });
        const bloodDrip = new THREE.Mesh(bloodDripGeo, bloodMat);
        bloodDrip.position.set(-0.07, -0.025, 0.1);

        group.add(head, forehead, leftCheek, rightCheek, brow,
                  leftSocket, rightSocket, leftEyeWhite, rightEyeWhite, leftEye, rightEye,
                  noseBridge, noseTip, leftNostril, rightNostril,
                  upperLip, mouth, jaw, lowerJaw,
                  leftEar, rightEar, tornEar,
                  neck, leftTendon, rightTendon,
                  gash, bloodDrip);

        return group;
    }

    /**
     * Create zombie torso with torn clothing - more human-like proportions
     */
    static createTorso(colors = null, zombieType = 'walker', clothColors = null, variation = null) {
        const group = new THREE.Group();

        const skinColor = colors?.SKIN_COLOR || this.SKIN_COLOR;
        const skinColorAlt = colors?.SKIN_COLOR_ALT || this.SKIN_COLOR_ALT;

        // Shirt material (torn, dirty) - use clothColors if provided
        const shirtColor = clothColors?.shirt || this.CLOTH_TORN;
        const shirtMat = new THREE.MeshStandardMaterial({
            color: shirtColor,
            roughness: 0.95
        });

        const skinMat = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.9
        });

        const skinMatDark = new THREE.MeshStandardMaterial({
            color: skinColorAlt,
            roughness: 0.95
        });

        // Upper chest (broader, more human)
        const upperChestGeo = new THREE.BoxGeometry(0.38, 0.22, 0.18);
        const upperChest = new THREE.Mesh(upperChestGeo, shirtMat);
        upperChest.position.set(0, 0.1, 0);

        // Ribcage shape
        const ribcageGeo = new THREE.CylinderGeometry(0.16, 0.14, 0.25, 12);
        const ribcage = new THREE.Mesh(ribcageGeo, shirtMat);
        ribcage.position.set(0, -0.05, 0);

        // Collarbones visible
        const collarboneGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.15, 6);
        const leftCollarbone = new THREE.Mesh(collarboneGeo, skinMat);
        leftCollarbone.position.set(-0.1, 0.2, 0.08);
        leftCollarbone.rotation.z = -0.5;
        leftCollarbone.rotation.x = 0.2;

        const rightCollarbone = new THREE.Mesh(collarboneGeo, skinMat);
        rightCollarbone.position.set(0.1, 0.2, 0.08);
        rightCollarbone.rotation.z = 0.5;
        rightCollarbone.rotation.x = 0.2;

        // Belly/abdomen (slimmer, more human)
        const bellyGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.18, 10);
        const belly = new THREE.Mesh(bellyGeo, shirtMat);
        belly.position.set(0, -0.2, 0);

        // Exposed skin patches (torn shirt effect)
        const patchGeo = new THREE.PlaneGeometry(0.08, 0.1);
        const patch1 = new THREE.Mesh(patchGeo, skinMat);
        patch1.position.set(0.08, 0.05, 0.1);

        const patch2 = new THREE.Mesh(patchGeo, skinMatDark);
        patch2.position.set(-0.1, -0.1, 0.1);
        patch2.rotation.z = 0.2;

        // Visible ribs through shirt (gaunt look)
        for (let i = 0; i < 4; i++) {
            const ribGeo = new THREE.CylinderGeometry(0.008, 0.01, 0.12, 6);
            const rib = new THREE.Mesh(ribGeo, skinMatDark);
            rib.position.set(0.06, -0.02 - i * 0.05, 0.095);
            rib.rotation.z = Math.PI / 2;
            rib.rotation.y = 0.3;
            group.add(rib);
        }

        // Shoulders (more anatomical)
        const shoulderGeo = new THREE.SphereGeometry(0.06, 10, 10);
        const leftShoulder = new THREE.Mesh(shoulderGeo, shirtMat);
        leftShoulder.position.set(-0.2, 0.18, 0);
        leftShoulder.scale.set(1.2, 0.8, 1);

        const rightShoulder = new THREE.Mesh(shoulderGeo.clone(), shirtMat);
        rightShoulder.position.set(0.2, 0.18, 0);
        rightShoulder.scale.set(1.2, 0.8, 1);

        // Deltoid muscles
        const deltoidGeo = new THREE.SphereGeometry(0.045, 8, 8);
        const leftDeltoid = new THREE.Mesh(deltoidGeo, shirtMat);
        leftDeltoid.position.set(-0.22, 0.14, 0.02);

        const rightDeltoid = new THREE.Mesh(deltoidGeo, shirtMat);
        rightDeltoid.position.set(0.22, 0.14, 0.02);

        // Waist/hip area (pants) - use clothColors if provided
        const pantsColor = clothColors?.pants || this.CLOTH_DARK;
        const waistGeo = new THREE.CylinderGeometry(0.13, 0.14, 0.12, 10);
        const hipsMat = new THREE.MeshStandardMaterial({
            color: pantsColor,
            roughness: 0.9
        });
        const waist = new THREE.Mesh(waistGeo, hipsMat);
        waist.position.set(0, -0.35, 0);

        // Belt
        const beltGeo = new THREE.TorusGeometry(0.135, 0.015, 8, 20);
        const beltMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.7 });
        const belt = new THREE.Mesh(beltGeo, beltMat);
        belt.rotation.x = Math.PI / 2;
        belt.position.set(0, -0.28, 0);

        // Belt buckle
        const buckleGeo = new THREE.BoxGeometry(0.04, 0.03, 0.01);
        const buckleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 });
        const buckle = new THREE.Mesh(buckleGeo, buckleMat);
        buckle.position.set(0, -0.28, 0.14);

        group.add(upperChest, ribcage, leftCollarbone, rightCollarbone,
                  belly, patch1, patch2,
                  leftShoulder, rightShoulder, leftDeltoid, rightDeltoid,
                  waist, belt, buckle);

        return group;
    }

    /**
     * Create zombie arm (left arm, right is mirrored) - more human proportions
     */
    static createArm(colors = null, variation = null, clothColors = null) {
        const group = new THREE.Group();

        const skinColor = colors?.SKIN_COLOR || this.SKIN_COLOR;
        const skinColorAlt = colors?.SKIN_COLOR_ALT || this.SKIN_COLOR_ALT;

        const skinMat = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.9
        });

        const skinMatDark = new THREE.MeshStandardMaterial({
            color: skinColorAlt,
            roughness: 0.95
        });

        const shirtMat = new THREE.MeshStandardMaterial({
            color: this.CLOTH_TORN,
            roughness: 0.95
        });

        // Upper arm with bicep/tricep shape
        const upperArmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.24, 10);
        const upperArm = new THREE.Mesh(upperArmGeo, shirtMat);
        upperArm.position.set(0, -0.12, 0);

        // Bicep muscle bulge
        const bicepGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const bicep = new THREE.Mesh(bicepGeo, shirtMat);
        bicep.position.set(0, -0.08, 0.025);
        bicep.scale.set(1, 1.5, 0.8);

        // Elbow joint (more anatomical)
        const elbowGeo = new THREE.SphereGeometry(0.038, 10, 10);
        const elbow = new THREE.Mesh(elbowGeo, skinMat);
        elbow.position.set(0, -0.26, 0);

        // Elbow bone visible
        const elbowBoneGeo = new THREE.SphereGeometry(0.018, 6, 6);
        const elbowBone = new THREE.Mesh(elbowBoneGeo, skinMatDark);
        elbowBone.position.set(0, -0.26, -0.03);

        // Forearm (exposed skin with muscle definition)
        const forearmGeo = new THREE.CylinderGeometry(0.038, 0.032, 0.22, 10);
        const forearm = new THREE.Mesh(forearmGeo, skinMat);
        forearm.position.set(0, -0.4, 0);

        // Forearm muscle
        const forearmMuscleGeo = new THREE.SphereGeometry(0.025, 6, 6);
        const forearmMuscle = new THREE.Mesh(forearmMuscleGeo, skinMat);
        forearmMuscle.position.set(0, -0.32, 0.02);
        forearmMuscle.scale.set(1, 1.8, 0.7);

        // Visible veins on forearm
        const veinGeo = new THREE.CylinderGeometry(0.004, 0.003, 0.15, 4);
        const vein = new THREE.Mesh(veinGeo, skinMatDark);
        vein.position.set(0.02, -0.38, 0.03);
        vein.rotation.z = 0.1;

        // Wrist (slimmer)
        const wristGeo = new THREE.CylinderGeometry(0.028, 0.03, 0.05, 8);
        const wrist = new THREE.Mesh(wristGeo, skinMat);
        wrist.position.set(0, -0.54, 0);

        // Hand (more human, slightly clawed)
        const palmGeo = new THREE.BoxGeometry(0.06, 0.07, 0.025);
        const palm = new THREE.Mesh(palmGeo, skinMat);
        palm.position.set(0, -0.61, 0);

        // Knuckles
        const knuckleGeo = new THREE.SphereGeometry(0.012, 6, 6);
        for (let i = 0; i < 4; i++) {
            const knuckle = new THREE.Mesh(knuckleGeo, skinMat);
            knuckle.position.set(-0.02 + i * 0.014, -0.65, 0.012);
            group.add(knuckle);
        }

        // Fingers (more human proportions, slightly curled)
        for (let i = 0; i < 4; i++) {
            const fingerGroup = new THREE.Group();

            // Finger base
            const finger1Geo = new THREE.CylinderGeometry(0.009, 0.008, 0.035, 6);
            const finger1 = new THREE.Mesh(finger1Geo, skinMat);
            finger1.position.y = -0.018;

            // Finger middle
            const finger2Geo = new THREE.CylinderGeometry(0.008, 0.007, 0.028, 6);
            const finger2 = new THREE.Mesh(finger2Geo, skinMat);
            finger2.position.y = -0.048;
            finger2.rotation.x = 0.2;

            // Finger tip
            const finger3Geo = new THREE.CylinderGeometry(0.006, 0.005, 0.022, 6);
            const finger3 = new THREE.Mesh(finger3Geo, skinMat);
            finger3.position.y = -0.072;
            finger3.rotation.x = 0.3;

            // Fingernail (dirty/broken)
            const nailGeo = new THREE.BoxGeometry(0.008, 0.012, 0.003);
            const nailMat = new THREE.MeshStandardMaterial({ color: 0x3a3a2a, roughness: 0.6 });
            const nail = new THREE.Mesh(nailGeo, nailMat);
            nail.position.set(0, -0.082, 0.006);

            fingerGroup.add(finger1, finger2, finger3, nail);
            fingerGroup.position.set(-0.02 + i * 0.014, -0.65, 0);
            fingerGroup.rotation.x = 0.15; // Slight curl
            group.add(fingerGroup);
        }

        // Thumb
        const thumbGroup = new THREE.Group();
        const thumb1Geo = new THREE.CylinderGeometry(0.01, 0.009, 0.03, 6);
        const thumb1 = new THREE.Mesh(thumb1Geo, skinMat);
        const thumb2Geo = new THREE.CylinderGeometry(0.009, 0.007, 0.025, 6);
        const thumb2 = new THREE.Mesh(thumb2Geo, skinMat);
        thumb2.position.y = -0.028;
        thumbGroup.add(thumb1, thumb2);
        thumbGroup.position.set(0.038, -0.6, 0.01);
        thumbGroup.rotation.z = -0.7;
        thumbGroup.rotation.x = 0.3;

        group.add(upperArm, bicep, elbow, elbowBone, forearm, forearmMuscle, vein, wrist, palm, thumbGroup);

        return group;
    }

    /**
     * Create zombie leg - more human proportions
     */
    static createLeg(colors = null, variation = null, clothColors = null) {
        const group = new THREE.Group();

        const skinColor = colors?.SKIN_COLOR || this.SKIN_COLOR;

        const pantsColor = clothColors?.pants || this.CLOTH_DARK;
        const pantsMat = new THREE.MeshStandardMaterial({
            color: pantsColor,
            roughness: 0.9
        });

        const skinMat = new THREE.MeshStandardMaterial({
            color: skinColor,
            roughness: 0.9
        });

        const shoeMat = new THREE.MeshStandardMaterial({
            color: 0x2a1a0a,
            roughness: 0.95
        });

        // Thigh (with muscle definition)
        const thighGeo = new THREE.CylinderGeometry(0.068, 0.055, 0.35, 12);
        const thigh = new THREE.Mesh(thighGeo, pantsMat);
        thigh.position.set(0, 0, 0);

        // Quadricep muscle bulge
        const quadGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const quad = new THREE.Mesh(quadGeo, pantsMat);
        quad.position.set(0, 0.05, 0.035);
        quad.scale.set(1.2, 1.8, 0.7);

        // Knee cap (more detailed)
        const kneeGeo = new THREE.SphereGeometry(0.045, 10, 10);
        const knee = new THREE.Mesh(kneeGeo, pantsMat);
        knee.position.set(0, -0.2, 0.02);

        // Kneecap detail
        const kneecapGeo = new THREE.SphereGeometry(0.025, 8, 8);
        const kneecap = new THREE.Mesh(kneecapGeo, pantsMat);
        kneecap.position.set(0, -0.2, 0.045);
        kneecap.scale.set(1.2, 1, 0.6);

        // Shin/calf (with muscle)
        const shinGeo = new THREE.CylinderGeometry(0.048, 0.038, 0.32, 10);
        const shin = new THREE.Mesh(shinGeo, pantsMat);
        shin.position.set(0, -0.38, 0);

        // Calf muscle
        const calfGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const calf = new THREE.Mesh(calfGeo, pantsMat);
        calf.position.set(0, -0.3, -0.025);
        calf.scale.set(0.9, 1.8, 1);

        // Ankle (exposed skin)
        const ankleGeo = new THREE.CylinderGeometry(0.032, 0.035, 0.06, 8);
        const ankle = new THREE.Mesh(ankleGeo, skinMat);
        ankle.position.set(0, -0.56, 0);

        // Ankle bone visible
        const ankleBoneGeo = new THREE.SphereGeometry(0.015, 6, 6);
        const leftAnkleBone = new THREE.Mesh(ankleBoneGeo, skinMat);
        leftAnkleBone.position.set(-0.035, -0.55, 0);
        const rightAnkleBone = new THREE.Mesh(ankleBoneGeo, skinMat);
        rightAnkleBone.position.set(0.035, -0.55, 0);

        // Foot/shoe (more detailed)
        const footBaseGeo = new THREE.BoxGeometry(0.08, 0.04, 0.14);
        const footBase = new THREE.Mesh(footBaseGeo, shoeMat);
        footBase.position.set(0, -0.61, 0.02);

        // Shoe toe area
        const toeGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const toe = new THREE.Mesh(toeGeo, shoeMat);
        toe.position.set(0, -0.61, 0.08);
        toe.scale.set(1, 0.5, 1.2);

        // Shoe heel
        const heelGeo = new THREE.BoxGeometry(0.06, 0.02, 0.04);
        const heel = new THREE.Mesh(heelGeo, shoeMat);
        heel.position.set(0, -0.64, -0.04);

        // Shoe sole
        const soleGeo = new THREE.BoxGeometry(0.085, 0.015, 0.16);
        const soleMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 });
        const sole = new THREE.Mesh(soleGeo, soleMat);
        sole.position.set(0, -0.65, 0.02);

        group.add(thigh, quad, knee, kneecap, shin, calf, ankle,
                  leftAnkleBone, rightAnkleBone,
                  footBase, toe, heel, sole);

        return group;
    }

    /**
     * Create a simpler LOD version for distant zombies
     */
    static createSimple() {
        const group = new THREE.Group();

        const mat = new THREE.MeshStandardMaterial({
            color: this.SKIN_COLOR,
            roughness: 0.9
        });

        // Simple body (single box)
        const bodyGeo = new THREE.BoxGeometry(0.5, 1.4, 0.3);
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 0.9;

        // Simple head
        const headGeo = new THREE.SphereGeometry(0.18, 8, 8);
        const head = new THREE.Mesh(headGeo, mat);
        head.position.y = 1.7;

        // Eyes
        const eyeGeo = new THREE.SphereGeometry(0.03, 6, 6);
        const eyeMat = new THREE.MeshBasicMaterial({ color: this.EYE_COLOR });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.06, 1.72, 0.15);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.06, 1.72, 0.15);

        group.add(body, head, leftEye, rightEye);

        group.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
            }
        });

        return group;
    }
}
