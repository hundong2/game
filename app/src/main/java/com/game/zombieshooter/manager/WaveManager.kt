package com.game.zombieshooter.manager

import com.game.zombieshooter.model.enemy.Zombie
import com.game.zombieshooter.model.enemy.ZombieFactory
import com.game.zombieshooter.util.Constants
import java.util.Random

class WaveManager {
    var currentLevel = 1
    private var timeSinceLastSpawn = 0f
    private val random = Random()

    fun update(deltaTime: Float, currentZombieCount: Int, spawnCallback: (Zombie) -> Unit) {
        timeSinceLastSpawn += deltaTime

        // 스폰 로직: 좀비 수가 제한 미만이고, 쿨타임이 찼을 때
        if (currentZombieCount < Constants.GamePlay.MAX_ZOMBIES_ON_SCREEN) {
            val spawnRate = 2.0f - (currentLevel * 0.1f).coerceAtMost(1.5f) // 레벨이 오를수록 빨라짐

            if (timeSinceLastSpawn > spawnRate) {
                spawnCallback(spawnZombie())
                timeSinceLastSpawn = 0f
            }
        }
    }

    private fun spawnZombie(): Zombie {
        // 화면 밖 랜덤 위치 계산 (단순화)
        val angle = random.nextDouble() * 2 * Math.PI
        val dist = Constants.EnemyStats.SPAWN_DISTANCE
        val x = (Constants.GAME_WIDTH / 2) + Math.cos(angle) * dist
        val y = (Constants.GAME_HEIGHT / 2) + Math.sin(angle) * dist

        // 타입 결정 (레벨에 따라 확률 변동)
        val roll = random.nextInt(100)
        val type = when {
            roll < 5 && currentLevel > 5 -> Constants.EnemyStats.TYPE_BOSS
            roll < 15 && currentLevel > 3 -> Constants.EnemyStats.TYPE_TANK
            roll < 40 && currentLevel > 1 -> Constants.EnemyStats.TYPE_RUNNER
            else -> Constants.EnemyStats.TYPE_NORMAL
        }

        return ZombieFactory.createZombie(type, x.toFloat(), y.toFloat(), currentLevel)
    }

    fun levelUp() {
        currentLevel++
    }
}
