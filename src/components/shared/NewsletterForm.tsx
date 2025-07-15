
'use client';

import { useRef, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { subscribeToNewsletterAction, type NewsletterActionResponse } from '@/actions/newsletterActions';
import { Loader2 } from 'lucide-react';

const initialState: NewsletterActionResponse = {
  success: false,
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 rounded-r-md btn-subtle-animate" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : 'Subscribe'}
    </Button>
  );
}

export default function NewsletterForm({className}: {className?: string}) {
  const [state, formAction] = useActionState(subscribeToNewsletterAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success!',
          description: state.message,
        });
        formRef.current?.reset();
      } else {
        toast({
          title: 'Oops!',
          description: state.message,
          variant: 'destructive',
        });
      }
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className={className}>
      <Input
        type="email"
        name="email"
        placeholder="Enter your email address"
        required
        className="py-3 px-4 rounded-l-md border-border focus:ring-accent focus:border-accent flex-grow"
        aria-label="Email for newsletter"
      />
      <SubmitButton />
    </form>
  );
}
