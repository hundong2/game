import * as THREE from 'three';

/**
 * Procedural Zombie Model
 * Creates a humanoid zombie using Three.js primitives
 */
export class ProceduralZombie {

    // Zombie appearance colors
    static SKIN_COLOR = 0x556b2f;      // Dark olive green (zombie skin)
    static SKIN_COLOR_ALT = 0x4a5d23;  // Slightly different shade
    static EYE_COLOR = 0xff0000;       // Glowing red eyes
    static CLOTH_DARK = 0x1a1a1a;      // Dark pants
    static CLOTH_TORN = 0x2d2d2d;      // Torn shirt

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
     * Create zombie head with glowing eyes
     */
    static createHead() {
        const group = new THREE.Group();

        const skinMat = new THREE.MeshStandardMaterial({
            color: this.SKIN_COLOR,
            roughness: 0.9,
            metalness: 0.1
        });

        // Main head (slightly elongated sphere)
        const headGeo = new THREE.SphereGeometry(0.18, 12, 10);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.scale.y = 1.1;

        // Brow ridge (makes it look more menacing)
        const browGeo = new THREE.BoxGeometry(0.2, 0.04, 0.1);
        const brow = new THREE.Mesh(browGeo, skinMat);
        brow.position.set(0, 0.08, 0.12);

        // Eyes (glowing red)
        const eyeGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({
            color: this.EYE_COLOR
        });

        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.07, 0.03, 0.14);

        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.07, 0.03, 0.14);

        // Dark eye sockets
        const socketGeo = new THREE.SphereGeometry(0.045, 8, 8);
        const socketMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 1
        });

        const leftSocket = new THREE.Mesh(socketGeo, socketMat);
        leftSocket.position.set(-0.07, 0.03, 0.12);

        const rightSocket = new THREE.Mesh(socketGeo, socketMat);
        rightSocket.position.set(0.07, 0.03, 0.12);

        // Mouth (dark gap with teeth hints)
        const mouthGeo = new THREE.BoxGeometry(0.1, 0.04, 0.05);
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.position.set(0, -0.08, 0.14);

        // Simple teeth
        const teethGeo = new THREE.BoxGeometry(0.08, 0.015, 0.02);
        const teethMat = new THREE.MeshStandardMaterial({ color: 0xccccaa });
        const teeth = new THREE.Mesh(teethGeo, teethMat);
        teeth.position.set(0, -0.065, 0.15);

        // Ears (small bumps)
        const earGeo = new THREE.SphereGeometry(0.04, 6, 6);
        const leftEar = new THREE.Mesh(earGeo, skinMat);
        leftEar.position.set(-0.17, 0, 0);
        leftEar.scale.set(0.5, 1, 0.8);

        const rightEar = new THREE.Mesh(earGeo, skinMat);
        rightEar.position.set(0.17, 0, 0);
        rightEar.scale.set(0.5, 1, 0.8);

        // Neck
        const neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.12, 8);
        const neck = new THREE.Mesh(neckGeo, skinMat);
        neck.position.set(0, -0.2, 0);

        group.add(head, brow, leftSocket, rightSocket, leftEye, rightEye,
                  mouth, teeth, leftEar, rightEar, neck);

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
