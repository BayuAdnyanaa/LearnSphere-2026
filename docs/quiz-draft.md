# LearnSphere quiz (stage 2, final)

Status: FINAL. This content is in `backend/src/backend/Quizzes.mo`. The supervisor rewrote the options of 1.1, 4.1, 5.1, 6.1, 10.1, 11.1 and 11.2 and accepted 8.1 as it is.

**Bold** marks the correct option. 3 questions per quest, 4 options, all 3 must be correct. The answers are public in the repo on purpose (the points have no money value).

How it was made: round 1 drafted the questions from each page. Round 2 applied the supervisor review (believable wrong options, similar option lengths, the 4 named rewrites, exact quotes). Each reviser downloaded the raw page with curl and substring-tested every quote. Round 3 reworked the 12 questions that an independent checker still rated as guessable. Every round had an independent checker.

## Remaining checker flags (1 of 36)

- 8.1: only 1 believable wrong option(s)

Correct-option positions: A 7, B 9, C 9, D 11 (36 questions)

## Quest 1: What is a Canister?

- Source: https://docs.internetcomputer.org/concepts/canisters/
- Last revised in round 3

1. According to the page, what do canisters bundle into a single unit?
   - A. Compiled WebAssembly code and a private key
   - B. Smart contract code and a token balance
   - C. **Compiled WebAssembly code and persistent state**
   - D. Motoko source code and a cycles wallet
   - Evidence (exact page text): "Each canister bundles compiled WebAssembly code with its own persistent state into a single unit that the network executes, replicates, and secures."

2. According to the page, what type of identifier is a canister ID?
   - A. **A principal**
   - B. A hash of its Wasm code
   - C. A subnet serial number
   - D. A cycles account number
   - Evidence (exact page text): "This ID is a principal : the same type of identifier used for users, and serves as the canister’s address on the network."

3. What happens when a canister has no controllers?
   - A. It stops accepting new messages
   - B. Any user can upgrade its code
   - C. Only the original developer can change it
   - D. **No one can change its code or settings**
   - Evidence (exact page text): "If a canister has no controllers , it is immutable: no one can change its code or settings."

## Quest 2: Introduction to Fetch.ai

- Source: https://innovationlab.fetch.ai/resources/docs/intro
- Last revised in round 2

1. What is the vision of Fetch.ai, according to the page?
   - A. To build one chatbot that answers every question
   - B. **To create a marketplace of dynamic applications**
   - C. To build a faster blockchain for digital payments
   - D. To offer a cloud service for storing user data
   - Evidence (exact page text): "Fetch.ai's vision is to create a marketplace of dynamic applications."

2. What are uAgents?
   - A. Web3-native language models built for agentic AI
   - B. A hub where agents are registered and discovered
   - C. Smart contracts that hold tokens for agent users
   - D. **Microservices built to connect seamlessly with other agents**
   - Evidence (exact page text): "uAgents are microservices built to connect seamlessly with other agents."

3. What is Agentverse, according to the page?
   - A. **An agent marketplace, management, and development hub**
   - B. A language model that queries agents on the go
   - C. A framework for building small single-purpose agents
   - D. A blockchain network that records agent payments
   - Evidence (exact page text): "An Agent marketplace, management, and development hub where agents are created, registered, deployed, and discovered."

## Quest 3: Building Your First dApp

- Source: https://docs.internetcomputer.org/getting-started/quickstart/
- Last revised in round 2

1. According to the quickstart, what does the icp deploy command do?
   - A. It starts a local network in the background
   - B. It creates a new project from a template
   - C. It stops the local network when you finish
   - D. **It builds your code and creates canisters for it**
   - Evidence (exact page text): "This single command builds your Motoko code into WebAssembly, compiles the React frontend, creates canisters on the local network, and installs your code."

2. What does the quickstart say about the local network that you start?
   - A. You must buy cycles before you can deploy
   - B. **It comes pre-funded, so you can deploy at once**
   - C. You must set up a wallet before you can deploy
   - D. It must be linked to the main ICP network first
   - Evidence (exact page text): "The local network comes pre-funded."

3. What does the hello-world template give you when you create the project?
   - A. A Rust backend and a Vue frontend
   - B. A Motoko backend with no frontend at all
   - C. **A Motoko backend and a React frontend**
   - D. A JavaScript backend and a React frontend
   - Evidence (exact page text): "This creates a fullstack project from the hello-world template with a Motoko backend and React frontend."

## Quest 4: Agent Framework Concepts

- Source: https://uagents.fetch.ai/docs
- Last revised in round 3

1. What is the uAgents Framework?
   - A. **A Python library for developing agents**
   - B. A Rust library for developing agents
   - C. A hosted service for running agents
   - D. A JavaScript SDK for building agents
   - Evidence (exact page text): "The uAgents Framework is a python library designed to facilitate the development of Agents."

