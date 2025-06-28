"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Package, ShoppingCart, Users, BarChart3, LogOut, Settings, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/support', label: 'Support Chat', icon: MessageSquare },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground p-4 space-y-6 flex flex-col shadow-lg">
      <Link href="/admin/dashboard" className="text-2xl font-headline font-bold text-sidebar-primary hover:text-sidebar-accent transition-colors block px-2 py-1">
        TheYarnZoo Admin
      </Link>
      
      <nav className="flex-grow">
        <ul className="space-y-1">
          {navItems.map(item => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors btn-subtle-animate",
                  pathname.startsWith(item.href) 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div>
        <Separator className="my-4 bg-sidebar-border" />
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors btn-subtle-animate"
        >
          <LogOut className="h-5 w-5" />
          Back to Site (Logout)
        </Link>
      </div>
    </aside>
  );
}

// Dummy Separator if not imported from shadcn/ui (though it should be)
const Separator = ({ className }: { className?: string }) => <hr className={cn("border-t", className)} />;
