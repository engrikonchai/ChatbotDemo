"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface ImageWithFallbackProps extends Omit<ImageProps, "onError"> {
  fallbackLabel?: string;
}

/**
 * Wraps next/image with a graceful fallback: if the remote placeholder
 * image service is unreachable, show a soft branded placeholder instead
 * of a broken-image icon.
 */
export function ImageWithFallback({
  fallbackLabel = "Image unavailable",
  alt,
  className,
  ...props
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={typeof alt === "string" ? alt : fallbackLabel}
        className={cn(
          "flex flex-col items-center justify-center gap-2 bg-sand-light text-navy/40",
          className,
        )}
      >
        <ImageOff className="h-8 w-8" aria-hidden="true" />
        <span className="text-xs font-medium">{fallbackLabel}</span>
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
