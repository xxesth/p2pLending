"use client";

import { useState } from "react";
import { useWriteContract, useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ORACLE_ADDRESS, ORACLE_ABI, PLATFORM_ADDRESS, PLATFORM_ABI, TOKEN_ADDRESS, TOKEN_ABI } from "@/lib/constants";
import { useLoans } from "@/hooks/useLoans";
import { formatEther } from "viem";
import { toast } from "sonner";
import { useAccount } from "wagmi";

export function AdminPanel() {
  const { address } = useAccount();
  const [newPrice, setNewPrice] = useState("2000");
  const { writeContract } = useWriteContract();
  const { loans, refetch } = useLoans(); // We grab refetch here

  // Faucet Logic
  const { data: balance, refetch: refetchBalance } = useReadContract({
      address: TOKEN_ADDRESS,
      abi: TOKEN_ABI,
      functionName: "balanceOf",
      args: address ? [address] : undefined,
  });

  const handleMint = () => {
    writeContract({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "faucet",
        args: []
    }, {
        onSuccess: () => {
            toast.success("Minting... Wait for confirmation");
            // Poll for update
            setTimeout(() => refetchBalance(), 3000);
        }
    });
  };

  const updateOracle = () => {
    const priceInt = BigInt(Math.floor(Number(newPrice) * 100000000));
    writeContract({
        address: ORACLE_ADDRESS,
        abi: ORACLE_ABI,
        functionName: "updatePrice",
        args: [priceInt]
    }, {
        onSuccess: () => toast.success("Oracle Updated! Check the header.")
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
                        // Force refresh the list after 2 seconds
                        setTimeout(() => refetch(), 2000);
                    }
                });
            }, 2000);
        }
    });
  };

  const fundedLoans = loans.filter(l => l.active && l.funded);

  return (
    <div className="mt-8 space-y-6">
        {/* FAUCET SECTION */}
        <div className="p-4 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex justify-between items-center">
            <div>
                <h3 className="font-bold text-blue-700">Test Token Faucet</h3>
                <p className="text-sm text-blue-600">Your Balance: {balance ? formatEther(balance as bigint) : "0"} DUSD</p>
            </div>
            <Button onClick={handleMint}>Mint 1000 DUSD</Button>
        </div>

        {/* ORACLE & LIQUIDATION SECTION */}
        <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-950/20">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-red-600">⚠️ Admin / Liquidation Demo</h2>
                <Button variant="outline" size="sm" onClick={() => refetch()}>Refresh Data</Button>
            </div>
            
            <div className="flex gap-4 items-end mb-6">
                <div className="w-full max-w-xs">
                    <label className="text-sm font-medium">Set Mock ETH Price ($)</label>
                    <Input 
                        type="number" 
                        value={newPrice} 
                        onChange={e => setNewPrice(e.target.value)} 
                    />
                </div>
                <Button variant="destructive" onClick={updateOracle}>Update Oracle</Button>
            </div>

            <h3 className="font-semibold mb-2">Active Loans (Eligible for Liquidation?)</h3>
            {fundedLoans.length === 0 && <p className="text-sm text-muted-foreground">No active funded loans.</p>}
            
            <div className="space-y-2">
                {fundedLoans.map(loan => (
                    <div key={loan.id.toString()} className="flex justify-between items-center p-3 bg-white dark:bg-black rounded border">
                        <div className="text-sm">
                            <span className="font-bold">Loan #{loan.id.toString()}</span>
                            <span className="mx-2">|</span>
                            Borrower: {loan.borrower.slice(0,6)}...
                            <span className="mx-2">|</span>
                            Amt: {formatEther(loan.amount)} DUSD
                        </div>
                        <Button size="sm" variant="outline" className="border-red-200 hover:bg-red-100" onClick={() => handleLiquidate(loan)}>
                            ⚡ Liquidate
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
}