import { GAME_CONFIG } from "@/game/config";
import { FEUDS } from "@/game/data";
import { sfx } from "@/game/sfx";
import { pickingTeam, teamLabel, useGame, type Team } from "@/game/store";
import { cn } from "@/lib/utils";
import { pad } from "./Shared";

export function CategorySelect() {
  const { state, dispatch } = useGame();
  const turn = pickingTeam(state);
  const count = (t: Team) => Object.values(state.claims).filter((v) => v === t).length;
  const max = GAME_CONFIG.picksPerTeam;

  const status = (t: Team) => (
    <div className={cn("glass clip-blade px-6 py-3 transition-all", turn === t && (t === 0 ? "glow-team-a" : "glow-team-b"))}>
      <p className={cn("font-display text-sm tracking-[0.25em]", t === 0 ? "text-team-a" : "text-team-b")}>{t === 0 ? "TEAM 01" : "TEAM 02"}</p>
      <p className="truncate font-display text-xl uppercase">{teamLabel(state, t)}</p>
      <p className="text-sm font-semibold text-muted-foreground">
        Selected: <span className="text-foreground">{count(t)} / {max}</span>
      </p>
    </div>
  );

  return (
    <section className="relative mx-auto min-h-screen max-w-7xl px-6 py-12">
      <h1 className="text-glow text-center text-5xl sm:text-7xl">CHOOSE YOUR BATTLEGROUND</h1>
      <div className="mt-8 grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        {status(0)}
        <p
          key={turn ?? "done"}
          className={cn(
            "animate-rise text-center font-display text-2xl tracking-wider",
            turn === 0 ? "text-team-a" : turn === 1 ? "text-team-b" : "text-foreground",
          )}
        >
          {turn === null ? "ALL FEUDS CLAIMED" : `${turn === 0 ? "TEAM 01" : "TEAM 02"} — CHOOSE YOUR ${max} FEUDS`}
        </p>
        {status(1)}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {FEUDS.map((f, i) => {
          const claim = state.claims[f.id];
          const claimed = claim !== undefined;
          const disabled = !claimed && turn === null;
          return (
            <button
              key={f.id}
              disabled={disabled}
              onClick={() => {
                if (claimed) dispatch({ type: "unclaim", id: f.id });
                else {
                  sfx.select();
                  dispatch({ type: "claim", id: f.id });
                }
              }}
              title={claimed ? "Click to release this pick" : undefined}
              className={cn(
                "glass clip-notch group relative flex min-h-48 flex-col justify-between p-5 text-left transition-all duration-300",
                !claimed && !disabled && "hover:-translate-y-1 hover:glow-primary",
                claim === 0 && "animate-claim glow-team-a bg-team-a/15",
                claim === 1 && "animate-claim glow-team-b bg-team-b/10",
                disabled && "opacity-40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-display text-4xl text-primary/80">{pad(i + 1)}</span>
                <span className="text-xs font-bold tracking-widest text-muted-foreground">{f.answers.length} ANSWERS</span>
              </div>
              <h3 className="mt-3 text-xl leading-tight">{f.category}</h3>
              {claimed && (
                <span
                  className={cn(
                    "clip-blade mt-3 self-start px-3 py-1 font-display text-xs tracking-widest",
                    claim === 0 ? "bg-team-a text-primary-foreground" : "bg-team-b text-accent-foreground",
                  )}
                >
                  CLAIMED BY {claim === 0 ? "TEAM 01" : "TEAM 02"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Unclaimed feuds are drawn automatically to complete {Math.min(GAME_CONFIG.activeRounds, FEUDS.length)} rounds.
      </p>
      <div className="mt-8 flex justify-center">
        <button className="btn-feud" disabled={turn !== null} onClick={() => dispatch({ type: "begin" })}>
          BEGIN THE FEUD
        </button>
      </div>
    </section>
  );
}
