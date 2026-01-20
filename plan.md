# Development Plan

- [x] **Project Setup & Docker**
  - [x] Initialize `package.json`
  - [x] Create `Dockerfile`
  - [x] Setup Vite & Vitest

- [x] **Core Game Logic (TDD)**
  - [x] Create Character Classes (Wizard, Archer, Sniper, MachineGun, Knight)
  - [x] Implement Stat Scaling Logic
  - [x] Implement Infinite Loop Logic
  - [x] Verify with Tests

- [x] **3D Scene & Engine**
  - [x] Setup Three.js Scene (Lights, Floor)
  - [x] Implement Player Controller (PointerLock)
  - [x] Implement Mobile Touch Controls

- [x] **Game Entities**
  - [x] Implement Zombie Entities
  - [x] Implement Weapon Systems (Projectiles, Raycasts)

- [x] **Game Loop & Features**
  - [x] Implement Stage Progression (20 Stages + Loop)
  - [x] Implement Enemy Spawning
  - [x] UI & HUD Implementation

- [x] **Polishing & Fixes**
  - [x] Fix Mobile Shooting Logic
  - [x] Add Damage Cooldown
  - [x] Fix Minification issues (Class names)
  - [x] Final Docker Build Verification

---

# 개선 계획 (Improvement Plan)

## 🏗️ 코드 구조/아키텍처

- [ ] **코드 통합**
  - [ ] `game.js`와 `src/main.js` 두 개의 게임 로직 통합 또는 역할 명확화
  - [ ] 전역 변수를 클래스 기반 상태 관리로 리팩토링
  - [ ] TypeScript 도입으로 타입 안전성 확보

- [ ] **모듈화 개선**
  - [ ] UI 관련 코드를 별도 UIManager 클래스로 분리
  - [ ] 오디오 시스템을 AudioManager로 분리
  - [ ] 이벤트 기반 아키텍처 도입 (EventEmitter 패턴)

## 🎮 게임플레이 개선

- [ ] **게임 오버 시스템**
  - [ ] `alert()` + `location.reload()` 대신 부드러운 UI 전환 구현
  - [ ] 재시작 버튼 및 메인 메뉴 복귀 옵션 추가

- [ ] **점수/경험치 시스템**
  - [ ] 좀비 처치 시 경험치 획득
  - [ ] 플레이어 레벨업 시스템 구현
  - [ ] 레벨업 시 스탯 보너스 또는 스킬 선택

- [ ] **스킬 시스템**
  - [ ] 각 캐릭터별 고유 스킬 추가 (예: Wizard - 범위 공격, Knight - 방어막)
  - [ ] 쿨다운 기반 스킬 사용

- [ ] **아이템/파워업**
  - [ ] 체력 회복 아이템
  - [ ] 일시적 공격력/이동속도 버프
  - [ ] 탄약 상자 (무한 탄약이 아닌 경우)

- [ ] **적 다양화**
  - [ ] 다양한 좀비 유형 추가 (빠른 좀비, 탱커 좀비, 원거리 좀비)
  - [ ] 스테이지별 보스 좀비 구현
  - [ ] 좀비 AI 개선 (회피, 그룹 행동)

## 🖼️ UI/UX 개선

- [ ] **캐릭터 선택 화면**
  - [ ] 캐릭터별 스탯 미리보기 (HP, 속도, 데미지 등)
  - [ ] 캐릭터 3D 프리뷰 또는 아이콘

- [ ] **인게임 UI**
  - [ ] 미니맵 추가
  - [ ] 킬 카운터 및 스테이지 진행도 표시
  - [ ] 데미지 숫자 팝업
  - [ ] 스킬 쿨다운 표시

- [ ] **메뉴 시스템**
  - [ ] 일시정지 메뉴 (ESC 키)
  - [ ] 설정 메뉴 (마우스 감도, 음량, 그래픽 품질)
  - [ ] 게임 종료 확인 다이얼로그

## ⚡ 성능 최적화

- [ ] **프레임 독립적 스폰 로직**
  - [ ] `Math.random() < 0.05` 대신 시간 기반 스폰 시스템
  - [ ] 스테이지별 스폰 간격 조절

- [ ] **오브젝트 풀링**
  - [ ] 좀비 엔티티 풀링
  - [ ] 발사체 풀링
  - [ ] 파티클 풀링

- [ ] **Three.js 최적화**
  - [ ] Geometry 및 Material 재사용
  - [ ] InstancedMesh 사용으로 동일 모델 최적화
  - [ ] Frustum Culling 활용

## 🎨 그래픽/비주얼 개선

- [ ] **3D 모델**
  - [ ] 좀비 모델 개선 (단순 박스 → 캐릭터 모델 또는 개선된 형태)
  - [ ] 무기 모델 추가 (1인칭 무기 뷰)
  - [ ] 환경 오브젝트 추가 (건물, 장애물, 나무 등)

