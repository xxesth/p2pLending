"use client";

import { useState, useEffect } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORACLE_ADDRESS, ORACLE_ABI, PLATFORM_ADDRESS, PLATFORM_ABI, TOKEN_ADDRESS, TOKEN_ABI } from "@/lib/constants";
import { useLoans } from "@/hooks/useLoans";
import { formatEther } from "viem";
import { toast } from "sonner";
import { useAccount } from "wagmi";
import { RefreshCw, ArrowDownToLine } from "lucide-react"; // Make sure to install lucide-react or remove icons if not needed

export function AdminPanel() {
  const { address } = useAccount();
  const [manualPrice, setManualPrice] = useState("2000");
  const [realPrice, setRealPrice] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(true);

  const { writeContract } = useWriteContract();
  const { loans, refetch } = useLoans();
  
  // Faucet Logic
  const { refetch: refetchBalance } = useReadContract({
      address: TOKEN_ADDRESS,
      abi: TOKEN_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
  });

  // --- FETCH REAL WORLD PRICE ---
  const fetchRealPrice = async () => {
    try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd");
        const data = await response.json();
        const price = data.ethereum.usd.toString();
        setRealPrice(price);
        return price;
    } catch (error) {
        toast.error("Failed to fetch price from CoinGecko");
        return null;
    }
  };

  // Poll price when in Real Mode
  useEffect(() => {
    if (!isManualMode) {
        fetchRealPrice();
        const interval = setInterval(fetchRealPrice, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }
  }, [isManualMode]);


  const handleMint = () => {
    writeContract({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "faucet",
        args: []
    }, {
        onSuccess: () => {
            toast.success("Minting...");
            setTimeout(() => refetchBalance(), 3000);
        }
    });
  };

  const updateOracle = (priceValue: string) => {
    if (!priceValue) return;
    const priceInt = BigInt(Math.floor(Number(priceValue) * 100000000));
    
    writeContract({
        address: ORACLE_ADDRESS,
        abi: ORACLE_ABI,
        functionName: "updatePrice",
        args: [priceInt]
    }, {
        onSuccess: () => toast.success(`Oracle Updated to $${priceValue}`)
    });
  };

  const handleLiquidate = (loan: any) => {
    writeContract({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "approve",
        args: [PLATFORM_ADDRESS, loan.amount]
    }, {
        onSuccess: () => {
            toast.info("Approved. Liquidating now...");
            setTimeout(() => {
                writeContract({
                    address: PLATFORM_ADDRESS,
                    abi: PLATFORM_ABI,
                    functionName: "liquidate",
                    args: [loan.id]
                }, {
                    onSuccess: () => {
                        toast.success("Liquidated successfully!");
                        setTimeout(() => refetch(), 2000);
                    }
                });
            }, 2000);
        }
    });
  };

  const fundedLoans = loans.filter(l => l.active && l.funded);

  return (
    <div className="mt-8 p-6 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
        <h2 className="text-xl font-bold text-red-600 mb-6">⚠️ Admin / Demo Controls</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Faucet */}
            <div className="p-4 bg-white dark:bg-black rounded-lg border">
                <h3 className="text-sm font-semibold mb-2">1. Test Token Faucet</h3>
                <Button onClick={handleMint} variant="secondary" className="w-full">
                    Mint 1000 DUSD
                </Button>
            </div>

            {/* Oracle Control */}
            <div className="p-4 bg-white dark:bg-black rounded-lg border">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-semibold">2. Oracle Connection</h3>
                    <div className="flex gap-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-md">
                        <button 
                            onClick={() => setIsManualMode(true)}
                            className={`text-xs px-3 py-1 rounded ${isManualMode ? 'bg-white shadow text-black' : 'text-zinc-500'}`}
                        >
                            Manual
                        </button>
                        <button 
                            onClick={() => setIsManualMode(false)}
                            className={`text-xs px-3 py-1 rounded ${!isManualMode ? 'bg-white shadow text-black' : 'text-zinc-500'}`}
                        >
                            Real (API)
                        </button>
                    </div>
                </div>

                {isManualMode ? (
                    <div className="flex gap-2">
                        <Input 
                            type="number" 
                            value={manualPrice} 
                            onChange={e => setManualPrice(e.target.value)} 
                        />
                        <Button variant="destructive" onClick={() => updateOracle(manualPrice)}>Set</Button>
                    </div>
                ) : (
                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Current Market Price:</span>
                            <span className="font-bold font-mono">${realPrice || "Loading..."}</span>
                        </div>
                        <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700" 
                            onClick={() => realPrice && updateOracle(realPrice)}
                            disabled={!realPrice}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sync Oracle to Market
                        </Button>
                        <p className="text-[10px] text-muted-foreground text-center">
                            Fetches from CoinGecko -{">"} Updates Local Smart Contract
                        </p>
                    </div>
                )}
            </div>
        </div>

        <div className="p-4 bg-blue-100 dark:bg-blue-950 rounded border border-blue-200 text-center mb-6">
            <h3 className="font-bold text-blue-700 dark:text-blue-300">🤖 Bot Status</h3>
            <p className="text-sm">
                Run <code>npx hardhat run scripts/bot.ts --network localhost</code> in a separate terminal to enable automatic liquidation.
            </p>
        </div>

        <h3 className="font-semibold mb-2 text-red-700">3. Manual Liquidation Override</h3>
        {fundedLoans.length === 0 && <p className="text-sm text-muted-foreground italic">No active funded loans found.</p>}
        
        <div className="space-y-2">
            {fundedLoans.map(loan => (
                <div key={loan.id.toString()} className="flex justify-between items-center p-3 bg-white dark:bg-black rounded border border-red-100">
                    <div className="text-sm">
                        <span className="font-bold mr-2">Loan #{loan.id.toString()}</span>
                         | Amt: {formatEther(loan.amount)} DUSD
                    </div>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleLiquidate(loan)}>
                        ⚡ Liquidate
                    </Button>
                </div>
            ))}
        </div>
    </div>
  );
}