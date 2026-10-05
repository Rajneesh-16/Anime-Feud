import { useState } from "react";
import { useGame } from "@/game/store";
import { cn } from "@/lib/utils";

export function TeamSetup() {
  const { state, dispatch } = useGame();
  const [a, setA] = useState(state.teams[0]);
  const [b, setB] = useState(state.teams[1]);

  const card = (label: string, value: string, set: (v: string) => void, ph: string, team: "a" | "b") => (
    <div className={cn("glass clip-notch animate-rise flex-1 p-8 sm:p-10", team === "a" ? "border-t-4 border-t-team-a" : "border-t-4 border-t-team-b")}>
      <p className={cn("font-display text-lg tracking-[0.3em]", team === "a" ? "text-team-a" : "text-team-b")}>{label}</p>
      <input
        value={value}
        maxLength={28}
        onChange={(e) => set(e.target.value)}
        placeholder={ph}
        className="mt-4 w-full border-b-2 border-border bg-transparent py-3 font-display text-3xl uppercase tracking-wide outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary sm:text-4xl"
      />
    </div>
  );

  return (
    <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
      <h1 className="animate-rise text-glow text-center text-5xl sm:text-7xl">CHOOSE YOUR TEAMS</h1>
      <div className="mt-14 flex flex-col items-stretch gap-6 md:flex-row md:items-center">
        {card("TEAM 01", a, setA, "Team Akatsuki", "a")}
        <div className="font-display text-glow text-center text-6xl text-primary">VS</div>
        {card("TEAM 02", b, setB, "Team Shinigami", "b")}
      </div>
      <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
        <button className="btn-ghost-feud" onClick={() => dispatch({ type: "go", stage: "landing" })}>
          BACK
        </button>
        <button
          className="btn-feud"
          onClick={() => dispatch({ type: "setTeams", teams: [a.trim() || "Team Akatsuki", b.trim() || "Team Shinigami"] })}
        >
          ENTER THE FEUD
        </button>
      </div>
    </section>
  );
}
