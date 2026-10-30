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
        { questId = 1; questions = [
            { text = "According to the page, what do canisters bundle into a single unit?"; options = ["Compiled WebAssembly code and a private key", "Smart contract code and a token balance", "Compiled WebAssembly code and persistent state", "Motoko source code and a cycles wallet"]; answer = 2 },
            { text = "According to the page, what type of identifier is a canister ID?"; options = ["A principal", "A hash of its Wasm code", "A subnet serial number", "A cycles account number"]; answer = 0 },
            { text = "What happens when a canister has no controllers?"; options = ["It stops accepting new messages", "Any user can upgrade its code", "Only the original developer can change it", "No one can change its code or settings"]; answer = 3 },
        ] },
        { questId = 2; questions = [
            { text = "What is the vision of Fetch.ai, according to the page?"; options = ["To build one chatbot that answers every question", "To create a marketplace of dynamic applications", "To build a faster blockchain for digital payments", "To offer a cloud service for storing user data"]; answer = 1 },
            { text = "What are uAgents?"; options = ["Web3-native language models built for agentic AI", "A hub where agents are registered and discovered", "Smart contracts that hold tokens for agent users", "Microservices built to connect seamlessly with other agents"]; answer = 3 },
            { text = "What is Agentverse, according to the page?"; options = ["An agent marketplace, management, and development hub", "A language model that queries agents on the go", "A framework for building small single-purpose agents", "A blockchain network that records agent payments"]; answer = 0 },
        ] },
        { questId = 3; questions = [
            { text = "According to the quickstart, what does the icp deploy command do?"; options = ["It starts a local network in the background", "It creates a new project from a template", "It stops the local network when you finish", "It builds your code and creates canisters for it"]; answer = 3 },
            { text = "What does the quickstart say about the local network that you start?"; options = ["You must buy cycles before you can deploy", "It comes pre-funded, so you can deploy at once", "You must set up a wallet before you can deploy", "It must be linked to the main ICP network first"]; answer = 1 },
            { text = "What does the hello-world template give you when you create the project?"; options = ["A Rust backend and a Vue frontend", "A Motoko backend with no frontend at all", "A Motoko backend and a React frontend", "A JavaScript backend and a React frontend"]; answer = 2 },
        ] },
        { questId = 4; questions = [
            { text = "What is the uAgents Framework?"; options = ["A Python library for developing agents", "A Rust library for developing agents", "A hosted service for running agents", "A JavaScript SDK for building agents"]; answer = 0 },
            { text = "What is the basic workflow of an agent, according to the page?"; options = ["They wait for a person to approve every message they send", "They must register first, then ask a server to send messages", "They come online, register or not, then send and receive messages", "They collect user data first, then train themselves on that data"]; answer = 2 },
            { text = "According to the page, what can agents do with large language models (LLMs)?"; options = ["Fine-tune them using the messages agents exchange", "Wrap and orchestrate them for any task", "Host them on a shared registry for other agents", "Translate messages between agents with them"]; answer = 1 },
        ] },
        { questId = 5; questions = [
            { text = "According to the page, what is a principal on the Internet Computer?"; options = ["An identity used only by human users", "An identity used only by canisters", "An identity for any caller of a canister", "An identity that only controllers can hold"]; answer = 2 },
            { text = "Which principal does a canister see as the caller when a message is not signed?"; options = ["The management canister principal", "The principal of the canister's controller", "A random session token", "The anonymous principal"]; answer = 3 },
            { text = "According to the page, what is a user's self-authenticating principal derived from?"; options = ["Their public key, run through a hash", "Their email address, run through a hash", "Their canister ID, run through a hash", "Their username, run through a hash"]; answer = 0 },
        ] },
        { questId = 6; questions = [
            { text = "According to the page, what do the new software agents do for users on decentralized exchanges?"; options = ["They suggest trades for users to approve", "They execute trades on behalf of users", "They pool user funds for shared trades", "They send price alerts before each trade"]; answer = 1 },
            { text = "Which settings, called user-defined parameters, does the page say the trades are based on?"; options = ["Maximum slippage and price impact", "Minimum gas fee and block time", "Daily trading limit and stop date", "Wallet size and number of tokens"]; answer = 0 },
            { text = "How does the page say the AI-powered agents let buyers and sellers trade?"; options = ["Through an automated market maker contract", "Through a shared liquidity pool", "Through a cross-chain bridge", "Using their own smart contracts"]; answer = 3 },
        ] },
        { questId = 7; questions = [
            { text = "According to the page, what does Web3 give you in an unprecedented way?"; options = ["Cheaper internet access", "Unlimited cloud storage", "Guaranteed online privacy", "Ownership of digital assets"]; answer = 3 },
            { text = "Who coined the idea of 'Web 3.0' shortly after Ethereum launched in 2014?"; options = ["Satoshi Nakamoto", "Tim Berners-Lee", "Gavin Wood", "Vitalik Buterin"]; answer = 2 },
            { text = "Which revenue model does the page say Web 2.0 gave birth to?"; options = ["Subscription-driven revenue", "Advertising-driven revenue", "Donation-driven revenue", "Licensing-driven revenue"]; answer = 1 },
        ] },
        { questId = 8; questions = [
            { text = "What technology are cryptocurrencies based on, according to the page?"; options = ["Blockchain, a tamper-resistant transaction record", "Online banking, a secure customer account system", "Cloud storage, a remote file-saving service", "Mobile payments, a phone-based wallet system"]; answer = 0 },
            { text = "According to the page, how does Bitcoin check that a payment went through?"; options = ["A bank or other financial institution checks it", "Automatically, without a central authority", "A government office reviews each payment", "A payment company confirms each transaction"]; answer = 1 },
            { text = "How are cryptocurrencies taxed in the U.S., according to the page?"; options = ["As currency, the same as dollars", "As stock, the same as company shares", "As property, not as currency", "As a tax-free digital asset"]; answer = 2 },
        ] },
        { questId = 9; questions = [
            { text = "How much ETH must a person deposit to run a validator on Ethereum's proof-of-stake network?"; options = ["1 ETH", "8 ETH", "32 ETH", "64 ETH"]; answer = 2 },
            { text = "According to the page, how is the block proposer chosen in each slot?"; options = ["The validator with the most ETH staked", "Picked at random each slot", "The validator that has waited longest since its last turn", "The first validator to solve a puzzle"]; answer = 1 },
            { text = "What can happen to a validator that tries to defraud the network?"; options = ["It only loses future rewards, never its stake", "It is removed, and its stake is returned", "It only gets a warning message", "It can lose some or all of its staked ETH"]; answer = 3 },
        ] },
        { questId = 10; questions = [
            { text = "According to the page, when must a flash loan be paid back?"; options = ["Within one day", "Within the same transaction", "Within one week", "Within thirty days"]; answer = 1 },
            { text = "In the page's PoolTogether no-loss lottery example, where does the prize pool come from?"; options = ["Small fees taken from players who do not win", "Profits made by trading the deposits on exchanges", "Grants paid by the PoolTogether team", "Interest from lending the ticket deposits"]; answer = 3 },
            { text = "In quadratic funding, which projects get the highest amount from the matching pool?"; options = ["Those that received the biggest single donation", "Those whose round started first", "Those with the most unique demand", "Those chosen by the pool donors in a final vote"]; answer = 2 },
        ] },
        { questId = 11; questions = [
            { text = "How is an NFT different from a token such as USDC?"; options = ["Each NFT can only be held by its creator", "Each NFT can be split into smaller parts", "Each NFT is backed by a fixed dollar value", "Each NFT is individually unique"]; answer = 3 },
            { text = "What does \"minting\" an NFT mean?"; options = ["Buying an NFT from its creator", "Listing an NFT for sale", "Moving an NFT to a new wallet", "Creating a new NFT that you own"]; answer = 3 },
            { text = "Where is the record of who owns an NFT stored, according to the page?"; options = ["In the marketplace where it was first sold", "In the wallet app that holds the NFT", "On the Ethereum blockchain", "In a record that only the creator can read"]; answer = 2 },
        ] },
        { questId = 12; questions = [
            { text = "What does the Motoko Playground let you do?"; options = ["Build and deploy Motoko canisters directly in the browser", "Build Motoko canisters in the browser, but deploy them from a terminal", "Write Motoko code in the browser, but run it only on your own computer", "Deploy Motoko canisters only after you set up a local dev environment"]; answer = 0 },
            { text = "How long is each deployed canister available in the playground?"; options = ["5 minutes", "1 hour", "24 hours", "20 minutes"]; answer = 3 },
            { text = "According to the README, why does the playground require a proof of work when you request a canister ID?"; options = ["To check that the Motoko code compiles first", "To make sure resources are shared fairly", "To confirm the user has a funded wallet", "To prove the user owns the imported code"]; answer = 1 },
        ] },
    ];
}
