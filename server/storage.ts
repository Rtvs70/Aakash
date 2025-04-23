import { 
  User, InsertUser, 
  ActivityLog, InsertActivityLog,
  MenuItem, InsertMenuItem,
  Order, InsertOrder,
  TourismPlace, InsertTourismPlace,
  AdminSetting, InsertAdminSetting
} from "@shared/schema";

export interface RestaurantPaymentHistory {
  id: number;
  timestamp: Date;
  amount: number;
  orderIds: number[];
  invoiceFilename: string;
}

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;

  // Restaurant payment history methods
  addRestaurantPaymentHistory(entry: Omit<RestaurantPaymentHistory, 'id'>): Promise<RestaurantPaymentHistory>;
  getRestaurantPaymentHistory(): Promise<RestaurantPaymentHistory[]>;
  getRestaurantPaymentHistoryById(id: number): Promise<RestaurantPaymentHistory | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastLogin(id: number): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  
  // Activity Log methods
  logActivity(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogs(): Promise<ActivityLog[]>;
  
  // Menu methods
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  
  // Order methods
  getOrders(): Promise<Order[]>;
  getOrdersByRoomOrMobile(query: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: number, updates: { status?: string, settled?: boolean, restaurantPaid?: boolean }): Promise<Order | undefined>;
  
  // Tourism methods
  getTourismPlaces(): Promise<TourismPlace[]>;
  getTourismPlace(id: number): Promise<TourismPlace | undefined>;
  createTourismPlace(place: InsertTourismPlace): Promise<TourismPlace>;
  updateTourismPlace(id: number, place: Partial<InsertTourismPlace>): Promise<TourismPlace | undefined>;
  deleteTourismPlace(id: number): Promise<boolean>;
  
  // Admin settings methods
  getAdminSetting(key: string): Promise<AdminSetting | undefined>;
  setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private activityLogs: Map<number, ActivityLog>;
  private menuItems: Map<number, MenuItem>;
  private orders: Map<number, Order>;
  private tourismPlaces: Map<number, TourismPlace>;
  private adminSettings: Map<string, AdminSetting>;
  private restaurantPaymentHistory: Map<number, RestaurantPaymentHistory>;

  private userCurrentId: number;
  private activityLogCurrentId: number;
  private menuItemCurrentId: number;
  private orderCurrentId: number;
  private tourismPlaceCurrentId: number;
  private adminSettingCurrentId: number;
  private restaurantPaymentHistoryCurrentId: number;

  constructor() {
    this.users = new Map();
    this.activityLogs = new Map();
    this.menuItems = new Map();
    this.orders = new Map();
    this.tourismPlaces = new Map();
    this.adminSettings = new Map();
    this.restaurantPaymentHistory = new Map();
    
    this.userCurrentId = 1;
    this.activityLogCurrentId = 1;
    this.menuItemCurrentId = 1;
    this.orderCurrentId = 1;
    this.tourismPlaceCurrentId = 1;
    this.adminSettingCurrentId = 1;
    this.restaurantPaymentHistoryCurrentId = 1;
    
    // Initialize with some sample data
    this.initializeData();
  }
  
  private initializeData() {
    // Create default admin user
    this.createUser({
      username: "admin",
      password: "superman123", // The password specified in the requirements
      isAdmin: true
    });
    
    // Sample menu items with purchase prices and details
    const menuItems: InsertMenuItem[] = [
      { 
        name: "Paneer Butter Masala", 
        price: 220, 
        purchasePrice: 180, 
        category: "Main Course",
        details: "Rich and creamy paneer curry cooked in a tomato-based gravy with butter and spices.",
        disabled: false
      },
      { 
        name: "Dal Tadka", 
        price: 180, 
        purchasePrice: 150, 
        category: "Main Course",
        details: "Yellow lentils tempered with cumin, garlic and spices.",
        disabled: false
      },
      { 
        name: "Jeera Rice", 
        price: 120, 
        purchasePrice: 100, 
        category: "Rice",
        details: "Basmati rice cooked with cumin seeds.",
        disabled: false
      },
      { 
        name: "Butter Naan", 
        price: 40, 
        purchasePrice: 30, 
        category: "Bread",
        details: "Soft leavened bread brushed with butter.",
        disabled: false
      },
      { 
        name: "Veg Biryani", 
        price: 250, 
        purchasePrice: 210, 
        category: "Rice",
        details: "Fragrant basmati rice cooked with mixed vegetables and aromatic spices.",
        disabled: false
      },
      { 
        name: "Masala Chai", 
        price: 30, 
        purchasePrice: 20, 
        category: "Beverages",
        details: "Traditional Indian tea brewed with milk and spices.",
        disabled: false
      },
      { 
        name: "Fresh Lime Soda", 
        price: 60, 
        purchasePrice: 40, 
        category: "Beverages",
        details: "Refreshing drink made with fresh lime juice, water, and soda.",
        disabled: false
      },
      { 
        name: "Gulab Jamun", 
        price: 80, 
        purchasePrice: 60, 
        category: "Dessert",
        details: "Sweet milk solid dumplings soaked in rose-flavored sugar syrup.",
        disabled: false
      },
    ];
    
    menuItems.forEach(item => this.createMenuItem(item));
    
    // Sample tourism places
    const tourismPlaces: InsertTourismPlace[] = [
      { 
        title: "Mahakaleshwar Temple", 
        description: "One of the twelve Jyotirlingas, the most sacred abodes of Lord Shiva.", 
        distance: "4.2 km",
        tags: ["Religious", "Heritage"],
        mapsLink: "https://maps.google.com/?q=Mahakaleshwar+Temple+Ujjain",
        photoLinks: [
          "https://drive.google.com/uc?id=1A1B2C3D4E5F6G7H",
          "https://drive.google.com/uc?id=2B3C4D5E6F7G8H9"
        ]
      },
      { 
        title: "Kal Bhairav Temple", 
        description: "Ancient temple dedicated to Bhairava, a fierce manifestation of Lord Shiva.", 
        distance: "3.5 km",
        tags: ["Religious"],
        mapsLink: "https://maps.google.com/?q=Kal+Bhairav+Temple+Ujjain",
        photoLinks: [
          "https://drive.google.com/uc?id=3C4D5E6F7G8H9I0",
          "https://drive.google.com/uc?id=4D5E6F7G8H9I0J1"
        ]
      },
      { 
        title: "Ram Ghat", 
        description: "One of the most pristine ghats on the Shipra River, perfect for sunrise and sunset views.", 
        distance: "2.8 km",
        tags: ["Religious", "Romantic"],
        mapsLink: "https://maps.google.com/?q=Ram+Ghat+Ujjain",
        photoLinks: [
          "https://drive.google.com/uc?id=5E6F7G8H9I0J1K2",
          "https://drive.google.com/uc?id=6F7G8H9I0J1K2L3"
        ]
      },
    ];
    
    tourismPlaces.forEach(place => this.createTourismPlace(place));
    
    // Admin settings
    const settings: InsertAdminSetting[] = [
      { key: "menuSpreadsheetId", value: "your-google-sheet-id-here" },
      { key: "menuSheetId", value: "0" },
      { key: "ordersSpreadsheetId", value: "your-google-sheet-id-here" },
      { key: "ordersSheetId", value: "0" },
      { key: "tourismSpreadsheetId", value: "your-google-sheet-id-here" },
      { key: "tourismSheetId", value: "0" },
    ];
    
    settings.forEach(setting => this.setAdminSetting(setting));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? true,
      lastLogin: null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserLastLogin(id: number): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, lastLogin: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Activity Log methods
  async logActivity(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogCurrentId++;
    const timestamp = new Date();
    const activityLog: ActivityLog = { 
      ...log, 
      id, 
      timestamp,
      userId: log.userId ?? null,
      details: log.details ?? null
    };
    this.activityLogs.set(id, activityLog);
    return activityLog;
  }
  
  async getActivityLogs(): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by newest first
  }
  
  // Menu methods
  async getMenuItems(): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values());
  }
  
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }
  
  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemCurrentId++;
    // Ensure purchasePrice, details, and disabled are either a value or null, not undefined
    const menuItem: MenuItem = { 
      ...item, 
      id,
      purchasePrice: item.purchasePrice ?? null,
      details: item.details ?? null,
      disabled: item.disabled ?? false
    };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }
  
  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const existingItem = this.menuItems.get(id);
    if (!existingItem) return undefined;
    
    const updatedItem = { ...existingItem, ...item };
    this.menuItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }
  
  // Order methods
  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }
  
  async getOrdersByRoomOrMobile(query: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      order => order.roomNumber === query || order.mobileNumber === query
    );
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.orderCurrentId++;
    const timestamp = new Date();
    const newOrder: Order = { 
      ...order, 
      id, 
      timestamp,
      name: order.name ?? null,
      status: order.status ?? "Pending",
      settled: order.settled ?? false,
      restaurantPaid: order.restaurantPaid ?? false
    };
    this.orders.set(id, newOrder);
    return newOrder;
  }
  
  async updateOrderStatus(id: number, updates: { status?: string, settled?: boolean, restaurantPaid?: boolean }): Promise<Order | undefined> {
    const existingOrder = this.orders.get(id);
    if (!existingOrder) return undefined;
    
    // Allow updating status, settlement status, and restaurant payment status
    const updatedOrder = { 
      ...existingOrder,
      ...(updates.status !== undefined ? { status: updates.status } : {}),
      ...(updates.settled !== undefined ? { settled: updates.settled } : {}),
      ...(updates.restaurantPaid !== undefined ? { restaurantPaid: updates.restaurantPaid } : {})
    };
    
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  // Tourism methods
  async getTourismPlaces(): Promise<TourismPlace[]> {
    return Array.from(this.tourismPlaces.values());
  }
  
  async getTourismPlace(id: number): Promise<TourismPlace | undefined> {
    return this.tourismPlaces.get(id);
  }
  
  async createTourismPlace(place: InsertTourismPlace): Promise<TourismPlace> {
    const id = this.tourismPlaceCurrentId++;
    const tourismPlace: TourismPlace = { 
      ...place, 
      id,
      photoLinks: place.photoLinks || []
    };
    this.tourismPlaces.set(id, tourismPlace);
    return tourismPlace;
  }
  
  async updateTourismPlace(id: number, place: Partial<InsertTourismPlace>): Promise<TourismPlace | undefined> {
    const existingPlace = this.tourismPlaces.get(id);
    if (!existingPlace) return undefined;
    
    const updatedPlace = { ...existingPlace, ...place };
    this.tourismPlaces.set(id, updatedPlace);
    return updatedPlace;
  }
  
  async deleteTourismPlace(id: number): Promise<boolean> {
    return this.tourismPlaces.delete(id);
  }
  
  // Admin settings methods
  async getAdminSetting(key: string): Promise<AdminSetting | undefined> {
    return this.adminSettings.get(key);
  }
  
  async setAdminSetting(setting: InsertAdminSetting): Promise<AdminSetting> {
    const id = this.adminSettingCurrentId++;
    const adminSetting: AdminSetting = { ...setting, id };
    this.adminSettings.set(setting.key, adminSetting);
    return adminSetting;
  }

  // Restaurant payment history methods
  async addRestaurantPaymentHistory(entry: Omit<RestaurantPaymentHistory, 'id'>): Promise<RestaurantPaymentHistory> {
    const id = this.restaurantPaymentHistoryCurrentId++;
    const record: RestaurantPaymentHistory = { ...entry, id };
    this.restaurantPaymentHistory.set(id, record);
    
    // Log the activity
    console.log(`Added restaurant payment history: ${JSON.stringify(record)}`);
    
    return record;
  }

  async getRestaurantPaymentHistory(): Promise<RestaurantPaymentHistory[]> {
    return Array.from(this.restaurantPaymentHistory.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getRestaurantPaymentHistoryById(id: number): Promise<RestaurantPaymentHistory | undefined> {
    return this.restaurantPaymentHistory.get(id);
  }
}

export const storage = new MemStorage();
