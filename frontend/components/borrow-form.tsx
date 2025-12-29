"use client";

import { useState } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatUnits } from "viem"; // <--- CHANGED: Import formatUnits
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { PLATFORM_ADDRESS, PLATFORM_ABI, ORACLE_ADDRESS, ORACLE_ABI } from "@/lib/constants";
import { toast } from "sonner";

export function BorrowForm() {
  const [amount, setAmount] = useState("");
  const [interest, setInterest] = useState("");
  const [reason, setReason] = useState("");

  const { writeContract, data: hash, isPending } = useWriteContract();
  
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  const { data: ethPriceData } = useReadContract({
    address: ORACLE_ADDRESS,
    abi: ORACLE_ABI,
    functionName: "latestRoundData",
  });

  const calculateEstimatedCollateral = () => {
    if (!amount || !ethPriceData) return "0";
    
    // FIX: Chainlink Oracle uses 8 decimals, not 18
    const priceRaw = (ethPriceData as any)[1];
    const price = Number(formatUnits(priceRaw, 8)); 
    
    const amountNum = Number(amount);
    
    if (price === 0) return "0";
    
    // Formula: (Loan Amount * 1.5) / ETH Price
    // Example: (1000 * 1.5) / 2000 = 0.75 ETH
    const result = (amountNum * 1.5) / price;
    
    return result.toFixed(4);
  };

  const handleBorrow = async () => {
    if (!amount || !interest) {
        toast.error("Please fill in all fields");
        return;
    }
    
    const fakeIpfsHash = "Qm" + btoa(reason).substring(0, 40); 
    const collateralEth = calculateEstimatedCollateral();
    
    try {
      writeContract({
        address: PLATFORM_ADDRESS,
        abi: PLATFORM_ABI,
        functionName: "createLoanRequest",
        args: [
            parseEther(amount),
            parseEther(interest),
            BigInt(86400 * 7),
            fakeIpfsHash
        ],
        // We add a tiny buffer to the value sent to avoid rounding errors causing reverts
        value: parseEther((Number(collateralEth) * 1.01).toFixed(4)) 
      }, {
        onSuccess: () => {
            toast.success("Transaction sent!");
            setAmount("");
            setInterest("");
            setReason("");
        },
        onError: (err) => {
            toast.error("Transaction failed: " + err.message);
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="space-y-2">
        <Label>Amount to Borrow (DUSD)</Label>
        <Input 
            type="number" 
            placeholder="100" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
        />
      </div>
      
      <div className="space-y-2">
        <Label>Interest to Pay (DUSD)</Label>
        <Input 
            type="number" 
            placeholder="10" 
            value={interest} 
            onChange={(e) => setInterest(e.target.value)} 
        />
      </div>

      <div className="space-y-2">
        <Label>Reason (Stored on IPFS)</Label>
        <Input 
            type="text" 
            placeholder="Business Expansion..." 
            value={reason} 
            onChange={(e) => setReason(e.target.value)} 
        />
      </div>

      <Card className="bg-zinc-100 dark:bg-zinc-800 border-none">
        <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Estimated Collateral Required (150%):</p>
            <p className="text-2xl font-bold">{calculateEstimatedCollateral()} ETH</p>
            <p className="text-xs text-muted-foreground">Based on Oracle Price: ${ethPriceData ? Number(formatUnits((ethPriceData as any)[1], 8)).toFixed(2) : "Loading..."}</p>
        </CardContent>
      </Card>

      <Button 
        className="w-full" 
        onClick={handleBorrow} 
        disabled={isPending || isConfirming}
      >
        {isPending ? "Confirming..." : "Create Loan Request"}
      </Button>
    </div>
  );
}