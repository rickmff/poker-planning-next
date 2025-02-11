'use client'

import * as React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends Omit<HTMLMotionProps<"div">, "value"> {
  selected?: boolean
  revealed?: boolean
  disabled?: boolean
  value?: string | null
  isCurrentUser?: boolean
}

export function Card({
  className,
  selected,
  revealed,
  disabled,
  value,
  isCurrentUser = false,
  ...props
}: CardProps) {
  return (
    <motion.div
      initial={isCurrentUser ? { scale: 0.95 } : false}
      whileHover={isCurrentUser && !disabled ? { scale: 1.05, rotateY: 5 } : {}}
      whileTap={isCurrentUser && !disabled ? { scale: 0.95 } : {}}
      animate={{
        scale: selected ? 1.05 : 1,
        rotateY: revealed ? 0 : 180,
        y: selected && isCurrentUser ? -8 : 0,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
        mass: 0.5
      }}
      className={cn(
        'relative aspect-[2/3] rounded-xl transition-colors duration-300 cursor-pointer select-none preserve-3d',
        selected && isCurrentUser && 'shadow-xl ring-2 ring-primary ring-offset-2',
        disabled && 'cursor-not-allowed',
        className
      )}
      {...props}
    >
      {/* Front of the card */}
      <motion.div
        className={cn(
          'absolute inset-0 backface-hidden rounded-xl border-2',
          selected ? 'border-primary' : 'border-border',
          'bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900',
          'shadow-lg'
        )}
      >
        {/* Corner patterns */}
        <svg className="absolute top-2 left-2 w-4 h-4 text-primary/20" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2L2 12h10V2z" />
        </svg>
        <svg className="absolute bottom-2 right-2 w-4 h-4 text-primary/20 rotate-180" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 2L2 12h10V2z" />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </motion.div>

      {/* Back of the card */}
      <motion.div
        className={cn(
          'absolute inset-0 backface-hidden rounded-xl border-2 border-border rotateY-180',
          'bg-gradient-to-br from-primary/5 to-primary/10 dark:from-gray-800 dark:to-gray-900',
          selected && isCurrentUser && 'border-primary'
        )}
      >
        {/* Pattern Grid */}
        <div className="absolute inset-4 grid grid-cols-4 gap-1 opacity-20">
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-sm",
                selected && isCurrentUser ? 'bg-primary' : 'bg-primary/50'
              )}
            />
          ))}
        </div>

        {/* Center Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className={cn(
            "w-8 h-8",
            selected && isCurrentUser ? 'text-primary' : 'text-primary/30'
          )} viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  )
} 