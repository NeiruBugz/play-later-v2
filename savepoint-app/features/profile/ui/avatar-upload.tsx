"use client";

import { Upload, X } from "lucide-react";
import Image from "next/image";

import { useAvatarUpload } from "@/features/profile/hooks/use-avatar-upload";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";

import type { AvatarUploadProps } from "./avatar-upload.types";

export const AvatarUpload = ({
  currentAvatar,
  onUploadSuccess,
  onUploadError,
  onUploadStateChange,
}: AvatarUploadProps) => {
  const {
    fileInputRef,
    selectedFile,
    previewUrl,
    isUploading,
    isDragging,
    error,
    onFileInputChange,
    onDragOver,
    onDragLeave,
    onDrop,
    openFilePicker,
    upload,
    cancel,
  } = useAvatarUpload({
    onUploadSuccess,
    onUploadError,
    onUploadStateChange,
  });

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
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={openFilePicker}
        role="button"
        tabIndex={0}
        aria-label={hasImage ? "Change avatar" : "Upload avatar"}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openFilePicker();
          }
        }}
      >
        {hasImage ? (
          <AvatarPreview
            url={displayImageUrl}
            isPreview={!!previewUrl}
            showHoverHint={!selectedFile}
          />
        ) : (
          <DropZonePlaceholder />
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileInputChange}
        disabled={isUploading}
        aria-label="File input for avatar upload"
      />

      {error && <ErrorBanner message={error} />}

      {selectedFile && (
        <UploadActions
          isUploading={isUploading}
          onUpload={upload}
          onCancel={cancel}
        />
      )}

      {isUploading && <UploadProgress />}
    </div>
  );
};

function AvatarPreview({
  url,
  isPreview,
  showHoverHint,
}: {
  url: string;
  isPreview: boolean;
  showHoverHint: boolean;
}) {
  return (
    <div className="p-xl relative aspect-square w-full max-w-xs">
      <div className="border-border bg-background relative h-full w-full overflow-hidden rounded-full border-4">
        <Image
          src={url}
          alt={isPreview ? "Selected avatar preview" : "Current avatar"}
          fill
          className="object-cover"
          sizes="(max-width: 384px) 100vw, 384px"
        />
      </div>
      {showHoverHint && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity hover:opacity-100">
          <span className="text-primary-foreground text-sm font-medium">
            Change
          </span>
        </div>
      )}
    </div>
  );
}

function DropZonePlaceholder() {
  return (
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
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      className="border-destructive/30 bg-destructive/10 gap-md p-lg flex items-start rounded-md border"
      role="alert"
    >
      <X className="text-destructive mt-xs h-4 w-4 shrink-0" />
      <p className="text-destructive text-sm">{message}</p>
    </div>
  );
}

function UploadActions({
  isUploading,
  onUpload,
  onCancel,
}: {
  isUploading: boolean;
  onUpload: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="gap-md flex flex-col sm:flex-row">
      <Button
        onClick={onUpload}
        disabled={isUploading}
        className="flex-1 sm:flex-none"
        aria-label="Upload selected avatar"
      >
        <Upload className="mr-md h-4 w-4" />
        {isUploading ? "Uploading..." : "Upload"}
      </Button>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isUploading}
        className="flex-1 sm:flex-none"
        aria-label="Cancel avatar upload"
      >
        <X className="mr-md h-4 w-4" />
        Cancel
      </Button>
    </div>
  );
}

function UploadProgress() {
  return (
    <div className="space-y-md">
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div className="bg-primary h-full w-3/4 animate-pulse rounded-full"></div>
      </div>
      <p className="text-muted-foreground text-center text-xs">
        Uploading your avatar...
      </p>
    </div>
  );
}
