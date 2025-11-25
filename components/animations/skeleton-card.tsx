"use client"

import { motion } from "framer-motion"

export function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 p-6 bg-card border rounded-lg"
    >
      <motion.div
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        className="h-8 bg-muted rounded"
      />
      <motion.div
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.1 }}
        className="h-4 bg-muted rounded w-3/4"
      />
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.2 }}
          className="h-16 bg-muted rounded"
        />
        <motion.div
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: 0.3 }}
          className="h-16 bg-muted rounded"
        />
      </div>
    </motion.div>
  )
}
