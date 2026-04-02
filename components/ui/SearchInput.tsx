import { Search } from 'lucide-react'
import { type InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs))
}

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  containerClassName?: string
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { containerClassName, className, ...props },
  ref
) {
  return (
    <div className={cn('relative', containerClassName)}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      />
      <input
        ref={ref}
        type="search"
        className={cn(
          'w-full pl-8 pr-3 py-2 text-sm bg-white border border-[#E5E5E3] rounded-lg',
          'placeholder:text-gray-400 text-gray-900',
          'focus:outline-none focus:ring-1 focus:ring-[#2DBDAA] focus:border-[#2DBDAA]',
          'transition-shadow duration-150',
          className
        )}
        {...props}
      />
    </div>
  )
})
