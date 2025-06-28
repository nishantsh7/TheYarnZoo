
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/products/ProductCard';
import { getFeaturedProducts } from '@/lib/mock-data'; // Corrected import path
import type { Product } from '@/types';
import { ArrowRight, Sparkles } from 'lucide-react';

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts(4); // Fetch 4 featured products from DB

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/30 via-background to-secondary/30 rounded-xl p-8 md:p-16 text-center overflow-hidden">
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-accent/20 rounded-full filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/30 rounded-full filter blur-xl opacity-70 animate-pulse delay-1000"></div>
        
        <div className="relative z-10">
          <Sparkles className="mx-auto h-12 w-12 text-accent mb-4 animate-bounce" />
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-gray-800 mb-6">
            Welcome to <span className="text-accent">TheYarnZoo</span>!
          </h1>
          <p className="text-lg md:text-xl text-foreground max-w-2xl mx-auto mb-8">
            Discover unique, handcrafted crocheted toys made with love and the finest yarns. Perfect for gifts and collecting!
          </p>
          <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate shadow-lg">
            <Link href="/products">
              Explore Our Collection <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Featured Products Section */}
      <section>
        <h2 className="text-3xl font-headline font-semibold text-center text-gray-700 mb-10">Featured Toys</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {featuredProducts.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {featuredProducts.length === 0 && (
            <p className="text-center text-muted-foreground mt-6">No featured products available at the moment. Check back soon!</p>
        )}
        <div className="text-center mt-10">
          <Button variant="outline" size="lg" asChild className="border-accent text-accent hover:bg-accent/10 btn-subtle-animate">
            <Link href="/products">View All Products</Link>
          </Button>
        </div>
      </section>

      {/* About Us Snippet */}
      <section id="about" className="bg-card p-8 md:p-12 rounded-xl shadow-lg">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-headline font-semibold text-gray-700 mb-6">Handcrafted with Passion</h2>
          <Image 
            src="https://res.cloudinary.com/djvwsukm2/image/upload/v1750182328/WhatsApp_Image_2025-06-17_at_22.54.25_3_-Photoroom_mqtkaz.png" 
            alt="Penguin toy, handcrafted with passion"
            width={600} 
            height={300} 
            className="rounded-lg mx-auto mb-6 shadow-md"
            data-ai-hint="penguin toy"
          />
          <p className="text-foreground mb-4">
            At TheYarnZoo, every toy is a work of art, meticulously crocheted by skilled artisans who pour their heart into each creation. We use only high-quality, child-safe materials to ensure your little ones can enjoy their new friends for years to come.
          </p>
          <Button variant="link" asChild className="text-accent hover:text-accent/80 text-lg">
            <Link href="/about-us">Learn More About Our Story</Link>
          </Button>
        </div>
      </section>

      {/* Contact Snippet / Newsletter */}
      <section id="contact" className="text-center py-12 bg-secondary/50 rounded-xl">
         <h2 className="text-3xl font-headline font-semibold text-gray-700 mb-4">Stay in Touch!</h2>
         <p className="text-foreground max-w-xl mx-auto mb-6">
           Join our newsletter for exclusive updates, new arrivals, and special discounts.
         </p>
         <form className="flex max-w-md mx-auto">
            <input type="email" placeholder="Enter your email address" className="py-3 px-4 rounded-l-md border-border focus:ring-accent focus:border-accent flex-grow" />
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-6 rounded-r-md btn-subtle-animate">Subscribe</Button>
         </form>
      </section>
    </div>
  );
}
