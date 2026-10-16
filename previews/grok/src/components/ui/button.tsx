import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary-strong",
        ghost: "border border-line bg-surface-raised text-fg hover:bg-surface",
        quiet: "text-muted hover:bg-surface-raised hover:text-fg",
        danger: "text-danger hover:bg-surface-raised",
      },
      size: {
        sm: "h-11 px-3 text-sm",
        md: "h-11 px-4 text-sm",
      },
    },
    defaultVariants: { variant: "ghost", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>) {
  return <button type={type} className={cn(buttonStyles({ variant, size }), className)} {...props} />;
}
