// Configurable game rules. Change values here to tune the game.
export const GAME_CONFIG = {
  activeRounds: 10,
  picksPerTeam: 3,
  maxStrikes: 3,
  /** Base points by rank (index 0 = rank 1). */
  rankPoints: [100, 90, 80, 70, 60, 50, 40, 30, 20, 10],
  /** Multiplier by order of valid answers within a round. Last value repeats. */
  precedenceMultipliers: [1, 0.75, 0.6, 0.5],
  precedenceLabels: ["FIRST STRIKE", "SECOND PRECEDENCE", "THIRD PRECEDENCE", "LATE PRECEDENCE"],
};

export function precedenceMultiplier(order: number) {
  const m = GAME_CONFIG.precedenceMultipliers;
  return m[Math.min(order, m.length - 1)];
}
export function precedenceLabel(order: number) {
  const l = GAME_CONFIG.precedenceLabels;
  return l[Math.min(order, l.length - 1)];
}
