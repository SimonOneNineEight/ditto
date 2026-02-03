import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // Interview type variants (pill style)
        phone_screen:
          "border-transparent rounded-full px-3 py-1 bg-[#1a3a4a] text-white",
        technical:
          "border-transparent rounded-full px-3 py-1 bg-[#2d2a4a] text-white",
        behavioral:
          "border-transparent rounded-full px-3 py-1 bg-[#1a3a2a] text-white",
        onsite:
          "border-transparent rounded-full px-3 py-1 bg-[#4a3a1a] text-white",
        panel:
          "border-transparent rounded-full px-3 py-1 bg-[#3a1a3a] text-white",
        other:
          "border-transparent rounded-full px-3 py-1 bg-[#3a3a3a] text-white",
        // Status variants (pill style)
        today:
          "border-transparent rounded-full px-3 py-1 bg-[#7c2d12] text-white",
        soon:
          "border-transparent rounded-full px-3 py-1 bg-[#1e3a5f] text-white",
        awaiting:
          "border-transparent rounded-full px-3 py-1 bg-accent-muted text-white",
        overdue:
          "border-transparent rounded-full px-3 py-1 bg-[#5c2a2a] text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
