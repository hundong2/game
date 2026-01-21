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

    /**
     * Create a complete zombie model
     * @returns {THREE.Group} Zombie model group with animation references
     */
    static create() {
        const group = new THREE.Group();

        // Create body parts
        const head = this.createHead();
        const torso = this.createTorso();
        const leftArm = this.createArm();
        const rightArm = this.createArm();
        const leftLeg = this.createLeg();
        const rightLeg = this.createLeg();

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

        // Store references for animation
        group.userData = {
            head,
            torso,
            leftArm,
            rightArm,
            leftLeg,
            rightLeg,
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
     * Create zombie head with glowing eyes and horrific details
     */
    static createHead() {
        const group = new THREE.Group();

        const skinMat = new THREE.MeshStandardMaterial({
            color: this.SKIN_COLOR,
            roughness: 0.85,
            metalness: 0.05
        });

        const woundMat = new THREE.MeshStandardMaterial({
            color: this.SKIN_WOUND,
            roughness: 0.6,
            metalness: 0.2
        });

        // Main head (slightly elongated, asymmetric skull)
        const headGeo = new THREE.SphereGeometry(0.18, 16, 12);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.scale.set(1, 1.1, 0.95);

        // Deformed skull bump
        const skullBumpGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const skullBump = new THREE.Mesh(skullBumpGeo, skinMat);
        skullBump.position.set(0.08, 0.12, -0.05);

        // Brow ridge (more pronounced, menacing)
        const browGeo = new THREE.BoxGeometry(0.22, 0.05, 0.12);
        const brow = new THREE.Mesh(browGeo, skinMat);
        brow.position.set(0, 0.1, 0.1);
        brow.rotation.x = 0.2;

        // Deep eye sockets (dark hollows)
        const socketGeo = new THREE.SphereGeometry(0.055, 10, 10);
        const socketMat = new THREE.MeshStandardMaterial({
            color: 0x0a0a0a,
            roughness: 1
        });

        const leftSocket = new THREE.Mesh(socketGeo, socketMat);
        leftSocket.position.set(-0.07, 0.03, 0.1);
        leftSocket.scale.set(1, 1.2, 0.6);

        const rightSocket = new THREE.Mesh(socketGeo, socketMat);
        rightSocket.position.set(0.07, 0.03, 0.1);
        rightSocket.scale.set(1, 1.2, 0.6);

        // Glowing eyes with emissive material
        const eyeGeo = new THREE.SphereGeometry(0.04, 10, 10);
        const eyeMat = new THREE.MeshStandardMaterial({
            color: this.EYE_COLOR,
            emissive: this.EYE_GLOW,
            emissiveIntensity: 1.5
        });

        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.065, 0.02, 0.13);
        leftEye.userData.isEye = true;

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.065, 0.02, 0.13);
        rightEye.userData.isEye = true;

        // Store eye references for pulsing animation
        group.userData.leftEye = leftEye;
        group.userData.rightEye = rightEye;

        // Rotting nose (partially missing)
        const noseGeo = new THREE.ConeGeometry(0.025, 0.05, 4);
        const nose = new THREE.Mesh(noseGeo, skinMat);
        nose.position.set(0, -0.02, 0.16);
        nose.rotation.x = Math.PI;

        // Gaping mouth with exposed teeth
        const mouthGeo = new THREE.BoxGeometry(0.12, 0.06, 0.06);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x080808 });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.position.set(0, -0.09, 0.13);
        mouth.userData.isMouth = true;
        group.userData.mouth = mouth;

        // Upper teeth (jagged)
        const teethMat = new THREE.MeshStandardMaterial({ color: 0xaaaa88, roughness: 0.4 });
        for (let i = 0; i < 5; i++) {
            const toothGeo = new THREE.ConeGeometry(0.008, 0.02 + Math.random() * 0.01, 4);
            const tooth = new THREE.Mesh(toothGeo, teethMat);
            tooth.position.set(-0.04 + i * 0.02, -0.065, 0.155);
            tooth.rotation.x = Math.PI;
            if (Math.random() > 0.7) tooth.visible = false; // Missing teeth
            group.add(tooth);
        }

        // Lower teeth
        for (let i = 0; i < 4; i++) {
            const toothGeo = new THREE.ConeGeometry(0.007, 0.015 + Math.random() * 0.008, 4);
            const tooth = new THREE.Mesh(toothGeo, teethMat);
            tooth.position.set(-0.03 + i * 0.02, -0.11, 0.155);
            if (Math.random() > 0.6) tooth.visible = false;
            group.add(tooth);
        }

        // Jaw (lower, slightly open)
        const jawGeo = new THREE.BoxGeometry(0.14, 0.04, 0.08);
        const jaw = new THREE.Mesh(jawGeo, skinMat);
        jaw.position.set(0, -0.12, 0.1);
        jaw.userData.isJaw = true;
        group.userData.jaw = jaw;

        // Torn cheek wound
        const woundGeo = new THREE.SphereGeometry(0.03, 6, 6);
        const cheekWound = new THREE.Mesh(woundGeo, woundMat);
        cheekWound.position.set(-0.12, -0.02, 0.1);
        cheekWound.scale.set(1.5, 1, 0.5);

        // Blood drip from mouth
        const bloodDripGeo = new THREE.CylinderGeometry(0.008, 0.003, 0.04, 6);
        const bloodMat = new THREE.MeshStandardMaterial({ color: this.BLOOD_COLOR, roughness: 0.3 });
        const bloodDrip = new THREE.Mesh(bloodDripGeo, bloodMat);
        bloodDrip.position.set(0.02, -0.14, 0.14);

        // Ears (torn/damaged)
        const earGeo = new THREE.SphereGeometry(0.035, 6, 6);
        const leftEar = new THREE.Mesh(earGeo, skinMat);
        leftEar.position.set(-0.17, 0, 0);
        leftEar.scale.set(0.5, 1, 0.8);

        // Right ear missing part
        const rightEar = new THREE.Mesh(earGeo, woundMat);
        rightEar.position.set(0.17, 0.02, 0);
        rightEar.scale.set(0.3, 0.6, 0.5);

        // Exposed skull patch
        const skullPatchGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const boneMat = new THREE.MeshStandardMaterial({ color: this.BONE_COLOR, roughness: 0.7 });
        const skullPatch = new THREE.Mesh(skullPatchGeo, boneMat);
        skullPatch.position.set(-0.1, 0.15, 0.02);
        skullPatch.scale.set(1, 0.6, 0.4);

        // Neck (with visible tendons)
        const neckGeo = new THREE.CylinderGeometry(0.07, 0.1, 0.14, 8);
        const neck = new THREE.Mesh(neckGeo, skinMat);
        neck.position.set(0, -0.22, 0);

        // Neck wound
        const neckWoundGeo = new THREE.BoxGeometry(0.04, 0.03, 0.02);
        const neckWound = new THREE.Mesh(neckWoundGeo, woundMat);
        neckWound.position.set(0.05, -0.18, 0.06);

        group.add(head, skullBump, brow, leftSocket, rightSocket, leftEye, rightEye,
                  nose, mouth, jaw, cheekWound, bloodDrip, leftEar, rightEar,
                  skullPatch, neck, neckWound);

        return group;
    }

    /**
     * Create zombie torso with torn clothing
     */
    static createTorso() {
        const group = new THREE.Group();

        // Shirt material (torn, dirty)
        const shirtMat = new THREE.MeshStandardMaterial({
            color: this.CLOTH_TORN,
            roughness: 0.95
        });

        const skinMat = new THREE.MeshStandardMaterial({
            color: this.SKIN_COLOR,
            roughness: 0.9
        });

        // Main torso (chest)
        const chestGeo = new THREE.BoxGeometry(0.45, 0.5, 0.22);
        const chest = new THREE.Mesh(chestGeo, shirtMat);

        // Belly (slightly protruding)
        const bellyGeo = new THREE.SphereGeometry(0.18, 8, 8);
        const belly = new THREE.Mesh(bellyGeo, shirtMat);
        belly.position.set(0, -0.2, 0.05);
        belly.scale.set(1.2, 0.8, 0.8);

        // Exposed skin patches (torn shirt effect)
        const patchGeo = new THREE.PlaneGeometry(0.1, 0.15);
        const patch1 = new THREE.Mesh(patchGeo, skinMat);
        patch1.position.set(0.1, 0.1, 0.115);

        const patch2 = new THREE.Mesh(patchGeo, skinMat);
        patch2.position.set(-0.12, -0.05, 0.115);
        patch2.rotation.z = 0.3;

        // Shoulders
        const shoulderGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const leftShoulder = new THREE.Mesh(shoulderGeo, shirtMat);
        leftShoulder.position.set(-0.25, 0.2, 0);

        const rightShoulder = new THREE.Mesh(shoulderGeo, shirtMat);
        rightShoulder.position.set(0.25, 0.2, 0);

        // Hips/belt area
        const hipsGeo = new THREE.BoxGeometry(0.4, 0.15, 0.2);
        const hipsMat = new THREE.MeshStandardMaterial({
            color: this.CLOTH_DARK,
            roughness: 0.9
        });
        const hips = new THREE.Mesh(hipsGeo, hipsMat);
        hips.position.set(0, -0.35, 0);

        group.add(chest, belly, patch1, patch2, leftShoulder, rightShoulder, hips);

        return group;
    }

    /**
     * Create zombie arm (left arm, right is mirrored)
     */
    static createArm() {
        const group = new THREE.Group();

        const skinMat = new THREE.MeshStandardMaterial({
            color: this.SKIN_COLOR,
            roughness: 0.9
        });

        const shirtMat = new THREE.MeshStandardMaterial({
            color: this.CLOTH_TORN,
            roughness: 0.95
        });

        // Upper arm (with torn sleeve)
        const upperArmGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.28, 8);
        const upperArm = new THREE.Mesh(upperArmGeo, shirtMat);
        upperArm.position.set(0, -0.14, 0);

        // Elbow joint
        const elbowGeo = new THREE.SphereGeometry(0.05, 8, 8);
        const elbow = new THREE.Mesh(elbowGeo, skinMat);
        elbow.position.set(0, -0.3, 0);

        // Forearm (exposed skin)
        const forearmGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.25, 8);
        const forearm = new THREE.Mesh(forearmGeo, skinMat);
        forearm.position.set(0, -0.45, 0);

        // Wrist
        const wristGeo = new THREE.SphereGeometry(0.035, 6, 6);
        const wrist = new THREE.Mesh(wristGeo, skinMat);
        wrist.position.set(0, -0.6, 0);

        // Hand (claw-like)
        const handGeo = new THREE.BoxGeometry(0.07, 0.1, 0.03);
        const hand = new THREE.Mesh(handGeo, skinMat);
        hand.position.set(0, -0.7, 0);

        // Fingers (clawed)
        const fingerGeo = new THREE.CylinderGeometry(0.008, 0.005, 0.06, 4);
        for (let i = 0; i < 4; i++) {
            const finger = new THREE.Mesh(fingerGeo, skinMat);
            finger.position.set(-0.022 + i * 0.015, -0.78, 0);
            finger.rotation.x = 0.3; // Curved like claws
            group.add(finger);
        }

        // Thumb
        const thumb = new THREE.Mesh(fingerGeo, skinMat);
        thumb.position.set(0.04, -0.72, 0.015);
        thumb.rotation.z = -0.8;

        group.add(upperArm, elbow, forearm, wrist, hand, thumb);

        return group;
    }

    /**
     * Create zombie leg
     */
    static createLeg() {
        const group = new THREE.Group();

        const pantsMat = new THREE.MeshStandardMaterial({
            color: this.CLOTH_DARK,
            roughness: 0.9
        });

        const skinMat = new THREE.MeshStandardMaterial({
            color: this.SKIN_COLOR,
            roughness: 0.9
        });

        const shoeMat = new THREE.MeshStandardMaterial({
            color: 0x2a1a0a,
            roughness: 0.95
        });

        // Thigh
        const thighGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.38, 8);
        const thigh = new THREE.Mesh(thighGeo, pantsMat);
        thigh.position.set(0, 0, 0);

        // Knee
        const kneeGeo = new THREE.SphereGeometry(0.055, 8, 8);
        const knee = new THREE.Mesh(kneeGeo, pantsMat);
        knee.position.set(0, -0.22, 0.02);

        // Shin (some pants, some exposed)
        const shinGeo = new THREE.CylinderGeometry(0.055, 0.045, 0.35, 8);
        const shin = new THREE.Mesh(shinGeo, pantsMat);
        shin.position.set(0, -0.42, 0);

        // Ankle
        const ankleGeo = new THREE.SphereGeometry(0.04, 6, 6);
        const ankle = new THREE.Mesh(ankleGeo, skinMat);
        ankle.position.set(0, -0.62, 0);

        // Foot/shoe
        const footGeo = new THREE.BoxGeometry(0.08, 0.05, 0.15);
        const foot = new THREE.Mesh(footGeo, shoeMat);
        foot.position.set(0, -0.67, 0.03);

        group.add(thigh, knee, shin, ankle, foot);

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
