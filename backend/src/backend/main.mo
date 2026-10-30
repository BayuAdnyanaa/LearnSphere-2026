import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Quizzes "Quizzes";

persistent actor LearnSphere {

    public type Quest = {
        id: Nat;
        title: Text;
        description: Text;
        link: Text;
        rewardAmount: Nat;
        prerequisite: ?Nat;
        category: Text; 
    };
    
    public type UserStats = {
        tokens: Nat;
        questsCompleted: [Nat];
        experience: Nat;
    };

    // What a learner sees of a quiz: the questions and options, never the answers
    public type PublicQuestion = {
        text: Text;
        options: [Text];
    };

    public type PublicQuiz = {
        questId: Nat;
        questions: [PublicQuestion];
    };

    // Pass/fail only: per-question feedback would let a learner find the answers one by one
    public type QuizResult = {
        #passed : { tokensEarned: Nat; experienceEarned: Nat };
        #failed : { retryAfterSeconds: Nat };
        #wait : { retryAfterSeconds: Nat };
        #rejected : { reason: Text };
    };

    type AttemptState = {
        fails: Nat;
        lastFailAt: Int;
    };

    // Wait after the 1st, 2nd, 3rd and every later failed attempt on one quest
    transient let COOLDOWN_STEPS_SECONDS : [Nat] = [60, 300, 1800, 86400];

    // Unused. Kept only because an upgrade cannot drop a stable variable without a migration.
    // The old version stored the quest list here, and an upgrade kept that old list.
    private stable var questsArray : [Quest] = [];

    // Rebuilt from this code on every upgrade, so quest edits take effect without a reinstall
    transient let quests : [Quest] = [
        { id = 1; title = "What is a Canister?"; description = "Read the introductory article on ICP smart contracts."; link = "https://docs.internetcomputer.org/concepts/canisters/"; rewardAmount = 100; prerequisite = null; category = "ICP"; },
        { id = 2; title = "Introduction to Fetch.ai"; description = "Read the official introduction to Fetch.ai and uAgents."; link = "https://innovationlab.fetch.ai/resources/docs/intro"; rewardAmount = 100; prerequisite = null; category = "AI Agents"; },
        { id = 3; title = "Building Your First dApp"; description = "Follow the ICP quickstart to create and deploy your first app."; link = "https://docs.internetcomputer.org/getting-started/quickstart/"; rewardAmount = 150; prerequisite = ?1; category = "Development"; },
        { id = 4; title = "Agent Framework Concepts"; description = "Learn how Fetch.ai agents work."; link = "https://uagents.fetch.ai/docs"; rewardAmount = 150; prerequisite = ?2; category = "AI Agents"; },
        { id = 5; title = "Understanding Principals"; description = "Learn about identity on the IC."; link = "https://docs.internetcomputer.org/concepts/principals/"; rewardAmount = 200; prerequisite = ?3; category = "ICP"; },
        { id = 6; title = "Agent-Based DeFi"; description = "Explore how agents are used in finance."; link = "https://fetch.ai/blog/agent-based-trading-tools-for-decentralized-exchanges"; rewardAmount = 250; prerequisite = ?4; category = "DeFi"; },
        { id = 7; title = "What is Web3?"; description = "Get a high-level overview of the next evolution of the internet."; link = "https://ethereum.org/web3/"; rewardAmount = 100; prerequisite = null; category = "Web3"; },
        { id = 8; title = "Crypto Fundamentals"; description = "Learn the basics of what cryptocurrency is and how it works."; link = "https://www.nerdwallet.com/investing/learn/cryptocurrency"; rewardAmount = 120; prerequisite = ?7; category = "Web3"; },
        { id = 9; title = "Proof-of-Work vs. Proof-of-Stake"; description = "Understand the two major consensus mechanisms that power blockchains."; link = "https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/"; rewardAmount = 150; prerequisite = ?8; category = "Web3"; },
        { id = 10; title = "Introduction to DeFi"; description = "Discover how decentralized finance is changing the world of financial services."; link = "https://ethereum.org/defi/"; rewardAmount = 150; prerequisite = ?8; category = "DeFi"; },
        { id = 11; title = "What are NFTs?"; description = "Learn about Non-Fungible Tokens and their role in digital ownership."; link = "https://ethereum.org/nft"; rewardAmount = 130; prerequisite = ?8; category = "Web3"; },
        { id = 12; title = "The Motoko Playground"; description = "Read about the Motoko Playground, then try it at play.motoko.org: write and deploy a canister in the browser."; link = "https://github.com/dfinity/motoko-playground"; rewardAmount = 300; prerequisite = ?5; category = "Development"; }
    ];

    private stable var userStatsEntries : [(Principal, UserStats)] = [];
    private transient var userStats = HashMap.HashMap<Principal, UserStats>(10, Principal.equal, Principal.hash);

    // Failed quiz attempts per "principal/questId", for the cooldown
    private stable var attemptEntries : [(Text, AttemptState)] = [];
    private transient var attempts = HashMap.HashMap<Text, AttemptState>(10, Text.equal, Text.hash);

    system func preupgrade() {
        userStatsEntries := Iter.toArray(userStats.entries());
        attemptEntries := Iter.toArray(attempts.entries());
    };

    system func postupgrade() {
        userStats := HashMap.fromIter<Principal, UserStats>(userStatsEntries.vals(), userStatsEntries.size(), Principal.equal, Principal.hash);
        userStatsEntries := [];
        attempts := HashMap.fromIter<Text, AttemptState>(attemptEntries.vals(), attemptEntries.size(), Text.equal, Text.hash);
        attemptEntries := [];
    };

    private func getOrCreateUser(caller: Principal) : UserStats {
        // Without login every visitor would share the anonymous principal and its progress
        if (Principal.isAnonymous(caller)) {
            Debug.trap("Please log in: anonymous callers have no progress record.");
        };
        switch (userStats.get(caller)) {
            case (?stats) { stats };
            case (null) {
                let newStats : UserStats = { tokens = 0; questsCompleted = []; experience = 0; };
                userStats.put(caller, newStats);
                newStats
            };
        }
    };
    
    private func arrayContains(arr: [Nat], item: Nat) : Bool {
        Array.find<Nat>(arr, func(x: Nat) : Bool { x == item }) != null
    };

    private func attemptKey(caller: Principal, questId: Nat) : Text {
        Principal.toText(caller) # "/" # Nat.toText(questId)
    };

    private func cooldownSeconds(fails: Nat) : Nat {
        let last : Nat = COOLDOWN_STEPS_SECONDS.size() - 1;
        let step : Nat = if (fails == 0) { 0 } else if (fails > last) { last } else { Nat.sub(fails, 1) };
        COOLDOWN_STEPS_SECONDS[step]
    };

    // Seconds left before the caller may try this quest's quiz again (0 = may try now)
    private func secondsUntilRetry(key: Text) : Nat {
        switch (attempts.get(key)) {
            case (null) { 0 };
            case (?a) {
                let readyAt = a.lastFailAt + cooldownSeconds(a.fails) * 1_000_000_000;
                let left = readyAt - Time.now();
                if (left <= 0) { 0 } else { Int.abs(left + 999_999_999) / 1_000_000_000 }
            };
        }
    };

    private func findQuiz(questId: Nat) : ?Quizzes.QuizSpec {
        Array.find<Quizzes.QuizSpec>(Quizzes.bank, func(q: Quizzes.QuizSpec) : Bool { q.questId == questId })
    };
    

    public query func greet(name : Text) : async Text {
        Debug.print("greet called with: " # name);
        "Hello, " # name # "! LearnSphere canister is working!"
    };

    public shared(msg) func getUserStats() : async UserStats {
        let caller = msg.caller;
        Debug.print("getUserStats called by: " # Principal.toText(caller));
        getOrCreateUser(caller)
    };

    public query func getAllQuests() : async [Quest] {
        Debug.print("getAllQuests called - returning " # debug_show(Array.size(quests)) # " quests");
        quests
    };

    public shared(msg) func getAllQuestsWithStatus() : async [(Quest, Text)] {
        let caller = msg.caller;
        let stats = getOrCreateUser(caller);
        Debug.print("getAllQuestsWithStatus called by: " # Principal.toText(caller));
        
        Array.map<Quest, (Quest, Text)>(quests, func(quest: Quest) : (Quest, Text) {
            var status = "locked";
            
            if (arrayContains(stats.questsCompleted, quest.id)) {
                status := "completed";
            } else {
                switch (quest.prerequisite) {
                    case (null) { status := "available"; };
                    case (?prereqId) {
                        if (arrayContains(stats.questsCompleted, prereqId)) {
                            status := "available";
                        };
                    };
                };
            };
            
            (quest, status)
        })
    };

    public shared(msg) func getNextQuest() : async ?Quest {
        let caller = msg.caller;
        let stats = getOrCreateUser(caller);
        Debug.print("getNextQuest called by: " # Principal.toText(caller));

        Array.find<Quest>(quests, func(quest: Quest) : Bool {
            if (arrayContains(stats.questsCompleted, quest.id)) {
                return false;
            };
            
            switch (quest.prerequisite) {
                case (null) { true }; 
                case (?prereqId) {
                    arrayContains(stats.questsCompleted, prereqId)
                };
            }
        })
    };

    public query func getQuiz(questId: Nat) : async ?PublicQuiz {
        switch (findQuiz(questId)) {
            case (null) { null };
            case (?quiz) {
                ?{
                    questId = quiz.questId;
                    questions = Array.map<Quizzes.QuizQuestion, PublicQuestion>(quiz.questions, func(q) {
                        { text = q.text; options = q.options }
                    });
                }
            };
        }
    };

    // Quests on which the caller must still wait, as (questId, seconds left)
    public shared query(msg) func getCooldowns() : async [(Nat, Nat)] {
        let caller = msg.caller;
        let waits = Array.map<Quest, (Nat, Nat)>(quests, func(q) { (q.id, secondsUntilRetry(attemptKey(caller, q.id))) });
        Array.filter<(Nat, Nat)>(waits, func((_, left)) { left > 0 })
    };

    // The only way to earn a quest's reward: answer all of its questions correctly
    public shared(msg) func submitQuiz(questId: Nat, answers: [Nat]) : async QuizResult {
        let caller = msg.caller;
        let stats = getOrCreateUser(caller);

        let quest = switch (Array.find<Quest>(quests, func(q: Quest) : Bool { q.id == questId })) {
            case (null) { return #rejected { reason = "Quest not found." } };
            case (?q) { q };
        };
        if (arrayContains(stats.questsCompleted, quest.id)) {
            return #rejected { reason = "Quest already completed." };
        };
        switch (quest.prerequisite) {
            case (null) {};
            case (?prereqId) {
                if (not arrayContains(stats.questsCompleted, prereqId)) {
                    return #rejected { reason = "Complete the previous quest first." };
                };
            };
        };
        let quiz = switch (findQuiz(questId)) {
            case (null) { return #rejected { reason = "This quest has no quiz yet." } };
            case (?q) { q };
        };
        if (answers.size() != quiz.questions.size()) {
            return #rejected { reason = "Answer every question." };
        };

        let key = attemptKey(caller, questId);
        let wait = secondsUntilRetry(key);
        if (wait > 0) {
            return #wait { retryAfterSeconds = wait };
        };

        var allCorrect = true;
        for (i in quiz.questions.keys()) {
            if (answers[i] != quiz.questions[i].answer) { allCorrect := false };
        };

        if (not allCorrect) {
            let fails = switch (attempts.get(key)) { case (null) { 1 }; case (?a) { a.fails + 1 } };
            attempts.put(key, { fails; lastFailAt = Time.now() });
            Debug.print("submitQuiz failed by: " # Principal.toText(caller) # " quest " # debug_show(questId) # " fails " # debug_show(fails));
            return #failed { retryAfterSeconds = cooldownSeconds(fails) };
        };

        attempts.delete(key);
        let experienceEarned = quest.rewardAmount * 2;
        userStats.put(caller, {
            tokens = stats.tokens + quest.rewardAmount;
            questsCompleted = Array.append<Nat>(stats.questsCompleted, [quest.id]);
            experience = stats.experience + experienceEarned;
        });
        Debug.print("submitQuiz passed by: " # Principal.toText(caller) # " quest " # debug_show(questId));
        #passed { tokensEarned = quest.rewardAmount; experienceEarned }
    };

    public query func getQuestCount() : async Nat {
        let count = Array.size(quests);
        Debug.print("getQuestCount called - returning: " # debug_show(count));
        count
    };

    public query func getQuestById(questId: Nat) : async ?Quest {
        Debug.print("getQuestById called with ID: " # debug_show(questId));
        Array.find<Quest>(quests, func(q: Quest) : Bool { q.id == questId })
    };
}
