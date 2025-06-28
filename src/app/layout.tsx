
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { CartProvider } from '@/context/CartContext';
import NextAuthProvider from '@/providers/NextAuthProvider'; 
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'TheYarnZoo - Handcrafted Crocheted Toys',
  description: 'Discover adorable handcrafted crocheted toys at TheYarnZoo.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <NextAuthProvider> 
          <CartProvider>
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Footer />
            <Toaster />
          </CartProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}
