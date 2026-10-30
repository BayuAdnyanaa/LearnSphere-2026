// Star map geometry and state, from docs/design/handoff/README.md (direction 2a).
// Positions are in the 1440 x 900 design frame.

export const FRAME = { w: 1440, h: 900 };

export const TRACKS = {
  icp: { key: "icp", name: "Internet Computer", figure: "Testudo", hue: 55, ids: [1, 3, 5, 12], nameAt: [48, 286], nameColor: "#fbf3ea", trackColor: "#d9cfc4", centre: [220, 520] },
  ai: { key: "ai", name: "AI Agents", figure: "Corvus", hue: 300, ids: [2, 4, 6], nameAt: [420, 246], nameColor: "#f1ebff", trackColor: "#d4cce6", centre: [580, 520] },
  web3: { key: "web3", name: "Web3", figure: "Phoenix", hue: 350, ids: [7, 8, 9, 10, 11], nameAt: [815, 150], nameColor: "#ffeef6", trackColor: "#e4cfdb", centre: [905, 470], centred: true,
    // Phones crop the sky below y 215, so the name moves beside the right wing
    phoneNameAt: [1052, 250] },
};

// Path order: the suggested next quest is the first open quest in this order
export const PATH_ORDER = [1, 3, 5, 12, 2, 4, 6, 7, 8, 9, 10, 11];

export const TRACK_OF = Object.fromEntries(
  Object.values(TRACKS).flatMap((t) => t.ids.map((id) => [id, t.key]))
);

// Quest star centre and label side: b = below, t = above, r = right
export const STAR_AT = {
  1: [220, 640, "b"], 3: [220, 540, "b"], 5: [220, 440, "b"], 12: [226, 350, "r"],
  2: [500, 640, "r"], 4: [580, 540, "b"], 6: [650, 430, "b"],
  7: [905, 330, "t"], 8: [905, 470, "b"], 9: [820, 630, "l"], 10: [905, 672, "b"], 11: [990, 630, "b"],
};

// Prerequisite lines (from, to)
export const EDGES = [[1, 3], [3, 5], [5, 12], [2, 4], [4, 6], [7, 8], [8, 9], [8, 10], [8, 11]];

// Dotted animal outlines: guide stars and segments (numbers are quest stars)
export const FIGURES = {
  icp: {
    pts: { a: [140, 622], b: [112, 540], c: [140, 458], d: [300, 458], e: [328, 540], f: [300, 622], t: [198, 700], fl1: [78, 408], fr1: [362, 408], fl2: [92, 668], fr2: [348, 668], h: [240, 316] },
    segs: [[5, "c"], ["c", "b"], ["b", "a"], ["a", 1], [1, "f"], ["f", "e"], ["e", "d"], ["d", 5], ["c", "fl1"], ["d", "fr1"], ["a", "fl2"], ["f", "fr2"], [1, "t"], [12, "h"]],
  },
  ai: {
    pts: { tl1: [446, 688], tl2: [480, 706], w1a: [546, 452], w1b: [504, 350], w2a: [600, 458], w2b: [596, 342], bk: [704, 414] },
    segs: [[2, "tl1"], [2, "tl2"], ["tl1", "tl2"], [4, "w1a"], ["w1a", "w1b"], [4, "w2a"], ["w2a", "w2b"], ["w1b", "w2b"], [6, "bk"]],
  },
  web3: {
    pts: { ch: [905, 400], lw1: [830, 380], lw2: [775, 300], lw3: [792, 240], rw1: [980, 380], rw2: [1035, 300], rw3: [1018, 240], bk: [934, 322], p9: [768, 660], p11: [1042, 660] },
    segs: [["ch", "lw1"], ["lw1", "lw2"], ["lw2", "lw3"], ["ch", "rw1"], ["rw1", "rw2"], ["rw2", "rw3"], ["lw1", "lw3"], ["rw1", "rw3"], [7, "bk"], [9, "p9"], [11, "p11"]],
  },
};

export const STATE_TEXT = {
  done: "completed",
  next: "open, suggested next step",
  open: "open",
  cd: "in cooldown",
  locked: "locked",
};

// Seconds as m:ss, or h:mm:ss for the 24 h step
// Total XP needed to reach a level. The level curve is a product decision: change it only here.
export function xpForLevel(level) {
  return (level - 1) * 100;
}

// The learner's level from total XP, with the XP gained in it and the XP the level spans
export function levelFromXp(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const start = xpForLevel(level);
  return { level, into: xp - start, span: xpForLevel(level + 1) - start };
}

export function clock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/**
 * Builds everything the map needs from the canister data.
 * quests: from getAllQuestsWithStatus (status "completed" | "available" | "locked")
 * cooldowns: { [questId]: secondsLeft } from getCooldowns, ticking down
 * stats: { tokens, experience } from getUserStats
 */
export function buildModel(quests, cooldowns, stats) {
  const byId = Object.fromEntries(quests.map((q) => [q.id, q]));

  const baseState = (id) => {
    const q = byId[id];
    if (!q) return "locked";
    if (q.status === "completed") return "done";
    if (q.status === "available") return (cooldowns[id] ?? 0) > 0 ? "cd" : "open";
    return "locked";
  };

  const nextId = PATH_ORDER.find((id) => baseState(id) === "open") ?? null;
  const stateOf = (id) => (id === nextId ? "next" : baseState(id));

  const stars = PATH_ORDER.filter((id) => byId[id]).map((id) => {
    const q = byId[id];
    const [x, y, side] = STAR_AT[id];
    const state = stateOf(id);
    const pre = (q.prerequisite ?? [])[0];
    const preId = pre === undefined ? null : Number(pre);
    return {
      id,
      quest: q,
      x, y, side,
      state,
      track: TRACK_OF[id],
      wait: cooldowns[id] ?? 0,
      prereq: preId ? byId[preId] ?? null : null,
    };
  });
  const starById = Object.fromEntries(stars.map((s) => [s.id, s]));

  const lines = EDGES.filter(([a, b]) => starById[a] && starById[b]).map(([a, b]) => {
    const sa = starById[a].state, sb = starById[b].state;
    const kind = sa === "done" && sb === "done" ? "lit" : sa === "done" && sb !== "locked" ? "reach" : "dim";
    return { a: starById[a], b: starById[b], kind };
  });

  const tracks = Object.values(TRACKS).map((t) => {
    const done = t.ids.filter((id) => starById[id]?.state === "done").length;
    const p = done / t.ids.length;
    const full = done === t.ids.length;
    return {
      ...t,
      done,
      total: t.ids.length,
      p,
      full,
      progressText: full ? "Complete" : `${done} of ${t.ids.length} stars lit`,
      lineAlpha: full ? 0.95 : 0.34 + 0.4 * p,
      artOpacity: full ? 0.9 : 0.14 + 0.5 * p,
      nebulaAlpha: full ? 0.42 : 0.06 + 0.22 * p,
    };
  });

  const tokens = Number(stats?.tokens ?? 0);
  const xp = Number(stats?.experience ?? 0);
  const { level, into, span } = levelFromXp(xp);
  const lit = stars.filter((s) => s.state === "done").length;

  return {
    stars,
    starById,
    lines,
    tracks,
    lit,
    total: stars.length,
    allDone: stars.length > 0 && lit === stars.length,
    tokens,
    xp,
    level,
    xpInLevel: into,
    xpSpan: span,
    orbGlow: Math.min(1, 0.25 + level / 40),
    next: nextId ? starById[nextId] : null,
  };
}
