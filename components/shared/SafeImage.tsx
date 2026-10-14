"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

type SafeImageProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> & {
  src: string;
  alt: string;
  fallbackClassName?: string;
};

export function SafeImage({
  src,
  alt,
  className,
  fallbackClassName,
  loading = "lazy",
  ...props
}: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (failedSrc === src) {
    return (
      <div
        role={alt ? "img" : undefined}
        aria-label={alt || undefined}
        aria-hidden={alt ? undefined : true}
        className={cn(
          "flex h-full w-full items-center justify-center bg-surface-container text-on-surface-variant",
          fallbackClassName,
        )}
      >
        <ImageOff className="h-6 w-6" aria-hidden="true" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailedSrc(src)}
      {...props}
    />
  );
}
