package com.game.zombieshooter.engine

import com.game.zombieshooter.manager.InputManager
import com.game.zombieshooter.manager.WaveManager
import com.game.zombieshooter.model.GameObject
import com.game.zombieshooter.model.enemy.Zombie
import com.game.zombieshooter.model.hero.Hero
import com.game.zombieshooter.model.weapon.Projectile
import com.game.zombieshooter.util.Constants
import java.util.concurrent.CopyOnWriteArrayList

/**
 * 게임 루프와 전체적인 상태를 관리하는 메인 엔진 클래스
 * Phase 4 Update: Collision, Scoring, Progression
 */
class GameEngine {

    private var isRunning = false
    private var lastTime = System.nanoTime()
    private val nsPerTick = 1000000000.0 / Constants.FPS
    private var delta = 0.0

    // Game Objects
    var playerHero: Hero? = null
    val zombies = CopyOnWriteArrayList<Zombie>()
    val projectiles = CopyOnWriteArrayList<Projectile>()

    // Managers
    val inputManager = InputManager()
    val waveManager = WaveManager()

    // Game State
    var score = 0
    var gameTime = 0f

    interface GameLoopListener {
        fun onUpdate(deltaTime: Float)
        fun onRender()
        fun onGameOver()
        fun onScoreUpdate(score: Int)
    }

    private var listener: GameLoopListener? = null

    fun setListener(listener: GameLoopListener) {
        this.listener = listener
    }

    fun setHero(hero: Hero) {
        this.playerHero = hero
        // 중앙 배치
        hero.x = Constants.GAME_WIDTH / 2f
        hero.y = Constants.GAME_HEIGHT / 2f
    }

    fun start() {
        if (isRunning) return
        isRunning = true
        lastTime = System.nanoTime()
        Thread {
            while (isRunning) {
                val now = System.nanoTime()
                delta += (now - lastTime) / nsPerTick
                lastTime = now

                var shouldRender = false
                while (delta >= 1) {
                    update()
                    delta--
                    shouldRender = true
                }

                if (shouldRender) {
                    render()
                }

                try {
                    Thread.sleep(2)
                } catch (e: InterruptedException) {
                    e.printStackTrace()
                }
            }
        }.start()
    }

    fun stop() {
        isRunning = false
    }

    private fun update() {
        val dt = (1.0f / Constants.FPS)
        gameTime += dt

        // 1. Input Processing & Player Movement
        playerHero?.let { hero ->
            if (inputManager.joystickActive) {
                val (moveX, moveY) = inputManager.getMoveVector()
                hero.move(moveX, moveY, Constants.GAME_WIDTH, Constants.GAME_HEIGHT)
            }

            // Attack
            if (inputManager.isAttackPressed) {
                // 공격 방향 계산 (조이스틱 방향 또는 마지막 이동 방향)
                // 만약 조이스틱이 활성화되어 있다면 그쪽으로, 아니면 우측 기본
                val (aimX, aimY) = if (inputManager.joystickActive) {
                     inputManager.getMoveVector()
                } else {
                    Pair(1f, 0f)
                }

                // Weapon logic needs aim direction
                // Casting to specific weapon logic if needed or updating Hero to handle aim
                // For now, assuming Hero.attack handles internal logic or we extend it
                val newProjectiles = if (hero.weapon != null) {
                    // 무기 종류에 따라 투사체 생성 (여기서는 단순화하여 Hero의 attack 호출)
                    // 실제로는 Weapon에 aimX, aimY를 전달해야 함.
                    // 기존 Hero.attack()은 인자 없음. 수정 필요하지만,
                    // 간단히 구현하기 위해 Weapon을 직접 호출한다고 가정하거나 Hero를 수정.
                    // 여기서는 Hero.attack() -> Weapon.attack() -> returns List<GameObject>
                    hero.attack()
                } else {
                    emptyList()
                }

                newProjectiles.forEach {
                    if (it is Projectile) {
                        // 조준 방향 보정
                        if (aimX != 0f || aimY != 0f) {
                            it.dx = aimX
                            it.dy = aimY
                        }
                        projectiles.add(it)
                    }
                }
            }

            hero.update(dt)
        }

        // 2. Wave Manager (Spawn Zombies)
        waveManager.update(dt, zombies.size) { newZombie ->
            zombies.add(newZombie)
        }

        // Level Up Logic (Time based or Score based)
        // Check if enough score/time passed to level up the wave difficulty
        if (score > waveManager.currentLevel * Constants.GamePlay.LEVEL_UP_SCORE_THRESHOLD) {
             waveManager.levelUp()
        }

        // 3. Update Entities
        projectiles.forEach { it.update(dt) }
        zombies.forEach { zombie ->
            playerHero?.let { hero ->
                zombie.moveTowards(hero.x, hero.y, dt)
            }
            zombie.update(dt)
        }

        // 4. Collision Detection
        checkCollisions()

        // 5. Cleanup Dead Objects
        zombies.removeIf { it.isDead }
        projectiles.removeIf { it.isDead }

        // 6. Check Game Over
        if (playerHero?.isDead == true) {
            stop()
            listener?.onGameOver()
        }

        listener?.onUpdate(dt)
    }

    private fun checkCollisions() {
        // Projectile vs Zombie
        for (proj in projectiles) {
            for (zombie in zombies) {
                if (!proj.isDead && !zombie.isDead) {
                    if (proj.collidesWith(zombie, 20f, 20f, Constants.EnemyStats.DESPAWN_DISTANCE, Constants.EnemyStats.DESPAWN_DISTANCE)) {
                         // Simple distance check might be better
                         val dist = Math.sqrt(Math.pow((proj.x - zombie.x).toDouble(), 2.0) + Math.pow((proj.y - zombie.y).toDouble(), 2.0))
                         if (dist < Constants.GamePlay.BULLET_COLLISION_DISTANCE + Constants.ZombieStats.ZOMBIE_WIDTH/2) {
                             zombie.takeDamage(proj.damage)
                             proj.isDead = true // 관통?

                             if (zombie.isDead) {
                                 score += zombie.score
                                 playerHero?.gainExp(zombie.score)
                                 listener?.onScoreUpdate(score)
                             }
                         }
                    }
                }
            }
        }

        // Zombie vs Hero
        playerHero?.let { hero ->
            for (zombie in zombies) {
                if (!zombie.isDead) {
                    val dist = Math.sqrt(Math.pow((hero.x - zombie.x).toDouble(), 2.0) + Math.pow((hero.y - zombie.y).toDouble(), 2.0))
                    if (dist < Constants.GamePlay.COLLISION_DISTANCE) {
                        hero.takeDamage(1) // 지속 데미지
                    }
                }
            }
        }
    }

    private fun render() {
        listener?.onRender()
    }
}
