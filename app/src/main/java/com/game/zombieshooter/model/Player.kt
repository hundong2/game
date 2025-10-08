package com.game.zombieshooter.model

import com.game.zombieshooter.util.Constants
import com.game.zombieshooter.util.clamp

/**
 * 플레이어 클래스
 * 
 * 플레이어의 위치, HP, 무기, 골드 등을 관리합니다.
 * 
 * @property characterType 선택한 캐릭터 타입
 * @property startX 시작 X 좌표
 * @property startY 시작 Y 좌표
 */
class Player(
    private val characterType: CharacterType,
    startX: Float = Constants.GAME_WIDTH / 2f,
    startY: Float = Constants.GAME_HEIGHT / 2f
) {
    // 캐릭터 데이터 가져오기
    private val characterData = CharacterData.getCharacterData(characterType)
    
    // 현재 위치
    var x: Float = startX
        private set  // 외부에서 직접 수정 불가 (캡슐화)
    var y: Float = startY
        private set
    
    // HP 관련
    val maxHP: Int = characterData.maxHP
    var currentHP: Int = maxHP
        private set
    
    // 이동 속도
    val speed: Float = characterData.speed
    
    // 현재 장착한 무기
    var currentWeapon: Weapon? = null
        private set
    
    // 게임 스탯
    var score: Int = 0
        private set
    var gold: Int = 0
        private set
    var level: Int = 1
        private set
    
    // 소유한 무기 목록
    private val ownedWeapons = mutableListOf<WeaponType>()
    
    // 상태 확인
    val isAlive: Boolean
        get() = currentHP > 0
    
    /**
     * 위쪽으로 이동
     * 
     * 화면 경계를 넘어가지 않도록 제한합니다.
     */
    fun moveUp() {
        y = (y - speed).clamp(0f, Constants.GAME_HEIGHT.toFloat())
    }
    
    /**
     * 아래쪽으로 이동
     */
    fun moveDown() {
        y = (y + speed).clamp(0f, Constants.GAME_HEIGHT.toFloat())
    }
    
    /**
     * 왼쪽으로 이동
     */
    fun moveLeft() {
        x = (x - speed).clamp(0f, Constants.GAME_WIDTH.toFloat())
    }
    
    /**
     * 오른쪽으로 이동
     */
    fun moveRight() {
        x = (x + speed).clamp(0f, Constants.GAME_WIDTH.toFloat())
    }
    
    /**
     * 데미지를 받습니다
     * 
     * @param damage 받을 데미지
     * @return 실제로 받은 데미지 (HP가 0 이하로 내려가지 않음)
     */
    fun takeDamage(damage: Int): Int {
        val actualDamage = damage.coerceAtMost(currentHP)
        currentHP -= actualDamage
        return actualDamage
    }
    
    /**
     * HP를 회복합니다
     * 
     * @param amount 회복량
     * @return 실제로 회복한 양 (최대 HP를 초과하지 않음)
     */
    fun heal(amount: Int): Int {
        val oldHP = currentHP
        currentHP = (currentHP + amount).clamp(0, maxHP)
        return currentHP - oldHP
    }
    
    /**
     * 무기를 장착합니다
     * 
     * @param weapon 장착할 무기
     */
    fun equipWeapon(weapon: Weapon) {
        currentWeapon = weapon
    }
    
    /**
     * 무기를 구매합니다
     * 
     * @param weaponType 구매할 무기 타입
     * @return 구매 성공 여부
     */
    fun buyWeapon(weaponType: WeaponType): Boolean {
        // 이미 소유한 무기인지 확인
        if (ownedWeapons.contains(weaponType)) {
            return false
        }
        
        // 무기 가격 확인
        val price = Weapon.getWeaponPrice(weaponType)
        if (gold < price) {
            return false  // 골드가 부족함
        }
        
        // 골드 차감 및 무기 추가
        gold -= price
        ownedWeapons.add(weaponType)
        return true
    }
    
    /**
     * 소유한 무기인지 확인
     */
    fun hasWeapon(weaponType: WeaponType): Boolean {
        return ownedWeapons.contains(weaponType)
    }
    
    /**
     * 점수를 추가합니다
     * 
     * @param points 추가할 점수
     */
    fun addScore(points: Int) {
        score += points
        
        // 레벨업 체크
        val newLevel = 1 + score / Constants.GamePlay.LEVEL_UP_SCORE_THRESHOLD
        if (newLevel > level) {
            level = newLevel
            // 레벨업 시 HP 회복 (보너스)
            heal(maxHP / 10)
        }
    }
    
    /**
     * 골드를 추가합니다
     * 
     * @param amount 추가할 골드
     */
    fun addGold(amount: Int) {
        gold += amount
    }
    
    /**
     * 위치를 설정합니다 (디버그/테스트용)
     */
    fun setPosition(newX: Float, newY: Float) {
        x = newX.clamp(0f, Constants.GAME_WIDTH.toFloat())
        y = newY.clamp(0f, Constants.GAME_HEIGHT.toFloat())
    }
    
    /**
     * 플레이어 상태를 초기화합니다
     */
    fun reset() {
        currentHP = maxHP
        score = 0
        level = 1
        // 골드는 유지 (게임 세션 간 유지)
    }
    
    /**
     * 플레이어 정보를 문자열로 반환 (디버깅용)
     */
    override fun toString(): String {
        return "Player(type=$characterType, HP=$currentHP/$maxHP, score=$score, gold=$gold, level=$level)"
    }
}
