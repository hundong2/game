# PHASE 2: Zombie Survival FPS 개선 계획서

> **작성자:** Game Design & Development Team
> **버전:** 1.0
> **작성일:** 2026-01-24
> **목표:** Call of Duty 수준의 몰입감 있는 좀비 서바이벌 FPS 구현

---

## 1. 현재 상태 분석 (Current State Analysis)

### 1.1 구현 완료된 기능

| 카테고리 | 기능 | 완성도 |
|---------|------|--------|
| **캐릭터** | 5개 클래스 (Knight, Wizard, Archer, Sniper, MachineGun) | ★★★★☆ |
| **무기** | 클래스별 고유 무기 및 공격 메커니즘 | ★★★★☆ |
| **좀비** | 프로시저럴 모델, 추적 AI, 애니메이션 | ★★★☆☆ |
| **스테이지** | 무한 루프 시스템, 난이도 스케일링 | ★★★☆☆ |
| **UI** | COD 스타일 HUD, 미니맵, 히트마커, 킬피드 | ★★★★☆ |
| **컨트롤** | WASD + 마우스, 모바일 터치 (기본) | ★★★☆☆ |

### 1.2 핵심 문제점

```
┌─────────────────────────────────────────────────────────────────┐
│  🔇 사운드 없음        → 몰입감 50% 손실                         │
│  👾 좀비 1종류만       → 전투 단조로움                           │
│  🗺️ 빈 맵            → 전략성 부재                              │
│  💀 Game Over = alert() → 사용자 경험 최악                      │
│  📦 아이템/파워업 없음  → 진행 동기 부족                         │
│  🎯 밸런스 미조정      → Defense 스탯 미사용                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 개선 우선순위 (Priority Matrix)

```
        높은 영향력
             │
    ┌────────┼────────┐
    │   P1   │   P2   │
    │ 사운드 │ 좀비   │
    │ 시스템 │ 다양성 │
────┼────────┼────────┼──── 낮은 노력 ←→ 높은 노력
    │   P3   │   P4   │
    │ UI/UX │ 환경   │
    │ 개선   │ 시스템 │
    └────────┼────────┘
             │
        낮은 영향력
```

---

## 3. PHASE 2 상세 계획

### 🔊 PHASE 2-A: 사운드 시스템 (Priority: Critical)

**목표:** 몰입감 있는 오디오 경험 제공

#### 구현 항목

| 사운드 타입 | 파일 | 설명 |
|------------|------|------|
| **무기** | `rifle_fire.mp3` | 소총 발사음 |
| | `shotgun_fire.mp3` | 샷건 발사음 |
| | `sword_swing.mp3` | 검 휘두르기 |
| | `bow_release.mp3` | 활 발사 |
| | `magic_cast.mp3` | 마법 시전 |
| | `reload.mp3` | 재장전 |
| **좀비** | `zombie_groan_01-05.mp3` | 좀비 신음 (랜덤) |
| | `zombie_attack.mp3` | 공격 시 |
| | `zombie_death.mp3` | 사망 시 |
| | `zombie_spawn.mp3` | 스폰 시 |
| **환경** | `ambient_horror.mp3` | 배경 음악 (루프) |
| | `heartbeat.mp3` | 체력 낮을 때 |
| | `stage_clear.mp3` | 스테이지 클리어 |
| **피드백** | `hit_marker.mp3` | 적중 시 |
| | `headshot.mp3` | 헤드샷 |
| | `player_hurt.mp3` | 피격 시 |

#### 기술 스택
```javascript
// Howler.js 사용 권장
import { Howl, Howler } from 'howler';

class AudioManager {
    constructor() {
        this.sounds = new Map();
        this.musicVolume = 0.5;
        this.sfxVolume = 0.8;
    }

