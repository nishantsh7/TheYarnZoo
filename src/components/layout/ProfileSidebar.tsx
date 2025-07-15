
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, ShoppingCart, MapPin, LifeBuoy, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { signOut } from 'next-auth/react';

const navItems = [
  { href: '/profile', label: 'My Profile', icon: User, exact: true },
  { href: '/profile/orders', label: 'My Orders', icon: ShoppingCart },
  { href: '/profile/address', label: 'My Address', icon: MapPin },
  { href: '/profile/support', label: 'Support Chat', icon: LifeBuoy },
  { href: '/profile/settings', label: 'Account Settings', icon: Settings },
];

export default function ProfileSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 bg-card p-4 md:p-6 rounded-lg shadow-lg flex flex-col self-start">
      <nav className="flex-grow">
        <ul className="space-y-2">
          {navItems.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors btn-subtle-animate",
                  (item.exact ? pathname === item.href : pathname.startsWith(item.href))
                    ? "bg-secondary text-secondary-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          ))}
           <li>
              <Button 
                variant="ghost" 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full justify-start flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
           </li>
        </ul>
      </nav>
    </aside>
  );
}
