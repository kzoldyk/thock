import { useState } from "react"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  username: string
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZE_MAP = {
  sm: { container: "w-6 h-6", text: "text-[8px]" },
  md: { container: "w-8 h-8", text: "text-[10px]" },
  lg: { container: "w-10 h-10", text: "text-xs" },
}

/** Renders a DiceBear pixel-art avatar seeded from username. Falls back to initials on error. */
export function UserAvatar({ username, size = "md", className }: UserAvatarProps) {
  const [failed, setFailed] = useState(false)
  const { container, text } = SIZE_MAP[size]

  const seed = encodeURIComponent(username)
  const src = `https://api.dicebear.com/9.x/pixel-art/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`

  return (
    <div
      className={cn(
        container,
        "rounded-full border border-[var(--chrome-border)] overflow-hidden flex items-center justify-center bg-[var(--chrome-surface-soft)] shadow-sm select-none flex-shrink-0",
        className
      )}
    >
      {!failed ? (
        <img
          src={src}
          alt={username}
          width={40}
          height={40}
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className={cn(text, "font-bold text-[var(--foreground)]")}>
          {username.substring(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  )
}
