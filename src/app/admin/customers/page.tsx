
"use client"; // This page now uses client-side hooks for user session and navigation

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, MessageCircle, FileText, Users as UsersIcon, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getAdminUsers } from '@/actions/userProfileActions';
import { ensureChatSessionWithCustomer } from '@/actions/chatActions';
import type { AdminCustomerInfo } from '@/types';
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState<string | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchCustomers() {
      setIsLoading(true);
      const fetchedCustomers = await getAdminUsers();
      setCustomers(fetchedCustomers);
      setIsLoading(false);
    }
    fetchCustomers();
  }, []);

  const handleStartChat = async (customer: AdminCustomerInfo) => {
    if (!session?.user?.id) {
      toast({ title: "Error", description: "Admin session not found. Please re-login.", variant: "destructive"});
      return;
    }
    if (session.user.id === customer._id) {
      toast({ title: "Action Not Allowed", description: "Cannot start a chat with yourself.", variant: "destructive"});
      return;
    }

    setIsStartingChat(customer._id);
    try {
      const response = await ensureChatSessionWithCustomer({
        customerId: customer._id,
        adminId: session.user.id,
      });
      if (response.success && response.sessionId) {
        router.push(`/admin/support?chatId=${response.sessionId}`);
      } else {
        toast({ title: "Error Starting Chat", description: response.message || "Could not initiate chat session.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred while starting chat.", variant: "destructive" });
    } finally {
      setIsStartingChat(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-headline font-bold text-gray-800">Customer Management</h1>
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Customer List</CardTitle><CardDescription>Loading customers...</CardDescription></CardHeader>
          <CardContent className="text-center py-10"><Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-headline font-bold text-gray-800">Customer Management</h1>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <CardDescription>View and manage customer information and support interactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
             <div className="text-center py-10">
              <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No customers found yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Registered On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map(customer => (
                  <TableRow key={customer._id}>
                    <TableCell className="font-mono text-xs">{customer._id}</TableCell>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                        <Badge variant={customer.role === 'admin' ? 'destructive' : 'secondary'}
                               className={customer.role === 'admin' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-blue-100 text-blue-800 border-blue-300'}>
                        {customer.role}
                        </Badge>
                    </TableCell>
                    <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isStartingChat === customer._id}>
                            {isStartingChat === customer._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="flex items-center cursor-pointer" 
                            onClick={() => handleStartChat(customer)}
                            disabled={isStartingChat === customer._id || customer.role === 'admin'} // Disable for admin themselves
                          >
                            <MessageCircle className="mr-2 h-4 w-4" /> 
                            {customer.role === 'admin' ? 'Chat (N/A)' : 'Start Chat'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center cursor-pointer" disabled>
                            <FileText className="mr-2 h-4 w-4" /> View Order History (Placeholder)
                          </DropdownMenuItem>
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

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Customer Support Tools</CardTitle>
          <CardDescription>Additional tools for customer support (placeholders).</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <Button variant="outline" className="w-full justify-start text-left" disabled>
            <FileText className="mr-2 h-5 w-5" /> View Support Tickets
          </Button>
          <Button variant="outline" className="w-full justify-start text-left" disabled>
            <FileText className="mr-2 h-5 w-5" /> Export Customer Data
          </Button>
           <Button variant="outline" className="w-full justify-start text-left" disabled>
            <FileText className="mr-2 h-5 w-5" /> Process Refunds
          </Button>
          <Button variant="outline" className="w-full justify-start text-left" disabled>
            <MessageCircle className="mr-2 h-5 w-5" /> Live Chat Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
