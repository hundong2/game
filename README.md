# 좀비 슈터 게임 (Zombie Shooter Game)

안드로이드 좀비 슈팅 게임 - Kotlin으로 개발된 2D 액션 게임

## 📋 프로젝트 개요

메탈 슬러그 스타일의 2D 좀비 슈팅 게임입니다. 플레이어는 다양한 무기를 사용하여 레벨별로 나타나는 좀비들을 처치하고, 획득한 골드로 무기를 업그레이드할 수 있습니다.

## 🎮 게임 기능

### 1. 플레이어 캐릭터 (3종)
- **스피드 타입**: 빠른 이동 속도, 낮은 HP
- **밸런스 타입**: 평균적인 이동 속도와 HP
- **탱크 타입**: 느린 이동 속도, 높은 HP

### 2. 무기 시스템 (5종)
- **AK-47**: 기본 자동소총, 중간 공격력, 빠른 연사력
- **M4**: 높은 정확도, 중간 공격력, 안정적인 연사력
- **A16** (AR-16 가정): 높은 공격력, 느린 연사력
- **바주카포**: 먼 사정거리, 광역 폭발 데미지, 느린 발사 속도
- **화염방사기**: 넓은 공격 범위, 지속 화상 데미지, 짧은 사정거리

### 3. 좀비 시스템
- 레벨별 다양한 좀비 종류
- 각 좀비마다 다른 HP와 이동 속도
- 무기의 공격력에 따라 HP 감소
- 처치 시 점수 및 골드 획득

### 4. 조작 방법
- 방향키/화살표: 상하좌우 이동
- 탭 버튼: 실시간 무기 변경
- 자동 공격 또는 공격 버튼

### 5. 업그레이드 시스템
- 골드를 사용한 무기 구매
- 무기별 공격력 업그레이드
- 캐릭터 능력치 강화

## 🏗️ 아키텍처 및 디자인 패턴

### 사용된 디자인 패턴

#### 1. **MVC (Model-View-Controller) 패턴**
```
Model: 게임 데이터 (Player, Weapon, Zombie, GameState)
View: UI 렌더링 (GameView, MenuView)
Controller: 게임 로직 및 입력 처리 (GameController)
```

#### 2. **Factory 패턴**
```kotlin
WeaponFactory: 무기 생성
ZombieFactory: 좀비 생성
```

#### 3. **Strategy 패턴**
```kotlin
WeaponStrategy: 각 무기의 공격 방식 정의
MovementStrategy: 캐릭터별 이동 방식
```

#### 4. **Observer 패턴**
```kotlin
게임 이벤트 리스너 (점수 변경, 골드 획득 등)
```

#### 5. **Singleton 패턴**
```kotlin
GameManager: 게임 상태 관리
SoundManager: 사운드 효과 관리
```

### 프로젝트 구조
```
app/
├── src/
│   ├── main/
│   │   ├── java/com/game/zombieshooter/
│   │   │   ├── model/              # 데이터 모델
│   │   │   │   ├── Player.kt       # 플레이어 클래스
│   │   │   │   ├── Character.kt    # 캐릭터 타입
│   │   │   │   ├── Weapon.kt       # 무기 클래스
│   │   │   │   ├── Zombie.kt       # 좀비 클래스
│   │   │   │   └── GameState.kt    # 게임 상태
│   │   │   │
│   │   │   ├── controller/         # 게임 로직
│   │   │   │   ├── GameController.kt
│   │   │   │   ├── InputController.kt
│   │   │   │   └── CollisionController.kt
│   │   │   │
│   │   │   ├── view/               # UI 및 렌더링
│   │   │   │   ├── GameView.kt
│   │   │   │   ├── MenuView.kt
│   │   │   │   └── HUDView.kt
│   │   │   │
│   │   │   ├── factory/            # Factory 패턴
│   │   │   │   ├── WeaponFactory.kt
│   │   │   │   └── ZombieFactory.kt
│   │   │   │
│   │   │   ├── strategy/           # Strategy 패턴
│   │   │   │   ├── WeaponStrategy.kt
│   │   │   │   └── MovementStrategy.kt
│   │   │   │
│   │   │   ├── manager/            # Singleton 관리자
│   │   │   │   ├── GameManager.kt
│   │   │   │   └── SoundManager.kt
│   │   │   │
│   │   │   ├── util/               # 유틸리티
│   │   │   │   ├── Constants.kt
│   │   │   │   └── Extensions.kt
│   │   │   │
│   │   │   └── MainActivity.kt     # 메인 액티비티
│   │   │
│   │   ├── res/                    # 리소스
│   │   │   ├── drawable/           # 이미지 리소스
│   │   │   ├── layout/             # XML 레이아웃
│   │   │   ├── values/             # 문자열, 색상 등
│   │   │   └── raw/                # 사운드 파일
│   │   │
│   │   └── AndroidManifest.xml     # 앱 설정
│   │
│   └── test/                       # 유닛 테스트
│       └── java/com/game/zombieshooter/
│           ├── PlayerTest.kt
│           ├── WeaponTest.kt
│           └── GameLogicTest.kt
│
├── build.gradle                    # 앱 레벨 빌드 설정
└── gradle.properties               # Gradle 속성

```