- [ ] **파티클 효과**
  - [ ] 좀비 사망 시 파티클
  - [ ] 타격 효과 (피, 스파크)
  - [ ] 총구 화염 효과
  - [ ] 마법 효과 (Wizard)

- [ ] **조명 개선**
  - [ ] 동적 조명 (총구 플래시)
  - [ ] 분위기 있는 안개/어둠 효과
  - [ ] 스테이지별 환경 변화 (낮/밤)

## 🔊 사운드 시스템

- [ ] **오디오 매니저 구현**
  - [ ] 배경 음악 (메뉴, 인게임, 보스전)
  - [ ] 총 발사 사운드 (캐릭터별 다름)
  - [ ] 좀비 사운드 (등장, 피격, 사망)
  - [ ] UI 사운드 (버튼 클릭, 스테이지 클리어)

- [ ] **공간 오디오**
  - [ ] 좀비 방향 기반 3D 사운드
  - [ ] 거리 기반 볼륨 조절

## 💾 데이터 저장

- [ ] **로컬 저장**
  - [ ] 최고 점수 저장 (LocalStorage)
  - [ ] 설정값 저장
  - [ ] 게임 진행 저장/불러오기

- [ ] **리더보드**
  - [ ] 로컬 리더보드 구현
  - [ ] (선택) 온라인 리더보드 연동

## 🧪 테스트 강화

- [ ] **유닛 테스트 확장**
  - [ ] 캐릭터 스탯 테스트
  - [ ] 데미지 계산 테스트
  - [ ] 스테이지 진행 로직 테스트

- [ ] **E2E 테스트**
  - [ ] 게임 시작부터 종료까지 플로우 테스트
  - [ ] 모바일 터치 컨트롤 테스트

## 📱 모바일 최적화

- [ ] **터치 컨트롤 개선**
  - [ ] 가상 조이스틱 개선
  - [ ] 전용 발사 버튼
  - [ ] 스킬 버튼 UI

- [ ] **반응형 UI**
  - [ ] 다양한 화면 크기 대응
  - [ ] 세로/가로 모드 지원

---

## 우선순위 추천 (Priority)

### 높음 (High)
1. 게임 오버 UI 개선 (alert 제거)
2. 사운드 시스템 추가
3. 캐릭터 선택 시 스탯 표시
4. 프레임 독립적 스폰 로직

### 중간 (Medium)
1. 점수/경험치 시스템
2. 다양한 좀비 유형
3. 파티클 효과
4. 일시정지 메뉴

### 낮음 (Low)
1. TypeScript 마이그레이션
2. 온라인 리더보드
3. 게임 저장/불러오기

---

## 완료된 작업 (Completed)

### 2024-01 - 1인칭 무기 뷰 및 좀비 모델 개선

- [x] **1인칭 무기 시스템 (Call of Duty 스타일)**
  - [x] `src/models/ProceduralWeapons.js` - 5가지 무기 모델 생성
    - Knight: 검 (손잡이 + 가드 + 칼날)
    - Sniper: 스나이퍼 라이플 (총열 + 스코프 + 개머리판)
    - MachineGun: 기관총 (총열 + 드럼 매거진)
    - Archer: 활 (TorusGeometry + 시위 + 화살)
    - Wizard: 지팡이 (크리스탈 발광 효과)
  - [x] 손 모델 구현 (손바닥 + 손가락 + 슬리브)

- [x] **1인칭 무기 뷰 렌더링**
  - [x] `src/entities/FirstPersonWeaponView.js` - 별도 씬/카메라로 무기 렌더링
  - [x] 이중 렌더링 (월드 씬 → 무기 씬)
  - [x] near plane 0.01로 클리핑 문제 해결

- [x] **무기 애니메이션**
  - [x] Bobbing (이동 시 상하좌우 흔들림)
  - [x] Sway (대기 시 미세 움직임)
  - [x] Recoil (발사 시 반동 - 캐릭터별 다름)

- [x] **좀비 모델 개선**
  - [x] `src/models/ProceduralZombie.js` - 인간형 좀비 모델
    - 머리 (구 + 빨간 눈 + 이빨)
    - 몸통 (찢어진 옷 표현)
    - 팔/다리 (관절 구조)
  - [x] 좀비 피부 색상 (어두운 올리브 그린)
  - [x] 빛나는 빨간 눈

- [x] **좀비 애니메이션**
  - [x] 걷기 애니메이션 (팔다리 흔들림)
  - [x] 좀비 특유의 팔 앞으로 뻗기
  - [x] 머리/몸통 흔들림 (shamble 효과)
  - [x] 피격 시 빨간색 플래시
  - [x] 사망 애니메이션 (뒤로 쓰러짐)
