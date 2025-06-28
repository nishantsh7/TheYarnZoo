
"use client";

import Link from 'next/link';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { LogIn, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';

const loginSchema = z.object({
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Display NextAuth error messages if any
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      let errorMessage = "Login failed. Please try again.";
      if (error === "CredentialsSignin") {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.includes("Please provide email and password")) {
        errorMessage = "Please enter both email and password.";
      }
      // You can add more specific error handling here based on error codes from NextAuth
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
      // Remove error from URL to prevent re-showing toast on refresh
      router.replace('/login', { scroll: false });
    }
  }, [searchParams, toast, router]);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsLoading(true);
    const result = await signIn('credentials', {
      redirect: false, // We'll handle redirect manually
      email: data.email,
      password: data.password,
    });
    setIsLoading(false);

    if (result?.ok && !result.error) {
      toast({
        title: "Login Successful!",
        description: "Welcome back!",
      });
      // Redirect to a desired page, e.g., admin dashboard or home
      const callbackUrl = searchParams.get('callbackUrl') || '/admin/dashboard';
      router.push(callbackUrl);
    } else {
      // Error handling is now primarily done via the useEffect hook watching searchParams.
      // However, we can provide a fallback toast here if signIn itself returns an error message directly.
      toast({
        title: "Login Failed",
        description: result?.error || "Invalid email or password. Please check your credentials.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-accent mb-4" />
          <CardTitle className="text-3xl font-headline">Welcome Back!</CardTitle>
          <CardDescription>Sign in to continue your shopping journey.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" {...field} disabled={isLoading} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-accent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate text-lg" disabled={isLoading || form.formState.isSubmitting}>
                {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-2">
          <Link href="#" className="text-sm text-accent hover:underline">
            Forgot your password?
          </Link>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-accent hover:underline">
              Sign up here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
