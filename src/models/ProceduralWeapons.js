import * as THREE from 'three';

/**
 * Procedural weapon models for each character class
 * No external GLB files needed - all created with Three.js primitives
 */
export class ProceduralWeapons {

    // Skin color for hands
    static SKIN_COLOR = 0xe0ac69;

    /**
     * Create weapon model based on character type
     */
    static createWeapon(characterType) {
        switch (characterType) {
            case 'Knight':
                return this.createKnightSword();
            case 'Sniper':
                return this.createSniperRifle();
            case 'MachineGun':
                return this.createMachineGun();
            case 'Archer':
                return this.createArcherBow();
            case 'Wizard':
                return this.createWizardStaff();
            default:
                return this.createKnightSword();
        }
    }

    /**
     * Knight's Sword - Medieval longsword
     */
    static createKnightSword() {
        const group = new THREE.Group();

        // Handle (brown cylinder)
        const handleGeo = new THREE.CylinderGeometry(0.025, 0.03, 0.2, 8);
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0x4a3728,
            roughness: 0.8
        });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.x = Math.PI / 2;

        // Pommel (sphere at bottom)
        const pommelGeo = new THREE.SphereGeometry(0.035, 8, 8);
        const pommelMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.8,
            roughness: 0.2
        });
        const pommel = new THREE.Mesh(pommelGeo, pommelMat);
        pommel.position.z = 0.12;

        // Guard (gold cross)
        const guardGeo = new THREE.BoxGeometry(0.18, 0.025, 0.025);
        const guardMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.8,
            roughness: 0.2
        });
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.position.z = -0.1;

        // Blade (silver flat box)
        const bladeGeo = new THREE.BoxGeometry(0.04, 0.012, 0.55);
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.1
        });
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.z = -0.38;

        // Blade tip (tapered)
        const tipGeo = new THREE.ConeGeometry(0.02, 0.08, 4);
        const tip = new THREE.Mesh(tipGeo, bladeMat);
        tip.rotation.x = -Math.PI / 2;
        tip.position.z = -0.69;

        group.add(handle, pommel, guard, blade, tip);

        // Position for right hand view
        group.position.set(0.25, -0.2, -0.3);
        group.rotation.set(0.3, -0.5, 0.8);

        return group;
    }

    /**
     * Sniper Rifle - Long range precision weapon
     */
    static createSniperRifle() {
        const group = new THREE.Group();

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.7,
            roughness: 0.3
        });
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x5c4033,
            roughness: 0.8
        });

        // Barrel (long cylinder)
        const barrelGeo = new THREE.CylinderGeometry(0.015, 0.02, 0.8, 8);
        const barrel = new THREE.Mesh(barrelGeo, metalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.5;

        // Barrel shroud
        const shroudGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.3, 8);
        const shroud = new THREE.Mesh(shroudGeo, metalMat);
        shroud.rotation.x = Math.PI / 2;
        shroud.position.z = -0.25;

        // Receiver (main body)
        const receiverGeo = new THREE.BoxGeometry(0.06, 0.1, 0.25);
        const receiver = new THREE.Mesh(receiverGeo, metalMat);
        receiver.position.set(0, 0.02, 0);

        // Stock (wooden)
        const stockGeo = new THREE.BoxGeometry(0.05, 0.08, 0.2);
        const stock = new THREE.Mesh(stockGeo, woodMat);
        stock.position.set(0, -0.01, 0.2);

        // Buttpad
        const buttGeo = new THREE.BoxGeometry(0.05, 0.1, 0.03);
        const buttMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const butt = new THREE.Mesh(buttGeo, buttMat);
        butt.position.set(0, -0.01, 0.32);

        // Scope
        const scopeBodyGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
        const scopeBody = new THREE.Mesh(scopeBodyGeo, metalMat);
        scopeBody.rotation.x = Math.PI / 2;
        scopeBody.position.set(0, 0.09, -0.05);

        // Scope lenses
        const lensGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.01, 8);
        const lensMat = new THREE.MeshStandardMaterial({
            color: 0x4444ff,
            metalness: 0.3,
            roughness: 0.1
        });
        const frontLens = new THREE.Mesh(lensGeo, lensMat);
        frontLens.rotation.x = Math.PI / 2;
        frontLens.position.set(0, 0.09, -0.13);

        // Magazine
        const magGeo = new THREE.BoxGeometry(0.03, 0.12, 0.06);
        const mag = new THREE.Mesh(magGeo, metalMat);
        mag.position.set(0, -0.08, 0.05);

        // Trigger guard
        const triggerGuardGeo = new THREE.TorusGeometry(0.025, 0.005, 4, 8, Math.PI);
        const triggerGuard = new THREE.Mesh(triggerGuardGeo, metalMat);
        triggerGuard.rotation.x = Math.PI / 2;
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0, -0.04, 0.05);

        group.add(barrel, shroud, receiver, stock, butt, scopeBody, frontLens, mag, triggerGuard);

        // Position for FPS view
        group.position.set(0.2, -0.15, -0.4);
        group.rotation.set(0, 0, 0);

        return group;
    }

    /**
     * Machine Gun - High fire rate weapon
     */
    static createMachineGun() {
        const group = new THREE.Group();

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x2d2d2d,
            metalness: 0.6,
            roughness: 0.4
        });
        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.6
        });

        // Barrel (shorter, thicker)
        const barrelGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.4, 8);
        const barrel = new THREE.Mesh(barrelGeo, metalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.35;

        // Barrel shroud with holes
        const shroudGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.25, 8);
        const shroud = new THREE.Mesh(shroudGeo, metalMat);
        shroud.rotation.x = Math.PI / 2;
        shroud.position.z = -0.22;

        // Main body
        const bodyGeo = new THREE.BoxGeometry(0.08, 0.12, 0.2);
        const body = new THREE.Mesh(bodyGeo, metalMat);
        body.position.set(0, 0, 0);

        // Drum magazine
        const drumGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.08, 16);
        const drum = new THREE.Mesh(drumGeo, darkMat);
        drum.rotation.z = Math.PI / 2;
        drum.position.set(0, -0.1, 0);

        // Stock (foldable style)
        const stockGeo = new THREE.BoxGeometry(0.04, 0.06, 0.15);
        const stock = new THREE.Mesh(stockGeo, darkMat);
        stock.position.set(0, 0, 0.17);

        // Foregrip
        const gripGeo = new THREE.BoxGeometry(0.03, 0.08, 0.03);
        const grip = new THREE.Mesh(gripGeo, darkMat);
        grip.position.set(0, -0.1, -0.1);

        // Rear grip
        const rearGripGeo = new THREE.BoxGeometry(0.035, 0.1, 0.04);
        const rearGrip = new THREE.Mesh(rearGripGeo, darkMat);
        rearGrip.rotation.x = 0.3;
        rearGrip.position.set(0, -0.08, 0.08);

        // Carry handle / rail
        const railGeo = new THREE.BoxGeometry(0.03, 0.02, 0.15);
        const rail = new THREE.Mesh(railGeo, metalMat);
        rail.position.set(0, 0.07, -0.02);

        group.add(barrel, shroud, body, drum, stock, grip, rearGrip, rail);

        // Position for FPS view
        group.position.set(0.18, -0.12, -0.35);
        group.rotation.set(0, 0, 0);

        return group;
    }

    /**
     * Archer's Bow - Traditional recurve bow
     */
    static createArcherBow() {
        const group = new THREE.Group();

        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x8b4513,
            roughness: 0.7
        });
        const stringMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
        const arrowMat = new THREE.MeshStandardMaterial({ color: 0x654321 });

        // Bow limbs (curved using torus segments)
        const bowCurve = new THREE.TorusGeometry(0.35, 0.015, 6, 16, Math.PI * 0.8);
        const bow = new THREE.Mesh(bowCurve, woodMat);
        bow.rotation.y = Math.PI / 2;
        bow.rotation.z = Math.PI / 2;

        // Bow grip (center)
        const gripGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.12, 8);
        const grip = new THREE.Mesh(gripGeo, woodMat);

        // Bowstring
        const stringGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.65, 4);
        const string = new THREE.Mesh(stringGeo, stringMat);
        string.position.z = 0.08;

        // Arrow (nocked and ready)
        const shaftGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.6, 6);
        const shaft = new THREE.Mesh(shaftGeo, arrowMat);
        shaft.rotation.x = Math.PI / 2;
        shaft.position.z = -0.22;

        // Arrow head
        const headGeo = new THREE.ConeGeometry(0.015, 0.05, 4);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0x888888,
            metalness: 0.8
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.rotation.x = -Math.PI / 2;
        head.position.z = -0.55;

        // Arrow fletching
        const fletchGeo = new THREE.BoxGeometry(0.03, 0.002, 0.06);
        const fletchMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
        const fletch1 = new THREE.Mesh(fletchGeo, fletchMat);
        fletch1.position.set(0, 0.015, 0.05);
        const fletch2 = new THREE.Mesh(fletchGeo, fletchMat);
        fletch2.position.set(0, -0.015, 0.05);
        fletch2.rotation.z = Math.PI / 2;

        group.add(bow, grip, string, shaft, head, fletch1, fletch2);

        // Position for FPS view (held vertically on left side)
        group.position.set(-0.25, -0.1, -0.3);
        group.rotation.set(0, 0.3, 0);

        return group;
    }

    /**
     * Wizard's Staff - Magical staff with crystal
     */
    static createWizardStaff() {
        const group = new THREE.Group();

        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x4a3728,
            roughness: 0.8
        });

        // Staff body (tapered cylinder)
        const staffGeo = new THREE.CylinderGeometry(0.02, 0.035, 1.0, 8);
        const staff = new THREE.Mesh(staffGeo, woodMat);
        staff.rotation.x = Math.PI / 2;
        staff.position.z = -0.2;

        // Staff head ornament
        const headRingGeo = new THREE.TorusGeometry(0.05, 0.01, 6, 16);
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.8,
            roughness: 0.2
        });
        const headRing = new THREE.Mesh(headRingGeo, goldMat);
        headRing.position.z = -0.72;

        // Crystal (glowing)
        const crystalGeo = new THREE.IcosahedronGeometry(0.06, 0);
        const crystalMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.6,
            transparent: true,
            opacity: 0.85,
            roughness: 0.1
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.z = -0.75;

        // Crystal glow (larger transparent sphere)
        const glowGeo = new THREE.SphereGeometry(0.09, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.z = -0.75;

        // Decorative bands
        const bandGeo = new THREE.TorusGeometry(0.028, 0.005, 4, 8);
        const band1 = new THREE.Mesh(bandGeo, goldMat);
        band1.rotation.x = Math.PI / 2;
        band1.position.z = -0.1;
        const band2 = new THREE.Mesh(bandGeo.clone(), goldMat);
        band2.rotation.x = Math.PI / 2;
        band2.position.z = -0.5;

        group.add(staff, headRing, crystal, glow, band1, band2);

        // Store crystal reference for animation
        group.userData.crystal = crystal;
        group.userData.glow = glow;

        // Position for FPS view
        group.position.set(0.2, -0.25, -0.3);
        group.rotation.set(0.2, -0.2, 0.3);

        return group;
    }

    /**
     * Create hand model (common for all weapons)
     */
    static createHand(isLeft = false) {
        const group = new THREE.Group();

        const skinMat = new THREE.MeshStandardMaterial({
            color: this.SKIN_COLOR,
            roughness: 0.8
        });

        // Palm
        const palmGeo = new THREE.BoxGeometry(0.07, 0.09, 0.03);
        const palm = new THREE.Mesh(palmGeo, skinMat);

        // Fingers (4)
        const fingerGeo = new THREE.BoxGeometry(0.015, 0.055, 0.015);
        for (let i = 0; i < 4; i++) {
            const finger = new THREE.Mesh(fingerGeo, skinMat);
            finger.position.set(-0.022 + i * 0.015, 0.07, 0);

            // Fingertip
            const tipGeo = new THREE.SphereGeometry(0.008, 6, 6);
            const tip = new THREE.Mesh(tipGeo, skinMat);
            tip.position.y = 0.03;
            finger.add(tip);

            group.add(finger);
        }

        // Thumb
        const thumbGeo = new THREE.BoxGeometry(0.015, 0.04, 0.015);
        const thumb = new THREE.Mesh(thumbGeo, skinMat);
        thumb.position.set(isLeft ? -0.045 : 0.045, 0.02, 0.01);
        thumb.rotation.z = isLeft ? 0.5 : -0.5;

        // Thumb tip
        const thumbTipGeo = new THREE.SphereGeometry(0.008, 6, 6);
        const thumbTip = new THREE.Mesh(thumbTipGeo, skinMat);
        thumbTip.position.y = 0.025;
        thumb.add(thumbTip);

        // Wrist/arm segment
        const wristGeo = new THREE.BoxGeometry(0.06, 0.07, 0.15);
        const wrist = new THREE.Mesh(wristGeo, skinMat);
        wrist.position.set(0, -0.02, 0.09);

        // Sleeve
        const sleeveGeo = new THREE.BoxGeometry(0.07, 0.08, 0.1);
        const sleeveMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.9
        });
        const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
        sleeve.position.set(0, -0.02, 0.19);

        group.add(palm, thumb, wrist, sleeve);

        if (isLeft) {
            group.scale.x = -1;
        }

        return group;
    }

    /**
     * Create complete weapon view with hands
     */
    static createWeaponWithHands(characterType) {
        const container = new THREE.Group();

        // Create weapon
        const weapon = this.createWeapon(characterType);
        container.add(weapon);

        // Create right hand (primary)
        const rightHand = this.createHand(false);
        rightHand.position.set(0.15, -0.22, -0.15);
        rightHand.rotation.set(-0.3, 0, 0.2);
        container.add(rightHand);

        // Create left hand (support) for two-handed weapons
        if (characterType === 'Sniper' || characterType === 'MachineGun') {
            const leftHand = this.createHand(true);
            leftHand.position.set(-0.05, -0.18, -0.35);
            leftHand.rotation.set(-0.5, 0, -0.3);
            container.add(leftHand);
        } else if (characterType === 'Archer') {
            // Left hand holds bow
            const leftHand = this.createHand(true);
            leftHand.position.set(-0.28, -0.15, -0.25);
            leftHand.rotation.set(0, 0.3, 0);
            container.add(leftHand);
        }

        // Store references
        container.userData.weapon = weapon;
        container.userData.rightHand = rightHand;

        return container;
    }
}
