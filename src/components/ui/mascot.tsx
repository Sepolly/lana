"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface MascotProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl";
  mood?: "happy" | "thinking" | "celebrating" | "waving";
  animate?: boolean;
}

/**
 * Lana Mascot - A friendly robot character inspired by the design
 * This is an SVG-based mascot that can be customized with different moods and sizes
 */
const Mascot = React.forwardRef<HTMLDivElement, MascotProps>(
  ({ className, size = "md", mood = "happy", animate = true, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-16 h-16",
      md: "w-24 h-24",
      lg: "w-32 h-32",
      xl: "w-48 h-48",
    };

    return (
      <div
        ref={ref}
        className={cn(
          sizeClasses[size],
          animate && "animate-bounce",
          className
        )}
        {...props}
      >
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Body */}
          <ellipse
            cx="60"
            cy="75"
            rx="35"
            ry="30"
            className="fill-secondary"
          />
          
          {/* Body outline/shadow */}
          <ellipse
            cx="60"
            cy="75"
            rx="35"
            ry="30"
            className="stroke-primary"
            strokeWidth="2"
            fill="none"
          />

          {/* Head */}
          <circle
            cx="60"
            cy="40"
            r="28"
            className="fill-white"
          />
          <circle
            cx="60"
            cy="40"
            r="28"
            className="stroke-primary"
            strokeWidth="2"
            fill="none"
          />

          {/* Helmet/Visor top */}
          <path
            d="M35 35 Q60 10 85 35"
            className="stroke-primary"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />

          {/* Left eye */}
          <ellipse
            cx="48"
            cy="42"
            rx="6"
            ry="7"
            className="fill-primary"
          />
          {/* Left eye shine */}
          <circle
            cx="46"
            cy="40"
            r="2"
            className="fill-white"
          />

          {/* Right eye */}
          <ellipse
            cx="72"
            cy="42"
            rx="6"
            ry="7"
            className="fill-primary"
          />
          {/* Right eye shine */}
          <circle
            cx="70"
            cy="40"
            r="2"
            className="fill-white"
          />

          {/* Mouth - changes based on mood */}
          {mood === "happy" && (
            <path
              d="M50 52 Q60 60 70 52"
              className="stroke-primary"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}
          {mood === "thinking" && (
            <ellipse
              cx="60"
              cy="54"
              rx="4"
              ry="3"
              className="fill-primary"
            />
          )}
          {mood === "celebrating" && (
            <>
              <path
                d="M48 52 Q60 65 72 52"
                className="stroke-primary"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Confetti */}
              <circle cx="30" cy="20" r="3" className="fill-tertiary" />
              <circle cx="90" cy="25" r="2" className="fill-secondary" />
              <circle cx="25" cy="50" r="2" className="fill-primary" />
              <circle cx="95" cy="45" r="3" className="fill-tertiary" />
            </>
          )}
          {mood === "waving" && (
            <path
              d="M50 52 Q60 58 70 52"
              className="stroke-primary"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          )}

          {/* Antenna */}
          <line
            x1="60"
            y1="12"
            x2="60"
            y2="5"
            className="stroke-primary"
            strokeWidth="2"
          />
          <circle
            cx="60"
            cy="4"
            r="3"
            className="fill-tertiary stroke-primary"
            strokeWidth="1"
          />

          {/* Left arm */}
          <ellipse
            cx="28"
            cy="75"
            rx="8"
            ry="12"
            className="fill-secondary stroke-primary"
            strokeWidth="2"
            transform={mood === "waving" ? "rotate(-30 28 75)" : ""}
          />

          {/* Right arm */}
          <ellipse
            cx="92"
            cy="75"
            rx="8"
            ry="12"
            className="fill-secondary stroke-primary"
            strokeWidth="2"
            transform={mood === "waving" ? "rotate(45 92 65)" : ""}
          />

          {/* Belly badge */}
          <circle
            cx="60"
            cy="78"
            r="10"
            className="fill-tertiary stroke-primary"
            strokeWidth="1.5"
          />
          <text
            x="60"
            y="82"
            textAnchor="middle"
            className="fill-primary text-[8px] font-bold"
          >
            L
          </text>
        </svg>
      </div>
    );
  }
);

Mascot.displayName = "Mascot";

export { Mascot };

