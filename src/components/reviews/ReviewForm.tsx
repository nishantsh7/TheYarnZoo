
"use client";

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Star, LogIn, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { submitReviewAction } from '@/actions/productActions';

const reviewSchema = z.object({
  productId: z.string(),
  userId: z.string(),
  userName: z.string().min(2, "Name must be at least 2 characters."),
  rating: z.coerce.number().min(1, "Rating is required.").max(5),
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
  const { data: session, status } = useSession();
  
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      productId: productId,
      userId: session?.user?.id || '',
      userName: session?.user?.name || '',
      rating: 0,
      text: '',
    },
  });
  
  // Update form default values when session loads
  useState(() => {
    if (session) {
      form.reset({
        productId: productId,
        userId: session.user.id,
        userName: session.user.name || '',
        rating: 0,
        text: '',
      });
    }
  });


  const onSubmit: SubmitHandler<ReviewFormData> = async (data) => {
    if (!session?.user?.id) {
        toast({ title: "Authentication Error", description: "You must be logged in to submit a review.", variant: "destructive" });
        return;
    }
    const response = await submitReviewAction(data);
    
    if (response.success) {
      toast({
        title: "Review Submitted!",
        description: response.message,
      });
      form.reset({
          ...form.getValues(),
          rating: 0,
          text: '',
      });
      if (onSubmitSuccess) onSubmitSuccess();
    } else {
        toast({
            title: "Submission Failed",
            description: response.message,
            variant: "destructive",
        });
    }
  };

  if (status === "loading") {
      return (
          <div className="bg-card p-6 rounded-lg shadow-md flex items-center justify-center h-full min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin text-accent" />
          </div>
      )
  }

  if (status === "unauthenticated") {
      return (
          <div className="bg-card p-8 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-headline font-semibold text-foreground mb-4">Want to leave a review?</h3>
              <p className="text-muted-foreground mb-6">Please sign in to share your thoughts on this product.</p>
              <Button asChild>
                  <Link href="/login">
                      <LogIn className="mr-2 h-4 w-4" /> Sign In
                  </Link>
              </Button>
          </div>
      )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-card p-6 rounded-lg shadow-md">
        <h3 className="text-2xl font-headline font-semibold text-foreground">Write a Review</h3>
        
        <input type="hidden" {...form.register('productId')} />
        <input type="hidden" {...form.register('userId')} />
        <input type="hidden" {...form.register('userName')} />

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
              <FormLabel>Your Review (by {session?.user?.name})</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us about your experience with the product..." {...field} rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full md:w-auto bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Review
        </Button>
      </form>
    </Form>
  );
};

export default ReviewForm;

