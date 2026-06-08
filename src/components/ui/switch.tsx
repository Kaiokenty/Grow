// @ts-nocheck
"use client";

import {
  forwardRef,
  type HTMLAttributes,
} from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

interface SwitchProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

const TRACK_WIDTH = 34;
const TRACK_HEIGHT = 20;
const THUMB_SIZE = 16;
const THUMB_OFFSET = 2;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_OFFSET * 2;

const Switch = forwardRef<HTMLDivElement, SwitchProps>(
  ({ label, checked, onToggle, disabled = false, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative z-10 flex cursor-pointer select-none items-center gap-2.5 px-3 py-2",
          disabled && "pointer-events-none opacity-50",
          className,
        )}
        onClick={() => {
          if (disabled) return;
          onToggle();
        }}
        {...props}
      >
        <SwitchPrimitive.Root
          checked={checked}
          onCheckedChange={onToggle}
          disabled={disabled}
          tabIndex={0}
          className={cn(
            "relative shrink-0 cursor-pointer rounded-full outline-none",
            "transition-colors duration-80",
            "focus-visible:ring-1 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            checked ? "bg-[var(--focus)]" : "bg-accent",
          )}
          style={{ width: TRACK_WIDTH, height: TRACK_HEIGHT }}
          onClick={(e) => e.stopPropagation()}
        >
          <SwitchPrimitive.Thumb
            className={cn(
              "absolute top-[2px] block rounded-full bg-white shadow-sm transition-transform duration-80",
            )}
            style={{
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              transform: checked
                ? `translateX(${THUMB_OFFSET + THUMB_TRAVEL}px)`
                : `translateX(${THUMB_OFFSET}px)`,
            }}
          />
        </SwitchPrimitive.Root>

        <span
          className={cn(
            "text-[13px] transition-[color] duration-80",
            checked ? "text-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      </div>
    );
  },
);

Switch.displayName = "Switch";

export { Switch };
