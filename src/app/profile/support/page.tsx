// app/profile/support/page.tsx
import { Suspense } from 'react';
import CustomerSupportClientPage from './CustomerSupportClientPage'; // Import your renamed client component
import { Loader2 } from 'lucide-react'; // Assuming you have lucide-react for loading spinners

export default function ProfileSupportPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="ml-2">Loading profile support...</p>
      </div>
    }>
      <CustomerSupportClientPage />
    </Suspense>
  );
}