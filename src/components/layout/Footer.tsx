
import Link from 'next/link';
import { Instagram } from 'lucide-react';
import NewsletterForm from '../shared/NewsletterForm';

const Footer = () => {
  return (
    <footer className="bg-muted text-muted-foreground py-12 mt-16">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-xl font-headline font-semibold text-primary mb-4">TheYarnZoo</h3>
          <p className="text-sm">
            Creating handcrafted joy, one stitch at a time. Discover our unique collection of crocheted toys.
          </p>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-accent transition-colors">All Products</Link></li>
            <li><Link href="/#about" className="hover:text-accent transition-colors">About Us</Link></li>
            <li><Link href="/#faq" className="hover:text-accent transition-colors">FAQ</Link></li>
            <li><Link href="/#contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
            <li><Link href="/terms" className="hover:text-accent transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-foreground mb-4">Connect With Us</h4>
          <div className="flex space-x-4 mb-4">
            <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-accent transition-colors"><Instagram size={24} /></Link>
          </div>
          <h4 className="font-semibold text-foreground mb-2 mt-4">Newsletter</h4>
          <p className="text-sm mb-2">Stay updated with our latest toys and offers!</p>
          <NewsletterForm className="flex" />
        </div>
      </div>
      <div className="text-center text-sm mt-10 border-t border-border pt-8">
        <p>&copy; {new Date().getFullYear()} TheYarnZoo. All rights reserved. Designed with &hearts;.</p>
      </div>
    </footer>
  );
};

export default Footer;
