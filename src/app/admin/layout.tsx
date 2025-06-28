
import AdminSidebar from '@/components/layout/AdminSidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel - TheYarnZoo',
  description: 'Manage products, orders, and customers for TheYarnZoo.',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8 bg-muted/30 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
