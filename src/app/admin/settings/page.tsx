
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Globe, Palette, Bell, Shield, Users, CreditCard as CreditCardIcon, Info } from "lucide-react"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export default async function AdminSettingsPage() {

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-gray-800">Settings</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-6">
          <TabsTrigger value="general"><Globe className="mr-1 h-4 w-4 hidden sm:inline-block"/>General</TabsTrigger>
          <TabsTrigger value="appearance"><Palette className="mr-1 h-4 w-4 hidden sm:inline-block"/>Appearance</TabsTrigger>
          <TabsTrigger value="notifications"><Bell className="mr-1 h-4 w-4 hidden sm:inline-block"/>Notifications</TabsTrigger>
          <TabsTrigger value="payments"><CreditCardIcon className="mr-1 h-4 w-4 hidden sm:inline-block"/>Payments</TabsTrigger>
          <TabsTrigger value="security"><Shield className="mr-1 h-4 w-4 hidden sm:inline-block"/>Security</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-1 h-4 w-4 hidden sm:inline-block"/>User Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage basic store information and localization.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" defaultValue="TheYarnZoo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeEmail">Default Store Email</Label>
                <Input id="storeEmail" type="email" defaultValue="contact@theyarnzoo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeCurrency">Default Currency</Label>
                <Input id="storeCurrency" defaultValue="INR" />
              </div>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate">Save General Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of your store (placeholders).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="logoUpload">Store Logo</Label>
                <Input id="logoUpload" type="file" />
                <p className="text-sm text-muted-foreground">Upload your store logo (PNG, JPG, max 2MB).</p>
              </div>
              <div className="space-y-2">
                <Label>Theme Colors (Read-only for now)</Label>
                <div className="flex gap-2 items-center">
                  <div className="w-8 h-8 rounded-full bg-primary border border-border" title="Primary: #FFB6C1"></div>
                  <div className="w-8 h-8 rounded-full bg-accent border border-border" title="Accent: #D87093"></div>
                  <div className="w-8 h-8 rounded-full bg-background border border-border" title="Background: #F8F8FF"></div>
                </div>
                 <p className="text-sm text-muted-foreground">Colors are currently set in theme files.</p>
              </div>
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate">Save Appearance Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Notification Settings</CardTitle>
                    <CardDescription>Configure email notifications for store events.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="newOrderAdmin" defaultChecked />
                        <Label htmlFor="newOrderAdmin">Notify admin on new order</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="newOrderCustomer" defaultChecked />
                        <Label htmlFor="newOrderCustomer">Send order confirmation to customer</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="shippingUpdateCustomer" defaultChecked />
                        <Label htmlFor="shippingUpdateCustomer">Notify customer on shipping updates</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                        <Checkbox id="lowStockAdmin" />
                        <Label htmlFor="lowStockAdmin">Notify admin on low stock alerts</Label>
                    </div>
                    <Separator className="my-4"/>
                     <div className="space-y-2">
                        <Label htmlFor="adminEmailNotif">Admin Notification Email</Label>
                        <Input id="adminEmailNotif" type="email" defaultValue="admin@theyarnzoo.com" />
                    </div>
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate">Save Notification Settings</Button>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="payments">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle>Payment Gateway Settings</CardTitle>
                    <CardDescription>Manage your Razorpay integration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert variant="default" className="bg-blue-50 border-blue-200">
                        <Info className="h-5 w-5 text-blue-700" />
                        <AlertTitle className="text-blue-800">Razorpay Configuration</AlertTitle>
                        <AlertDescription className="text-blue-700">
                            Your Razorpay Key ID and Key Secret are configured securely via environment variables (<code>NEXT_PUBLIC_RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> in your <code>.env</code> file). 
                            There is no need to enter them here.
                        </AlertDescription>
                    </Alert>
                     <div className="space-y-2">
                        <Label htmlFor="razorpayKeyIdDisplay">Razorpay Key ID (from .env)</Label>
                        <Input id="razorpayKeyIdDisplay" value={process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ? `${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.substring(0,8)}********` : "Not Set"} disabled />
                        <p className="text-xs text-muted-foreground">This is for display only. Set in your <code>.env</code> file.</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="razorpayTestMode" defaultChecked disabled/>
                        <Label htmlFor="razorpayTestMode">Razorpay Test Mode is determined by the keys used (test or live).</Label>
                    </div>
                    {/* <Button className="bg-accent hover:bg-accent/90 text-accent-foreground btn-subtle-animate">Save Payment Settings</Button> */}
                    {/* Save button removed as settings are from .env */}
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="security"><Card><CardHeader><CardTitle>Security Settings</CardTitle></CardHeader><CardContent><p>Security settings placeholder.</p></CardContent></Card></TabsContent>
        <TabsContent value="users"><Card><CardHeader><CardTitle>User Roles & Permissions</CardTitle></CardHeader><CardContent><p>User roles placeholder.</p></CardContent></Card></TabsContent>
        
      </Tabs>
    </div>
  );
}
