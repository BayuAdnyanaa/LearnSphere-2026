import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

// ICP and DFINITY imports
import { AuthClient } from "@icp-sdk/auth/client";
import { createActor, canisterId } from "./declarations";

const isLocal = process.env.DFX_NETWORK !== "ic";

// Locally, II runs as its own canister on the replica; on mainnet use the public one (II 2.0)
const identityProvider = isLocal
  ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/authorize`
  : "https://id.ai/authorize";

// On mainnet, II derives each user's principal from this fixed origin, whatever URL the app is
// served from, so progress survives a later custom domain. It must never change after launch:
// a new value gives every user a new, empty principal. Other URLs go in
// public/.well-known/ii-alternative-origins.
const derivationOrigin = isLocal ? undefined : `https://${process.env.CANISTER_ID_LEARNSPHERE_FRONTEND}.icp0.io`;

const newAuthClient = () => new AuthClient({ identityProvider, derivationOrigin });

// In dev, calls go through the Vite /api proxy to the local replica
const agentHost = isLocal ? window.location.origin : "https://icp-api.io";

import SkyCanvas from "./sky/SkyCanvas";
import { useReducedMotion } from "./sky/useAnimationLoop";
import MapScreen from "./map/MapScreen";
import QuestSheet from "./quest/QuestSheet";
import Welcome from "./screens/Welcome";
import TutorOrb from "./tutor/TutorOrb";
import { buildModel } from "./map/questModel";
import { useViewport } from "./useViewport";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [actor, setActor] = useState(null);
  const [, setPrincipal] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [quests, setQuests] = useState([]);
  // The open quest sheet: which star, which step, and which quest pages were opened
  const [selectedId, setSelectedId] = useState(null);
  const [step, setStep] = useState("detail");
  const [linkOpened, setLinkOpened] = useState({});
  const [quiz, setQuiz] = useState(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  // Seconds left before each quest's quiz may be tried again, by quest id
  const [cooldowns, setCooldowns] = useState({});

  const initAuth = async () => {
    try {
      console.log("🔐 Initializing authentication...");
      const authClient = newAuthClient();

      if (authClient.isAuthenticated()) {
        console.log("✅ User already authenticated");
        await handleAuthenticated(authClient);
      } else {
        console.log("ℹ️ User not authenticated");
      }
    } catch (err) {
      console.error("❌ Auth initialization failed:", err);
      setError("Failed to initialize authentication: " + err.message);
    }
    setIsLoading(false);
  };

  const handleAuthenticated = async (authClient) => {
    try {
      console.log("🔗 Handling authentication...");
      const identity = await authClient.getIdentity();
      const userPrincipal = identity.getPrincipal().toString();

      console.log("👤 User Principal:", userPrincipal);

      // Build the actor with the logged-in identity, so each user has their own principal
      const { HttpAgent } = await import("@icp-sdk/core/agent");
      const agent = await HttpAgent.create({
        host: agentHost,
        identity,
        shouldFetchRootKey: isLocal,
      });
      const userActor = createActor(canisterId, { agent });

      setActor(userActor);
      setIsAuthenticated(true);
      setPrincipal(userPrincipal);

      console.log("📊 Loading data from canister...");
      await loadData(userActor);

    } catch (err) {
      console.error("❌ Authentication handling failed:", err);
      setError("Failed to create actor: " + err.message);
    }
  };

  const handleLogin = async () => {
    try {
      console.log("🚀 Starting login process...");
      const authClient = newAuthClient();
      await authClient.signIn();
      console.log("✅ Login successful");
      await handleAuthenticated(authClient);
    } catch (err) {
      console.error("❌ Login failed:", err);
      setError("Login failed: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      const authClient = newAuthClient();
      await authClient.signOut();
      setIsAuthenticated(false);
      setActor(null);
      setPrincipal("");
      setQuests([]);
      setUserStats(null);
      console.log("👋 Logged out successfully");
    } catch (err) {
      console.error("❌ Logout failed:", err);
    }
  };

  // quiet: refresh without the full-page spinner, so an open quiz result stays on screen
  const loadData = async (backendActor, { quiet = false } = {}) => {
    if (!backendActor) {
      console.error("❌ No actor provided to loadData");
      return;
    }

    if (!quiet) setIsLoading(true);
    setError(null);
    
    try {
      console.log("🧪 Testing canister connection...");
      const greetResult = await backendActor.greet("Frontend");
      console.log("✅ Greet result:", greetResult);

      console.log("📊 Fetching user stats...");
      const statsResult = await backendActor.getUserStats();
      console.log("✅ Raw stats result:", statsResult);
      
      const formattedStats = {
        tokens: Number(statsResult.tokens),
        questsCompleted: statsResult.questsCompleted.length,
        experience: Number(statsResult.experience),
        currentLevel: Math.floor(Number(statsResult.experience) / 100) + 1,
      };
      setUserStats(formattedStats);
      console.log("📈 Formatted stats:", formattedStats);

      console.log("🎯 Fetching quests with status...");
      const questsWithStatus = await backendActor.getAllQuestsWithStatus();
      console.log("✅ Raw quests with status:", questsWithStatus);
      
      const formattedQuests = questsWithStatus.map(([quest, status]) => {
        console.log("Processing quest:", quest); // Debug individual quest
        return {
          ...quest,
          id: Number(quest.id),
          reward: Number(quest.rewardAmount),
          status: status,
          // category should now be included automatically from the quest object
        };
      });
      
      setQuests(formattedQuests);
      console.log("📝 Formatted quests:", formattedQuests);

      const waits = await backendActor.getCooldowns();
      setCooldowns(Object.fromEntries(waits.map(([id, left]) => [Number(id), Number(left)])));

    } catch (err) {
      console.error("❌ Failed to load data:", err);
      console.error("Error details:", err);
      setError("Failed to load data: " + err.message);
    }
    
    if (!quiet) setIsLoading(false);
  };

    const handleQuizSubmit = async (answers) => {
    if (!actor || !selectedId) return;

    setIsSubmitting(true);
    try {
      const result = await actor.submitQuiz(BigInt(selectedId), answers.map((a) => BigInt(a)));
      console.log("🧩 Quiz result:", result);
      // The reply carries the new wait; use it now, so the result never shows a wait of 0
      // while the cooldown list reloads
      const waited = result.failed ?? result.wait;
      if (waited) setCooldowns((current) => ({ ...current, [selectedId]: Number(waited.retryAfterSeconds) }));
      setQuizResult(result);
      setStep("result");
      await loadData(actor, { quiet: true });
    } catch (error) {
      console.error("❌ Failed to submit quiz:", error);
      setError("Failed to submit quiz: " + error.message);
    }
    setIsSubmitting(false);
  };

  const openQuest = (star) => {
    setSelectedId(star.id);
    setStep("detail");
    setQuiz(null);
    setQuizResult(null);
  };

  const startQuiz = async () => {
    setStep("quiz");
    setQuiz(null);
    setQuizResult(null);
    setIsLoadingQuiz(true);
    try {
      const found = await actor.getQuiz(BigInt(selectedId));
      setQuiz(found.length ? found[0] : null);
    } catch (error) {
      console.error("❌ Failed to load quiz:", error);
      setError("Failed to load quiz: " + error.message);
    }
    setIsLoadingQuiz(false);
  };

  const closeQuest = useCallback(() => {
    const id = selectedId;
    setSelectedId(null);
    setQuiz(null);
    setQuizResult(null);
    // Return focus to the star the learner came from
    requestAnimationFrame(() => document.querySelector(`[data-star="${id}"]`)?.focus());
  }, [selectedId]);

  // Runs once on mount. initAuth is a new function on every render, so listing it would repeat the login check.
  useEffect(() => {
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count the cooldowns down once a second, so a star leaves its eclipse without a reload
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldowns((current) => {
        const next = {};
        for (const [id, left] of Object.entries(current)) {
          if (left > 1) next[id] = left - 1;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const reduced = useReducedMotion();
  const vp = useViewport();
  const model = useMemo(() => buildModel(quests, cooldowns, userStats), [quests, cooldowns, userStats]);
  // MapScreen tells us where each star is on screen, so the quest sheet can sit beside it
  const anchorOf = useRef(() => null);
  const setAnchor = useCallback((fn) => { anchorOf.current = fn; }, []);
  const selected = selectedId ? model.starById[selectedId] : null;

  let screen;
  if (isLoading) {
    screen = (
      <main className="grid min-h-dvh place-items-center">
        <p className="ls-display m-0 text-[32px]" role="status">Loading the sky…</p>
      </main>
    );
  } else if (error && isAuthenticated) {
    screen = (
      <main className="grid min-h-dvh place-items-center px-6">
        <div className="ls-glass flex max-w-md flex-col gap-4 rounded-ls-panel p-8">
          <h1 className="ls-display m-0 text-[36px] leading-none">Something went wrong</h1>
          <p role="alert" className="m-0 text-[15px] leading-[1.5]" style={{ color: "var(--ls-text-2)" }}>{error}</p>
          <button type="button" onClick={() => { setError(null); loadData(actor); }} className="ls-cta h-12 rounded-full border-0 text-[16px] font-semibold">
            Try again
          </button>
        </div>
      </main>
    );
  } else if (!isAuthenticated) {
    screen = <Welcome onLogin={handleLogin} reduced={reduced} error={error} />;
  } else {
    screen = (
      <>
        <MapScreen model={model} onSelect={openQuest} selectedId={selectedId} reduced={reduced} onLogout={handleLogout} onAnchor={setAnchor} />
        {selected && (
          <QuestSheet
            key={selected.id}
            star={selected}
            step={step}
            anchor={anchorOf.current(selected)}
            phone={vp.phone}
            wait={cooldowns[selected.id] ?? 0}
            quiz={quiz}
            isLoadingQuiz={isLoadingQuiz}
            isSubmitting={isSubmitting}
            result={quizResult}
            linkOpened={!!linkOpened[selected.id]}
            onLinkOpened={() => setLinkOpened((l) => ({ ...l, [selected.id]: true }))}
            onStartQuiz={startQuiz}
            onSubmit={handleQuizSubmit}
            onBackToDetail={() => { setStep("detail"); setQuizResult(null); }}
            onClose={closeQuest}
          />
        )}
        <TutorOrb actor={actor} next={model.next} onOpenQuest={openQuest} />
      </>
    );
  }

  return (
    <>
      <SkyCanvas reduced={reduced} />
      {screen}
    </>
  );
}

export default App;
