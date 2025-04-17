import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MenuItem, TourismPlace, Order, OrderItem, AdminUser, ActivityLog } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthenticatedApi } from "@/hooks/use-authenticated-api";

// Menu Items API
export function useMenuItems() {
  const { toast } = useToast();
  
  const { 
    data: menuItems = [], 
    isLoading: loading, 
    error 
  } = useQuery<MenuItem[]>({
    queryKey: ['/api/menu']
  });

  const queryClient = useQueryClient();

  const { mutate: addMenuItem } = useMutation({
    mutationFn: async (item: Omit<MenuItem, "id">) => {
      const res = await apiRequest("POST", "/api/menu", item);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu'] });
      toast({
        title: "Menu item added",
        description: "Item has been added to the menu",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to add menu item",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  const { mutate: updateMenuItem } = useMutation({
    mutationFn: async ({ id, ...item }: MenuItem) => {
      const res = await apiRequest("PATCH", `/api/menu/${id}`, item);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu'] });
      toast({
        title: "Menu item updated",
        description: "Changes have been saved",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to update menu item",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  const { mutate: deleteMenuItem } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/menu/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/menu'] });
      toast({
        title: "Menu item deleted",
        description: "Item has been removed from the menu",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to delete menu item",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  return { 
    menuItems, 
    loading, 
    error, 
    addMenuItem, 
    updateMenuItem, 
    deleteMenuItem 
  };
}

// Tourism Places API
export function useTourismPlaces() {
  const { toast } = useToast();
  
  const { 
    data: tourismPlaces = [], 
    isLoading: loading, 
    error 
  } = useQuery<TourismPlace[]>({
    queryKey: ['/api/tourism']
  });

  const queryClient = useQueryClient();

  const { mutate: addTourismPlace } = useMutation({
    mutationFn: async (place: Omit<TourismPlace, "id">) => {
      const res = await apiRequest("POST", "/api/tourism", place);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tourism'] });
      toast({
        title: "Tourism place added",
        description: "Place has been added successfully",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to add tourism place",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  const { mutate: updateTourismPlace } = useMutation({
    mutationFn: async ({ id, ...place }: TourismPlace) => {
      const res = await apiRequest("PATCH", `/api/tourism/${id}`, place);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tourism'] });
      toast({
        title: "Tourism place updated",
        description: "Changes have been saved",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to update tourism place",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  const { mutate: deleteTourismPlace } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tourism/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tourism'] });
      toast({
        title: "Tourism place deleted",
        description: "Place has been removed successfully",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to delete tourism place",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  return { 
    tourismPlaces, 
    loading, 
    error, 
    addTourismPlace, 
    updateTourismPlace, 
    deleteTourismPlace 
  };
}

// Orders API
export function useOrders(filterBy?: string) {
  const { toast } = useToast();
  
  const queryKey = filterBy 
    ? [`/api/orders?q=${encodeURIComponent(filterBy)}`]
    : ['/api/orders'];
  
  const { 
    data: orders = [], 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery<Order[]>({
    queryKey
  });

  const queryClient = useQueryClient();

  const { mutate: placeOrder } = useMutation({
    mutationFn: async (orderData: {
      name: string;
      roomNumber: string;
      mobileNumber: string;
      items: OrderItem[];
      total: number;
    }) => {
      const res = await apiRequest("POST", "/api/orders", orderData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order placed successfully",
        description: `Order #${data.id} has been received`,
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to place order",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Get the authenticated API functions upfront, not inside the mutation function
  const { patch } = useAuthenticatedApi();

  const { mutate: updateOrderStatus } = useMutation({
    mutationFn: async ({ 
      id, 
      status,
      settled,
      restaurantPaid 
    }: { 
      id: number; 
      status?: string;
      settled?: boolean;
      restaurantPaid?: boolean;
    }) => {
      const updates: Record<string, any> = {};
      if (status !== undefined) updates.status = status;
      if (settled !== undefined) updates.settled = settled;
      if (restaurantPaid !== undefined) updates.restaurantPaid = restaurantPaid;
      
      // Use the authenticated API that we got outside the mutation
      return patch(`/api/orders/${id}/status`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order updated",
        description: "The order has been updated successfully",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to update order",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  // Optional timer for auto-refresh of orders in admin panel
  useEffect(() => {
    let intervalId: number;
    
    // If this is the admin view (no filterBy), auto-refresh orders every 30 seconds
    if (!filterBy) {
      intervalId = window.setInterval(() => {
        refetch();
      }, 30000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [filterBy, refetch]);

  return { 
    orders, 
    loading, 
    error, 
    placeOrder, 
    updateOrderStatus,
    refetch 
  };
}

// Admin Settings API
export function useAdminSettings(key: string) {
  const { toast } = useToast();
  
  const { 
    data: setting, 
    isLoading: loading, 
    error 
  } = useQuery<{id: number, key: string, value: string}>({
    queryKey: [`/api/settings/${key}`]
  });

  const queryClient = useQueryClient();

  const { mutate: saveSetting } = useMutation({
    mutationFn: async (value: string) => {
      const res = await apiRequest("POST", "/api/settings", { key, value });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/settings/${key}`] });
      toast({
        title: "Setting saved",
        description: "Your changes have been saved",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to save setting",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  return { 
    setting, 
    loading, 
    error, 
    saveSetting 
  };
}

// Bulk Settings API
export function useBulkSettings() {
  const { toast } = useToast();
  
  const queryClient = useQueryClient();

  const saveMultipleSettings = async (settings: Record<string, string>) => {
    try {
      const promises = Object.entries(settings).map(([key, value]) => 
        apiRequest("POST", "/api/settings", { key, value })
      );
      
      await Promise.all(promises);
      
      // Invalidate all settings
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      
      toast({
        title: "Settings saved",
        description: "All settings have been updated",
      });
      
      return true;
    } catch (err) {
      toast({
        title: "Failed to save settings",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
      
      return false;
    }
  };

  return { saveMultipleSettings };
}

// Admin Users API
export function useAdminUsers() {
  const { toast } = useToast();
  const { post, get } = useAuthenticatedApi();
  
  const { 
    data: users = [], 
    isLoading: loading, 
    error,
    refetch 
  } = useQuery<AdminUser[]>({
    queryKey: ['/api/users']
  });

  const queryClient = useQueryClient();

  const { mutate: addAdminUser } = useMutation({
    mutationFn: async (userData: { username: string; password: string; isAdmin: boolean; }) => {
      return post("/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: "Admin user added",
        description: "New admin user has been created successfully",
      });
    },
    onError: (err) => {
      toast({
        title: "Failed to add user",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  const { mutate: getActivityLogs } = useMutation({
    mutationFn: async () => {
      return get("/api/activity-logs");
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/activity-logs'], data);
    },
    onError: (err) => {
      toast({
        title: "Failed to fetch activity logs",
        description: err instanceof Error ? err.message : "An error occurred",
        variant: "destructive",
      });
    }
  });

  return { 
    users, 
    loading, 
    error, 
    addAdminUser,
    getActivityLogs,
    refetch 
  };
}