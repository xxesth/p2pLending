import { ethers } from "hardhat";
import { formatEther } from "ethers";

// CONSTANTS
const POLL_INTERVAL = 3000; // Check every 3 seconds

// ⚠️ REPLACE THESE WITH YOUR DEPLOYMENT ADDRESSES (Check Terminal 2)
const PLATFORM_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; 
const TOKEN_ADDRESS =    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 

async function main() {
  console.log("🤖 Liquidation Bot Starting...");
  
  // 1. Setup Liquidator Wallet (Account #2)
  const signers = await ethers.getSigners();
  const botWallet = signers[2]; 
  
  // FIX 1: Use 'getContractAt' for better typing and connection
  const platform = await ethers.getContractAt("LendingPlatform", PLATFORM_ADDRESS, botWallet);
  const token = await ethers.getContractAt("LendingToken", TOKEN_ADDRESS, botWallet);

  console.log(`🤖 Bot Wallet: ${botWallet.address}`);

  // 2. Fund the Bot
  try {
      console.log("💧 Funding Bot with DUSD...");
      // Cast to 'any' to avoid TS errors if abi isn't fully inferred, though getContractAt usually handles it
      const txMint = await (token as any).faucet();
      await txMint.wait();
      
      const txApprove = await (token as any).approve(PLATFORM_ADDRESS, ethers.parseEther("100000"));
      await txApprove.wait();
      console.log("✅ Bot Funded & Approved");
  } catch (e) {
      console.log("⚠️  Could not fund bot (maybe already funded or faucet empty). Continuing...");
  }

  // 3. The Loop
  setInterval(async () => {
    try {
      console.log("--------------------------------");
      console.log("🔍 Scanning for under-collateralized loans...");

      // Call contract read function
      const count = await platform.loanCounter();
      
      for (let i = 1; i <= Number(count); i++) {
        const loan = await platform.loans(i);
        
        // Skip if not active or not funded
        if (!loan.active || !loan.funded) continue;

        // FIX 2: Explicit BigInt Math
        const ethPriceRaw = await platform.getEthPrice();
        
        // In Ethers v6, these are already BigInts, but we force type safety
        const collateralAmt = BigInt(loan.collateralAmount);
        const price = BigInt(ethPriceRaw);
        
        // (Collateral * Price) / 1e18
        const collateralValue = (collateralAmt * price) / BigInt(10n ** 18n);
        
        // Threshold: 105% of Loan Amount
        const loanAmount = BigInt(loan.amount);
        const threshold = (loanAmount * 105n) / 100n; 

        if (collateralValue < threshold) {
          console.log(`🚨 DETECTED BAD LOAN #${i}`);
          console.log(`   Collateral Value: $${formatEther(collateralValue)}`);
          console.log(`   Liquidation Thr:  $${formatEther(threshold)}`);
          console.log(`⚡ LIQUIDATING...`);

          try {
            const tx = await platform.liquidate(i);
            await tx.wait();
            console.log(`✅ Loan #${i} LIQUIDATED by Bot! Profit secured.`);
          } catch (err: any) {
            console.error(`❌ Failed to liquidate #${i}:`, err.message);
          }
        }
      }
    } catch (e) {
      console.error("Bot Scan Error (Ignorable):", e);
    }
  }, POLL_INTERVAL);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});