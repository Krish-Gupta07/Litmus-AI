import type React from "react"
import { cn } from "@/lib/utils"

export interface LoadingProps {
  /** Loading animation variant */
  variant?: "spinner" | "dots" | "pulse" | "bars" | "ring" | "wave"
  /** Size of the loading indicator */
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Color theme */
  color?: "primary" | "secondary" | "muted" | "destructive" | "white" | "black"
  /** Animation speed */
  speed?: "slow" | "normal" | "fast"
  /** Optional text to display */
  text?: string
  /** Text position relative to the loading indicator */
  textPosition?: "bottom" | "right" | "top" | "left"
  /** Custom className */
  className?: string
  /** Show loading indicator inline */
  inline?: boolean
  /** Full screen overlay */
  overlay?: boolean
  /** Custom loading text className */
  textClassName?: string
}

const sizeClasses = {
  xs: "w-3 h-3",
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
}

const colorClasses = {
  primary: "text-primary",
  secondary: "text-secondary-foreground",
  muted: "text-muted-foreground",
  destructive: "text-destructive",
  white: "text-white",
  black: "text-black",
}

const speedClasses = {
  slow: "animate-spin [animation-duration:2s]",
  normal: "animate-spin [animation-duration:1s]",
  fast: "animate-spin [animation-duration:0.5s]",
}

const SpinnerIcon = ({ size, color, speed }: { size: string; color: string; speed: string }) => (
  <svg className={cn(size, color, speed)} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
)

const DotsIcon = ({ size, color, speed }: { size: string; color: string; speed: string }) => (
  <div className={cn("flex space-x-1", size.includes("w-3") ? "space-x-0.5" : "space-x-1")}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className={cn(
          "rounded-full",
          color,
          "bg-current",
          size.includes("w-3")
            ? "w-1 h-1"
            : size.includes("w-4")
              ? "w-1.5 h-1.5"
              : size.includes("w-6")
                ? "w-2 h-2"
                : size.includes("w-8")
                  ? "w-2.5 h-2.5"
                  : "w-3 h-3",
          "animate-bounce",
        )}
        style={{
          animationDelay: `${i * 0.1}s`,
          animationDuration: speed === "fast" ? "0.6s" : speed === "slow" ? "1.4s" : "1s",
        }}
      />
    ))}
  </div>
)

const PulseIcon = ({ size, color }: { size: string; color: string }) => (
  <div className={cn(size, color, "bg-current rounded-full animate-pulse opacity-75")} />
)

const BarsIcon = ({ size, color, speed }: { size: string; color: string; speed: string }) => (
  <div className={cn("flex items-end space-x-0.5", size.includes("w-3") ? "space-x-0.5" : "space-x-1")}>
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        className={cn(
          color,
          "bg-current",
          size.includes("w-3")
            ? "w-0.5"
            : size.includes("w-4")
              ? "w-1"
              : size.includes("w-6")
                ? "w-1"
                : size.includes("w-8")
                  ? "w-1.5"
                  : "w-2",
          "animate-pulse",
        )}
        style={{
          height: size.includes("w-3")
            ? "8px"
            : size.includes("w-4")
              ? "12px"
              : size.includes("w-6")
                ? "16px"
                : size.includes("w-8")
                  ? "20px"
                  : "24px",
          animationDelay: `${i * 0.1}s`,
          animationDuration: speed === "fast" ? "0.6s" : speed === "slow" ? "1.4s" : "1s",
        }}
      />
    ))}
  </div>
)

const RingIcon = ({ size, color, speed }: { size: string; color: string; speed: string }) => (
  <div className={cn(size, "relative")}>
    <div
      className={cn(
        size,
        color,
        "border-2 border-current border-t-transparent rounded-full",
        speed.replace("animate-spin", "animate-spin"),
      )}
    />
  </div>
)

const WaveIcon = ({ size, color, speed }: { size: string; color: string; speed: string }) => (
  <div className={cn("flex items-center space-x-0.5", size.includes("w-3") ? "space-x-0.5" : "space-x-1")}>
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className={cn(
          color,
          "bg-current rounded-full",
          size.includes("w-3")
            ? "w-1 h-1"
            : size.includes("w-4")
              ? "w-1 h-1"
              : size.includes("w-6")
                ? "w-1.5 h-1.5"
                : size.includes("w-8")
                  ? "w-2 h-2"
                  : "w-2.5 h-2.5",
          "animate-bounce",
        )}
        style={{
          animationDelay: `${i * 0.1}s`,
          animationDuration: speed === "fast" ? "0.8s" : speed === "slow" ? "1.6s" : "1.2s",
        }}
      />
    ))}
  </div>
)

export const Loading: React.FC<LoadingProps> = ({
  variant = "spinner",
  size = "md",
  color = "primary",
  speed = "normal",
  text,
  textPosition = "bottom",
  className,
  inline = false,
  overlay = false,
  textClassName,
}) => {
  const sizeClass = sizeClasses[size]
  const colorClass = colorClasses[color]
  const speedClass = speedClasses[speed]

  const renderIcon = () => {
    switch (variant) {
      case "dots":
        return <DotsIcon size={sizeClass} color={colorClass} speed={speedClass} />
      case "pulse":
        return <PulseIcon size={sizeClass} color={colorClass} />
      case "bars":
        return <BarsIcon size={sizeClass} color={colorClass} speed={speedClass} />
      case "ring":
        return <RingIcon size={sizeClass} color={colorClass} speed={speedClass} />
      case "wave":
        return <WaveIcon size={sizeClass} color={colorClass} speed={speedClass} />
      default:
        return <SpinnerIcon size={sizeClass} color={colorClass} speed={speedClass} />
    }
  }

  const content = (
    <div
      className={cn(
        "flex items-center justify-center",
        inline ? "inline-flex" : "flex",
        textPosition === "right" && "flex-row space-x-3",
        textPosition === "left" && "flex-row-reverse space-x-reverse space-x-3",
        textPosition === "top" && "flex-col-reverse space-y-reverse space-y-2",
        textPosition === "bottom" && "flex-col space-y-2",
        className,
      )}
    >
      {renderIcon()}
      {text && <span className={cn("text-sm font-medium", colorClass, textClassName)}>{text}</span>}
    </div>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

// Convenience components for common use cases
export const LoadingSpinner = (props: Omit<LoadingProps, "variant">) => <Loading {...props} variant="spinner" />

export const LoadingDots = (props: Omit<LoadingProps, "variant">) => <Loading {...props} variant="dots" />

export const LoadingPulse = (props: Omit<LoadingProps, "variant">) => <Loading {...props} variant="pulse" />

export const LoadingBars = (props: Omit<LoadingProps, "variant">) => <Loading {...props} variant="bars" />

export const LoadingRing = (props: Omit<LoadingProps, "variant">) => <Loading {...props} variant="ring" />

export const LoadingWave = (props: Omit<LoadingProps, "variant">) => <Loading {...props} variant="wave" />

export default Loading
