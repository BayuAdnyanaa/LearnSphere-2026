import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import HashMap "mo:base/HashMap";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";
import Time "mo:base/Time";
import Int "mo:base/Int";
import Blob "mo:base/Blob";
import Char "mo:base/Char";
import Error "mo:base/Error";
import Nat32 "mo:base/Nat32";
import Quizzes "Quizzes";
import Tutor "Tutor";
// The DFINITY LLM canister on mainnet; a local mock (backend/src/llm_mock) on a local replica
import LLM "canister:llm";

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

    // Tutor use per learner for the current day, and for the whole app
    type TutorUse = { day : Nat; count : Nat; lastAt : Int };
    private stable var tutorUseEntries : [(Principal, TutorUse)] = [];
    private transient var tutorUse = HashMap.HashMap<Principal, TutorUse>(10, Principal.equal, Principal.hash);
    private stable var tutorDay : Nat = 0;
    private stable var tutorDayCount : Nat = 0;
    // The OpenRouter proxy stays off until a controller sets the mode to #proxy
    private stable var tutorMode : Tutor.Mode = #llmCanister;
    private stable var tutorProxyUrl : Text = "";
    // Not confidential: node operators can read canister memory. The proxy has its own caps.
    private stable var tutorProxySecret : Text = "";

    system func preupgrade() {
        userStatsEntries := Iter.toArray(userStats.entries());
        attemptEntries := Iter.toArray(attempts.entries());
        tutorUseEntries := Iter.toArray(tutorUse.entries());
    };

    system func postupgrade() {
        userStats := HashMap.fromIter<Principal, UserStats>(userStatsEntries.vals(), userStatsEntries.size(), Principal.equal, Principal.hash);
        userStatsEntries := [];
        attempts := HashMap.fromIter<Text, AttemptState>(attemptEntries.vals(), attemptEntries.size(), Text.equal, Text.hash);
        attemptEntries := [];
        tutorUse := HashMap.fromIter<Principal, TutorUse>(tutorUseEntries.vals(), tutorUseEntries.size(), Principal.equal, Principal.hash);
        tutorUseEntries := [];
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

    // ---- Tutor ----

    // The suggested order of the quests, as on the star map
    transient let PATH_ORDER : [Nat] = [1, 3, 5, 12, 2, 4, 6, 7, 8, 9, 10, 11];
    transient let DAY_NS : Int = 86_400_000_000_000;

    private func requireController(p : Principal) {
        if (not Principal.isController(p)) { Debug.trap("Only a controller of this canister may do this.") };
    };

    private func today() : Nat { Int.abs(Time.now() / DAY_NS) };

    private func secondsToTomorrow() : Nat {
        Int.abs(((today() + 1) * DAY_NS - Time.now()) / 1_000_000_000) + 1
    };

    private func trackName(id : Nat) : Text {
        if (arrayContains([1, 3, 5, 12], id)) { "Internet Computer" } else if (arrayContains([2, 4, 6], id)) { "AI Agents" } else { "Web3" }
    };

    private func facts(q : Quest) : Tutor.QuestFacts {
        { title = q.title; description = q.description; link = q.link; track = trackName(q.id) }
    };

    // Only quest titles, descriptions and links: the tutor never sees quiz data
    private func learnerContext(caller : Principal, stats : UserStats) : Tutor.LearnerContext {
        let isOpen = func(q : Quest) : Bool {
            if (arrayContains(stats.questsCompleted, q.id)) { return false };
            switch (q.prerequisite) { case (null) { true }; case (?p) { arrayContains(stats.questsCompleted, p) } }
        };
        let completed = Array.filter<Quest>(quests, func(q) { arrayContains(stats.questsCompleted, q.id) });
        let open = Array.filter<Quest>(quests, isOpen);
        var suggested : ?Tutor.QuestFacts = null;
        label pick for (id in PATH_ORDER.vals()) {
            switch (Array.find<Quest>(open, func(q) { q.id == id })) {
                case (?q) {
                    if (secondsUntilRetry(attemptKey(caller, q.id)) == 0) { suggested := ?facts(q); break pick };
                };
                case (null) {};
            };
        };
        {
            completed = Array.map<Quest, Tutor.QuestFacts>(completed, facts);
            suggested;
            open = Array.map<Quest, Tutor.QuestFacts>(open, facts);
        }
    };

    // Counts the call against the learner's and the app's daily limits, or says which limit stops it.
    // The counters move before any model call, so parallel calls cannot slip past a limit.
    private func takeTutorCall(caller : Principal) : ?Tutor.Reply {
        let day = today();
        if (tutorDay != day) { tutorDay := day; tutorDayCount := 0 };
        if (tutorDayCount >= Tutor.GLOBAL_PER_DAY) {
            return ?#limited { reason = "The tutor is resting: today's limit for everyone is reached. Try again tomorrow."; retryAfterSeconds = secondsToTomorrow() };
        };
        let use = switch (tutorUse.get(caller)) {
            case (?u) { if (u.day == day) { u } else { { day; count = 0; lastAt = u.lastAt } } };
            case (null) { { day; count = 0; lastAt = 0 } };
        };
        if (use.count >= Tutor.PER_LEARNER_PER_DAY) {
            return ?#limited { reason = "You asked " # Nat.toText(Tutor.PER_LEARNER_PER_DAY) # " questions today. Try again tomorrow."; retryAfterSeconds = secondsToTomorrow() };
        };
        let sinceLast = (Time.now() - use.lastAt) / 1_000_000_000;
        if (sinceLast < Tutor.MIN_SECONDS_BETWEEN) {
            return ?#limited { reason = "Wait a few seconds between questions."; retryAfterSeconds = Int.abs(Tutor.MIN_SECONDS_BETWEEN - sinceLast) };
        };
        tutorUse.put(caller, { day; count = use.count + 1; lastAt = Time.now() });
        tutorDayCount += 1;
        null
    };

    // Ask the tutor. turns: up to 6 earlier messages of this conversation, oldest first.
    public shared(msg) func askTutor(question : Text, turns : [Tutor.Turn]) : async Tutor.Reply {
        let caller = msg.caller;
        let stats = getOrCreateUser(caller);
        switch (Tutor.checkQuestion(question, turns)) {
            case (?reason) { return #rejected { reason } };
            case (null) {};
        };
        if (tutorMode == #off) { return #unavailable { reason = "The tutor is switched off for now." } };
        switch (takeTutorCall(caller)) {
            case (?limited) { return limited };
            case (null) {};
        };
        let messages = Tutor.buildMessages(learnerContext(caller, stats), turns, question);
        if (tutorMode == #proxy) { return await askProxy(messages) };
        try {
            let response = await LLM.v1_chat({ model = Tutor.MODEL; messages; tools = null });
            switch (response.message.content) {
                case (?text) { #ok { text } };
                case (null) { #unavailable { reason = "The tutor gave no answer. Try again." } };
            }
        } catch (e) {
            Debug.print("askTutor: LLM canister error: " # Error.message(e));
            #unavailable { reason = "The tutor cannot answer right now. Try again later." }
        }
    };

    // Controllers only: where the answers come from (#llmCanister, #proxy or #off)
    public shared(msg) func setTutorMode(mode : Tutor.Mode) : async () {
        requireController(msg.caller);
        tutorMode := mode;
    };

    // Controllers only: the proxy address and its shared secret. Call again to rotate the secret.
    public shared(msg) func setTutorProxy(url : Text, secret : Text) : async () {
        requireController(msg.caller);
        tutorProxyUrl := url;
        tutorProxySecret := secret;
    };

    // Controllers only: today's tutor calls, so a price change cannot drain cycles unnoticed
    public shared query(msg) func tutorUsageToday() : async { day : Nat; calls : Nat; cap : Nat; learners : Nat; mode : Tutor.Mode; proxyConfigured : Bool } {
        requireController(msg.caller);
        let day = today();
        let learners = Iter.size(Iter.filter<TutorUse>(tutorUse.vals(), func(u) { u.day == day }));
        {
            day;
            calls = if (tutorDay == day) { tutorDayCount } else { 0 };
            cap = Tutor.GLOBAL_PER_DAY;
            learners;
            mode = tutorMode;
            proxyConfigured = tutorProxyUrl != "" and tutorProxySecret != "";
        }
    };

    // ---- Tutor fallback: the OpenRouter proxy, through one HTTPS outcall ----

    type HttpHeader = { name : Text; value : Text };
    type HttpResponse = { status : Nat; headers : [HttpHeader]; body : Blob };
    type HttpRequest = {
        url : Text;
        max_response_bytes : ?Nat64;
        method : { #get; #head; #post };
        headers : [HttpHeader];
        body : ?Blob;
        transform : ?{ function : shared query ({ response : HttpResponse; context : Blob }) -> async HttpResponse; context : Blob };
        is_replicated : ?Bool;
    };
    transient let management : actor { http_request : HttpRequest -> async HttpResponse } = actor ("aaaaa-aa");
    // Enough for one outcall on a large subnet; the unused cycles come back
    transient let OUTCALL_CYCLES : Nat = 1_000_000_000;

    private func jsonString(t : Text) : Text {
        let hex = Text.toArray("0123456789abcdef");
        var out = "\"";
        for (c in t.chars()) {
            out #= switch (c) {
                case ('\"') { "\\\"" };
                case ('\\') { "\\\\" };
                case ('\n') { "\\n" };
                case ('\r') { "\\r" };
                case ('\t') { "\\t" };
                case (_) {
                    let n = Char.toNat32(c);
                    if (n < 0x20) {
                        "\\u00" # Text.fromChar(hex[Nat32.toNat(n / 16)]) # Text.fromChar(hex[Nat32.toNat(n % 16)])
                    } else { Text.fromChar(c) }
                };
            };
        };
        out # "\""
    };

    private func messagesJson(messages : [Tutor.ChatMessage]) : Text {
        let items = Array.map<Tutor.ChatMessage, Text>(messages, func(m) {
            let (role, content) = switch (m) {
                case (#system_ s) { ("system", s.content) };
                case (#user u) { ("user", u.content) };
                case (#assistant a) { ("assistant", switch (a.content) { case (?c) { c }; case (null) { "" } }) };
                case (#tool t) { ("user", t.content) };
            };
            "{\"role\":\"" # role # "\",\"content\":" # jsonString(content) # "}"
        });
        "{\"messages\":[" # Text.join(",", items.vals()) # "]}"
    };

    private func askProxy(messages : [Tutor.ChatMessage]) : async Tutor.Reply {
        if (tutorProxyUrl == "" or tutorProxySecret == "") {
            return #unavailable { reason = "The tutor fallback is not set up." };
        };
        try {
            // One node makes the call (is_replicated = false), so different model replies cannot break consensus
            let response = await (with cycles = OUTCALL_CYCLES) management.http_request({
                url = tutorProxyUrl;
                max_response_bytes = ?8_192;
                method = #post;
                headers = [
                    { name = "content-type"; value = "application/json" },
                    { name = "x-tutor-secret"; value = tutorProxySecret },
                ];
                body = ?Text.encodeUtf8(messagesJson(messages));
                transform = null;
                is_replicated = ?false;
            });
            if (response.status == 429) {
                return #limited { reason = "The tutor is resting: today's limit is reached. Try again tomorrow."; retryAfterSeconds = secondsToTomorrow() };
            };
            if (response.status != 200) {
                Debug.print("askTutor: proxy status " # Nat.toText(response.status));
                return #unavailable { reason = "The tutor cannot answer right now. Try again later." };
            };
            switch (Text.decodeUtf8(response.body)) {
                case (?text) { #ok { text } };
                case (null) { #unavailable { reason = "The tutor gave an unreadable answer." } };
            }
        } catch (e) {
            Debug.print("askTutor: proxy error: " # Error.message(e));
            #unavailable { reason = "The tutor cannot answer right now. Try again later." }
        }
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
