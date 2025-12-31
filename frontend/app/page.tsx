"use client";

import { ConnectWallet } from "@/components/connect-wallet";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BorrowForm } from "@/components/borrow-form";
import { LendList } from "@/components/lend-list";
import { ProfileView } from "@/components/profile-view";
import { AdminPanel } from "@/components/admin-panel";
import { useReadContract, useAccount, useBalance } from "wagmi";
import { ORACLE_ADDRESS, ORACLE_ABI, TOKEN_ADDRESS, TOKEN_ABI } from "@/lib/constants";
import { formatUnits, formatEther } from "viem";
import { useEffect, useState } from "react";

export default function Home() {
  const { address, isConnected } = useAccount();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 1. Oracle Price
  const { data: priceData } = useReadContract({
    address: ORACLE_ADDRESS,
    abi: ORACLE_ABI,
    functionName: "latestRoundData",
    query: { refetchInterval: 5000 }
  });

  // 2. ETH Balance
  const { data: ethBalance } = useBalance({ address });

  // 3. DUSD Balance
  const { data: dusdBalance } = useReadContract({
    address: TOKEN_ADDRESS,
    abi: TOKEN_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const currentPrice = priceData ? formatUnits((priceData as any)[1], 8) : "...";
  
  // Logic: Default to "0" if data isn't loaded yet
  const displayEth = ethBalance ? parseFloat(formatEther(ethBalance.value)).toFixed(4) : "0";
  const displayDusd = dusdBalance ? parseFloat(formatEther(dusdBalance as bigint)).toFixed(2) : "0";

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

        {/* --- STATS BAR --- */}
        <div className="mb-8">
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-700">
                        
                        {/* Oracle Price */}
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Oracle Price (ETH/USD)</p>
                            <div className="text-2xl font-bold">${currentPrice}</div>
                        </div>

                        {/* User ETH - HYDRATION FIX: Use (isMounted && isConnected) */}
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Your ETH Balance</p>
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                {(isMounted && isConnected) ? `${displayEth} ETH` : "-"}
                            </div>
                        </div>

                        {/* User DUSD - HYDRATION FIX: Use (isMounted && isConnected) */}
                        <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">Your DUSD Balance</p>
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {(isMounted && isConnected) ? `${displayDusd} DUSD` : "-"}
                            </div>
                        </div>

                    </div>
                </CardContent>
            </Card>
        </div>

        <Tabs defaultValue="borrow" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="borrow">Borrow</TabsTrigger>
            <TabsTrigger value="lend">Lend</TabsTrigger>
            <TabsTrigger value="profile">Dashboard</TabsTrigger>
            </TabsList>
            
            <TabsContent value="borrow">
                <Card>
                    <CardContent className="pt-6">
                        <BorrowForm />
                    </CardContent>
                </Card>
            </TabsContent>
            
            <TabsContent value="lend">
                <Card>
                     <CardContent className="pt-6">
                        <LendList />
                    </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="profile">
                <Card>
                     <CardContent className="pt-6">
                        <ProfileView />
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        {/* Admin Panel */}
        <AdminPanel />
      </div>
    </main>
  );
}