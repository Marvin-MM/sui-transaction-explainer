"use client"

import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

interface TransactionFlowProps {
  sender: string
  recipients: string[]
}

export function TransactionFlow({ sender, recipients }: TransactionFlowProps) {
  const truncateAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`

  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-4">
      {/* Sender */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex-shrink-0"
      >
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-mono text-sm">
          {truncateAddress(sender)}
        </div>
      </motion.div>

      {/* Arrows to recipients */}
      {recipients.map((recipient, i) => (
        <div key={i} className="flex items-center gap-4 flex-shrink-0">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
            className="origin-left"
          >
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </motion.div>

          {/* Recipient */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
            className="flex-shrink-0"
          >
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-mono text-sm">
              {truncateAddress(recipient)}
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  )
}
