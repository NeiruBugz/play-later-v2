"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

import { validateAvatarFile } from "@/features/profile/lib/validate-avatar-file";
import { uploadAvatar } from "@/features/profile/server-actions/upload-avatar";

type UseAvatarUploadOptions = {
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
};

export function useAvatarUpload({
  onUploadSuccess,
  onUploadError,
  onUploadStateChange,
}: UseAvatarUploadOptions) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectFile = (file: File) => {
    const validationError = validateAvatarFile(file);

    if (validationError) {
      setError(validationError);
      onUploadError?.(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
    e.currentTarget.value = "";
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (isUploading) return;
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) selectFile(file);
  };

  const openFilePicker = () => {
    if (!isUploading) fileInputRef.current?.click();
  };

  const upload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    onUploadStateChange?.(true);
    setError(null);

    try {
      const result = await uploadAvatar({ file: selectedFile });

      if (result.success) {
        onUploadSuccess?.(result.data.url);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setSelectedFile(null);
        setPreviewUrl(null);
      } else {
        const message =
          result.error || "Image upload failed. Please try again.";
        setError(message);
        onUploadError?.(message);
      }
    } catch {
      const message = "Image upload failed. Please try again.";
      setError(message);
      onUploadError?.(message);
    } finally {
      setIsUploading(false);
      onUploadStateChange?.(false);
    }
  };

  return {
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
    cancel: reset,
  };
}
