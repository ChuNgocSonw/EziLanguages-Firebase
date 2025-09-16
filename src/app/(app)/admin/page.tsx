
"use client";

import { useEffect, useState, useMemo } from "react";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { AdminUserView, UserRole } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function UserTable({ users, onRoleChange, getRoleBadgeVariant }: { users: AdminUserView[], onRoleChange: (userId: string, newRole: UserRole) => void, getRoleBadgeVariant: (role: string) => "default" | "secondary" | "destructive" }) {
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
        {users.map((user) => (
          <TableRow key={user.uid}>
            <TableCell className="font-medium">{user.name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={getRoleBadgeVariant(user.role)} className="capitalize">
                {user.role}
              </Badge>
            </TableCell>
            <TableCell>
              <Select
                defaultValue={user.role}
                onValueChange={(newRole: UserRole) => onRoleChange(user.uid, newRole)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}


export default function AdminPage() {
  const { getAllUsers, updateUserRole } = useAuth();
  const [users, setUsers] = useState<AdminUserView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
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
    };
    fetchUsers();
  }, [getAllUsers, toast]);

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
    } catch (error) {
      console.error("Failed to update role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "teacher":
        return "secondary";
      default:
        return "default";
    }
  }
  
  const filteredUsers = useMemo(() => {
    return {
      students: users.filter(u => u.role === 'student'),
      teachers: users.filter(u => u.role === 'teacher'),
      admins: users.filter(u => u.role === 'admin'),
    };
  }, [users]);

  return (
    <>
      <PageHeader
        title="Admin Dashboard"
        description="Manage users and their roles across the application."
      />
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>View all registered users and assign roles based on their category.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="students" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="students">Students ({filteredUsers.students.length})</TabsTrigger>
                <TabsTrigger value="teachers">Teachers ({filteredUsers.teachers.length})</TabsTrigger>
                <TabsTrigger value="admins">Admins ({filteredUsers.admins.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="students" className="mt-4">
                <UserTable users={filteredUsers.students} onRoleChange={handleRoleChange} getRoleBadgeVariant={getRoleBadgeVariant} />
              </TabsContent>
              <TabsContent value="teachers" className="mt-4">
                 <UserTable users={filteredUsers.teachers} onRoleChange={handleRoleChange} getRoleBadgeVariant={getRoleBadgeVariant} />
              </TabsContent>
              <TabsContent value="admins" className="mt-4">
                 <UserTable users={filteredUsers.admins} onRoleChange={handleRoleChange} getRoleBadgeVariant={getRoleBadgeVariant} />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </>
  );
}
