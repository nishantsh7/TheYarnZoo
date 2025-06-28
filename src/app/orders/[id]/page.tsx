
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getOrderById } from '@/actions/orderActions'; 
import type { Order } from '@/types'; 
import { CheckCircle, Package, ShoppingBag, Truck, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export async function generateMetadata({ params }: { params: { id: string }}) {
  const order = await getOrderById(params.id);
  if (!order) {
    return {
      title: 'Order Not Found - TheYarnZoo',
      description: `Details for order ${params.id} could not be found.`,
    }
  }
  return {
    title: `Order ${params.id} - TheYarnZoo`,
    description: `Details for your order ${params.id}.`,
  };
}


export default async function OrderDetailPage({ params, searchParams }: { params: { id: string }, searchParams: { status?: string }}) {
  const order = await getOrderById(params.id);

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-3xl font-bold text-destructive mb-4">Order Not Found</h1>
        <p className="text-muted-foreground mb-6">We couldn't find an order with ID: {params.id}. It might have been a test order or an issue occurred.</p>
        <Button asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    );
  }
  
  const isSuccess = searchParams.status === 'success';
  const shippingCost = 50.00; // INR, assuming fixed
  const subtotal = order.totalAmount - shippingCost;

  const getStatusIcon = (status: Order['orderStatus']) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Package className="h-5 w-5 text-yellow-500" />;
      case 'shipped':
        return <Truck className="h-5 w-5 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Package className="h-5 w-5 text-muted-foreground" />;
    }
  };


  return (
    <div className="container mx-auto px-4 py-8">
      {isSuccess && (
         <Card className="mb-8 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-2xl text-green-700 flex items-center">
              <CheckCircle className="h-8 w-8 mr-3 text-green-600" />
              Order Placed Successfully!
            </CardTitle>
            <CardDescription className="text-green-600">
              Thank you for your purchase. Your order <span className="font-semibold">{order.id}</span> has been confirmed.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <h1 className="text-3xl md:text-4xl font-headline font-bold text-gray-700 mb-2">Order Details</h1>
      <p className="text-muted-foreground mb-8">Order ID: <span className="font-mono text-foreground">{order.id}</span></p>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-accent" />Items Ordered</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {order.items.map(item => (
                <div key={item.productId} className="py-4 flex items-start gap-4">
                  <Image src={item.image || 'https://placehold.co/64x64.png'} alt={item.name} width={64} height={64} className="rounded-md border" data-ai-hint="toy product"/>
                  <div className="flex-grow">
                    {/* Link to product page could be re-added if product slugs are stored with order items or fetched */}
                    <span className="font-semibold text-foreground">{item.name}</span>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <p className="text-md font-semibold text-right text-foreground">₹{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal:</span> <span>₹{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping:</span> <span>₹{shippingCost.toFixed(2)}</span></div>
              <Separator />
              <div className="flex justify-between font-bold text-lg"><span>Total:</span> <span className="text-accent">₹{order.totalAmount.toFixed(2)}</span></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
              <p>Phone: {order.shippingAddress.phone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Status & Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center">
                {getStatusIcon(order.orderStatus)}
                <span className="ml-2 capitalize font-medium text-foreground">{order.orderStatus}</span>
              </div>
              <p>Payment: <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{order.paymentStatus}</span></p>
              {order.trackingNumber && (
                <p>Tracking #: <a href="#" className="text-accent hover:underline font-medium">{order.trackingNumber}</a></p>
              )}
              <p>Order Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <Button asChild variant="outline" className="border-accent text-accent hover:bg-accent/10">
            <Link href="/products">Continue Shopping</Link>
        </Button>
         <Button asChild variant="link" className="text-accent hover:text-accent/80 ml-4">
            <Link href="/#contact">Contact Support</Link>
        </Button>
      </div>
    </div>
  );
}
