"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, label, error, success, hint, leftIcon, rightIcon, disabled, ...props },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";

    const inputType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-foreground block text-sm font-medium" htmlFor={props.id}>
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2">
              {leftIcon}
            </div>
          )}
          <input
            type={inputType}
            className={cn(
              "bg-input flex h-12 w-full rounded-xl border px-4 py-2 text-base transition-all duration-200",
              "placeholder:text-muted-foreground",
              "focus:ring-primary focus:border-primary focus:ring-2 focus:outline-none",
              "disabled:bg-muted disabled:cursor-not-allowed disabled:opacity-50",
              leftIcon && "pl-10",
              (rightIcon || isPassword) && "pr-10",
              error && "border-destructive focus:ring-destructive",
              success && "border-success focus:ring-success",
              !error && !success && "border-border",
              className
            )}
            ref={ref}
            disabled={disabled}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          )}
          {!isPassword && rightIcon && (
            <div className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2">
              {rightIcon}
            </div>
          )}
          {error && !isPassword && (
            <div className="text-destructive absolute top-1/2 right-3 -translate-y-1/2">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}
          {success && !isPassword && (
            <div className="text-success absolute top-1/2 right-3 -translate-y-1/2">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          )}
        </div>
        {(error || success || hint) && (
          <p
            className={cn(
              "text-sm",
              error && "text-destructive",
              success && "text-success",
              !error && !success && "text-muted-foreground"
            )}
          >
            {error || success || hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
