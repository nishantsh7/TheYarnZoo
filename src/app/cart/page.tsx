import CartContents from '@/components/cart/CartContents';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Your Shopping Cart - TheYarnZoo',
  description: 'Review items in your shopping cart and proceed to checkout.',
};

export default function CartPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-headline font-bold text-center text-gray-700 mb-2">Your Shopping Cart</h1>
      <Separator className="my-8" />
      <CartContents />
    </div>
  );
}
