"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function composeRefs<T>(
  ...refs: (React.Ref<T> | undefined)[]
): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === "function") {
        ref(node)
      } else {
        ;(ref as React.MutableRefObject<T | null>).current = node
      }
    }
  }
}

type ExtendedSheetContentProps = React.ComponentProps<
  typeof SheetPrimitive.Content
> & {
  side?: "top" | "right" | "bottom" | "left"
  onSwipeDown?: (deltaY: number) => boolean | void
}

const SheetContent = React.forwardRef<HTMLDivElement, ExtendedSheetContentProps>(
  ({ className, children, side = "right", onSwipeDown, ...props }, ref) => {
    const localRef = React.useRef<HTMLDivElement>(null)
    const closeRef = React.useRef<HTMLButtonElement>(null)
    const composedRef = composeRefs(ref, localRef)

    React.useEffect(() => {
      const content = localRef.current
      if (!content || side !== "bottom") return

      let startY = 0
      let currentY = 0
      let dragging = false
      const CLOSE_THRESHOLD = 120
      const TRIGGER_THRESHOLD = 60

      const reset = () => {
        content.style.transition = ""
        content.style.transform = ""
      }

      const handleTouchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) return
        startY = event.touches[0].clientY
        currentY = startY
        dragging = true
        content.style.transition = "none"
      }

      const handleTouchMove = (event: TouchEvent) => {
        if (!dragging) return
        currentY = event.touches[0].clientY
        const deltaY = currentY - startY
        if (deltaY <= 0) {
          content.style.transform = "translateY(0)"
          return
        }

        event.preventDefault()
        content.style.transform = `translateY(${deltaY}px)`
      }

      const handleTouchEnd = () => {
        if (!dragging) return
        dragging = false
        const deltaY = Math.max(0, currentY - startY)
        content.style.transition = "transform 0.2s ease-out"

        let handled = false
        if (deltaY > TRIGGER_THRESHOLD && onSwipeDown) {
          handled = onSwipeDown(deltaY) === true
        }

        if (!handled && deltaY > CLOSE_THRESHOLD) {
          content.style.transform = "translateY(100%)"
          window.setTimeout(() => {
            closeRef.current?.click()
          }, 160)
        } else {
          content.style.transform = "translateY(0)"
          window.setTimeout(() => {
            reset()
          }, 200)
        }
      }

      const handleTouchCancel = () => {
        if (!dragging) return
        dragging = false
        content.style.transition = "transform 0.2s ease-out"
        content.style.transform = "translateY(0)"
        window.setTimeout(() => {
          reset()
        }, 200)
      }

      content.addEventListener("touchstart", handleTouchStart, { passive: true })
      content.addEventListener("touchmove", handleTouchMove, { passive: false })
      content.addEventListener("touchend", handleTouchEnd)
      content.addEventListener("touchcancel", handleTouchCancel)

      return () => {
        content.removeEventListener("touchstart", handleTouchStart)
        content.removeEventListener("touchmove", handleTouchMove)
        content.removeEventListener("touchend", handleTouchEnd)
        content.removeEventListener("touchcancel", handleTouchCancel)
        reset()
      }
    }, [onSwipeDown, side])

    return (
      <SheetPortal>
        <SheetOverlay />
        <SheetPrimitive.Content
          ref={composedRef}
          data-slot="sheet-content"
          className={cn(
            "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
            side === "right" &&
              "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
            side === "left" &&
              "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
            side === "top" &&
              "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
            side === "bottom" &&
              "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
            className
          )}
          {...props}
        >
          {children}
          <SheetPrimitive.Close
            ref={closeRef}
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        </SheetPrimitive.Content>
      </SheetPortal>
    )
  }
)

SheetContent.displayName = "SheetContent"

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
