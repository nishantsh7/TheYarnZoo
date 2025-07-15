
'use server';

import { z } from 'zod';
import { connectToDatabase } from '@/lib/mongodb';
import { revalidatePath } from 'next/cache';

const SETTING_KEY = 'notificationSettings';

const NotificationSettingsSchema = z.object({
  newOrderAdmin: z.boolean(),
  newOrderCustomer: z.boolean(),
  shippingUpdateCustomer: z.boolean(),
  lowStockAdmin: z.boolean(),
  adminEmail: z.string().email("Invalid email address for notifications."),
});

export type NotificationSettingsData = z.infer<typeof NotificationSettingsSchema>;

export async function getNotificationSettingsAction(): Promise<NotificationSettingsData> {
  try {
    const { db } = await connectToDatabase();
    const settingsCollection = db.collection('settings');
    const settings = await settingsCollection.findOne({ key: SETTING_KEY });

    if (settings && settings.value) {
      return NotificationSettingsSchema.parse(settings.value);
    }
  } catch (error) {
    console.error("Error fetching notification settings:", error);
  }

  // Default settings if not found in DB or if there's an error
  return {
    newOrderAdmin: true,
    newOrderCustomer: true,
    shippingUpdateCustomer: true,
    lowStockAdmin: false,
    adminEmail: 'admin@theyarnzoo.com',
  };
}

export async function saveNotificationSettingsAction(
  data: NotificationSettingsData
): Promise<{ success: boolean; message: string }> {
  const validatedFields = NotificationSettingsSchema.safeParse(data);

  if (!validatedFields.success) {
    return { success: false, message: "Invalid settings data." };
  }

  try {
    const { db } = await connectToDatabase();
    const settingsCollection = db.collection('settings');

    await settingsCollection.updateOne(
      { key: SETTING_KEY },
      { $set: { key: SETTING_KEY, value: validatedFields.data } },
      { upsert: true }
    );

    revalidatePath('/admin/settings');
    
    return { success: true, message: "Notification settings saved successfully." };
  } catch (error) {
    console.error("Error saving notification settings:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}
