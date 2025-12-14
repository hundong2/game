package com.game.zombieshooter.model.weapon

import com.game.zombieshooter.model.GameObject

// 발사체 클래스
class Projectile(
    x: Float, y: Float,
    var dx: Float, var dy: Float,
    var damage: Int,
    var speed: Float = 10f,
    var range: Float = 500f
) : GameObject(x, y) {

    var distanceTraveled = 0f

    override fun update(deltaTime: Float) {
        val moveDist = speed * deltaTime * 60f // Assuming 60 FPS basis
        x += dx * moveDist
        y += dy * moveDist
        distanceTraveled += moveDist

        if (distanceTraveled > range) {
            isDead = true
        }
    }
}

class Bow : Weapon() {
    init {
        damage = 15
        range = 600f
        fireRate = 1.5f // 빠름
    }

    override fun attack(startX: Float, startY: Float): List<GameObject> {
        if (!canAttack()) return emptyList()
        resetCooldown()

        // TODO: 타겟팅 로직이 필요하지만, 여기서는 정면 발사 또는 가장 가까운 적 방향으로 가정
        // 현재는 InputManager의 Joystick 각도를 받아와야 함.
        // 임시로 우측(1, 0)으로 발사
        return listOf(Projectile(startX, startY, 1f, 0f, damage, range = range))
    }

    // 조준 방향으로 발사하는 메서드 오버로딩 필요
    fun attack(startX: Float, startY: Float, aimX: Float, aimY: Float): List<GameObject> {
        if (!canAttack()) return emptyList()
        resetCooldown()
        return listOf(Projectile(startX, startY, aimX, aimY, damage, range = range))
    }
}

class Sword : Weapon() {
    init {
        damage = 25
        range = 100f // 근접
        fireRate = 2.0f
    }

    override fun attack(startX: Float, startY: Float): List<GameObject> {
         if (!canAttack()) return emptyList()
        resetCooldown()

        // 근접 공격은 Projectile이 검기(Short range projectile) 또는 Hitbox 생성
        return listOf(Projectile(startX, startY, 1f, 0f, damage, range = range, speed = 15f))
    }

    fun attack(startX: Float, startY: Float, aimX: Float, aimY: Float): List<GameObject> {
        if (!canAttack()) return emptyList()
        resetCooldown()
        return listOf(Projectile(startX, startY, aimX, aimY, damage, range = range, speed = 15f))
    }
}

class MagicWand : Weapon() {
    init {
        damage = 40
        range = 400f
        fireRate = 1.0f
    }

    override fun attack(startX: Float, startY: Float): List<GameObject> {
        if (!canAttack()) return emptyList()
        resetCooldown()
        return listOf(Projectile(startX, startY, 1f, 0f, damage, range = range))
    }

    fun attack(startX: Float, startY: Float, aimX: Float, aimY: Float): List<GameObject> {
        if (!canAttack()) return emptyList()
        resetCooldown()
        return listOf(Projectile(startX, startY, aimX, aimY, damage, range = range))
    }
}
