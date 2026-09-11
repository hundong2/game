# DEAD SIGNAL

현재 BUILD 16.0: 9직업, 반실사 캐릭터 선택 아트, 직업별 공격·충전 공격·필살기·특수 이동을 지원합니다. 로비의 **3D 액션**에서 실전 모델을 확인할 수 있습니다. 기본 **빠른 화면**은 실시간 그림자를 끄며, 상단 버튼으로 정밀 그림자를 켤 수 있습니다.

WASD 이동과 마우스 360° 조준으로 플레이하는 항공 뷰 좀비 생존 RPG.
기획 및 개발·개선 이력은 요청한 파일명인 **[RADME.md](RADME.md)** 에 기록합니다.

## 실행

Node.js 22.13 이상, WebGL 2를 지원하는 Chrome/Edge/Firefox, PC 키보드가 필요합니다.

```sh
npm ci
npm run dev
```

브라우저에서 `http://127.0.0.1:5173/` 접속. 요원 선택 → **작전 시작**.
파일을 더블클릭하는 `file://` 실행 대신 HTTP 서버를 사용하세요.

```sh
npm test           # 전투·성장·저장·웨이브 및 모델 검증
npm run lint      # 직접 작성한 코드의 정적 검사
npx tsc --noEmit  # 타입 검사
npm run build     # 정적 배포 파일 dist/
npm run preview   # 빌드 결과 확인
```

## 조작

|키|기능|
|---|---|
|W / A / S / D 또는 방향키|위 / 왼쪽 / 아래 / 오른쪽 이동. 대각선 속도 정규화|
|마우스|커서 방향으로 360° 조준. 이동과 독립, 포인터 잠금 없음|
|마우스 왼쪽|일반 공격. 0.8초 이상 유지 후 놓으면 충전 공격|
|마우스 오른쪽|요원 고유 필살기 사용: 100% 소모, 최대 3회 저장|
|Q 유지|방어: 피해 75% 감소, 스태미나 소모|
|Space|선택한 특수기 사용|
|F / 1·2·3|특수기 순환 / 충격파·회복·빙결 직접 선택|
|R|재장전, 예비 탄약 무제한|
|Shift|달리기|
|Ctrl|직업별 특수 이동. 무사는 조준 방향 돌진, 나머지는 이동키 방향(미입력 시 조준 방향)|
|Z / X / C|전투를 멈추지 않고 공격력 / 방어력 / 사거리 강화|
|U|강화 창: 비교하는 동안 일시정지|
|Esc|일시정지 / 계속|

요원별 능력치·회복량·쿨다운·탄창이 다릅니다. 처치로 레벨이 오르면 체력과 공격력이 증가합니다. 크레딧은 원정마다 초기화됩니다. 3구역 9웨이브의 마지막 보스를 처치하면 승리합니다. 구역은 현재 하나의 도시 아레나를 공유하며 색감과 적 구성, 난도가 변합니다.

## GitHub Pages 배포

1. 이 폴더를 GitHub 저장소의 루트로 올립니다.
2. 저장소 **Settings → Pages → Source → GitHub Actions**를 선택합니다.
3. `main`에 푸시하거나 **Actions → Deploy DEAD SIGNAL to GitHub Pages → Run workflow**를 실행합니다.
4. 워크플로가 테스트·타입 검사·빌드 후 `dist/`를 배포합니다.

`base: './'` 설정으로 GitHub Pages 하위 경로를 지원합니다. 서버, 비밀 키, Worker가 필요하지 않습니다.

- 저장소: https://github.com/hundong2/zombie_game
- 게임 주소: https://hundong2.github.io/zombie_game/
- `main`에 푸시하면 검증 후 자동 배포합니다. 최초 배포 진행 상태는 저장소 Actions에서 확인하세요.
Pages에 배포하면 게임을 실행할 때 개발 PC를 켜 둘 필요가 없습니다. 개인 기록은 각 브라우저에 저장되며, 공통 온라인 랭킹 서버는 아직 연결하지 않았습니다. 배포 URL에는 저장소 이름 뒤의 `/`까지 포함하세요.
배포 구성은 [GitHub Pages 공식 워크플로 문서](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)를 따릅니다.

## 구조와 확장

