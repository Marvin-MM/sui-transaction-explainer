import { z } from "zod"

export const digestSchema = z
  .string()
  // Sui transaction digests are base58-encoded 32-byte hashes; most are 44 chars, some can be 43
  .min(43, { message: "Transaction digest must be 43–44 characters" })
  .max(44, { message: "Transaction digest must be 43–44 characters" })
  .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, "Invalid base58 digest format")

export const walletAddressSchema = z.string().regex(/^0x[a-zA-Z0-9]+$/, "Invalid wallet address format")

export const webhookSchema = z.object({
  url: z.string().url("Invalid webhook URL"),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  integration: z.enum(["discord", "slack", "zapier"]),
  triggerNewTransaction: z.boolean().default(true),
  triggerObjectCreated: z.boolean().default(false),
  triggerTransferIn: z.boolean().default(false),
  triggerTransferOut: z.boolean().default(false),
})

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/[0-9]/, "Password must contain number"),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password required"),
})