## 📱 기술 스택

- **언어**: Kotlin
- **최소 SDK**: API 24 (Android 7.0)
- **타겟 SDK**: API 34 (Android 14)
- **게임 엔진**: Android Canvas (2D)
- **아키텍처**: MVC + 디자인 패턴
- **의존성**:
  - AndroidX Core KTX
  - AndroidX AppCompat
  - Material Design Components
  - Coroutines (비동기 처리)

## 🚀 시작하기

### 필수 조건

1. **Android Studio** (최신 버전 권장)
2. **JDK** 11 이상
3. **Android SDK** API 24 이상
4. **에뮬레이터** 또는 **실제 Android 기기**

### 설치 방법

```bash
# 1. 레포지토리 클론
git clone https://github.com/hundong2/game.git
cd game

# 2. Android Studio에서 프로젝트 열기
# File > Open > game 폴더 선택

# 3. Gradle 동기화
# Android Studio에서 자동으로 실행됨

# 4. 빌드 및 실행
# Run > Run 'app' 또는 Shift + F10
```

### 프로젝트 빌드

```bash
# 디버그 빌드
./gradlew assembleDebug

# 릴리스 빌드
./gradlew assembleRelease

# 테스트 실행
./gradlew test

# APK 설치
./gradlew installDebug
```

## 🎯 사용법

### 게임 시작

1. 앱 실행 후 캐릭터 선택 화면에서 원하는 캐릭터 선택
2. 무기 선택 (기본: AK-47)
3. "게임 시작" 버튼 클릭

### 게임 플레이

1. **이동**: 화면의 방향 패드 또는 화살표 버튼 사용
2. **공격**: 자동 공격 또는 화면 터치
3. **무기 변경**: 화면 상단의 무기 아이콘 탭
4. **일시정지**: 우측 상단 일시정지 버튼

### 업그레이드

1. 게임 중 획득한 골드 사용
2. 메뉴에서 "상점" 선택
3. 원하는 무기 구매 또는 업그레이드 선택

## 🧪 테스트

### 유닛 테스트

```bash
# 모든 유닛 테스트 실행
./gradlew test

# 특정 테스트 실행
./gradlew test --tests PlayerTest
./gradlew test --tests WeaponTest
```

### 테스트 커버리지

```bash
# 커버리지 보고서 생성
./gradlew jacocoTestReport

# 보고서 위치: build/reports/jacoco/test/html/index.html
```

### 주요 테스트 케이스

1. **플레이어 테스트**
   - 캐릭터별 능력치 검증
   - 이동 로직 검증
   - HP 감소/회복 검증

2. **무기 테스트**
   - 무기별 공격력 검증
   - 특수 효과 검증 (화염방사기, 바주카)
   - 업그레이드 로직 검증

3. **좀비 테스트**
   - 레벨별 좀비 생성 검증
   - HP 및 데미지 시스템 검증
   - 점수/골드 드랍 검증

4. **게임 로직 테스트**
   - 충돌 감지 검증
   - 레벨 진행 검증
   - 게임 오버 조건 검증

## 📚 코드 예제

### 플레이어 생성 및 이동

```kotlin
// 플레이어 생성
val player = Player(
    characterType = CharacterType.BALANCED,
    startX = 100f,
    startY = 100f
)

// 이동
player.moveUp()
player.moveDown()
player.moveLeft()
player.moveRight()

// 상태 확인
println("HP: ${player.currentHP}/${player.maxHP}")
println("Position: (${player.x}, ${player.y})")
```

