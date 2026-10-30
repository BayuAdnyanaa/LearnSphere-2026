// A local stand-in for the DFINITY LLM canister (w36hm-eqaaa-aaaal-qr76a-cai), which is not
// available on a local replica. It has the same v1_chat interface, returns a fixed reply, and
// keeps the last requests so a test can examine exactly what the tutor would send a model.
// On mainnet, dfx.json maps the "llm" canister to the real one, so this file is never deployed.
import Array "mo:base/Array";

persistent actor LlmMock {

    public type ToolCallArgument = { name : Text; value : Text };
    public type ToolCall = { id : Text; function : { name : Text; arguments : [ToolCallArgument] } };
    public type AssistantMessage = { content : ?Text; tool_calls : [ToolCall] };
    public type ChatMessage = {
        #user : { content : Text };
        #system_ : { content : Text };
        #assistant : AssistantMessage;
        #tool : { content : Text; tool_call_id : Text };
    };
    public type Property = { type_ : Text; name : Text; description : ?Text; enum_ : ?[Text] };
    public type Parameters = { type_ : Text; properties : ?[Property]; required : ?[Text] };
    public type Tool = { #function : { name : Text; description : ?Text; parameters : ?Parameters } };
    public type ChatRequest = { model : Text; messages : [ChatMessage]; tools : ?[Tool] };
    public type ChatResponse = { message : AssistantMessage };

    transient let KEEP = 50;
    transient var recent : [ChatRequest] = [];

    public func v1_chat(request : ChatRequest) : async ChatResponse {
        recent := Array.append(recent, [request]);
        if (recent.size() > KEEP) {
            recent := Array.subArray(recent, recent.size() - KEEP : Nat, KEEP);
        };
        let question = switch (request.messages[request.messages.size() - 1 : Nat]) {
            case (#user u) { u.content };
            case (_) { "" };
        };
        {
            message = {
                content = ?("[Local mock: no model runs on a local replica.] You asked: " # question);
                tool_calls = [];
            };
        }
    };

    // The last requests, newest last (test use only)
    public query func recentRequests() : async [ChatRequest] {
        recent
    };
};
