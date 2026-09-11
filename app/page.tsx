"use client";
import { MOBILITY } from "./game/mobility.js";
import { SPECIAL_ATTACKS, CHARGE_SECONDS } from "./game/specials.js";
import { MOTION_PROFILES } from "./game/motion.js";
import { COMBAT_CLASSES, classSkills } from "./game/combat.js";
import { LOADOUTS } from "./game/operators.js";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  Crosshair,
  Radio,
  ArrowUpRight,
  Shield,
  Zap,
  Trophy,
  Volume2,
  VolumeX,
  Pause,
  Play,
  ChevronRight,
  ScanLine,
  Heart,
  Target,
  Keyboard,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AGENTS, STAGES, SKILLS, UPGRADES } from "./game/content";
import { GameEngine } from "./game/engine";
import { createRun, upgradeCost } from "./game/model";
import { localRanking } from "./game/storage";

type Snapshot = ReturnType<typeof createRun> & {
  hit: boolean;
  damageFlash: boolean;
  skillFlash: boolean;
  heading: number;
  position: { x: number; z: number };
  enemies: { x: number; z: number; type: string }[];
  storageSaved?: boolean;
};
type RecordEntry = {
  id: string;
  agent: string;
  score: number;
  wave: number;
  kills: number;
  seconds: number;
};
type ToolDocument = Document & {
  modelContext?: {
    registerTool(
      tool: {
        name: string;
        description: string;
        inputSchema: object;
        annotations: { readOnlyHint: boolean };
        execute: (input: unknown) => unknown;
      },
      options: { signal: AbortSignal },
    ): unknown;
  };
};
const time = (s: number) =>
  `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(s % 60)
    .toString()
    .padStart(2, "0")}`;
