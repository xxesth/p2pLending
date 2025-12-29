"use client";

import { ConnectWallet } from "@/components/connect-wallet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BorrowForm } from "@/components/borrow-form";
import { LendList } from "@/components/lend-list";
import { ProfileView } from "@/components/profile-view";
import { AdminPanel } from "@/components/admin-panel";
import { useReadContract } from "wagmi";
import { ORACLE_ADDRESS, ORACLE_ABI } from "@/lib/constants";
import { formatUnits } from "viem";

export default function Home() {
  // Read Real-time Oracle Price for Header
  const { data: priceData } = useReadContract({
    address: ORACLE_ADDRESS,
    abi: ORACLE_ABI,
    functionName: "latestRoundData",
    query: {
        refetchInterval: 2000 // Poll every 2 seconds for demo effects
    }
  });

  const currentPrice = priceData ? formatUnits((priceData as any)[1], 8) : "Loading...";

  return (
    <main className="min-h-screen p-8 bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">DeFi P2P Lending</h1>
                <p className="text-muted-foreground">Borrow against your ETH, Repay to earn Reputation.</p>
            </div>
            <ConnectWallet />
        </div>

        <div className="grid grid-cols-1 gap-6 mb-6">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Current Oracle Price (ETH/USD)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${currentPrice}</div>
                </CardContent>
            </Card>
        </div>

        <Tabs defaultValue="borrow" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="borrow">Borrow (Need Money)</TabsTrigger>
            <TabsTrigger value="lend">Lend (Invest)</TabsTrigger>
            <TabsTrigger value="profile">My Dashboard</TabsTrigger>
            </TabsList>
            
            <TabsContent value="borrow">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Loan Request</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <BorrowForm />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="lend">
                <Card>
                    <CardHeader>
                        <CardTitle>Marketplace</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <LendList />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="profile">
                <Card>
                    <CardHeader>
                        <CardTitle>User Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ProfileView />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {/* Demo Controls */}
        <AdminPanel />
      </div>
    </main>
  );
}