"use client";

import { useLoans, Loan } from "@/hooks/useLoans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEther } from "viem";
import { useAccount, useWriteContract } from "wagmi";
import { PLATFORM_ADDRESS, PLATFORM_ABI, TOKEN_ADDRESS, TOKEN_ABI } from "@/lib/constants";
import { toast } from "sonner";
import { useState } from "react";

export function LendList() {
  const { loans, loading, refetch } = useLoans();
  const { address } = useAccount();
  const { writeContract } = useWriteContract();
  const [processingLoanId, setProcessingLoanId] = useState<bigint | null>(null);

  // Helper to decode the fake IPFS hash
  const getReason = (fakeHash: string) => {
    try {
        // We added "Qm" manually, so we remove it. 
        // Then we try to decode the base64 string we created.
        const clean = fakeHash.substring(2);
        return atob(clean);
    } catch (e) {
        return "Unknown Reason";
    }
  };

  const handleFund = async (loan: Loan) => {
    setProcessingLoanId(loan.id);
    toast.info("Step 1: Approving...");
    writeContract({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "approve",
        args: [PLATFORM_ADDRESS, loan.amount]
    }, {
        onSuccess: async () => {
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

  return (
    <div className="grid grid-cols-1 gap-4">
      {availableLoans.length === 0 && <p className="text-center text-muted-foreground mt-4">No active loan requests.</p>}
      
      {availableLoans.map((loan) => (
        <Card key={loan.id.toString()}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Loan #{loan.id.toString()}</CardTitle>
            <Badge variant="outline">Req: {formatEther(loan.amount)} DUSD</Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded text-sm italic text-zinc-600">
                "{getReason(loan.ipfsHash)}"
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>Interest: <span className="text-green-500">+{formatEther(loan.interest)} DUSD</span></div>
                <div>Collateral: {formatEther(loan.collateralAmount)} ETH</div>
            </div>
            <Button 
                className="w-full" 
                onClick={() => handleFund(loan)}
                disabled={loan.borrower === address || processingLoanId === loan.id} 
            >
                {processingLoanId === loan.id ? "Processing..." : 
                 loan.borrower === address ? "Cannot Fund Own Loan" : "Approve & Fund"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}