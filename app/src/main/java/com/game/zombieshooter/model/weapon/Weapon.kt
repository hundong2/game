package com.game.zombieshooter.model.weapon

import com.game.zombieshooter.model.GameObject

abstract class Weapon {
    var damage: Int = 10
    var fireRate: Float = 0.5f // 초당 공격 횟수
    var range: Float = 300f

    protected var timeSinceLastAttack: Float = 0f

    abstract fun attack(startX: Float, startY: Float): List<GameObject>

    open fun update(deltaTime: Float) {
        timeSinceLastAttack += deltaTime
    }

    fun canAttack(): Boolean {
        return timeSinceLastAttack >= (1f / fireRate)
    }

    fun resetCooldown() {
        timeSinceLastAttack = 0f
    }

    open fun upgrade() {
        damage += 5
    }
}
