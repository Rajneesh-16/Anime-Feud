// Configurable game rules. Change values here to tune the game.
export const GAME_CONFIG = {
  activeRounds: 10,
  picksPerTeam: 3,
  maxStrikes: 3,
};

/** Fixed points from the original board rank, never the guess/reveal order. */
export function pointsForRank(rank: number): number {
  return 110 - 10 * rank;
}
