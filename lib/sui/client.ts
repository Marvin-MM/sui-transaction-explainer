import { SuiClient, getFullnodeUrl } from "@mysten/sui/client"

let suiClient: SuiClient | null = null

export function getSuiClient(network?: "mainnet" | "testnet" | "devnet" | "localnet"): SuiClient {
  const envNetwork = (process.env.SUI_NETWORK || "mainnet").toLowerCase() as
    | "mainnet"
    | "testnet"
    | "devnet"
    | "localnet"

  const selectedNetwork = network || envNetwork
  const url = getFullnodeUrl(selectedNetwork)

  // We can't easily cache multiple clients in a single variable without a map, 
  // but for serverless/API routes, creating a new client is cheap enough or we can map it.
  // For now, let's just return a new client if network is provided, or use the singleton if not (default).

  if (network) {
    return new SuiClient({ url })
  }

  if (!suiClient) {
    const envUrl = process.env.SUI_RPC_URL?.trim()
    const finalUrl = envUrl && envUrl.length > 0 ? envUrl : url
    suiClient = new SuiClient({ url: finalUrl })
  }
  return suiClient
}
