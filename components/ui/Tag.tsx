import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

type TagVariant = 'success' | 'warning' | 'default' | 'muted'

interface TagProps {
  variant?: TagVariant
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<TagVariant, string> = {
  success: 'bg-[#E6F4F1] text-[#1A7A6A]',
  warning: 'bg-[#FFF3DC] text-[#B07D00]',
  default: 'bg-gray-100 text-gray-700',
  muted: 'bg-[#F7F7F5] text-[#6B7280] border border-[#E5E5E3]',
}

export function Tag({ variant = 'default', children, className }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium leading-tight',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
