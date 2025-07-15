
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrdersByUserId } from '@/actions/orderActions';
import type { Order } from '@/types';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { Package, MapPin, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const statusColors: Record<Order['orderStatus'], string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  processing: "bg-blue-100 text-blue-800 border-blue-300",
  shipped: "bg-indigo-100 text-indigo-800 border-indigo-300",
  delivered: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};


export default async function ProfilePage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/profile');
    }

    const recentOrders = await getOrdersByUserId(session.user.id, 3);

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3 text-3xl font-headline">
                        <UserIcon className="h-8 w-8 text-accent"/>
                        Welcome, {session.user.name}!
                    </CardTitle>
                    <CardDescription>
                        This is your personal space. Here you can view your orders, manage your shipping address, and get support.
                    </CardDescription>
                </CardHeader>
                 <CardContent>
                    <p className="text-muted-foreground">Email: <span className="text-foreground">{session.user.email}</span></p>
                    <p className="text-muted-foreground">Role: <span className="text-foreground capitalize">{session.user.role}</span></p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <Package className="h-6 w-6 text-accent"/>
                        Recent Orders
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {recentOrders.length > 0 ? (
                        <ul className="space-y-4">
                            {recentOrders.map(order => (
                                <li key={order._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 rounded-md border bg-secondary/30 gap-2">
                                    <div>
                                        <p className="font-semibold">Order <Link href={`/orders/${order.id}`} className="text-accent hover:underline font-mono">{order.id}</Link></p>
                                        <p className="text-sm text-muted-foreground">Placed on: {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <p className="font-semibold">₹{order.totalAmount.toFixed(2)}</p>
                                      <Badge variant="outline" className={statusColors[order.orderStatus]}>{order.orderStatus}</Badge>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">You have not placed any orders yet.</p>
                    )}
                     <Button asChild variant="link" className="px-0 text-accent mt-4">
                        <Link href="/profile/orders">View All Orders</Link>
                    </Button>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                        <MapPin className="h-6 w-6 text-accent"/>
                        Shipping Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex justify-between items-center">
                    <p className="text-muted-foreground">Manage your default shipping address.</p>
                    <Button asChild>
                        <Link href="/profile/address">Manage Address</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
