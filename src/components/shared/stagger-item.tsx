'use client'

import { motion } from 'motion/react'

interface StaggerItemProps {
  children: React.ReactNode
  index: number
  className?: string
}

export function StaggerItem({ children, index, className }: StaggerItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.25,
        ease: 'easeOut',
        delay: index * 0.04,
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
