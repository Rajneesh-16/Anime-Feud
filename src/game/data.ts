import { GAME_CONFIG } from "./config";

export type Answer = { rank: number; answer: string; points: number; aliases: string[] };
export type Feud = { id: number; round: number; category: string; prompt: string; answers: Answer[]; tiebreaker?: boolean };

type Raw = [string, string[]?];
function build(id: number, category: string, prompt: string, raw: Raw[], tiebreaker = false): Feud {
  return {
    id,
    round: id,
    category,
    prompt,
    tiebreaker,
    answers: raw.map(([answer, aliases = []], i) => ({
      rank: i + 1,
      answer,
      points: GAME_CONFIG.rankPoints[i] ?? 10,
      aliases,
    })),
  };
}

// Source of truth: "Anime Feud Ranked Answer Boards". Listed in rank order (1 → 10).
// Fixed play order — rounds are never chosen, shuffled or skipped.
export const FEUDS: Feud[] = [
  build(1, "MOST OVERRATED ANIME", "Name an anime that people consider overrated.", [
    ["Demon Slayer", ["Kimetsu no Yaiba", "KNY"]],
    ["Jujutsu Kaisen", ["JJK"]],
    ["My Hero Academia", ["MHA", "Boku no Hero Academia", "BNHA"]],
    ["Sword Art Online", ["SAO"]],
    ["Tokyo Ghoul", []],
    ["Boruto", ["Boruto: Naruto Next Generations"]],
    ["The Seven Deadly Sins", ["Seven Deadly Sins", "Nanatsu no Taizai", "7DS"]],
    ["Fairy Tail", []],
    ["Black Clover", []],
    ["Solo Leveling", []],
  ]),
  build(2, "MOST ICONIC ANIME OPENING", "Name an anime with the most iconic opening.", [
    ["Attack on Titan", ["AOT", "Shingeki no Kyojin", "SNK"]],
    ["Tokyo Ghoul", []],
    ["Naruto", ["Naruto Shippuden"]],
    ["Demon Slayer", ["Kimetsu no Yaiba", "KNY"]],
    ["One Piece", []],
    ["Fullmetal Alchemist: Brotherhood", ["FMAB", "FMA", "Fullmetal Alchemist"]],
    ["Pokémon", ["Pokemon"]],
    ["Jujutsu Kaisen", ["JJK"]],
    ["Neon Genesis Evangelion", ["Evangelion", "NGE", "Eva"]],
    ["Dandadan", ["Dan Da Dan"]],
  ]),
  build(3, "MOST-HATED / MOST ANNOYING ANIME CHARACTERS", "Name the most hated or most annoying anime character.", [
    ["Sakura Haruno — Naruto", ["Sakura"]],
    ["Gabi Braun — Attack on Titan", ["Gabi"]],
    ["Akainu — One Piece", ["Sakazuki"]],
    ["Makima — Chainsaw Man", []],
    ["Kazuya Kinoshita — Rent-A-Girlfriend", ["Kazuya"]],
    ["Chi-Chi — Dragon Ball", ["Chichi"]],
    ["Kirito — Sword Art Online", []],
    ["Shinji Ikari — Neon Genesis Evangelion", ["Shinji"]],
    ["Orihime Inoue — Bleach", ["Orihime"]],
    ["Subaru – Re:Zero?", ["Subaru", "Subaru Natsuki"]],
  ]),
  build(4, "MOST FRUSTRATING CHARACTER DEATH", "Name the most frustrating character death.", [
    ["Jiraiya — Naruto: Shippuden", ["Jiraiya"]],
    ["Kyojuro Rengoku — Demon Slayer", ["Rengoku"]],
    ["Portgas D. Ace — One Piece", ["Ace"]],
    ["Satoru Gojo — Jujutsu Kaisen", ["Gojo"]],
    ["Reze chainsaw man", ["Reze"]],
    ["Koro-sensei — Assassination Classroom", ["Korosensei"]],
    ["L – Death Note", ["L", "L Lawliet"]],
    ["Maes Hughes — Fullmetal Alchemist: Brotherhood", ["Hughes"]],
    ["Erwin— Attack on Titan", ["Erwin", "Erwin Smith"]],
    ["Kamina — Gurren Lagann", ["Kamina"]],
  ]),
  build(5, "ANIME CHARACTER WITH THE BIGGEST IQ / SMARTEST", "Name the smartest anime character.", [
    ["L — Death Note", ["L", "L Lawliet", "Ryuzaki"]],
    ["Sosuke Aizen — Bleach", ["Aizen"]],
    ["Johan Liebert — Monster", ["Johan"]],
    ["Kiyotaka Ayanokoji — Classroom of the Elite", ["Ayanokoji", "Ayanokouji"]],
    ["Lelouch Lamperouge — Code Geass", ["Lelouch"]],
    ["Senku Ishigami — Dr. Stone", ["Senku"]],
    ["Shikamaru Nara — Naruto", ["Shikamaru"]],
    ["Kenjaku -jjk", ["Kenjaku"]],
    ["Bulma — Dragon Ball", ["Bulma"]],
    ["Saiki -saiki K", ["Saiki", "Saiki Kusuo"]],
  ]),
  build(6, "BEST ANIME RIVALS", "Name the best rivalry in anime.", [
    ["Naruto vs Sasuke — Naruto", []],
    ["Goku vs Vegeta — Dragon Ball", []],
    ["Light Yagami vs L — Death Note", ["Light vs L"]],
    ["Deku vs Bakugo — My Hero Academia", ["Midoriya vs Bakugo"]],
    ["Gon vs killua— Hunter × Hunter", []],
    ["Asta vs Yuno — Black Clover", []],
    ["Ash vs Gary — Pokémon", []],
    ["Hinata vs Kageyama — Haikyuu!!", []],
    ["Guts And Griffith — Berserk", ["Guts vs Griffith", "Griffith vs Guts"]],
    ["Tetsuya Kuroko vs Taiga Kagami", ["Kuroko vs Kagami"]],
  ]),
];

export const TIEBREAKER: Feud = build(
  7,
  "MOST DISAPPOINTING ANIME ENDING",
  "Tie-breaker! Name the anime with the most disappointing ending.",
  [
    ["The Promised Neverland (anime Season 2)", ["The Promised Neverland", "Promised Neverland", "TPN"]],
    ["Attack on Titan", ["AOT", "Shingeki no Kyojin", "SNK"]],
    ["Neon Genesis Evangelion", ["Evangelion", "NGE", "Eva"]],
    ["Darling in the Franxx", ["DITF"]],
    ["Akame ga Kill!", ["Akame ga Kill"]],
    ["Tokyo Ghoul re", ["Tokyo Ghoul:re", "Tokyo Ghoul"]],
    ["Soul Eater", []],
    ["The Quintessential Quintuplets", ["Quintessential Quintuplets", "Gotoubun no Hanayome"]],
  ],
  true,
);

export const ALL_FEUDS: Feud[] = [...FEUDS, TIEBREAKER];
