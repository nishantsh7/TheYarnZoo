
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, Users, TrendingUp, AlertCircle } from "lucide-react";
import { getDashboardStatsAction } from '@/actions/dashboardActions';
import type { DashboardStats } from '@/types';

// Mock data for recent activity, can be replaced with real data later
async function getRecentActivity() {
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate short delay
    return [
        { id: 1, type: 'New Order', description: 'Order #TYZ789123 placed for ₹4599.00', time: '2 hours ago' },
        { id: 2, type: 'New Customer', description: 'Alice B. registered.', time: '5 hours ago' },
        { id: 3, type: 'Product Review', description: 'Review received for Yarny Elephant', time: '1 day ago' },
        { id: 4, type: 'Low Stock', description: 'Cuddle Bear stock is low (3 remaining)', time: '2 days ago', urgent: true },
    ];
}

export default async function AdminDashboardPage() {
  const stats: DashboardStats = await getDashboardStatsAction();
  const recentActivity = await getRecentActivity(); // Keeping mock for now

  const statCards = [
    { title: "Total Revenue", value: `₹${(stats.totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: TrendingUp, color: "text-green-500" },
    { title: "Total Orders", value: stats.totalOrders.toString(), icon: ShoppingCart, color: "text-blue-500" },
    { title: "Total Products", value: stats.totalProducts.toString(), icon: Package, color: "text-purple-500" },
    { title: "Total Customers", value: stats.totalCustomers.toString(), icon: Users, color: "text-orange-500" },
  ];

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
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-700">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {recentActivity.map(activity => (
                        <li key={activity.id} className={`flex items-start space-x-3 p-3 rounded-md ${activity.urgent ? 'bg-destructive/10 border-l-4 border-destructive' : 'bg-secondary/30'}`}>
                            {activity.urgent ? <AlertCircle className="h-5 w-5 text-destructive mt-1" /> : <TrendingUp className="h-5 w-5 text-accent mt-1" />}
                            <div>
                                <p className="text-sm font-medium text-foreground">{activity.type}: <span className="font-normal">{activity.description}</span></p>
                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                        </li>
                    ))}
                </ul>
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
