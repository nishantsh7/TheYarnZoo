import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, PieChart, TrendingUp, Package, Users, ShoppingCart, AlertCircle } from "lucide-react";
import { getDashboardStatsAction } from '@/actions/dashboardActions';
import { getMonthlySalesData } from '@/actions/reportsActions';
import type { DashboardStats } from '@/types';
import { MonthlySalesChart } from "@/components/admin/charts/MonthlySalesCharts";

// Placeholder for other chart components
const PlaceholderChart = ({ title }: { title: string }) => (
  <div className="h-64 bg-muted/50 rounded-md flex items-center justify-center border border-border">
    <p className="text-muted-foreground">{title} (Chart Placeholder)</p>
  </div>
);

export default async function AdminReportsPage() {
  const stats: DashboardStats = await getDashboardStatsAction();
  const monthlySales = await getMonthlySalesData();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline font-bold text-gray-800">Reports & Analytics</h1>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{stats.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <ShoppingCart className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalOrders}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
            <Users className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalCustomers}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            <Package className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalProducts}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.pendingOrders}</div>
          </CardContent>
        </Card>
        <Card className="shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.lowStockItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-accent" /> Sales Overview</CardTitle>
            <CardDescription>Monthly sales performance over the last year.</CardDescription>
          </CardHeader>
          <CardContent>
            <MonthlySalesChart data={monthlySales} />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><PieChart className="mr-2 h-5 w-5 text-accent" /> Product Performance</CardTitle>
            <CardDescription>Top selling products and categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlaceholderChart title="Top Products by Revenue" />
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-accent" /> Customer Insights</CardTitle>
            <CardDescription>Customer acquisition and retention.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlaceholderChart title="New vs. Returning Customers" />
          </CardContent>
        </Card>
        
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-accent" /> Inventory Report</CardTitle>
            <CardDescription>Stock levels and turnover rates.</CardDescription>
          </CardHeader>
          <CardContent>
             <PlaceholderChart title="Stock Value Overview" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
