"use client";

import { useLoans, Loan } from "@/hooks/useLoans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEther } from "viem";
import { useAccount, useWriteContract, useReadContract } from "wagmi";
import { PLATFORM_ADDRESS, PLATFORM_ABI, TOKEN_ADDRESS, TOKEN_ABI } from "@/lib/constants";
import { toast } from "sonner";
import { useState } from "react";
import { Copy, Coins } from "lucide-react"; 

export function LendList() {
  const { loans, loading, refetch } = useLoans();
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [processingLoanId, setProcessingLoanId] = useState<bigint | null>(null);

  const { data: balance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 2000 }
  });

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success("Loan Hash copied!");
  };

  const getReason = (fakeHash: string) => {
    try { return atob(fakeHash.substring(2)); } catch { return "Unknown"; }
  };

  const handleFund = async (loan: Loan) => {
    setProcessingLoanId(loan.id);
    writeContract({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "approve",
        args: [PLATFORM_ADDRESS, loan.amount]
    }, {
        onSuccess: () => {
            toast.success("Approved. Funding...");
            setTimeout(() => {
                writeContract({
                    address: PLATFORM_ADDRESS,
                    abi: PLATFORM_ABI,
                    functionName: "fundLoan",
                    args: [loan.id]
                }, {
                    onSuccess: () => {
                        toast.success("Funded!");
                        setProcessingLoanId(null);
                        setTimeout(() => refetch(), 2000);
                    },
                    onError: () => setProcessingLoanId(null)
                });
            }, 2000);
        },
        onError: () => setProcessingLoanId(null)
    });
  };

  if (loading) return <div>Loading loans...</div>;

  const availableLoans = loans.filter(l => l.active && !l.funded);
  const currentBalance = balance ? (balance as bigint) : BigInt(0);

  return (
    <div className="grid grid-cols-1 gap-4">
      {availableLoans.length === 0 && <p className="text-center text-muted-foreground mt-4">No active loan requests.</p>}
      
      {availableLoans.map((loan) => {
        const isInsufficient = currentBalance < loan.amount;
        const isOwner = loan.borrower === address;
        const isProcessing = processingLoanId === loan.id;

        return (
            <Card key={loan.id.toString()}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">Loan #{loan.id.toString()}</CardTitle>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                    Req: {formatEther(loan.amount)} DUSD
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="mb-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-sm italic text-zinc-600">
                    "{getReason(loan.ipfsHash)}"
                </div>
                
                {/* --- COLLATERAL & INTEREST GRID --- */}
                <div className="grid grid-cols-2 gap-4 mb-4 p-3 border rounded-lg bg-zinc-50 dark:bg-zinc-900/50">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Profit (Interest)</p>
                        <p className="font-bold text-green-600">+{formatEther(loan.interest)} DUSD</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Locked Collateral</p>
                        <div className="flex items-center gap-1 font-bold text-zinc-700 dark:text-zinc-300">
                            <Coins className="w-4 h-4 text-yellow-500" />
                            {formatEther(loan.collateralAmount)} ETH
                        </div>
                    </div>
                </div>

                {/* --- HASH DISPLAY --- */}
                <div 
                    className="flex items-center gap-2 mb-4 p-1 px-2 bg-zinc-50 dark:bg-zinc-900 border border-dashed rounded cursor-pointer hover:bg-zinc-100 group"
                    onClick={() => copyHash(loan.loanAgreementHash)}
                >
                    <span className="text-[10px] text-zinc-400 font-bold">HASH:</span>
                    <code className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">
                        {loan.loanAgreementHash}
                    </code>
                    <Copy className="w-3 h-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <Button 
                    className="w-full" 
                    onClick={() => handleFund(loan)}
                    disabled={isOwner || isProcessing || isInsufficient} 
                    variant={isInsufficient ? "destructive" : "default"}
                >
                    {isProcessing ? "Processing..." : isOwner ? "Cannot Fund Own Loan" : isInsufficient ? "Insufficient Balance" : "Approve & Fund"}
                </Button>
            </CardContent>
            </Card>
        );
      })}
    </div>
  );
}