"use client"

import { memo } from "react"
import { Keyboard, GraduationCap, Trophy, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileTabBarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  hidden?: boolean
}

/**
 * F6 — Mobile bottom tab bar. Practice / Learn / Leaderboard / Statistics are
 * reachable on phones (desktop keeps the pill nav).
 */
export const MobileTabBar = memo(function MobileTabBar({ activeTab, onTabChange, hidden }: MobileTabBarProps) {
  if (hidden) return null

  const tabs = [
    { id: "Practice", label: "Practice", icon: Keyboard },
    { id: "Learn", label: "Learn", icon: GraduationCap },
    { id: "Leaderboard", label: "Board", icon: Trophy },
    { id: "Statistics", label: "Stats", icon: BarChart3 },
  ]

  return (
    <nav
      aria-label="Mobile navigation"
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-40",
        "border-t border-[var(--chrome-border)] bg-[var(--chrome-surface-strong)] backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center gap-0.5 py-2 cursor-pointer transition-colors",
                isActive ? "text-[var(--accent)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-bold tracking-wide">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
})
