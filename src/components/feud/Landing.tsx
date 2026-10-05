import { useGame } from "@/game/store";
import { Logo } from "./Shared";

export function Landing() {
  const { dispatch } = useGame();
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <div className="relative mb-10">
        <div className="animate-halo absolute inset-[-18%] rounded-full bg-primary/30 blur-3xl" />
        <Logo className="animate-logo-in relative h-52 w-52 drop-shadow-[0_0_40px_var(--primary)] sm:h-72 sm:w-72" />
      </div>
      <h1 className="animate-rise text-glow text-6xl leading-none sm:text-8xl lg:text-9xl" style={{ animationDelay: ".4s" }}>
        THE ANIME <span className="text-primary">FEUD</span>
      </h1>
      <p className="animate-rise mt-5 text-xl font-semibold italic tracking-wide text-muted-foreground sm:text-2xl" style={{ animationDelay: ".6s" }}>
        “Let the Final Feud Begin”
      </p>
      <div className="animate-rise mt-12" style={{ animationDelay: ".8s" }}>
        <button className="btn-feud text-2xl" onClick={() => dispatch({ type: "go", stage: "setup" })}>
          START THE FEUD
        </button>
      </div>
      <p className="animate-rise mt-8 text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground" style={{ animationDelay: "1s" }}>
        An Anime Quiz • A Battle of Wits • One Final Winner
      </p>
    </section>
  );
}