const key = (label: string) => <kbd>{label}</kbd>;
function FighterArt({id,className=""}:{id:string;className?:string}) {
  const index=Math.max(0,AGENTS.findIndex(a=>a.id===id));
  return <div className={`fighter-art ${className}`} aria-hidden="true"><img
    src={import.meta.env.BASE_URL+"art/operators-v15.png"} alt=""
    style={{transform:`translate(${-((index%3)*100)/3}%,${-(Math.floor(index/3)*100)/3}%)`}} /></div>;
}
export default function Home() {
  const host = useRef<HTMLDivElement>(null),
    engine = useRef<GameEngine | null>(null);
  const [agentId, setAgent] = useState("viper"),
    [run, setRun] = useState<Snapshot | null>(null),
    [ready, setReady] = useState(false),
    [portraits, setPortraits] = useState<Record<string, string>>({}),
    [error, setError] = useState(""),
    [panel, setPanel] = useState(""),
    [muted, setMuted] = useState(false),
    [showcase, setShowcase] = useState(false),
    [quality, setQuality] = useState("fast"),
    [records, setRecords] = useState<RecordEntry[]>([]);
  const selected = AGENTS.find((a) => a.id === agentId)!;
  const active = run?.agent || selected;
  useEffect(() => {
    let game: GameEngine;
    try {
      game = new GameEngine(host.current!, setRun);
      engine.current = game;
      game.onUpgrade = () => setPanel("upgrade");
      game.ready
        .then(() => {
          if (!game.disposed) {
            setPortraits(game.portraits);
            setReady(true);
          }
        })
        .catch(() =>
          setError("캐릭터 모델을 불러오지 못했습니다. 새로고침해 주세요."),
        );
    } catch (e) {
      queueMicrotask(() =>
        setError(
          "3D 화면을 시작할 수 없습니다. 하드웨어 가속을 켠 Chrome 또는 Edge에서 다시 열어 주세요.",
        ),
      );
      console.error(e);
    }
    return () => game?.dispose();
  }, []);
  useEffect(() => {
    const context = (document as ToolDocument).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: "read_survival_status",
            description: "현재 원정의 상태와 점수를 읽습니다.",
            inputSchema: {
              type: "object",
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: (input: unknown) => {
              if (
                !input ||
                typeof input !== "object" ||
                Array.isArray(input) ||
                Object.keys(input).length
              )
                throw new Error("입력은 빈 객체여야 합니다.");
              const r = engine.current?.run;
              return r
                ? {
                    phase: r.phase,
                    position: {
                      x: engine.current?.playerPosition.x,
                      z: engine.current?.playerPosition.z,
                    },
                    aim: { x: engine.current?.aim.x, z: engine.current?.aim.z },
                    ammo: r.ammo,
                    ultimate: r.ultimate,
                    performance: engine.current?.performanceStats,
                    wave: r.wave,
                    hp: Math.round(r.hp),
                    score: r.score,
                    classId: r.agent.id,
                    shots: r.shots,
                    charge: r.charge,
                    charging: r.charging,
                    specialCooldown: r.specialCooldown,
                    ultimateFx: r.ultimateFx,
                    rollTime: r.rollTime,
                    rollCooldown: r.rollCooldown,
                    level: r.level,
                  }
                : { phase: "menu" };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);
  const start = () => {
    setShowcase(false);
    setPanel("");
    engine.current?.start(agentId);
  };
  const openPanel = (name: string) => {
    engine.current?.pause();
    if (name === "records") setRecords(localRanking.list());
    setPanel(name);
  };
  const back = () => {
    setShowcase(false);
    engine.current?.closePreview();
    engine.current?.quit();
    setRun(null);
    setPanel("");
  };
  const playing = run && ["playing", "paused"].includes(run.phase);
  const stage = STAGES[Math.min(2, Math.floor(((run?.wave || 1) - 1) / 3))];
  return (
    <main
      className={`game-shell ${run ? "in-run" : ""}`}
      style={
        { "--accent": active.color, "--primary": active.color } as CSSProperties
      }
    >
      <div ref={host} className="world" />
      {!run && !showcase && <div className="world-shade" />}
      {showcase && (
        <section className="operator-showcase">
          <div className="showcase-title">
            <small>CLASS / LIVE MOTION</small>
            <h1>{selected.call}</h1>
            <p>
              {selected.name} · {selected.role}
            </p>
          </div>
          <div className="showcase-controls">
            <small>
              {COMBAT_CLASSES[agentId as keyof typeof COMBAT_CLASSES].passive} ·
              충전:{" "}
              {SPECIAL_ATTACKS[agentId as keyof typeof SPECIAL_ATTACKS].name}
            </small>
            <small>
              {MOTION_PROFILES[agentId as keyof typeof MOTION_PROFILES].name} ·
              이동 방향을 유지하는 사격
            </small>
            <div>
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  aria-pressed={agentId === agent.id}
                  onClick={() => {
                    setAgent(agent.id);
                    engine.current?.previewOperator(agent.id);
                  }}
                >
                  {agent.call}
                </button>
              ))}
            </div>
            <div>
              {[
                ["idle", "조준 자세"],
                ["run", "달리기"],
                ["attack", "제자리 공격"],
                ["shoot", "이동 사격"],
                ["strafe", "옆걸음 사격"],
              ].map(([motion, label]) => (
                <button
                  key={motion}
                  onClick={() => {
                    if (engine.current) engine.current.previewMotion = motion;
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <div aria-label="레벨별 발사 효과 시연">
              {[1, 5, 9].map((level) => (
                <button
                  key={level}
                  onClick={() => {
                    if (engine.current) {
                      engine.current.previewLevel = level;
                      engine.current.previewMotion = "shoot";
                    }
                  }}
                >
                  Lv.{level} 발사 효과
                </button>
              ))}
            </div>
            <Button onClick={start}>이 요원으로 출격</Button>
            <Button variant="outline" onClick={back}>
              로비로 돌아가기
            </Button>
          </div>
        </section>
      )}
      <header className="topbar">
        <a
          href="./"
          className="brand"
          aria-label="DEAD SIGNAL 홈"
          onClick={(e) => {
            e.preventDefault();
            if (!run) back();
            else openPanel("exit");
          }}
        >
          <span className="brand-symbol">
            <Crosshair size={24} />
          </span>
          <span>
            DEAD<span className="brand-light">SIGNAL</span>
            <small>TACTICAL SURVIVAL</small>
          </span>
        </a>
        <div className="top-context">
          <span className="live-dot" />
          {run ? "LIVE OPERATION" : "OPERATIONS TERMINAL"}
          <span className="top-divider" /> SEOUL, SECTOR 07
        </div>
        <div className="top-actions">
          <button
            className="quality-button"
            onClick={() => {
              const next = quality === "fast" ? "high" : "fast";
              setQuality(next);
              engine.current?.setQuality(next);
            }}
            aria-label="그래픽 품질 전환"
          >
            {quality === "fast" ? "빠른 화면" : "정밀 그림자"}
          </button>
          <button
            className="icon-button"
            aria-label={muted ? "사운드 켜기" : "사운드 끄기"}
            onClick={() => {
              setMuted(!muted);
              if (engine.current) engine.current.muted = !muted;
            }}
          >
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <button
            className="icon-button"
            aria-label="조작 안내"
            onClick={() => openPanel("help")}
          >
            <Keyboard size={19} />
          </button>
          <span className="version">BUILD 16.0</span>
        </div>
      </header>
      {!run && !showcase && (
        <button
          className="model-preview-button"
          disabled={!ready}
          onClick={() => {
            engine.current?.previewOperator(agentId);
            setShowcase(true);
          }}
        >
          실제 3D 요원 · 액션 미리보기 ↗
        </button>
      )}
      {!run && !showcase && (
        <section className="lobby">
          <section className="fighter-feature" aria-label="선택한 요원 상세">
            <FighterArt id={selected.id}/>
            <div className="fighter-feature-copy">
              <p className="feature-kicker">DEAD SIGNAL / SURVIVORS</p>
              <span className="feature-role">{selected.role} · {selected.name}</span>
              <h1>{selected.call}</h1>
              <p className="feature-story">{selected.story}</p>
              <div className="feature-traits"><span>{selected.weapon}</span><span>Ctrl · {MOBILITY[selected.id as keyof typeof MOBILITY].name}</span></div>
            </div>
            <span className="feature-index">{selected.number}<small> / 09</small></span>
          </section>
          <div className="lobby-heading">
            <div>
              <p className="eyebrow">
                <span /> OPERATION : DEAD SIGNAL
              </p>
              <h1>
                신호가 끊긴 도시.
                <br />
                <span>살아남을 준비는 됐나.</span>
              </h1>
              <p className="intro">
                요원을 선택하고 격리 구역에 진입하세요.
                <br />
                끝없이 진화하는 감염자들, 생존은 당신의 선택에 달렸습니다.
              </p>
            </div>
            <div className="mission-stamp">
              <Radio size={21} />
              <span>마지막 수신 신호</span>
              <strong>
                37.5665° N<br />
                126.9780° E
              </strong>
              <small>서울 · 격리 14일 차</small>
            </div>
          </div>
          <div className="selection-label">
            <span>
              <b>01</b> 요원 선택 <small>SELECT YOUR OPERATOR</small>
            </span>
            <span>{AGENTS.length} CLASSES AVAILABLE</span>
          </div>
          <div className="lobby-grid">
            <div className="operators">
              {AGENTS.map((agent, index) => (
                <button
                  key={agent.id}
                  className={`operator ${agentId === agent.id ? "selected" : ""}`}
                  style={
                    {
                      "--agent-color": agent.color,
                      "--portrait-pos": `${((index % 4) * 100) / 3}%`,
                    } as CSSProperties
                  }
                  onClick={() => setAgent(agent.id)}
                  aria-pressed={agentId === agent.id}
                  aria-label={`${agent.name} ${agent.call} ${agent.role} 선택`}
                >
                  <div className="painted-portrait">
                    <img src={portraits[agent.id]} alt={`${agent.name} ${agent.weapon} 반실사 캐릭터 일러스트`}
                      style={{transform:`translate(${-((index % 3) * 100) / 3}%, ${-(Math.floor(index / 3) * 100) / 3}%)`}} />
                  </div>
                  <span className="class-glyph">
                    {
                      COMBAT_CLASSES[agent.id as keyof typeof COMBAT_CLASSES]
                        .icon
                    }
                  </span>
                  <div className="portrait-shade" />
                  <span className="operator-number">
                    {agent.number} / {agent.gender === "여성" ? "F" : "M"}
                  </span>
                  <span className="selection-mark">
                    {agentId === agent.id ? "선택됨" : "선택"}{" "}
                    <ArrowUpRight size={14} />
                  </span>
                  <div className="operator-copy">
                    <span className="role">{agent.role}</span>
                    <h2>{agent.call}</h2>
                    <span className="korean-name">{agent.name}</span>
                    <div className="operator-rule" />
                    <p>{agent.trait}</p>
                  </div>
                </button>
              ))}
            </div>
            <aside className="briefing">
              <div className="briefing-top">
                <span className="eyebrow">MISSION BRIEFING</span>
                <span className="tag">PVE</span>
              </div>
              <span className="mission-index">
                SECTOR <b>01</b> / 03
              </span>
              <h2>격리 구역</h2>
              <p className="briefing-sub">QUARANTINE BLOCK</p>
              <div className="map-preview">
                <div className="map-grid" />
                <ScanLine className="map-cross" size={50} />
                <span className="map-label">BLOCK 07</span>
                <span className="map-node one" />
                <span className="map-node two" />
              </div>
              <div className="mission-row">
                <span>위협 등급</span>
                <span className="threat">
                  <i />
                  <i />
                  <i />
                  <i className="off" />
                  <i className="off" /> 높음
                </span>
              </div>
              <div className="mission-row">
                <span>작전 목표</span>
                <strong>9 웨이브 생존 · 보스 처치</strong>
              </div>
              <div className="mission-row">
                <span>플레이 방식</span>
                <strong>항공 뷰 · 360° 조준</strong>
              </div>
              <p className="mission-tip">
                <Radio size={15} /> 적을 처치하고, 전투 중 장비를 강화하세요.
              </p>
            </aside>
          </div>
          <div className="loadout-bar">
            <div className="loadout-agent">
              <span className="agent-emblem">
                <Crosshair size={26} />
              </span>
              <div>
                <small>선택한 요원</small>
                <strong>
                  {selected.call}
                  <span>
                    {selected.name} · {selected.role}
                  </span>
                </strong>
              </div>
            </div>
            <div className="loadout-stats">
              {(
                [
                  [Target, "공격력", selected.damage],
                  [Shield, "방어력", selected.armor],
                  [Crosshair, "사거리", `${selected.range}m`],
                  [Heart, "체력", selected.hp],
                ] as [LucideIcon, string, string | number][]
              ).map(([Icon, label, value]) => (
                <div key={label}>
                  <span>
                    <Icon size={14} />
                    {label}
                  </span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <button className="inspect-button" disabled={!ready} onClick={()=>{engine.current?.previewOperator(agentId);setShowcase(true);}}>3D 액션</button>
            <Button
              className="deploy-button"
              disabled={!ready || !!error}
              onClick={start}
            >
              <span>
                {error
                  ? "실행 환경 확인 필요"
                  : ready
                    ? "작전 시작"
                    : "장비 준비 중"}
              </span>
              <ArrowUpRight size={23} />
            </Button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <footer className="lobby-footer">
            <span>
              <span className="live-dot" /> 시스템 정상 <b>•</b> 로컬 기록 저장
            </span>
            <button onClick={() => openPanel("help")}>
              <Keyboard size={16} /> 조작 가이드 <ChevronRight size={14} />
            </button>
            <button onClick={() => openPanel("records")}>
              <Trophy size={16} /> 내 생존 기록 <ChevronRight size={14} />
            </button>
          </footer>
        </section>
      )}
      {playing && (
        <>
          <div className="combat-top">
            <div className="sector-info">
              <span className="eyebrow">
                SECTOR {String(Math.ceil(run.wave / 3)).padStart(2, "0")} / 03
              </span>
              <h2>{stage.name}</h2>
              <p>{stage.code}</p>
            </div>
            <div className="wave-info">
              <span>WAVE</span>
              <strong>
                {String(run.wave).padStart(2, "0")}
                <small> / 09</small>
              </strong>
              <span>
                {run.intermission > 0
                  ? `${Math.ceil(run.intermission)}초 후 다음 웨이브`
                  : `남은 감염자 ${run.remaining}`}
              </span>
            </div>
            <div className="score-info">
              <span>
                SCORE <b>{run.score.toLocaleString()}</b>
              </span>
              <span>
                {time(run.seconds)}{" "}
                <button
                  className="icon-button"
                  aria-label="일시정지"
                  onClick={() => engine.current?.pause()}
                >
                  <Pause size={18} />
                </button>
              </span>
            </div>
          </div>
          <div className="compass" aria-hidden="true">
            <span>W</span>
            <i />
            <span>NW</span>
            <i />
            <b>
              {(
                ((Math.round((-run.heading * 180) / Math.PI) % 360) + 360) %
                360
              )
                .toString()
                .padStart(3, "0")}
              °
            </b>
            <i />
            <span>NE</span>
            <i />
            <span>E</span>
          </div>
          <div
            className={`crosshair aerial-hidden ${run.hit ? "hit" : ""} ${run.guard ? "guard" : ""}`}
          >
            <i />
            <i />
            <i />
            <i />
            {run.hit && <b>×</b>}
          </div>
          <div className="combat-notice" aria-live="polite">
            {run.message}
          </div>
          <div className="radar">
            <span>주변 위협</span>
            <svg
              viewBox="0 0 120 120"
              aria-label={`주변 감염자 ${run.remaining}명`}
            >
              <circle cx="60" cy="60" r="54" />
              <circle cx="60" cy="60" r="28" />
              <path d="M60 6V114 M6 60H114" />
              {run.enemies.map((e, i) => (
                <circle
                  key={i}
                  className="radar-enemy"
                  cx={60 + (e.x - run.position.x) * 1.8}
                  cy={60 + (e.z - run.position.z) * 1.8}
                  r={e.type === "boss" ? 4 : 2.4}
                />
              ))}
              <path
                className="radar-player"
                d="M60 54L56 64L60 62L64 64Z"
                transform={`rotate(${(-run.heading * 180) / Math.PI},60,60)`}
              />
            </svg>
            <small>반경 30m · 북쪽 고정</small>
          </div>
          <button
            className="field-upgrade"
            onClick={() => openPanel("upgrade")}
          >
            <Zap size={17} />
            <span>
              현장 강화<small>◈ {run.credits} CR</small>
            </span>
            {key("U")}
          </button>
          <div className="combat-bottom">
            <div className="vitals">
              <FighterArt id={active.id} className="hud-face"/>
              <div className="vitals-title">
                <strong>{active.call}</strong>
                <span>LV. {run.level}</span>
              </div>
              <div className="health-label">
                <Heart size={16} />
                <b>
                  {Math.ceil(run.hp)}
                  <small> / {run.maxHp}</small>
                </b>
                <span>{run.guard ? "방어 중 · 피해 75% 감소" : "HEALTH"}</span>
              </div>
              <Progress
                className="health-bar"
                value={(run.hp / run.maxHp) * 100}
                aria-label="체력"
              />
              <div className="secondary-bars">
                <span>SP</span>
                <Progress value={run.stamina} aria-label="스태미나" />
                <span>XP</span>
                <Progress
                  value={(run.xp / run.xpNext) * 100}
                  aria-label="경험치"
                />
              </div>
              <div className="stat-mini">
                공격 {run.damage} <b>·</b> 방어 {run.armor} <b>·</b> 사거리{" "}
                {run.range}m
              </div>
            </div>
            <div className="ultimate-panel">
              <button
                onClick={() => engine.current?.ultimate()}
                disabled={run.ultimate < 100 || run.ultimateLock > 0}
                aria-label="필살기 사용"
              >
                <span>우클릭 · 필살기</span>
                <strong>
                  {LOADOUTS[run.agent.id as keyof typeof LOADOUTS].title.split(" / ").pop()}
                </strong>
                <b>{Math.floor(run.ultimate / 100)} / 3</b>
              </button>
              <meter
                className="sr-only"
                aria-label="필살기 충전"
                min={0}
                max={300}
                value={run.ultimate}
              />
              <div className="ultimate-cells" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <i key={i}>
                    <em
                      style={{
                        width: `${Math.min(100, Math.max(0, run.ultimate - i * 100))}%`,
                      }}
                    />
                  </i>
                ))}
              </div>
              <small>
                {run.ultimate >= 100 ? "필살기 준비 완료" : "처치와 웨이브 완료로 충전"}
              </small>
            </div>
            <div className="skills">
              {classSkills(run.agent.id, SKILLS).map(
                (skill: (typeof SKILLS)[number], index: number) => (
                  <button
                    key={skill.id}
                    className={`skill ${index === run.selectedSkill ? "active" : ""}`}
                    onClick={() => engine.current?.selectSkill(index)}
                    aria-pressed={index === run.selectedSkill}
                    title={skill.detail}
                    aria-label={`${index + 1} ${skill.name} 선택`}
                  >
                    <kbd>{index + 1}</kbd>
                    <b>
                      {run.cooldowns[index] > 0
                        ? `${Math.ceil(run.cooldowns[index])}s`
                        : skill.icon}
                    </b>
                    <span>{skill.name}</span>
                  </button>
                ),
              )}
              <span className="skill-help">
                {key("SPACE")} 사용 {key("F")} 전환
              </span>
            </div>
            <div className="ammo">
              <small>{active.weapon}</small>
              <div>
                <strong>
                  {run.reload > 0 ? "··" : String(run.ammo).padStart(2, "0")}
                </strong>
                <span>/ {run.magazine}</span>
              </div>
              <span>
                {run.reload > 0 ? (
                  "재장전 중…"
                ) : (
                  <>
                    {key("R")} 재장전 · Ctrl {MOBILITY[active.id as keyof typeof MOBILITY].name}{" "}
                    {run.rollCooldown > 0
                      ? `${run.rollCooldown.toFixed(1)}s`
                      : "준비"}{" "}
                  </>
                )}
              </span>
            </div>
          </div>
          <div className="key-strip">
            <span>{key("W A S D")} 이동</span>
            <span>{key("마우스")} 조준</span>
            <span>{key("좌클릭")} 공격</span>
            <span>{key("우클릭")} 필살기</span>
            <span>{key("SHIFT")} 달리기</span>
            <span>이동과 조준은 독립적입니다</span>
          </div>
          {run.damageFlash && <div className="damage-vignette" />}
          {run.charging && (
            <output className="charge-display">
              <strong>
                {
                  SPECIAL_ATTACKS[active.id as keyof typeof SPECIAL_ATTACKS]
                    .name
                }
              </strong>
              <progress
                max={CHARGE_SECONDS}
                value={run.charge}
                aria-label="특수 공격 충전"
              />
              <small>
                {run.specialCooldown > 0
                  ? `재사용 ${run.specialCooldown.toFixed(1)}초`
                  : run.ammo < 2
                    ? "탄약 2발 필요"
                    : run.charge >= CHARGE_SECONDS
                      ? "충전 완료 · 좌클릭을 놓아 발사"
                      : "좌클릭 유지 · 충전 중"}
              </small>
            </output>
          )}
          {run.ultimateFx > 0 && <div key={`field-${run.ultimateSequence}`} aria-hidden="true" className={`ultimate-field field-${active.id}`}><i/><i/><i/></div>}
          {run.ultimateFx > 0 && (
            <output
              key={run.ultimateSequence}
              className={`ultimate-cinematic cinematic-${active.id}`}
            >
              <span className="ultimate-emblem">
                {COMBAT_CLASSES[active.id as keyof typeof COMBAT_CLASSES].icon}
              </span>
              <div>
                <small>{active.call} / ULTIMATE</small>
                <strong>
                  {LOADOUTS[active.id as keyof typeof LOADOUTS].title}
                </strong>
                <p>
                  {
                    SPECIAL_ATTACKS[active.id as keyof typeof SPECIAL_ATTACKS]
                      .caption
                  }
                </p>
              </div>
            </output>
          )}
          {run.skillFlash && <div className="skill-vignette" />}
        </>
      )}
      {run?.phase === "paused" && !panel && (
        <section className="pause-screen">
          <div className="pause-card">
            <Pause size={30} />
            <p className="eyebrow">SIGNAL ON HOLD</p>
            <h2>숨을 고르세요.</h2>
            <p>작전이 일시정지되었습니다.</p>
            <Button
              className="deploy-button"
              onClick={() => engine.current?.resume()}
            >
              <Play size={18} /> 작전 계속
            </Button>
            <Button variant="outline" onClick={() => openPanel("upgrade")}>
              장비 강화 · {run.credits} CR
            </Button>
            <Button variant="ghost" onClick={() => openPanel("exit")}>
              요원 선택으로
            </Button>
          </div>
        </section>
      )}
      {run && ["dead", "won"].includes(run.phase) && (
        <section className="result-screen">
          <div className="result-card">
            <span className="eyebrow">
              {run.phase === "won" ? "EXTRACTION COMPLETE" : "SIGNAL LOST"}
            </span>
            <h1>{run.phase === "won" ? "탈출 성공." : "신호가 끊겼습니다."}</h1>
            <p>
              {run.phase === "won"
                ? "도시의 마지막 생존 신호를 되찾았습니다."
                : "당신의 다음 작전은 여기서부터 시작됩니다."}
            </p>
            <div className="result-score">
              <small>FINAL SCORE</small>
              <strong>{run.score.toLocaleString()}</strong>
            </div>
            <div className="result-stats">
              <span>
                생존 시간<b>{time(run.seconds)}</b>
              </span>
              <span>
                도달 웨이브<b>{run.wave} / 9</b>
              </span>
              <span>
                감염자 처치<b>{run.kills}</b>
              </span>
              <span>
                요원 레벨<b>{run.level}</b>
              </span>
            </div>
            <p className="save-status">
              {run.storageSaved === false
                ? "저장 공간 문제로 기록을 저장하지 못했습니다."
                : "이 기기에 생존 기록이 저장되었습니다."}
            </p>
            <Button className="deploy-button" onClick={start}>
              <RotateCcw size={18} /> 다시 도전
            </Button>
            <Button variant="outline" onClick={back}>
              요원 선택으로
            </Button>
          </div>
        </section>
      )}
      <Dialog
        open={!!panel}
        onOpenChange={(open) => {
          if (!open) setPanel("");
        }}
      >
        <DialogContent
          className={`game-dialog ${panel === "upgrade" ? "upgrade-dialog" : ""}`}
        >
          <DialogTitle>
            {panel === "help"
              ? "작전 조작 가이드"
              : panel === "records"
                ? "내 생존 기록"
                : panel === "upgrade"
                  ? "현장 장비 강화"
                  : panel === "quit"
                    ? "작전을 종료할까요?"
                    : ""}
          </DialogTitle>
          <DialogDescription>
            {panel === "help"
              ? "WASD로 이동하고 마우스로 독립적으로 조준합니다."
              : panel === "records"
                ? "최근 20회 원정의 점수순 기록입니다. 이 브라우저에만 저장됩니다."
                : panel === "upgrade"
                  ? `현재 보유 ${run?.credits || 0} CR · Z / X / C로 전투 중 즉시 강화 가능 · 이 창에서는 일시정지됩니다.`
                  : panel === "quit"
                    ? "진행 중인 원정은 저장되지 않습니다."
                    : ""}
          </DialogDescription>
          {panel === "help" && (
            <>
              <div className="help-grid">
                {[
                  ["W A S D / 방향키", "전후·좌우 이동 · 대각선 가능"],
                  ["마우스 이동", "커서 방향으로 360° 조준"],
                  ["마우스 왼쪽", "공격 · 길게 누르면 연사"],
                  ["마우스 오른쪽", "요원 고유 필살기 · 최대 3회 충전"],
                  ["Q 유지", "방어 · 피해 75% 감소"],
                  ["Space", "선택한 특수 공격 사용"],
                  ["F / 1·2·3", "특수 공격 순환 / 직접 선택"],
                  ["R", "재장전 · 예비 탄약 무제한"],
                  ["Shift", "달리기 · 스태미나 소모"],
                  [
                    "좌클릭 유지 → 놓기",
                    "0.8초 충전 · 특수 공격 · 추가 탄약2 · 재사용2.5초",
                  ],
                  ["Ctrl + 이동키", "직업별 특수 이동 · 무사는 조준 방향 돌진"],
                  ["U", "장비 강화 창"],
                  ["Z / X / C", "전투 중 공격 / 방어 / 사거리 강화"],
                  ["Esc", "일시정지 / 계속"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <kbd>{k}</kbd>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
              <p className="help-note">
                WASD로 이동하면서 적 위에 커서를 놓고 좌클릭하세요. 미니맵의
                빨간 점이 적입니다. 대각선 이동 속도는 직선과 같습니다. 회복
                기술은 2 → Space. PC 키보드와 가로 화면에 최적화되어 있습니다.
              </p>
              <Button
                className="deploy-button"
                onClick={() => {
                  setPanel("");
                  if (run?.phase === "paused") engine.current?.resume();
                }}
              >
                확인 · {run ? "작전 계속" : "요원 선택"}
              </Button>
            </>
          )}
          {panel === "records" && (
            <div className="records">
              {records.length ? (
                records.map((r, i) => (
                  <div key={r.id}>
                    <b>{String(i + 1).padStart(2, "0")}</b>
                    <span>
                      {r.agent}
                      <small>
                        WAVE {r.wave} · {r.kills} 처치 · {time(r.seconds)}
                      </small>
                    </span>
                    <strong>{r.score.toLocaleString()}</strong>
                  </div>
                ))
              ) : (
                <div className="empty-records">
                  <Trophy size={36} />
                  <h3>첫 생존 기록을 남겨보세요.</h3>
                  <p>원정 종료 후 점수가 여기에 표시됩니다.</p>
                </div>
              )}
              <p className="help-note">
                온라인 글로벌 랭킹은 추후 제공 예정입니다.
              </p>
            </div>
          )}
          {panel === "upgrade" && run && (
            <>
              <div className="upgrade-list">
                {UPGRADES.map((u) => (
                  <div className="upgrade-item" key={u.id}>
                    <span className="upgrade-icon">{u.icon}</span>
                    <div>
                      <h3>
                        {u.name}
                        <small>
                          LV.{" "}
                          {run.upgrades[u.id as "damage" | "armor" | "range"]} /
                          8
                        </small>
                      </h3>
                      <p>{u.description}</p>
                      <span>
                        현재 {u.stat}{" "}
                        {run[u.id as "damage" | "armor" | "range"]}
                        {u.id === "range" ? "m" : ""}
                      </span>
                    </div>
                    <Button
                      disabled={
                        run.credits < upgradeCost(run, u.id) ||
                        run.upgrades[u.id as "damage" | "armor" | "range"] >= 8
                      }
                      onClick={() => engine.current?.upgrade(u.id)}
                    >
                      {run.upgrades[u.id as "damage" | "armor" | "range"] >= 8
                        ? "최대 강화"
                        : `${upgradeCost(run, u.id)} CR`}
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                className="deploy-button"
                onClick={() => {
                  setPanel("");
                  engine.current?.resume();
                }}
              >
                <Play size={18} /> 전투 복귀
              </Button>
            </>
          )}
          {panel === "exit" && (
            <>
              <Button className="deploy-button" onClick={back}>
                원정 종료 · 요원 선택
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setPanel("");
                  engine.current?.resume();
                }}
              >
                작전 계속
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
