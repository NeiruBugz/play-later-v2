"use client";

import { Fragment } from "react";
import { addGameReview } from "@/features/library/actions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Game } from "@prisma/client";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

const reviewSchema = z.object({
  rating: z.string().optional(),
  review: z.string().min(1),
});

type Review = z.infer<typeof reviewSchema>;

function ReviewForm({ id }: { id: Game["id"] }) {
  const form = useForm<Review>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: "3",
    },
  });
  const onSubmit = async (values: Review) => {
    const { review, rating } = values;
    if (!review && !rating) {
      return;
    }

    try {
      await addGameReview({
        id,
        rating: rating ? Number(rating) : 0,
        review,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section>
      <h3 className="my-2 scroll-m-20 text-2xl font-semibold tracking-tight">
        Review and rating
      </h3>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex max-w-[320px] flex-col gap-2"
        >
          <FormField
            control={form.control}
            name="review"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Review</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your thoughts on this game"
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rating</FormLabel>
                <RadioGroup
                  className="flex gap-2 space-x-1"
                  onValueChange={field.onChange}
                  defaultValue={field.value ? String(field.value) : ""}
                >
                  <FormItem className="space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Fragment key={`rating-${i}`}>
                        <FormControl>
                          <RadioGroupItem value={String(i + 1)} />
                        </FormControl>
                        <FormLabel>{i + 1}</FormLabel>
                      </Fragment>
                    ))}
                  </FormItem>
                </RadioGroup>
              </FormItem>
            )}
          />
          <Button type="submit">Submit</Button>
        </form>
      </Form>
    </section>
  );
}

export { ReviewForm };
