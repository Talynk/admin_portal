"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

/** Fields returned on admin user payloads (challenges, winners, ranking, users list). */
export type AdminContactUserFields = {
  email?: string | null
  phone1?: string | null
  phone2?: string | null
}

/** Primary phone: phone1, else phone2, else display N/A (per CONTACTS_API_STRUCTURE_ADMIN.md). */
export function getPrimaryPhoneDisplay(u: AdminContactUserFields): string {
  const p1 = u.phone1?.trim()
  const p2 = u.phone2?.trim()
  if (p1) return p1
  if (p2) return p2
  return "N/A"
}

/** Secondary only when phone2 exists and differs from phone1. */
export function getSecondaryPhoneDisplay(u: AdminContactUserFields): string | null {
  const p1 = (u.phone1?.trim() ?? "") || ""
  const p2 = u.phone2?.trim()
  if (!p2) return null
  if (p2 === p1) return null
  return p2
}

function CopyValueButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast({ title: "Copied", description: `${label} copied to clipboard.` })
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      toast({ title: "Copy failed", description: "Could not access clipboard.", variant: "destructive" })
    }
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={(e) => {
        e.stopPropagation()
        void copy()
      }}
      title={`Copy ${label}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  )
}

export function AdminUserContactLines({
  user,
  className,
}: {
  user: AdminContactUserFields
  className?: string
}) {
  const email = user.email?.trim()
  const primary = getPrimaryPhoneDisplay(user)
  const secondary = getSecondaryPhoneDisplay(user)
  return (
    <div className={cn("space-y-0.5 text-xs text-muted-foreground", className)}>
      <div className="flex items-center gap-1 min-w-0 flex-wrap">
        <span className="text-muted-foreground/80 shrink-0">Email:</span>
        {email ? (
          <>
            <span className="break-all">{email}</span>
            <CopyValueButton value={email} label="Email" />
          </>
        ) : (
          <span>N/A</span>
        )}
      </div>
      <div className="flex items-center gap-1 min-w-0 flex-wrap">
        <span className="text-muted-foreground/80 shrink-0">Phone:</span>
        {primary !== "N/A" ? (
          <>
            <span className="break-all">{primary}</span>
            <CopyValueButton value={primary} label="Phone" />
          </>
        ) : (
          <span>N/A</span>
        )}
      </div>
      {secondary ? (
        <div className="flex items-center gap-1 min-w-0 flex-wrap">
          <span className="text-muted-foreground/80 shrink-0">Alt:</span>
          <span className="break-all">{secondary}</span>
          <CopyValueButton value={secondary} label="Alt phone" />
        </div>
      ) : null}
    </div>
  )
}
