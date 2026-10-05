import { useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { sfx } from "@/game/sfx";
import { currentFeud, teamLabel, useGame, type Team } from "@/game/store";
import { cn } from "@/lib/utils";
import { Confetti, CountUp, Logo, pad } from "./Shared";

export function RoundSummary() {
  const { state, dispatch } = useGame();
  const feud = currentFeud(state);
  const last = state.roundIdx + 1 >= state.order.length;
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), 300);
    return () => clearTimeout(t);
  }, []);
  const row = (t: Team) => (
    <div className={cn("glass clip-notch flex-1 p-8 text-center", t === 0 ? "border-t-4 border-t-team-a" : "border-t-4 border-t-team-b")}>
      <p className={cn("font-display tracking-[0.3em]", t === 0 ? "text-team-a" : "text-team-b")}>{t === 0 ? "TEAM 01" : "TEAM 02"}</p>
      <p className="truncate font-display text-3xl uppercase">{teamLabel(state, t)}</p>
      <p className={cn("mt-4 font-display text-6xl", t === 0 ? "text-team-a" : "text-team-b")}>
        + <CountUp value={show ? state.round.roundPts[t] : 0} />
      </p>
      <p className="mt-6 text-xs font-bold tracking-[0.3em] text-muted-foreground">TOTAL SCORE</p>
      <CountUp value={show ? state.scores[t] : state.scores[t] - state.round.roundPts[t]} className="font-display text-4xl" />
    </div>
  );
  return (
    <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-6 py-12">
      <div className="animate-rise text-center">
        <p className="font-display tracking-[0.4em] text-primary">ROUND {pad(state.roundIdx + 1)} • {feud?.category}</p>
        <h1 className="text-glow text-6xl sm:text-8xl">ROUND COMPLETE</h1>
      </div>
      <div className="flex w-full flex-col gap-6 md:flex-row">
        {row(0)}
        {row(1)}
      </div>
      <button className="btn-feud" onClick={() => dispatch({ type: "nextRound" })}>
        {last ? "FINAL SCORES" : "NEXT FEUD"}
      </button>
    </section>
  );
}

export function FinalScoreboard() {
  const { state, dispatch } = useGame();
  const [count, setCount] = useState(3);
  useEffect(() => {
    if (count <= 0) {
      sfx.win();
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [count]);
  const revealed = count <= 0;
  const [a, b] = state.scores;
  const winner: Team | null = a === b ? null : a > b ? 0 : 1;

  const col = (t: Team) => (
    <div className={cn("glass clip-notch flex-1 p-8 text-center transition-all duration-700", revealed && winner === t && (t === 0 ? "glow-team-a" : "glow-team-b"))}>
      <p className={cn("font-display tracking-[0.3em]", t === 0 ? "text-team-a" : "text-team-b")}>{t === 0 ? "TEAM 01" : "TEAM 02"}</p>
      <p className="truncate font-display text-3xl uppercase">{teamLabel(state, t)}</p>
      <p className="mt-3 font-display text-7xl">{revealed ? <CountUp value={state.scores[t]} /> : "—"}</p>
      <p className="text-sm font-bold tracking-[0.3em] text-muted-foreground">POINTS</p>
    </div>
  );

  return (
    <section className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 py-12 text-center">
      {revealed && winner !== null && <Confetti />}
      <Logo className="h-24 w-24 animate-logo-in" />
      <h1 className="text-glow text-6xl sm:text-8xl">FINAL SCORES</h1>
      <div className="flex w-full flex-col items-center gap-6 md:flex-row">
        {col(0)}
        <span className="font-display text-5xl text-primary">VS</span>
        {col(1)}
      </div>
      {!revealed ? (
        <p key={count} className="animate-claim font-display text-9xl text-primary text-glow">{count}</p>
      ) : (
        <div className="animate-rise flex flex-col items-center">
          {winner !== null ? (
            <>
              <Trophy className="h-16 w-16 text-accent" />
              <p className="font-display text-2xl tracking-[0.4em] text-accent">WINNER</p>
              <p className="animate-winner font-display text-6xl uppercase sm:text-8xl">{teamLabel(state, winner)}</p>
              <p className="mt-2 text-xl italic text-muted-foreground">“THE ULTIMATE ANIME FEUD CHAMPIONS”</p>
              <p className="mt-4 text-base text-muted-foreground">
                Respect to <span className="font-bold text-foreground">{teamLabel(state, winner === 0 ? 1 : 0)}</span> — a hard-fought feud to the very end.
              </p>
            </>
          ) : (
            <>
              <p className="animate-winner font-display text-7xl">IT'S A DRAW</p>
              <p className="mt-2 text-xl italic text-muted-foreground">Two legends. One unfinished feud.</p>
            </>
          )}
        </div>
      )}
      {revealed && (
        <div className="flex flex-wrap justify-center gap-4">
          <button className="btn-feud" onClick={() => dispatch({ type: "setTeams", teams: state.teams })}>
            PLAY AGAIN
          </button>
          <button className="btn-ghost-feud" onClick={() => dispatch({ type: "resetGame" })}>
            RETURN HOME
          </button>
        </div>
      )}
    </section>
  );
}
