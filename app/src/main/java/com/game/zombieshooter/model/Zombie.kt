package com.game.zombieshooter.model

import com.game.zombieshooter.util.Constants
import com.game.zombieshooter.util.clamp
import kotlin.math.atan2

/**
 * 좀비 타입을 정의하는 열거형
 */
enum class ZombieType {
    NORMAL,  // 일반 좀비
    FAST,    // 빠른 좀비
    STRONG,  // 강한 좀비
    TANK,    // 탱크 좀비
    BOSS     // 보스 좀비
}

/**
 * 좀비 추상 클래스
 * 
 * 모든 좀비가 공통으로 가져야 할 속성과 메서드를 정의합니다.
 */
abstract class Zombie(
    val level: Int,  // 게임 레벨 (레벨이 높을수록 좀비가 강해짐)
    startX: Float,   // 시작 X 좌표
    startY: Float    // 시작 Y 좌표
) {
    // 좀비 타입
    abstract val type: ZombieType
    
    // 기본 스탯
    abstract val baseHP: Int        // 기본 HP
    abstract val baseSpeed: Float   // 기본 이동 속도
    abstract val scoreReward: Int   // 처치 시 점수
    abstract val goldReward: Int    // 처치 시 골드
    
    // 현재 위치
    var x: Float = startX
        private set
    var y: Float = startY
        private set
    
    // 현재 HP (레벨에 따라 증가)
    val maxHP: Int = baseHP + (level * Constants.ZombieStats.HP_INCREASE_PER_LEVEL)
    var currentHP: Int = maxHP
        private set
    
    // 이동 속도
    val speed: Float = baseSpeed
    
    // 화상 효과 (화염방사기용)
    var isBurning: Boolean = false
        private set
    private var burnEndTime: Long = 0
    private var burnDamagePerSecond: Int = 0
    
    // 상태 확인
    val isDead: Boolean
        get() = currentHP <= 0
    
    /**
     * 데미지를 받습니다
     * 
     * @param damage 받을 데미지
     * @return 실제로 받은 데미지
     */
    fun takeDamage(damage: Int): Int {
        val actualDamage = damage.coerceAtMost(currentHP)
        currentHP -= actualDamage
        return actualDamage
    }
    
    /**
     * 화상 효과를 부여합니다
     * 
     * @param damagePerSecond 초당 데미지
     * @param duration 지속 시간 (초)
     */
    fun applyBurn(damagePerSecond: Int, duration: Float) {
        isBurning = true
        burnDamagePerSecond = damagePerSecond
        burnEndTime = System.currentTimeMillis() + (duration * 1000).toLong()
    }
    
    /**
     * 화상 효과를 업데이트합니다
     * 
     * @param deltaTime 이전 프레임 이후 경과 시간 (초)
     * @return 화상으로 입은 데미지
     */
    fun updateBurnEffect(deltaTime: Float): Int {
        if (!isBurning) {
            return 0
        }
        
        val currentTime = System.currentTimeMillis()
        if (currentTime >= burnEndTime) {
            isBurning = false
            return 0
        }
        
        val damage = (burnDamagePerSecond * deltaTime).toInt()
        return takeDamage(damage)
    }
    
    /**
     * 플레이어를 향해 이동합니다
     * 
     * @param playerX 플레이어 X 좌표
     * @param playerY 플레이어 Y 좌표
     * @param deltaTime 이전 프레임 이후 경과 시간 (초)
     */
    fun moveTowardsPlayer(playerX: Float, playerY: Float, deltaTime: Float) {
        // 플레이어 방향 계산
        val dx = playerX - x
        val dy = playerY - y
        val distance = kotlin.math.sqrt(dx * dx + dy * dy)
        
        if (distance > 0) {
            // 정규화된 방향 벡터 * 속도 * deltaTime
            val moveDistance = speed * deltaTime * 60  // 60 FPS 기준
            x += (dx / distance) * moveDistance
            y += (dy / distance) * moveDistance
            
            // 화면 경계 제한
            x = x.clamp(0f, Constants.GAME_WIDTH.toFloat())
            y = y.clamp(0f, Constants.GAME_HEIGHT.toFloat())
        }
    }
    
    /**
     * 플레이어와의 충돌 여부 확인
     * 
     * @param playerX 플레이어 X 좌표
     * @param playerY 플레이어 Y 좌표
     * @return 충돌했으면 true
     */
    fun isCollidingWithPlayer(playerX: Float, playerY: Float): Boolean {
        val dx = playerX - x
        val dy = playerY - y
        val distance = kotlin.math.sqrt(dx * dx + dy * dy)
        return distance < Constants.GamePlay.COLLISION_DISTANCE
    }
    
    /**
     * 플레이어를 향한 각도를 계산합니다 (렌더링용)
     * 
     * @param playerX 플레이어 X 좌표
     * @param playerY 플레이어 Y 좌표
     * @return 라디안 각도
     */
    fun getAngleToPlayer(playerX: Float, playerY: Float): Float {
        return atan2((playerY - y).toDouble(), (playerX - x).toDouble()).toFloat()
    }
    
    /**
     * 보상 데이터를 반환합니다
     */
    fun getReward(): ZombieReward {
        return ZombieReward(scoreReward, goldReward)
    }
}

