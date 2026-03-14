"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const ExpandableScreen = DialogPrimitive.Root

const ExpandableScreenTrigger = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Trigger>,
  React.ComponentProps<typeof DialogPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Trigger
    ref={ref}
    data-slot="expandable-screen-trigger"
    className={cn(className)}
    {...props}
  />
))
ExpandableScreenTrigger.displayName = "ExpandableScreenTrigger"

interface ExpandableScreenContentProps
  extends Omit<React.ComponentProps<typeof DialogPrimitive.Content>, "title"> {
  contentRadius?: string | number
  showCloseButton?: boolean
}

const ExpandableScreenContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  ExpandableScreenContentProps
>(
  (
    {
      className,
      contentRadius = "24px",
      children,
      showCloseButton = true,
      ...props
    },
    ref
  ) => {
    const radius = typeof contentRadius === "number" ? `${contentRadius}px` : contentRadius
    return (
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{ borderRadius: radius }}
        />
        <DialogPrimitive.Content
          ref={ref}
          aria-describedby={undefined}
          className={cn(
            "fixed left-[50%] top-[50%] z-50 flex h-[85vh] w-full max-w-[1100px] translate-x-[-50%] translate-y-[-50%] flex-col overflow-hidden bg-background shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200",
            className
          )}
          style={{ borderRadius: radius }}
          {...props}
        >
          <DialogPrimitive.Title className="sr-only">Expandable content</DialogPrimitive.Title>
          {showCloseButton && (
            <DialogPrimitive.Close
              className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              aria-label="Close"
            >
              <XIcon className="h-5 w-5" />
            </DialogPrimitive.Close>
          )}
          <div className="flex flex-1 flex-col overflow-auto p-6 sm:p-8 lg:p-10">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    )
  }
)
ExpandableScreenContent.displayName = "ExpandableScreenContent"

export { ExpandableScreen, ExpandableScreenTrigger, ExpandableScreenContent }
