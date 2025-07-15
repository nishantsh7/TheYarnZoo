
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, TrendingUp, AlertCircle, ListOrdered } from "lucide-react";
import { getDashboardStatsAction } from '@/actions/dashboardActions';
import { getAdminOrders } from '@/actions/orderActions';
import type { DashboardStats, Order } from '@/types';
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
  const stats: DashboardStats = await getDashboardStatsAction();
  const allOrders = await getAdminOrders();
  const recentOrders = allOrders.slice(0, 5);

  const statCards = [
    { title: "Total Revenue", value: `₹${(stats.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-green-500" },
    { title: "Total Orders", value: stats.totalOrders.toString(), icon: ShoppingCart, color: "text-blue-500" },
    { title: "Total Products", value: stats.totalProducts.toString(), icon: Package, color: "text-purple-500" },
    { title: "Total Customers", value: stats.totalCustomers.toString(), icon: Users, color: "text-orange-500" },
  ];
  
  const statusColors: Record<Order['orderStatus'], string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    processing: "bg-blue-100 text-blue-800 border-blue-300",
    shipped: "bg-indigo-100 text-indigo-800 border-indigo-300",
    delivered: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-gray-800">Admin Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map(card => (
          <Card key={card.title} className="shadow-lg hover-lift transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-lg lg:col-span-2">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-700 flex items-center"><ListOrdered className="mr-2 h-5 w-5 text-accent"/>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
                {recentOrders.length > 0 ? (
                    <ul className="space-y-4">
                        {recentOrders.map(order => (
                            <li key={order.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 rounded-md bg-secondary/30">
                                <div>
                                    <Link href={`/admin/orders/${order._id}`} className="font-medium text-foreground hover:text-accent">
                                        Order #{order.id}
                                    </Link>
                                    <p className="text-sm text-muted-foreground">{order.shippingAddress.name} - ₹{order.totalAmount.toFixed(2)}</p>
                                </div>
                                <Badge variant="outline" className={statusColors[order.orderStatus]}>
                                  {order.orderStatus}
                                </Badge>
                            </li>
                        ))}
                    </ul>
                ) : (
                     <p className="text-muted-foreground text-center py-4">No recent orders.</p>
                )}
                 {allOrders.length > 5 && (
                    <Button asChild variant="link" className="mt-4 px-0 text-accent">
                        <Link href="/admin/orders">View All Orders</Link>
                    </Button>
                 )}
            </CardContent>
        </Card>

        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-700">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                 <div className="flex justify-between items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div>
                        <p className="font-medium text-yellow-700">Pending Orders</p>
                        <p className="text-2xl font-bold text-yellow-800">{stats.pendingOrders}</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-yellow-600" />
                 </div>
                 <div className="flex justify-between items-center p-3 bg-red-50 border border-red-200 rounded-md">
                    <div>
                        <p className="font-medium text-red-700">Low Stock Items</p>
                        <p className="text-2xl font-bold text-red-800">{stats.lowStockItems}</p>
                    </div>
                    <Package className="h-8 w-8 text-red-600" />
                 </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
