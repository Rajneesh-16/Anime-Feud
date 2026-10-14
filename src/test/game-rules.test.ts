import { describe, expect, it } from "vitest";
import { FEUDS, TIEBREAKER } from "@/game/data";

describe("round rules", () => {
  it("has six fixed rounds in document order", () => {
    expect(FEUDS.map((f) => f.category)).toEqual([
      "MOST OVERRATED ANIME",
      "MOST ICONIC ANIME OPENING",
      "MOST-HATED / MOST ANNOYING ANIME CHARACTERS",
      "MOST FRUSTRATING CHARACTER DEATH",
      "ANIME CHARACTER WITH THE BIGGEST IQ / SMARTEST",
      "BEST ANIME RIVALS",
    ]);
  });
  it("each standard round has 10 answers", () => {
    FEUDS.forEach((f) => expect(f.answers).toHaveLength(10));
  });
  it("round 1 rank 10 is Solo Leveling", () => {
    expect(FEUDS[0]!.answers[9]!.answer).toBe("Solo Leveling");
  });
  it("tie-breaker has 8 answers", () => {
    expect(TIEBREAKER.answers).toHaveLength(8);
  });
});
