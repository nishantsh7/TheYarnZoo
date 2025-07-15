
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2, UserCog } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { getAdminUsers, updateUserRoleAction } from '@/actions/userProfileActions';
import type { AdminCustomerInfo, UserRole } from '@/types';
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function UserRolesManager() {
  const [users, setUsers] = useState<AdminCustomerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userToUpdate, setUserToUpdate] = useState<AdminCustomerInfo | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const { data: session } = useSession();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      const fetchedUsers = await getAdminUsers();
      setUsers(fetchedUsers);
      setIsLoading(false);
    }
    fetchUsers();
  }, []);

  const handleRoleChangeClick = (user: AdminCustomerInfo) => {
    setUserToUpdate(user);
    setNewRole(user.role);
  };

  const handleConfirmRoleChange = async () => {
    if (!userToUpdate) return;

    setIsUpdatingRole(true);
    try {
      const response = await updateUserRoleAction({
        userId: userToUpdate._id,
        newRole: newRole,
      });

      if (response.success) {
        toast({ title: "Success", description: response.message });
        setUsers(prev => prev.map(u => u._id === userToUpdate._id ? { ...u, role: newRole } : u));
        setUserToUpdate(null);
      } else {
        toast({ title: "Error", description: response.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-10">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-accent" />
        <p className="mt-2 text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>User Role Management</CardTitle>
          <CardDescription>Promote users to 'admin' or demote them to 'user'. Admins have full access to the admin panel.</CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user._id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                        className={user.role === 'admin' ? 'bg-red-100 text-red-800 border-red-300' : 'bg-blue-100 text-blue-800 border-blue-300'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={session?.user?.id === user._id}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="flex items-center cursor-pointer"
                            onClick={() => handleRoleChangeClick(user)}
                            disabled={session?.user?.id === user._id}
                          >
                            <UserCog className="mr-2 h-4 w-4" /> Change Role
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

      <AlertDialog open={!!userToUpdate} onOpenChange={(open) => !open && setUserToUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change User Role</AlertDialogTitle>
            <AlertDialogDescription>
              Update the role for <span className="font-bold">{userToUpdate?.name}</span> ({userToUpdate?.email}).
              Promoting a user to 'admin' will grant them full administrative access. Be careful!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="role-select">New Role</Label>
            <Select value={newRole} onValueChange={(value: UserRole) => setNewRole(value)}>
              <SelectTrigger id="role-select" className="w-full">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRoleChange} disabled={isUpdatingRole}>
              {isUpdatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Change
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
