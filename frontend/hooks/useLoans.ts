import { useReadContract } from "wagmi";
import { PLATFORM_ADDRESS, PLATFORM_ABI } from "@/lib/constants";
import { useState, useEffect } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/components/providers";

export interface Loan {
  id: bigint;
  borrower: string;
  lender: string;
  amount: bigint;
  collateralAmount: bigint;
  interest: bigint;
  startTime: bigint;
  duration: bigint;
  active: boolean;
  funded: boolean;
  ipfsHash: string;
  loanAgreementHash: string;
}

export function useLoans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Get total number of loans
  const { data: loanCounter, refetch: refetchCounter } = useReadContract({
    address: PLATFORM_ADDRESS,
    abi: PLATFORM_ABI,
    functionName: "loanCounter",
  });

  const fetchLoans = async () => {
    if (!loanCounter) return;
    setLoading(true);
    const count = Number(loanCounter);
    const loadedLoans: Loan[] = [];

    // Loop through IDs (Simple method for hackathons/projects)
    for (let i = 1; i <= count; i++) {
      try {
        const data = await readContract(config, {
            address: PLATFORM_ADDRESS,
            abi: PLATFORM_ABI,
            functionName: "loans",
            args: [BigInt(i)]
        }) as any; // Cast as any to bypass strict tuple typing for now
        
        // The struct returns an array/object. We map it manually.
        // Order: id, borrower, lender, amount, collateral, interest, start, duration, active, funded, ipfs
        loadedLoans.push({
            id: data[0],
            borrower: data[1],
            lender: data[2],
            amount: data[3],
            collateralAmount: data[4],
            interest: data[5],
            startTime: data[6],
            duration: data[7],
            active: data[8],
            funded: data[9],
            ipfsHash: data[10],
            loanAgreementHash: data[11]
        });
      } catch (e) {
        console.error(`Error fetching loan ${i}`, e);
      }
    }
    setLoans(loadedLoans);
    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();
  }, [loanCounter]);

  return { loans, loading, refetch: () => { refetchCounter(); fetchLoans(); } };
}