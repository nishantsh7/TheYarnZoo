
import ProfileSidebar from '@/components/layout/ProfileSidebar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Profile - TheYarnZoo',
  description: 'Manage your profile, orders, and settings.',
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-15rem)] gap-8">
      <ProfileSidebar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
