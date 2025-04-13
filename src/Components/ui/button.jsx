import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-medical-green text-black hover:bg-medical-green-dark",
        destructive: "bg-red-500 text-black hover:bg-red-600",
        outline: "border border-medical-green text-black hover:bg-medical-green-light hover:text-black",
        secondary: "bg-medical-green-light text-black hover:bg-medical-green-light/80",
        ghost: "hover:bg-medical-green-light text-black hover:text-black",
        link: "text-black underline-offset-4 hover:underline",
        alert: "bg-alert text-black hover:bg-alert/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

Button.displayName = "Button";

export { Button, buttonVariants }; 