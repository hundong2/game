package com.game.zombieshooter.factory

import com.game.zombieshooter.model.*

/**
 * 무기 생성을 담당하는 팩토리 클래스
 * 
 * Factory 패턴이란?
 * 객체 생성 로직을 별도의 클래스에 캡슐화하는 디자인 패턴입니다.
 * 
 * 장점:
 * 1. 객체 생성 로직이 한 곳에 모여있어 관리가 쉽습니다
 * 2. 새로운 무기를 추가할 때 이 클래스만 수정하면 됩니다
 * 3. 코드의 결합도가 낮아집니다
 * 
 * object 키워드: Singleton 패턴을 구현합니다
 * 앱 전체에서 단 하나의 인스턴스만 존재합니다
 */
object WeaponFactory {
    
    /**
     * 무기 타입에 따라 적절한 무기 객체를 생성합니다
     * 
     * @param type 생성할 무기 타입
     * @return 생성된 무기 객체
     * 
     * when 표현식: Java의 switch-case와 비슷하지만 더 강력합니다
     */
    fun createWeapon(type: WeaponType): Weapon {
        return when (type) {
            WeaponType.AK47 -> AK47Weapon()
            WeaponType.M4 -> M4Weapon()
            WeaponType.A16 -> A16Weapon()
            WeaponType.BAZOOKA -> BazookaWeapon()
            WeaponType.FLAMETHROWER -> FlamethrowerWeapon()
        }
    }
    
    /**
     * 모든 무기 타입의 리스트를 반환합니다
     * 상점 UI에서 사용됩니다
     */
    fun getAllWeaponTypes(): List<WeaponType> {
        return WeaponType.values().toList()
    }
    
    /**
     * 무기 정보를 얻습니다 (UI 표시용)
     * 
     * @param type 무기 타입
     * @return 무기 정보 데이터
     */
    fun getWeaponInfo(type: WeaponType): WeaponInfo {
        val weapon = createWeapon(type)
        return WeaponInfo(
            type = type,
            name = getWeaponName(type),
            description = getWeaponDescription(type),
            damage = weapon.baseDamage,
            fireRate = weapon.fireRate,
            range = weapon.range,
            price = weapon.price
        )
    }
    
    /**
     * 무기 이름 반환
     */
    private fun getWeaponName(type: WeaponType): String {
        return when (type) {
            WeaponType.AK47 -> "AK-47"
            WeaponType.M4 -> "M4 카빈"
            WeaponType.A16 -> "A16 소총"
            WeaponType.BAZOOKA -> "바주카포"
            WeaponType.FLAMETHROWER -> "화염방사기"
        }
    }
    
    /**
     * 무기 설명 반환
     */
    private fun getWeaponDescription(type: WeaponType): String {
        return when (type) {
            WeaponType.AK47 -> "신뢰할 수 있는 기본 소총. 균형잡힌 성능으로 초보자에게 적합합니다."
            WeaponType.M4 -> "높은 정확도의 전술 소총. 정확한 헤드샷이 가능합니다."
            WeaponType.A16 -> "강력한 공격력의 돌격소총. 느린 발사 속도지만 한 방 한 방이 강력합니다."
            WeaponType.BAZOOKA -> "광역 폭발 무기. 여러 적을 한 번에 제거할 수 있습니다."
            WeaponType.FLAMETHROWER -> "화염 공격 무기. 지속적인 화상 데미지로 적을 불태웁니다."
        }
    }
}

/**
 * 무기 정보를 담는 데이터 클래스 (UI 표시용)
 */
data class WeaponInfo(
    val type: WeaponType,
    val name: String,
    val description: String,
    val damage: Int,
    val fireRate: Float,
    val range: Float,
    val price: Int
)
