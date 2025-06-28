import CheckoutClient from '@/components/checkout/CheckoutClient';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Checkout - TheYarnZoo',
  description: 'Complete your purchase securely.',
};

export default function CheckoutPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-headline font-bold text-center text-gray-700 mb-2">Checkout</h1>
      <p className="text-center text-muted-foreground mb-8">Securely enter your shipping and payment information.</p>
      <Separator className="my-8" />
      <CheckoutClient />
    </div>
  );
}
