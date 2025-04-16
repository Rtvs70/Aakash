import React, { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useMenuItems, useOrders, useTourismPlaces, useBulkSettings, useAdminUsers } from "@/hooks/use-api";
import { useWebSocketContext } from "@/hooks/use-websocket-context";
import { MENU_CATEGORIES, TOURISM_TAGS, ORDER_STATUS_OPTIONS } from "@/config/constants";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice, formatDate } from "@/lib/utils";
import { MenuItem, Order, TourismPlace, AdminUser, ActivityLog } from "@/types";
import { AdminLogin } from "@/components/admin-login";

import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { 
  Input 
} from "@/components/ui/input";
import {
  Textarea
} from "@/components/ui/textarea";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  Search, 
  Edit, 
  Trash, 
  Trash2,
  Plus,
  Loader2,
  LogOut,
  Save,
  Settings as SettingsIcon,
  Map,
  FileEdit,
  Palette,
  BellRing,
  QrCode,
  MessageSquare,
  Calendar,
  Upload,
  Play,
  Ban,
  FileText,
  CheckSquare,
  DollarSign
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define schemas for forms
const menuItemSchema = z.object({
  name: z.string().min(2, { message: "Item name is required" }),
  price: z.coerce.number().min(1, { message: "Price must be greater than 0" }),
  purchasePrice: z.coerce.number().min(0, { message: "Purchase price must not be negative" }).optional(),
  category: z.string({ required_error: "Please select a category" }),
  details: z.string().optional(),
  disabled: z.boolean().optional().default(false)
});

const tourismPlaceSchema = z.object({
  title: z.string().min(2, { message: "Title is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  distance: z.string().min(1, { message: "Distance is required" }),
  tags: z.array(z.string()).min(1, { message: "Select at least one tag" }),
  mapsLink: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
  photoLinks: z.array(z.string().url({ message: "Please enter valid photo URLs" })).optional()
});

const adminUserSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  isAdmin: z.boolean().default(true)
});

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required" }),
  newPassword: z.string().min(8, { message: "Password must be at least 8 characters" }),
  confirmPassword: z.string().min(1, { message: "Please confirm your password" })
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const sheetsConfigSchema = z.object({
  ordersSpreadsheetId: z.string().min(10, { message: "Spreadsheet ID is required" }),
  ordersSheetId: z.string(),
  tourismSpreadsheetId: z.string().min(10, { message: "Spreadsheet ID is required" }),
  tourismSheetId: z.string()
});

const themeSettingsSchema = z.object({
  brandName: z.string().min(1, { message: "Brand name is required" }),
  primaryColor: z.string().min(1, { message: "Primary color is required" }),
  fontFamily: z.string()
});

// Main component
// OrderRow component for expandable order rows
interface OrderRowProps {
  order: Order;
  onStatusChange: (orderId: number, newStatus: string) => void;
}

