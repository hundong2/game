package com.game.zombieshooter.model

/**
 * 게임 상태를 나타내는 열거형
 * 
 * 게임이 어떤 화면/상태에 있는지 관리합니다.
 */
enum class GameState {
    MENU,           // 메인 메뉴 화면
    CHARACTER_SELECT, // 캐릭터 선택 화면
    WEAPON_SELECT,  // 무기 선택 화면
    PLAYING,        // 게임 플레이 중
    PAUSED,         // 일시정지
    SHOP,           // 상점 화면
    GAME_OVER       // 게임 오버
}

/**
 * 게임 데이터를 관리하는 클래스
 * 
 * 플레이어, 좀비들, 발사체 등 게임 중 모든 데이터를 보관합니다.
 */
class GameData {
    // 현재 게임 상태
    var state: GameState = GameState.MENU
    
    // 플레이어
    var player: Player? = null
    
    // 좀비 리스트
    val zombies = mutableListOf<Zombie>()
    
    // 발사체 리스트 (총알, 로켓 등)
    val projectiles = mutableListOf<Projectile>()
    
    // 게임 시간 관련
    var gameTime: Float = 0f  // 게임 시작 후 경과 시간 (초)
    var deltaTime: Float = 0f // 이전 프레임 이후 경과 시간 (초)
    
    // 좀비 스폰 관련
    var zombieSpawnTimer: Float = 0f
    var zombieSpawnRate: Float = 2f  // 초당 스폰 수
    
    /**
     * 게임 데이터를 초기화합니다
     */
    fun reset() {
        zombies.clear()
        projectiles.clear()
        gameTime = 0f
        zombieSpawnTimer = 0f
    }
    
    /**
     * 죽은 좀비들을 제거합니다
     * 
     * @return 제거된 좀비 수
     */
    fun removeDeadZombies(): Int {
        val initialSize = zombies.size
        zombies.removeAll { it.isDead }
        return initialSize - zombies.size
    }
    
    /**
     * 화면 밖의 발사체를 제거합니다
     */
    fun removeOffscreenProjectiles() {
        projectiles.removeAll { it.isOffscreen() }
    }
}

/**
 * 발사체 클래스 (총알, 로켓 등)
 */
data class Projectile(
    var x: Float,
    var y: Float,
    val velocityX: Float,
    val velocityY: Float,
    val damage: Int,
    val weaponType: WeaponType,
    var isActive: Boolean = true
) {
    /**
     * 발사체 위치 업데이트
     * 
     * @param deltaTime 경과 시간
     */
    fun update(deltaTime: Float) {
        x += velocityX * deltaTime * 60  // 60 FPS 기준
        y += velocityY * deltaTime * 60
    }
    
    /**
     * 화면 밖으로 나갔는지 확인
     */
    fun isOffscreen(): Boolean {
        return x < -100 || x > Constants.GAME_WIDTH + 100 ||
               y < -100 || y > Constants.GAME_HEIGHT + 100
    }
    
    /**
     * 좀비와 충돌했는지 확인
     * 
     * @param zombie 확인할 좀비
     * @return 충돌했으면 true
     */
    fun isCollidingWith(zombie: Zombie): Boolean {
        val dx = zombie.x - x
        val dy = zombie.y - y
        val distance = kotlin.math.sqrt(dx * dx + dy * dy)
        return distance < Constants.GamePlay.BULLET_COLLISION_DISTANCE
    }
}

/**
 * 폭발 효과 데이터 (바주카포용)
 */
data class Explosion(
    val x: Float,
    val y: Float,
    val radius: Float,
    val damage: Int,
    var duration: Float = 0.5f  // 폭발 애니메이션 지속 시간
) {
    private val startTime = System.currentTimeMillis()
    
    /**
     * 폭발이 끝났는지 확인
     */
    fun isFinished(): Boolean {
        val elapsed = (System.currentTimeMillis() - startTime) / 1000f
        return elapsed >= duration
    }
    
    /**
     * 좀비가 폭발 범위 안에 있는지 확인
     */
    fun isZombieInRange(zombie: Zombie): Boolean {
        val dx = zombie.x - x
        val dy = zombie.y - y
        val distance = kotlin.math.sqrt(dx * dx + dy * dy)
        return distance <= radius
    }
}
