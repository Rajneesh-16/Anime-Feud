import { useState } from "react";
import { Settings2, Volume2, VolumeX, X } from "lucide-react";
import { teamLabel, useGame, type Team } from "@/game/store";
import { cn } from "@/lib/utils";

export function GameMaster() {
  const { state, dispatch } = useGame();
  const [open, setOpen] = useState(false);
  const inGame = !state.ended && (state.stage === "game" || state.stage === "summary" || state.stage === "tie");

  const btn = "border border-border px-3 py-2 text-sm font-bold tracking-wider transition hover:border-primary hover:bg-primary/15 disabled:opacity-30";

  return (
    <>
      <div className="fixed bottom-3 right-3 z-50 flex gap-2">
        <button aria-label={state.muted ? "Unmute" : "Mute"} onClick={() => dispatch({ type: "toggleMute" })} className="glass grid h-10 w-10 place-items-center text-muted-foreground hover:text-foreground">
          {state.muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
        <button onClick={() => setOpen((o) => !o)} className="glass flex items-center gap-2 px-3 text-xs font-bold tracking-[0.2em] text-muted-foreground hover:text-foreground">
          <Settings2 className="h-4 w-4" /> GAME MASTER
        </button>
      </div>
      {open && (
        <aside className="glass fixed bottom-16 right-3 z-50 max-h-[80vh] w-[min(380px,calc(100vw-1.5rem))] overflow-y-auto p-5 animate-rise">
          <div className="flex items-center justify-between">
            <p className="font-display tracking-[0.2em] text-primary">GAME MASTER</p>
            <button aria-label="Close" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className={btn} disabled={inGame} onClick={() => (state.teams[0] ? dispatch({ type: "setTeams", teams: state.teams }) : dispatch({ type: "go", stage: "setup" }))}>
              Start game
            </button>
            <button className={btn} disabled={state.stage !== "game"} onClick={() => dispatch({ type: "togglePause" })}>
              {state.paused ? "Resume" : "Pause"}
            </button>
            <button className={btn} disabled={!inGame || state.stage === "tie"} onClick={() => dispatch({ type: "nextRound" })}>
              Next round
            </button>
            <button className={btn} disabled={!inGame || state.stage === "tie"} onClick={() => dispatch({ type: "resetRound" })}>
              Reset round
            </button>
            <button
              className={cn(btn, "col-span-2 border-primary text-primary")}
              disabled={!inGame}
              onClick={() => confirm("End the game now and show final scores?") && dispatch({ type: "endGame" })}
            >
              End game
            </button>
            <button
              className={cn(btn, "col-span-2 border-destructive/50 text-destructive")}
              onClick={() => confirm("Reset the entire game?") && dispatch({ type: "resetGame" })}
            >
              Reset entire game
            </button>
          </div>

          {inGame && (
            <>
              <p className="mt-5 text-xs font-bold tracking-[0.25em] text-muted-foreground">ADJUST SCORES</p>
              {([0, 1] as Team[]).map((t) => (
                <div key={t} className="mt-2 flex items-center justify-between gap-2">
                  <span className={cn("min-w-0 truncate font-semibold", t === 0 ? "text-team-a" : "text-team-b")}>
                    {teamLabel(state, t)} · {state.scores[t]}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    {[-50, -10, 10, 50].map((d) => (
                      <button key={d} className="border border-border px-2 py-1 text-xs font-bold hover:border-primary" onClick={() => dispatch({ type: "adjust", team: t, delta: d })}>
                        {d > 0 ? `+${d}` : d}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}

        </aside>
      )}
    </>
  );
}
