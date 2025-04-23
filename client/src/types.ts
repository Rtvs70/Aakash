// Menu Item Types
export interface MenuItem {
  id: number;
  name: string;
  price: number;
  purchasePrice?: number;
  category: string;
  details?: string;
  disabled: boolean;
}

// Tourism Place Types
export interface TourismPlace {
  id: number;
  title: string;
  description: string;
  distance: string;
  tags: string[];
  mapsLink: string;
  photoLinks?: string[];
}

// Order Types
export interface OrderItem {
  id: number;
  menuItemId: number;
  name: string;
  price: number;
  purchasePrice?: number;
  category: string;
  details?: string;
  quantity: number;
}

export interface Order {
  id: number;
  timestamp: string;
  status: string;
  name?: string;
  roomNumber: string;
  mobileNumber: string;
  items: OrderItem[];
  total: number;
  settled: boolean;
  restaurantPaid: boolean;
  settlementAmount?: number;
}

// Admin User Types
export interface AdminUser {
  id: number;
  username: string;
  isAdmin: boolean;
  isSuperAdmin?: boolean;
  lastLogin: string | null;
}

// Activity Log Types
export interface ActivityLog {
  id: number;
  userId: number | null;
  action: string;
  details: string | null;
  timestamp: string;
}