/**
 * 좀비 보상 데이터 클래스
 */
data class ZombieReward(
    val score: Int,
    val gold: Int
)

/**
 * 일반 좀비 클래스
 */
class NormalZombie(level: Int, startX: Float, startY: Float) : Zombie(level, startX, startY) {
    override val type = ZombieType.NORMAL
    override val baseHP = Constants.ZombieStats.NORMAL_BASE_HP
    override val baseSpeed = Constants.ZombieStats.NORMAL_SPEED
    override val scoreReward = Constants.ZombieStats.NORMAL_SCORE
    override val goldReward = Constants.ZombieStats.NORMAL_GOLD
}

/**
 * 빠른 좀비 클래스
 */
class FastZombie(level: Int, startX: Float, startY: Float) : Zombie(level, startX, startY) {
    override val type = ZombieType.FAST
    override val baseHP = Constants.ZombieStats.FAST_BASE_HP
    override val baseSpeed = Constants.ZombieStats.FAST_SPEED
    override val scoreReward = Constants.ZombieStats.FAST_SCORE
    override val goldReward = Constants.ZombieStats.FAST_GOLD
}

/**
 * 강한 좀비 클래스
 */
class StrongZombie(level: Int, startX: Float, startY: Float) : Zombie(level, startX, startY) {
    override val type = ZombieType.STRONG
    override val baseHP = Constants.ZombieStats.STRONG_BASE_HP
    override val baseSpeed = Constants.ZombieStats.STRONG_SPEED
    override val scoreReward = Constants.ZombieStats.STRONG_SCORE
    override val goldReward = Constants.ZombieStats.STRONG_GOLD
}

/**
 * 탱크 좀비 클래스
 */
class TankZombie(level: Int, startX: Float, startY: Float) : Zombie(level, startX, startY) {
    override val type = ZombieType.TANK
    override val baseHP = Constants.ZombieStats.TANK_BASE_HP
    override val baseSpeed = Constants.ZombieStats.TANK_SPEED
    override val scoreReward = Constants.ZombieStats.TANK_SCORE
    override val goldReward = Constants.ZombieStats.TANK_GOLD
}

/**
 * 보스 좀비 클래스
 */
class BossZombie(level: Int, startX: Float, startY: Float) : Zombie(level, startX, startY) {
    override val type = ZombieType.BOSS
    override val baseHP = Constants.ZombieStats.BOSS_BASE_HP
    override val baseSpeed = Constants.ZombieStats.BOSS_SPEED
    override val scoreReward = Constants.ZombieStats.BOSS_SCORE
    override val goldReward = Constants.ZombieStats.BOSS_GOLD
}
