import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import { GAME_CONFIG, pointsForRank } from "./config";
import { ALL_FEUDS, FEUDS, TIEBREAKER, type Feud } from "./data";
import { matchAnswer } from "./logic";
import { setMuted, sfx } from "./sfx";

export type Team = 0 | 1;
export type Stage = "landing" | "setup" | "game" | "tie" | "summary" | "final";
export type Reveal = { team: Team | null; points: number; label: string };
export type TeamEvent = { kind: "correct" | "wrong" | "dup" | "out"; text: string; points?: number; key: number };

export type RoundState = {
  revealed: Record<number, Reveal>;
  strikes: [number, number];
  validCount: number;
  roundPts: [number, number];
  events: [TeamEvent | null, TeamEvent | null];
  lastRevealed: number | null;
};

export type GameState = {
  stage: Stage;
  teams: [string, string];
  scores: [number, number];
  order: number[];
  roundIdx: number;
  round: RoundState;
  paused: boolean;
  muted: boolean;
  /** Set once the game is finalized (normal finish or GM "End Game"). Locks scoring. */
  ended: boolean;
};

const freshRound = (): RoundState => ({
  revealed: {},
  strikes: [0, 0],
  validCount: 0,
  roundPts: [0, 0],
  events: [null, null],
  lastRevealed: null,
});

export const initialState: GameState = {
  stage: "landing",
  teams: ["", ""],
  scores: [0, 0],
  order: [],
  roundIdx: 0,
  round: freshRound(),
  paused: false,
  muted: false,
  ended: false,
};

type Action =
  | { type: "go"; stage: Stage }
  | { type: "setTeams"; teams: [string, string] }
  | { type: "endGame" }
  | { type: "revealAnswers" }
  | { type: "startTiebreak" }
  | { type: "submit"; team: Team; text: string }
  | { type: "endRound" }
  | { type: "nextRound" }
  | { type: "resetRound" }
  | { type: "resetGame" }
  | { type: "adjust"; team: Team; delta: number }
  | { type: "togglePause" }
  | { type: "toggleMute" }
  | { type: "load"; state: GameState };

export const activeFeuds = (s: GameState) => s.order.map((id) => ALL_FEUDS.find((f) => f.id === id)!);
export const currentFeud = (s: GameState): Feud | undefined => activeFeuds(s)[s.roundIdx];
export const totalRounds = () => FEUDS.length;
export const isTiebreaker = (s: GameState) => !!currentFeud(s)?.tiebreaker;
export const isRoundOver = (s: GameState) => {
  const f = currentFeud(s);
  if (!f) return false;
  const all = Object.keys(s.round.revealed).length >= f.answers.length;
  const max = GAME_CONFIG.maxStrikes;
  return all || (s.round.strikes[0] >= max && s.round.strikes[1] >= max);
};

let evKey = 0;

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case "load":
      return a.state;
    case "go":
      return { ...s, stage: a.stage };
    case "setTeams":
      return {
        ...initialState,
        muted: s.muted,
        teams: a.teams,
        order: FEUDS.map((f) => f.id),
        stage: "game",
      };
    case "endGame":
      if (s.ended) return s;
      return { ...s, ended: true, paused: false, stage: "final" };
    case "revealAnswers": {
      const f = currentFeud(s);
      if (s.ended || s.stage !== "game" || !f) return s;
      const hidden = f.answers.map((answer, idx) => ({ answer, idx })).filter(({ idx }) => !s.round.revealed[idx]);
      if (hidden.length === 0) return s;
      const revealed = { ...s.round.revealed };
      for (const { answer, idx } of hidden) {
        revealed[idx] = { team: null, points: pointsForRank(answer.rank), label: "UNCLAIMED" };
      }
      return { ...s, round: { ...s.round, revealed, lastRevealed: null } };
    }
    case "submit": {
      const f = currentFeud(s);
      if (!f || s.ended || s.paused || isRoundOver(s)) return s;
      const r = s.round;
      if (r.strikes[a.team] >= GAME_CONFIG.maxStrikes) return s;
      const idx = matchAnswer(f, a.text);
      const events = [...r.events] as RoundState["events"];
      if (idx >= 0 && r.revealed[idx]) {
        events[a.team] = { kind: "dup", text: "ALREADY ON THE BOARD", key: ++evKey };
        return { ...s, round: { ...r, events } };
      }
      if (idx < 0) {
        const strikes = [...r.strikes] as [number, number];
        strikes[a.team]++;
        const out = strikes[a.team] >= GAME_CONFIG.maxStrikes;
        events[a.team] = { kind: out ? "out" : "wrong", text: out ? "THREE STRIKES" : "WRONG ANSWER", key: ++evKey };
        if (out) sfx.strikeOut();
        else sfx.wrong();
        return { ...s, round: { ...r, strikes, events } };
      }
      const answer = f.answers[idx];
      if (!answer) return s;
      const pts = pointsForRank(answer.rank);
      const label = "CORRECT ANSWER";
      const roundPts = [...r.roundPts] as [number, number];
      roundPts[a.team] += pts;
      const scores = [...s.scores] as [number, number];
      scores[a.team] += pts;
      events[a.team] = { kind: "correct", text: label, points: pts, key: ++evKey };
      sfx.correct();
      return {
        ...s,
        scores,
        round: {
          ...r,
          revealed: { ...r.revealed, [idx]: { team: a.team, points: pts, label } },
          validCount: r.validCount + 1,
          roundPts,
          events,
          lastRevealed: idx,
        },
      };
    }
    case "endRound":
      if (s.ended) return s;
      return { ...s, stage: "summary" };
    case "nextRound": {
      if (s.ended || s.stage === "tie") return s;
      if (s.roundIdx + 1 >= s.order.length) {
        const tiebreakPlayed = s.order.includes(TIEBREAKER.id);
        if (!tiebreakPlayed && s.scores[0] === s.scores[1]) {
          return { ...s, order: [...s.order, TIEBREAKER.id], stage: "tie", paused: false };
        }
        return { ...s, ended: true, stage: "final" };
      }
      return { ...s, roundIdx: s.roundIdx + 1, round: freshRound(), stage: "game", paused: false };
    }
    case "startTiebreak":
      if (s.stage !== "tie") return s;
      return { ...s, roundIdx: s.order.length - 1, round: freshRound(), stage: "game", paused: false };
    case "resetRound": {
      if (s.ended) return s;
      const scores: [number, number] = [s.scores[0] - s.round.roundPts[0], s.scores[1] - s.round.roundPts[1]];
      return { ...s, scores, round: freshRound(), stage: "game" };
    }
    case "resetGame":
      return { ...initialState, muted: s.muted };
    case "adjust": {
      if (s.ended) return s;
      const scores = [...s.scores] as [number, number];
      scores[a.team] = Math.max(0, scores[a.team] + a.delta);
      return { ...s, scores };
    }
    case "togglePause":
      if (s.ended) return s;
      return { ...s, paused: !s.paused };
    case "toggleMute":
      return { ...s, muted: !s.muted };
  }
}

const KEY = "anime-feud-state-v2";
const Ctx = createContext<{ state: GameState; dispatch: (a: Action) => void } | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) dispatch({ type: "load", state: { ...initialState, ...JSON.parse(raw) } });
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    setMuted(state.muted);
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useGame outside provider");
  return c;
}

export const teamLabel = (s: GameState, t: Team) => s.teams[t] || (t === 0 ? "TEAM 01" : "TEAM 02");
