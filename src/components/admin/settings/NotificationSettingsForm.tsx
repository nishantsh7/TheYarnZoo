
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { NotificationSettingsData } from '@/actions/settingsActions';
import { saveNotificationSettingsAction } from '@/actions/settingsActions';
import { Separator } from '@/components/ui/separator';

const notificationSettingsSchema = z.object({
  newOrderAdmin: z.boolean(),
  newOrderCustomer: z.boolean(),
  shippingUpdateCustomer: z.boolean(),
  lowStockAdmin: z.boolean(),
  adminEmail: z.string().email("Invalid email address for notifications."),
});

interface NotificationSettingsFormProps {
  initialData: NotificationSettingsData;
}

export default function NotificationSettingsForm({ initialData }: NotificationSettingsFormProps) {
  const { toast } = useToast();

  const form = useForm<NotificationSettingsData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: initialData,
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: NotificationSettingsData) => {
    const response = await saveNotificationSettingsAction(data);
    if (response.success) {
      toast({ title: "Success", description: response.message });
    } else {
      toast({ title: "Error", description: response.message, variant: "destructive" });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="newOrderAdmin"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                <div className="space-y-0.5">
                  <FormLabel>Notify admin on new order</FormLabel>
                  <FormDescription>Send an email to the admin when a new order is placed.</FormDescription>
                </div>
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newOrderCustomer"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                <div className="space-y-0.5">
                  <FormLabel>Send order confirmation to customer</FormLabel>
                  <FormDescription>Send a confirmation email to the customer after purchase.</FormDescription>
                </div>
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shippingUpdateCustomer"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                <div className="space-y-0.5">
                  <FormLabel>Notify customer on shipping updates</FormLabel>
                  <FormDescription>Send an email when the order status changes (e.g., shipped).</FormDescription>
                </div>
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lowStockAdmin"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-muted/30">
                <div className="space-y-0.5">
                  <FormLabel>Notify admin on low stock alerts</FormLabel>
                  <FormDescription>Send an email when a product's stock falls below a threshold (not yet implemented).</FormDescription>
                </div>
                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
        </div>
        <Separator />
        <FormField
          control={form.control}
          name="adminEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Admin Notification Email</FormLabel>
              <FormControl><Input type="email" {...field} /></FormControl>
              <FormDescription>This is the email address that will receive admin notifications.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Notification Settings
        </Button>
      </form>
    </Form>
  );
}