|파일|책임|
|---|---|
|`app/game/content.js`|요원·스킬·스테이지·적·강화 데이터|
|`app/game/model.js`|성장, 강화 비용, 피해 공식, 웨이브 편성|
|`app/game/engine.js`|3D 월드, 적 AI, 충돌, 레이캐스트, 입력, 효과음, 렌더 루프|
|`app/game/characters.js`|GLB 스킨·리깅·idle/run 애니메이션과 모델 manifest|
|`app/game/world.js`|전술 아레나 지형과 충돌 프록시|
|`app/game/storage.js`|버전 1 로컬 저장 및 랭킹 서비스 경계|
|`app/page.tsx`|요원 선택, HUD, 강화·결과·가이드 UI|
|`app/globals.css`|요원 색상 토큰 및 반응형 스타일|
|`tests/model.test.js`|실제 전투 엔진 메서드를 사용하는 결정적 회귀 테스트|

새 요원은 `AGENTS`에 고유 id·수치·색상·설명을 추가하고, 현재 4분할 초상화 대신 개별 `portrait` 경로를 쓰도록 카드 렌더링을 확장합니다. 새 스킬은 `SKILLS` 데이터와 `GameEngine.skill()` 효과 핸들러를 함께 추가합니다. 새 지형은 `world.js`에 팩토리를 추가하고 해당 `STAGES` 데이터에서 선택하도록 확장할 수 있습니다. 렌더링과 성장 규칙이 분리되어 밸런스 변경에 3D 엔진 수정은 필요하지 않습니다.

랭킹 서버 도입 시 `localRanking.list/submit` 경계를 Promise 기반 `RankingService`로 교체하고, 제출 실패 재시도·응답 스키마 검증을 추가합니다. 클라이언트 점수는 조작 가능하므로 글로벌 경쟁 랭킹은 서버가 발급한 run id/seed와 입력 로그 검증을 바탕으로 계산해야 합니다. 브라우저에 서버 비밀 키를 넣지 않습니다.

## 자산 및 현재 범위

