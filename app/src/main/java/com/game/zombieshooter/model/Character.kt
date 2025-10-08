package com.game.zombieshooter.model

import com.game.zombieshooter.util.Constants

/**
 * 캐릭터 타입을 정의하는 열거형(Enum)
 * 
 * Enum이란? 미리 정의된 상수들의 집합입니다.
 * 예: 요일(월,화,수...), 방향(동,서,남,북) 등
 */
enum class CharacterType {
    SPEED,    // 빠른 캐릭터
    BALANCED, // 균형잡힌 캐릭터
    TANK      // 탱크 캐릭터
}

/**
 * 캐릭터 정보를 담는 데이터 클래스
 * 
 * @property type 캐릭터 타입 (스피드/밸런스/탱크)
 * @property name 캐릭터 이름
 * @property description 캐릭터 설명
 * @property maxHP 최대 HP
 * @property speed 이동 속도
 * 
 * 데이터 클래스란? 데이터를 저장하기 위한 클래스입니다.
 * 자동으로 equals(), hashCode(), toString() 등을 생성해줍니다.
 */
data class CharacterData(
    val type: CharacterType,
    val name: String,
    val description: String,
    val maxHP: Int,
    val speed: Float
) {
    companion object {
        /**
         * 캐릭터 타입별 데이터를 반환하는 팩토리 함수
         * 
         * Companion Object란? Java의 static과 비슷합니다.
         * 클래스 인스턴스 없이 호출할 수 있습니다.
         * 
         * @param type 캐릭터 타입
         * @return 해당 타입의 캐릭터 데이터
         */
        fun getCharacterData(type: CharacterType): CharacterData {
            return when (type) {
                CharacterType.SPEED -> CharacterData(
                    type = CharacterType.SPEED,
                    name = "스피드",
                    description = "빠른 이동 속도로 적을 피할 수 있습니다. 하지만 HP가 낮아 주의가 필요합니다.",
                    maxHP = Constants.CharacterStats.SPEED_TYPE_HP,
                    speed = Constants.CharacterStats.SPEED_TYPE_SPEED
                )
                CharacterType.BALANCED -> CharacterData(
                    type = CharacterType.BALANCED,
                    name = "밸런스",
                    description = "균형잡힌 능력치로 초보자에게 추천합니다.",
                    maxHP = Constants.CharacterStats.BALANCED_TYPE_HP,
                    speed = Constants.CharacterStats.BALANCED_TYPE_SPEED
                )
                CharacterType.TANK -> CharacterData(
                    type = CharacterType.TANK,
                    name = "탱크",
                    description = "높은 HP로 오래 버틸 수 있지만 이동이 느립니다.",
                    maxHP = Constants.CharacterStats.TANK_TYPE_HP,
                    speed = Constants.CharacterStats.TANK_TYPE_SPEED
                )
            }
        }
        
        /**
         * 모든 캐릭터 데이터를 리스트로 반환
         * 캐릭터 선택 화면에서 사용됩니다.
         */
        fun getAllCharacters(): List<CharacterData> {
            return CharacterType.values().map { getCharacterData(it) }
        }
    }
}
