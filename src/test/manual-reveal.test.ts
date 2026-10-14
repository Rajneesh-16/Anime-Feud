import { describe, expect, it, vi } from "vitest";
import { FEUDS, TIEBREAKER } from "@/game/data";
import { currentFeud, initialState, isRoundOver, reducer } from "@/game/store";

vi.mock("@/game/sfx", () => ({ setMuted: vi.fn(), sfx: { correct: vi.fn(), wrong: vi.fn(), strikeOut: vi.fn() } }));

const start = () => reducer(initialState, { type: "setTeams", teams: ["Akatsuki", "Shinigami"] });

describe("Game Master manual reveal", () => {
  it("reveals every hidden answer with its base points without changing scores or round", () => {
    const state = start();
    const next = reducer(state, { type: "revealAnswers" });
    expect(Object.keys(next.round.revealed)).toHaveLength(10);
    FEUDS[0]?.answers.forEach((answer, idx) => {
      expect(next.round.revealed[idx]).toEqual({ team: null, points: answer.points, label: "UNCLAIMED" });
    });
    expect(next.scores).toEqual([0, 0]);
    expect(next.roundIdx).toBe(0);
    expect(next.stage).toBe("game");
    expect(next.ended).toBe(false);
    expect(next.order).toEqual([1, 2, 3, 4, 5, 6]);
    expect(next.teams).toEqual(state.teams);
    expect(isRoundOver(next)).toBe(true);
  });

  it("preserves earned points and claimed answers and makes repeated reveal a no-op", () => {
    const state = reducer(start(), { type: "submit", team: 0, text: "Demon Slayer" });
    const next = reducer(state, { type: "revealAnswers" });
    expect(next.round.revealed[0]).toBe(state.round.revealed[0]);
    expect(next.scores).toEqual([100, 0]);
    expect(next.round.roundPts).toEqual([100, 0]);
    expect(next.round.validCount).toBe(1);
    expect(reducer(next, { type: "revealAnswers" })).toBe(next);
    expect(reducer(next, { type: "submit", team: 1, text: "JJK" })).toBe(next);
  });

  it("reveals only the active standard round and leaves the next board hidden", () => {
    const state = reducer(start(), { type: "nextRound" });
    const next = reducer(state, { type: "revealAnswers" });
    expect(next.roundIdx).toBe(1);
    expect(currentFeud(next)?.id).toBe(2);
    expect(next.round.revealed[0]?.points).toBe(100);
    expect(reducer(next, { type: "nextRound" }).round.revealed).toEqual({});
  });

  it("keeps the seventh round conditional and reveals its eight answers when active", () => {
    const sixth = { ...start(), roundIdx: 5 };
    const tied = reducer(sixth, { type: "nextRound" });
    expect(tied.stage).toBe("tie");
    expect(tied.order).toEqual([1, 2, 3, 4, 5, 6, TIEBREAKER.id]);
    expect(reducer(tied, { type: "revealAnswers" })).toBe(tied);
    const active = reducer(tied, { type: "startTiebreak" });
    const revealed = reducer(active, { type: "revealAnswers" });
    expect(Object.keys(revealed.round.revealed)).toHaveLength(8);
    expect(revealed.roundIdx).toBe(6);
    expect(currentFeud(revealed)?.id).toBe(TIEBREAKER.id);
    expect(revealed.scores).toEqual([0, 0]);
    const unequal = reducer({ ...sixth, scores: [100, 0] }, { type: "nextRound" });
    expect(unequal.stage).toBe("final");
    expect(unequal.order).toHaveLength(6);
  });

  it("ends independently with earned scores and locks reveal, end, and scoring afterward", () => {
    const scored = reducer(start(), { type: "submit", team: 0, text: "Demon Slayer" });
    const final = reducer(scored, { type: "endGame" });
    expect(final.stage).toBe("final");
    expect(final.ended).toBe(true);
    expect(final.scores).toEqual([100, 0]);
    expect(Object.keys(final.round.revealed)).toHaveLength(1);
    expect(reducer(final, { type: "revealAnswers" })).toBe(final);
    expect(reducer(final, { type: "endGame" })).toBe(final);
    expect(reducer(final, { type: "submit", team: 1, text: "JJK" })).toBe(final);
    expect(reducer(final, { type: "adjust", team: 1, delta: 50 })).toBe(final);
    expect(reducer(final, { type: "resetRound" })).toBe(final);
    expect(reducer(final, { type: "nextRound" })).toBe(final);
    expect(reducer(final, { type: "togglePause" })).toBe(final);
  });
});