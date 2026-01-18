export interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  onValidationChange?: (hasError: boolean) => void;
}
