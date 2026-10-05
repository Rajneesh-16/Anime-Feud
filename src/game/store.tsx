import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import { GAME_CONFIG, precedenceLabel, precedenceMultiplier } from "./config";
import { FEUDS, type Feud } from "./data";
import { matchAnswer, shuffle } from "./logic";
import { setMuted, sfx } from "./sfx";

export type Team = 0 | 1;
export type Stage = "landing" | "setup" | "select" | "game" | "summary" | "final";
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
  claims: Record<number, Team>;
  order: number[];
  roundIdx: number;
  round: RoundState;
  paused: boolean;
  muted: boolean;
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
  claims: {},
  order: [],
  roundIdx: 0,
  round: freshRound(),
  paused: false,
  muted: false,
};

type Action =
  | { type: "go"; stage: Stage }
  | { type: "setTeams"; teams: [string, string] }
  | { type: "claim"; id: number }
  | { type: "unclaim"; id: number }
  | { type: "begin" }
  | { type: "submit"; team: Team; text: string }
  | { type: "gmReveal"; idx: number }
  | { type: "endRound" }
  | { type: "nextRound" }
  | { type: "resetRound" }
  | { type: "resetGame" }
  | { type: "adjust"; team: Team; delta: number }
  | { type: "togglePause" }
  | { type: "toggleMute" }
  | { type: "load"; state: GameState };

export const activeFeuds = (s: GameState) => s.order.map((id) => FEUDS.find((f) => f.id === id)!);
export const currentFeud = (s: GameState): Feud | undefined => activeFeuds(s)[s.roundIdx];
export const totalRounds = () => Math.min(GAME_CONFIG.activeRounds, FEUDS.length);
export const pickingTeam = (s: GameState): Team | null => {
  const c = Object.values(s.claims);
  const a = c.filter((t) => t === 0).length;
  const b = c.filter((t) => t === 1).length;
  if (a < GAME_CONFIG.picksPerTeam) return 0;
  if (b < GAME_CONFIG.picksPerTeam) return 1;
  return null;
};
export const isRoundOver = (s: GameState) => {
  const f = currentFeud(s);
  if (!f) return false;
  const all = Object.keys(s.round.revealed).length >= f.answers.length;
  const max = GAME_CONFIG.maxStrikes;
  return all || (s.round.strikes[0] >= max && s.round.strikes[1] >= max);
};

let evKey = 0;

function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case "load":
      return a.state;
    case "go":
      return { ...s, stage: a.stage };
    case "setTeams":
      return { ...s, teams: a.teams, stage: "select", claims: {} };
    case "claim": {
      const t = pickingTeam(s);
      if (t === null || s.claims[a.id] !== undefined) return s;
      return { ...s, claims: { ...s.claims, [a.id]: t } };
    }
    case "unclaim": {
      const claims = { ...s.claims };
      delete claims[a.id];
      return { ...s, claims };
    }
    case "begin": {
      const picks = (t: Team) =>
        Object.entries(s.claims)
          .filter(([, v]) => v === t)
          .map(([k]) => Number(k));
      const A = picks(0);
      const B = picks(1);
      const order: number[] = [];
      for (let i = 0; i < Math.max(A.length, B.length); i++) {
        if (A[i] !== undefined) order.push(A[i]);
        if (B[i] !== undefined) order.push(B[i]);
      }
      const rest = shuffle(FEUDS.map((f) => f.id).filter((id) => !order.includes(id)));
      const full = [...order, ...rest].slice(0, totalRounds());
      return { ...s, order: full, roundIdx: 0, round: freshRound(), scores: [0, 0], stage: "game", paused: false };
    }
    case "submit": {
      const f = currentFeud(s);
      if (!f || s.paused || isRoundOver(s)) return s;
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
      const base = f.answers[idx].points;
      const pts = Math.round(base * precedenceMultiplier(r.validCount));
      const label = precedenceLabel(r.validCount);
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
    case "gmReveal": {
      if (s.round.revealed[a.idx]) return s;
      sfx.reveal();
      return {
        ...s,
        round: { ...s.round, revealed: { ...s.round.revealed, [a.idx]: { team: null, points: 0, label: "REVEALED" } }, lastRevealed: a.idx },
      };
    }
    case "endRound":
      return { ...s, stage: "summary" };
    case "nextRound":
      if (s.roundIdx + 1 >= s.order.length) return { ...s, stage: "final" };
      return { ...s, roundIdx: s.roundIdx + 1, round: freshRound(), stage: "game", paused: false };
    case "resetRound": {
      const scores: [number, number] = [s.scores[0] - s.round.roundPts[0], s.scores[1] - s.round.roundPts[1]];
      return { ...s, scores, round: freshRound(), stage: "game" };
    }
    case "resetGame":
      return { ...initialState, muted: s.muted };
    case "adjust": {
      const scores = [...s.scores] as [number, number];
      scores[a.team] = Math.max(0, scores[a.team] + a.delta);
      return { ...s, scores };
    }
    case "togglePause":
      return { ...s, paused: !s.paused };
    case "toggleMute":
      return { ...s, muted: !s.muted };
  }
}

const KEY = "anime-feud-state-v1";
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
