
'use client';
import Link from 'next/link';
import { ShoppingCart, User, Menu, LogOut, LogIn as LogInIcon, ShieldCheck, LayoutGrid, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import IntentSearchBar from '@/components/shared/IntentSearchBar';
import { useCart } from '@/context/CartContext';
import { useSession, signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const { getItemCount, cartItems } = useCart();
  const [cartItemCount, setCartItemCount] = useState(0);
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === 'admin';
  const isCustomer = status === 'authenticated' && !isAdmin;

  useEffect(() => {
    setCartItemCount(getItemCount());
  }, [cartItems, getItemCount]);

  const navItemsBase = [
    { href: '/', label: 'Home', icon: HomeIcon, showPublic: true, showAuth: false, showAdmin: false, showCustomer: false }, 
    { href: '/products', label: 'Products', icon: null, showPublic: true, showAuth: false, showAdmin: false, showCustomer: false },
    { href: '/about-us', label: 'About Us', icon: null, showPublic: true, showAuth: false, showAdmin: false, showCustomer: false },
    { href: '/#contact', label: 'Contact', icon: null, showPublic: true, showAuth: false, showAdmin: false, showCustomer: false },
  ];

  const getFilteredNavLinks = (isMobile: boolean = false) => {
    let links = [...navItemsBase];
    if (status === 'authenticated') {
        links = links.filter(item => {
            if (isMobile && item.href === '/' && item.icon) return true;
            return item.showAuth || (isAdmin && item.showAdmin) || (isCustomer && item.showCustomer);
        });
    } else {
        links = links.filter(item => item.showPublic);
    }
    return links;
  };
  
  const currentDesktopNavLinks = getFilteredNavLinks(false);
  const currentMobileNavLinks = getFilteredNavLinks(true);


  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const drawerCategories = [
    { name: 'Animals', slug: 'Animals' },
    { name: 'Anime', slug: 'Anime' },
    { name: 'Disney', slug: 'Disney' },
    { name: 'Marvel', slug: 'Marvel' },
    { name: 'Bears', slug: 'Bears' },
    { name: 'Fantasy', slug: 'Fantasy' },
    { name: 'Insects', slug: 'Insects' },
  ];

  return (
    <header className="bg-card shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2 md:gap-3">
          <Sheet open={isCategoryDrawerOpen} onOpenChange={setIsCategoryDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open category drawer">
                <LayoutGrid className="h-6 w-6 text-accent" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-background p-6">
              <SheetHeader>
                <SheetTitle className="text-xl font-headline font-bold text-primary">Categories</SheetTitle>
                <SheetDescription className="sr-only">A list of product categories to browse.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-y-2 mt-4">
                {drawerCategories.map(category => (
                  <SheetClose asChild key={category.slug}>
                    <Link
                      href={`/products?category=${encodeURIComponent(category.slug)}`}
                      className="block py-2 px-3 text-foreground hover:bg-muted hover:text-accent rounded-md transition-colors"
                      onClick={() => setIsCategoryDrawerOpen(false)}
                    >
                      {category.name}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/" className="text-2xl font-headline font-bold text-primary hover:text-accent transition-colors">
            TheYarnZoo
          </Link>

          {status === 'authenticated' && (
            <Link href="/" title="Home" className="text-foreground hover:text-accent transition-colors hidden md:inline-flex ml-1">
              <HomeIcon className="h-6 w-6" />
            </Link>
          )}
        </div>

        <div className="flex-grow hidden md:flex justify-center items-center px-4">
          <div className="w-full max-w-2xl">
            <IntentSearchBar />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3">
          <div className="hidden md:block w-full max-w-xs flex-grow"> 
            {status !== 'authenticated' && <IntentSearchBar />}
          </div>

          {status === 'loading' ? (
            <div className="h-8 w-8 animate-pulse bg-muted rounded-full hidden md:inline-flex"></div>
          ) : status === 'authenticated' ? (
            <>
              {isAdmin && (
                <Link href="/admin/dashboard" className="hidden md:flex items-center text-foreground hover:text-accent transition-colors font-medium gap-1" title="Admin Panel">
                  <ShieldCheck className="h-5 w-5" />
                   <span className="hidden lg:inline">Admin</span>
                </Link>
              )}
              {isCustomer && (
                  <Link href="/profile" className="hidden md:flex items-center text-foreground hover:text-accent transition-colors font-medium gap-1" title="My Profile">
                    <User className="h-5 w-5" />
                    <span className="hidden lg:inline">My Profile</span>
                </Link>
              )}
              <Avatar className="h-8 w-8 hidden md:inline-flex cursor-default" title={session.user?.name || 'User'}>
                <AvatarImage src={session.user?.image || undefined} alt={session.user?.name || 'User'} />
                <AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="hidden md:inline-flex" title="Sign Out">
                <LogOut className="h-6 w-6 text-accent" />
                <span className="sr-only">Sign Out</span>
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="icon" className="hidden md:inline-flex" asChild title="Sign In / Account">
              <Link href="/login">
                <User className="h-6 w-6 text-accent" />
                <span className="sr-only">Sign In / Account</span>
              </Link>
            </Button>
          )}

          {status === 'authenticated' && (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/cart" className="relative">
                <ShoppingCart className="h-6 w-6 text-accent" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
                <span className="sr-only">Shopping Cart</span>
              </Link>
            </Button>
          )}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Open main menu">
                <Menu className="h-6 w-6 text-accent" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background p-6">
                <SheetHeader className="text-left mb-4">
                  <SheetTitle>
                    <SheetClose asChild>
                      <Link href="/" className="text-xl font-headline font-bold text-primary" onClick={() => setIsMobileMenuOpen(false)}>
                        TheYarnZoo
                      </Link>
                    </SheetClose>
                  </SheetTitle>
                  <SheetDescription className="sr-only">Main menu and site navigation.</SheetDescription>
                </SheetHeader>
                <div className="flex flex-col gap-6">
                    <IntentSearchBar />
                    
                    {currentMobileNavLinks.map(link => {
                      if (status === 'authenticated' && link.href === '/' && link.icon) {
                        return (
                          <SheetClose asChild key={link.href + "-mobile-auth-home"}>
                            <Link
                              href={link.href}
                              className="flex items-center gap-2 text-foreground hover:text-accent transition-colors text-lg"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              <link.icon className="h-5 w-5" />
                              <span>{link.label}</span>
                            </Link>
                          </SheetClose>
                        );
                      }
                      return (
                        <SheetClose asChild key={link.href + "-mobile"}>
                          <Link
                            href={link.href}
                            className="flex items-center gap-2 text-foreground hover:text-accent transition-colors text-lg"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            {link.icon && <link.icon className="h-5 w-5" /> }
                            <span>{link.label}</span>
                          </Link>
                        </SheetClose>
                      );
                    })}

                    <Separator className="my-2" />
                    {status === 'authenticated' ? (
                      <>
                        {isAdmin && (
                           <SheetClose asChild>
                            <Link href="/admin/dashboard" className="flex items-center gap-2 text-foreground hover:text-accent transition-colors text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                              <ShieldCheck className="h-5 w-5" /> Admin Panel
                            </Link>
                          </SheetClose>
                        )}
                        {isCustomer && (
                           <SheetClose asChild>
                            <Link href="/profile" className="flex items-center gap-2 text-foreground hover:text-accent transition-colors text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                              <User className="h-5 w-5" /> My Profile
                            </Link>
                          </SheetClose>
                        )}
                         <SheetClose asChild>
                            <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 text-foreground hover:text-accent transition-colors text-lg text-left w-full">
                              <LogOut className="h-5 w-5" /> Sign Out
                            </button>
                        </SheetClose>
                        {session.user?.name && <p className="text-sm text-muted-foreground mt-2">Signed in as {session.user.name} ({session.user.role})</p>}
                      </>
                    ) : (
                       <SheetClose asChild>
                        <Link href="/login" className="flex items-center gap-2 text-foreground hover:text-accent transition-colors text-lg" onClick={() => setIsMobileMenuOpen(false)}>
                          <LogInIcon className="h-5 w-5" /> Sign In / Register
                        </Link>
                      </SheetClose>
                    )}
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
