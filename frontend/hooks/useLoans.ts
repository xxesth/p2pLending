import { useReadContract } from "wagmi";
import { PLATFORM_ADDRESS, PLATFORM_ABI } from "@/lib/constants";
import { useState, useEffect } from "react";
import { readContract } from "wagmi/actions";
import { config } from "@/components/providers";

// 1. DEFINE THE MISSING FUNCTION MANUALLY
const LOAN_DETAILS_ABI = [
  {
    inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
    name: "getLoanDetails",
    outputs: [
      {
        components: [
          { name: "id", type: "uint256" },
          { name: "borrower", type: "address" },
          { name: "lender", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "collateralAmount", type: "uint256" },
          { name: "interest", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "active", type: "bool" },
          { name: "funded", type: "bool" },
          { name: "ipfsHash", type: "string" },
          { name: "loanAgreementHash", type: "bytes32" }
        ],
        internalType: "struct LendingPlatform.Loan",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
] as const;

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

    for (let i = 1; i <= count; i++) {
      try {
        // 2. USE THE MANUAL ABI HERE
        const data = await readContract(config, {
            address: PLATFORM_ADDRESS,
            abi: LOAN_DETAILS_ABI, // <--- Use the manual fragment
            functionName: "getLoanDetails",
            args: [BigInt(i)]
        });

        // Debug Log
        console.log(`LOAN #${i} DATA:`, data);

        loadedLoans.push({
            id: data.id,
            borrower: data.borrower,
            lender: data.lender,
            amount: data.amount,
            collateralAmount: data.collateralAmount,
            interest: data.interest,
            startTime: data.startTime,
            duration: data.duration,
            active: data.active,
            funded: data.funded,
            ipfsHash: data.ipfsHash,
            loanAgreementHash: data.loanAgreementHash
        });
      } catch (e) {
        console.error(`Error fetching loan ${i}`, e);
      }
    }
    setLoans(loadedLoans.reverse());
    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();
  }, [loanCounter]);

  return { loans, loading, refetch: () => { refetchCounter(); fetchLoans(); } };
}