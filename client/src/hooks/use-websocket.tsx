import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types';

// Event types
type WebSocketEvent = 
  | { type: 'connection', message: string }
  | { type: 'echo', data: any }
  | { type: 'new-order', order: Order }
  | { type: 'order-status-update', order: Order };

interface UseWebSocketOptions {
  onNewOrder?: (order: Order) => void;
  onOrderStatusUpdate?: (order: Order) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
  showToasts?: boolean;
}

export function useWebSocket({
  onNewOrder,
  onOrderStatusUpdate,
  onConnect,
  onDisconnect,
  autoReconnect = true,
  showToasts = true
}: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketEvent | null>(null);
  const { toast } = useToast();
  
  // Use refs to avoid issues with callback closures
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const isUnmountingRef = useRef<boolean>(false);
  
  // Setup the socket connection
  const connectSocket = useCallback(() => {
    // Don't try to connect if component is unmounting or socket is already connecting/open
    if (isUnmountingRef.current) return;
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || 
                              socketRef.current.readyState === WebSocket.CONNECTING)) return;
    
    try {
      // Determine the correct protocol based on the current URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      console.log('Attempting WebSocket connection to:', wsUrl);
      
      // Clean up any existing socket before creating a new one
      if (socketRef.current) {
        try {
          socketRef.current.onclose = null; // Remove onclose handler to prevent recursive reconnection
          socketRef.current.close();
        } catch (e) {
          // Ignore errors on socket closure
        }
      }
      
      // Create new WebSocket connection
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;
      
      socket.onopen = () => {
        console.log('WebSocket connected successfully');
        setIsConnected(true);
        reconnectAttemptsRef.current = 0; // Reset reconnect attempts on successful connection
        onConnect?.();
        
        if (showToasts && reconnectAttemptsRef.current > 0) {
          toast({
            title: 'Connected to server',
            description: 'You will receive real-time order notifications',
          });
        }
      };
      
      socket.onclose = (event) => {
        console.log(`WebSocket disconnected with code: ${event.code}, reason: ${event.reason}`);
        
        // Only update state and call handlers if the component is still mounted
        if (!isUnmountingRef.current) {
          setIsConnected(false);
          onDisconnect?.();
          
          // Only show toast after multiple disconnections to avoid rapid flashing
          if (showToasts && reconnectAttemptsRef.current > 2) {
            toast({
              title: 'Disconnected from server',
              description: 'You won\'t receive real-time notifications',
              variant: 'destructive',
            });
          }
          
          // Auto reconnect logic with exponential backoff
          if (autoReconnect && !reconnectTimeoutRef.current && !isUnmountingRef.current) {
            reconnectAttemptsRef.current += 1;
            
            // Calculate backoff delay: 1s, 2s, 4s, 8s, 16s, 30s (max)
            const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
            
            console.log(`Scheduling reconnect in ${delay}ms (attempt #${reconnectAttemptsRef.current})`);
            
            reconnectTimeoutRef.current = window.setTimeout(() => {
              reconnectTimeoutRef.current = null;
              if (!isUnmountingRef.current) connectSocket();
            }, delay);
          }
        }
      };
      
      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WebSocketEvent;
          console.log('WebSocket message received:', data);
          setLastMessage(data);
          
          // Check if user is admin - used for all notification types
          const isAdmin = localStorage.getItem('adminLoggedIn') === 'true';
          
          // Handle different message types
          switch (data.type) {
            case 'new-order':
              onNewOrder?.(data.order);
              
              // Only show new order notifications to admins
              if (showToasts && isAdmin) {
                toast({
                  title: 'New Order Received',
                  description: `Order #${data.order.id} from ${data.order.name || 'Guest'} (Room ${data.order.roomNumber})`,
                  variant: 'default',
                });
                
                // Play sound notification if available and enabled
                const adminSettings = JSON.parse(localStorage.getItem('adminSettings') || '{}');
                if (adminSettings.orderAlertSound !== false) {
                  const audio = new Audio('/notification.mp3');
                  audio.play().catch(err => console.log('Error playing notification sound:', err));
                }
              }
              break;
              
            case 'order-status-update':
              onOrderStatusUpdate?.(data.order);
              
              // For order status updates, check if it's their order
              const orderDetails = JSON.parse(localStorage.getItem('orderDetails') || '{}');
              const isMyOrder = orderDetails.roomNumber === data.order.roomNumber ||
                               orderDetails.mobileNumber === data.order.mobileNumber;
                               
              if (showToasts && (isAdmin || isMyOrder)) {
                toast({
                  title: 'Order Status Updated',
                  description: `Order #${data.order.id} status changed to ${data.order.status}`,
                });
              }
              break;
              
            // Add handler for connection message to verify connection is good
            case 'connection':
              console.log('Connection confirmed by server:', data.message);
              break;
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        
        // Only show error toast after multiple failures
        if (showToasts && reconnectAttemptsRef.current > 2) {
          toast({
            title: 'Connection Error',
            description: 'Could not connect to notification service',
            variant: 'destructive',
          });
        }
      };
      
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  }, [onConnect, onDisconnect, onNewOrder, onOrderStatusUpdate, showToasts, toast]);
  
  // Send a message to the server
  const sendMessage = useCallback((data: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);
  
  // Handle visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Page is now visible, check connection status
        if (socketRef.current?.readyState !== WebSocket.OPEN && 
            socketRef.current?.readyState !== WebSocket.CONNECTING) {
          console.log('Page became visible, checking WebSocket connection');
          // Try to reconnect when page becomes visible and connection is not active
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          connectSocket();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [connectSocket]);
  
  // Connect on mount, disconnect on unmount
  useEffect(() => {
    isUnmountingRef.current = false;
    connectSocket();
    
    return () => {
      isUnmountingRef.current = true;
      
      // Clear any reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Close the socket
      if (socketRef.current) {
        // Remove event handlers first to prevent reconnection attempts
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        socketRef.current.onmessage = null;
        socketRef.current.onopen = null;
        
        // Close the socket if it's still open or connecting
        if (socketRef.current.readyState === WebSocket.OPEN || 
            socketRef.current.readyState === WebSocket.CONNECTING) {
          socketRef.current.close();
        }
        
        socketRef.current = null;
      }
    };
  }, [connectSocket]);
  
  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log('Manual reconnect requested');
    
    // Reset reconnect attempts to improve chance of successful connection
    reconnectAttemptsRef.current = 0;
    
    if (socketRef.current) {
      socketRef.current.onclose = null; // Prevent auto-reconnect in onclose handler
      socketRef.current.close();
      socketRef.current = null;
    }
    
    // Clear any existing reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Try to connect immediately
    connectSocket();
  }, [connectSocket]);
  
  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnect
  };
}