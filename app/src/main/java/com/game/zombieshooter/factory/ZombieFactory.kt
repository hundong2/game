package com.game.zombieshooter.factory

import com.game.zombieshooter.model.*
import com.game.zombieshooter.util.Constants
import kotlin.random.Random

/**
 * 좀비 생성을 담당하는 팩토리 클래스
 * 
 * Factory 패턴으로 좀비 생성 로직을 캡슐화합니다.
 * 레벨에 따라 적절한 타입의 좀비를 생성합니다.
 */
object ZombieFactory {
    
    /**
     * 레벨에 맞는 좀비를 생성합니다
     * 
     * @param level 현재 게임 레벨
     * @return 생성된 좀비
     * 
     * 레벨이 높을수록 강한 좀비가 나올 확률이 높아집니다
     */
    fun createZombie(level: Int): Zombie {
        val type = determineZombieType(level)
        val position = getRandomSpawnPosition()
        
        return when (type) {
            ZombieType.NORMAL -> NormalZombie(level, position.first, position.second)
            ZombieType.FAST -> FastZombie(level, position.first, position.second)
            ZombieType.STRONG -> StrongZombie(level, position.first, position.second)
            ZombieType.TANK -> TankZombie(level, position.first, position.second)
            ZombieType.BOSS -> BossZombie(level, position.first, position.second)
        }
    }
    
    /**
     * 레벨에 따라 좀비 타입을 결정합니다
     * 
     * @param level 현재 게임 레벨
     * @return 생성할 좀비 타입
     * 
     * 확률 분포:
     * - 레벨 1-2: 대부분 일반 좀비
     * - 레벨 3-5: 빠른 좀비와 강한 좀비 등장
     * - 레벨 6-9: 탱크 좀비 등장
     * - 레벨 10+: 보스 좀비 등장
     */
    private fun determineZombieType(level: Int): ZombieType {
        val random = Random.nextInt(100)  // 0~99 사이의 랜덤 숫자
        
        return when {
            // 레벨 1-2: 일반 좀비 위주
            level <= 2 -> {
                when {
                    random < 80 -> ZombieType.NORMAL  // 80% 확률
                    else -> ZombieType.FAST           // 20% 확률
                }
            }
            
            // 레벨 3-5: 다양한 좀비
            level <= 5 -> {
                when {
                    random < 50 -> ZombieType.NORMAL  // 50% 확률
                    random < 75 -> ZombieType.FAST    // 25% 확률
                    else -> ZombieType.STRONG         // 25% 확률
                }
            }
            
            // 레벨 6-9: 강한 좀비 증가
            level <= 9 -> {
                when {
                    random < 30 -> ZombieType.NORMAL  // 30% 확률
                    random < 50 -> ZombieType.FAST    // 20% 확률
                    random < 80 -> ZombieType.STRONG  // 30% 확률
                    else -> ZombieType.TANK           // 20% 확률
                }
            }
            
            // 레벨 10+: 보스 좀비 등장
            else -> {
                when {
                    random < 20 -> ZombieType.NORMAL  // 20% 확률
                    random < 35 -> ZombieType.FAST    // 15% 확률
                    random < 60 -> ZombieType.STRONG  // 25% 확률
                    random < 85 -> ZombieType.TANK    // 25% 확률
                    else -> ZombieType.BOSS           // 15% 확률
                }
            }
        }
    }
    
    /**
     * 좀비의 스폰 위치를 랜덤하게 결정합니다
     * 
     * @return (X, Y) 좌표 쌍
     * 
     * 화면 가장자리에서 스폰되도록 합니다:
     * - 위쪽 가장자리
     * - 아래쪽 가장자리
     * - 왼쪽 가장자리
     * - 오른쪽 가장자리
     */
    private fun getRandomSpawnPosition(): Pair<Float, Float> {
        val edge = Random.nextInt(4)  // 0~3: 위, 아래, 왼쪽, 오른쪽
        
        return when (edge) {
            0 -> {
                // 위쪽 가장자리
                val x = Random.nextFloat() * Constants.GAME_WIDTH
                Pair(x, 0f)
            }
            1 -> {
                // 아래쪽 가장자리
                val x = Random.nextFloat() * Constants.GAME_WIDTH
                Pair(x, Constants.GAME_HEIGHT.toFloat())
            }
            2 -> {
                // 왼쪽 가장자리
                val y = Random.nextFloat() * Constants.GAME_HEIGHT
                Pair(0f, y)
            }
            else -> {
                // 오른쪽 가장자리
                val y = Random.nextFloat() * Constants.GAME_HEIGHT
                Pair(Constants.GAME_WIDTH.toFloat(), y)
            }
        }
    }
    
    /**
     * 특정 타입의 좀비를 생성합니다 (테스트/디버그용)
     * 
     * @param type 좀비 타입
     * @param level 게임 레벨
     * @param x X 좌표
     * @param y Y 좌표
     * @return 생성된 좀비
     */
    fun createSpecificZombie(
        type: ZombieType,
        level: Int,
        x: Float,
        y: Float
    ): Zombie {
        return when (type) {
            ZombieType.NORMAL -> NormalZombie(level, x, y)
            ZombieType.FAST -> FastZombie(level, x, y)
            ZombieType.STRONG -> StrongZombie(level, x, y)
            ZombieType.TANK -> TankZombie(level, x, y)
            ZombieType.BOSS -> BossZombie(level, x, y)
        }
    }
}
