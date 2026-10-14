"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ value, onChange, disabled }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG or WebP images are allowed");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be 5MB or smaller");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setIsUploading(true);
    try {
      // apiClient forces a JSON content-type, so multipart goes through fetch
      const response = await fetch("/api/v1/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.url) {
        throw new Error(data.error || "Upload failed");
      }
      onChange(data.url);
      toast.success("Photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        aria-label="Upload item photo"
        disabled={disabled || isUploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {value ? (
        <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-outline bg-surface-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded item preview"
            className="h-full w-full object-cover"
          />
          <Button
            type="button"
            size="icon-sm"
            variant="secondary"
            onClick={() => onChange("")}
            disabled={disabled || isUploading}
            aria-label="Remove photo"
            className="absolute right-2 top-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        disabled={disabled || isUploading}
        onClick={() => inputRef.current?.click()}
        className="border-outline text-on-surface hover:bg-surface-container"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Uploading...
          </>
        ) : (
          <>
            <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
            {value ? "Replace photo" : "Upload photo"}
          </>
        )}
      </Button>
      <p className="text-label-sm text-on-surface-variant">
        JPG, PNG or WebP, up to 5MB.
      </p>
    </div>
  );
}