    play(soundName, options = {}) {
        // 3D 공간 오디오 지원
        // 거리 기반 볼륨 감쇠
    }
}
```

#### 예상 작업량: 3-4일

---

### 👾 PHASE 2-B: 좀비 다양성 (Priority: High)

**목표:** 5종 이상의 특수 좀비로 전략적 전투 경험 제공

#### 좀비 종류

| 타입 | HP | 속도 | 공격력 | 특수 능력 | 출현 스테이지 |
|------|-----|------|--------|-----------|---------------|
| **Walker** | 100 | 2 | 10 | 없음 (기본) | Stage 1+ |
| **Runner** | 60 | 5 | 8 | 빠른 이동, 점프 공격 | Stage 3+ |
| **Tank** | 400 | 1 | 25 | 넉백 저항, 범위 공격 | Stage 5+ |
| **Spitter** | 80 | 2.5 | 15 | 원거리 산성 공격 | Stage 7+ |
| **Exploder** | 50 | 3 | 50 | 사망 시 폭발 (범위 피해) | Stage 10+ |
| **Screamer** | 70 | 2 | 5 | 비명으로 주변 좀비 버프 | Stage 12+ |
| **Boss: Abomination** | 2000 | 1.5 | 40 | 다단계 패턴, 소환 | Stage 10, 20... |

#### 외형 설계

```
Runner (러너)
├── 길쭉한 팔다리
├── 앞으로 숙인 자세
├── 발광하는 주황색 눈
└── 찢어진 운동복

Tank (탱커)
├── 비대한 체형 (일반의 2배)
├── 돌연변이 근육
├── 작은 머리
├── 등에서 뼈 돌출
└── 땅을 끄는 긴 팔

Spitter (스피터)
├── 부풀어오른 볼/목
├── 녹색 액체 흘림
├── 앞으로 늘어진 자세
└── 타액선 노출

Exploder (폭발자)
├── 부풀어오른 복부 (붉은 빛)
├── 몸 전체에 종기
├── 불안정한 걸음걸이
└── 심장 박동 시각화
```

#### 구현 구조
```javascript
// src/entities/zombies/ZombieTypes.js
export const ZOMBIE_TYPES = {
    WALKER: { weight: 50, minStage: 1 },
    RUNNER: { weight: 20, minStage: 3 },
    TANK: { weight: 10, minStage: 5 },
    SPITTER: { weight: 10, minStage: 7 },
    EXPLODER: { weight: 8, minStage: 10 },
    SCREAMER: { weight: 2, minStage: 12 }
};

class ZombieSpawner {
    getRandomType(currentStage) {
        // 가중치 기반 랜덤 선택
        // 스테이지 제한 필터링
    }
}
```

#### 예상 작업량: 5-7일

---

### 🎮 PHASE 2-C: UI/UX 개선 (Priority: High)

**목표:** 프로페셔널한 게임 메뉴 및 피드백 시스템

#### 3.1 게임 상태 머신

```
┌─────────┐     시작      ┌─────────┐
│  MENU   │ ───────────▶ │ PLAYING │
└─────────┘               └─────────┘
     ▲                         │
     │                    ESC  │  HP=0
     │         ┌───────────────┼───────────────┐
     │         ▼               ▼               │
     │    ┌─────────┐    ┌───────────┐        │
     └────│  PAUSE  │    │ GAME_OVER │────────┘
          └─────────┘    └───────────┘
               │               │
               └───── 재시작 ───┘
