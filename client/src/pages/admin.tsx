import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMenuItems, useOrders, useTourismPlaces, useBulkSettings, useAdminUsers } from "@/hooks/use-api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { AdminLogin } from "@/components/admin-login";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const menuItemSchema = z.object({
  name: z.string().min(2, { message: "Item name is required" }),
  price: z.coerce.number().min(1, { message: "Price must be greater than 0" }),
  purchasePrice: z.coerce.number().min(0, { message: "Purchase price must not be negative" }).optional(),
  category: z.string({ required_error: "Please select a category" }),
  details: z.string().optional(),
  disabled: z.boolean().optional().default(false)
});

const adminUserSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  isAdmin: z.boolean().default(true)
});

const Admin = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, user, logout } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("orders");
  const [editingMenuItem, setEditingMenuItem] = useState<null | MenuItem>(null);
  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [adminSettings, setAdminSettings] = useState(() => {
    const saved = localStorage.getItem("adminSettings");
    return saved ? JSON.parse(saved) : {
      pendingAlertInterval: 10000,
      preparingAlertInterval: 30000,
      soundEnabled: true,
    };
  });

  // Polling system: periodically fetch latest orders
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
    }, adminSettings.pendingAlertInterval || 10000);
    return () => clearInterval(interval);
  }, [adminSettings.pendingAlertInterval, queryClient]);

  // Data hooks
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem } = useMenuItems();
  const { orders, updateOrderStatus, placeOrder, refetch: fetchOrders } = useOrders();
  const { users: adminUsers = [], addAdminUser } = useAdminUsers();

  // Forms
  const menuItemForm = useForm({
    resolver: zodResolver(menuItemSchema),
    defaultValues: { name: "", price: 0, purchasePrice: 0, category: "", details: "", disabled: false }
  });
  const adminUserForm = useForm({
    resolver: zodResolver(adminUserSchema),
    defaultValues: { username: "", password: "", isAdmin: true }
  });

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <div className="admin-panel">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <p>Welcome, {user?.username}</p>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="my-4">
        <TabsList>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="orders">
          <h2 className="text-xl font-semibold mb-2">Orders</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders && orders.map(order => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.timestamp}</TableCell>
                  <TableCell>{order.name}</TableCell>
                  <TableCell>{order.roomNumber}</TableCell>
                  <TableCell>{order.total}</TableCell>
                  <TableCell>{order.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="menu">
          <h2 className="text-xl font-semibold mb-2">Menu</h2>
          <Button onClick={() => setIsAddingMenuItem(true)}>Add Menu Item</Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {menuItems && menuItems.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.price}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => setEditingMenuItem(item)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => deleteMenuItem(item.id)}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="users">
          <h2 className="text-xl font-semibold mb-2">Admin Users</h2>
          <Button onClick={() => setShowAddUserDialog(true)}>Add New Admin</Button>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adminUsers && adminUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.isAdmin ? "Admin" : "Staff"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
        <TabsContent value="settings">
          <h2 className="text-xl font-semibold mb-2">Settings</h2>
          <p>Settings section yahan dikhega.</p>
        </TabsContent>
      </Tabs>
      {/* Add/Edit Dialogs for Menu and Users can be implemented here */}
    </div>
  );
};

export default Admin;
const handleRecord = (record: any) => {
  // ... existing code ...
};
