"use client";

import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { Button } from "@/components/ui/button";
import { formatEther } from "viem";
import { useEffect, useState } from "react";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address });

  // 1. Create a state to track if we are on the client
  const [isMounted, setIsMounted] = useState(false);

  // 2. Set it to true once the component has mounted in the browser
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 3. If we haven't mounted yet, render the "Disconnected" state (The Button)
  // This ensures Server HTML == Client Initial HTML
  if (!isMounted) {
    return (
        <Button onClick={() => connect({ connector: connectors[0] })}>
            Connect Wallet
        </Button>
    );
  }

  // 4. Normal Logic (Only runs on client after mount)
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm text-right">
          <p className="font-bold">{address.slice(0, 6)}...{address.slice(-4)}</p>
          <p className="text-muted-foreground">{balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ETH` : "..."}</p>
        </div>
        <Button variant="outline" onClick={() => disconnect()}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={() => connect({ connector: connectors[0] })}>
      Connect Wallet
    </Button>
  );
}