package com.game.zombieshooter.util

/**
 * 게임에서 사용되는 모든 상수를 정의하는 객체
 * 
 * 이 파일에서 게임의 난이도, 캐릭터 능력치, 무기 스탯 등을 조정할 수 있습니다.
 * 초보자 팁: 게임이 너무 어렵거나 쉬우면 이 값들을 조정해보세요!
 */
object Constants {
    
    // 게임 화면 설정
    const val GAME_WIDTH = 1920  // 게임 화면 너비 (픽셀)
    const val GAME_HEIGHT = 1080 // 게임 화면 높이 (픽셀)
    const val FPS = 60           // 초당 프레임 수
    
    // 캐릭터 타입별 기본 스탯
    object CharacterStats {
        // 스피드 타입: 빠른 이동, 낮은 HP
        const val SPEED_TYPE_HP = 70
        const val SPEED_TYPE_SPEED = 6f  // 프레임당 이동 거리
        
        // 밸런스 타입: 균형잡힌 능력
        const val BALANCED_TYPE_HP = 100
        const val BALANCED_TYPE_SPEED = 4f
        
        // 탱크 타입: 높은 HP, 느린 이동
        const val TANK_TYPE_HP = 150
        const val TANK_TYPE_SPEED = 2.8f
        
        // 캐릭터 크기 (히트박스)
        const val CHARACTER_WIDTH = 80f
        const val CHARACTER_HEIGHT = 80f
    }
    
    // 무기 스탯
    object WeaponStats {
        // AK-47: 기본 자동소총
        const val AK47_DAMAGE = 10
        const val AK47_FIRE_RATE = 0.1f  // 초당 발사 횟수 (0.1초 = 10발/초)
        const val AK47_RANGE = 500f
        const val AK47_PRICE = 0  // 기본 무기
        
        // M4: 높은 정확도
        const val M4_DAMAGE = 12
        const val M4_FIRE_RATE = 0.15f
        const val M4_RANGE = 550f
        const val M4_PRICE = 500
        
        // A16: 높은 공격력
        const val A16_DAMAGE = 18
        const val A16_FIRE_RATE = 0.25f
        const val A16_RANGE = 600f
        const val A16_PRICE = 1000
        
        // 바주카포: 광역 공격
        const val BAZOOKA_DAMAGE = 50
        const val BAZOOKA_FIRE_RATE = 2f    // 2초마다 1발
        const val BAZOOKA_RANGE = 800f
        const val BAZOOKA_EXPLOSION_RADIUS = 150f
        const val BAZOOKA_PRICE = 2000
        
        // 화염방사기: 지속 데미지
        const val FLAMETHROWER_DAMAGE = 5  // 초당 데미지
        const val FLAMETHROWER_FIRE_RATE = 0.05f  // 지속적으로 발사
        const val FLAMETHROWER_RANGE = 250f
        const val FLAMETHROWER_BURN_DURATION = 3f  // 3초간 지속 화상
        const val FLAMETHROWER_PRICE = 1500
        
        // 업그레이드 관련
        const val UPGRADE_DAMAGE_INCREASE = 5  // 업그레이드당 증가하는 데미지
        const val UPGRADE_COST_MULTIPLIER = 1.5f  // 업그레이드 비용 증가율
        const val MAX_UPGRADE_LEVEL = 10  // 최대 업그레이드 레벨
    }
    
    // 좀비 스탯
    object ZombieStats {
        // 일반 좀비
        const val NORMAL_BASE_HP = 20
        const val NORMAL_SPEED = 1.5f
        const val NORMAL_SCORE = 10
        const val NORMAL_GOLD = 5
        
        // 빠른 좀비
        const val FAST_BASE_HP = 15
        const val FAST_SPEED = 3f
        const val FAST_SCORE = 15
        const val FAST_GOLD = 8
        
        // 강한 좀비
        const val STRONG_BASE_HP = 40
        const val STRONG_SPEED = 1f
        const val STRONG_SCORE = 25
        const val STRONG_GOLD = 15
        
        // 탱크 좀비
        const val TANK_BASE_HP = 80
        const val TANK_SPEED = 0.5f
        const val TANK_SCORE = 50
        const val TANK_GOLD = 30
        
        // 보스 좀비
        const val BOSS_BASE_HP = 200
        const val BOSS_SPEED = 0.8f
        const val BOSS_SCORE = 100
        const val BOSS_GOLD = 50
        
        // 좀비 크기
        const val ZOMBIE_WIDTH = 70f
        const val ZOMBIE_HEIGHT = 70f
        
        // 레벨당 HP 증가율
        const val HP_INCREASE_PER_LEVEL = 10
    }
    
    // 게임 플레이 설정
    object GamePlay {
        const val INITIAL_ZOMBIE_SPAWN_RATE = 2f  // 초당 좀비 생성 수
        const val MAX_ZOMBIES_ON_SCREEN = 50      // 화면에 동시에 존재할 수 있는 최대 좀비 수
        const val LEVEL_UP_SCORE_THRESHOLD = 500  // 레벨업에 필요한 점수
        const val SPAWN_RATE_INCREASE = 0.2f      // 레벨당 스폰 속도 증가
        
        // 충돌 감지 거리
        const val COLLISION_DISTANCE = 50f  // 플레이어와 좀비 사이의 충돌 거리
        const val BULLET_COLLISION_DISTANCE = 20f  // 총알과 좀비 사이의 충돌 거리
    }
    
    // UI 관련
    object UI {
        const val HUD_PADDING = 20f
        const val HUD_TEXT_SIZE = 40f
        const val BUTTON_WIDTH = 150f
        const val BUTTON_HEIGHT = 150f
        const val WEAPON_ICON_SIZE = 100f
    }
    
    // 사운드 설정
    object Sound {
        const val MASTER_VOLUME = 1.0f
        const val SFX_VOLUME = 0.8f
        const val MUSIC_VOLUME = 0.6f
    }
}
