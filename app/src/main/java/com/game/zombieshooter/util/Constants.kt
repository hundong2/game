package com.game.zombieshooter.util

/**
 * 게임에서 사용되는 모든 상수를 정의하는 객체
 * 조선 무인 영웅전: 좀비 디펜스 버전에 맞게 수정됨
 */
object Constants {
    
    // 게임 화면 설정
    const val GAME_WIDTH = 1920  // 게임 화면 너비 (픽셀)
    const val GAME_HEIGHT = 1080 // 게임 화면 높이 (픽셀)
    const val FPS = 60           // 초당 프레임 수
    
    // 영웅 (Hero) 설정
    object HeroStats {
        // 기본 이동 속도 계수
        const val BASE_MOVE_SPEED = 5f
        
        // 캐릭터 히트박스
        const val HITBOX_WIDTH = 60f
        const val HITBOX_HEIGHT = 80f
        
        // 영웅별 ID
        const val HERO_YI_SUN_SIN = "yi_sun_sin"
        const val HERO_YI_SEONG_GYE = "yi_seong_gye"
        const val HERO_CHEOK_SA_GWANG = "cheok_sa_gwang"
        const val HERO_WANG_GEON = "wang_geon"
        const val HERO_GUNG_YE = "gung_ye"
        const val HERO_DANGUN = "dangun"
        const val HERO_GWANGGAETO = "gwanggaeto"
        const val HERO_JANGSU = "jangsu"
    }
    
    // 좀비 (Enemy) 설정
    object ZombieStats {
         // Legacy Support & New Stats
        const val ZOMBIE_WIDTH = 70f
        const val ZOMBIE_HEIGHT = 70f
    }

    object EnemyStats {
        const val SPAWN_DISTANCE = 1000f // 플레이어로부터 생성되는 거리
        const val DESPAWN_DISTANCE = 2000f
        
        // 좀비 타입
        const val TYPE_NORMAL = "normal"
        const val TYPE_RUNNER = "runner"
        const val TYPE_TANK = "tank"
        const val TYPE_BOSS = "boss"

        // 기본 스탯 (Factory에서 레벨별 보정)
        const val BASE_HP_NORMAL = 50
        const val BASE_HP_RUNNER = 30
        const val BASE_HP_TANK = 150
        const val BASE_HP_BOSS = 1000
    }
    
    // 게임 플레이 설정
    object GamePlay {
        // 스테이지 시스템
        const val WAVE_DURATION_SEC = 60 // 한 웨이브 지속 시간
        const val TIME_SCORE_MULTIPLIER = 10 // 남은 시간 1초당 점수
        
        const val MAX_ZOMBIES_ON_SCREEN = 50
        const val BULLET_COLLISION_DISTANCE = 20f
        const val COLLISION_DISTANCE = 50f

        // 경험치 및 레벨
        const val EXP_BASE_REQUIREMENT = 100
        const val EXP_GROWTH_FACTOR = 1.2f

        // 전투
        const val CRITICAL_RATE_BASE = 0.05f
        const val CRITICAL_DAMAGE_MULTIPLIER = 1.5f
    }
    
    // UI 및 컨트롤러 설정
    object Control {
        // 가상 조이스틱 (Right Bottom)
        const val JOYSTICK_CENTER_X = GAME_WIDTH - 250f
        const val JOYSTICK_CENTER_Y = GAME_HEIGHT - 250f
        const val JOYSTICK_RADIUS = 150f

        // 액션 버튼 (Left Bottom)
        const val BTN_ATTACK_X = 250f
        const val BTN_ATTACK_Y = GAME_HEIGHT - 250f
        const val BTN_RADIUS = 100f

        const val BTN_WEAPON_SWAP_X = 400f
        const val BTN_WEAPON_SWAP_Y = GAME_HEIGHT - 150f

        const val BTN_SKILL_X = 400f
        const val BTN_SKILL_Y = GAME_HEIGHT - 350f
    }
}