2. What is the basic workflow of an agent, according to the page?
   - A. They wait for a person to approve every message they send
   - B. They must register first, then ask a server to send messages
   - C. **They come online, register or not, then send and receive messages**
   - D. They collect user data first, then train themselves on that data
   - Evidence (exact page text): "Agents come online, they register (or not) and then send and receive messages."

3. According to the page, what can agents do with large language models (LLMs)?
   - A. Fine-tune them using the messages agents exchange
   - B. **Wrap and orchestrate them for any task**
   - C. Host them on a shared registry for other agents
   - D. Translate messages between agents with them
   - Evidence (exact page text): "Agents can wrap and orchestrate LLMs to create personalized Agents for any task."

## Quest 5: Understanding Principals

- Source: https://docs.internetcomputer.org/concepts/principals/
- Last revised in round 3

1. According to the page, what is a principal on the Internet Computer?
   - A. An identity used only by human users
   - B. An identity used only by canisters
   - C. **An identity for any caller of a canister**
   - D. An identity that only controllers can hold
   - Evidence (exact page text): "A principal is any entity that can authenticate with the Internet Computer and be identified when calling a canister."

2. Which principal does a canister see as the caller when a message is not signed?
   - A. The management canister principal
   - B. The principal of the canister's controller
   - C. A random session token
   - D. **The anonymous principal**
   - Evidence (exact page text): "Messages that are not signed use the anonymous principal as their caller identity."

3. According to the page, what is a user's self-authenticating principal derived from?
   - A. **Their public key, run through a hash**
   - B. Their email address, run through a hash
   - C. Their canister ID, run through a hash
   - D. Their username, run through a hash
   - Evidence (exact page text): "User identities are derived from public keys using a domain-separated hash."

## Quest 6: Agent-Based DeFi

- Source: https://fetch.ai/blog/agent-based-trading-tools-for-decentralized-exchanges
- Last revised in round 3

1. According to the page, what do the new software agents do for users on decentralized exchanges?
   - A. They suggest trades for users to approve
   - B. **They execute trades on behalf of users**
   - C. They pool user funds for shared trades
   - D. They send price alerts before each trade
   - Evidence (exact page text): "Fetch.ai's new suite of tools aims to address these challenges by introducing intelligent agents that can execute trades on behalf of users, ensuring the best possible outcomes while reducing the need for manual intervention."

2. Which settings, called user-defined parameters, does the page say the trades are based on?
   - A. **Maximum slippage and price impact**
   - B. Minimum gas fee and block time
   - C. Daily trading limit and stop date
   - D. Wallet size and number of tokens
   - Evidence (exact page text): "The platform uses machine learning algorithms to analyze market conditions and execute trades based on user-defined parameters, such as maximum slippage and price impact."

3. How does the page say the AI-powered agents let buyers and sellers trade?
   - A. Through an automated market maker contract
   - B. Through a shared liquidity pool
   - C. Through a cross-chain bridge
   - D. **Using their own smart contracts**
   - Evidence (exact page text): "By utilizing Fetch.ai's AI-powered software agents, users can directly link buyers and sellers, allowing them to trade using their own smart contracts."

## Quest 7: What is Web3?

- Source: https://ethereum.org/web3/
- Last revised in round 2

1. According to the page, what does Web3 give you in an unprecedented way?
   - A. Cheaper internet access
   - B. Unlimited cloud storage
   - C. Guaranteed online privacy
   - D. **Ownership of digital assets**
   - Evidence (exact page text): "Web3 gives you ownership of your digital assets in an unprecedented way."

2. Who coined the idea of 'Web 3.0' shortly after Ethereum launched in 2014?
   - A. Satoshi Nakamoto
   - B. Tim Berners-Lee
   - C. **Gavin Wood**
   - D. Vitalik Buterin
   - Evidence (exact page text): "The premise of 'Web 3.0' was coined by Ethereum co-founder Gavin Wood shortly after Ethereum launched in 2014."

3. Which revenue model does the page say Web 2.0 gave birth to?
   - A. Subscription-driven revenue
   - B. **Advertising-driven revenue**
   - C. Donation-driven revenue
   - D. Licensing-driven revenue
   - Evidence (exact page text): "Web 2.0 also birthed the advertising-driven revenue model."

## Quest 8: Crypto Fundamentals

- Source: https://www.nerdwallet.com/investing/learn/cryptocurrency
- Last revised in round 3

1. What technology are cryptocurrencies based on, according to the page?
   - A. **Blockchain, a tamper-resistant transaction record**
   - B. Online banking, a secure customer account system
   - C. Cloud storage, a remote file-saving service
   - D. Mobile payments, a phone-based wallet system
   - Evidence (exact page text): "Cryptocurrencies are based on a technology known as blockchain, a tamper-resistant transaction record."
   - Checker flag: only 1 believable wrong option(s). Common knowledge: most people link crypto with blockchain without reading the page. Only 'Online banking' is a believable wrong option.

2. According to the page, how does Bitcoin check that a payment went through?
   - A. A bank or other financial institution checks it
   - B. **Automatically, without a central authority**
   - C. A government office reviews each payment
   - D. A payment company confirms each transaction
   - Evidence (exact page text): "But Bitcoin does this automatically, without that central authority."

