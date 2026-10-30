// The tutor's prompt and limits. This module must never import Quizzes: the prompt is built
// only from quest titles, descriptions and links, so no quiz question or answer can reach a
// model. frontend/scripts/tutor-source.test.mjs fails if this module's imports reach Quizzes.
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Text "mo:base/Text";

module {

    // The LLM canister's message type (candid "system" is "system_" in Motoko)
    public type ToolCallArgument = { name : Text; value : Text };
    public type ToolCall = { id : Text; function : { name : Text; arguments : [ToolCallArgument] } };
    public type AssistantMessage = { content : ?Text; tool_calls : [ToolCall] };
    public type ChatMessage = {
        #user : { content : Text };
        #system_ : { content : Text };
        #assistant : AssistantMessage;
        #tool : { content : Text; tool_call_id : Text };
    };

    // One earlier turn of the conversation, sent back by the browser
    public type Turn = { fromLearner : Bool; text : Text };

    public type Reply = {
        #ok : { text : Text };
        // The question itself is not acceptable (empty or too long)
        #rejected : { reason : Text };
        // The learner or the whole app reached a limit; try again later
        #limited : { reason : Text; retryAfterSeconds : Nat };
        #unavailable : { reason : Text };
    };

    // Where answers come from. The OpenRouter proxy stays off until a controller turns it on.
    public type Mode = { #llmCanister; #proxy; #off };

    // What the tutor knows about one quest: public facts only
    public type QuestFacts = { title : Text; description : Text; link : Text; track : Text };

    public type LearnerContext = {
        completed : [QuestFacts];
        suggested : ?QuestFacts;
        open : [QuestFacts];
    };

    public let MODEL = "llama3.1:8b";
    public let MAX_QUESTION_CHARS = 500;
    public let MAX_TURNS = 6;
    public let MAX_TURN_CHARS = 1000;
    // The LLM canister accepts 10 messages and 10 KiB of prompt; stay under both
    public let MAX_PROMPT_BYTES = 9_500;
    public let PER_LEARNER_PER_DAY = 20;
    public let MIN_SECONDS_BETWEEN = 10;
    public let GLOBAL_PER_DAY = 1_000;

    // A function, because a module constant cannot be built with #
    public func systemPrompt() : Text {
        "You are the LearnSphere tutor. You help one learner understand the topics of their quests: " #
        "the Internet Computer (ICP), AI agents (Fetch.ai and uAgents) and Web3.\n" #
        "Rules:\n" #
        "1. Ground every answer in the topic of the learner's quests below and their reading pages. " #
        "Use plain words and keep each answer under 150 words.\n" #
        "2. If you are not sure about a fact, say that you are not sure and tell the learner to check the linked reading page. " #
        "Never invent facts, names, numbers, commands or APIs about the Internet Computer, Fetch.ai or any project.\n" #
        "3. You do not have the quiz questions or the quiz answers. If the learner asks you to answer a quiz question " #
        "or to pick an option, do not pick one. Explain the idea and point to the quest's reading page.\n" #
        "4. Do not ask for personal data, and do not repeat any personal data that the learner types."
    };

    func describe(q : QuestFacts) : Text {
        "- " # q.title # " (" # q.track # "): " # q.description # " Reading page: " # q.link
    };

    func lines(qs : [QuestFacts]) : Text {
        if (qs.size() == 0) { return "- none yet" };
        Text.join("\n", Array.map<QuestFacts, Text>(qs, describe).vals())
    };

    public func contextText(ctx : LearnerContext) : Text {
        "Learner context.\n" #
        "Suggested next quest:\n" # (switch (ctx.suggested) { case (?q) { describe(q) }; case (null) { "- none (every quest is done or cooling down)" } }) # "\n" #
        "Open quests:\n" # lines(ctx.open) # "\n" #
        "Completed quests:\n" # lines(ctx.completed)
    };

    // A reason to refuse the question before any model call, or null when it is acceptable
    public func checkQuestion(question : Text, turns : [Turn]) : ?Text {
        let q = Text.trim(question, #char ' ');
        if (q.size() == 0) { return ?"Type a question first." };
        if (q.size() > MAX_QUESTION_CHARS) { return ?("Keep your question under " # Nat.toText(MAX_QUESTION_CHARS) # " characters.") };
        if (turns.size() > MAX_TURNS) { return ?"Too many earlier messages." };
        for (t in turns.vals()) {
            if (t.text.size() > MAX_TURN_CHARS) { return ?"An earlier message is too long." };
        };
        null
    };

    // System prompt and context, then the newest earlier turns that fit, then the question
    public func buildMessages(ctx : LearnerContext, turns : [Turn], question : Text) : [ChatMessage] {
        let head : ChatMessage = #system_ { content = systemPrompt() # "\n\n" # contextText(ctx) };
        let last : ChatMessage = #user { content = question };
        var used = exactBytes(head) + exactBytes(last);
        var kept : [ChatMessage] = [];
        var i = turns.size();
        label fit while (i > 0) {
            i -= 1;
            let t = turns[i];
            let m : ChatMessage = if (t.fromLearner) { #user { content = t.text } } else {
                #assistant { content = ?t.text; tool_calls = [] }
            };
            let size = exactBytes(m);
            if (used + size > MAX_PROMPT_BYTES) { break fit };
            used += size;
            kept := Array.append([m], kept);
        };
        Array.flatten<ChatMessage>([[head], kept, [last]])
    };

    func exactBytes(m : ChatMessage) : Nat {
        let text = switch (m) {
            case (#user u) { u.content };
            case (#system_ s) { s.content };
            case (#assistant a) { switch (a.content) { case (?c) { c }; case (null) { "" } } };
            case (#tool t) { t.content };
        };
        Text.encodeUtf8(text).size()
    };
};
