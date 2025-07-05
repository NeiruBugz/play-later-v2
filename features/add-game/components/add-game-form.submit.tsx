import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { Button } from "@/shared/components";

type SubmitButtonProps = {
  onFormReset: () => void;
  isDisabled?: boolean;
  isLoading?: boolean;
};

export function SubmitButton({
  onFormReset,
  isDisabled,
  isLoading = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isButtonDisabled = isDisabled || pending || isLoading;

  return (
    <>
      <Button className="mr-2 mt-2" type="submit" disabled={isButtonDisabled}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding to collection...
          </>
        ) : (
          "Save"
        )}
      </Button>
      <Button
        variant="secondary"
        onClick={onFormReset}
        className="mt-2"
        type="reset"
        disabled={isButtonDisabled}
      >
        Reset
      </Button>
    </>
  );
}