### 무기 생성 및 공격

```kotlin
// 무기 생성 (Factory 패턴)
val weapon = WeaponFactory.createWeapon(WeaponType.AK47)

// 공격
val damage = weapon.attack(targetX, targetY)

// 무기 변경
player.equipWeapon(WeaponFactory.createWeapon(WeaponType.FLAMETHROWER))

// 업그레이드
weapon.upgrade()
```

### 좀비 생성 및 처리

```kotlin
// 좀비 생성 (Factory 패턴)
val zombie = ZombieFactory.createZombie(level = 1)

// 데미지 처리
zombie.takeDamage(weapon.damage)

// 좀비 처치 확인
if (zombie.isDead()) {
    val reward = zombie.getReward()
    player.addScore(reward.score)
    player.addGold(reward.gold)
}
```

## 🎨 게임 요소 상세

### 캐릭터 스탯

| 캐릭터 | 이동속도 | HP | 특징 |
|--------|----------|-------|------|
| 스피드 | 150% | 70 | 빠른 회피, 낮은 생존력 |
| 밸런스 | 100% | 100 | 균형잡힌 능력 |
| 탱크 | 70% | 150 | 높은 생존력, 느린 이동 |

### 무기 스탯

| 무기 | 공격력 | 연사속도 | 사정거리 | 특수효과 | 가격(골드) |
|------|--------|----------|----------|----------|------------|
| AK-47 | 10 | 빠름 | 중간 | 없음 | 0 (기본) |
| M4 | 12 | 중간 | 중간 | 높은 정확도 | 500 |
| A16 | 18 | 느림 | 긴 | 관통 | 1000 |
| 바주카 | 50 | 매우 느림 | 매우 긴 | 광역 폭발 | 2000 |
| 화염방사기 | 5/초 | 지속 | 짧음 | 지속 화상 | 1500 |

### 좀비 타입 (레벨별)

| 레벨 | 좀비 타입 | HP | 속도 | 점수 | 골드 |
|------|-----------|-----|------|------|------|
| 1 | 일반 좀비 | 20 | 느림 | 10 | 5 |
| 2 | 빠른 좀비 | 15 | 빠름 | 15 | 8 |
| 3 | 강한 좀비 | 40 | 느림 | 25 | 15 |
| 4 | 탱크 좀비 | 80 | 매우 느림 | 50 | 30 |
| 5+ | 보스 좀비 | 200+ | 중간 | 100+ | 50+ |

## 🛠️ 개발 가이드

### 새로운 무기 추가하기

```kotlin
// 1. WeaponType enum에 새 무기 추가
enum class WeaponType {
    AK47, M4, A16, BAZOOKA, FLAMETHROWER, 
    NEW_WEAPON // 새 무기
}

// 2. WeaponFactory에 생성 로직 추가
object WeaponFactory {
    fun createWeapon(type: WeaponType): Weapon {
        return when(type) {
            // ... 기존 무기들
            WeaponType.NEW_WEAPON -> NewWeapon()
        }
    }
}

// 3. 새 무기 클래스 구현
class NewWeapon : Weapon() {
    override val damage = 25
    override val fireRate = 0.5f
    override val range = 300f
    
    override fun attack(targetX: Float, targetY: Float): Int {
        // 공격 로직 구현
        return damage
    }
}
```

### 새로운 좀비 타입 추가하기

```kotlin
// 1. ZombieType enum에 새 좀비 추가
enum class ZombieType {
    NORMAL, FAST, STRONG, TANK, BOSS,
    NEW_ZOMBIE // 새 좀비
}

// 2. ZombieFactory에 생성 로직 추가
object ZombieFactory {
    fun createZombie(level: Int): Zombie {
        val type = determineZombieType(level)
        return when(type) {
            // ... 기존 좀비들
            ZombieType.NEW_ZOMBIE -> NewZombie(level)
        }
    }
}

// 3. 새 좀비 클래스 구현
class NewZombie(level: Int) : Zombie(level) {
    override val maxHP = 100 + level * 10
    override val speed = 2.0f
    override val scoreReward = 30
    override val goldReward = 20
}
```

## 🐛 디버깅 팁

### 로그 사용하기