```

#### 3.2 새로운 UI 컴포넌트

**메인 메뉴**
```
┌────────────────────────────────────────┐
│                                        │
│        🧟 ZOMBIE SURVIVAL LOOP 🧟       │
│                                        │
│          [ ▶ START GAME ]              │
│          [ ⚙ SETTINGS ]                │
│          [ 🏆 LEADERBOARD ]            │
│          [ ❓ HOW TO PLAY ]            │
│                                        │
│              v1.0.0                    │
└────────────────────────────────────────┘
```

**일시정지 메뉴**
```
┌────────────────────────────────────────┐
│              ⏸ PAUSED                  │
│                                        │
│          [ ▶ RESUME ]                  │
│          [ ⚙ SETTINGS ]                │
│          [ 🚪 QUIT TO MENU ]           │
│                                        │
│     Stage: 5  │  Kills: 127            │
└────────────────────────────────────────┘
```

**게임 오버 화면**
```
┌────────────────────────────────────────┐
│            💀 GAME OVER 💀             │
│                                        │
│         You survived until             │
│           STAGE 12 (Loop 2)            │
│                                        │
│    ┌──────────────────────────────┐    │
│    │  Total Kills:        247     │    │
│    │  Accuracy:           68%     │    │
│    │  Time Survived:    12:34     │    │
│    │  Headshots:          52      │    │
│    └──────────────────────────────┘    │
│                                        │
│     [ 🔄 RETRY ]  [ 🏠 MENU ]          │
└────────────────────────────────────────┘
```

**설정 메뉴**
```
┌────────────────────────────────────────┐
│              ⚙ SETTINGS                │
│                                        │
│    🔊 Master Volume    [████████░░] 80%│
│    🎵 Music Volume     [██████░░░░] 60%│
│    💥 SFX Volume       [██████████] 100%│
│                                        │
│    🎯 Mouse Sensitivity [████░░░░░░] 40%│
│    🔄 Invert Y-Axis    [ OFF ]         │
│                                        │
│    🖥️ Graphics Quality               │
│       ( ) Low  (●) Medium  ( ) High    │
│                                        │
│          [ APPLY ]  [ BACK ]           │
└────────────────────────────────────────┘
```

#### 3.3 추가 시각 효과

| 효과 | 설명 | 트리거 |
|------|------|--------|
| **Screen Shake** | 화면 흔들림 강화 | 폭발, 탱커 공격 |
| **Slow Motion** | 0.3x 속도 | 마지막 좀비 처치 |
| **Vignette Pulse** | 화면 가장자리 붉은 펄스 | 체력 25% 이하 |
| **Kill Streak** | "DOUBLE KILL", "TRIPLE KILL" | 연속 처치 |
| **Headshot Popup** | "+50 HEADSHOT" | 헤드샷 시 |

#### 예상 작업량: 4-5일

---

### 🗺️ PHASE 2-D: 환경 시스템 (Priority: Medium)

**목표:** 전략적 요소가 있는 다양한 맵 환경

#### 4.1 맵 오브젝트

```javascript
// src/world/MapObjects.js
const MAP_OBJECTS = {
    // 엄폐물 (Cover)
    CONCRETE_BARRIER: { hp: Infinity, size: [2, 1, 0.5] },
    WOODEN_CRATE: { hp: 50, size: [1, 1, 1], destructible: true },
    CAR_WRECK: { hp: 200, size: [4, 1.5, 2] },
    SANDBAGS: { hp: 100, size: [2, 0.8, 0.5] },

    // 상호작용
    AMMO_CRATE: { type: 'pickup', item: 'ammo' },
    HEALTH_PACK: { type: 'pickup', item: 'health' },
    EXPLOSIVE_BARREL: { hp: 30, explodeRadius: 5, damage: 100 }
};
```

#### 4.2 맵 레이아웃 예시

```
┌──────────────────────────────────────────────────┐
│                    SPAWN ZONE                     │
│  🧟  🧟     🧟        🧟    🧟      🧟           │
├──────────────────────────────────────────────────┤
│                                                  │
│    ▓▓▓▓               ████                       │
│    ▓▓▓▓     🛢️        ████        ▓▓▓           │
│                       ████                       │
│         📦📦                   🛢️               │
│         📦📦    🚗🚗🚗                           │
│                 🚗🚗🚗         📦                 │
│    💊                          📦   ████         │
│              ▓▓▓▓▓▓                 ████         │
│    🔫        ▓▓▓▓▓▓      🛢️                     │
│                                                  │
│                    👤                            │
│               PLAYER START                       │
└──────────────────────────────────────────────────┘

