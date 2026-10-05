import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { GAME_CONFIG } from "@/game/config";
import type { Answer } from "@/game/data";
import { currentFeud, isRoundOver, teamLabel, useGame, type Reveal, type Team } from "@/game/store";
import { cn } from "@/lib/utils";
import { CountUp, Logo, pad } from "./Shared";

function GameHeader() {
  const { state } = useGame();
  const lead = state.scores[0] === state.scores[1] ? null : state.scores[0] > state.scores[1] ? 0 : 1;
  const side = (t: Team) => (
    <div className={cn("min-w-0", t === 1 && "text-right")}>
      <p className={cn("font-display text-xs tracking-[0.3em] sm:text-sm", t === 0 ? "text-team-a" : "text-team-b")}>
        {t === 0 ? "TEAM 01" : "TEAM 02"} {lead === t && "• LEADING"}
      </p>
      <p className="truncate font-display text-lg uppercase sm:text-2xl">{teamLabel(state, t)}</p>
      <CountUp value={state.scores[t]} className={cn("font-display text-4xl leading-none sm:text-6xl", t === 0 ? "text-team-a" : "text-team-b")} />
    </div>
  );
  return (
    <header className="glass grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 py-3 sm:gap-6 sm:px-8">
      {side(0)}
      <div className="flex flex-col items-center text-center">
        <Logo className="h-10 w-10 sm:h-14 sm:w-14" />
        <p className="font-display text-sm tracking-widest sm:text-xl">THE ANIME FEUD</p>
        <p className="text-xs font-bold tracking-[0.25em] text-muted-foreground sm:text-sm">
          ROUND {pad(state.roundIdx + 1)} / {pad(state.order.length)}
        </p>
      </div>
      {side(1)}
    </header>
  );
}

function AnswerCard({ answer, reveal, fresh }: { answer: Answer; reveal?: Reveal | undefined; fresh: boolean }) {
  const { state } = useGame();
  const [main, sub] = answer.answer.split(" — ");
  return (
    <div className="[perspective:800px]">
      {reveal ? (
        <div
          className={cn(
            "clip-blade flex h-16 items-center gap-3 px-5 sm:h-20",
            fresh && "animate-flip",
            reveal.team === 0 && "bg-team-a/25 glow-team-a",
            reveal.team === 1 && "bg-team-b/20 glow-team-b",
            reveal.team === null && "bg-secondary",
          )}
        >
          <span className="font-display text-2xl text-muted-foreground">{pad(answer.rank)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg uppercase leading-tight sm:text-2xl">{main}</p>
            {sub && <p className="truncate text-xs font-semibold text-muted-foreground sm:text-sm">{sub}</p>}
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-xl sm:text-2xl">{reveal.team === null ? answer.points : `+${reveal.points}`}</p>
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground">
              {reveal.team === null ? "UNCLAIMED" : teamLabel(state, reveal.team).toUpperCase()}
            </p>
          </div>
        </div>
      ) : (
        <div className="clip-blade flex h-16 items-center gap-4 border border-primary/30 bg-gradient-to-r from-primary/25 to-card px-5 sm:h-20">
          <span className="grid h-10 w-14 place-items-center bg-primary font-display text-2xl text-primary-foreground sm:h-12">
            {pad(answer.rank)}
          </span>
          <span className="font-display text-xl tracking-[0.4em] text-muted-foreground/40">??????</span>
        </div>
      )}
    </div>
  );
}

function StrikeCounter({ strikes, team }: { strikes: number; team: Team }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold tracking-widest text-muted-foreground">STRIKES</span>
      {Array.from({ length: GAME_CONFIG.maxStrikes }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "grid h-8 w-8 place-items-center rounded-full border-2",
            i < strikes ? "animate-strike border-destructive bg-destructive/20 text-destructive" : "border-border",
            team === 1 && i >= strikes && "border-border",
          )}
        >
          {i < strikes && <X className="h-5 w-5" strokeWidth={4} />}
        </span>
      ))}
    </div>
  );
}

