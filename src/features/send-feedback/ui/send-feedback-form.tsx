"use client";

import { postFeedbackAction } from "@/src/features/send-feedback/api/action";
import { Button } from "@/src/shared/ui";
import { Checkbox } from "@/src/shared/ui/checkbox";
import { Label } from "@/src/shared/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/shared/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/shared/ui/select";
import { Textarea } from "@/src/shared/ui/textarea";
import { useToast } from "@/src/shared/ui/use-toast";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useActionState } from "react";

const feedbackTypeOptions = [
  { label: "Idea", type: "idea" },
  { label: "Issue", type: "issue" },
  { label: "Question", type: "question" },
  { label: "Complaint", type: "complaint" },
  { label: "Feature Request", type: "featureRequest" },
  { label: "Other", type: "other" },
];

export function SendFeedbackForm() {
  const [isPopoverOpen, setPopoverOpen] = useState(false);
  const [state, action] = useActionState(postFeedbackAction, { message: "" });
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();
  const pathname = usePathname();

  useEffect(() => {
    if (state.message === "Success") {
      formRef.current?.reset();
      setPopoverOpen(false);
      toast({
        title: "Success",
        description: "Feedback sent successfully!",
      });
    }
  }, [state.message, toast]);

  if (pathname === "/") return null;

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button className="fixed bottom-6 right-6 rounded-full shadow-lg">
            💬
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <form className="flex flex-col gap-3" action={action} ref={formRef}>
            <div>
              <Label htmlFor="feedback">Your feedback</Label>
              <Textarea
                name="feedback"
                placeholder="Everything is great but..."
              />
            </div>
            <div>
              <Label htmlFor="label">Type (Optional)</Label>
              <Select name="label" defaultValue="other">
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  {feedbackTypeOptions.map(({ type, label }) => (
                    <SelectItem value={type} key={type}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Label
              className="flex items-center gap-2"
              htmlFor="includeEmailAndName"
            >
              Include email and name (Optional)
              <Checkbox name="includeEmailAndName" defaultChecked={false} />
            </Label>
            <Button type="submit">Send</Button>
          </form>
        </PopoverContent>
      </Popover>
    </>
  );
}
