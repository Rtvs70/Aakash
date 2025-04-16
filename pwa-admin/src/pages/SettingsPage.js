import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Paper, List, ListItem, ListItemIcon, ListItemText,
  ListItemSecondaryAction, Switch, AppBar, Toolbar, IconButton, Divider, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Notifications as NotificationsIcon,
  VolumeUp as VolumeUpIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  CloudDownload as CloudDownloadIcon,
  CloudUpload as CloudUploadIcon,
  Sync as SyncIcon,
  DeleteForever as DeleteForeverIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { 
    notificationPermission, 
    requestNotificationPermission,
    soundEnabled,
    toggleSound,
    backgroundSync
  } = useNotification();
  
  const [serverUrl, setServerUrl] = useState('');
  const [showClearDataDialog, setShowClearDataDialog] = useState(false);
  const [showServerUrlDialog, setShowServerUrlDialog] = useState(false);
  const [appVersion, setAppVersion] = useState('1.0.0');
  const [storageUsage, setStorageUsage] = useState(null);

  // Initialize values
  useEffect(() => {
    const storedUrl = localStorage.getItem('serverUrl') || window.location.origin;
    setServerUrl(storedUrl);
    
    // Estimate storage usage
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      navigator.storage.estimate().then(estimate => {
        const usageInMB = Math.round(estimate.usage / (1024 * 1024) * 10) / 10;
        const quotaInMB = Math.round(estimate.quota / (1024 * 1024));
        setStorageUsage({ usage: usageInMB, quota: quotaInMB });
      });
    }
    
    // Check for service worker updates
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready.then(registration => {
        registration.update();
      });
    }
  }, []);

  // Handle notifications permission request
  const handleRequestPermission = async () => {
    await requestNotificationPermission();
  };

  // Handle server URL change
  const handleServerUrlChange = (event) => {
    setServerUrl(event.target.value);
  };

  // Save server URL
  const handleSaveServerUrl = () => {
    localStorage.setItem('serverUrl', serverUrl);
    setShowServerUrlDialog(false);
    window.location.reload(); // Reload to apply changes
  };

  // Clear all app data
  const handleClearData = () => {
    // Clear localStorage
    localStorage.clear();
    
    // Clear IndexedDB
    if (indexedDB && indexedDB.databases) {
      indexedDB.databases().then(databases => {
        databases.forEach(db => {
          indexedDB.deleteDatabase(db.name);
        });
      });
    } else {
      // Fallback for browsers that don't support databases()
      indexedDB.deleteDatabase('rai-admin-db');
    }
    
    // Clear cache if possible
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            return caches.delete(cacheName);
          })
        );
      });
    }
    
    // Log out the user
    logout();
    
    // Reload the page
    window.location.reload();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Spacer for fixed AppBar */}
      
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="md">
          {/* Notification Settings */}
          <Paper sx={{ mb: 3 }}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Notification Permissions" 
                  secondary={
                    notificationPermission === 'granted' ? 'Enabled' :
                    notificationPermission === 'denied' ? 'Blocked (change in browser settings)' :
                    'Not enabled'
                  } 
                />
                <ListItemSecondaryAction>
                  {notificationPermission !== 'granted' && (
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={handleRequestPermission}
                      disabled={notificationPermission === 'denied'}
                    >
                      Enable
                    </Button>
                  )}
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider variant="inset" component="li" />
              
              <ListItem>
                <ListItemIcon>
                  <VolumeUpIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Notification Sounds" 
                  secondary="Customize sound and volume" 
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={soundEnabled}
                    onChange={(e) => toggleSound(e.target.checked)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <ListItem button onClick={() => navigate('/settings/sounds')}>
                <ListItemText 
                  primary="Sound Settings" 
                  secondary="Choose notification sounds" 
                  inset
                />
              </ListItem>
            </List>
          </Paper>
          
          {/* Sync Settings */}
          <Paper sx={{ mb: 3 }}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <SyncIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Background Sync" 
                  secondary={backgroundSync ? 'Enabled' : 'Not available on this device'} 
                />
                <ListItemSecondaryAction>
                  <Switch
                    edge="end"
                    checked={backgroundSync}
                    disabled={!backgroundSync}
                    onChange={() => {}}
                  />
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider variant="inset" component="li" />
              
              <ListItem button onClick={() => setShowServerUrlDialog(true)}>
                <ListItemIcon>
                  <StorageIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Server URL" 
                  secondary={serverUrl || 'Not set'} 
                />
              </ListItem>
              
              <Divider variant="inset" component="li" />
              
              <ListItem button onClick={() => {}}>
                <ListItemIcon>
                  <RefreshIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Check for Updates" 
                  secondary="Currently on version v1.0.0" 
                />
              </ListItem>
            </List>
          </Paper>
          
          {/* Data Management */}
          <Paper sx={{ mb: 3 }}>
            <List>
              <ListItem>
                <ListItemIcon>
                  <CloudDownloadIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="App Storage" 
                  secondary={
                    storageUsage 
                      ? `Using ${storageUsage.usage} MB of ${storageUsage.quota} MB` 
                      : 'Calculating...'
                  } 
                />
              </ListItem>
              
              <Divider variant="inset" component="li" />
              
              <ListItem button onClick={() => setShowClearDataDialog(true)}>
                <ListItemIcon>
                  <DeleteForeverIcon color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Clear All Data" 
                  secondary="Remove all cached data and login information" 
                  primaryTypographyProps={{ color: 'error' }}
                />
              </ListItem>
            </List>
          </Paper>
          
          {/* About */}
          <Paper>
            <List>
              <ListItem>
                <ListItemIcon>
                  <InfoIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="About Rai Admin PWA" 
                  secondary={`Version ${appVersion}`} 
                />
              </ListItem>
              
              <ListItem>
                <ListItemText 
                  inset
                  primary="User Information" 
                  secondary={`Logged in as: ${user?.username || 'Guest'}`} 
                />
              </ListItem>
              
              <ListItem button onClick={() => logout()}>
                <ListItemText 
                  inset
                  primary="Logout" 
                  primaryTypographyProps={{ color: 'error' }}
                />
              </ListItem>
            </List>
          </Paper>
        </Container>
      </Box>
      
      {/* Clear Data Dialog */}
      <Dialog
        open={showClearDataDialog}
        onClose={() => setShowClearDataDialog(false)}
      >
        <DialogTitle>Clear All Data?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will remove all cached data, settings, and log you out.
            You will need to log in again. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowClearDataDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleClearData} color="error">
            Clear All Data
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Server URL Dialog */}
      <Dialog
        open={showServerUrlDialog}
        onClose={() => setShowServerUrlDialog(false)}
      >
        <DialogTitle>Set Server URL</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Enter the URL of the Rai Guest House server.
            Only change this if you know what you're doing.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="serverUrl"
            label="Server URL"
            type="url"
            fullWidth
            variant="outlined"
            value={serverUrl}
            onChange={handleServerUrlChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowServerUrlDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveServerUrl} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Footer */}
      <Box sx={{ mt: 'auto', py: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            &copy; {new Date().getFullYear()} Rai Guest House Admin Panel
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}