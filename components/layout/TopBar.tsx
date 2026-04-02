import type { ReactNode } from 'react'

interface TopBarProps {
  title: string
  actions?: ReactNode
}

export function TopBar({ title, actions }: TopBarProps) {
  return (
    <header
      className="fixed top-0 left-[240px] right-0 h-12 z-20 flex items-center px-6"
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E5E3',
      }}
    >
      <h1 className="text-[13px] font-semibold text-gray-900 flex-1">{title}</h1>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}
