# P2P Lending DApp with Reputation & Collateral

A decentralized lending platform where users can borrow stablecoins (DUSD) against ETH collateral. The system features a reputation system that lowers collateral requirements for good borrowers and an admin interface to demonstrate liquidation events.

## 🏗 Architecture

- **Blockchain:** Ethereum (Local Hardhat Network)
- **Smart Contracts:** Solidity 0.8.20
- **Frontend:** Next.js (App Router), Shadcn UI, Wagmi/Viem
- **Oracle:** Mock Chainlink Aggregator
- **Cryptography:** ECDSA (Transactions) + Keccak256 (Loan Agreement Hashing)

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MetaMask Wallet (Browser Extension)

### 1. Automatic Setup
Run the setup script to install all dependencies:
```bash
./setup.sh