범례:
▓▓ = 콘크리트 벽 (파괴 불가)
██ = 건물/구조물
📦 = 나무 상자 (파괴 가능)
🛢️ = 폭발 드럼통
🚗 = 차량 잔해
💊 = 체력 회복
🔫 = 탄약 상자
👤 = 플레이어 시작 위치
🧟 = 좀비 스폰 구역
```

#### 4.3 맵 테마

| 맵 | 스테이지 | 특징 |
|-----|---------|------|
| **폐허가 된 도시** | 1-5 | 넓은 공간, 차량 엄폐물 |
| **연구소** | 6-10 | 좁은 복도, 문 상호작용 |
| **묘지** | 11-15 | 묘비 엄폐, 안개 효과 |
| **군사 기지** | 16-20 | 탄약 풍부, 터렛 설치 가능 |

#### 예상 작업량: 6-8일

---

### 📦 PHASE 2-E: 아이템 & 파워업 (Priority: Medium)

**목표:** 전투 중 획득 가능한 아이템으로 전략성 추가

#### 드롭 아이템

| 아이템 | 효과 | 지속시간 | 드롭 확률 |
|--------|------|----------|-----------|
| **Health Pack** | HP +50 회복 | 즉시 | 15% |
| **Ammo Box** | 탄약 회복 (미래 구현) | 즉시 | 20% |
| **Speed Boost** | 이동속도 +50% | 10초 | 5% |
| **Damage Boost** | 공격력 2배 | 10초 | 5% |
| **Shield** | 피해 50% 감소 | 8초 | 3% |
| **Nuke** | 화면 내 모든 좀비 처치 | 즉시 | 0.5% |

#### 시각적 표현

```javascript
class PowerUp extends THREE.Group {
    constructor(type) {
        super();

        // 회전하는 아이콘
        this.icon = createIcon(type);

        // 바닥 발광 효과
        this.glow = new THREE.PointLight(COLOR[type], 2, 5);

        // 위아래 부유 애니메이션
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update(time) {
        this.icon.rotation.y = time * 2;
        this.position.y = 0.5 + Math.sin(time * 3 + this.floatOffset) * 0.2;
    }
}
```

#### 예상 작업량: 3-4일

---

### ⚖️ PHASE 2-F: 밸런스 조정 (Priority: Medium)

**목표:** 모든 캐릭터와 무기의 경쟁력 있는 밸런스

#### 현재 문제점

1. **Defense 스탯 미사용** - 데미지 계산에 적용 안 됨
2. **Knight 근접이 불리** - 레인지 캐릭터 대비 위험도 높음
3. **Sniper 줌 필수** - 줌 없이는 정확도 0

#### 수정 제안

```javascript
// 데미지 공식 수정
function calculateDamage(baseDamage, targetDefense) {
    const reduction = targetDefense / (targetDefense + 100);
    return baseDamage * (1 - reduction);
}

// Knight 근접 보상
const MELEE_BONUSES = {
    lifesteal: 0.1,        // 피해량의 10% 회복
    cleaveBonus: 1.2,      // 다중 타겟 시 20% 추가 피해
    staggerChance: 0.3     // 30% 확률로 좀비 경직
};

// 클래스별 패시브 능력 추가
const CLASS_PASSIVES = {
    Knight: "근접 처치 시 HP 5% 회복",
    Wizard: "처치 시 마나 충전 → 궁극기",
    Archer: "이동 중 공격 시 정확도 유지",
    Sniper: "헤드샷 시 관통 (2체까지)",
    MachineGun: "연속 사격 시 정확도 상승"
};
```

#### 예상 작업량: 2-3일

---

## 4. 구현 로드맵

```
Week 1-2: PHASE 2-A (사운드 시스템)
├── Day 1-2: AudioManager 클래스 구현
├── Day 3-4: 무기/좀비 사운드 연동
└── Day 5-7: 환경음 및 최적화

Week 3-4: PHASE 2-B (좀비 다양성)
├── Day 1-3: Runner, Tank 구현
├── Day 4-5: Spitter, Exploder 구현
├── Day 6-7: Screamer, Boss 구현
└── Day 8-10: AI 행동 패턴 테스트

Week 5-6: PHASE 2-C (UI/UX)
├── Day 1-2: 게임 상태 머신
├── Day 3-4: 메뉴 시스템
├── Day 5-6: 게임오버/통계 화면
└── Day 7-8: 시각 효과 추가

Week 7-8: PHASE 2-D (환경)
├── Day 1-3: 맵 오브젝트 시스템
├── Day 4-6: 첫 번째 맵 구현
└── Day 7-10: 파괴 가능 오브젝트

Week 9: PHASE 2-E & 2-F (아이템/밸런스)
├── Day 1-3: 드롭 시스템
├── Day 4-5: 파워업 구현
└── Day 6-7: 밸런스 조정 및 테스트
```

---

## 5. 기술 요구사항

### 추가 의존성

```json
{
  "dependencies": {
    "three": "^0.160.0",
    "howler": "^2.2.4"
  }
}
```

### 파일 구조 변경

```
src/
├── main.js
├── audio/
│   └── AudioManager.js          [NEW]
├── entities/
│   ├── zombies/
│   │   ├── BaseZombie.js        [NEW]
│   │   ├── RunnerZombie.js      [NEW]
│   │   ├── TankZombie.js        [NEW]
│   │   ├── SpitterZombie.js     [NEW]
│   │   ├── ExploderZombie.js    [NEW]
│   │   └── ScreamerZombie.js    [NEW]
│   ├── items/
│   │   ├── ItemSpawner.js       [NEW]
│   │   └── PowerUp.js           [NEW]
│   └── ...
├── ui/
│   ├── GameStateManager.js      [NEW]
│   ├── MenuSystem.js            [NEW]
│   ├── PauseMenu.js             [NEW]
│   └── GameOverScreen.js        [NEW]
├── world/
│   ├── Environment.js
│   ├── MapLoader.js             [NEW]
│   └── DestructibleObject.js    [NEW]
└── utils/
    └── BalanceConfig.js         [NEW]
```

---

## 6. 성공 지표 (KPIs)

| 지표 | 현재 | 목표 |
|------|------|------|
| 평균 플레이 시간 | ~3분 | 10분+ |
| 스테이지 도달 (평균) | 5 | 12+ |
| 재시작 비율 | 낮음 | 70%+ |
| 사운드 피드백 | 0개 | 15종+ |
| 좀비 종류 | 1 | 6+ |
| 맵 오브젝트 | 0 | 10+ |

---

## 7. 리스크 및 대응

| 리스크 | 영향 | 대응 방안 |
|--------|------|-----------|
| 사운드 파일 용량 | 로딩 시간 증가 | 압축 포맷 사용, lazy loading |
| 좀비 다양성으로 성능 저하 | FPS 드랍 | LOD 시스템, 오브젝트 풀링 |
| 밸런스 실패 | 특정 클래스만 선택 | A/B 테스트, 데이터 수집 |
| 모바일 호환성 | 터치 조작 어려움 | 오토에임 옵션, UI 크기 조정 |

---

## 8. 결론

현재 게임은 **기술적 기반이 탄탄**합니다. 프로시저럴 모델링, 무기 시스템, COD 스타일 UI가 잘 구현되어 있습니다.

하지만 **콘텐츠와 폴리시**가 부족합니다:
- 사운드가 없어 몰입감 손실
- 좀비가 한 종류라 전투가 단조로움
- 게임 오버 처리가 원시적

PHASE 2를 완료하면 **실제 출시 가능한 수준**의 좀비 서바이벌 FPS가 됩니다.

**예상 총 작업 기간: 8-10주**

---

*"좋은 FPS는 한 발의 총성이 천 개의 감정을 전달한다."*
*— Call of Duty 디자인 철학*
