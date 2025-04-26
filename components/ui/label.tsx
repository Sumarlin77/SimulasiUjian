"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>
>(({ className, children, ...props }, ref) => {
  // Handle cases where children might be an object
  const processedChildren = React.useMemo(() => {
    if (children && typeof children === 'object' && !React.isValidElement(children)) {
      // If it's an object with text property, use that
      if ('text' in (children as any)) {
        return (children as any).text;
      }

      // Convert to string as a fallback
      return String(children);
    }
    return children;
  }, [children]);

  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(labelVariants(), className)}
      {...props}
    >
      {processedChildren}
    </LabelPrimitive.Root>
  );
})
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
