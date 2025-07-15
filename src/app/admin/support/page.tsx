// app/admin/support/page.tsx
import { Suspense } from 'react';
import AdminSupportClientPage from './AdminSupportClientPage'; // Import your renamed client component
import { Loader2 } from "lucide-react"; // Import Loader2 for the fallback

export default function AdminSupportPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="ml-2">Loading support page...</p>
      </div>
    }>
      <AdminSupportClientPage />
    </Suspense>
  );
}