"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { uploadAvatar } from "@/features/profile/server-actions";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export const AvatarUpload = ({
  currentAvatar,
  onUploadSuccess,
  onUploadError,
}: AvatarUploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 4MB. Please upload a smaller image.";
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Unsupported file format. Please upload a JPG, PNG, GIF, or WebP image.";
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      onUploadError?.(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadAvatar({ file: selectedFile });

      if (result.success) {
        onUploadSuccess?.(result.data.url);
        setSelectedFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
      } else {
        const errorMessage =
          result.error || "Image upload failed. Please try again.";
        setError(errorMessage);
        onUploadError?.(errorMessage);
      }
    } catch {
      const errorMessage = "Image upload failed. Please try again.";
      setError(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleClickToSelect = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const displayImageUrl = previewUrl || currentAvatar;
  const hasImage = !!displayImageUrl;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all duration-200",
          {
            "border-blue-500 bg-blue-50 dark:bg-blue-950/30": isDragging,
            "border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-800":
              !isDragging,
            "cursor-not-allowed opacity-50": isUploading,
            "hover:border-gray-400 dark:hover:border-gray-600": !isUploading,
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClickToSelect}
        role="button"
        tabIndex={0}
        aria-label={hasImage ? "Change avatar" : "Upload avatar"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClickToSelect();
          }
        }}
      >
        {hasImage ? (
          <div className="relative aspect-square w-full max-w-xs p-4">
            <div className="border-border bg-background relative h-full w-full overflow-hidden rounded-full border-4">
              <Image
                src={displayImageUrl}
                alt={previewUrl ? "Selected avatar preview" : "Current avatar"}
                fill
                className="object-cover"
                sizes="(max-width: 384px) 100vw, 384px"
              />
            </div>
            {!selectedFile && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                <span className="text-primary-foreground text-sm font-medium">
                  Change
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <div className="bg-muted mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <Upload className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-foreground mb-1 text-sm font-medium">
              Click to upload or drag and drop
            </p>
            <p className="text-muted-foreground text-xs">
              JPG, PNG, GIF, or WebP (max 4MB)
            </p>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isUploading}
        aria-label="File input for avatar upload"
      />

      {error && (
        <div
          className="border-destructive/30 bg-destructive/10 flex items-start gap-2 rounded-md border p-3"
          role="alert"
        >
          <X className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {selectedFile && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1 sm:flex-none"
            aria-label="Upload selected avatar"
          >
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
            className="flex-1 sm:flex-none"
            aria-label="Cancel avatar upload"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
            <div className="bg-primary h-full w-3/4 animate-pulse rounded-full"></div>
          </div>
          <p className="text-muted-foreground text-center text-xs">
            Uploading your avatar...
          </p>
        </div>
      )}
    </div>
  );
};
