package com.game.zombieshooter.model.enemy

import com.game.zombieshooter.model.GameObject
import com.game.zombieshooter.util.Constants

abstract class Zombie(
    startX: Float,
    startY: Float,
    val type: String,
    var hp: Int,
    var speed: Float,
    var score: Int
) : GameObject(startX, startY) {

    fun takeDamage(amount: Int) {
        hp -= amount
        if (hp <= 0) {
            isDead = true
        }
    }

    // 플레이어 방향으로 이동
    fun moveTowards(targetX: Float, targetY: Float, deltaTime: Float) {
        val dx = targetX - x
        val dy = targetY - y
        val distance = Math.sqrt((dx * dx + dy * dy).toDouble()).toFloat()

        if (distance > 0) {
            x += (dx / distance) * speed * deltaTime * 60f // Normalize & Scale
            y += (dy / distance) * speed * deltaTime * 60f
        }
    }

    override fun update(deltaTime: Float) {
        // AI logic handled by GameEngine calling moveTowards
    }
}

class NormalZombie(startX: Float, startY: Float, level: Int) : Zombie(
    startX, startY,
    Constants.EnemyStats.TYPE_NORMAL,
    hp = Constants.EnemyStats.BASE_HP_NORMAL + (level * 10),
    speed = 2.0f,
    score = 10
)

class RunnerZombie(startX: Float, startY: Float, level: Int) : Zombie(
    startX, startY,
    Constants.EnemyStats.TYPE_RUNNER,
    hp = Constants.EnemyStats.BASE_HP_RUNNER + (level * 5),
    speed = 4.0f,
    score = 20
)

class TankZombie(startX: Float, startY: Float, level: Int) : Zombie(
    startX, startY,
    Constants.EnemyStats.TYPE_TANK,
    hp = Constants.EnemyStats.BASE_HP_TANK + (level * 20),
    speed = 1.0f,
    score = 50
)

class BossZombie(startX: Float, startY: Float, level: Int) : Zombie(
    startX, startY,
    Constants.EnemyStats.TYPE_BOSS,
    hp = Constants.EnemyStats.BASE_HP_BOSS + (level * 100),
    speed = 1.5f,
    score = 500
)

object ZombieFactory {
    fun createZombie(type: String, startX: Float, startY: Float, level: Int): Zombie {
        return when(type) {
            Constants.EnemyStats.TYPE_RUNNER -> RunnerZombie(startX, startY, level)
            Constants.EnemyStats.TYPE_TANK -> TankZombie(startX, startY, level)
            Constants.EnemyStats.TYPE_BOSS -> BossZombie(startX, startY, level)
            else -> NormalZombie(startX, startY, level)
        }
    }
}
