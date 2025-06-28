
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, BarChart2, PieChart, TrendingUp, Package, Users, ShoppingCart, AlertCircle } from "lucide-react";
import { getDashboardStatsAction } from '@/actions/dashboardActions';
import type { DashboardStats } from '@/types';

// Placeholder for chart component
const PlaceholderChart = ({ title }: { title: string }) => (
  <div className="h-64 bg-muted/50 rounded-md flex items-center justify-center border border-border">
    <p className="text-muted-foreground">{title} (Chart Placeholder)</p>
  </div>
);

export default async function AdminReportsPage() {
  const stats: DashboardStats = await getDashboardStatsAction();

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-headline font-bold text-gray-800">Reports & Analytics</h1>
        <Button variant="outline" className="btn-subtle-animate">
          <Download className="mr-2 h-4 w-4" /> Export All Reports (Placeholder)
        </Button>
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

      {/* Chart Placeholders */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-accent" /> Sales Overview</CardTitle>
            <CardDescription>Monthly sales performance.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlaceholderChart title="Monthly Sales Trend" />
            <Button variant="link" className="mt-2 text-accent p-0">View Detailed Sales Report (Placeholder)</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><PieChart className="mr-2 h-5 w-5 text-accent" /> Product Performance</CardTitle>
            <CardDescription>Top selling products and categories.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlaceholderChart title="Top Products by Revenue" />
            <Button variant="link" className="mt-2 text-accent p-0">View Product Analytics (Placeholder)</Button>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><TrendingUp className="mr-2 h-5 w-5 text-accent" /> Customer Insights</CardTitle>
            <CardDescription>Customer acquisition and retention.</CardDescription>
          </CardHeader>
          <CardContent>
            <PlaceholderChart title="New vs. Returning Customers" />
            <Button variant="link" className="mt-2 text-accent p-0">View Customer Demographics (Placeholder)</Button>
          </CardContent>
        </Card>
        
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center"><BarChart2 className="mr-2 h-5 w-5 text-accent" /> Inventory Report</CardTitle>
            <CardDescription>Stock levels and turnover rates.</CardDescription>
          </CardHeader>
          <CardContent>
             <PlaceholderChart title="Stock Value Overview" />
            <Button variant="link" className="mt-2 text-accent p-0">View Full Inventory Report (Placeholder)</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
