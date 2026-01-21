import * as THREE from 'three';

export class WeaponSystem {
    constructor(scene) {
        this.scene = scene;
        this.projectiles = [];
        this.bulletTracers = [];
        this.swingEffects = [];
        this.fpWeaponView = null;
        this.onHit = null;
        this.onKill = null;

        // Muzzle flash light
        this.muzzleFlash = new THREE.PointLight(0xffaa00, 0, 10);
        this.scene.add(this.muzzleFlash);

        // Sword swing trail material
        this.trailMaterial = new THREE.MeshBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
    }

    setCallbacks(onHit, onKill) {
        this.onHit = onHit;
        this.onKill = onKill;
    }

    setFPWeaponView(fpWeaponView) {
        this.fpWeaponView = fpWeaponView;
    }

    fire(playerClass, camera, enemies) {
        const origin = camera.position.clone();
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);

        if (this.fpWeaponView) {
            this.fpWeaponView.triggerRecoil(playerClass.type);
        }

        switch (playerClass.type) {
            case 'Knight':
                this.meleeAttack(origin, direction, enemies, playerClass.damage, camera);
                break;
            case 'Sniper':
                this.sniperAttack(origin, direction, enemies, playerClass.damage, camera);
                break;
            case 'MachineGun':
                this.machineGunAttack(origin, direction, enemies, playerClass.damage, camera);
                break;
            case 'Archer':
                this.spawnArrow(origin, direction, playerClass.damage, camera);
                break;
            case 'Wizard':
                this.spawnMagicBolt(origin, direction, playerClass.damage);
                break;
        }
    }

    findZombieFromHit(hitObject, enemies) {
        for (const enemy of enemies) {
            let current = hitObject;
            while (current) {
                if (current === enemy.mesh) {
                    return enemy;
                }
                current = current.parent;
            }
        }
        return null;
    }

    /**
     * Knight melee attack with sword swing visual
     */
    meleeAttack(origin, direction, enemies, damage, camera) {
        // Create sword swing trail effect
        this.createSwordSwingEffect(origin, direction, camera);

        const raycaster = new THREE.Raycaster(origin, direction, 0, 4);
        const allMeshes = [];
        enemies.forEach(e => {
            e.mesh.traverse(child => {
                if (child.isMesh) allMeshes.push(child);
            });
        });

        // Wide arc hit detection
        const hitEnemies = new Set();
        const angles = [-0.3, -0.15, 0, 0.15, 0.3];

        for (const angle of angles) {
            const rotatedDir = direction.clone();
            rotatedDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            raycaster.set(origin, rotatedDir);

            const intersects = raycaster.intersectObjects(allMeshes);
            if (intersects.length > 0) {
                const hitEnemy = this.findZombieFromHit(intersects[0].object, enemies);
                if (hitEnemy && !hitEnemy.isDead && !hitEnemies.has(hitEnemy)) {
                    hitEnemies.add(hitEnemy);
                }
            }
        }

        // Apply damage to all hit enemies
        hitEnemies.forEach(hitEnemy => {
            const willKill = hitEnemy.logic.hp <= damage;
            hitEnemy.takeDamage(damage);

            if (this.onHit) this.onHit(hitEnemy);
            if (willKill && this.onKill) this.onKill(hitEnemy);

            // Blood splatter effect
            this.createBloodSplatter(hitEnemy.mesh.position.clone());
        });
    }

    /**
     * Create sword swing arc effect
     */
    createSwordSwingEffect(origin, direction, camera) {
        const swingGroup = new THREE.Group();

        // Arc trail
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(-1.5, 0.5, -1),
            new THREE.Vector3(0, 1, -2),
            new THREE.Vector3(1.5, -0.5, -1)
        );

        const points = curve.getPoints(20);
        const trailGeometry = new THREE.BufferGeometry();

        const positions = [];
        const colors = [];
        const sizes = [];

        for (let i = 0; i < points.length; i++) {
            positions.push(points[i].x, points[i].y, points[i].z);
            const intensity = i / points.length;
            colors.push(0.5 + intensity * 0.5, 0.8, 1.0);
            sizes.push((1 - intensity) * 0.15);
        }

        trailGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        // Trail line
        const trailMat = new THREE.LineBasicMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.8,
            linewidth: 3
        });
        const trailLine = new THREE.Line(trailGeometry, trailMat);

        // Glow arc mesh
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.08, 8, false);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x6699ff,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        const glowTube = new THREE.Mesh(tubeGeometry, glowMat);

        swingGroup.add(trailLine, glowTube);

        // Position at camera
        swingGroup.position.copy(origin);
        swingGroup.quaternion.copy(camera.quaternion);

        this.scene.add(swingGroup);

        // Animate and remove
        const startTime = Date.now();
        const duration = 300;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                trailMat.opacity = 0.8 * (1 - progress);
                glowMat.opacity = 0.4 * (1 - progress);
                swingGroup.scale.setScalar(1 + progress * 0.3);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(swingGroup);
                trailGeometry.dispose();
                tubeGeometry.dispose();
                trailMat.dispose();
                glowMat.dispose();
            }
        };
        animate();
    }

    /**
     * Sniper attack with bullet tracer
     */
    sniperAttack(origin, direction, enemies, damage, camera) {
        // Muzzle flash
        this.triggerMuzzleFlash(origin, direction, 2.0);

        // Create bullet tracer
        this.createBulletTracer(origin, direction, 200, 0xffff88, 0.03);

        const raycaster = new THREE.Raycaster(origin, direction, 0, 200);
        const allMeshes = [];
        enemies.forEach(e => {
            e.mesh.traverse(child => {
                if (child.isMesh) allMeshes.push(child);
            });
        });

        const intersects = raycaster.intersectObjects(allMeshes);

        if (intersects.length > 0) {
            const hitEnemy = this.findZombieFromHit(intersects[0].object, enemies);
            if (hitEnemy && !hitEnemy.isDead) {
                const willKill = hitEnemy.logic.hp <= damage;
                hitEnemy.takeDamage(damage);

                // Create impact effect
                this.createBulletImpact(intersects[0].point);

                if (this.onHit) this.onHit(hitEnemy);
                if (willKill && this.onKill) this.onKill(hitEnemy);
            }
        }
    }

    /**
     * Machine gun attack with rapid tracers
     */
    machineGunAttack(origin, direction, enemies, damage, camera) {
        // Add slight spread
        const spread = 0.03;
        const spreadDir = direction.clone();
        spreadDir.x += (Math.random() - 0.5) * spread;
        spreadDir.y += (Math.random() - 0.5) * spread;
        spreadDir.normalize();

        // Muzzle flash
        this.triggerMuzzleFlash(origin, spreadDir, 0.8);

        // Create bullet tracer (shorter for machine gun)
        this.createBulletTracer(origin, spreadDir, 100, 0xffcc44, 0.015);

        const raycaster = new THREE.Raycaster(origin, spreadDir, 0, 100);
        const allMeshes = [];
        enemies.forEach(e => {
            e.mesh.traverse(child => {
                if (child.isMesh) allMeshes.push(child);
            });
        });

        const intersects = raycaster.intersectObjects(allMeshes);

        if (intersects.length > 0) {
            const hitEnemy = this.findZombieFromHit(intersects[0].object, enemies);
            if (hitEnemy && !hitEnemy.isDead) {
                const willKill = hitEnemy.logic.hp <= damage;
                hitEnemy.takeDamage(damage);

                this.createBulletImpact(intersects[0].point, 0.5);

                if (this.onHit) this.onHit(hitEnemy);
                if (willKill && this.onKill) this.onKill(hitEnemy);
            }
        }
    }

    /**
     * Create bullet tracer effect
     */
    createBulletTracer(origin, direction, range, color, thickness) {
        const tracerLength = 3;
        const endPoint = origin.clone().add(direction.clone().multiplyScalar(range));

        // Tracer geometry
        const geometry = new THREE.CylinderGeometry(thickness, thickness, tracerLength, 6);
        geometry.rotateX(Math.PI / 2);

        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        const tracer = new THREE.Mesh(geometry, material);
        tracer.position.copy(origin).add(direction.clone().multiplyScalar(2));
        tracer.lookAt(endPoint);

        this.scene.add(tracer);

        // Animate tracer flying
        const speed = 300; // units per second
        const startTime = Date.now();

        const animate = () => {
            const elapsed = (Date.now() - startTime) / 1000;
            const distance = elapsed * speed;

            if (distance < range) {
                tracer.position.copy(origin).add(direction.clone().multiplyScalar(distance + 2));
                material.opacity = Math.max(0, 0.9 - distance / range);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(tracer);
                geometry.dispose();
                material.dispose();
            }
        };
        animate();
    }

    /**
     * Trigger muzzle flash light effect
     */
    triggerMuzzleFlash(origin, direction, intensity) {
        const flashPos = origin.clone().add(direction.clone().multiplyScalar(1.5));
        this.muzzleFlash.position.copy(flashPos);
        this.muzzleFlash.intensity = intensity;

        // Quick fade
        const fadeOut = () => {
            this.muzzleFlash.intensity *= 0.7;
            if (this.muzzleFlash.intensity > 0.01) {
                requestAnimationFrame(fadeOut);
            } else {
                this.muzzleFlash.intensity = 0;
            }
        };
        setTimeout(fadeOut, 30);
    }

    /**
     * Create bullet impact spark effect
     */
    createBulletImpact(position, scale = 1) {
        const particleCount = 8;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const geo = new THREE.SphereGeometry(0.03 * scale, 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: 0xffaa44,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.copy(position);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                Math.random() * 3,
                (Math.random() - 0.5) * 5
            );

            this.scene.add(particle);
            particles.push({ mesh: particle, velocity, geo, mat });
        }

        // Animate particles
        const startTime = Date.now();
        const duration = 300;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                particles.forEach(p => {
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(0.016));
                    p.velocity.y -= 0.15;
                    p.mat.opacity = 1 - progress;
                });
                requestAnimationFrame(animate);
            } else {
                particles.forEach(p => {
                    this.scene.remove(p.mesh);
                    p.geo.dispose();
                    p.mat.dispose();
                });
            }
        };
        animate();
    }

    /**
     * Create blood splatter effect
     */
    createBloodSplatter(position) {
        const particleCount = 12;
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const size = 0.02 + Math.random() * 0.04;
            const geo = new THREE.SphereGeometry(size, 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x880000,
                transparent: true,
                opacity: 0.9
            });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.copy(position);
            particle.position.y += 1; // Center of zombie

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 4,
                Math.random() * 2 + 1,
                (Math.random() - 0.5) * 4
            );

            this.scene.add(particle);
            particles.push({ mesh: particle, velocity, geo, mat });
        }

        const startTime = Date.now();
        const duration = 500;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                particles.forEach(p => {
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(0.016));
                    p.velocity.y -= 0.2;
                    p.mat.opacity = 0.9 * (1 - progress);
                    p.mesh.scale.setScalar(1 - progress * 0.5);
                });
                requestAnimationFrame(animate);
            } else {
                particles.forEach(p => {
                    this.scene.remove(p.mesh);
                    p.geo.dispose();
                    p.mat.dispose();
                });
            }
        };
        animate();
    }

    /**
     * Spawn arrow with realistic arc trajectory
     */
    spawnArrow(origin, direction, damage, camera) {
        const arrowGroup = new THREE.Group();

        // Arrow shaft
        const shaftGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.8, 8);
        const shaftMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 });
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        shaft.rotation.x = Math.PI / 2;

        // Arrow head (glowing)
        const headGeo = new THREE.ConeGeometry(0.035, 0.12, 6);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.9,
            emissive: 0x44ff44,
            emissiveIntensity: 0.4
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.rotation.x = -Math.PI / 2;
        head.position.z = -0.46;

        // Fletching (feathers)
        const fletchMat = new THREE.MeshStandardMaterial({
            color: 0x228822,
            emissive: 0x115511,
            emissiveIntensity: 0.2
        });

        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2;
            const fletchGeo = new THREE.BoxGeometry(0.06, 0.004, 0.1);
            const fletch = new THREE.Mesh(fletchGeo, fletchMat);
            fletch.rotation.z = angle;
            fletch.position.set(Math.cos(angle) * 0.025, Math.sin(angle) * 0.025, 0.35);
            arrowGroup.add(fletch);
        }

        // Trail effect for arrow
        const trailGeo = new THREE.CylinderGeometry(0.008, 0.002, 0.5, 6);
        const trailMat = new THREE.MeshBasicMaterial({
            color: 0x88ff88,
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        const trail = new THREE.Mesh(trailGeo, trailMat);
        trail.rotation.x = Math.PI / 2;
        trail.position.z = 0.6;

        arrowGroup.add(shaft, head, trail);

        // Initial position and velocity
        const startPos = origin.clone().add(direction.clone().multiplyScalar(1.5));
        arrowGroup.position.copy(startPos);

        // Calculate initial velocity with slight upward angle for arc
        const speed = 35;
        const launchAngle = 0.08; // Slight upward angle
        const velocity = direction.clone().multiplyScalar(speed);
        velocity.y += Math.abs(speed) * launchAngle;

        // Align arrow to velocity direction
        const targetPos = startPos.clone().add(velocity);
        arrowGroup.lookAt(targetPos);

        this.scene.add(arrowGroup);

        this.projectiles.push({
            mesh: arrowGroup,
            velocity: velocity,
            damage: damage,
            gravity: 12, // Realistic gravity for arc
            life: 4.0,
            type: 'arrow',
            trail: trail,
            trailMat: trailMat
        });
    }

    /**
     * Spawn magic bolt (wizard)
     */
    spawnMagicBolt(origin, direction, damage) {
        const boltGroup = new THREE.Group();

        // Central orb
        const orbGeo = new THREE.SphereGeometry(0.15, 12, 12);
        const orbMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.9
        });
        const orb = new THREE.Mesh(orbGeo, orbMat);

        // Inner glow
        const innerGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const innerMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        const inner = new THREE.Mesh(innerGeo, innerMat);

        // Outer aura
        const auraGeo = new THREE.SphereGeometry(0.25, 12, 12);
        const auraMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        const aura = new THREE.Mesh(auraGeo, auraMat);

        // Point light
        const light = new THREE.PointLight(0x00ffff, 1, 5);

        boltGroup.add(orb, inner, aura, light);

        const startPos = origin.clone().add(direction.clone().multiplyScalar(1.5));
        boltGroup.position.copy(startPos);

        this.scene.add(boltGroup);

        this.projectiles.push({
            mesh: boltGroup,
            velocity: direction.clone().multiplyScalar(20),
            damage: damage,
            gravity: 0,
            life: 3.0,
            type: 'magic',
            aura: aura,
            auraMat: auraMat,
            light: light,
            pulseTime: 0
        });
    }

    update(delta, enemies) {
        // Update projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];

            // Movement with physics
            p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));

            // Apply gravity
            if (p.gravity > 0) {
                p.velocity.y -= p.gravity * delta;
            }

            // Update rotation to match velocity direction
            if (p.type === 'arrow' && p.velocity.length() > 0) {
                const targetPos = p.mesh.position.clone().add(p.velocity.clone().normalize());
                p.mesh.lookAt(targetPos);

                // Update trail opacity based on speed
                if (p.trailMat) {
                    p.trailMat.opacity = Math.min(0.6, p.velocity.length() / 30);
                }
            }

            // Magic bolt pulse animation
            if (p.type === 'magic') {
                p.pulseTime += delta * 8;
                const scale = 1 + Math.sin(p.pulseTime) * 0.15;
                p.aura.scale.setScalar(scale);
                p.auraMat.opacity = 0.2 + Math.sin(p.pulseTime) * 0.1;
                if (p.light) {
                    p.light.intensity = 1 + Math.sin(p.pulseTime * 2) * 0.3;
                }
            }

            p.life -= delta;

            // Collision detection
            let hit = false;
            for (const enemy of enemies) {
                if (enemy.isDead) continue;

                const zombieCenter = enemy.mesh.position.clone();
                zombieCenter.y += 1.0;

                const hitRadius = p.type === 'magic' ? 1.5 : 1.0;
                if (p.mesh.position.distanceTo(zombieCenter) < hitRadius) {
                    const willKill = enemy.logic.hp <= p.damage;
                    enemy.takeDamage(p.damage);

                    // Impact effects based on type
                    if (p.type === 'arrow') {
                        this.createArrowImpact(p.mesh.position.clone());
                    } else if (p.type === 'magic') {
                        this.createMagicImpact(p.mesh.position.clone());
                    }

                    if (this.onHit) this.onHit(enemy);
                    if (willKill && this.onKill) this.onKill(enemy);

                    hit = true;
                    break;
                }
            }

            // Remove conditions
            if (hit || p.life <= 0 || p.mesh.position.y < -1) {
                this.scene.remove(p.mesh);
                if (p.light) this.scene.remove(p.light);

                // Cleanup geometries and materials
                p.mesh.traverse(child => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(m => m.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });

                this.projectiles.splice(i, 1);
            }
        }
    }

    /**
     * Arrow impact effect
     */
    createArrowImpact(position) {
        // Create wood splinter particles
        const particles = [];
        for (let i = 0; i < 6; i++) {
            const geo = new THREE.BoxGeometry(0.02, 0.08, 0.02);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x5c4033,
                transparent: true,
                opacity: 1
            });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.copy(position);
            particle.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                Math.random() * 2,
                (Math.random() - 0.5) * 3
            );

            this.scene.add(particle);
            particles.push({ mesh: particle, velocity, geo, mat });
        }

        // Green flash
        const flash = new THREE.PointLight(0x44ff44, 2, 5);
        flash.position.copy(position);
        this.scene.add(flash);

        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 400;

            if (progress < 1) {
                particles.forEach(p => {
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(0.016));
                    p.velocity.y -= 0.15;
                    p.mat.opacity = 1 - progress;
                    p.mesh.rotation.x += 0.1;
                });
                flash.intensity = 2 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                particles.forEach(p => {
                    this.scene.remove(p.mesh);
                    p.geo.dispose();
                    p.mat.dispose();
                });
                this.scene.remove(flash);
            }
        };
        animate();
    }

    /**
     * Magic impact effect
     */
    createMagicImpact(position) {
        // Expanding ring
        const ringGeo = new THREE.RingGeometry(0.1, 0.15, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(position);
        ring.rotation.x = Math.PI / 2;
        this.scene.add(ring);

        // Particles
        const particles = [];
        for (let i = 0; i < 15; i++) {
            const geo = new THREE.SphereGeometry(0.05, 6, 6);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x00ffff,
                transparent: true,
                opacity: 1,
                blending: THREE.AdditiveBlending
            });
            const particle = new THREE.Mesh(geo, mat);
            particle.position.copy(position);

            const angle = Math.random() * Math.PI * 2;
            const velocity = new THREE.Vector3(
                Math.cos(angle) * (2 + Math.random() * 3),
                Math.random() * 3,
                Math.sin(angle) * (2 + Math.random() * 3)
            );

            this.scene.add(particle);
            particles.push({ mesh: particle, velocity, geo, mat });
        }

        // Flash light
        const flash = new THREE.PointLight(0x00ffff, 3, 8);
        flash.position.copy(position);
        this.scene.add(flash);

        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / 500;

            if (progress < 1) {
                ring.scale.setScalar(1 + progress * 5);
                ringMat.opacity = 1 - progress;

                particles.forEach(p => {
                    p.mesh.position.add(p.velocity.clone().multiplyScalar(0.016));
                    p.velocity.multiplyScalar(0.95);
                    p.mat.opacity = 1 - progress;
                    p.mesh.scale.setScalar(1 - progress * 0.8);
                });

                flash.intensity = 3 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.scene.remove(ring);
                ringGeo.dispose();
                ringMat.dispose();

                particles.forEach(p => {
                    this.scene.remove(p.mesh);
                    p.geo.dispose();
                    p.mat.dispose();
                });

                this.scene.remove(flash);
            }
        };
        animate();
    }
}
