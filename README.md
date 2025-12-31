# P2P Lending DApp with Reputation & Collateral

A decentralized lending platform built on Ethereum. Users can borrow stablecoins (DUSD) by locking ETH as collateral. The system features a Soulbound-style reputation system that dynamically lowers collateral ratios for good borrowers and includes an admin interface to simulate liquidations via a Mock Oracle.

## 🏗 Architecture

- **Backend:** Hardhat, Solidity (0.8.20), OpenZeppelin
- **Frontend:** Next.js, TypeScript, Tailwind CSS, Shadcn UI
- **Integration:** Wagmi, Viem
- **Key Features:** 
    - ERC-20 Stablecoin Implementation
    - Chainlink Oracle Integration (Mocked for Demo)
    - Cryptographic hashing of loan agreements
    - Dynamic Collateral Ratios based on History

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MetaMask Wallet (Browser Extension)
- Git

### 1. Setup (Installation)

Clone the repository and install dependencies for both the backend and frontend.

```bash
# Using the helper script
./setup.sh

# OR Manual Installation
cd backend && npm install
cd ../frontend && npm install
```

### 2. Run the Project

Running a full-stack DApp requires two separate terminal windows running simultaneously.

#### Terminal 1: The Blockchain
Start the local Hardhat network. This acts as your local Ethereum blockchain server.

```bash
cd backend
npx hardhat node
```
*Keep this terminal open. It will show transaction logs and gas usage.*

#### Terminal 2: Deployment & Application
Deploy the smart contracts and launch the user interface.

```bash
# Using the helper script (Assumes Terminal 1 is running)
./run.sh

# OR Manual Execution
# 1. Deploy contracts (Auto-updates frontend config)
cd backend
npx hardhat run scripts/deploy.ts --network localhost

# 2. Start Frontend
cd ../frontend
npm run dev
```

### Terminal 3: Start Liquidity Bots
```bash
cd backend
npx hardhat run scripts/bot.ts --network localhost
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 How to Demo

### Step 1: Configure MetaMask
1. Open MetaMask settings.
2. Add a **Network Manually**:
   - **RPC URL:** `http://127.0.0.1:8545`
   - **Chain ID:** `31337`
   - **Currency Symbol:** `ETH`
3. **Import Accounts:**
   - In Terminal 1, Hardhat prints 20 accounts with private keys.
   - Import **Account #0** (The Deployer/Borrower).
   - Import **Account #1** (The Lender).

### Step 2: Borrowing (User A)
1. Connect **Account #0**.
2. Navigate to the **Borrow** tab.
3. Request `100` DUSD.
4. Confirm the transaction. You will see your ETH balance decrease (Collateral locked).

### Step 3: Lending (User B)
1. Switch to **Account #1**.
2. Navigate to the **Lend** tab.
3. Click **"Get 1000 Test DUSD"** (Wait for balance update).
4. Approve and Fund the loan request.

### Step 4: Liquidation (Admin Demo)
To demonstrate the safety features of the smart contract:
1. Scroll down to the **Admin / Demo Controls**.
2. Manually change the **Mock ETH Price** from `2000` to `100`.
3. Click **Update Oracle**.
4. Click **Liquidate** on the active loan.
5. Explain: *The contract detected under-collateralization and allowed the liquidation to secure the platform's solvency.*

---

## 📂 Directory Structure

```
my-lending-dapp/
├── backend/
│   ├── contracts/       # Solidity Smart Contracts
│   ├── scripts/         # Deployment & Config Gen Scripts
│   └── hardhat.config.ts
├── frontend/
│   ├── src/app/         # Next.js Pages
│   ├── src/components/  # UI Components
│   └── src/lib/         # Constants.ts (Auto-generated)
├── setup.sh             # Installation Helper
└── run.sh               # Execution Helper
```
