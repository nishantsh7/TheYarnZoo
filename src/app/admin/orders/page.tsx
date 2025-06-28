
import { getAdminOrders } from '@/actions/orderActions';
import type { Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Eye, Truck, CheckCircle, XCircle, ShoppingCart } from 'lucide-react'; // Added ShoppingCart
import Link from 'next/link';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const statusColors: Record<Order['orderStatus'], string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  processing: "bg-blue-100 text-blue-800 border-blue-300",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-gray-800">Manage Orders</h1>

      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle>Order List</CardTitle>
            <CardDescription>View and manage customer orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-10">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders found yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer Email</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Order Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order: Order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.id}</TableCell>
                    <TableCell>{order.userEmail || order.shippingAddress.email}</TableCell>
                    <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>₹{order.totalAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}
                            className={order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-300' : 'bg-yellow-100 text-yellow-800 border-yellow-300'}>
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[order.orderStatus]}>
                        {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/orders/${order.id}`} className="flex items-center cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          {order.orderStatus === 'processing' && (
                            <DropdownMenuItem className="flex items-center cursor-pointer"> {/* Add action later */}
                              <Truck className="mr-2 h-4 w-4" /> Mark as Shipped
                            </DropdownMenuItem>
                          )}
                          {order.orderStatus === 'shipped' && (
                            <DropdownMenuItem className="flex items-center cursor-pointer"> {/* Add action later */}
                              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Delivered
                            </DropdownMenuItem>
                          )}
                          {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10 flex items-center cursor-pointer"> {/* Add action later */}
                              <XCircle className="mr-2 h-4 w-4" /> Cancel Order
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
