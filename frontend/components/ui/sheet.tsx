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
  onSwipeUp?: (deltaY: number) => boolean | void
}

const SheetContent = React.forwardRef<HTMLDivElement, ExtendedSheetContentProps>(
  (
    {
      className,
      children,
      side = "right",
      onSwipeDown,
      onSwipeUp,
      ...props
    },
    ref
  ) => {
    const localRef = React.useRef<HTMLDivElement>(null)
    const closeRef = React.useRef<HTMLButtonElement>(null)
    const composedRef = composeRefs(ref, localRef)

    React.useEffect(() => {
      const content = localRef.current
      if (!content || side !== "bottom") return

      const CLOSE_THRESHOLD = 120
      const TRIGGER_THRESHOLD = 60
      const PULL_UP_LIMIT = 80
      const DRAG_ZONE_HEIGHT = 96
      const NO_DRAG_SELECTOR = "[data-sheet-no-drag]"

      let startY = 0
      let currentY = 0
      let dragging = false
      let direction: "none" | "up" | "down" = "none"
      let activePointerId: number | null = null
      let originalTouchAction: string | null = null
      let rafId: number | null = null
      const timeouts = new Set<number>()

      const storeTouchAction = () => {
        if (originalTouchAction === null) {
          const existing = content.style.touchAction
          originalTouchAction = existing && existing.length > 0 ? existing : "__unset__"
        }
        content.style.touchAction = "none"
      }

      const releaseTouchAction = () => {
        if (originalTouchAction === null) return
        if (originalTouchAction === "__unset__") {
          content.style.removeProperty("touch-action")
        } else {
          content.style.touchAction = originalTouchAction
        }
        originalTouchAction = null
      }

      const clearAnimationFrame = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
      }

      const setTransform = (value: string) => {
        clearAnimationFrame()
        rafId = requestAnimationFrame(() => {
          content.style.transform = value
        })
      }

      const resetStyles = () => {
        clearAnimationFrame()
        content.style.transition = ""
        content.style.transform = ""
        content.style.willChange = ""
        releaseTouchAction()
      }

      const scheduleReset = (delay = 200) => {
        const timeout = window.setTimeout(() => {
          resetStyles()
          timeouts.delete(timeout)
        }, delay)
        timeouts.add(timeout)
      }

      const canStartDrag = (event: PointerEvent | TouchEvent) => {
        const target = event.target as Element | null
        if (target?.closest(NO_DRAG_SELECTOR)) return false
        if (target?.closest("[data-sheet-drag-handle]")) return true
        if (target?.closest("[data-sheet-drag-region]")) return true

        const clientY =
          "touches" in event
            ? event.touches[0]?.clientY ?? 0
            : event.clientY

        const { top } = content.getBoundingClientRect()
        return clientY - top <= DRAG_ZONE_HEIGHT
      }

      const beginDrag = (start: number) => {
        dragging = true
        startY = start
        currentY = start
        direction = "none"
        content.style.transition = "none"
        content.style.willChange = "transform"
        storeTouchAction()
      }

      const updateDrag = (
        clientY: number,
        preventDefault?: () => void
      ) => {
        if (!dragging) return
        currentY = clientY
        const deltaY = currentY - startY

        if (deltaY > 0) {
          direction = "down"
          preventDefault?.()
          setTransform(`translateY(${deltaY}px)`)
        } else if (deltaY < 0) {
          direction = "up"
          if (onSwipeUp) {
            preventDefault?.()
            const limited = Math.max(deltaY, -PULL_UP_LIMIT)
            setTransform(`translateY(${limited}px)`)
          } else {
            setTransform("translateY(0)")
          }
        } else {
          direction = "none"
          setTransform("translateY(0)")
        }
      }

      const finishDrag = () => {
        if (!dragging) return
        dragging = false

        if (activePointerId !== null) {
          try {
            content.releasePointerCapture(activePointerId)
          } catch {
            // ignore
          }
        }
        activePointerId = null

        const delta = currentY - startY
        content.style.transition = "transform 0.2s ease-out"

        let handled = false

        if (direction === "down" && delta > 0) {
          const deltaY = delta
          if (deltaY > TRIGGER_THRESHOLD && onSwipeDown) {
            handled = onSwipeDown(deltaY) === true
          }

          if (!handled && deltaY > CLOSE_THRESHOLD) {
            setTransform("translateY(100%)")
            window.setTimeout(() => {
              closeRef.current?.click()
            }, 160)
            scheduleReset(220)
          } else {
            setTransform("translateY(0)")
            scheduleReset(200)
          }
        } else if (direction === "up" && delta < 0) {
          const magnitude = Math.abs(delta)
          if (magnitude > TRIGGER_THRESHOLD && onSwipeUp) {
            handled = onSwipeUp(magnitude) === true
          }
          setTransform("translateY(0)")
          scheduleReset(150)
        } else {
          setTransform("translateY(0)")
          scheduleReset(150)
        }

        direction = "none"
      }

      const cancelDrag = () => {
        if (!dragging) return
        dragging = false

        if (activePointerId !== null) {
          try {
            content.releasePointerCapture(activePointerId)
          } catch {
            // ignore
          }
        }
        activePointerId = null

        content.style.transition = "transform 0.2s ease-out"
        setTransform("translateY(0)")
        scheduleReset(200)
        direction = "none"
      }

      const supportsPointerEvents =
        typeof window !== "undefined" && "PointerEvent" in window

      if (supportsPointerEvents) {
        const handlePointerDown = (event: PointerEvent) => {
          if (event.pointerType !== "touch" && event.pointerType !== "pen") {
            return
          }
          if (dragging || !canStartDrag(event)) {
            return
          }

          activePointerId = event.pointerId
          beginDrag(event.clientY)
          if (event.cancelable) event.preventDefault()

          try {
            content.setPointerCapture(event.pointerId)
          } catch {
            // ignore capture errors
          }
        }

        const handlePointerMove = (event: PointerEvent) => {
          if (!dragging || event.pointerId !== activePointerId) return
          updateDrag(event.clientY, () => {
            if (event.cancelable) event.preventDefault()
          })
        }

        const handlePointerUp = (event: PointerEvent) => {
          if (event.pointerId !== activePointerId) return
          if (event.cancelable) event.preventDefault()
          finishDrag()
        }

        const handlePointerCancel = (event: PointerEvent) => {
          if (event.pointerId !== activePointerId) return
          cancelDrag()
        }

        content.addEventListener("pointerdown", handlePointerDown)
        window.addEventListener("pointermove", handlePointerMove)
        window.addEventListener("pointerup", handlePointerUp)
        window.addEventListener("pointercancel", handlePointerCancel)

        return () => {
          content.removeEventListener("pointerdown", handlePointerDown)
          window.removeEventListener("pointermove", handlePointerMove)
          window.removeEventListener("pointerup", handlePointerUp)
          window.removeEventListener("pointercancel", handlePointerCancel)
          timeouts.forEach((timeout) => window.clearTimeout(timeout))
          timeouts.clear()
          cancelDrag()
          resetStyles()
        }
      }

      const handleTouchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1 || dragging) return
        if (!canStartDrag(event)) return
        beginDrag(event.touches[0].clientY)
      }

      const handleTouchMove = (event: TouchEvent) => {
        if (!dragging) return
        updateDrag(event.touches[0].clientY, () => {
          if (event.cancelable) event.preventDefault()
        })
      }

      const handleTouchEnd = () => {
        finishDrag()
      }

      const handleTouchCancel = () => {
        cancelDrag()
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
        timeouts.forEach((timeout) => window.clearTimeout(timeout))
        timeouts.clear()
        cancelDrag()
        resetStyles()
      }
    }, [onSwipeDown, onSwipeUp, side])

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
            data-sheet-no-drag
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
      data-sheet-drag-region
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
