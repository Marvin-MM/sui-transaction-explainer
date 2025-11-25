// "use client"

// import { useEffect, useState } from "react"
// import { useSuiClientContext } from "@mysten/dapp-kit"

// export function useSuiGasFee() {
//   const [gasFee, setGasFee] = useState<number | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   const { client } = useSuiClientContext()

//   useEffect(() => {
//     let isMounted = true

//     const fetchGasFee = async () => {
//       try {
//         if (!client) {
//           console.log("[v0] Client not ready yet")
//           return
//         }

//         setLoading(true)
//         const gasPrice = await client.getReferenceGasPrice()

//         if (isMounted && gasPrice) {
//           // Gas price is already in MIST, convert to SUI (1 SUI = 10^9 MIST)
//           const suiGasPrice = Number(gasPrice) / 1_000_000_000
//           console.log("[v0] Gas fee fetched:", suiGasPrice, "SUI from", gasPrice, "MIST")
//           setGasFee(Number(suiGasPrice.toFixed(8)))
//           setError(null)
//         }
//       } catch (err) {
//         if (isMounted) {
//           const errorMsg = err instanceof Error ? err.message : "Failed to fetch gas fee"
//           console.log("[v0] Gas fee error:", errorMsg)
//           setError(errorMsg)
//         }
//       } finally {
//         if (isMounted) setLoading(false)
//       }
//     }

//     if (client) {
//       fetchGasFee()
//       const interval = setInterval(fetchGasFee, 10000) // Update every 10 seconds

//       return () => {
//         isMounted = false
//         clearInterval(interval)
//       }
//     }
//   }, [client])

//   return { gasFee, loading, error }
// }

"use client";

import { useQuery } from '@tanstack/react-query';
import { useSuiClientContext } from "@mysten/dapp-kit";

export function useSuiGasFee() {
  const { client } = useSuiClientContext();

  return useQuery({
    queryKey: ['sui-gas-fee', client?.network],
    queryFn: async () => {
      if (!client) throw new Error("Client not ready");
      const priceMist = await client.getReferenceGasPrice(); // returns in MIST
      return Number(priceMist) / 1_000_000_000; // convert to SUI
    },
    enabled: !!client,
    refetchInterval: 60 * 60 * 1000, // 1 hour (epoch duration)
    staleTime: 60 * 60 * 1000,       // remain fresh for 1 hour
  });
}
