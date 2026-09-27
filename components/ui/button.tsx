import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:pointer-events-none disabled:opacity-50", {
  variants: { variant: { default: "bg-cyan-400 px-4 py-2.5 text-slate-950 hover:bg-cyan-300", outline: "border border-slate-600 px-4 py-2.5 text-slate-100 hover:bg-slate-800" } },
  defaultVariants: { variant: "default" },
});
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, ...props }, ref) => <button ref={ref} className={cn(buttonVariants({ variant }), className)} {...props} />);
Button.displayName = "Button";