```kotlin
import android.util.Log

class GameController {
    private val TAG = "GameController"
    
    fun update() {
        Log.d(TAG, "게임 업데이트 - FPS: $fps")
        Log.i(TAG, "좀비 수: ${zombies.size}")
        Log.w(TAG, "플레이어 HP 낮음: ${player.currentHP}")
        Log.e(TAG, "오류 발생!", exception)
    }
}
```

### 일반적인 문제 해결

1. **게임이 느려요**
   - 좀비 생성 빈도 조절
   - 사용하지 않는 객체 제거 (메모리 관리)
   - 렌더링 최적화 (오프스크린 객체 무시)

2. **충돌 감지가 안 돼요**
   - 히트박스 크기 확인
   - 좌표계 일치 확인
   - 충돌 감지 로직 디버그 로그 추가

3. **무기가 제대로 작동하지 않아요**
   - 무기 상태 로그 출력
   - 공격 쿨다운 확인
   - 발사체 생성 확인

## 📝 향후 개발 계획

### Phase 1 (현재)
- [x] 기본 게임 메커니즘
- [x] 3가지 캐릭터
- [x] 5가지 무기
- [x] 레벨 시스템
- [x] 업그레이드 시스템

### Phase 2 (예정)
- [ ] 멀티플레이어 모드
- [ ] 추가 무기 (저격총, 수류탄 등)
- [ ] 보스 좀비 다양화
- [ ] 아이템 시스템 (체력 팩, 방어구 등)
- [ ] 업적 시스템

### Phase 3 (예정)
- [ ] 스토리 모드
- [ ] 일일 미션
- [ ] 리더보드
- [ ] 소셜 기능 (친구 초대 등)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이센스

이 프로젝트는 MIT 라이센스를 따릅니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 👥 제작자

- **hundong2** - *Initial work* - [hundong2](https://github.com/hundong2)

## 🙏 감사의 말

- 메탈 슬러그 게임에서 영감을 받았습니다
- Android 개발 커뮤니티에 감사드립니다

## 📧 연락처

프로젝트 링크: [https://github.com/hundong2/game](https://github.com/hundong2/game)

---

## 초보자를 위한 가이드

### Kotlin 기초

이 게임은 Kotlin으로 작성되었습니다. Kotlin을 처음 접하신다면 다음 개념을 먼저 이해하세요:

1. **클래스와 객체**
```kotlin
// 클래스 정의
class Player(val name: String, var hp: Int) {
    // 함수
    fun attack() {
        println("$name이 공격합니다!")
    }
}

// 객체 생성
val player = Player("영웅", 100)
player.attack()
```

2. **상속**
```kotlin
// 부모 클래스
open class Weapon(val damage: Int) {
    open fun attack() { }
}

// 자식 클래스
class Rifle : Weapon(10) {
    override fun attack() {
        // 총 공격 로직
    }
}
```

3. **인터페이스**
```kotlin
interface Damageable {
    fun takeDamage(amount: Int)
}

class Zombie : Damageable {
    override fun takeDamage(amount: Int) {
        // 데미지 처리
    }
}
```

### Android 기초

1. **Activity**: 앱의 화면을 나타내는 컴포넌트
2. **View**: UI 요소 (버튼, 텍스트 등)
3. **Canvas**: 2D 그래픽을 그리는 도구
4. **Thread**: 백그라운드 작업 처리

### 게임 개발 기초

1. **게임 루프**: 매 프레임마다 실행되는 반복문
2. **렌더링**: 화면에 그래픽 그리기
3. **충돌 감지**: 두 객체가 부딪혔는지 확인
4. **상태 관리**: 게임의 현재 상태 추적

## FAQ

**Q: Android Studio가 없어도 개발할 수 있나요?**
A: 안드로이드 앱 개발에는 Android Studio가 필수입니다.

**Q: 실제 기기 없이 테스트할 수 있나요?**
A: 네, Android Studio의 에뮬레이터를 사용할 수 있습니다.

**Q: 게임이 너무 어려워요/쉬워요**
A: `Constants.kt` 파일에서 난이도 관련 상수를 조정할 수 있습니다.

**Q: 새로운 기능을 추가하고 싶어요**
A: "개발 가이드" 섹션을 참조하거나 이슈를 등록해주세요.

**Q: 버그를 발견했어요**
A: GitHub Issues에 버그 리포트를 작성해주세요.
