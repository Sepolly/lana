"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: "primary" | "secondary" | "success";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value,
      max = 100,
      variant = "primary",
      size = "md",
      showLabel = false,
      animated = true,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeClasses = {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    };

    const variantClasses = {
      primary: "bg-primary",
      secondary: "bg-secondary-foreground",
      success: "bg-success",
    };

    return (
      <div className="w-full">
        <div
          ref={ref}
          className={cn(
            "bg-muted w-full overflow-hidden rounded-full",
            sizeClasses[size],
            className
          )}
          {...props}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500 ease-out",
              variantClasses[variant],
              animated && "animate-pulse"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {showLabel && (
          <p className="text-muted-foreground mt-1 text-right text-sm">{Math.round(percentage)}%</p>
        )}
      </div>
    );
  }
);

Progress.displayName = "Progress";

// Step progress indicator (like in the design mockup)
interface StepProgressProps {
  steps: number;
  currentStep: number;
  className?: string;
}

const StepProgress: React.FC<StepProgressProps> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {Array.from({ length: steps }, (_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <React.Fragment key={stepNumber}>
            <div
              className={cn(
                "flex items-center justify-center rounded-full transition-all duration-300",
                "h-8 w-8 text-sm font-semibold",
                isCompleted && "bg-primary text-primary-foreground",
                isCurrent && "bg-primary text-primary-foreground ring-secondary ring-4",
                !isCompleted && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {isCompleted ? (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                stepNumber
              )}
            </div>
            {stepNumber < steps && (
              <div
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-300",
                  stepNumber < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Linear progress with steps (dots)
interface DotProgressProps {
  steps: number;
  currentStep: number;
  className?: string;
}

const DotProgress: React.FC<DotProgressProps> = ({ steps, currentStep, className }) => {
  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      {Array.from({ length: steps }, (_, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber <= currentStep;

        return (
          <div
            key={stepNumber}
            className={cn(
              "h-3 w-3 rounded-full transition-all duration-300",
              isActive ? "bg-primary scale-110" : "bg-muted"
            )}
          />
        );
      })}
    </div>
  );
};

export { Progress, StepProgress, DotProgress };
