import { useState, useEffect } from "react";
import { formatWait } from "./formatWait";

// The quiz for one quest. The canister checks the answers and replies pass or fail only.
const QuestModal = ({ quest, quiz, isLoadingQuiz, onSubmit, onCancel, isSubmitting, result }) => {
  const [answers, setAnswers] = useState([]);

  // Start each quest with no option picked
  useEffect(() => {
    setAnswers([]);
  }, [quest?.id]);

  if (!quest) return null;

  const questions = quiz?.questions ?? [];
  const allAnswered = questions.length > 0 && questions.every((_, i) => answers[i] !== undefined);

  const pick = (questionIndex, optionIndex) => {
    const next = [...answers];
    next[questionIndex] = optionIndex;
    setAnswers(next);
  };

  const renderResult = () => {
    if ("passed" in result) {
      return (
        <>
          <h3 className="text-2xl font-bold mb-4 text-center">Quest complete!</h3>
          <p className="text-center mb-6">
            You earned{" "}
            <span className="text-yellow-400 font-bold">{Number(result.passed.tokensEarned)} tokens</span> and{" "}
            <span className="text-cyan-300 font-bold">{Number(result.passed.experienceEarned)} XP</span>.
          </p>
        </>
      );
    }
    if ("failed" in result) {
      return (
        <>
          <h3 className="text-2xl font-bold mb-4 text-center">Not quite</h3>
          <p className="text-center mb-6">
            At least one answer is wrong. Read the page again and try again in{" "}
            <span className="font-bold">{formatWait(Number(result.failed.retryAfterSeconds))}</span>.
          </p>
        </>
      );
    }
    if ("wait" in result) {
      return (
        <>
          <h3 className="text-2xl font-bold mb-4 text-center">Please wait</h3>
          <p className="text-center mb-6">
            You can try this quiz again in{" "}
            <span className="font-bold">{formatWait(Number(result.wait.retryAfterSeconds))}</span>.
          </p>
        </>
      );
    }
    return (
      <>
        <h3 className="text-2xl font-bold mb-4 text-center">Cannot submit</h3>
        <p className="text-center mb-6">{result.rejected.reason}</p>
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900/90 backdrop-blur-lg rounded-3xl p-8 border border-white/20 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {result ? (
          <>
            {renderResult()}
            <button
              onClick={onCancel}
              className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
            >
              Close
            </button>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold mb-2 text-center">{quest.title}</h3>
            <p className="text-center text-sm opacity-75 mb-6">
              Read the{" "}
              <a href={quest.link} target="_blank" rel="noreferrer" className="text-cyan-300 underline">
                learning page
              </a>
              , then answer all {questions.length || 3} questions correctly to earn{" "}
              <span className="text-yellow-400 font-bold">{quest.reward} tokens</span>.
            </p>

            {isLoadingQuiz && <p className="text-center mb-6">Loading the quiz...</p>}
            {!isLoadingQuiz && !quiz && <p className="text-center mb-6">This quest has no quiz yet.</p>}

            {questions.map((question, qi) => (
              <fieldset key={qi} className="mb-6">
                <legend className="font-semibold mb-3">
                  {qi + 1}. {question.text}
                </legend>
                <div className="space-y-2">
                  {question.options.map((option, oi) => (
                    <label
                      key={oi}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        answers[qi] === oi ? "border-cyan-400 bg-cyan-400/10" : "border-white/20 hover:border-white/40"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${qi}`}
                        checked={answers[qi] === oi}
                        onChange={() => pick(qi, oi)}
                        className="mt-1 accent-cyan-400"
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ))}

            <div className="flex gap-4">
              <button
                onClick={() => onSubmit(answers)}
                disabled={!allAnswered || isSubmitting}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                {isSubmitting ? "Checking..." : "Submit answers"}
              </button>
              <button
                onClick={onCancel}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuestModal;
