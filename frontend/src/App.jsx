import { useState, useEffect } from "react";
import "./App.css";

// ICP and DFINITY imports
import { AuthClient } from "@dfinity/auth-client";
import { createActor, canisterId } from "./declarations";

const isLocal = process.env.DFX_NETWORK !== "ic";

// Locally, II runs as its own canister on the replica; on mainnet use the public one
const identityProvider = isLocal
  ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
  : "https://identity.ic0.app";

// In dev, calls go through the Vite /api proxy to the local replica
const agentHost = isLocal ? window.location.origin : "https://icp-api.io";

// Your existing components
import Header from "./components/Header";
import UserStats from "./components/UserStats";
import QuestGrid from "./components/QuestGrid";
import QuestModal from "./components/QuestModal";
import StarField from "./components/StarField";
import ChatAssistant from "./components/ChatAssistant";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [actor, setActor] = useState(null);
  const [principal, setPrincipal] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  // Seconds left before each quest's quiz may be tried again, by quest id
  const [cooldowns, setCooldowns] = useState({});

  const initAuth = async () => {
    try {
      console.log("🔐 Initializing authentication...");
      const authClient = await AuthClient.create();
      
      if (await authClient.isAuthenticated()) {
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
      const identity = authClient.getIdentity();
      const userPrincipal = identity.getPrincipal().toString();

      console.log("👤 User Principal:", userPrincipal);

      // Build the actor with the logged-in identity, so each user has their own principal
      const { HttpAgent } = await import("@dfinity/agent");
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
      const authClient = await AuthClient.create();
      
      await authClient.login({
        identityProvider,
        onSuccess: () => {
          console.log("✅ Login successful");
          handleAuthenticated(authClient);
        },
        onError: (error) => {
          console.error("❌ Login error:", error);
          setError("Login failed: " + error);
        }
      });
    } catch (err) {
      console.error("❌ Login failed:", err);
      setError("Login failed: " + err.message);
    }
  };

  const handleLogout = async () => {
    try {
      const authClient = await AuthClient.create();
      await authClient.logout();
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
    if (!actor || !selectedQuest) return;

    setIsSubmitting(true);
    try {
      const result = await actor.submitQuiz(BigInt(selectedQuest.id), answers.map((a) => BigInt(a)));
      console.log("🧩 Quiz result:", result);
      setQuizResult(result);
      await loadData(actor, { quiet: true });
    } catch (error) {
      console.error("❌ Failed to submit quiz:", error);
      setError("Failed to submit quiz: " + error.message);
    }
    setIsSubmitting(false);
  };

  const startQuest = async (quest) => {
    if (quest.status !== "available") return;
    console.log("🎯 Starting quest:", quest);
    setSelectedQuest(quest);
    setQuizResult(null);
    setQuiz(null);
    window.open(quest.link, "_blank");

    setIsLoadingQuiz(true);
    try {
      const found = await actor.getQuiz(BigInt(quest.id));
      setQuiz(found.length ? found[0] : null);
    } catch (error) {
      console.error("❌ Failed to load quiz:", error);
      setError("Failed to load quiz: " + error.message);
    }
    setIsLoadingQuiz(false);
  };

  const handleQuestCancel = () => {
    setSelectedQuest(null);
    setQuiz(null);
    setQuizResult(null);
  };

  // Runs once on mount. initAuth is a new function on every render, so listing it would repeat the login check.
  useEffect(() => {
    initAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Count the cooldowns down once a second, so a card unlocks without a reload
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

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Loading LearnSphere...</div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-4">❌ {error}</div>
          <button 
            onClick={() => {
              setError(null);
              setIsLoading(true);
              initAuth();
            }} 
            className="bg-blue-500 hover:bg-blue-600 px-6 py-2 rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Main render
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white relative overflow-hidden">
      <StarField />

      <div className="relative z-10 container mx-auto px-6 py-8">
        {isAuthenticated ? (
          <>
            <div className="absolute top-4 right-4 z-20 bg-white/10 p-2 rounded-lg text-xs">
              <p title={principal} className="truncate max-w-[150px]">{principal}</p>
              <button onClick={handleLogout} className="text-red-400">Logout</button>
            </div>
            <Header />
            {userStats && <UserStats stats={userStats} />}
            <QuestGrid
              quests={quests.map((q) => ({ ...q, waitSeconds: cooldowns[q.id] ?? 0 }))}
              onStartQuest={startQuest}
            />
          </>
        ) : (
          <div className="text-center pt-20">
            <Header />
            <button onClick={handleLogin} className="mt-8 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-semibold py-3 px-8 rounded-xl text-lg">
              Login with Internet Identity
            </button>
          </div>
        )}

        <QuestModal
          quest={selectedQuest}
          quiz={quiz}
          isLoadingQuiz={isLoadingQuiz}
          onSubmit={handleQuizSubmit}
          onCancel={handleQuestCancel}
          isSubmitting={isSubmitting}
          result={quizResult}
        />
      </div>
      <ChatAssistant />
    </div>
  );
}

export default App;