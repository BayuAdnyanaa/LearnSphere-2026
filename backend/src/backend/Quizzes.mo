// Quiz questions for each quest. The canister checks the answers; getQuiz in main.mo
// returns only the text and options.
// The answers are public in this source file on purpose: the points have no money
// value, and the quiz exists to make learners read the linked page.
module {
    public type QuizQuestion = {
        text: Text;
        options: [Text];
        answer: Nat; // index into options
    };

    public type QuizSpec = {
        questId: Nat;
        questions: [QuizQuestion];
    };

    public let bank : [QuizSpec] = [
        // TEMP: test quiz for quest 1 until the reviewed questions replace it
        {
            questId = 1;
            questions = [
                { text = "Test question A?"; options = ["a0", "a1", "a2", "a3"]; answer = 2 },
                { text = "Test question B?"; options = ["b0", "b1", "b2", "b3"]; answer = 0 },
                { text = "Test question C?"; options = ["c0", "c1", "c2", "c3"]; answer = 3 },
            ];
        },
    ];
}
