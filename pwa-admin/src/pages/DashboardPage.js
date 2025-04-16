import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, Box, Container, Paper, Grid, Card, CardContent, 
  AppBar, Toolbar, IconButton, Button, Drawer, List, ListItem, 
  ListItemIcon, ListItemText, Badge, Divider, Chip, CircularProgress
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  Dashboard as DashboardIcon, 
  Receipt as ReceiptIcon, 
  Notifications as NotificationsIcon, 
  Settings as SettingsIcon, 
  Logout as LogoutIcon, 
  RestaurantMenu as MenuIcon2, 
  History as HistoryIcon 
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useWebSocket } from '../hooks/useWebSocket';
import { useApi } from '../hooks/useApi';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const { playNotificationSound } = useNotification();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [preparingCount, setPreparingCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { get } = useApi();

  // Setup WebSocket connection for real-time updates
  const { isConnected } = useWebSocket({
    onNewOrder: (order) => {
      // Play notification sound
      playNotificationSound();
      
      // Add the new order to the state
      setOrders(prevOrders => [order, ...prevOrders]);
      
      // Update counts
      if (order.status === 'Pending') {
        setPendingCount(count => count + 1);
      }
    },
    onOrderStatusUpdate: (updatedOrder) => {
      // Update the order in the state
      setOrders(prevOrders => prevOrders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      ));
      
      // Update counts based on status changes
      updateCounts(orders.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      ));
    }
  });

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await get('/api/orders');
        setOrders(data);
        updateCounts(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [get]);

  // Update order status counts
  const updateCounts = (ordersData) => {
    let pending = 0;
    let preparing = 0;
    let delivered = 0;

    ordersData.forEach(order => {
      if (order.status === 'Pending') pending++;
      else if (order.status === 'Preparing') preparing++;
      else if (order.status === 'Delivered') delivered++;
    });

    setPendingCount(pending);
    setPreparingCount(preparing);
    setDeliveredCount(delivered);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation handlers
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigate = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  // Get recent orders (last 24 hours)
  const getRecentOrders = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return orders.filter(order => new Date(order.timestamp) > yesterday);
  };

  // Get unsettled orders
  const getUnsettledOrders = () => {
    return orders.filter(order => !order.settled);
  };

  // Get restaurant unpaid orders
  const getRestaurantUnpaidOrders = () => {
    return orders.filter(order => !order.restaurantPaid);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format price
  const formatPrice = (price) => {
    return `₹${price.toFixed(2)}`;
  };

  // Calculate total sales amount
  const calculateTotalSales = () => {
    return orders.reduce((total, order) => total + order.total, 0);
  };

  // Drawer content
  const drawer = (
    <Box sx={{ width: 250 }} role="presentation">
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Rai Guest House</Typography>
        <Typography variant="body2" color="text.secondary">Admin Panel</Typography>
      </Box>
      <Divider />
      <List>
        <ListItem button onClick={() => handleNavigate('/')}>
          <ListItemIcon>
            <DashboardIcon color="primary" />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>
        <ListItem button onClick={() => handleNavigate('/orders')}>
          <ListItemIcon>
            <Badge badgeContent={pendingCount} color="error">
              <ReceiptIcon color="primary" />
            </Badge>
          </ListItemIcon>
          <ListItemText primary="Orders" />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItem button onClick={() => handleNavigate('/settings')}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Dashboard
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Chip 
              color={isConnected ? 'success' : 'error'} 
              size="small" 
              label={isConnected ? 'Online' : 'Offline'}
              sx={{ mr: 2 }}
            />
            <IconButton color="inherit" onClick={() => handleNavigate('/settings')}>
              <SettingsIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Spacer for fixed AppBar */}
      
      {/* Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
      >
        {drawer}
      </Drawer>
      
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="lg">
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {/* Status Cards */}
              <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: '#ffebee', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Pending Orders
                      </Typography>
                      <Typography variant="h3" color="error">
                        {pendingCount}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="error"
                        size="small"
                        onClick={() => handleNavigate('/orders')}
                        sx={{ mt: 2 }}
                      >
                        View Orders
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: '#fff8e1', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Preparing
                      </Typography>
                      <Typography variant="h3" color="warning.dark">
                        {preparingCount}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="warning"
                        size="small"
                        onClick={() => handleNavigate('/orders')}
                        sx={{ mt: 2 }}
                      >
                        View Orders
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Delivered Today
                      </Typography>
                      <Typography variant="h3" color="success.dark">
                        {deliveredCount}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="success"
                        size="small"
                        onClick={() => handleNavigate('/orders')}
                        sx={{ mt: 2 }}
                      >
                        View Orders
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: '#e3f2fd', height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Total Sales
                      </Typography>
                      <Typography variant="h3" color="primary">
                        {formatPrice(calculateTotalSales())}
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="primary"
                        size="small"
                        disabled
                        sx={{ mt: 2 }}
                      >
                        All Time
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              {/* Recent Orders */}
              <Typography variant="h5" sx={{ mb: 2 }}>
                Recent Orders
              </Typography>
              <Paper sx={{ mb: 4, overflowX: 'auto' }}>
                {getRecentOrders().length > 0 ? (
                  <Box sx={{ minWidth: 700 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Order ID</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Customer</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Time</th>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 500 }}>Status</th>
                          <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 500 }}>Amount</th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 500 }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getRecentOrders().slice(0, 5).map((order) => (
                          <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px 16px' }}>#{order.id}</td>
                            <td style={{ padding: '12px 16px' }}>
                              {order.name || 'Guest'}<br />
                              <Typography variant="caption" color="text.secondary">
                                Room: {order.roomNumber}
                              </Typography>
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              {formatDate(order.timestamp)}
                            </td>
                            <td style={{ padding: '12px 16px' }}>
                              <Chip 
                                size="small"
                                label={order.status}
                                color={
                                  order.status === 'Pending' ? 'error' :
                                  order.status === 'Preparing' ? 'warning' :
                                  'success'
                                }
                              />
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <Typography fontWeight="bold">
                                {formatPrice(order.total)}
                              </Typography>
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                              <Button 
                                size="small" 
                                variant="outlined"
                                onClick={() => handleNavigate(`/orders/${order.id}`)}
                              >
                                View
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Box>
                ) : (
                  <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">No recent orders</Typography>
                  </Box>
                )}
              </Paper>
              
              {/* Financial Summary */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    Pending Settlements
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography>
                        Unsettled Orders
                      </Typography>
                      <Typography fontWeight="bold">
                        {getUnsettledOrders().length}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography>
                        Total Amount
                      </Typography>
                      <Typography fontWeight="bold">
                        {formatPrice(getUnsettledOrders().reduce((sum, order) => sum + order.total, 0))}
                      </Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      fullWidth
                      onClick={() => handleNavigate('/orders')}
                    >
                      Manage Settlements
                    </Button>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    Restaurant Payments
                  </Typography>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography>
                        Unpaid Orders
                      </Typography>
                      <Typography fontWeight="bold">
                        {getRestaurantUnpaidOrders().length}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography>
                        Total Amount
                      </Typography>
                      <Typography fontWeight="bold">
                        {formatPrice(getRestaurantUnpaidOrders().reduce((sum, order) => sum + order.total, 0))}
                      </Typography>
                    </Box>
                    <Button 
                      variant="contained" 
                      color="secondary"
                      fullWidth
                      onClick={() => handleNavigate('/orders')}
                    >
                      Manage Restaurant Payments
                    </Button>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </Container>
      </Box>
      
      {/* Footer */}
      <Box sx={{ mt: 'auto', py: 3, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; {new Date().getFullYear()} Rai Guest House Admin Panel
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}