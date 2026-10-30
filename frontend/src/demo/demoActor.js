// The browser-only stand-in for the backend canister, used only by the demo build
// (`npm run build:demo`). It answers like the Candid actor (BigInt numbers, [] or [x] for opt,
// variants as { tag: value }) and keeps the same rules: prerequisites, all answers right, and
// the growing waits after a failed try. Progress stays in this browser's localStorage.
import data from "./demoData.generated.json";

const KEY = "learnsphere-demo-v1";
const COOLDOWN_STEPS_SECONDS = [60, 300, 1800, 86400];
const PATH_ORDER = [1, 3, 5, 12, 2, 4, 6, 7, 8, 9, 10, 11];

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.completed)) return saved;
  } catch {
    // Private windows can refuse storage; the demo then forgets on reload
  }
  return { tokens: 0, experience: 0, completed: [], attempts: {} };
}

function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // See load()
  }
}

const cooldownSeconds = (fails) => COOLDOWN_STEPS_SECONDS[Math.min(Math.max(fails, 1), COOLDOWN_STEPS_SECONDS.length) - 1];

function secondsUntilRetry(state, id) {
  const a = state.attempts[id];
  if (!a) return 0;
  return Math.max(0, Math.ceil((a.lastFailAt + cooldownSeconds(a.fails) * 1000 - Date.now()) / 1000));
}

const candidQuest = (q) => ({
  id: BigInt(q.id),
  title: q.title,
  description: q.description,
  link: q.link,
  rewardAmount: BigInt(q.rewardAmount),
  prerequisite: q.prerequisite === null ? [] : [BigInt(q.prerequisite)],
  category: q.category,
});

const isOpen = (state, q) => !state.completed.includes(q.id) && (q.prerequisite === null || state.completed.includes(q.prerequisite));

// A short pause, so the UI shows its loading states as it does with a real canister
const pause = () => new Promise((r) => setTimeout(r, 250));

export function hasDemoSession() {
  try {
    return localStorage.getItem(`${KEY}-session`) === "1";
  } catch {
    return false;
  }
}

export function setDemoSession(on) {
  try {
    if (on) localStorage.setItem(`${KEY}-session`, "1");
    else localStorage.removeItem(`${KEY}-session`);
  } catch {
    // See load()
  }
}

export function resetDemo() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // See load()
  }
}

export const demoActor = {
  async greet(name) {
    return `Hello, ${name}! LearnSphere demo mode is working!`;
  },

  async getUserStats() {
    const s = load();
    return { tokens: BigInt(s.tokens), experience: BigInt(s.experience), questsCompleted: s.completed.map(BigInt) };
  },

  async getAllQuestsWithStatus() {
    const s = load();
    return data.quests.map((q) => [candidQuest(q), s.completed.includes(q.id) ? "completed" : isOpen(s, q) ? "available" : "locked"]);
  },

  async getCooldowns() {
    const s = load();
    return data.quests.map((q) => [BigInt(q.id), BigInt(secondsUntilRetry(s, q.id))]).filter(([, left]) => left > 0n);
  },

  async getQuiz(questId) {
    const quiz = data.quizzes[Number(questId)];
    if (!quiz) return [];
    return [{ questId: BigInt(questId), questions: quiz.map(({ text, options }) => ({ text, options })) }];
  },

  async submitQuiz(questId, answers) {
    await pause();
    const id = Number(questId);
    const s = load();
    const quest = data.quests.find((q) => q.id === id);
    const quiz = data.quizzes[id];
    if (!quest) return { rejected: { reason: "Quest not found." } };
    if (s.completed.includes(id)) return { rejected: { reason: "Quest already completed." } };
    if (!isOpen(s, quest)) return { rejected: { reason: "Complete the previous quest first." } };
    if (!quiz) return { rejected: { reason: "This quest has no quiz yet." } };
    if (answers.length !== quiz.length) return { rejected: { reason: "Answer every question." } };
    const wait = secondsUntilRetry(s, id);
    if (wait > 0) return { wait: { retryAfterSeconds: BigInt(wait) } };

    if (!quiz.every((q, i) => Number(answers[i]) === q.answer)) {
      const fails = (s.attempts[id]?.fails ?? 0) + 1;
      s.attempts[id] = { fails, lastFailAt: Date.now() };
      save(s);
      return { failed: { retryAfterSeconds: BigInt(cooldownSeconds(fails)) } };
    }
    delete s.attempts[id];
    s.tokens += quest.rewardAmount;
    s.experience += quest.rewardAmount * 2;
    s.completed.push(id);
    save(s);
    return { passed: { tokensEarned: BigInt(quest.rewardAmount), experienceEarned: BigInt(quest.rewardAmount * 2) } };
  },

  // No model runs in the demo; say so, and point to the reading page of the next quest
  async askTutor() {
    await pause();
    const s = load();
    const next = PATH_ORDER.map((id) => data.quests.find((q) => q.id === id)).find((q) => isOpen(s, q));
    const hint = next ? ` Your next quest is "${next.title}". Its reading page: ${next.link}` : " Every star is lit.";
    return { ok: { text: `Demo mode: the AI tutor answers only in the full version on the Internet Computer.${hint}` } };
  },
};
