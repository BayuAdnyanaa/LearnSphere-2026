# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: beginners learning Web3 topics (the Internet Computer, AI agents with Fetch.ai, crypto, DeFi, NFTs). They arrive with little background, work through quests in short sessions, and need to see what to do next and what they have unlocked.

Secondary: portfolio visitors (recruiters, reviewers) who look at the app for a few minutes. The app must read as a finished, deliberate product to them, but learners come first.

## Product Purpose

LearnSphere turns learning into a quest game. A learner logs in with Internet Identity, opens a quest, reads its linked official page, and passes a short quiz to earn tokens and XP. Passing unlocks the next quests in a prerequisite graph.

Success: a learner finishes quests because they want to see the next part of the world, and the quiz proves they read the page.

## Positioning

It is a game world, not a course list. Quests, a map of unlocks, rewards and progression make learning feel like an adventure. Learning content comes from real official documentation; LearnSphere is the world around it.

## Operating Context

- Learners leave the app to read an external page (ICP docs, Fetch.ai docs, ethereum.org, NerdWallet, a GitHub README), then return to answer the quiz.
- A failed quiz starts a growing wait (1 min, 5 min, 30 min, then 24 h) before the next try.
- Login is Internet Identity; progress is stored per principal in an Internet Computer canister.
- Used on desktop and on phones.

## Capabilities and Constraints

- 12 quests in four categories (ICP, AI Agents, Development, DeFi/Web3) with a prerequisite graph: 1→3→5→12, 2→4→6, 7→8→{9,10,11}.
- Quest states: locked, available, cooling down (after a failed quiz), completed.
- Each quest has a 3-question, 4-option quiz; all must be correct; the canister replies pass or fail only.
- Rewards: tokens (game points, no money value; no tradable token) and XP (reward × 2); level = floor(sqrt(XP / 50)) + 1, so level L needs 50 × (L − 1)² XP.
- Built: the star-chart quest map with a phone layout, the quest sheet, the quiz with its cooldown, the level planet, and an AI tutor (a glass orb on every screen) that answers through the DFINITY LLM canister. The tutor never sees quiz data.
- Not built: streaks, badges and a leaderboard. Do not show them as if they exist.
- Stack: React 19, Vite 7, Tailwind 4, Motoko backend on ICP.

## Brand Commitments

- Name: LearnSphere. Existing logo: `frontend/public/LearnSphere logo.png`.
- A cosmic world you explore, not a SaaS dashboard and not a pixel game: deep space, light and glass.
- Approved direction (2a, "Constellation horizon with animal figures"): the quest map is a star chart over a glowing planet rim. Each track is a constellation drawn as an animal (Testudo the Turtle for the Internet Computer, Corvus the Raven for AI Agents, the Phoenix for Web3). Quests are stars; prerequisites are the lines between them. Spec: `docs/design/handoff/README.md`.
- One strong light source per screen. Frosted glass panels with thin bright edges, a glossy planet or orb as the focal object, big display type (Cormorant Garamond italic), Figtree for UI, DM Mono for data, pill-shaped controls, and soft glow used sparingly.
- Owner's references: the Dribbble shots "Beyond the Horizon", "Gen UI for AI phone OS launcher" (Milkinside), "Post Master AI SaaS landing", "AI Assistant mobile app" and "AlphaChain staking hub".
- Glass, cosmic gradients, a starfield and soft glow are part of the brand. An earlier rule against them is withdrawn.
- Anti-references: a flat SaaS dashboard, a course list with progress bars, and pixel-art game UI.
- The owner's bans: no middle-dot separators in labels, no tinted boxes with a coloured stripe on one side, no filler meta lines. No fake numbers, logos, testimonials or user counts.

## Evidence on Hand

- Real quest titles, descriptions, links and quiz questions in `backend/src/backend/main.mo`, `backend/src/backend/Quizzes.mo` and `docs/quiz-draft.md`.
- No user numbers, testimonials or press exist. Do not invent them.

## Product Principles

1. The world comes first: progress should feel like exploring and unlocking, not ticking a list.
2. Read, then prove: every reward follows reading a real page and passing its quiz.
3. Always show the next step: a learner should never wonder what to do next.
4. Honest stakes: points are game points; never imply money value.

## Accessibility & Inclusion

Must work at 390 px phone width, be fully keyboard usable, and stop all motion under prefers-reduced-motion. Body text keeps at least 4.5:1 contrast, also on glass (add a darker scrim where needed). Quest states must differ in shape or icon, not only in colour.
