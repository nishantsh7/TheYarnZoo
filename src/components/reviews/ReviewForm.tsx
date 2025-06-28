"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const reviewSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  rating: z.number().min(1, "Rating is required.").max(5),
  text: z.string().min(10, "Review must be at least 10 characters.").max(500, "Review must be 500 characters or less."),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  productId: string;
  onSubmitSuccess?: () => void;
}

const ReviewForm = ({ productId, onSubmitSuccess }: ReviewFormProps) => {
  const [hoverRating, setHoverRating] = useState(0);
  const { toast } = useToast();
  
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      name: '',
      rating: 0,
      text: '',
    },
  });

  const onSubmit: SubmitHandler<ReviewFormData> = async (data) => {
    // Placeholder for actual submission logic
    console.log('Review submitted:', { ...data, productId });
    toast({
      title: "Review Submitted!",
      description: "Thank you for your feedback.",
    });
    form.reset();
    if (onSubmitSuccess) onSubmitSuccess(); 
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-headline font-semibold text-foreground">Write a Review</h3>
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Rating</FormLabel>
              <FormControl>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 cursor-pointer transition-colors duration-150 
                        ${(hoverRating || field.value) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/50'}`}
                      onClick={() => field.onChange(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                    />
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Review</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us about your experience with the product..." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate">
          Submit Review
        </Button>
      </form>
    </Form>
  );
};

export default ReviewForm;
