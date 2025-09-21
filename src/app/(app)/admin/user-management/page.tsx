
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { AdminUserView, UserRole } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

function UserTable({ users, onRoleChange, getRoleBadgeVariant }: { users: AdminUserView[], onRoleChange: (userId: string, newRole: UserRole) => void, getRoleBadgeVariant: (role: string) => "default" | "secondary" | "destructive" | "outline" }) {
  const { user: currentUser, userProfile } = useAuth();
  
  const canChangeRole = (targetUserRole: UserRole) => {
    if (userProfile?.role === 'superadmin') {
      return targetUserRole !== 'superadmin';
    }
    if (userProfile?.role === 'admin') {
      return targetUserRole !== 'admin' && targetUserRole !== 'superadmin';
    }
    return false;
  };


  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Current Role</TableHead>
          <TableHead>Change Role</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length > 0 ? (
          users.map((user) => (
          <TableRow key={user.uid}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize pointer-events-none">
                {user.role === 'superadmin' ? 'Super Admin' : user.role}
              </Badge>
            </TableCell>
            <TableCell>
              <Select
                defaultValue={user.role}
                onValueChange={(newRole: UserRole) => onRoleChange(user.uid, newRole)}
                disabled={user.uid === currentUser?.uid || !canChangeRole(user.role)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))
        ) : (
           <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No users found for this filter.
              </TableCell>
            </TableRow>
        )}
      </TableBody>
    </Table>
  );
}


export default function UserManagementPage() {
  const { getAllUsers, updateUserRole } = useAuth();
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<UserRole | "all">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const userList = await getAllUsers();
      setUsers(userList);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({
        title: "Error",
        description: "Could not fetch user list.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [getAllUsers, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.uid === userId ? { ...user, role: newRole } : user
        )
      );
      toast({
        title: "Success",
        description: "User role updated successfully.",
      });
    } catch (error: any) {
      console.error("Failed to update role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "superadmin":
        return "destructive";
      case "admin":
        return "destructive";
      case "teacher":
        return "secondary";
      default:
        return "default";
    }
  }
  
  const filteredUsers = useMemo(() => {
    if (filter === "all") {
      return users;
    }
    if (filter === 'admin') {
      return users.filter(u => u.role === 'admin' || u.role === 'superadmin');
    }
    return users.filter(u => u.role === filter);
  }, [users, filter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const handleFilterChange = (value: UserRole | "all") => {
    setFilter(value);
    setCurrentPage(1); // Reset to first page on filter change
  };

  return (
    <>
      <PageHeader
        title="User Management"
        description="Manage users and their roles across the application."
      />
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
          <CardDescription>View, filter, and assign roles to all registered users.</CardDescription>
          <div className="pt-2">
             <Select value={filter} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Filter by role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="teacher">Teachers</SelectItem>
                <SelectItem value="admin">Admins & Super Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <UserTable users={paginatedUsers} onRoleChange={handleRoleChange} getRoleBadgeVariant={getRoleBadgeVariant} />
          )}
        </CardContent>
         {totalPages > 1 && (
          <CardFooter className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
