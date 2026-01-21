import * as THREE from 'three';

/**
 * Procedural weapon models for each character class
 * Enhanced with more detail and visual effects
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
     * Knight's Sword - Glowing legendary sword
     */
    static createKnightSword() {
        const group = new THREE.Group();

        // Leather wrapped handle
        const handleGeo = new THREE.CylinderGeometry(0.028, 0.032, 0.22, 12);
        const handleMat = new THREE.MeshStandardMaterial({
            color: 0x3d2817,
            roughness: 0.9,
            metalness: 0.1
        });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.rotation.x = Math.PI / 2;

        // Leather wrap detail
        for (let i = 0; i < 6; i++) {
            const wrapGeo = new THREE.TorusGeometry(0.032, 0.004, 4, 8);
            const wrap = new THREE.Mesh(wrapGeo, handleMat);
            wrap.position.z = -0.08 + i * 0.03;
            group.add(wrap);
        }

        // Ornate pommel with gem
        const pommelGeo = new THREE.DodecahedronGeometry(0.04, 0);
        const pommelMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xffd700,
            emissiveIntensity: 0.1
        });
        const pommel = new THREE.Mesh(pommelGeo, pommelMat);
        pommel.position.z = 0.14;

        // Pommel gem
        const gemGeo = new THREE.OctahedronGeometry(0.02, 0);
        const gemMat = new THREE.MeshStandardMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const gem = new THREE.Mesh(gemGeo, gemMat);
        gem.position.z = 0.16;

        // Elaborate cross guard
        const guardMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.95,
            roughness: 0.05,
            emissive: 0xffd700,
            emissiveIntensity: 0.05
        });

        const guardGeo = new THREE.BoxGeometry(0.22, 0.035, 0.035);
        const guard = new THREE.Mesh(guardGeo, guardMat);
        guard.position.z = -0.12;

        // Guard end caps
        const capGeo = new THREE.SphereGeometry(0.025, 8, 8);
        const leftCap = new THREE.Mesh(capGeo, guardMat);
        leftCap.position.set(-0.11, 0, -0.12);
        const rightCap = new THREE.Mesh(capGeo, guardMat);
        rightCap.position.set(0.11, 0, -0.12);

        // Glowing blade with runes
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0xe8e8e8,
            metalness: 0.95,
            roughness: 0.05,
            emissive: 0x4488ff,
            emissiveIntensity: 0.15
        });

        // Main blade
        const bladeGeo = new THREE.BoxGeometry(0.05, 0.015, 0.6);
        const blade = new THREE.Mesh(bladeGeo, bladeMat);
        blade.position.z = -0.42;

        // Blade edge glow
        const edgeMat = new THREE.MeshBasicMaterial({
            color: 0x6699ff,
            transparent: true,
            opacity: 0.4
        });
        const edgeGeo = new THREE.BoxGeometry(0.055, 0.003, 0.58);
        const edge1 = new THREE.Mesh(edgeGeo, edgeMat);
        edge1.position.set(0, 0.01, -0.42);
        const edge2 = new THREE.Mesh(edgeGeo, edgeMat);
        edge2.position.set(0, -0.01, -0.42);

        // Blade fuller (groove)
        const fullerGeo = new THREE.BoxGeometry(0.015, 0.02, 0.5);
        const fullerMat = new THREE.MeshStandardMaterial({
            color: 0x333344,
            metalness: 0.8,
            roughness: 0.3
        });
        const fuller = new THREE.Mesh(fullerGeo, fullerMat);
        fuller.position.z = -0.4;

        // Blade tip
        const tipGeo = new THREE.ConeGeometry(0.025, 0.1, 4);
        const tip = new THREE.Mesh(tipGeo, bladeMat);
        tip.rotation.x = -Math.PI / 2;
        tip.position.z = -0.77;

        group.add(handle, pommel, gem, guard, leftCap, rightCap, blade, edge1, edge2, fuller, tip);

        // Position for right hand view - angled for slashing pose
        group.position.set(0.3, -0.15, -0.25);
        group.rotation.set(0.2, -0.3, 0.6);

        return group;
    }

    /**
     * Sniper Rifle - Modern tactical sniper
     */
    static createSniperRifle() {
        const group = new THREE.Group();

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            metalness: 0.85,
            roughness: 0.15
        });

        const darkMetalMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            metalness: 0.9,
            roughness: 0.1
        });

        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x4a3520,
            roughness: 0.85,
            metalness: 0.05
        });

        // Long precision barrel
        const barrelGeo = new THREE.CylinderGeometry(0.018, 0.022, 0.9, 12);
        const barrel = new THREE.Mesh(barrelGeo, darkMetalMat);
        barrel.rotation.x = Math.PI / 2;
        barrel.position.z = -0.55;

        // Muzzle brake
        const muzzleGeo = new THREE.CylinderGeometry(0.028, 0.025, 0.08, 8);
        const muzzle = new THREE.Mesh(muzzleGeo, metalMat);
        muzzle.rotation.x = Math.PI / 2;
        muzzle.position.z = -1.02;

        // Muzzle slots
        for (let i = 0; i < 4; i++) {
            const slotGeo = new THREE.BoxGeometry(0.035, 0.008, 0.02);
            const slot = new THREE.Mesh(slotGeo, darkMetalMat);
            slot.position.z = -0.98 - i * 0.015;
            group.add(slot);
        }

        // Barrel shroud with rails
        const shroudGeo = new THREE.BoxGeometry(0.055, 0.045, 0.35);
        const shroud = new THREE.Mesh(shroudGeo, metalMat);
        shroud.position.z = -0.28;

        // Top rail
        const railGeo = new THREE.BoxGeometry(0.04, 0.01, 0.4);
        const topRail = new THREE.Mesh(railGeo, darkMetalMat);
        topRail.position.set(0, 0.028, -0.2);

        // Receiver body
        const receiverGeo = new THREE.BoxGeometry(0.065, 0.11, 0.28);
        const receiver = new THREE.Mesh(receiverGeo, metalMat);
        receiver.position.set(0, 0.02, 0.04);

        // Bolt handle
        const boltGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.06, 6);
        const bolt = new THREE.Mesh(boltGeo, darkMetalMat);
        bolt.rotation.z = Math.PI / 2;
        bolt.position.set(0.045, 0.04, 0.08);

        // Large scope
        const scopeBodyGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.22, 12);
        const scopeBody = new THREE.Mesh(scopeBodyGeo, darkMetalMat);
        scopeBody.rotation.x = Math.PI / 2;
        scopeBody.position.set(0, 0.1, -0.02);

        // Scope objective lens (front)
        const objLensGeo = new THREE.CylinderGeometry(0.035, 0.03, 0.04, 12);
        const objLens = new THREE.Mesh(objLensGeo, metalMat);
        objLens.rotation.x = Math.PI / 2;
        objLens.position.set(0, 0.1, -0.15);

        // Scope lens glass
        const glassGeo = new THREE.CircleGeometry(0.028, 16);
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0x4466aa,
            metalness: 0.3,
            roughness: 0,
            transparent: true,
            opacity: 0.7
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0, 0.1, -0.17);

        // Scope mount rings
        const ringGeo = new THREE.TorusGeometry(0.032, 0.006, 6, 12);
        const ring1 = new THREE.Mesh(ringGeo, metalMat);
        ring1.rotation.x = Math.PI / 2;
        ring1.position.set(0, 0.1, 0.05);
        const ring2 = new THREE.Mesh(ringGeo, metalMat);
        ring2.rotation.x = Math.PI / 2;
        ring2.position.set(0, 0.1, -0.1);

        // Adjustable stock
        const stockGeo = new THREE.BoxGeometry(0.05, 0.085, 0.22);
        const stock = new THREE.Mesh(stockGeo, woodMat);
        stock.position.set(0, -0.01, 0.22);

        // Cheek rest
        const cheekGeo = new THREE.BoxGeometry(0.04, 0.03, 0.1);
        const cheek = new THREE.Mesh(cheekGeo, woodMat);
        cheek.position.set(0, 0.035, 0.2);

        // Rubber buttpad
        const buttGeo = new THREE.BoxGeometry(0.05, 0.1, 0.025);
        const buttMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });
        const butt = new THREE.Mesh(buttGeo, buttMat);
        butt.position.set(0, -0.01, 0.34);

        // Magazine
        const magGeo = new THREE.BoxGeometry(0.035, 0.14, 0.065);
        const mag = new THREE.Mesh(magGeo, metalMat);
        mag.position.set(0, -0.1, 0.06);

        // Trigger guard
        const triggerGuardGeo = new THREE.TorusGeometry(0.028, 0.006, 6, 12, Math.PI);
        const triggerGuard = new THREE.Mesh(triggerGuardGeo, metalMat);
        triggerGuard.rotation.x = Math.PI / 2;
        triggerGuard.rotation.z = Math.PI;
        triggerGuard.position.set(0, -0.04, 0.06);

        // Bipod (folded)
        const bipodGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6);
        const bipod1 = new THREE.Mesh(bipodGeo, darkMetalMat);
        bipod1.rotation.x = Math.PI / 2;
        bipod1.position.set(-0.025, -0.03, -0.2);
        const bipod2 = new THREE.Mesh(bipodGeo, darkMetalMat);
        bipod2.rotation.x = Math.PI / 2;
        bipod2.position.set(0.025, -0.03, -0.2);

        group.add(barrel, muzzle, shroud, topRail, receiver, bolt, scopeBody, objLens, glass,
                  ring1, ring2, stock, cheek, butt, mag, triggerGuard, bipod1, bipod2);

        // Position for FPS view
        group.position.set(0.18, -0.12, -0.35);
        group.rotation.set(0, 0, 0);

        return group;
    }

    /**
     * Machine Gun - Heavy automatic weapon
     */
    static createMachineGun() {
        const group = new THREE.Group();

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x2d2d2d,
            metalness: 0.75,
            roughness: 0.25
        });

        const darkMat = new THREE.MeshStandardMaterial({
            color: 0x151515,
            metalness: 0.8,
            roughness: 0.2
        });

        const hotMetalMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xff3300,
            emissiveIntensity: 0.1
        });

        // Multiple barrel (minigun style)
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const barrelGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.45, 8);
            const barrel = new THREE.Mesh(barrelGeo, hotMetalMat);
            barrel.rotation.x = Math.PI / 2;
            barrel.position.set(Math.cos(angle) * 0.025, Math.sin(angle) * 0.025, -0.38);
            group.add(barrel);
        }

        // Barrel housing
        const housingGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.35, 16);
        const housing = new THREE.Mesh(housingGeo, metalMat);
        housing.rotation.x = Math.PI / 2;
        housing.position.z = -0.22;

        // Heat vents on housing
        for (let i = 0; i < 8; i++) {
            const ventGeo = new THREE.BoxGeometry(0.06, 0.008, 0.04);
            const vent = new THREE.Mesh(ventGeo, darkMat);
            vent.position.z = -0.1 - i * 0.035;
            group.add(vent);
        }

        // Main body
        const bodyGeo = new THREE.BoxGeometry(0.1, 0.14, 0.22);
        const body = new THREE.Mesh(bodyGeo, metalMat);
        body.position.set(0, 0.01, 0.02);

        // Ammo box
        const ammoBoxGeo = new THREE.BoxGeometry(0.12, 0.1, 0.08);
        const ammoBoxMat = new THREE.MeshStandardMaterial({
            color: 0x3d3d2d,
            roughness: 0.9
        });
        const ammoBox = new THREE.Mesh(ammoBoxGeo, ammoBoxMat);
        ammoBox.position.set(0.08, -0.08, 0.02);

        // Ammo belt feed
        const beltGeo = new THREE.BoxGeometry(0.04, 0.02, 0.06);
        const beltMat = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
        const belt = new THREE.Mesh(beltGeo, beltMat);
        belt.position.set(0.04, -0.02, 0.02);

        // Carry handle
        const handleGeo = new THREE.TorusGeometry(0.04, 0.012, 6, 12, Math.PI);
        const handle = new THREE.Mesh(handleGeo, darkMat);
        handle.rotation.z = Math.PI;
        handle.position.set(0, 0.1, -0.05);

        // Forward grip
        const fGripGeo = new THREE.CylinderGeometry(0.02, 0.025, 0.1, 8);
        const fGripMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.95 });
        const fGrip = new THREE.Mesh(fGripGeo, fGripMat);
        fGrip.position.set(0, -0.1, -0.08);

        // Rear pistol grip
        const pGripGeo = new THREE.BoxGeometry(0.04, 0.12, 0.05);
        const pGrip = new THREE.Mesh(pGripGeo, fGripMat);
        pGrip.rotation.x = 0.3;
        pGrip.position.set(0, -0.1, 0.1);

        // Stock
        const stockGeo = new THREE.BoxGeometry(0.045, 0.07, 0.18);
        const stock = new THREE.Mesh(stockGeo, darkMat);
        stock.position.set(0, 0, 0.2);

        // Red dot sight
        const sightBaseGeo = new THREE.BoxGeometry(0.03, 0.025, 0.05);
        const sightBase = new THREE.Mesh(sightBaseGeo, darkMat);
        sightBase.position.set(0, 0.095, 0);

        const sightGlassGeo = new THREE.BoxGeometry(0.025, 0.02, 0.002);
        const sightGlassMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.5
        });
        const sightGlass = new THREE.Mesh(sightGlassGeo, sightGlassMat);
        sightGlass.position.set(0, 0.095, -0.026);

        group.add(housing, body, ammoBox, belt, handle, fGrip, pGrip, stock, sightBase, sightGlass);

        // Position for FPS view
        group.position.set(0.15, -0.08, -0.32);
        group.rotation.set(0, 0, 0);

        return group;
    }

    /**
     * Archer's Bow - Elegant elven-style bow
     */
    static createArcherBow() {
        const group = new THREE.Group();

        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x6b4423,
            roughness: 0.7,
            metalness: 0.1
        });

        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xd4af37,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xd4af37,
            emissiveIntensity: 0.1
        });

        const stringMat = new THREE.MeshBasicMaterial({ color: 0xf0f0f0 });

        // Elegant curved bow limbs
        const bowCurve = new THREE.TorusGeometry(0.42, 0.018, 8, 24, Math.PI * 0.85);
        const bow = new THREE.Mesh(bowCurve, woodMat);
        bow.rotation.y = Math.PI / 2;
        bow.rotation.z = Math.PI / 2;

        // Gold decorations on limbs
        const decoGeo = new THREE.TorusGeometry(0.43, 0.008, 4, 8, Math.PI * 0.2);
        const deco1 = new THREE.Mesh(decoGeo, goldMat);
        deco1.rotation.y = Math.PI / 2;
        deco1.rotation.z = Math.PI / 2 + 0.8;
        const deco2 = new THREE.Mesh(decoGeo, goldMat);
        deco2.rotation.y = Math.PI / 2;
        deco2.rotation.z = Math.PI / 2 - 0.8;

        // Ornate grip
        const gripGeo = new THREE.CylinderGeometry(0.028, 0.025, 0.14, 12);
        const grip = new THREE.Mesh(gripGeo, woodMat);

        // Gold grip bands
        const bandGeo = new THREE.TorusGeometry(0.03, 0.005, 4, 12);
        const band1 = new THREE.Mesh(bandGeo, goldMat);
        band1.rotation.x = Math.PI / 2;
        band1.position.y = 0.05;
        const band2 = new THREE.Mesh(bandGeo, goldMat);
        band2.rotation.x = Math.PI / 2;
        band2.position.y = -0.05;

        // Glowing string
        const stringGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.78, 6);
        const string = new THREE.Mesh(stringGeo, stringMat);
        string.position.z = 0.1;

        // Nocked arrow
        const arrowMat = new THREE.MeshStandardMaterial({
            color: 0x5c4033,
            roughness: 0.8
        });

        const shaftGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.7, 8);
        const shaft = new THREE.Mesh(shaftGeo, arrowMat);
        shaft.rotation.x = Math.PI / 2;
        shaft.position.z = -0.25;

        // Glowing arrow head
        const headGeo = new THREE.ConeGeometry(0.018, 0.06, 4);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0x44ff44,
            emissiveIntensity: 0.3
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.rotation.x = -Math.PI / 2;
        head.position.z = -0.63;

        // Fletching (feathers)
        const fletchMat = new THREE.MeshStandardMaterial({
            color: 0x228822,
            emissive: 0x115511,
            emissiveIntensity: 0.2
        });

        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const fletchGeo = new THREE.BoxGeometry(0.035, 0.003, 0.08);
            const fletch = new THREE.Mesh(fletchGeo, fletchMat);
            fletch.rotation.z = angle;
            fletch.position.set(Math.cos(angle) * 0.015, Math.sin(angle) * 0.015, 0.08);
            group.add(fletch);
        }

        group.add(bow, deco1, deco2, grip, band1, band2, string, shaft, head);

        // Position for FPS view (held vertically)
        group.position.set(-0.22, -0.08, -0.28);
        group.rotation.set(0, 0.25, 0);

        return group;
    }

    /**
     * Wizard's Staff - Powerful magical staff
     */
    static createWizardStaff() {
        const group = new THREE.Group();

        // Ancient wood material
        const woodMat = new THREE.MeshStandardMaterial({
            color: 0x3d2817,
            roughness: 0.85,
            metalness: 0.05
        });

        // Twisted staff body
        const staffGeo = new THREE.CylinderGeometry(0.022, 0.038, 1.1, 12, 8, false);
        const staff = new THREE.Mesh(staffGeo, woodMat);
        staff.rotation.x = Math.PI / 2;
        staff.position.z = -0.25;

        // Spiral pattern on staff
        const spiralMat = new THREE.MeshStandardMaterial({
            color: 0x8844ff,
            emissive: 0x8844ff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.8
        });

        for (let i = 0; i < 20; i++) {
            const t = i / 20;
            const angle = t * Math.PI * 6;
            const y = -0.5 + t * 0.9;
            const runeGeo = new THREE.SphereGeometry(0.008, 6, 6);
            const rune = new THREE.Mesh(runeGeo, spiralMat);
            rune.position.set(
                Math.cos(angle) * 0.03,
                Math.sin(angle) * 0.03,
                -0.7 + t * 0.8
            );
            group.add(rune);
        }

        // Ornate gold head piece
        const goldMat = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            metalness: 0.95,
            roughness: 0.05,
            emissive: 0xffd700,
            emissiveIntensity: 0.1
        });

        // Crown-like holder for crystal
        const crownGeo = new THREE.TorusGeometry(0.06, 0.012, 6, 4);
        const crown = new THREE.Mesh(crownGeo, goldMat);
        crown.rotation.x = Math.PI / 2;
        crown.position.z = -0.82;

        // Prongs holding crystal
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const prongGeo = new THREE.ConeGeometry(0.012, 0.08, 4);
            const prong = new THREE.Mesh(prongGeo, goldMat);
            prong.rotation.x = -Math.PI / 2 - 0.3;
            prong.rotation.z = angle;
            prong.position.set(
                Math.cos(angle) * 0.05,
                Math.sin(angle) * 0.05,
                -0.85
            );
            group.add(prong);
        }

        // Large magical crystal (main)
        const crystalGeo = new THREE.OctahedronGeometry(0.07, 0);
        const crystalMat = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.8,
            transparent: true,
            opacity: 0.9,
            roughness: 0,
            metalness: 0.2
        });
        const crystal = new THREE.Mesh(crystalGeo, crystalMat);
        crystal.position.z = -0.88;

        // Inner crystal glow
        const innerGlowGeo = new THREE.OctahedronGeometry(0.04, 0);
        const innerGlowMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6
        });
        const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
        innerGlow.position.z = -0.88;

        // Outer magical aura
        const auraGeo = new THREE.SphereGeometry(0.12, 16, 16);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.15
        });
        const aura = new THREE.Mesh(auraGeo, auraMat);
        aura.position.z = -0.88;

        // Floating particles around crystal
        const particleMat = new THREE.MeshBasicMaterial({
            color: 0x88ffff,
            transparent: true,
            opacity: 0.8
        });

        for (let i = 0; i < 8; i++) {
            const particleGeo = new THREE.SphereGeometry(0.008, 4, 4);
            const particle = new THREE.Mesh(particleGeo, particleMat);
            const angle = (i / 8) * Math.PI * 2;
            particle.position.set(
                Math.cos(angle) * 0.1,
                Math.sin(angle) * 0.1,
                -0.88 + Math.sin(angle * 2) * 0.03
            );
            group.add(particle);
        }

        // Gold bands on staff
        const bandGeo = new THREE.TorusGeometry(0.032, 0.006, 4, 12);
        const positions = [-0.1, -0.3, -0.55];
        positions.forEach(z => {
            const band = new THREE.Mesh(bandGeo, goldMat);
            band.rotation.x = Math.PI / 2;
            band.position.z = z;
            group.add(band);
        });

        group.add(staff, crown, crystal, innerGlow, aura);

        // Store references for animation
        group.userData.crystal = crystal;
        group.userData.innerGlow = innerGlow;
        group.userData.aura = aura;

        // Position for FPS view
        group.position.set(0.22, -0.2, -0.25);
        group.rotation.set(0.15, -0.15, 0.25);

        return group;
    }

    /**
     * Create detailed hand model
     */
    static createHand(isLeft = false) {
        const group = new THREE.Group();

        const skinMat = new THREE.MeshStandardMaterial({
            color: this.SKIN_COLOR,
            roughness: 0.75,
            metalness: 0.05
        });

        // Palm with better shape
        const palmGeo = new THREE.BoxGeometry(0.075, 0.095, 0.035);
        const palm = new THREE.Mesh(palmGeo, skinMat);

        // Fingers with joints
        const fingerPositions = [-0.025, -0.008, 0.008, 0.025];
        const fingerLengths = [0.05, 0.06, 0.055, 0.045];

        fingerPositions.forEach((xPos, i) => {
            // Finger base
            const fingerGeo = new THREE.CylinderGeometry(0.009, 0.01, fingerLengths[i], 6);
            const finger = new THREE.Mesh(fingerGeo, skinMat);
            finger.position.set(xPos, 0.065, 0);

            // Finger tip
            const tipGeo = new THREE.SphereGeometry(0.009, 6, 6);
            const tip = new THREE.Mesh(tipGeo, skinMat);
            tip.position.y = fingerLengths[i] / 2 + 0.008;
            finger.add(tip);

            // Knuckle
            const knuckleGeo = new THREE.SphereGeometry(0.011, 6, 6);
            const knuckle = new THREE.Mesh(knuckleGeo, skinMat);
            knuckle.position.set(xPos, 0.04, 0);

            group.add(finger, knuckle);
        });

        // Thumb
        const thumbGeo = new THREE.CylinderGeometry(0.01, 0.012, 0.045, 6);
        const thumb = new THREE.Mesh(thumbGeo, skinMat);
        thumb.position.set(isLeft ? -0.048 : 0.048, 0.025, 0.012);
        thumb.rotation.z = isLeft ? 0.6 : -0.6;
        thumb.rotation.x = 0.2;

        const thumbTipGeo = new THREE.SphereGeometry(0.01, 6, 6);
        const thumbTip = new THREE.Mesh(thumbTipGeo, skinMat);
        thumbTip.position.y = 0.028;
        thumb.add(thumbTip);

        // Wrist
        const wristGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.12, 8);
        const wrist = new THREE.Mesh(wristGeo, skinMat);
        wrist.position.set(0, -0.05, 0.06);
        wrist.rotation.x = Math.PI / 2;

        // Forearm
        const forearmGeo = new THREE.CylinderGeometry(0.04, 0.045, 0.15, 8);
        const forearm = new THREE.Mesh(forearmGeo, skinMat);
        forearm.position.set(0, -0.02, 0.18);
        forearm.rotation.x = Math.PI / 2;

        // Sleeve
        const sleeveGeo = new THREE.CylinderGeometry(0.052, 0.048, 0.1, 8);
        const sleeveMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.9
        });
        const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
        sleeve.position.set(0, -0.02, 0.28);
        sleeve.rotation.x = Math.PI / 2;

        group.add(palm, thumb, wrist, forearm, sleeve);

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
        rightHand.position.set(0.15, -0.22, -0.12);
        rightHand.rotation.set(-0.4, 0, 0.15);
        container.add(rightHand);

        // Create left hand (support) for two-handed weapons
        if (characterType === 'Sniper' || characterType === 'MachineGun') {
            const leftHand = this.createHand(true);
            leftHand.position.set(-0.02, -0.16, -0.32);
            leftHand.rotation.set(-0.6, 0.1, -0.25);
            container.add(leftHand);
        } else if (characterType === 'Archer') {
            const leftHand = this.createHand(true);
            leftHand.position.set(-0.25, -0.12, -0.22);
            leftHand.rotation.set(0.1, 0.35, 0.1);
            container.add(leftHand);
        } else if (characterType === 'Knight') {
            // Two-handed sword grip
            const leftHand = this.createHand(true);
            leftHand.position.set(0.2, -0.28, -0.08);
            leftHand.rotation.set(-0.3, 0.1, -0.1);
            container.add(leftHand);
        }

        // Store references
        container.userData.weapon = weapon;
        container.userData.rightHand = rightHand;

        return container;
    }
}
