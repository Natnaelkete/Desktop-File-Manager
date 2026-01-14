import React from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export const AnalyzerCard: React.FC<CardProps> = ({ children, className, title, subtitle }) => (
  <div className={clsx(
    "bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800",
    className
  )}>
    {(title || subtitle) && (
      <div className="mb-6 px-2">
        {title && <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</h3>}
        {subtitle && <span className="text-[10px] text-slate-400 font-mono mt-1 block">{subtitle}</span>}
      </div>
    )}
    {children}
  </div>
)

export const SectionHeader: React.FC<{ 
  title: string
  badge?: string
  badgeColor?: string
}> = ({ title, badge, badgeColor = "bg-primary-500/10 text-primary-500" }) => (
  <div className="flex items-center justify-between mb-6 px-2">
    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">{title}</h3>
    {badge && (
      <span className={clsx("text-[10px] px-2 py-1 rounded-full font-bold uppercase", badgeColor)}>
        {badge}
      </span>
    )}
  </div>
)
