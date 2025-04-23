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
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

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

  // API route for marking restaurant orders as paid and generating invoice
  app.post("/api/restaurant-payments", requireAuth, async (req, res) => {
    try {
      // Ensure invoices directory exists
      const invoicesDir = path.join(process.cwd(), "server", "invoices");
      if (!fs.existsSync(invoicesDir)) {
        fs.mkdirSync(invoicesDir, { recursive: true });
      }

      // Get all unpaid restaurant orders
      const allOrders = await storage.getOrders();
      const unpaidOrders = allOrders.filter(order => !order.restaurantPaid);

      if (unpaidOrders.length === 0) {
        return res.status(400).json({ message: "No unpaid restaurant orders found" });
      }

      // Calculate total amount
      let totalAmount = 0;
      const orderIds: number[] = [];

      // Generate PDF invoice
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const invoiceFilename = `restaurant-invoice-${timestamp}.pdf`;
      const invoicePath = path.join(invoicesDir, invoiceFilename);

      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(invoicePath);
      doc.pipe(writeStream);

      // Add invoice header
      doc.fontSize(20).text('Rai Guest House', { align: 'center' });
      doc.fontSize(16).text('Restaurant Payment Invoice', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.fontSize(12).text(`Invoice #: INV-${timestamp}`, { align: 'right' });
      doc.moveDown();

      // Add order details table
      doc.fontSize(14).text('Order Details', { underline: true });
      doc.moveDown();

      // Table headers
      const tableTop = doc.y;
      const tableHeaders = ['Order ID', 'Date', 'Items', 'Amount'];
      const columnWidth = (doc.page.width - 100) / tableHeaders.length;

      // Draw headers
      tableHeaders.forEach((header, i) => {
        doc.fontSize(10).text(header, 50 + (i * columnWidth), tableTop, { width: columnWidth, align: 'left' });
      });

      // Draw a line
      doc.moveTo(50, tableTop + 20).lineTo(doc.page.width - 50, tableTop + 20).stroke();

      // Add order rows
      let tableRow = tableTop + 30;

      for (const order of unpaidOrders) {
        orderIds.push(order.id);

        // Calculate purchase cost for this order
        let orderPurchaseTotal = 0;
        (order.items as Array<{ purchasePrice?: number; quantity: number }> | undefined)?.forEach((item) => {
          orderPurchaseTotal += (item.purchasePrice || 0) * item.quantity;
        });

        totalAmount += orderPurchaseTotal;

        // Format order date
        const orderDate = new Date(order.timestamp).toLocaleDateString();

        // Format items summary
        const itemsSummary = (order.items as Array<{ name: string; quantity: number }> | undefined)?.map(item => `${item.name} x${item.quantity}`).join(', ') || '';

        // Add row to table
        doc.fontSize(9).text(order.id.toString(), 50, tableRow, { width: columnWidth, align: 'left' });
        doc.fontSize(9).text(orderDate, 50 + columnWidth, tableRow, { width: columnWidth, align: 'left' });
        doc.fontSize(9).text(itemsSummary, 50 + (2 * columnWidth), tableRow, { width: columnWidth, align: 'left' });
        doc.fontSize(9).text(`₹${orderPurchaseTotal.toFixed(2)}`, 50 + (3 * columnWidth), tableRow, { width: columnWidth, align: 'left' });

        tableRow += 30;

        // Add a new page if we're near the bottom
        if (tableRow > doc.page.height - 100) {
          doc.addPage();
          tableRow = 50;
        }
      }

      // Draw a line
      doc.moveTo(50, tableRow).lineTo(doc.page.width - 50, tableRow).stroke();

      // Add total
      doc.fontSize(12).text('Total Amount:', 50 + (2 * columnWidth), tableRow + 20, { width: columnWidth, align: 'right' });
      doc.fontSize(12).text(`₹${totalAmount.toFixed(2)}`, 50 + (3 * columnWidth), tableRow + 20, { width: columnWidth, align: 'left' });

      // Add signature section
      doc.moveDown(4);
      doc.fontSize(10).text('Authorized Signature: _______________________', { align: 'right' });

      // Finalize PDF
      doc.end();

      // Wait for the PDF to be fully written
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });

      // Mark all orders as paid
      for (const orderId of orderIds) {
        await storage.updateOrderStatus(orderId, { restaurantPaid: true });
      }

      // Record this transaction in restaurant payment history
      const paymentRecord = await storage.addRestaurantPaymentHistory({
        timestamp: new Date(),
        amount: totalAmount,
        orderIds,
        invoiceFilename
      });

      // Log the activity
      await storage.logActivity({
        userId: (req as any).userId,
        action: "RESTAURANT_PAYMENT",
        details: `Marked ${orderIds.length} orders as paid to restaurant. Total: ₹${totalAmount.toFixed(2)}`
      });

      res.status(200).json({
        success: true,
        message: `${orderIds.length} orders marked as paid to restaurant`,
        paymentRecord,
        invoiceUrl: `/api/invoices/${invoiceFilename}`
      });
    } catch (error) {
      console.error('Error processing restaurant payment:', error);
      res.status(500).json({ message: "Failed to process restaurant payment" });
    }
  });

  // API route to get restaurant payment history
  app.get("/api/restaurant-payments", requireAuth, async (req, res) => {
    try {
      const history = await storage.getRestaurantPaymentHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch restaurant payment history" });
    }
  });

  // API route to get a specific invoice
  app.get("/api/invoices/:filename", requireAuth, async (req, res) => {
    try {
      const filename = req.params.filename;
      const invoicePath = path.join(process.cwd(), "server", "invoices", filename);

      if (!fs.existsSync(invoicePath)) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      fs.createReadStream(invoicePath).pipe(res);
    } catch (error) {
      res.status(500).json({ message: "Failed to retrieve invoice" });
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
  // Load notification interval settings from database or use defaults
  let pendingOrderAlertInterval = 60000; // Default: 1 minute
  let preparingOrderAlertInterval = 300000; // Default: 5 minutes
  
  // Load settings from database
  storage.getAdminSetting("pendingOrderAlertInterval").then(setting => {
    if (setting) {
      pendingOrderAlertInterval = parseInt(setting.value);
    }
  });
  
  storage.getAdminSetting("preparingOrderAlertInterval").then(setting => {
    if (setting) {
      preparingOrderAlertInterval = parseInt(setting.value);
    }
  });
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
