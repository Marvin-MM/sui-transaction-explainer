// "use client"

// import { useEffect, useState } from "react"

// const PYTH_MAINNET = "https://hermes.pyth.network"
// const SUI_PRICE_FEED_ID = "0x50c67b3fd225ccc5b57b0390aeaeb1042bcf25cb58641bd5729795b27e4c6765"

// export function useSuiPrice() {
//   const [price, setPrice] = useState<number | null>(null)
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)

//   useEffect(() => {
//     let isMounted = true

//     const fetchPrice = async () => {
//       try {
//         setLoading(true)
//         const response = await fetch(`${PYTH_MAINNET}/api/latest_price_feeds?ids[]=${SUI_PRICE_FEED_ID}`, {
//           cache: "no-store",
//         })

//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`)
//         }

//         const data = await response.json()

//         if (isMounted && data.parsed && Array.isArray(data.parsed) && data.parsed.length > 0) {
//           const priceData = data.parsed[0]
//           const priceValue = Number(priceData.price.price)
//           const exponent = priceData.price.expo
//           const finalPrice = Number((priceValue * Math.pow(10, exponent)).toFixed(4))

//           setPrice(finalPrice)
//           setError(null)
//         } else {
//           throw new Error("Invalid price data format")
//         }
//       } catch (err) {
//         if (isMounted) {
//           const errorMsg = err instanceof Error ? err.message : "Failed to fetch price"
//           setError(errorMsg)
//           setPrice(null)
//         }
//       } finally {
//         if (isMounted) setLoading(false)
//       }
//     }

//     fetchPrice()
//     const interval = setInterval(fetchPrice, 30000)

//     return () => {
//       isMounted = false
//       clearInterval(interval)
//     }
//   }, [])

//   return { price, loading, error }
// }


// hooks/use-sui-price.ts
"use client"

import { useQuery } from '@tanstack/react-query'

export interface PriceData {
  current: number
  change24h: number
  changePercentage24h: number
  lastUpdated: Date
}

async function fetchSuiPrice(): Promise<PriceData> {
  try {
    // Using CoinGecko for comprehensive data including 24h change
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/sui?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false',
      { 
        headers: { 
          'Accept': 'application/json',
          'User-Agent': 'YourApp/1.0'
        } 
      }
    )
    
    if (!response.ok) throw new Error('CoinGecko API failed')
    
    const data = await response.json()
    const current = data.market_data?.current_price?.usd
    const change24h = data.market_data?.price_change_24h
    const changePercentage24h = data.market_data?.price_change_percentage_24h
    
    if (current === undefined || change24h === undefined || changePercentage24h === undefined) {
      throw new Error('Incomplete price data')
    }
    
    const priceData: PriceData = {
      current,
      change24h,
      changePercentage24h,
      lastUpdated: new Date()
    }
    
    console.log(`[useSuiPrice] Fetched: $${current.toFixed(2)} | ${changePercentage24h.toFixed(2)}%`)
    return priceData
    
  } catch (error) {
    console.warn('CoinGecko failed, trying Binance...', error)
    
    // Fallback to Binance API (we'll calculate 24h change from 24h stats)
    const response = await fetch(
      'https://api.binance.com/api/v3/ticker/24hr?symbol=SUIUSDT'
    )
    
    if (!response.ok) throw new Error('All price APIs failed')
    
    const data = await response.json()
    const current = parseFloat(data.lastPrice)
    const openPrice = parseFloat(data.openPrice)
    const change24h = current - openPrice
    const changePercentage24h = (change24h / openPrice) * 100
    
    const priceData: PriceData = {
      current,
      change24h,
      changePercentage24h,
      lastUpdated: new Date()
    }
    
    console.log(`[useSuiPrice] Fetched from Binance: $${current.toFixed(2)} | ${changePercentage24h.toFixed(2)}%`)
    return priceData
  }
}

export function useSuiPrice() {
  return useQuery({
    queryKey: ['sui-price'],
    queryFn: fetchSuiPrice,
    refetchInterval: 30_000, // Every 30 seconds
    retry: 2,
    retryDelay: 1000,
    staleTime: 15_000, // 15 seconds
  })
}