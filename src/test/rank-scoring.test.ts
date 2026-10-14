import { describe, expect, it, vi } from "vitest";
import { pointsForRank } from "@/game/config";
import { ALL_FEUDS, FEUDS, TIEBREAKER } from "@/game/data";
import { initialState, reducer, type GameState } from "@/game/store";

vi.mock("@/game/sfx", () => ({ setMuted: vi.fn(), sfx: { correct: vi.fn(), wrong: vi.fn(), strikeOut: vi.fn() } }));

const start = () => reducer(initialState, { type: "setTeams", teams: ["Akatsuki", "Shinigami"] });
const nextRound = (state: GameState) => reducer(reducer(state, { type: "endRound" }), { type: "nextRound" });

describe("fixed rank points", () => {
  it.each([[1, 100], [2, 90], [3, 80], [4, 70], [5, 60], [6, 50], [7, 40], [8, 30], [9, 20], [10, 10]])(
    "rank %i awards %i points", (rank, points) => expect(pointsForRank(rank)).toBe(points),
  );

  it("each consecutive rank decreases by exactly ten", () => {
    for (let rank = 1; rank < 10; rank++) expect(pointsForRank(rank) - pointsForRank(rank + 1)).toBe(10);
  });

  it.each(ALL_FEUDS)("uses original ranks regardless of guess order on board $id", (feud) => {
    let state: GameState = { ...start(), order: ALL_FEUDS.map((f) => f.id), roundIdx: feud.id - 1 };
    for (let index = feud.answers.length - 1; index >= 0; index--) {
      const answer = feud.answers[index];
      if (!answer) throw new Error("Missing ranked answer");
      const team = index % 2 === 0 ? 0 : 1;
      const before = state.scores;
      state = reducer(state, { type: "submit", team, text: answer.answer });
      const points = 110 - 10 * answer.rank;
      expect(state.scores[team]).toBe(before[team] + points);
      expect(state.scores[team === 0 ? 1 : 0]).toBe(before[team === 0 ? 1 : 0]);
      expect(state.round.revealed[index]?.points).toBe(points);
      expect(state.round.events[team]?.points).toBe(points);
      expect(answer.points).toBe(points);
    }
    expect(state.round.roundPts).toEqual(feud.tiebreaker ? [280, 240] : [300, 250]);
  });

  it("the tie-breaker has the eight specified point values", () => {
    expect(TIEBREAKER.answers.map((answer) => answer.points)).toEqual([100, 90, 80, 70, 60, 50, 40, 30]);
  });

  it("duplicate answers and aliases cannot award points to either team again", () => {
    const scored = reducer(start(), { type: "submit", team: 1, text: "Demon Slayer" });
    for (const team of [0, 1] as const) {
      const duplicate = reducer(scored, { type: "submit", team, text: "KNY" });
      expect(duplicate.scores).toEqual([0, 100]);
      expect(duplicate.round.roundPts).toEqual([0, 100]);
      expect(duplicate.round.validCount).toBe(1);
      expect(duplicate.round.revealed[0]?.team).toBe(1);
    }
  });

  it("manual reveal and repeated reveal preserve scores and never award unclaimed points", () => {
    let state = reducer(start(), { type: "submit", team: 0, text: "Solo Leveling" });
    state = reducer(state, { type: "submit", team: 1, text: "JJK" });
    state = reducer(state, { type: "revealAnswers" });
    expect(state.scores).toEqual([10, 90]);
    expect(state.round.roundPts).toEqual([10, 90]);
    expect(state.round.revealed[0]).toEqual({ team: null, points: 100, label: "UNCLAIMED" });
    expect(reducer(state, { type: "revealAnswers" })).toBe(state);
    expect(reducer(state, { type: "submit", team: 0, text: "Demon Slayer" }).scores).toEqual([10, 90]);
  });

  it("preserves existing earned totals and gives subsequent answers their full rank points", () => {
    const saved = reducer(start(), { type: "submit", team: 0, text: "Demon Slayer" });
    const restored = reducer(initialState, { type: "load", state: { ...saved, scores: [175, 60] } });
    const scored = reducer(restored, { type: "submit", team: 1, text: "JJK" });
    expect(scored.scores).toEqual([175, 150]);
    expect(scored.round.revealed[0]).toEqual(saved.round.revealed[0]);
  });

  it("accumulates both teams' scores through six rounds and ends without an unnecessary tie-breaker", () => {
    let state = start();
    FEUDS.forEach((feud, index) => {
      const first = feud.answers[0];
      const second = feud.answers[1];
      if (!first || !second) throw new Error("Missing ranked answers");
      state = reducer(state, { type: "submit", team: 0, text: first.answer });
      state = reducer(state, { type: "submit", team: 1, text: second.answer });
      state = reducer(state, { type: "revealAnswers" });
      expect(state.scores).toEqual([100 * (index + 1), 90 * (index + 1)]);
      state = nextRound(state);
    });
    expect(state.stage).toBe("final");
    expect(state.ended).toBe(true);
    expect(state.order).toEqual([1, 2, 3, 4, 5, 6]);
    expect(state.scores).toEqual([600, 540]);
  });

  it("includes tie-breaker points in final totals", () => {
    const sixth: GameState = { ...start(), roundIdx: 5, scores: [300, 300] };
    let state = reducer(nextRound(sixth), { type: "startTiebreak" });
    state = reducer(state, { type: "submit", team: 1, text: "Quintessential Quintuplets" });
    state = reducer(state, { type: "submit", team: 0, text: "TPN" });
    state = nextRound(reducer(state, { type: "revealAnswers" }));
    expect(state.stage).toBe("final");
    expect(state.ended).toBe(true);
    expect(state.scores).toEqual([400, 330]);
  });

  it("finishes with equal totals after the tie-breaker rather than adding another round", () => {
    let state = reducer(nextRound({ ...start(), roundIdx: 5, scores: [300, 300] }), { type: "startTiebreak" });
    state = reducer(state, { type: "submit", team: 0, text: "TPN" });
    state = reducer(state, { type: "submit", team: 1, text: "Soul Eater" });
    state = reducer(state, { type: "submit", team: 1, text: "Akame ga Kill" });
    state = nextRound(reducer(state, { type: "revealAnswers" }));
    expect(state.stage).toBe("final");
    expect(state.scores).toEqual([400, 400]);
    expect(state.order).toHaveLength(7);
    expect(reducer(state, { type: "submit", team: 0, text: "AOT" })).toBe(state);
  });

  it("incorrect guesses do not deduct earned points", () => {
    const state = reducer(start(), { type: "submit", team: 0, text: "Demon Slayer" });
    expect(reducer(state, { type: "submit", team: 0, text: "not an answer" }).scores).toEqual([100, 0]);
  });
});