import { createFileRoute } from "@tanstack/react-router";
import { GameProvider, useGame } from "@/game/store";
import { Particles } from "@/components/feud/Shared";
import { Landing } from "@/components/feud/Landing";
import { TeamSetup } from "@/components/feud/TeamSetup";
import { CategorySelect } from "@/components/feud/CategorySelect";
import { FeudGame } from "@/components/feud/FeudGame";
import { FinalScoreboard, RoundSummary } from "@/components/feud/Results";
import { GameMaster } from "@/components/feud/GameMaster";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "The Anime Feud — Let the Final Feud Begin" },
      { name: "description", content: "A live anime quiz battle: two teams, ten feuds, one final winner." },
      { property: "og:title", content: "The Anime Feud — Let the Final Feud Begin" },
      { property: "og:description", content: "A live anime quiz battle: two teams, ten feuds, one final winner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Stage() {
  const { state } = useGame();
  const screens = {
    landing: <Landing />,
    setup: <TeamSetup />,
    select: <CategorySelect />,
    game: <FeudGame />,
    summary: <RoundSummary />,
    final: <FinalScoreboard />,
  };
  return (
    <div key={state.stage === "game" ? `game-${state.roundIdx}` : state.stage} className="relative z-10 animate-fade-in">
      {screens[state.stage]}
    </div>
  );
}

function Index() {
  return (
    <GameProvider>
      <main className="relative min-h-screen overflow-x-hidden">
        <Particles />
        <Stage />
        <GameMaster />
      </main>
    </GameProvider>
  );
}
