import type { Feud } from "./data";

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/×/g, "x")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\b(the|a|an)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function lev(a: string, b: string) {
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]!;
      dp[j] = Math.min(dp[j]! + 1, dp[j - 1]! + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length]!;
}

function candidates(answer: string, aliases: string[]) {
  const out = new Set<string>();
  const add = (s: string) => {
    const n = normalize(s);
    if (n) out.add(n);
  };
  add(answer);
  aliases.forEach(add);
  const head = answer.split("—")[0] ?? answer;
  add(head);
  head.split("/").forEach(add);
  // "Goku vs Vegeta" -> also "Vegeta vs Goku", "Goku and Vegeta"
  const vs = head.split(/\s+vs\.?\s+/i);
  if (vs.length === 2) {
    const [v0 = "", v1 = ""] = vs;
    add(`${v1} vs ${v0}`);
    add(`${v0} ${v1}`);
    add(`${v1} ${v0}`);
    add(`${v0} and ${v1}`);
  }
  return [...out];
}

function similar(input: string, cand: string) {
  if (input === cand) return true;
  if (input.replace(/ /g, "") === cand.replace(/ /g, "")) return true;
  if (cand.length >= 5 && input.length >= 5) {
    const tol = cand.length >= 10 ? 2 : 1;
    if (lev(input, cand) <= tol) return true;
  }
  return false;
}

/** Returns the index of the matched answer, or -1. */
export function matchAnswer(feud: Feud, raw: string): number {
  const input = normalize(raw);
  if (!input) return -1;
  for (let i = 0; i < feud.answers.length; i++) {
    const a = feud.answers[i];
    if (candidates(a.answer, a.aliases).some((c) => similar(input, c))) return i;
  }
  return -1;
}

export function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