function OrderRow({ order, onStatusChange }: OrderRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <React.Fragment>
      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setIsExpanded(!isExpanded)}>
        <TableCell>{order.id}</TableCell>
        <TableCell>{formatDate(order.timestamp)}</TableCell>
        <TableCell>{order.name || "—"}</TableCell>
        <TableCell>{order.roomNumber}</TableCell>
        <TableCell>{formatPrice(order.total)}</TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <Select 
            defaultValue={order.status}
            onValueChange={(value) => onStatusChange(order.id, value)}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder={order.status} />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => onStatusChange(order.id, order.status)}
          >
            Update
          </Button>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell colSpan={7} className="px-4 py-3 bg-muted/20">
            <div className="text-sm">
              <h4 className="font-medium mb-2">Order Details</h4>
              <div className="space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center border-b border-muted pb-2">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="ml-2 text-muted-foreground">x{item.quantity}</span>
                      {item.details && (
                        <p className="text-xs text-muted-foreground mt-1">{item.details}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div>{formatPrice(item.price * item.quantity)}</div>
                      {item.purchasePrice && (
                        <div className="text-xs text-muted-foreground">
                          Cost: {formatPrice(item.purchasePrice * item.quantity)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between font-medium pt-2">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
}

export default function Admin() {
  const { user, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  
  // State for sheet configurations
  const [ordersSpreadsheetId, setOrdersSpreadsheetId] = useState(import.meta.env.VITE_ORDERS_SPREADSHEET_ID || "");
  const [ordersSheetId, setOrdersSheetId] = useState("0");
  const [tourismSpreadsheetId, setTourismSpreadsheetId] = useState(import.meta.env.VITE_TOURISM_SPREADSHEET_ID || "");
  const [tourismSheetId, setTourismSheetId] = useState("0");
  
  // State for menu management
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [isAddingMenuItem, setIsAddingMenuItem] = useState(false);
  
  // State for tourism management
  const [editingTourismPlace, setEditingTourismPlace] = useState<TourismPlace | null>(null);
  const [isAddingTourismPlace, setIsAddingTourismPlace] = useState(false);
  
  // State for theme settings
  const [brandName, setBrandName] = useState("Rai Guest House");
  const [primaryColor, setPrimaryColor] = useState("#4f46e5"); // Default indigo color
  const [fontFamily, setFontFamily] = useState("Inter");
  const [logoImage, setLogoImage] = useState<string | null>(null);
  
  // State for general settings
  const [qrAutoFill, setQrAutoFill] = useState(true);
  const [orderAlertSound, setOrderAlertSound] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);
  
  // QR Code generator state
  const [qrRoomNumber, setQrRoomNumber] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  
  // Events calendar state
  const [calendarId, setCalendarId] = useState("");
  const [showEventsCalendar, setShowEventsCalendar] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  
  // Theme preview
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Hooks for data fetching
  const { 
    menuItems, 
    loading: loadingMenu, 
    addMenuItem, 
    updateMenuItem,
    deleteMenuItem 
  } = useMenuItems();
  
  const { 
    orders, 
    loading: loadingOrders, 
    updateOrderStatus: updateOrder,
    placeOrder, 
    refetch: fetchOrders 
  } = useOrders();
  
  const { 
    tourismPlaces, 
    loading: loadingTourism,
    addTourismPlace,
    updateTourismPlace,
    deleteTourismPlace
  } = useTourismPlaces();
  const { toast } = useToast();
  
  // WebSocket for real-time order notifications
  const { isConnected: wsConnected } = useWebSocketContext();
  
  // Set up WebSocket event handlers
  useEffect(() => {
    // Define event handlers for WebSocket context
    const handleNewOrder = (order: Order) => {
      toast({
        title: "New Order Received",
        description: `Order #${order.id} from ${order.name || 'Guest'} - Room ${order.roomNumber}`,
        variant: "default",
      });
      
      // Play alert sound if enabled
      if (orderAlertSound) {
        const audio = new Audio("/notification.mp3");
        audio.play().catch(e => console.log("Error playing sound:", e));
      }
      
      // Refresh orders list
      fetchOrders();
    };
    
    const handleOrderStatusUpdate = (order: Order) => {
      toast({
        title: "Order Status Updated",
        description: `Order #${order.id} is now ${order.status}`,
      });
      
      // Refresh orders list
      fetchOrders();
    };
    
    // Register handlers with the WebSocket provider directly
    // This is done using the WebSocket custom event system since we're now using a global context
    document.addEventListener('ws:new-order', (e: any) => handleNewOrder(e.detail));
    document.addEventListener('ws:order-status-update', (e: any) => handleOrderStatusUpdate(e.detail));
    
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('ws:new-order', (e: any) => handleNewOrder(e.detail));
      document.removeEventListener('ws:order-status-update', (e: any) => handleOrderStatusUpdate(e.detail));
    };
  }, [fetchOrders, orderAlertSound, toast]);
  
  // Forms
  const menuItemForm = useForm<z.infer<typeof menuItemSchema>>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      price: 0,
      purchasePrice: 0,
      category: "",
      details: "",
      disabled: false
    }
  });
  
  const tourismPlaceForm = useForm<z.infer<typeof tourismPlaceSchema>>({
    resolver: zodResolver(tourismPlaceSchema),
    defaultValues: {
      title: "",
      description: "",
      distance: "",
      tags: [],
      mapsLink: "",
      photoLinks: []
    }
  });
  
  const sheetsConfigForm = useForm<z.infer<typeof sheetsConfigSchema>>({
    resolver: zodResolver(sheetsConfigSchema),
    defaultValues: {
      ordersSpreadsheetId: ordersSpreadsheetId,
      ordersSheetId: ordersSheetId,
      tourismSpreadsheetId: tourismSpreadsheetId,
      tourismSheetId: tourismSheetId
    }
  });
  
  const passwordChangeForm = useForm<z.infer<typeof passwordChangeSchema>>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }
  });
  
  const themeSettingsForm = useForm<z.infer<typeof themeSettingsSchema>>({
    resolver: zodResolver(themeSettingsSchema),
    defaultValues: {
      brandName: brandName,
      primaryColor: primaryColor,
      fontFamily: fontFamily
    }
  });
  
  // Update page title and fetch data when authenticated
  useEffect(() => {
    document.title = "Admin Panel | Rai Guest House";
    
    if (isAuthenticated) {
      fetchOrders();
    }
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("adminSettings");
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        
        // Sheet configs
        if (settings.ordersSpreadsheetId) setOrdersSpreadsheetId(settings.ordersSpreadsheetId);
        if (settings.ordersSheetId) setOrdersSheetId(settings.ordersSheetId);
        if (settings.tourismSpreadsheetId) setTourismSpreadsheetId(settings.tourismSpreadsheetId);
        if (settings.tourismSheetId) setTourismSheetId(settings.tourismSheetId);
        
        // Theme settings
        if (settings.brandName) setBrandName(settings.brandName);
        if (settings.primaryColor) setPrimaryColor(settings.primaryColor);
        if (settings.fontFamily) setFontFamily(settings.fontFamily);
        if (settings.logoImage) setLogoImage(settings.logoImage);
        
        // General settings
        if (settings.qrAutoFill !== undefined) setQrAutoFill(settings.qrAutoFill);
        if (settings.orderAlertSound !== undefined) setOrderAlertSound(settings.orderAlertSound);
        if (settings.whatsappAlerts !== undefined) setWhatsappAlerts(settings.whatsappAlerts);
        
        // Calendar settings
        if (settings.calendarId) setCalendarId(settings.calendarId);
        if (settings.showEventsCalendar !== undefined) setShowEventsCalendar(settings.showEventsCalendar);
      } catch (error) {
        console.error("Error parsing saved settings:", error);
      }
    }
  }, [fetchOrders]);
  
  // Update form defaults when external state changes
  useEffect(() => {
    sheetsConfigForm.setValue("ordersSpreadsheetId", ordersSpreadsheetId);
    sheetsConfigForm.setValue("ordersSheetId", ordersSheetId);
    sheetsConfigForm.setValue("tourismSpreadsheetId", tourismSpreadsheetId);
    sheetsConfigForm.setValue("tourismSheetId", tourismSheetId);
    
    themeSettingsForm.setValue("brandName", brandName);
    themeSettingsForm.setValue("primaryColor", primaryColor);
    themeSettingsForm.setValue("fontFamily", fontFamily);
  }, [
    ordersSpreadsheetId, ordersSheetId, 
    tourismSpreadsheetId, tourismSheetId,
    brandName, primaryColor, fontFamily
  ]);
  
  // Set form values when editing menu item
  useEffect(() => {
    if (editingMenuItem) {
      menuItemForm.setValue("name", editingMenuItem.name);
      menuItemForm.setValue("price", editingMenuItem.price);
      menuItemForm.setValue("purchasePrice", editingMenuItem.purchasePrice || 0);
      menuItemForm.setValue("category", editingMenuItem.category);
      menuItemForm.setValue("details", editingMenuItem.details || "");
    } else {
      menuItemForm.reset();
    }
  }, [editingMenuItem, menuItemForm]);
  
  // Set form values when editing tourism place
  useEffect(() => {
    if (editingTourismPlace) {
      tourismPlaceForm.setValue("title", editingTourismPlace.title);
      tourismPlaceForm.setValue("description", editingTourismPlace.description);
      tourismPlaceForm.setValue("distance", editingTourismPlace.distance);
      tourismPlaceForm.setValue("tags", editingTourismPlace.tags);
      tourismPlaceForm.setValue("mapsLink", editingTourismPlace.mapsLink);
      // @ts-ignore - photoLinks may not be in the type yet, but it's in the schema
      tourismPlaceForm.setValue("photoLinks", editingTourismPlace.photoLinks || []);
    } else {
      tourismPlaceForm.reset();
    }
  }, [editingTourismPlace, tourismPlaceForm]);
  
  // Initialize admin user management form
  const adminUserForm = useForm<z.infer<typeof adminUserSchema>>({
    resolver: zodResolver(adminUserSchema),
    defaultValues: {
      username: "",
      password: "",
      isAdmin: true
    }
  });

  // State for admin users management
  const { 
    users: adminUsers = [], 
    loading: loadingUsers, 
    addAdminUser,
    getActivityLogs
  } = useAdminUsers();
  
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Fetch activity logs
  const fetchActivityLogs = async () => {
    setLoadingLogs(true);
    try {
      await getActivityLogs();
      const logsData = queryClient.getQueryData<ActivityLog[]>(['/api/activity-logs']) || [];
      setActivityLogs(logsData);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      toast({
        title: "Error",
        description: "Failed to load activity logs",
        variant: "destructive"
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  // Handle adding new admin user
  const handleAddAdminUser = (data: z.infer<typeof adminUserSchema>) => {
    addAdminUser({
      username: data.username,
      password: data.password,
      isAdmin: data.isAdmin
    });
    adminUserForm.reset();
  };

  // Load activity logs when the users tab is activated
  useEffect(() => {
    if (activeTab === "users") {
      fetchActivityLogs();
    }
  }, [activeTab]);

  // Use the global auth logout function
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
  };
  
  const handleStatusChange = async (orderId: number, newStatus: string) => {
    try {
      await updateOrder({ id: orderId, status: newStatus });
      toast({
        title: "Order updated",
        description: `Order #${orderId} status changed to ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error updating order",
        description: "There was a problem updating the order status",
        variant: "destructive",
      });
    }
  };
  
  const saveSheetSettings = (data: z.infer<typeof sheetsConfigSchema>) => {
    // Update state
    setOrdersSpreadsheetId(data.ordersSpreadsheetId);
    setOrdersSheetId(data.ordersSheetId);
    setTourismSpreadsheetId(data.tourismSpreadsheetId);
    setTourismSheetId(data.tourismSheetId);
    
    // Save to localStorage
    const settings = {
      ...JSON.parse(localStorage.getItem("adminSettings") || "{}"),
      ordersSpreadsheetId: data.ordersSpreadsheetId,
      ordersSheetId: data.ordersSheetId,
      tourismSpreadsheetId: data.tourismSpreadsheetId,
      tourismSheetId: data.tourismSheetId
    };
    localStorage.setItem("adminSettings", JSON.stringify(settings));
    
    toast({
      title: "Settings updated",
      description: "Google Sheet configuration has been updated",
    });
  };
  
  const handleSaveMenuItem = (data: z.infer<typeof menuItemSchema>) => {
    if (editingMenuItem) {
      // Update existing item
      const updatedItem = {
        ...editingMenuItem,
        name: data.name,
        price: data.price,
        purchasePrice: data.purchasePrice,
        category: data.category,
        details: data.details,
        disabled: data.disabled
      };
      
      // Use API to update
      updateMenuItem(updatedItem);
      
    } else {
      // Add new item using API
      addMenuItem({
        name: data.name,
        price: data.price,
        purchasePrice: data.purchasePrice,
        category: data.category || "",
        details: data.details,
        disabled: data.disabled || false
      });
    }
    
    // Close dialog
    setEditingMenuItem(null);
    setIsAddingMenuItem(false);
  };
  
  const handleDeleteMenuItem = (itemId: number) => {
    // Use API to delete the item
    deleteMenuItem(itemId);
  };
  
  const handleToggleMenuItemStatus = (item: MenuItem) => {
    // Update with toggled disabled status
    const updatedItem = {
      ...item,
      disabled: !item.disabled
    };
    
    // Use API to update the item
    updateMenuItem(updatedItem);
    
    toast({
      title: updatedItem.disabled ? "Item disabled" : "Item enabled",
      description: `${item.name} has been ${updatedItem.disabled ? "disabled" : "enabled"}`,
    });
  };
  
  const handleSaveTourismPlace = (data: z.infer<typeof tourismPlaceSchema>) => {
    if (editingTourismPlace) {
      // Update using API
      updateTourismPlace({
        id: editingTourismPlace.id,
        title: data.title,
        description: data.description,
        distance: data.distance,
        tags: data.tags || [],
        mapsLink: data.mapsLink || "",
        photoLinks: data.photoLinks || [],
      });
    } else {
      // Add new place using API
      addTourismPlace({
        title: data.title,
        description: data.description,
        distance: data.distance,
        tags: data.tags || [],
        mapsLink: data.mapsLink || "",
        photoLinks: data.photoLinks || [],
      });
    }
    
    // Close dialog
    setEditingTourismPlace(null);
    setIsAddingTourismPlace(false);
  };
  
  const handleDeleteTourismPlace = (placeId: number) => {
    // Delete using API
    deleteTourismPlace(placeId);
  };
  
  const handleChangePassword = async (data: z.infer<typeof passwordChangeSchema>) => {
    try {
      // In a real app, you would update the password using API
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully",
      });
      
      passwordChangeForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleSaveThemeSettings = (data: z.infer<typeof themeSettingsSchema>) => {
    // Update state
    setBrandName(data.brandName);
    setPrimaryColor(data.primaryColor);
    setFontFamily(data.fontFamily);
    
    // Save to localStorage
    const settings = {
      ...JSON.parse(localStorage.getItem("adminSettings") || "{}"),
      brandName: data.brandName,
      primaryColor: data.primaryColor,
      fontFamily: data.fontFamily,
      logoImage: logoImage
    };
    localStorage.setItem("adminSettings", JSON.stringify(settings));
    
    toast({
      title: "Theme settings updated",
      description: "Your theme changes have been saved",
    });
  };
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoImage(result);
      
      // Save to localStorage
      const settings = {
        ...JSON.parse(localStorage.getItem("adminSettings") || "{}"),
        logoImage: result
      };
      localStorage.setItem("adminSettings", JSON.stringify(settings));
    };
    reader.readAsDataURL(file);
  };
  
  const saveGeneralSettings = () => {
    // Save to localStorage
    const settings = {
      ...JSON.parse(localStorage.getItem("adminSettings") || "{}"),
      qrAutoFill,
      orderAlertSound,
      whatsappAlerts,
      calendarId,
      showEventsCalendar
    };
    localStorage.setItem("adminSettings", JSON.stringify(settings));
    
    toast({
      title: "Settings updated",
      description: "Your general settings have been saved",
    });
  };
  
  // QR Code generator functions
  const generateQrCode = () => {
    if (!qrRoomNumber) return;
    
    // Create URL with room number parameter
    const baseUrl = window.location.origin;
    const menuUrl = `${baseUrl}/menu?room=${qrRoomNumber}`;
    
    // Generate QR code using Google Charts API
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(menuUrl)}&choe=UTF-8`;
    setQrCodeUrl(qrUrl);
    
    toast({
      title: "QR Code generated",
      description: `QR code for Room ${qrRoomNumber} has been created`,
    });
  };
  
  const handlePrintQrCode = () => {
    if (!qrCodeUrl) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Add content to the print window
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - Room ${qrRoomNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
            img { max-width: 250px; margin: 20px auto; }
            h2 { margin-bottom: 5px; }
            p { margin-top: 5px; color: #555; }
          </style>
        </head>
        <body>
          <h2>Rai Guest House</h2>
          <p>Scan to order food to your room</p>
          <img src="${qrCodeUrl}" alt="QR Code for Room ${qrRoomNumber}" />
          <p><strong>Room ${qrRoomNumber}</strong></p>
        </body>
      </html>
    `);
    
    // Print and close
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };
  
  const handleDownloadQrCode = () => {
    if (!qrCodeUrl) return;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `room-${qrRoomNumber}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filter orders based on search query
  const filteredOrders = searchQuery
    ? orders.filter(order => 
        order.roomNumber.includes(searchQuery) || 
        order.mobileNumber.includes(searchQuery) || 
        (order.name && order.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : orders;
  
  // Login screen
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Main admin panel
  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Rai Guest House Admin Panel</h2>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
      
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="menu">Menu Manager</TabsTrigger>
          <TabsTrigger value="orders">Order Sheet</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="theme">Theme Editor</TabsTrigger>
          <TabsTrigger value="tourism">Tourism Content</TabsTrigger>
          <TabsTrigger value="users">Admin Users</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <Card>
            <CardHeader>
              <CardTitle>Order Management</CardTitle>
              <CardDescription>View and manage incoming orders</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="mb-4">
                <Input 
                  type="text" 
                  placeholder="Search by room number, mobile number, or name" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              
              {loadingOrders ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No orders found.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOrders.map((order) => (
                          <OrderRow 
                            key={order.id} 
                            order={order} 
                            onStatusChange={handleStatusChange} 
                          />
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Menu Manager Tab */}
        <TabsContent value="menu">
          <Card>
            <CardHeader>
              <CardTitle>Menu Manager</CardTitle>
              <CardDescription>Add, edit, and delete menu items</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h3 className="text-xl font-semibold">Menu Items</h3>
                <div className="mt-3 sm:mt-0">
                  <Dialog open={isAddingMenuItem} onOpenChange={setIsAddingMenuItem}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Menu Item</DialogTitle>
                        <DialogDescription>
                          Add a new item to your menu. Click save when you're done.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...menuItemForm}>
                        <form onSubmit={menuItemForm.handleSubmit(handleSaveMenuItem)} className="space-y-4 pt-4">
                          <FormField
                            control={menuItemForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Item Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="Butter Naan" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={menuItemForm.control}
                            name="price"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Sale Price (₹)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="40" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={menuItemForm.control}
                            name="purchasePrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Purchase Price (₹)</FormLabel>
                                <FormControl>
                                  <Input type="number" placeholder="30" {...field} />
                                </FormControl>
                                <FormDescription>
                                  Price paid to restaurant for outsourced food items
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={menuItemForm.control}
                            name="category"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Category</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {MENU_CATEGORIES.map((category) => (
                                      <SelectItem key={category} value={category}>{category}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={menuItemForm.control}
                            name="details"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Details (Optional)</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter item description or special notes" 
                                    className="resize-y"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription>
                                  Add important details like ingredients, spice level, or allergens
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button type="submit">Save Item</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {loadingMenu ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price (₹)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuItems.map((item) => (
                        <TableRow key={item.id} className={item.disabled ? "opacity-50" : ""}>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.price}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant={item.disabled ? "outline" : "ghost"} 
                                size="sm" 
                                className={item.disabled ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
                                onClick={() => handleToggleMenuItemStatus(item)}
                              >
                                {item.disabled ? (
                                  <>
                                    <Play className="h-4 w-4 mr-1" />
                                    Enable
                                  </>
                                ) : (
                                  <>
                                    <Ban className="h-4 w-4 mr-1" />
                                    Disable
                                  </>
                                )}
                              </Button>
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                    onClick={() => setEditingMenuItem(item)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Menu Item</DialogTitle>
                                  <DialogDescription>
                                    Make changes to the menu item. Click save when you're done.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <Form {...menuItemForm}>
                                  <form onSubmit={menuItemForm.handleSubmit(handleSaveMenuItem)} className="space-y-4 pt-4">
                                    <FormField
                                      control={menuItemForm.control}
                                      name="name"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Item Name</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={menuItemForm.control}
                                      name="price"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Sale Price (₹)</FormLabel>
                                          <FormControl>
                                            <Input type="number" {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={menuItemForm.control}
                                      name="purchasePrice"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Purchase Price (₹)</FormLabel>
                                          <FormControl>
                                            <Input type="number" {...field} />
                                          </FormControl>
                                          <FormDescription>
                                            Price paid to restaurant for outsourced food items
                                          </FormDescription>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={menuItemForm.control}
                                      name="category"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Category</FormLabel>
                                          <Select 
                                            onValueChange={field.onChange} 
                                            defaultValue={field.value}
                                          >
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              {MENU_CATEGORIES.map((category) => (
                                                <SelectItem key={category} value={category}>{category}</SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={menuItemForm.control}
                                      name="details"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Details (Optional)</FormLabel>
                                          <FormControl>
                                            <Textarea 
                                              placeholder="Enter item description or special notes" 
                                              className="resize-y"
                                              {...field} 
                                            />
                                          </FormControl>
                                          <FormDescription>
                                            Add important details like ingredients, spice level, or allergens
                                          </FormDescription>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <DialogFooter>
                                      <Button type="submit">Save Changes</Button>
                                    </DialogFooter>
                                  </form>
                                </Form>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              onClick={() => handleDeleteMenuItem(item.id)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Order Sheet Management Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Google Sheets Configuration</CardTitle>
              <CardDescription>Configure the Google Sheets integration for your data</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...sheetsConfigForm}>
                <form onSubmit={sheetsConfigForm.handleSubmit(saveSheetSettings)} className="space-y-6">

                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Orders Sheet Configuration</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={sheetsConfigForm.control}
                        name="ordersSpreadsheetId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Orders Spreadsheet ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter Google Spreadsheet ID" />
                            </FormControl>
                            <FormDescription>
                              The ID from your Google Sheets URL
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={sheetsConfigForm.control}
                        name="ordersSheetId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Orders Sheet GID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="0" />
                            </FormControl>
                            <FormDescription>
                              Usually 0 for the first sheet
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Tourism Sheet Configuration</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={sheetsConfigForm.control}
                        name="tourismSpreadsheetId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tourism Spreadsheet ID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Enter Google Spreadsheet ID" />
                            </FormControl>
                            <FormDescription>
                              The ID from your Google Sheets URL
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={sheetsConfigForm.control}
                        name="tourismSheetId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tourism Sheet GID</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="0" />
                            </FormControl>
                            <FormDescription>
                              Usually 0 for the first sheet
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" className="mt-4">
                    <Save className="h-4 w-4 mr-2" />
                    Save Sheet Configuration
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Theme Editor Tab */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Theme Editor</CardTitle>
              <CardDescription>Customize the look and feel of your website</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <Form {...themeSettingsForm}>
                    <form onSubmit={themeSettingsForm.handleSubmit(handleSaveThemeSettings)} className="space-y-4">
                      <FormField
                        control={themeSettingsForm.control}
                        name="brandName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Brand Name</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Rai Guest House" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={themeSettingsForm.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <div className="flex items-center gap-4">
                              <FormControl>
                                <Input {...field} type="color" className="w-16 h-10" />
                              </FormControl>
                              <Input 
                                value={field.value} 
                                onChange={(e) => field.onChange(e.target.value)}
                                placeholder="#4f46e5" 
                                className="flex-1"
                              />
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={themeSettingsForm.control}
                        name="fontFamily"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Font Family</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a font" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Inter">Inter</SelectItem>
                                <SelectItem value="Roboto">Roboto</SelectItem>
                                <SelectItem value="Poppins">Poppins</SelectItem>
                                <SelectItem value="Lato">Lato</SelectItem>
                                <SelectItem value="Montserrat">Montserrat</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <Label className="block text-sm font-medium mb-2">Logo Upload</Label>
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-md border flex items-center justify-center overflow-hidden">
                            {logoImage ? (
                              <img 
                                src={logoImage} 
                                alt="Logo Preview" 
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <Upload className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <Input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleLogoUpload}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center space-x-2">
                        <Label htmlFor="theme-toggle">Preview in Dark Mode</Label>
                        <Switch 
                          id="theme-toggle" 
                          checked={isDarkMode}
                          onCheckedChange={setIsDarkMode}
                        />
                      </div>
                      
                      <Button type="submit" className="mt-4">
                        <Save className="h-4 w-4 mr-2" />
                        Save Theme Settings
                      </Button>
                    </form>
                  </Form>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Live Preview</h3>
                  <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white'}`}>
                    <div className="p-4 border-b" style={{ backgroundColor: primaryColor, color: 'white' }}>
                      <div className="flex items-center gap-3">
                        {logoImage && (
                          <img src={logoImage} alt="Logo" className="h-10 w-10 object-contain" />
                        )}
                        <h3 className={`font-bold text-xl`} style={{ fontFamily }}>
                          {brandName}
                        </h3>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="mb-6">
                        <h4 className={`text-lg font-semibold mb-2`} style={{ fontFamily }}>Welcome to our Guest House</h4>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} style={{ fontFamily }}>
                          Experience comfort and luxury during your stay
                        </p>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <h5 className="font-medium" style={{ fontFamily }}>Deluxe Room</h5>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontFamily }}>
                            Spacious room with all amenities
                          </p>
                        </div>
                        <div className={`p-3 rounded-md ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                          <h5 className="font-medium" style={{ fontFamily }}>Premium Suite</h5>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontFamily }}>
                            Luxury suite with beautiful view
                          </p>
                        </div>
                      </div>
                      
                      <Button style={{ backgroundColor: primaryColor }}>Book Now</Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Tourism Content Tab */}
        <TabsContent value="tourism">
          <Card>
            <CardHeader>
              <CardTitle>Tourism Content Editor</CardTitle>
              <CardDescription>Manage tourist attractions and places of interest</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h3 className="text-xl font-semibold">Tourism Places</h3>
                <div className="mt-3 sm:mt-0">
                  <Dialog open={isAddingTourismPlace} onOpenChange={setIsAddingTourismPlace}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Place
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Add Tourism Place</DialogTitle>
                        <DialogDescription>
                          Add a new tourist attraction or place of interest.
                        </DialogDescription>
                      </DialogHeader>
                      
                      <Form {...tourismPlaceForm}>
                        <form onSubmit={tourismPlaceForm.handleSubmit(handleSaveTourismPlace)} className="space-y-4 pt-4">
                          <FormField
                            control={tourismPlaceForm.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Mahakaleshwar Temple" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={tourismPlaceForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe this place..." 
                                    className="min-h-32"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField
                              control={tourismPlaceForm.control}
                              name="distance"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Distance</FormLabel>
                                  <FormControl>
                                    <Input placeholder="4.2 km" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={tourismPlaceForm.control}
                              name="mapsLink"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Google Maps Link</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="https://maps.google.com/?q=..." 
                                      {...field} 
                                      value={field.value || ''} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={tourismPlaceForm.control}
                              name="photoLinks"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Photo Links</FormLabel>
                                  <FormDescription>
                                    Enter Google Drive photo links, one per line
                                  </FormDescription>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="https://drive.google.com/uc?id=..." 
                                      {...field} 
                                      value={field.value?.join('\n') || ''} 
                                      onChange={(e) => {
                                        const links = e.target.value
                                          .split('\n')
                                          .map(link => link.trim())
                                          .filter(link => link !== '');
                                        field.onChange(links);
                                      }}
                                      rows={4}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={tourismPlaceForm.control}
                            name="tags"
                            render={() => (
                              <FormItem>
                                <div className="mb-2">
                                  <FormLabel>Tags</FormLabel>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {TOURISM_TAGS.filter(tag => tag !== "All").map((tag) => (
                                    <FormField
                                      key={tag}
                                      control={tourismPlaceForm.control}
                                      name="tags"
                                      render={({ field }) => {
                                        return (
                                          <FormItem
                                            key={tag}
                                            className="flex flex-row items-center space-x-2 space-y-0"
                                          >
                                            <FormControl>
                                              <Checkbox
                                                checked={field.value?.includes(tag)}
                                                onCheckedChange={(checked) => {
                                                  return checked
                                                    ? field.onChange([...field.value, tag])
                                                    : field.onChange(
                                                        field.value?.filter(
                                                          (value) => value !== tag
                                                        )
                                                      )
                                                }}
                                              />
                                            </FormControl>
                                            <FormLabel className="text-sm font-normal cursor-pointer">
                                              {tag}
                                            </FormLabel>
                                          </FormItem>
                                        )
                                      }}
                                    />
                                  ))}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <DialogFooter>
                            <Button type="submit">Save Place</Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              
              {loadingTourism ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Place Name</TableHead>
                        <TableHead>Distance</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tourismPlaces.map((place) => (
                        <TableRow key={place.id}>
                          <TableCell className="font-medium">{place.title}</TableCell>
                          <TableCell>{place.distance}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {place.tags.map(tag => (
                                <Badge key={`${place.id}-${tag}`} variant="outline">{tag}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                  onClick={() => setEditingTourismPlace(place)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Edit Tourism Place</DialogTitle>
                                  <DialogDescription>
                                    Make changes to this tourism place.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <Form {...tourismPlaceForm}>
                                  <form onSubmit={tourismPlaceForm.handleSubmit(handleSaveTourismPlace)} className="space-y-4 pt-4">
                                    <FormField
                                      control={tourismPlaceForm.control}
                                      name="title"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Title</FormLabel>
                                          <FormControl>
                                            <Input {...field} />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={tourismPlaceForm.control}
                                      name="description"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Description</FormLabel>
                                          <FormControl>
                                            <Textarea 
                                              className="min-h-32"
                                              {...field} 
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      <FormField
                                        control={tourismPlaceForm.control}
                                        name="distance"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Distance</FormLabel>
                                            <FormControl>
                                              <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                      
                                      <FormField
                                        control={tourismPlaceForm.control}
                                        name="mapsLink"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel>Google Maps Link</FormLabel>
                                            <FormControl>
                                              <Input 
                                                {...field} 
                                                value={field.value || ''} 
                                              />
                                            </FormControl>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />
                                    </div>
                                    
                                    <FormField
                                      control={tourismPlaceForm.control}
                                      name="photoLinks"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Photo Links</FormLabel>
                                          <FormDescription>
                                            Enter Google Drive photo links, one per line
                                          </FormDescription>
                                          <FormControl>
                                            <Textarea 
                                              placeholder="https://drive.google.com/uc?id=..." 
                                              {...field} 
                                              value={field.value?.join('\n') || ''} 
                                              onChange={(e) => {
                                                const links = e.target.value
                                                  .split('\n')
                                                  .map(link => link.trim())
                                                  .filter(link => link !== '');
                                                field.onChange(links);
                                              }}
                                              rows={4}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <FormField
                                      control={tourismPlaceForm.control}
                                      name="tags"
                                      render={() => (
                                        <FormItem>
                                          <div className="mb-2">
                                            <FormLabel>Tags</FormLabel>
                                          </div>
                                          <div className="flex flex-wrap gap-2">
                                            {TOURISM_TAGS.filter(tag => tag !== "All").map((tag) => (
                                              <FormField
                                                key={tag}
                                                control={tourismPlaceForm.control}
                                                name="tags"
                                                render={({ field }) => {
                                                  return (
                                                    <FormItem
                                                      key={tag}
                                                      className="flex flex-row items-center space-x-2 space-y-0"
                                                    >
                                                      <FormControl>
                                                        <Checkbox
                                                          checked={field.value?.includes(tag)}
                                                          onCheckedChange={(checked) => {
                                                            return checked
                                                              ? field.onChange([...field.value, tag])
                                                              : field.onChange(
                                                                  field.value?.filter(
                                                                    (value) => value !== tag
                                                                  )
                                                                )
                                                          }}
                                                        />
                                                      </FormControl>
                                                      <FormLabel className="text-sm font-normal cursor-pointer">
                                                        {tag}
                                                      </FormLabel>
                                                    </FormItem>
                                                  )
                                                }}
                                              />
                                            ))}
                                          </div>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    
                                    <DialogFooter>
                                      <Button type="submit">Save Changes</Button>
                                    </DialogFooter>
                                  </form>
                                </Form>
                              </DialogContent>
                            </Dialog>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                              onClick={() => handleDeleteTourismPlace(place.id)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Admin Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Admin User Management</CardTitle>
              <CardDescription>Manage admin users and view activity logs</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="users">
                <TabsList className="mb-6">
                  <TabsTrigger value="users">Admin Users</TabsTrigger>
                  <TabsTrigger value="logs">Activity Logs</TabsTrigger>
                </TabsList>
                
                <TabsContent value="users">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                    <h3 className="text-xl font-semibold">Admin Users</h3>
                    <div className="mt-3 sm:mt-0">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Admin
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Admin User</DialogTitle>
                            <DialogDescription>
                              Create a new admin user account. Set a strong password.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Form {...adminUserForm}>
                            <form onSubmit={adminUserForm.handleSubmit(handleAddAdminUser)} className="space-y-4 pt-4">
                              <FormField
                                control={adminUserForm.control}
                                name="username"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                      <Input placeholder="staffname" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={adminUserForm.control}
                                name="password"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" placeholder="Strong password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={adminUserForm.control}
                                name="isAdmin"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                      <FormLabel>
                                        Admin Privileges
                                      </FormLabel>
                                      <FormDescription>
                                        Grant full administrative access
                                      </FormDescription>
                                    </div>
                                  </FormItem>
                                )}
                              />
                              
                              <DialogFooter>
                                <Button type="submit">Create User</Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  
                  {loadingUsers ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Username</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Last Login</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminUsers.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>{user.isAdmin ? "Admin" : "Staff"}</TableCell>
                              <TableCell>{user.lastLogin ? formatDate(user.lastLogin) : "Never"}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                    disabled={user.username === 'admin'} // Prevent editing default admin
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="logs">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold">Activity Logs</h3>
                    <p className="text-muted-foreground mt-2">
                      System records of admin activity and changes
                    </p>
                  </div>
                  
                  {loadingLogs ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Admin</TableHead>
                            <TableHead>Action</TableHead>
                            <TableHead>Details</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {activityLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>{formatDate(log.timestamp)}</TableCell>
                              <TableCell>
                                {log.userId 
                                  ? adminUsers.find(u => u.id === log.userId)?.username || 'Unknown' 
                                  : 'System'
                                }
                              </TableCell>
                              <TableCell>{log.action}</TableCell>
                              <TableCell>{log.details || '-'}</TableCell>
                            </TableRow>
                          ))}
                          {activityLogs.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                No activity logs found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices & Settlements</CardTitle>
              <CardDescription>Track room-wise billing and restaurant payments</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="room">
                <TabsList className="mb-6">
                  <TabsTrigger value="room">Room-wise Bills</TabsTrigger>
                  <TabsTrigger value="restaurant">Restaurant Payments</TabsTrigger>
                </TabsList>
                
                <TabsContent value="room">
                  <div className="mb-4">
                    <Input 
                      type="text" 
                      placeholder="Search by room number" 
                      className="max-w-md"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  {loadingOrders ? (
                    <div className="flex justify-center items-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Room #</TableHead>
                            <TableHead>Guest Name</TableHead>
                            <TableHead>Orders</TableHead>
                            <TableHead>Total Amount</TableHead>
                            <TableHead>Settlement Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Group orders by room number */}
                          {Object.entries(orders.reduce((acc, order) => {
                            const key = order.roomNumber;
                            
                            if (!acc[key]) {
                              acc[key] = {
                                room: key,
                                name: order.name || "",
                                orders: [],
                                totalAmount: 0,
                                settled: order.settled || false
                              };
                            }
                            
                            acc[key].orders.push(order);
                            acc[key].totalAmount += order.total;
                            
                            // If any order is from this guest, use their name
                            if (order.name) {
                              acc[key].name = order.name;
                            }
                            
                            // If any order is marked as settled, consider the room settled
                            if (order.settled) {
                              acc[key].settled = true;
                            }
                            
                            return acc;
                          }, {} as Record<string, {
                            room: string;
                            name: string;
                            orders: Order[];
                            totalAmount: number;
                            settled: boolean;
                          }>)).map(([room, data]) => (
                            <TableRow key={room}>
                              <TableCell className="font-medium">{room}</TableCell>
                              <TableCell>{data.name || "—"}</TableCell>
                              <TableCell>{data.orders.length}</TableCell>
                              <TableCell>{formatPrice(data.totalAmount)}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={data.settled ? "outline" : "default"}
                                  className={data.settled ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" : ""}
                                >
                                  {data.settled ? "Settled" : "Pending"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Set active tab to display order details for this room
                                      setActiveTab("orders");
                                      // Set search query to filter orders for this room
                                      setSearchQuery(room);
                                      toast({
                                        title: "Room Orders",
                                        description: `Viewing orders for room ${room}`,
                                      });
                                    }}
                                  >
                                    <FileText className="h-4 w-4 mr-1" />
                                    Details
                                  </Button>
                                  
                                  <Button
                                    variant={data.settled ? "ghost" : "default"}
                                    size="sm"
                                    onClick={() => {
                                      // Toggle settlement status for all orders from this room
                                      const newStatus = !data.settled;
                                      
                                      // Update all orders from this room
                                      data.orders.forEach(order => {
                                        updateOrder({ 
                                          id: order.id, 
                                          settled: newStatus 
                                        });
                                      });
                                      
                                      toast({
                                        title: newStatus ? "Marked as Settled" : "Marked as Unsettled",
                                        description: `Room ${room} has been marked as ${newStatus ? "settled" : "unsettled"}`,
                                      });
                                    }}
                                  >
                                    {data.settled ? (
                                      <>
                                        <Ban className="h-4 w-4 mr-1" />
                                        Unsettle
                                      </>
                                    ) : (
                                      <>
                                        <CheckSquare className="h-4 w-4 mr-1" />
                                        Settle
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="restaurant">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-4">Restaurant Payment Tracking</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            {formatPrice(orders.reduce((sum, order) => sum + order.total, 0))}
                          </div>
                          <p className="text-sm text-muted-foreground">Total Food Orders Value</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            {formatPrice(orders.reduce((sum, order) => {
                              // Calculate the purchase price total of all items in all orders
                              let orderPurchaseTotal = 0;
                              order.items?.forEach(item => {
                                const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                                if (menuItem && menuItem.purchasePrice) {
                                  orderPurchaseTotal += menuItem.purchasePrice * item.quantity;
                                }
                              });
                              return sum + orderPurchaseTotal;
                            }, 0))}
                          </div>
                          <p className="text-sm text-muted-foreground">Restaurant Payment Due</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            {formatPrice(
                              orders.reduce((sum, order) => sum + order.total, 0) - 
                              orders.reduce((sum, order) => {
                                let orderPurchaseTotal = 0;
                                order.items?.forEach(item => {
                                  const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                                  if (menuItem && menuItem.purchasePrice) {
                                    orderPurchaseTotal += menuItem.purchasePrice * item.quantity;
                                  }
                                });
                                return sum + orderPurchaseTotal;
                              }, 0)
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">Profit Margin</p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-2xl font-bold">
                            {(() => {
                              const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
                              const totalCost = orders.reduce((sum, order) => {
                                let orderPurchaseTotal = 0;
                                order.items?.forEach(item => {
                                  const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                                  if (menuItem && menuItem.purchasePrice) {
                                    orderPurchaseTotal += menuItem.purchasePrice * item.quantity;
                                  }
                                });
                                return sum + orderPurchaseTotal;
                              }, 0);
                              
                              const profitPercentage = totalSales > 0 
                                ? Math.round(((totalSales - totalCost) / totalSales) * 100) 
                                : 0;
                                
                              return `${profitPercentage}%`;
                            })()}
                          </div>
                          <p className="text-sm text-muted-foreground">Average Profit %</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Orders</TableHead>
                          <TableHead>Sale Amount</TableHead>
                          <TableHead>Cost Price</TableHead>
                          <TableHead>Profit</TableHead>
                          <TableHead>Payment Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {/* Group orders by date */}
                        {Object.entries(orders.reduce((acc, order) => {
                          // Get date portion only from timestamp
                          const date = new Date(order.timestamp).toISOString().split('T')[0];
                          
                          if (!acc[date]) {
                            acc[date] = {
                              date,
                              orders: [],
                              saleAmount: 0,
                              costPrice: 0,
                              paid: order.restaurantPaid || false
                            };
                          }
                          
                          acc[date].orders.push(order);
                          acc[date].saleAmount += order.total;
                          
                          // Calculate purchase cost
                          let orderPurchaseTotal = 0;
                          order.items?.forEach(item => {
                            const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
                            if (menuItem && menuItem.purchasePrice) {
                              orderPurchaseTotal += menuItem.purchasePrice * item.quantity;
                            }
                          });
                          acc[date].costPrice += orderPurchaseTotal;
                          
                          // If any order for this date is marked as paid to restaurant
                          if (order.restaurantPaid) {
                            acc[date].paid = true;
                          }
                          
                          return acc;
                        }, {} as Record<string, {
                          date: string;
                          orders: Order[];
                          saleAmount: number;
                          costPrice: number;
                          paid: boolean;
                        }>)).map(([date, data]) => (
                          <TableRow key={date}>
                            <TableCell>{formatDate(date)}</TableCell>
                            <TableCell>{data.orders.length}</TableCell>
                            <TableCell>{formatPrice(data.saleAmount)}</TableCell>
                            <TableCell>{formatPrice(data.costPrice)}</TableCell>
                            <TableCell>
                              {formatPrice(data.saleAmount - data.costPrice)} (
                              {Math.round(((data.saleAmount - data.costPrice) / data.saleAmount) * 100)}%)
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="outline" 
                                className={data.paid
                                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                                }
                              >
                                {data.paid ? "Paid" : "Unpaid"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant={data.paid ? "ghost" : "default"}
                                size="sm"
                                onClick={() => {
                                  // Toggle restaurant payment status for all orders on this date
                                  const newStatus = !data.paid;
                                  
                                  // Update all orders for this date
                                  data.orders.forEach(order => {
                                    updateOrder({ 
                                      id: order.id, 
                                      restaurantPaid: newStatus 
                                    });
                                  });
                                  
                                  toast({
                                    title: newStatus ? "Marked as Paid" : "Marked as Unpaid",
                                    description: `Restaurant payment for ${formatDate(date)} marked as ${newStatus ? "paid" : "unpaid"}`,
                                  });
                                }}
                              >
                                {data.paid ? (
                                  <FileText className="h-4 w-4 mr-1" />
                                ) : (
                                  <DollarSign className="h-4 w-4 mr-1" />
                                )}
                                {data.paid ? "View Details" : "Mark Paid"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure application behavior</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="qr-autofill">QR Code Room Auto-fill</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Automatically fill room number when scanning QR code
                      </p>
                    </div>
                    <Switch 
                      id="qr-autofill" 
                      checked={qrAutoFill}
                      onCheckedChange={setQrAutoFill}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="order-alert">Order Alert Sound</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Play sound notification for new orders
                      </p>
                    </div>
                    <Switch 
                      id="order-alert" 
                      checked={orderAlertSound}
                      onCheckedChange={setOrderAlertSound}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="whatsapp-alert">WhatsApp Order Alerts</Label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Send WhatsApp notifications for new orders (requires setup)
                      </p>
                    </div>
                    <Switch 
                      id="whatsapp-alert" 
                      checked={whatsappAlerts}
                      onCheckedChange={setWhatsappAlerts}
                    />
                  </div>
                  
                  <Button onClick={saveGeneralSettings}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Admin Account</CardTitle>
                <CardDescription>Manage your admin account settings</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <Form {...passwordChangeForm}>
                  <form onSubmit={passwordChangeForm.handleSubmit(handleChangePassword)} className="space-y-4">
                    <FormField
                      control={passwordChangeForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordChangeForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordChangeForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit">Change Password</Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Smart Add-ons</CardTitle>
                <CardDescription>Additional features for your guest house</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <BellRing className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-center mb-2">Order Notifications</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Real-time alerts when new orders arrive
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full mt-4">Configure</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Order Notification Settings</DialogTitle>
                            <DialogDescription>
                              Configure how you want to be notified when new orders arrive.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="orderAlertSound" 
                                checked={orderAlertSound}
                                onCheckedChange={(checked) => 
                                  setOrderAlertSound(checked === true)
                                }
                              />
                              <label
                                htmlFor="orderAlertSound"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Play sound alert for new orders
                              </label>
                            </div>
                            
                            {orderAlertSound && (
                              <div className="pl-6 flex items-center space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    const audio = new Audio("/notification.mp3");
                                    audio.play().catch(e => console.log("Error playing sound:", e));
                                  }}
                                >
                                  <Play className="h-4 w-4 mr-2" />
                                  Test Sound
                                </Button>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="whatsappAlerts" 
                                checked={whatsappAlerts}
                                onCheckedChange={(checked) => 
                                  setWhatsappAlerts(checked === true)
                                }
                              />
                              <label
                                htmlFor="whatsappAlerts"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Enable WhatsApp notifications (requires APK setup)
                              </label>
                            </div>
                            
                            <Separator className="my-2" />
                            
                            <div>
                              <h4 className="text-sm font-medium mb-1">Android APK Setup Instructions</h4>
                              <p className="text-xs text-gray-500 mb-2">
                                The Android APK allows you to receive notifications on your phone even when browser is closed.
                              </p>
                              <ol className="text-xs text-gray-500 space-y-1 list-decimal pl-4">
                                <li>Download the Rai Guest House Notifications APK</li>
                                <li>Install on your Android device</li>
                                <li>Open the app and scan the connection QR code</li>
                                <li>Allow notifications and keep app running in background</li>
                              </ol>
                              <Button className="mt-3 w-full" disabled>
                                Download APK (Coming Soon)
                              </Button>
                            </div>
                            
                            <Separator className="my-2" />
                            
                            <Button onClick={saveGeneralSettings} className="w-full">
                              Save Notification Settings
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-center mb-2">Events Calendar</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Display local events from Google Calendar
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full mt-4">Setup</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                          <DialogHeader>
                            <DialogTitle>Events Calendar Integration</DialogTitle>
                            <DialogDescription>
                              Connect your Google Calendar to display local events on the guest house website.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div>
                              <Label htmlFor="calendarId">Google Calendar ID</Label>
                              <Input 
                                id="calendarId" 
                                placeholder="e.g. example@gmail.com or calendar ID" 
                                className="mt-1"
                                value={calendarId}
                                onChange={(e) => setCalendarId(e.target.value)}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Find this in your Google Calendar settings under "Calendar Integration"
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Checkbox 
                                id="showEventsCalendar" 
                                checked={showEventsCalendar}
                                onCheckedChange={(checked) => 
                                  setShowEventsCalendar(checked === true)
                                }
                              />
                              <label
                                htmlFor="showEventsCalendar"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                Enable Events Calendar on website
                              </label>
                            </div>
                            
                            <div className="pt-2">
                              <Button 
                                onClick={() => {
                                  if (!calendarId) {
                                    toast({
                                      title: "Error",
                                      description: "Please enter a valid Calendar ID",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  // Save the settings
                                  const settings = {
                                    ...JSON.parse(localStorage.getItem("adminSettings") || "{}"),
                                    calendarId,
                                    showEventsCalendar
                                  };
                                  localStorage.setItem("adminSettings", JSON.stringify(settings));
                                  
                                  // Fetch sample events to display in the preview
                                  fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${import.meta.env.VITE_GOOGLE_API_KEY}&maxResults=5&timeMin=${new Date().toISOString()}`)
                                    .then(res => {
                                      if (!res.ok) throw new Error("Failed to fetch calendar events");
                                      return res.json();
                                    })
                                    .then(data => {
                                      setCalendarEvents(data.items || []);
                                      toast({
                                        title: "Calendar connected",
                                        description: "Events calendar has been connected successfully",
                                      });
                                    })
                                    .catch(err => {
                                      toast({
                                        title: "Connection error",
                                        description: err.message,
                                        variant: "destructive",
                                      });
                                    });
                                }}
                                className="w-full"
                              >
                                Connect Calendar
                              </Button>
                            </div>
                            
                            {calendarEvents.length > 0 && (
                              <div className="mt-4">
                                <h4 className="font-medium mb-2">Upcoming Events Preview</h4>
                                <ul className="space-y-2">
                                  {calendarEvents.map((event, index) => (
                                    <li key={index} className="border p-2 rounded-md">
                                      <p className="font-medium">{event.summary}</p>
                                      <p className="text-xs text-gray-500">
                                        {new Date(event.start?.dateTime || event.start?.date).toLocaleString()}
                                      </p>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-center">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <QrCode className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium text-center mb-2">QR Code Generator</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Generate room-specific QR codes for easy ordering
                      </p>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full mt-4">Generate</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>QR Code Generator</DialogTitle>
                            <DialogDescription>
                              Create QR codes for each room. Guests can scan these to quickly place orders.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <Label htmlFor="roomNumber">Room Number</Label>
                                <Input 
                                  id="roomNumber" 
                                  placeholder="e.g. 101" 
                                  className="mt-1"
                                  value={qrRoomNumber}
                                  onChange={(e) => setQrRoomNumber(e.target.value)}
                                />
                              </div>
                              <Button 
                                onClick={generateQrCode} 
                                disabled={!qrRoomNumber}
                                className="mt-7"
                              >
                                Generate
                              </Button>
                            </div>
                            
                            {qrCodeUrl && (
                              <div className="bg-white p-4 rounded-md flex flex-col items-center">
                                <img 
                                  src={qrCodeUrl} 
                                  alt={`QR Code for Room ${qrRoomNumber}`} 
                                  className="w-48 h-48 mb-4"
                                />
                                <p className="text-center text-sm text-gray-500 mb-2">
                                  Room {qrRoomNumber}
                                </p>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handlePrintQrCode}
                                  >
                                    Print
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleDownloadQrCode}
                                  >
                                    Download
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
