"use client";

import { useLoans } from "@/hooks/useLoans";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"; 
import { PLATFORM_ADDRESS, PLATFORM_ABI, TOKEN_ADDRESS, TOKEN_ABI } from "@/lib/constants";
import { formatEther } from "viem";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { History, Coins, FileCheck } from "lucide-react"; 

export function ProfileView() {
  const { address } = useAccount();
  const { loans, refetch } = useLoans(); 
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

  const copyToClipboard = (text: string) => {
    if(!text || text === "0x0") return;
    navigator.clipboard.writeText(text);
    toast.success("Hash copied!");
  };

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
                        toast.success("Repaid!");
                        setTimeout(() => refetch(), 2000);
                    }
                });
             }, 2000);
        }
    });
  };

  if (!address) return <div>Please connect wallet.</div>;

  const myActiveLoans = loans.filter(l => l.borrower === address && l.active);
  const myActiveInvestments = loans.filter(l => l.lender === address && l.active);
  const myHistory = loans.filter(l => !l.active && (l.borrower === address || l.lender === address));

  return (
    <div className="space-y-8">
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-zinc-100 to-zinc-200 rounded-lg dark:from-zinc-800 dark:to-zinc-900">
            <div>
                <h2 className="text-lg font-semibold">Reputation Score</h2>
                <span className="text-4xl font-bold text-blue-600">
                    {reputation ? reputation.toString() : "0"}
                </span>
            </div>

            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <History className="w-4 h-4" /> History
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Loan History</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-4">
                        {myHistory.length === 0 && <p className="text-muted-foreground text-center">No history.</p>}
                        {myHistory.map(loan => (
                            <div key={loan.id.toString()} className="p-4 border rounded bg-zinc-50 dark:bg-zinc-900/50">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="secondary">{loan.borrower === address ? "Borrowed" : "Invested"}</Badge>
                                        <span className="font-bold text-sm">#{loan.id.toString()}</span>
                                    </div>
                                    <Badge className="bg-zinc-500">Closed</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>Amount: {formatEther(loan.amount)} DUSD</div>
                                    <div>Collateral: {formatEther(loan.collateralAmount)} ETH</div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-dashed">
                                    <p className="text-[10px] text-zinc-400 font-mono break-all">
                                        HASH: {loan.loanAgreementHash}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>

        {/* ACTIVE DEBTS */}
        <div>
            <h3 className="text-xl font-bold mb-4">My Active Debts</h3>
            {myActiveLoans.length === 0 && <p className="text-muted-foreground italic">No active debts.</p>}
            <div className="space-y-4">
                {myActiveLoans.map(loan => (
                    <Card key={loan.id.toString()}>
                        <CardHeader className="pb-2">
                             <div className="flex justify-between">
                                <CardTitle className="text-base">Loan #{loan.id.toString()}</CardTitle>
                                {loan.funded ? <Badge className="bg-green-600">Funded</Badge> : <Badge variant="secondary">Pending</Badge>}
                             </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <p className="font-bold text-lg">{formatEther(loan.amount)} DUSD</p>
                                    <p className="text-sm text-muted-foreground">Reason: {getReason(loan.ipfsHash)}</p>
                                </div>
                                {loan.funded && <Button onClick={() => handleRepay(loan)}>Repay Loan</Button>}
                            </div>
                            
                            <div className="flex items-center gap-2 mb-2 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 p-2 rounded">
                                <Coins className="w-4 h-4 text-yellow-500" />
                                Collateral Locked: <span className="font-bold">{formatEther(loan.collateralAmount)} ETH</span>
                            </div>

                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800" onClick={() => copyToClipboard(loan.loanAgreementHash)}>
                                <div className="flex items-center gap-2 text-zinc-400 cursor-pointer hover:text-blue-500">
                                    <FileCheck className="w-3 h-3" />
                                    <code className="text-xs font-mono truncate max-w-[250px]">
                                        {loan.loanAgreementHash || "No Hash Found (Check Console)"}
                                    </code>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

        {/* ACTIVE INVESTMENTS */}
        <div>
            <h3 className="text-xl font-bold mb-4">My Investments</h3>
            {myActiveInvestments.length === 0 && <p className="text-muted-foreground italic">No active investments.</p>}
            <div className="space-y-4">
                {myActiveInvestments.map(loan => (
                    <Card key={loan.id.toString()} className="border-green-200 bg-green-50 dark:bg-green-950/10">
                         <CardHeader className="pb-2">
                             <CardTitle className="text-base">Investment #{loan.id.toString()}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between mb-4">
                                <div>
                                    <p className="font-bold">{formatEther(loan.amount)} DUSD</p>
                                    {/* FIX: Full Address Display */}
                                    <p className="text-sm text-muted-foreground font-mono bg-zinc-100 dark:bg-zinc-800 p-1 rounded inline-block">
                                        Borrower: {loan.borrower}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-green-600">+{formatEther(loan.interest)} DUSD</p>
                                </div>
                            </div>

                             <div className="flex items-center gap-2 mb-2 text-sm text-zinc-600 dark:text-zinc-300 bg-white/50 dark:bg-black/20 p-2 rounded border border-green-100 dark:border-green-900">
                                <Coins className="w-4 h-4 text-yellow-500" />
                                Secured by: <span className="font-bold">{formatEther(loan.collateralAmount)} ETH</span>
                            </div>

                            <div className="pt-2 border-t border-green-200/50" onClick={() => copyToClipboard(loan.loanAgreementHash)}>
                                <div className="flex items-center gap-2 text-green-700/70 cursor-pointer hover:text-green-700">
                                    <FileCheck className="w-3 h-3" />
                                    <code className="text-xs font-mono truncate max-w-[250px]">
                                        {loan.loanAgreementHash || "No Hash Found"}
                                    </code>
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