function TeamPanel({ team }: { team: Team }) {
  const { state, dispatch } = useGame();
  const [text, setText] = useState("");
  const [shake, setShake] = useState(0);
  const ref = useRef<HTMLInputElement>(null);
  const strikes = state.round.strikes[team];
  const out = strikes >= GAME_CONFIG.maxStrikes;
  const over = isRoundOver(state);
  const ev = state.round.events[team];

  useEffect(() => {
    if (ev && (ev.kind === "wrong" || ev.kind === "out")) setShake(ev.key);
  }, [ev]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    dispatch({ type: "submit", team, text });
    setText("");
    ref.current?.focus();
  };
  const disabled = out || over || state.paused;
  const color = team === 0 ? "text-team-a" : "text-team-b";

  return (
    <div className="relative flex-1">
    <div
      key={shake}
      className={cn(
        "glass clip-notch relative h-full p-5 sm:p-6",
        shake && "animate-shake",
        team === 0 ? "border-l-4 border-l-team-a" : "border-r-4 border-r-team-b",
        out && "opacity-60",
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <p className={cn("font-display text-xs tracking-[0.3em]", color)}>{team === 0 ? "TEAM 01" : "TEAM 02"}</p>
          <p className="truncate font-display text-2xl uppercase">{teamLabel(state, team)}</p>
        </div>
        <StrikeCounter strikes={strikes} team={team} />
      </div>
      <form onSubmit={submit} className="mt-4 flex gap-2">
        <input
          ref={ref}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          placeholder={out ? "THREE STRIKES — LOCKED OUT" : state.paused ? "PAUSED" : "Enter answer…"}
          className="min-w-0 flex-1 border border-input bg-background/60 px-4 py-3 text-xl font-semibold outline-none transition-colors focus:border-primary disabled:cursor-not-allowed"
        />
        <button
          disabled={disabled}
          className={cn(
            "clip-blade px-6 font-display tracking-widest transition disabled:opacity-30",
            team === 0 ? "bg-team-a text-primary-foreground" : "bg-team-b text-accent-foreground",
          )}
        >
          SUBMIT
        </button>
      </form>
    </div>
      <div className="pointer-events-none absolute inset-x-0 -top-10 z-10 flex justify-center">
        {ev && (
          <div key={ev.key} className="animate-pop text-center">
            {ev.kind === "correct" ? (
              <div className={cn("glass clip-blade px-5 py-2", team === 0 ? "glow-team-a" : "glow-team-b")}>
                <p className={cn("font-display text-3xl", color)}>+{ev.points} POINTS</p>
                <p className="text-xs font-bold tracking-[0.3em]">“{ev.text}”</p>
              </div>
            ) : (
              <div className="glass clip-blade px-5 py-2">
                <p className={cn("font-display text-2xl", ev.kind === "dup" ? "text-muted-foreground" : "text-destructive")}>
                  {ev.kind === "dup" ? "" : "✕ "}
                  {ev.text}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function FeudGame() {
  const { state, dispatch } = useGame();
  const feud = currentFeud(state);
  const over = isRoundOver(state);
  const [bigX, setBigX] = useState(0);
  const lastKeys = useRef<string>("");

  useEffect(() => {
    const evs = state.round.events.filter((e) => e && (e.kind === "wrong" || e.kind === "out"));
    const k = evs.map((e) => e!.key).join(",");
    if (k && k !== lastKeys.current) setBigX(Math.max(...evs.map((e) => e!.key)));
    lastKeys.current = k;
  }, [state.round.events]);

  if (!feud) return null;
  const left = feud.answers.slice(0, 5);
  const right = feud.answers.slice(5);
  const col = (list: Answer[], offset: number) => (
    <div className="flex flex-col gap-3">
      {list.map((a, i) => (
        <AnswerCard key={a.rank} answer={a} reveal={state.round.revealed[i + offset]} fresh={state.round.lastRevealed === i + offset} />
      ))}
    </div>
  );

  return (
    <section className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-5 px-3 py-4 sm:px-6">
      <GameHeader />
      <div key={feud.id} className="animate-rise text-center">
        <p className="font-display text-sm tracking-[0.4em] text-primary">ROUND {pad(state.roundIdx + 1)}</p>
        <h2 className="text-glow text-3xl leading-tight sm:text-5xl">{feud.category}</h2>
        <p className="mt-1 text-lg italic text-muted-foreground">“{feud.prompt}”</p>
        <p className="text-xs font-bold tracking-[0.3em] text-muted-foreground">{feud.answers.length} ANSWERS</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 md:gap-5">
        {col(left, 0)}
        {col(right, 5)}
      </div>
      {over ? (
        <div className="animate-rise glass clip-notch flex flex-col items-center gap-3 py-6">
          <p className="text-glow font-display text-4xl">ROUND COMPLETE</p>
          <button className="btn-feud" onClick={() => dispatch({ type: "endRound" })}>
            SEE RESULTS
          </button>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-10 md:flex-row md:gap-6">
          <TeamPanel team={0} />
          <TeamPanel team={1} />
        </div>
      )}
      {state.paused && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-background/70 backdrop-blur-sm">
          <p className="text-glow font-display text-7xl tracking-widest">PAUSED</p>
        </div>
      )}
      {bigX > 0 && (
        <div key={bigX} aria-hidden className="pointer-events-none fixed inset-0 z-30 grid place-items-center">
          <X className="animate-big-x h-64 w-64 text-destructive drop-shadow-[0_0_40px_var(--destructive)]" strokeWidth={3} />
        </div>
      )}
    </section>
  );
}
