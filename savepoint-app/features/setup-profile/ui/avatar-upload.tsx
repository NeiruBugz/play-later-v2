"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";
import { uploadAvatar } from "@/shared/server-actions/profile";

import type { AvatarUploadProps } from "./avatar-upload.types";

const MAX_FILE_SIZE = 4 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const AvatarUpload = ({
  currentAvatar,
  onUploadSuccess,
  onUploadError,
  onUploadStateChange,
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
    onUploadStateChange?.(true);
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
      onUploadStateChange?.(false);
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
    <div className="space-y-xl">
      <div
        className={cn(
          "duration-normal relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all",
          {
            "border-accent bg-accent/10": isDragging,
            "border-border bg-card": !isDragging,
            "cursor-not-allowed opacity-50": isUploading,
            "hover:border-muted-foreground": !isUploading,
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
          <div className="p-xl relative aspect-square w-full max-w-xs">
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
          <div className="px-2xl py-4xl text-center">
            <div className="bg-muted mb-lg mx-auto flex h-12 w-12 items-center justify-center rounded-full">
              <Upload className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-foreground mb-xs text-sm font-medium">
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
          className="border-destructive/30 bg-destructive/10 gap-md p-lg flex items-start rounded-md border"
          role="alert"
        >
          <X className="text-destructive mt-xs h-4 w-4 shrink-0" />
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}
      {selectedFile && (
        <div className="gap-md flex flex-col sm:flex-row">
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="flex-1 sm:flex-none"
            aria-label="Upload selected avatar"
          >
            <Upload className="mr-md h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
            className="flex-1 sm:flex-none"
            aria-label="Cancel avatar upload"
          >
            <X className="mr-md h-4 w-4" />
            Cancel
          </Button>
        </div>
      )}
      {isUploading && (
        <div className="space-y-md">
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
