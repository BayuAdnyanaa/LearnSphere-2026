export const idlFactory = ({ IDL }) => {
  const Quest = IDL.Record({
    'id' : IDL.Nat,
    'title' : IDL.Text,
    'rewardAmount' : IDL.Nat,
    'link' : IDL.Text,
    'description' : IDL.Text,
    'prerequisite' : IDL.Opt(IDL.Nat),
    'category' : IDL.Text,
  });
  const PublicQuestion = IDL.Record({
    'text' : IDL.Text,
    'options' : IDL.Vec(IDL.Text),
  });
  const PublicQuiz = IDL.Record({
    'questId' : IDL.Nat,
    'questions' : IDL.Vec(PublicQuestion),
  });
  const UserStats = IDL.Record({
    'experience' : IDL.Nat,
    'questsCompleted' : IDL.Vec(IDL.Nat),
    'tokens' : IDL.Nat,
  });
  const QuizResult = IDL.Variant({
    'wait' : IDL.Record({ 'retryAfterSeconds' : IDL.Nat }),
    'rejected' : IDL.Record({ 'reason' : IDL.Text }),
    'failed' : IDL.Record({ 'retryAfterSeconds' : IDL.Nat }),
    'passed' : IDL.Record({
      'experienceEarned' : IDL.Nat,
      'tokensEarned' : IDL.Nat,
    }),
  });
  return IDL.Service({
    'getAllQuests' : IDL.Func([], [IDL.Vec(Quest)], ['query']),
    'getAllQuestsWithStatus' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(Quest, IDL.Text))],
        [],
      ),
    'getCooldowns' : IDL.Func(
        [],
        [IDL.Vec(IDL.Tuple(IDL.Nat, IDL.Nat))],
        ['query'],
      ),
    'getNextQuest' : IDL.Func([], [IDL.Opt(Quest)], []),
    'getQuestById' : IDL.Func([IDL.Nat], [IDL.Opt(Quest)], ['query']),
    'getQuestCount' : IDL.Func([], [IDL.Nat], ['query']),
    'getQuiz' : IDL.Func([IDL.Nat], [IDL.Opt(PublicQuiz)], ['query']),
    'getUserStats' : IDL.Func([], [UserStats], []),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'submitQuiz' : IDL.Func([IDL.Nat, IDL.Vec(IDL.Nat)], [QuizResult], []),
  });
};
export const init = ({ IDL }) => { return []; };
