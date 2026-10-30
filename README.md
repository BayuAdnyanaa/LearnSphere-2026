# LearnSphere: Your Gamified Gateway to Web3

![tag:innovationlab](https://img.shields.io/badge/innovationlab-3D8BD3)
![tag:internetcomputer](https://img.shields.io/badge/internetcomputer-3D8BD3)

**LearnSphere** is a "learn-to-earn" decentralized application (dApp) designed to make education in Web3 accessible, engaging, and rewarding. It transforms the complex world of blockchain, the Internet Computer Protocol (ICP), and AI agents into a gamified adventure where users complete quests, earn rewards, and level up their skills.

**Agent Address**: 
agent1qghztqzczs2ge47xz7xr3vduust7zagw4zfdefpeg74e253paquf6gwr0lu

Bast's Descent :
- [Brrendenn](https://github.com/Brrendenn)
- [BayuAdnyanaa](https://github.com/BayuAdnyanaa)

---

## The Problem

The world of Web3 is expanding rapidly, but for newcomers, it presents a steep and fragmented learning curve. Aspiring developers and enthusiasts often face a scattered landscape of complex information, creating a significant barrier to entry that can be discouraging. Without a clear starting point or structured path, motivation quickly wanes.

**LearnSphere** solves this by providing a curated, incentive-driven educational platform, complete with an AI-powered assistant to guide users on their journey.

---

## ✨ Features

- **Gamified Learning Quests**: A structured curriculum of quests covering foundational topics like Web3, ICP, Fetch.ai, DeFi, and more.
- **Learn-to-Earn Model**: Users are rewarded with tokens and experience points for completing quests, creating a powerful incentive to stay engaged.
- **On-Chain Progress**: All user stats, including completed quests and rewards, are stored on the Internet Computer blockchain, ensuring transparency and ownership.
- **AI-Powered Chat Assistant**: An integrated chatbot, built with Fetch.ai uAgents, acts as a personal tutor, offering instant support and guidance.
- **Interactive Frontend**: A sleek and responsive user interface built with React and Tailwind CSS provides a seamless user experience.
- **Decentralized Backend**: The entire application logic is hosted on-chain through Motoko smart contracts on the Internet Computer.

---

## 🛠️ Tech Stack

This project is a full-stack dApp combining a decentralized backend with a modern web frontend.

| Category      | Technology                                                                                                  |
| :------------ | :---------------------------------------------------------------------------------------------------------- |
| **Frontend** | [React](https://reactjs.org/), [Vite](https://vitejs.dev/), [Tailwind CSS](https://tailwindcss.com/)           |
| **Backend** | [Motoko](https://internetcomputer.org/docs/current/motoko/main/motoko)                                      |
| **Blockchain**| [Internet Computer (ICP)](https://internetcomputer.org/)                                                      |
| **AI Tutor** | [DFINITY LLM canister](https://docs.internetcomputer.org/guides/backends/ai-inference/) (Llama 3.1 8B)            |

---

## 🏛️ Architecture

LearnSphere is a full-stack decentralized application composed of three core components:

1.  **Frontend (React SPA)**: A modern, responsive single-page application built with React and Vite. It serves as the primary user interface, allowing users to browse quests, view their stats, and interact with the AI assistant. It communicates directly with the backend canister on the Internet Computer.

2.  **Backend (ICP Motoko Canister)**: The core logic of the application resides in a Motoko smart contract (an "actor") running on the Internet Computer. This canister is responsible for:
    - Storing and managing all quest data.
    - Tracking user profiles, progress, and rewards on-chain.
    - Handling the logic for quest completion and reward distribution.

3.  **AI Tutor**: The backend canister forwards a learner's question, with the titles and reading pages of their quests, to the DFINITY LLM canister. The tutor never receives quiz questions or answers. The canister limits each learner to 20 questions a day and the whole app to 1,000.

---

## 🔬 Core Technologies Used

### Internet Computer (ICP) Features

-   **Canisters (Smart Contracts)**: The entire backend is encapsulated in a Motoko canister, providing a secure, unstoppable, and serverless application logic layer.
-   **Stable Memory**: User data and quest information are stored in stable variables, ensuring that all state is preserved across canister upgrades without data loss.
-   **Internet Identity**: User authentication and session management are tied to the user's Principal ID, a core feature of ICP's identity layer. This provides a secure and anonymous way to manage user accounts.
-   **On-Chain Data Storage**: All user progress, including completed quests, tokens, and experience points, is stored directly on the blockchain, providing a transparent and tamper-proof record.

---

## 🧗 Challenges Faced

Developing a full-stack dApp across multiple ecosystems presented several challenges:

-   **Asynchronous State Management**: Synchronizing the React frontend's state with the asynchronous, on-chain state of the Motoko canister required careful management of promises and loading states to ensure a smooth user experience.
-   **Canister Upgrade Persistence**: Ensuring that all user data stored in the backend canister was correctly preserved during upgrades was a critical challenge, solved by using Motoko's `stable` variables and `preupgrade`/`postupgrade` system functions.
-   **Decentralized Communication**: Establishing a secure and reliable communication channel between the browser-based frontend and the Python-based Fetch.ai agent involved creating temporary user wallets on the fly and signing messages correctly.

---

## 🚀 Future Plans

LearnSphere is a foundational platform with exciting potential for growth. Future plans include:

-   **Expanded Quest Library**: Adding more advanced quests covering topics like advanced Motoko, token standards (ICRC-1), and inter-canister calls.
-   **Tokenomics**: Introducing a proper fungible token for rewards that could be used within the ecosystem or traded.
-   **Leaderboards & Social Features**: Building a competitive leaderboard to showcase top learners and adding features for users to share their progress.
-   **User-Generated Quests**: Allowing the community to create and submit their own quests for others to complete.

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20 or later)
- `dfx` **0.31.0** (pinned in `dfx.json`). Install it with [dfxvm](https://github.com/dfinity/dfxvm): `sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"`, then `dfxvm install 0.31.0`. dfx 0.32.0 cannot start the local network (PocketIC returns 400).
- On Windows: WSL2 with Ubuntu. `dfx` does not run on Windows directly.
- [Python](https://www.python.org/downloads/) (v3.8 or later), only for the chat agent.

### Installation & Setup

On Windows, run `dfx` inside WSL and run `npm` and Vite on Windows. Do not share one `node_modules` folder between Windows and WSL.

1.  **Clone the repository** (outside OneDrive; enable long paths on Windows):
    ```sh
    git clone -c core.longpaths=true https://github.com/BayuAdnyanaa/LearnSphere.git
    ```

2.  **Install frontend dependencies** (Windows or your normal shell):
    ```sh
    cd frontend
    npm ci
    ```

3.  **Start the local network** (WSL / Linux / macOS), and keep this terminal open:
    ```sh
    dfx start --clean
    ```
    On WSL, run `dfx start` in the foreground. WSL stops the Ubuntu VM shortly after the last `wsl.exe` command exits, so `dfx start --background` from a one-off `wsl -- ...` call dies with it.

4.  **Deploy the backend and the local Internet Identity** (second WSL terminal, from the repo root):
    ```sh
    dfx deploy learnsphere_backend
    dfx generate learnsphere_backend
    ```
    `learnsphere_backend` depends on `internet_identity` in `dfx.json`, so the first command deploys both. `dfx` writes both canister IDs to `.env` at the repo root. Vite reads that file (`envDir: ".."` in `frontend/vite.config.js`).

    The `internet_identity` canister is the II **dev** build from release `release-2026-02-28` with the captcha off and dummy authentication on, so you can create test identities without a passkey. It is for local use only. On mainnet the app uses the public II.

    To upgrade the backend and keep user progress:
    ```sh
    dfx canister install learnsphere_backend --mode upgrade --wasm-memory-persistence keep
    ```

5.  **Run the frontend:**
    ```sh
    cd frontend
    npm run dev
    ```
    Open `http://localhost:5173` and log in with Internet Identity.

6.  **AI tutor:** the LLM canister does not run on a local replica. Locally, `dfx deploy` builds a mock (`backend/src/llm_mock`) that returns a fixed reply. On mainnet the `llm` canister maps to the real one.

The local network is ephemeral: `dfx start --clean` or stopping the network deletes all progress.

---
