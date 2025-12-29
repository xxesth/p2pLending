"use client";

import { useLoans } from "@/hooks/useLoans";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added Header/Title
import { PLATFORM_ADDRESS, PLATFORM_ABI, TOKEN_ADDRESS, TOKEN_ABI } from "@/lib/constants";
import { formatEther } from "viem";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function ProfileView() {
  const { address } = useAccount();
  const { loans, refetch } = useLoans(); // Get refetch
  const { writeContract } = useWriteContract();

  const { data: reputation } = useReadContract({
    address: PLATFORM_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: "reputation",
    args: address ? [address] : undefined,
    query: { enabled: !!address }
  });

  const getReason = (fakeHash: string) => {
    try { return atob(fakeHash.substring(2)); } catch { return "Unknown"; }
  };

  const myLoans = address ? loans.filter(l => l.borrower === address && l.active) : [];
  const myInvestments = address ? loans.filter(l => l.lender === address && l.active) : [];

  const handleRepay = (loan: any) => {
    const totalRepay = loan.amount + loan.interest;
    writeContract({
        address: TOKEN_ADDRESS,
        abi: TOKEN_ABI,
        functionName: "approve",
        args: [PLATFORM_ADDRESS, totalRepay]
    }, {
        onSuccess: () => {
             toast.info("Approved! Repaying...");
             setTimeout(() => {
                writeContract({
                    address: PLATFORM_ADDRESS,
                    abi: PLATFORM_ABI,
                    functionName: "repayLoan",
                    args: [loan.id]
                }, {
                    onSuccess: () => {
                        toast.success("Repaid! Reputation Up.");
                        setTimeout(() => refetch(), 2000);
                    }
                });
             }, 2000);
        }
    });
  };

  if (!address) return <div>Please connect wallet.</div>;

  return (
    <div className="space-y-8">
        {/* REPUTATION HEADER */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-zinc-100 to-zinc-200 rounded-lg dark:from-zinc-800 dark:to-zinc-900">
            <div>
                <h2 className="text-lg font-semibold">Reputation Score</h2>
                <p className="text-sm text-muted-foreground">Higher score = Lower collateral required</p>
            </div>
            <span className="text-4xl font-bold text-blue-600">
                {reputation ? reputation.toString() : "0"}
            </span>
        </div>

        {/* SECTION 1: MY DEBTS */}
        <div>
            <h3 className="text-xl font-bold mb-4">My Debts (Loans I took)</h3>
            {myLoans.length === 0 && <p className="text-muted-foreground italic">You have no active debts.</p>}
            <div className="space-y-4">
                {myLoans.map(loan => (
                    <Card key={loan.id.toString()}>
                        <CardHeader className="pb-2">
                             <div className="flex justify-between">
                                <CardTitle className="text-base">Loan #{loan.id.toString()}</CardTitle>
                                {loan.funded ? <Badge className="bg-green-600">Funded</Badge> : <Badge variant="secondary">Pending</Badge>}
                             </div>
                        </CardHeader>
                        <CardContent className="flex justify-between items-center">
                            <div>
                                <p className="font-bold text-lg">{formatEther(loan.amount)} DUSD</p>
                                <p className="text-sm text-muted-foreground">Reason: {getReason(loan.ipfsHash)}</p>
                                <p className="text-sm text-red-500 mt-1">Repayment: {formatEther(loan.amount + loan.interest)} DUSD</p>
                            </div>
                            {loan.funded && (
                                <Button onClick={() => handleRepay(loan)}>Repay Loan</Button>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

        {/* SECTION 2: MY INVESTMENTS */}
        <div>
            <h3 className="text-xl font-bold mb-4">My Investments (Loans I funded)</h3>
            {myInvestments.length === 0 && <p className="text-muted-foreground italic">You haven't funded any loans.</p>}
            <div className="space-y-4">
                {myInvestments.map(loan => (
                    <Card key={loan.id.toString()} className="border-green-200 bg-green-50 dark:bg-green-950/10">
                         <CardHeader className="pb-2">
                             <CardTitle className="text-base">Investment #{loan.id.toString()}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between">
                                <div>
                                    <p className="font-bold">{formatEther(loan.amount)} DUSD</p>
                                    <p className="text-sm text-muted-foreground">Borrower: {loan.borrower.slice(0,6)}...</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">Exp. Return: +{formatEther(loan.interest)}</p>
                                    <p className="text-xs text-muted-foreground">Collateral Locked: {formatEther(loan.collateralAmount)} ETH</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    </div>
  );
}