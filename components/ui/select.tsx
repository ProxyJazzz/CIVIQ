'use client'

import * as React from "react"
import { createContext, useContext, useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined)

export function Select({
  children,
  defaultValue,
  value,
  onValueChange,
}: {
  children: React.ReactNode
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}) {
  const [localValue, setLocalValue] = useState(defaultValue || "")
  const activeValue = value !== undefined ? value : localValue
  const handleValueChange = onValueChange || setLocalValue
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  return (
    <SelectContext.Provider
      value={{
        value: activeValue,
        onValueChange: (val) => {
          handleValueChange(val)
          setOpen(false)
        },
        open,
        setOpen,
        triggerRef,
      }}
    >
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  className,
  placeholder,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { placeholder?: string }) {
  const context = useContext(SelectContext)
  if (!context) throw new Error("SelectTrigger must be used inside Select")

  const buttonRef = context.triggerRef as React.RefObject<HTMLButtonElement>

  return (
    <button
      type="button"
      ref={buttonRef}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onClick={() => context.setOpen(!context.open)}
      {...props}
    >
      <span className="truncate">
        {context.value || placeholder || "Select option"}
      </span>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = useContext(SelectContext)
  if (!context) throw new Error("SelectValue must be used inside Select")
  return <span>{context.value || placeholder || ""}</span>
}

export function SelectContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const context = useContext(SelectContext)
  const containerRef = useRef<HTMLDivElement>(null)

  if (!context) throw new Error("SelectContent must be used inside Select")

  const ctx = context

  useEffect(() => {
    if (!ctx.open) return

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        ctx.triggerRef.current &&
        !ctx.triggerRef.current.contains(event.target as Node)
      ) {
        ctx.setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [ctx])

  if (!ctx.open) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 slide-in-from-top-1 w-full mt-1 max-h-60 overflow-y-auto",
        className
      )}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

export function SelectGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-2 py-1.5 text-xs font-semibold text-muted-foreground", className)} {...props} />
}

export function SelectItem({
  className,
  value,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const context = useContext(SelectContext)
  if (!context) throw new Error("SelectItem must be used inside Select")
  const isSelected = context.value === value

  return (
    <div
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "bg-accent/40 font-medium",
        className
      )}
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && <Check className="h-4 w-4" />}
      </span>
      <span className="truncate">{children}</span>
    </div>
  )
}