- 요원 초상화: 이 프로젝트를 위해 ImageGen으로 생성. WebP 최적화본 약 233 KB, 외부 이미지 요청 없음.
- 인게임 인체·좀비 및 애니메이션: [Kenney Animated Characters Retro](https://kenney.nl/assets/animated-characters-retro), CC0. 로컬 GLB와 남녀 인간/좀비 스킨 사용. 라이선스: `public/models/LICENSE-Kenney.txt`. 원본 FBX → GLB 변환은 `scripts/convert-characters.mjs`.
- 지형·장비는 코드 기반 메시, 효과음은 Web Audio 합성. 네 요원은 남녀 리그를 공유하며 능력치·HUD 색상이 구분됩니다.
- 현재는 싱글 플레이, 로컬 최근 20회 기록, PC 키보드 조작입니다. 모바일은 메뉴/HUD 반응형만 제공하며 터치 전투 조작은 포함하지 않습니다.
- 글로벌 랭킹, 원정 중간 저장, 서로 다른 지형의 맵, 고유 무기 포즈·개별 전용 모델은 후속 확장 대상입니다.
- Shadcn 기본 UI 카탈로그는 확장을 위해 유지하며, 수정하지 않은 공급자 컴포넌트는 린트 대상에서 제외합니다.
- 브라우저 실사용 검증 내역과 한계는 `RADME.md`를 참고하세요.


## V3 요원과 필살기
|요원|인게임 외형·사격|우클릭 필살기|
|---|---|---|
|VIPER|후드·망토·긴 총열, 0.24초 정밀 사격·짧은 반동|NEEDLE: 전방 관통, 폭 4.8m|
|BASTION|넓은 어깨 장갑·헬멧·드럼 탄창, 0.36초 사격·강한 반동|FAULT: 반경 15m 피해·둔화|
|PULSE|흰 의료 배낭·발광 십자·캡슐, 0.20초 사격·낮은 반동|RESURGE: 반경 18m EMP·체력 75 회복|
|REAPER|탄띠·돌격 배낭·중형 총신, 0.115초 연사·진동|HELLFIRE: 조준 방향 10m 지점 중심 광역 탄막|

첫 진입 100%, 최대 300% 저장. 처치당 7/9/11%, 웨이브 완료당 45/60/75%를 구역 1/2/3에 따라 획득합니다. 필살기 1회는 100%를 소비하며 0.65초 입력 간격이 있습니다. 기존 Space 보조 기술은 별도 쿨다운입니다.

`operators.js`가 외형·사격 포즈·무기 설정을 담당합니다. 공용 스켈레탈 리그 위에 장비와 양팔 조준 포즈를 합성하며, 네 캐릭터가 별도 고해상도 원본 모델인 것은 아닙니다. `performance.js`는 정적 지형을 소재별로 묶고 충돌 프록시는 별도로 유지합니다.


## V4 현재 캐릭터 자산과 동작
V3의 공용 몸체·절차적 장비 설명은 이전 구현 기록입니다. 현재 플레이어는 각각 다른 원본을 사용합니다.
- VIPER: 여성 Soldier, 전술복·무릎 장갑.
- BASTION: 남성 Swat, 경찰 전술 장비.
- PULSE: 여성 SciFi, 청록색 미래형 의무복.
- REAPER: 남성 Punk, 돌격병 스타일.
- 각 모델에 조준/사격/이동 사격/전진/후진/좌우 이동 클립을 포함합니다. 오른손에 무기를 연결하고 왼손 지지 자세를 보정합니다.
- [Quaternius Ultimate Modular Men](https://quaternius.com/packs/ultimatemodularcharacters.html), [Ultimate Modular Women](https://quaternius.com/packs/ultimatemodularwomen.html), CC0. 원본 제공자가 링크한 공개 다운로드에서 취득했으며 라이선스는 `public/models/LICENSE-Quaternius*.txt`에 포함했습니다.
- 변환 재현: 원본 glTF를 `work/assets/{viper,bastion,pulse,reaper}.gltf`에 놓고 `node scripts/convert-operators.mjs`. 선택한 10개 클립만 GLB로 내보냅니다. 런타임에 외부 자산 서버가 필요하지 않습니다.
- 플레이어 GLB 4개 합계 약 6.6 MB로 초기 자산 다운로드는 이전보다 증가했습니다. 최초 로딩 완료 후 전투를 시작합니다.


## V5 직업과 아키텍처
|직업|기본 공격·패시브|Space 첫 기술|우클릭 필살기|
|---|---|---|---|
|VIPER 정찰|카빈, 네 번째 탄환 1.6배|충격파|정밀 관통탄|
|BASTION 수호자|5발 산탄, 중장갑|6초 추가 피해 60% 경감|지면 충격파|
|PULSE 의무관|명중 체력 2 회복|회복을 동반한 파동|회복 EMP|
|REAPER 돌격|자동소총, 처치로 공격력 상승|탄창 회복·공격 강화|광역 탄막|
|SYLVA 궁수|2명 관통 독화살, 3초 지속 피해|5방향 다중 사격|가시 폭우|
|SPECTER 저격|3명 관통, 18m 밖 피해 1.5배|빙결 저격|처형 탄환|

궁수와 저격수는 기존 남녀 리그를 재사용한 파생 직업입니다. 궁수는 별도 활·시위·화살 메시, 저격수는 긴 총열을 사용합니다. 새 전용 모션 캡처 자산을 도입한 것은 아닙니다. 모든 직업의 2/3 보조 기술은 회복/빙결이며 F·숫자로 전환합니다.

- `combat.js`: 직업 데이터, 수치형 광선/원/엄폐 AABB 판정, 60Hz 고정 시뮬레이션 시계.
- `effects.js`: 미리 만든 64개 이펙트 재사용. 포화 시 시각 효과만 생략, 피해는 유지.
- `engine.js`: 입력·시뮬레이션·렌더 주기 조율. 적 애니메이션 30Hz/원거리 15Hz, 화면 밖 표시 생략. UI 갱신은 약 8Hz, 사격마다 React 상태를 복제하지 않음.
- `characters.js`: 자산/리그 재사용, 재질 참조 캐시. `operators.js`: 직업별 무기/시각 반동.
- 메모리/실행량 상한: 한 프레임의 시뮬레이션 최대 6스텝. 긴 멈춤 이후 무한 보충 계산을 방지합니다. 이것은 모든 기기에서 무지연을 보장하지 않습니다.

`node scripts/benchmark-combat.mjs`로 동일 머신에서 CPU 명중 판정과 이펙트 객체 수를 재측정할 수 있습니다. 160적/2,000판정 샘플: 메시 레이캐스트 41.9ms, 수치 판정 3.41ms. 게임 전체 FPS 지표가 아닙니다.
