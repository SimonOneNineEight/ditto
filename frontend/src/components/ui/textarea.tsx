import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const textareaVariants = cva(
  "flex w-full min-w-0 bg-transparent outline-none transition-colors disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: [
          "min-h-[80px] border-0 px-0 py-1 text-sm leading-relaxed",
          "placeholder:text-muted-foreground/60",
          "resize-none",
        ],
        outline: [
          "min-h-[60px] rounded-md border border-input px-3 py-2 text-base shadow-sm md:text-sm",
          "placeholder:text-muted-foreground",
          "focus-visible:ring-1 focus-visible:ring-ring",
        ],
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface TextareaProps
  extends React.ComponentProps<"textarea">,
    VariantProps<typeof textareaVariants> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <textarea
        className={cn(textareaVariants({ variant }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea, textareaVariants }
