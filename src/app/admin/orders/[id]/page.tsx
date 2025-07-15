
"use client";

import { useEffect, useState } from 'react';
import { getOrderById, updateOrderStatusAction, type UpdateOrderStatusActionResponse } from '@/actions/orderActions';
import type { Order, OrderItem } from '@/types';
import { notFound } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { AlertTriangle, ArrowLeft, Loader2, Package, ShoppingBag, Truck, User, XCircle, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const statusColors: Record<Order['orderStatus'], string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  processing: "bg-blue-100 text-blue-800 border-blue-300",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

export default function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [showShippingDialog, setShowShippingDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchOrder() {
      setIsLoading(true);
      const fetchedOrder = await getOrderById(params.id);
      if (fetchedOrder) {
        setOrder(fetchedOrder);
      }
      setIsLoading(false);
    }
    fetchOrder();
  }, [params.id]);

  const handleUpdateStatus = async (newStatus: 'processing' | 'shipped' | 'delivered' | 'cancelled', trackingNum?: string) => {
    if (!order?._id) return;
    setIsUpdating(true);
    
    const response: UpdateOrderStatusActionResponse = await updateOrderStatusAction({
      orderId: order._id,
      newStatus: newStatus,
      trackingNumber: trackingNum,
    });
    
    if (response.success) {
      toast({ title: "Success", description: response.message });
      // Refetch order to show updated status
      const updatedOrder = await getOrderById(params.id);
      setOrder(updatedOrder);
    } else {
      toast({ title: "Error", description: response.message, variant: "destructive" });
    }
    setIsUpdating(false);
    if (newStatus === 'shipped') {
        setShowShippingDialog(false);
        setTrackingNumber('');
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!order) {
    return notFound();
  }
  
  const shippingCost = 50.00;
  const subtotal = order.totalAmount - shippingCost;
  const isFinalStatus = order.orderStatus === 'delivered' || order.orderStatus === 'cancelled';

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/orders" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Orders
        </Link>
        <h1 className="text-3xl font-headline font-bold text-gray-800">Order Details</h1>
        <p className="text-muted-foreground">Order ID: <span className="font-mono">{order.id}</span></p>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center"><ShoppingBag className="mr-2 h-5 w-5 text-accent"/>Items</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Product</TableHead><TableHead>Quantity</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                <TableBody>
                  {order.items.map((item: OrderItem) => (
                    <TableRow key={item.productId}>
                      <TableCell className="flex items-center gap-3"><Image src={item.image} alt={item.name} width={40} height={40} className="rounded" data-ai-hint="product image" /><span className="font-medium">{item.name}</span></TableCell>
                      <TableCell>x {item.quantity}</TableCell>
                      <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-4"/>
              <div className="space-y-2 text-right">
                <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
                <p>Shipping: ₹{shippingCost.toFixed(2)}</p>
                <p className="font-bold text-lg">Grand Total: <span className="text-accent">₹{order.totalAmount.toFixed(2)}</span></p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center"><Package className="mr-2 h-5 w-5 text-accent"/>Order Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Current Status:</span>
                <Badge variant="outline" className={statusColors[order.orderStatus]}>{order.orderStatus}</Badge>
              </div>
              
              {!isFinalStatus && (
                <div className="space-y-2 pt-4 border-t">
                  <h4 className="font-medium">Update Status:</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {order.orderStatus === 'pending' && <Button onClick={() => handleUpdateStatus('processing')} disabled={isUpdating} className="w-full justify-start"><Loader2 className={`mr-2 h-4 w-4 ${isUpdating ? 'animate-spin' : 'hidden'}`}/>Mark as Processing</Button>}
                    {order.orderStatus === 'processing' && (
                        <AlertDialog open={showShippingDialog} onOpenChange={(open) => {
                            if (open) {
                                const generatedId = `TYZ${Date.now()}`;
                                setTrackingNumber(generatedId);
                            }
                            setShowShippingDialog(open);
                        }}>
                            <AlertDialogTrigger asChild>
                                <Button className="w-full justify-start"><Truck className="mr-2 h-4 w-4"/>Mark as Shipped</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Confirm Shipment</AlertDialogTitle><AlertDialogDescription>A tracking number has been generated. You can edit it if needed.</AlertDialogDescription></AlertDialogHeader>
                                <div className="space-y-2"><Label htmlFor="trackingNumber">Tracking Number</Label><Input id="trackingNumber" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} /></div>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleUpdateStatus('shipped', trackingNumber)} disabled={!trackingNumber.trim() || isUpdating}>
                                        {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Confirm Shipment
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {order.orderStatus === 'shipped' && <Button onClick={() => handleUpdateStatus('delivered')} disabled={isUpdating} className="w-full justify-start"><Loader2 className={`mr-2 h-4 w-4 ${isUpdating ? 'animate-spin' : 'hidden'}`}/><CheckCircle className="mr-2 h-4 w-4"/>Mark as Delivered</Button>}
                    <Button onClick={() => handleUpdateStatus('cancelled')} disabled={isUpdating} variant="destructive" className="w-full justify-start"><Loader2 className={`mr-2 h-4 w-4 ${isUpdating ? 'animate-spin' : 'hidden'}`}/><XCircle className="mr-2 h-4 w-4"/>Cancel Order</Button>
                  </div>
                </div>
              )}

              {order.trackingNumber && <p className="text-sm pt-2 border-t">Tracking Number: <span className="font-medium text-accent">{order.trackingNumber}</span></p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center"><User className="mr-2 h-5 w-5 text-accent"/>Customer Details</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.shippingAddress.name}</p>
              <p>{order.shippingAddress.email}</p>
              <p>{order.shippingAddress.phone}</p>
              <Separator className="my-2"/>
              <p className="font-medium">Shipping Address</p>
              <p>{order.shippingAddress.address}</p>
              <p>{order.shippingAddress.city}, {order.shippingAddress.postalCode}</p>
              <p>{order.shippingAddress.country}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
