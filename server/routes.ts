import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertActivityLogSchema,
  insertMenuItemSchema, 
  insertOrderSchema, 
  insertTourismPlaceSchema, 
  insertAdminSettingSchema 
} from "@shared/schema";
import { z } from "zod";

// Middleware to verify admin authentication
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.header('X-User-ID');
  const authHeader = req.header('Authorization');
  
  // Check for userId in header (and allow token-based auth as fallback)
  if (!userId && !authHeader) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  // If user ID provided directly
  if (userId) {
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Add userId to request for use in activity logging
    (req as any).userId = parsedUserId;
    next();
    return;
  }
  
  // Check bearer token if no direct user ID
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const parsedUserId = parseInt(token);
    
    if (isNaN(parsedUserId)) {
      return res.status(400).json({ message: "Invalid authorization token" });
    }
    
    // Add userId to request for use in activity logging
    (req as any).userId = parsedUserId;
    next();
    return;
  }
  
  // If we reach here, authorization was insufficient
  return res.status(401).json({ message: "Invalid authentication credentials" });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for authentication and user management
  app.post("/api/auth/login", async (req, res) => {
    try {
      const loginSchema = z.object({
        username: z.string(),
        password: z.string()
      });
      
      const { username, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Update last login timestamp
      await storage.updateUserLastLogin(user.id);
      
      // Log the login activity
      await storage.logActivity({
        userId: user.id,
        action: "LOGIN",
        details: `User ${username} logged in`
      });
      
      // Return user data (excluding password)
      const { password: _, ...userData } = user;
      res.json({ ...userData });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid login data", errors: error.errors });
      }
      res.status(500).json({ message: "Login failed" });
    }
  });
  
  // API routes for users (admin only)
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Remove passwords from the response
      const sanitizedUsers = users.map(user => {
        const { password, ...userData } = user;
        return userData;
      });
      
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  
  app.post("/api/users", requireAuth, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      
      // Log the activity
      await storage.logActivity({
        userId: (req as any).userId,
        action: "CREATE_USER",
        details: `Created new user: ${userData.username}`
      });
      
      // Remove password from the response
      const { password, ...sanitizedUser } = newUser;
      res.status(201).json(sanitizedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // API routes for activity logs (admin only)
  app.get("/api/activity-logs", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getActivityLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activity logs" });
    }
  });
  // API routes for menu items
  app.get("/api/menu", async (req, res) => {
    const menuItems = await storage.getMenuItems();
    res.json(menuItems);
  });
  
  app.get("/api/menu/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const menuItem = await storage.getMenuItem(id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    res.json(menuItem);
  });
  
  app.post("/api/menu", requireAuth, async (req, res) => {
    try {
      const menuItemData = insertMenuItemSchema.parse(req.body);
      const newMenuItem = await storage.createMenuItem(menuItemData);
      res.status(201).json(newMenuItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid menu item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create menu item" });
    }
  });
  
  app.patch("/api/menu/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    try {
      const menuItemData = insertMenuItemSchema.partial().parse(req.body);
      const updatedMenuItem = await storage.updateMenuItem(id, menuItemData);
      
      if (!updatedMenuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      res.json(updatedMenuItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid menu item data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update menu item" });
    }
  });
  
  app.delete("/api/menu/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const success = await storage.deleteMenuItem(id);
    if (!success) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    
    res.status(204).end();
  });
  
  // API routes for orders
  app.get("/api/orders", async (req, res) => {
    const query = req.query.q as string;
    
    if (query) {
      const orders = await storage.getOrdersByRoomOrMobile(query);
      return res.json(orders);
    }
    
    const orders = await storage.getOrders();
    res.json(orders);
  });
  
  // API route for fetching new orders since a given timestamp (for PWA)
  app.get("/api/orders/new", requireAuth, async (req, res) => {
    try {
      const sinceParam = req.query.since as string;
      
      if (!sinceParam) {
        return res.status(400).json({ message: "Missing 'since' timestamp parameter" });
      }
      
      let sinceDate: Date;
      try {
        sinceDate = new Date(sinceParam);
        if (isNaN(sinceDate.getTime())) {
          throw new Error("Invalid date");
        }
      } catch (err) {
        return res.status(400).json({ message: "Invalid timestamp format" });
      }
      
      // Get all orders and filter by timestamp
      const allOrders = await storage.getOrders();
      const newOrders = allOrders.filter(order => new Date(order.timestamp) > sinceDate);
      
      res.json(newOrders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch new orders" });
    }
  });
  
  app.get("/api/orders/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const order = await storage.getOrder(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.json(order);
  });
  
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const newOrder = await storage.createOrder(orderData);
      res.status(201).json(newOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid order data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });
  
  app.patch("/api/orders/:id/status", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const updateSchema = z.object({
      status: z.string().refine(s => ["Pending", "Preparing", "Delivered"].includes(s), {
        message: "Status must be one of: Pending, Preparing, Delivered"
      }).optional(),
      settled: z.boolean().optional(),
      restaurantPaid: z.boolean().optional()
    }).refine(data => Object.keys(data).length > 0, {
      message: "At least one field (status, settled, or restaurantPaid) must be provided"
    });
    
    try {
      const updates = updateSchema.parse(req.body);
      const updatedOrder = await storage.updateOrderStatus(id, updates);
      
      if (!updatedOrder) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(updatedOrder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid status", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update order status" });
    }
  });
  
  // API routes for tourism places
  app.get("/api/tourism", async (req, res) => {
    const tourismPlaces = await storage.getTourismPlaces();
    res.json(tourismPlaces);
  });
  
  app.get("/api/tourism/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const tourismPlace = await storage.getTourismPlace(id);
    if (!tourismPlace) {
      return res.status(404).json({ message: "Tourism place not found" });
    }
    
    res.json(tourismPlace);
  });
  
  app.post("/api/tourism", requireAuth, async (req, res) => {
    try {
      const tourismPlaceData = insertTourismPlaceSchema.parse(req.body);
      const newTourismPlace = await storage.createTourismPlace(tourismPlaceData);
      res.status(201).json(newTourismPlace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tourism place data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create tourism place" });
    }
  });
  
  app.patch("/api/tourism/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    try {
      const tourismPlaceData = insertTourismPlaceSchema.partial().parse(req.body);
      const updatedTourismPlace = await storage.updateTourismPlace(id, tourismPlaceData);
      
      if (!updatedTourismPlace) {
        return res.status(404).json({ message: "Tourism place not found" });
      }
      
      res.json(updatedTourismPlace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tourism place data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update tourism place" });
    }
  });
  
  // Add a PATCH endpoint for tourism place deletion to make it work with our API
  app.patch("/api/tourism/:id/delete", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const success = await storage.deleteTourismPlace(id);
    if (!success) {
      return res.status(404).json({ message: "Tourism place not found" });
    }
    
    res.status(200).json({ success: true, message: "Tourism place deleted successfully" });
  });

  // Keep the DELETE endpoint for traditional REST clients
  app.delete("/api/tourism/:id", requireAuth, async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID format" });
    }
    
    const success = await storage.deleteTourismPlace(id);
    if (!success) {
      return res.status(404).json({ message: "Tourism place not found" });
    }
    
    res.status(204).end();
  });
  
  // API routes for admin settings
  app.get("/api/settings/:key", async (req, res) => {
    const key = req.params.key;
    const setting = await storage.getAdminSetting(key);
    
    if (!setting) {
      return res.status(404).json({ message: "Setting not found" });
    }
    
    res.json(setting);
  });
  
  app.post("/api/settings", requireAuth, async (req, res) => {
    try {
      const settingData = insertAdminSettingSchema.parse(req.body);
      const newSetting = await storage.setAdminSetting(settingData);
      
      // Log the activity
      if ((req as any).userId) {
        await storage.logActivity({
          userId: (req as any).userId,
          action: "UPDATE_SETTING",
          details: `Updated setting: ${settingData.key}`
        });
      }
      
      res.status(201).json(newSetting);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid setting data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create setting" });
    }
  });
  
  // Create the HTTP server
  const httpServer = createServer(app);
  
  // Set up WebSocket server for real-time notifications
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Add server-side features for more reliable connections
    clientTracking: true,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      // Below options specified per WebSocket spec
      serverNoContextTakeover: true, 
      clientNoContextTakeover: true,
      serverMaxWindowBits: 10,
      concurrencyLimit: 10,
      threshold: 1024 // Only compress messages larger than this
    }
  });
  
  // Store connected clients
  const clients = new Set<WebSocket>();
  
  // Ping function to keep connections alive
  const pingClients = () => {
    wss.clients.forEach((ws) => {
      if ((ws as any).isAlive === false) {
        // Client didn't respond to ping, terminate connection
        console.log('WebSocket client timed out (no pong response)');
        return ws.terminate();
      }
      
      // Mark client as inactive until it responds to the next ping
      (ws as any).isAlive = false;
      
      // Send ping
      try {
        ws.ping();
      } catch (e) {
        // Handle potential error when trying to ping
        console.error('Error sending ping to client:', e);
        ws.terminate();
      }
    });
  };
  
  // Set up interval for ping-pong to keep connections alive
  const pingInterval = setInterval(pingClients, 30000);
  
  // Clean up interval when server is shut down
  wss.on('close', () => {
    clearInterval(pingInterval);
  });
  
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Set up ping-pong mechanism to detect dead connections
    (ws as any).isAlive = true;
    
    // Handle pong messages (response to server pings)
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });
    
    // Add client to the set
    clients.add(ws);
    
    // Send initial message with delay to ensure socket is fully established
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ 
            type: 'connection', 
            message: 'Connected to Rai Guest House WebSocket server' 
          }));
        } catch (e) {
          console.error('Error sending initial message:', e);
        }
      }
    }, 100);
    
    // Handle messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received message:', data);
        
        // Echo back to sender for testing
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(JSON.stringify({ type: 'echo', data }));
          } catch (e) {
            console.error('Error sending echo response:', e);
          }
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      // Try to remove the client from the set
      clients.delete(ws);
    });
    
    // Handle disconnection
    ws.on('close', (code, reason) => {
      console.log(`WebSocket client disconnected with code: ${code}, reason: ${reason || 'No reason provided'}`);
      clients.delete(ws);
    });
  });
  
  // Intercept order creation to send WebSocket notifications
  const originalCreateOrder = storage.createOrder.bind(storage);
  storage.createOrder = async (orderData) => {
    const newOrder = await originalCreateOrder(orderData);
    
    // Broadcast to all connected clients
    const notification = JSON.stringify({
      type: 'new-order',
      order: newOrder
    });
    
    // Create a safe broadcast function
    const broadcast = (message: string) => {
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
          } catch (error) {
            console.error('Error sending message to client:', error);
            // Try to terminate the problematic connection
            try {
              client.terminate();
            } catch (e) {
              // If termination fails, just log it
              console.error('Error terminating client connection:', e);
            }
          }
        }
      });
    };
    
    // Send notification to all connected clients
    broadcast(notification);
    
    return newOrder;
  };
  
  // Intercept order status updates to send WebSocket notifications
  const originalUpdateOrderStatus = storage.updateOrderStatus.bind(storage);
  storage.updateOrderStatus = async (id, updates) => {
    const updatedOrder = await originalUpdateOrderStatus(id, updates);
    
    if (updatedOrder) {
      // Broadcast to all connected clients
      const notification = JSON.stringify({
        type: 'order-status-update',
        order: updatedOrder
      });
      
      // Create a safe broadcast function
      const broadcast = (message: string) => {
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            try {
              client.send(message);
            } catch (error) {
              console.error('Error sending message to client:', error);
              // Try to terminate the problematic connection
              try {
                client.terminate();
              } catch (e) {
                // If termination fails, just log it
                console.error('Error terminating client connection:', e);
              }
            }
          }
        });
      };
      
      // Send notification to all connected clients
      broadcast(notification);
    }
    
    return updatedOrder;
  };
  
  return httpServer;
}
