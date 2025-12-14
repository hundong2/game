package com.game.zombieshooter.model.hero

import com.game.zombieshooter.model.GameObject
import com.game.zombieshooter.model.weapon.Weapon
import com.game.zombieshooter.util.Constants

abstract class Hero(
    startX: Float,
    startY: Float,
    val name: String,
    var maxHp: Int,
    var speed: Float
) : GameObject(startX, startY) {

    var currentHp: Int = maxHp
    var weapon: Weapon? = null
    var level: Int = 1
    var exp: Int = 0

    // 이동 처리
    fun move(dx: Float, dy: Float, boundaryWidth: Int, boundaryHeight: Int) {
        x += dx * speed
        y += dy * speed

        // 경계 체크
        x = x.coerceIn(0f, boundaryWidth - Constants.HeroStats.HITBOX_WIDTH)
        y = y.coerceIn(0f, boundaryHeight - Constants.HeroStats.HITBOX_HEIGHT)
    }

    // 공격 (무기 위임)
    fun attack(): List<GameObject> {
        return weapon?.attack(x, y) ?: emptyList()
    }

    // 스킬 (하위 클래스 구현)
    abstract fun useSkill(): Boolean

    fun takeDamage(amount: Int) {
        currentHp -= amount
        if (currentHp <= 0) {
            currentHp = 0
            isDead = true
        }
    }

    fun gainExp(amount: Int) {
        exp += amount
        // 간단한 레벨업 로직
        val req = Constants.GamePlay.EXP_BASE_REQUIREMENT * Math.pow(Constants.GamePlay.EXP_GROWTH_FACTOR.toDouble(), (level - 1).toDouble()).toInt()
        if (exp >= req) {
            level++
            exp -= req
            maxHp += 10
            currentHp = maxHp // 레벨업 시 회복
            // TODO: 스탯 강화
        }
    }

    override fun update(deltaTime: Float) {
        weapon?.update(deltaTime)
    }
}
