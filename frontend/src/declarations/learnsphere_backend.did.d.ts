import type { Principal } from '@icp-sdk/core/principal';
import type { ActorMethod } from '@icp-sdk/core/agent';
import type { IDL } from '@icp-sdk/core/candid';

export type Mode = { 'off' : null } |
  { 'llmCanister' : null } |
  { 'proxy' : null };
export interface PublicQuestion { 'text' : string, 'options' : Array<string> }
export interface PublicQuiz {
  'questId' : bigint,
  'questions' : Array<PublicQuestion>,
}
export interface Quest {
  'id' : bigint,
  'title' : string,
  'rewardAmount' : bigint,
  'link' : string,
  'description' : string,
  'prerequisite' : [] | [bigint],
  'category' : string,
}
export type QuizResult = { 'wait' : { 'retryAfterSeconds' : bigint } } |
  { 'rejected' : { 'reason' : string } } |
  { 'failed' : { 'retryAfterSeconds' : bigint } } |
  { 'passed' : { 'experienceEarned' : bigint, 'tokensEarned' : bigint } };
export type Reply = { 'ok' : { 'text' : string } } |
  { 'limited' : { 'retryAfterSeconds' : bigint, 'reason' : string } } |
  { 'rejected' : { 'reason' : string } } |
  { 'unavailable' : { 'reason' : string } };
export interface Turn { 'text' : string, 'fromLearner' : boolean }
export interface UserStats {
  'experience' : bigint,
  'questsCompleted' : Array<bigint>,
  'tokens' : bigint,
}
export interface _SERVICE {
  'askTutor' : ActorMethod<[string, Array<Turn>], Reply>,
  'getAllQuests' : ActorMethod<[], Array<Quest>>,
  'getAllQuestsWithStatus' : ActorMethod<[], Array<[Quest, string]>>,
  'getCooldowns' : ActorMethod<[], Array<[bigint, bigint]>>,
  'getNextQuest' : ActorMethod<[], [] | [Quest]>,
  'getQuestById' : ActorMethod<[bigint], [] | [Quest]>,
  'getQuestCount' : ActorMethod<[], bigint>,
  'getQuiz' : ActorMethod<[bigint], [] | [PublicQuiz]>,
  'getUserStats' : ActorMethod<[], UserStats>,
  'greet' : ActorMethod<[string], string>,
  'setTutorMode' : ActorMethod<[Mode], undefined>,
  'setTutorProxy' : ActorMethod<[string, string], undefined>,
  'submitQuiz' : ActorMethod<[bigint, Array<bigint>], QuizResult>,
  'tutorUsageToday' : ActorMethod<
    [],
    {
      'cap' : bigint,
      'day' : bigint,
      'learners' : bigint,
      'calls' : bigint,
      'mode' : Mode,
      'proxyConfigured' : boolean,
    }
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
