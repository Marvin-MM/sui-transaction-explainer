"use client"

import { motion } from "framer-motion"
import React, { type ReactNode } from "react"

interface FadeInListProps {
  children: ReactNode[]
  stagger?: number
}

export function FadeInList({ children, stagger = 0.1 }: FadeInListProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  )
}
