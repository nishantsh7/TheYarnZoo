
"use client";

import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Lock, ShoppingBag, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { getUserShippingAddressAction, saveUserShippingAddressAction } from '@/actions/userProfileActions';
import type { ShippingAddress } from '@/types';
import { createPaymentOrderAction } from '@/actions/orderActions';
import { verifyRazorpayPaymentAction } from '@/actions/paymentVerificationActions';

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: any; 
  }
}

const shippingSchema = z.object({
  name: z.string().min(2, "Full name is required."),
  address: z.string().min(5, "Street address is required."),
  city: z.string().min(2, "City is required."),
  postalCode: z.string().min(3, "Postal code is required."),
  country: z.string().min(2, "Country is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(10, "Valid 10-digit phone number is required.").max(15, "Phone number too long."),
});

// No separate paymentSchema needed as Razorpay handles card details
type CheckoutFormData = z.infer<typeof shippingSchema>;

export default function CheckoutClient() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [saveDetails, setSaveDetails] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);


  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      name: '', address: '', city: '', postalCode: '', country: '', 
      email: session?.user?.email || '', phone: '',
    },
  });

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user?.id) {
      setIsFetchingAddress(true);
      getUserShippingAddressAction(session.user.id)
        .then(savedAddress => {
          if (savedAddress) {
            form.reset({
              name: savedAddress.name,
              address: savedAddress.address,
              city: savedAddress.city,
              postalCode: savedAddress.postalCode,
              country: savedAddress.country,
              phone: savedAddress.phone,
              email: form.getValues().email || session.user.email || '', 
            });
            setSaveDetails(true); 
          } else {
            form.setValue('email', session.user.email || '');
          }
        })
        .catch(error => {
          console.error("Failed to fetch saved address:", error);
          toast({ title: "Error", description: "Could not load saved address.", variant: "destructive" });
        })
        .finally(() => {
          setIsFetchingAddress(false);
        });
    } else if (sessionStatus === 'unauthenticated') {
      setIsFetchingAddress(false); 
    }
    if (session?.user?.email && !form.getValues().email) {
      form.setValue('email', session.user.email);
    }
  }, [sessionStatus, session, form, toast]);

  const processPayment = useCallback(async (data: CheckoutFormData) => {
    setIsProcessingPayment(true);
    if (cartItems.length === 0) {
      toast({ title: "Cart Empty", description: "Your cart is empty. Please add items to proceed.", variant: "destructive" });
      setIsProcessingPayment(false);
      router.push('/products');
      return;
    }

    // 1. Create internal and Razorpay order
    const orderInput = {
      shippingDetails: data,
      cartItems: cartItems.map(item => ({ ...item, productId: String(item.productId) })), // Ensure productId is string
      userId: session?.user?.id,
    };

    const orderResponse = await createPaymentOrderAction(orderInput);

    if (!orderResponse.success || !orderResponse.razorpayOrderId || !orderResponse.ourOrderId || !orderResponse.amountInPaisa || !orderResponse.razorpayKeyId) {
      toast({ title: "Payment Error", description: orderResponse.message || "Could not initiate payment.", variant: "destructive" });
      setIsProcessingPayment(false);
      return;
    }

    const { ourOrderId, razorpayOrderId, amountInPaisa, razorpayKeyId } = orderResponse;

    // 2. Open Razorpay Checkout
    const options = {
      key: razorpayKeyId,
      amount: amountInPaisa,
      currency: "INR",
      name: "TheYarnZoo",
      description: `Order ID: ${ourOrderId}`,
      order_id: razorpayOrderId,
      handler: async function (response: any) {
        try {
          const verificationResult = await verifyRazorpayPaymentAction({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            ourOrderId: ourOrderId,
          });

          if (verificationResult.success && verificationResult.isVerified && verificationResult.ourOrderId) {
             if (saveDetails && session?.user?.id) {
                const shippingDataToSave: ShippingAddress = data; // data is CheckoutFormData which matches ShippingAddress
                await saveUserShippingAddressAction(session.user.id, shippingDataToSave);
                // Toast for saving details can be omitted here to avoid too many toasts, or be subtle
             }
            toast({ title: "Payment Successful!", description: "Your order has been placed." });
            clearCart();
            router.push(`/orders/${verificationResult.ourOrderId}?status=success`);
          } else {
            toast({ title: "Payment Verification Failed", description: verificationResult.message || "Please contact support.", variant: "destructive" });
          }
        } catch (error) {
            toast({ title: "Error", description: "An error occurred during payment verification.", variant: "destructive" });
        } finally {
            setIsProcessingPayment(false);
        }
      },
      prefill: {
        name: data.name,
        email: data.email,
        contact: data.phone,
      },
      theme: {
        color: "#D87093" // Your accent color
      },
      modal: {
        ondismiss: function() {
          setIsProcessingPayment(false);
          toast({ title: "Payment Cancelled", description: "Your payment was not completed.", variant: "default" });
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response: any){
        console.error("Razorpay payment.failed event:", response.error);
        toast({
            title: "Payment Failed",
            description: `${response.error.description || 'Reason: ' + response.error.reason}. Please try again or contact support. (Error: ${response.error.code})`,
            variant: "destructive"
        });
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (e) {
      console.error("Razorpay SDK error:", e);
      toast({ title: "Payment Error", description: "Could not load payment gateway. Please refresh and try again.", variant: "destructive"});
      setIsProcessingPayment(false);
    }

  }, [cartItems, session, toast, router, clearCart, saveDetails]);


  const onSubmit: SubmitHandler<CheckoutFormData> = async (data) => {
    await processPayment(data);
  };
  
  if (sessionStatus === 'loading' || isFetchingAddress) {
    return <div className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" /> Loading checkout...</div>;
  }

  if (cartItems.length === 0 && !form.formState.isSubmitting && !isProcessingPayment) { 
    router.push('/products'); 
    return <div className="text-center py-10">Your cart is empty. Redirecting to products...</div>;
  }

  const cartTotal = getCartTotal();
  const shippingCost = 50.00; 
  const grandTotal = cartTotal + shippingCost;

  return (
    <div className="grid md:grid-cols-3 gap-12">
      <div className="md:col-span-1 order-last md:order-first bg-muted/50 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-headline font-semibold text-gray-700 mb-6 flex items-center">
          <ShoppingBag className="mr-3 h-6 w-6 text-accent" /> Order Summary
        </h2>
        <div className="space-y-3 mb-6 max-h-80 overflow-y-auto pr-2">
          {cartItems.map(item => (
            <div key={item.productId} className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <Image src={item.image} alt={item.name} width={40} height={40} className="rounded mr-2" data-ai-hint="toy product" />
                <span>{item.name} (x{item.quantity})</span>
              </div>
              <span>₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex justify-between text-md">
            <span>Subtotal:</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-md">
            <span>Shipping:</span>
            <span>₹{shippingCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-800">
            <span>Total:</span>
            <span className="text-accent">₹{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="md:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <section className="bg-card p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-headline font-semibold text-gray-700 mb-6">Shipping Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Full Name</FormLabel><FormControl><Input {...field} disabled={isProcessingPayment} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} disabled={isProcessingPayment} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem><FormLabel>Phone</FormLabel><FormControl><Input type="tel" {...field} disabled={isProcessingPayment} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="address" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Street Address</FormLabel><FormControl><Input {...field} disabled={isProcessingPayment} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} disabled={isProcessingPayment} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="postalCode" render={({ field }) => (
                  <FormItem><FormLabel>Postal Code</FormLabel><FormControl><Input {...field} disabled={isProcessingPayment} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="country" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Country</FormLabel><FormControl><Input {...field} disabled={isProcessingPayment} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              {sessionStatus === 'authenticated' && (
                <div className="mt-6 flex items-center space-x-2">
                  <Checkbox
                    id="saveDetails"
                    checked={saveDetails}
                    onCheckedChange={(checked) => setSaveDetails(Boolean(checked))}
                    disabled={isProcessingPayment}
                  />
                  <Label htmlFor="saveDetails" className="text-sm font-normal">Save my shipping details for next time</Label>
                </div>
              )}
            </section>

            <section className="bg-card p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-headline font-semibold text-gray-700 mb-2 flex items-center">
                <Lock className="mr-3 h-6 w-6 text-accent" /> Payment
              </h2>
               <p className="text-sm text-muted-foreground mb-4">
                You will be redirected to Razorpay to complete your payment securely.
              </p>
            </section>
            
            <Button 
              type="submit" 
              size="lg" 
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate text-lg" 
              disabled={form.formState.isSubmitting || cartItems.length === 0 || isProcessingPayment}
            >
              {isProcessingPayment ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
              ) : (
                `Proceed to Pay - ₹${grandTotal.toFixed(2)}`
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
