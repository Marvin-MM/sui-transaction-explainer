"use client"

import { motion } from "framer-motion"
import { CheckCircle2, XCircle } from "lucide-react"

interface StatusBadgeProps {
  status: "success" | "failed"
  size?: "sm" | "md" | "lg"
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const isSuccess = status === "success"

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
    >
      {isSuccess ? (
        <CheckCircle2 className={`${sizeClasses[size]} text-green-600`} />
      ) : (
        <XCircle className={`${sizeClasses[size]} text-red-600`} />
      )}
    </motion.div>
  )
}
