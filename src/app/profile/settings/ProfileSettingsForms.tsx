
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateUserProfileName, updateUserPassword } from '@/actions/userProfileActions';
import { signOut } from 'next-auth/react';

// Schema for updating name
const updateNameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
});
type UpdateNameFormData = z.infer<typeof updateNameSchema>;

// Schema for updating password
const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(6, "New password must be at least 6 characters."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});
type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

interface ProfileSettingsFormsProps {
  userId: string;
  currentName: string;
}

export default function ProfileSettingsForms({ userId, currentName }: ProfileSettingsFormsProps) {
  const { toast } = useToast();

  const nameForm = useForm<UpdateNameFormData>({
    resolver: zodResolver(updateNameSchema),
    defaultValues: { name: currentName },
  });

  const passwordForm = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onNameSubmit = async (data: UpdateNameFormData) => {
    const response = await updateUserProfileName(userId, data);
    if (response.success) {
      toast({ title: "Success", description: response.message });
      // Optionally refresh the session or page to show new name in header
      window.location.reload();
    } else {
      toast({ title: "Error", description: response.message, variant: "destructive" });
    }
  };

  const onPasswordSubmit = async (data: UpdatePasswordFormData) => {
    const response = await updateUserPassword(userId, data);
    if (response.success) {
      toast({ title: "Success", description: response.message });
      await signOut({ callbackUrl: '/login' });
    } else {
      toast({ title: "Error", description: response.message, variant: "destructive" });
      passwordForm.reset();
    }
  };

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="profile">Profile Details</TabsTrigger>
        <TabsTrigger value="password">Change Password</TabsTrigger>
      </TabsList>
      
      <TabsContent value="profile" className="mt-6">
        <Form {...nameForm}>
          <form onSubmit={nameForm.handleSubmit(onNameSubmit)} className="space-y-6">
            <FormField
              control={nameForm.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={nameForm.formState.isSubmitting}>
              {nameForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Name
            </Button>
          </form>
        </Form>
      </TabsContent>
      
      <TabsContent value="password" className="mt-6">
        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
            <FormField
              control={passwordForm.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl><Input type="password" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Password
            </Button>
          </form>
        </Form>
      </TabsContent>
    </Tabs>
  );
}