3. How are cryptocurrencies taxed in the U.S., according to the page?
   - A. As currency, the same as dollars
   - B. As stock, the same as company shares
   - C. **As property, not as currency**
   - D. As a tax-free digital asset
   - Evidence (exact page text): "Cryptocurrencies are taxed as property, rather than currency."

## Quest 9: Proof-of-Work vs. Proof-of-Stake

- Source: https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/
- Last revised in round 3

1. How much ETH must a person deposit to run a validator on Ethereum's proof-of-stake network?
   - A. 1 ETH
   - B. 8 ETH
   - C. **32 ETH**
   - D. 64 ETH
   - Evidence (exact page text): "To participate as a validator, a user must deposit 32 ETH into the deposit contract and run three separate pieces of software: an execution client, a consensus client, and a validator client."

2. According to the page, how is the block proposer chosen in each slot?
   - A. The validator with the most ETH staked
   - B. **Picked at random each slot**
   - C. The validator that has waited longest since its last turn
   - D. The first validator to solve a puzzle
   - Evidence (exact page text): "One validator is randomly selected to be a block proposer in every slot."

3. What can happen to a validator that tries to defraud the network?
   - A. It only loses future rewards, never its stake
   - B. It is removed, and its stake is returned
   - C. It only gets a warning message
   - D. **It can lose some or all of its staked ETH**
   - Evidence (exact page text): "If they try to defraud the network (for example by proposing multiple blocks when they ought to send one or sending conflicting attestations), some or all of their staked ETH can be destroyed."

## Quest 10: Introduction to DeFi

- Source: https://ethereum.org/defi/
- Last revised in round 3

1. According to the page, when must a flash loan be paid back?
   - A. Within one day
   - B. **Within the same transaction**
   - C. Within one week
   - D. Within thirty days
   - Evidence (exact page text): "It works on the basis that the loan is taken out and paid back within the same transaction."

2. In the page's PoolTogether no-loss lottery example, where does the prize pool come from?
   - A. Small fees taken from players who do not win
   - B. Profits made by trading the deposits on exchanges
   - C. Grants paid by the PoolTogether team
   - D. **Interest from lending the ticket deposits**
   - Evidence (exact page text): "The prize pool is generated by all the interest generated by lending the ticket deposits like in the lending example above."

3. In quadratic funding, which projects get the highest amount from the matching pool?
   - A. Those that received the biggest single donation
   - B. Those whose round started first
   - C. **Those with the most unique demand**
   - D. Those chosen by the pool donors in a final vote
   - Evidence (exact page text): "Those with the most unique demand get the highest amount from the matching pool."

## Quest 11: What are NFTs?

- Source: https://ethereum.org/nft
- Last revised in round 3

1. How is an NFT different from a token such as USDC?
   - A. Each NFT can only be held by its creator
   - B. Each NFT can be split into smaller parts
   - C. Each NFT is backed by a fixed dollar value
   - D. **Each NFT is individually unique**
   - Evidence (exact page text): "NFTs are tokens that are individually unique"

2. What does "minting" an NFT mean?
   - A. Buying an NFT from its creator
   - B. Listing an NFT for sale
   - C. Moving an NFT to a new wallet
   - D. **Creating a new NFT that you own**
   - Evidence (exact page text): "When someone "creates" or "mints" an NFT, they're basically telling the smart contract to give them ownership of a particular NFT."

3. Where is the record of who owns an NFT stored, according to the page?
   - A. In the marketplace where it was first sold
   - B. In the wallet app that holds the NFT
   - C. **On the Ethereum blockchain**
   - D. In a record that only the creator can read
   - Evidence (exact page text): "Ownership of an NFT is stored on the blockchain for anyone to verify publicly"

## Quest 12: The Motoko Playground

- Source: https://github.com/dfinity/motoko-playground
- Last revised in round 3

1. What does the Motoko Playground let you do?
   - A. **Build and deploy Motoko canisters directly in the browser**
   - B. Build Motoko canisters in the browser, but deploy them from a terminal
   - C. Write Motoko code in the browser, but run it only on your own computer
   - D. Deploy Motoko canisters only after you set up a local dev environment
   - Evidence (exact page text): "The Motoko playground allows users to build and deploy Motoko canisters directly in the browser, without downloading SDK, setting up a local dev environment, and without a wallet."

2. How long is each deployed canister available in the playground?
   - A. 5 minutes
   - B. 1 hour
   - C. 24 hours
   - D. **20 minutes**
   - Evidence (exact page text): "Each deployed canister has an initial cycle of 0.5T and is available for 20 minutes."

3. According to the README, why does the playground require a proof of work when you request a canister ID?
   - A. To check that the Motoko code compiles first
   - B. **To make sure resources are shared fairly**
   - C. To confirm the user has a funded wallet
   - D. To prove the user owns the imported code
   - Evidence (exact page text): "To ensure resource fairness, we require a proof of work when the user requests for a canister id."
