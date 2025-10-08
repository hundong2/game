package com.game.zombieshooter.model

import com.game.zombieshooter.util.Constants

/**
 * 무기 타입을 정의하는 열거형
 */
enum class WeaponType {
    AK47,         // 기본 자동소총
    M4,           // 정확도 높은 소총
    A16,          // 높은 공격력 소총
    BAZOOKA,      // 바주카포 (광역 공격)
    FLAMETHROWER  // 화염방사기 (지속 데미지)
}

/**
 * 무기 추상 클래스
 * 
 * abstract란? 직접 인스턴스를 만들 수 없고, 상속받아서 구현해야 하는 클래스입니다.
 * 모든 무기가 공통으로 가져야 할 속성과 메서드를 정의합니다.
 */
abstract class Weapon {
    // 무기 타입
    abstract val type: WeaponType
    
    // 기본 스탯
    abstract val baseDamage: Int      // 기본 공격력
    abstract val fireRate: Float      // 발사 속도 (초)
    abstract val range: Float         // 사정거리
    abstract val price: Int           // 가격
    
    // 업그레이드 레벨
    var upgradeLevel: Int = 0
        private set
    
    // 마지막 발사 시간 (쿨다운 관리용)
    private var lastFireTime: Long = 0
    
    /**
     * 현재 공격력 (업그레이드 포함)
     */
    val damage: Int
        get() = baseDamage + (upgradeLevel * Constants.WeaponStats.UPGRADE_DAMAGE_INCREASE)
    
    /**
     * 발사 가능 여부 확인
     * 
     * @return 쿨다운이 끝났으면 true
     */
    fun canFire(): Boolean {
        val currentTime = System.currentTimeMillis()
        val cooldown = (fireRate * 1000).toLong()  // 초를 밀리초로 변환
        return currentTime - lastFireTime >= cooldown
    }
    
    /**
     * 무기를 발사합니다
     * 
     * @param targetX 목표 X 좌표
     * @param targetY 목표 Y 좌표
     * @param playerX 플레이어 X 좌표
     * @param playerY 플레이어 Y 좌표
     * @return 발사 성공 여부
     */
    fun fire(targetX: Float, targetY: Float, playerX: Float, playerY: Float): Boolean {
        if (!canFire()) {
            return false  // 아직 쿨다운 중
        }
        
        lastFireTime = System.currentTimeMillis()
        onFire(targetX, targetY, playerX, playerY)
        return true
    }
    
    /**
     * 실제 발사 로직 (각 무기가 구현)
     * 
     * protected란? 이 클래스와 상속받은 클래스에서만 접근 가능
     */
    protected abstract fun onFire(targetX: Float, targetY: Float, playerX: Float, playerY: Float)
    
    /**
     * 무기를 업그레이드합니다
     * 
     * @return 업그레이드 성공 여부
     */
    fun upgrade(): Boolean {
        if (upgradeLevel >= Constants.WeaponStats.MAX_UPGRADE_LEVEL) {
            return false  // 최대 레벨 도달
        }
        upgradeLevel++
        return true
    }
    
    /**
     * 업그레이드 비용 계산
     */
    fun getUpgradeCost(): Int {
        return (price * 0.3 * Math.pow(
            Constants.WeaponStats.UPGRADE_COST_MULTIPLIER.toDouble(),
            upgradeLevel.toDouble()
        )).toInt()
    }
    
    companion object {
        /**
         * 무기 타입별 가격 반환
         */
        fun getWeaponPrice(type: WeaponType): Int {
            return when (type) {
                WeaponType.AK47 -> Constants.WeaponStats.AK47_PRICE
                WeaponType.M4 -> Constants.WeaponStats.M4_PRICE
                WeaponType.A16 -> Constants.WeaponStats.A16_PRICE
                WeaponType.BAZOOKA -> Constants.WeaponStats.BAZOOKA_PRICE
                WeaponType.FLAMETHROWER -> Constants.WeaponStats.FLAMETHROWER_PRICE
            }
        }
    }
}

/**
 * AK-47 클래스
 * 기본 자동소총, 균형잡힌 성능
 */
class AK47Weapon : Weapon() {
    override val type = WeaponType.AK47
    override val baseDamage = Constants.WeaponStats.AK47_DAMAGE
    override val fireRate = Constants.WeaponStats.AK47_FIRE_RATE
    override val range = Constants.WeaponStats.AK47_RANGE
    override val price = Constants.WeaponStats.AK47_PRICE
    
    override fun onFire(targetX: Float, targetY: Float, playerX: Float, playerY: Float) {
        // 일반 총알 발사 로직
        // GameView에서 총알 생성 및 렌더링 처리
    }
}

/**
 * M4 클래스
 * 높은 정확도의 소총
 */
class M4Weapon : Weapon() {
    override val type = WeaponType.M4
    override val baseDamage = Constants.WeaponStats.M4_DAMAGE
    override val fireRate = Constants.WeaponStats.M4_FIRE_RATE
    override val range = Constants.WeaponStats.M4_RANGE
    override val price = Constants.WeaponStats.M4_PRICE
    
    override fun onFire(targetX: Float, targetY: Float, playerX: Float, playerY: Float) {
        // 정확한 총알 발사 (탄 퍼짐 최소)
    }
}

/**
 * A16 클래스
 * 높은 공격력, 느린 연사속도
 */
class A16Weapon : Weapon() {
    override val type = WeaponType.A16
    override val baseDamage = Constants.WeaponStats.A16_DAMAGE
    override val fireRate = Constants.WeaponStats.A16_FIRE_RATE
    override val range = Constants.WeaponStats.A16_RANGE
    override val price = Constants.WeaponStats.A16_PRICE
    
    override fun onFire(targetX: Float, targetY: Float, playerX: Float, playerY: Float) {
        // 강력한 총알 발사 (관통 효과 가능)
    }
}

/**
 * 바주카포 클래스
 * 광역 폭발 데미지
 */
class BazookaWeapon : Weapon() {
    override val type = WeaponType.BAZOOKA
    override val baseDamage = Constants.WeaponStats.BAZOOKA_DAMAGE
    override val fireRate = Constants.WeaponStats.BAZOOKA_FIRE_RATE
    override val range = Constants.WeaponStats.BAZOOKA_RANGE
    override val price = Constants.WeaponStats.BAZOOKA_PRICE
    
    // 폭발 반경
    val explosionRadius = Constants.WeaponStats.BAZOOKA_EXPLOSION_RADIUS
    
    override fun onFire(targetX: Float, targetY: Float, playerX: Float, playerY: Float) {
        // 로켓 발사 -> 목표 지점에서 폭발 -> 범위 내 모든 적 데미지
    }
}

/**
 * 화염방사기 클래스
 * 지속 화상 데미지
 */
class FlamethrowerWeapon : Weapon() {
    override val type = WeaponType.FLAMETHROWER
    override val baseDamage = Constants.WeaponStats.FLAMETHROWER_DAMAGE
    override val fireRate = Constants.WeaponStats.FLAMETHROWER_FIRE_RATE
    override val range = Constants.WeaponStats.FLAMETHROWER_RANGE
    override val price = Constants.WeaponStats.FLAMETHROWER_PRICE
    
    // 화상 지속 시간
    val burnDuration = Constants.WeaponStats.FLAMETHROWER_BURN_DURATION
    
    override fun onFire(targetX: Float, targetY: Float, playerX: Float, playerY: Float) {
        // 화염 스프레이 생성 -> 범위 내 적들에게 화상 효과 부여
    }
}
