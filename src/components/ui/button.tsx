
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neuro-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "neuro-button text-neuro-text-primary active:neuro-pressed",
        destructive: "neuro-button bg-neuro-error text-white hover:bg-neuro-error/90",
        outline: "neuro-inset bg-neuro-element text-neuro-text-primary hover:bg-neuro-surface",
        secondary: "neuro-button bg-neuro-surface text-neuro-text-secondary",
        ghost: "rounded-2xl text-neuro-text-primary hover:bg-neuro-element hover:neuro-outset-sm",
        link: "text-neuro-accent underline-offset-4 hover:underline rounded-none shadow-none",
        accent: "neuro-button bg-neuro-accent text-white hover:bg-neuro-accent-light"
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4",
        lg: "h-14 rounded-3xl px-8",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
