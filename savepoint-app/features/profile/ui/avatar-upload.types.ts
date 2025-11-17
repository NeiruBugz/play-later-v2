export interface AvatarUploadProps {
  currentAvatar?: string | null;
  onUploadSuccess?: (url: string) => void;
  onUploadError?: (error: string) => void;
  onUploadStateChange?: (isUploading: boolean) => void;
}
