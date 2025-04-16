import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, Container, Typography, Paper, Button, Slider, Switch,
  FormControlLabel, AppBar, Toolbar, IconButton, List, ListItem,
  ListItemText, Divider, Radio, RadioGroup, FormControl, FormLabel
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, VolumeUp } from '@mui/icons-material';
import { useNotification } from '../context/NotificationContext';

// Array of available notification sounds
const AVAILABLE_SOUNDS = [
  { id: 'default', name: 'Default', path: '/static/media/notification.wav' },
  { id: 'alert', name: 'Alert', path: '/static/media/alert.wav' },
  { id: 'bell', name: 'Bell', path: '/static/media/bell.wav' },
  { id: 'chime', name: 'Chime', path: '/static/media/chime.wav' },
  { id: 'ding', name: 'Ding', path: '/static/media/ding.wav' },
  { id: 'loud', name: 'Extra Loud', path: '/static/media/loud.wav' },
];

export default function SoundSettingsPage() {
  const navigate = useNavigate();
  const { 
    soundEnabled, 
    toggleSound, 
    customSound,
    setNotificationSound,
    sendTestNotification,
    checkInterval,
    setOrderCheckInterval
  } = useNotification();
  
  const [selectedSound, setSelectedSound] = useState(
    customSound ? 
      AVAILABLE_SOUNDS.find(s => s.path === customSound)?.id || 'default' : 
      'default'
  );
  
  const [volume, setVolume] = useState(100);
  const [interval, setInterval] = useState(checkInterval);
  const audioRef = useRef(null);

  // Handle sound selection change
  const handleSoundChange = (event) => {
    const soundId = event.target.value;
    setSelectedSound(soundId);
    
    const sound = AVAILABLE_SOUNDS.find(s => s.id === soundId);
    if (sound) {
      setNotificationSound(sound.path);
    }
  };

  // Handle volume change
  const handleVolumeChange = (event, newValue) => {
    setVolume(newValue);
    if (audioRef.current) {
      audioRef.current.volume = newValue / 100;
    }
  };

  // Handle interval change
  const handleIntervalChange = (event, newValue) => {
    setInterval(newValue);
  };

  // Save interval setting
  const saveInterval = () => {
    setOrderCheckInterval(interval);
  };

  // Play selected sound for preview
  const playSound = () => {
    const sound = AVAILABLE_SOUNDS.find(s => s.id === selectedSound);
    if (sound) {
      const audio = new Audio(sound.path);
      audio.volume = volume / 100;
      audioRef.current = audio;
      audio.play().catch(err => {
        console.error('Error playing sound:', err);
      });
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => navigate('/settings')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Notification Sounds
          </Typography>
        </Toolbar>
      </AppBar>
      <Toolbar /> {/* Spacer for fixed AppBar */}
      
      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Container maxWidth="md">
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              Notification Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Customize how you receive notifications for new orders
            </Typography>
            
            <FormControlLabel
              control={
                <Switch 
                  checked={soundEnabled} 
                  onChange={(e) => toggleSound(e.target.checked)}
                  color="primary"
                />
              }
              label="Enable notification sounds"
              sx={{ mb: 3, display: 'block' }}
            />
            
            <FormControl component="fieldset" sx={{ mb: 4, width: '100%' }} disabled={!soundEnabled}>
              <FormLabel component="legend">Select Notification Sound</FormLabel>
              <RadioGroup
                aria-label="notification sound"
                name="notification-sound"
                value={selectedSound}
                onChange={handleSoundChange}
              >
                {AVAILABLE_SOUNDS.map((sound) => (
                  <ListItem 
                    key={sound.id} 
                    dense
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={playSound} 
                        disabled={selectedSound !== sound.id || !soundEnabled}
                      >
                        <VolumeUp />
                      </IconButton>
                    }
                    sx={{ px: 0 }}
                  >
                    <Radio value={sound.id} />
                    <ListItemText primary={sound.name} />
                  </ListItem>
                ))}
              </RadioGroup>
            </FormControl>
            
            <Box sx={{ mb: 4 }}>
              <Typography id="volume-slider" gutterBottom>
                Volume: {volume}%
              </Typography>
              <Slider
                aria-labelledby="volume-slider"
                value={volume}
                onChange={handleVolumeChange}
                disabled={!soundEnabled}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 50, label: '50%' },
                  { value: 100, label: '100%' }
                ]}
              />
            </Box>
            
            <Button 
              variant="contained" 
              onClick={sendTestNotification} 
              sx={{ mb: 4, width: '100%' }}
              disabled={!soundEnabled}
            >
              Test Notification
            </Button>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Background Checking
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Set how often the app should check for new orders when in the background
            </Typography>
            
            <Box sx={{ mb: 4 }}>
              <Typography id="interval-slider" gutterBottom>
                Check interval: {interval} seconds
              </Typography>
              <Slider
                aria-labelledby="interval-slider"
                value={interval}
                onChange={handleIntervalChange}
                min={15}
                max={300}
                step={15}
                marks={[
                  { value: 15, label: '15s' },
                  { value: 60, label: '1m' },
                  { value: 180, label: '3m' },
                  { value: 300, label: '5m' }
                ]}
              />
              <Button 
                variant="outlined" 
                onClick={saveInterval} 
                sx={{ mt: 2 }}
              >
                Save Interval
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Note: More frequent checking uses more battery power. We recommend at least 30 seconds.
            </Typography>
          </Paper>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              About Notifications
            </Typography>
            <Typography variant="body2" paragraph>
              Notifications allow you to be alerted when new orders are received, even when the app is in the background.
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Permission Required" 
                  secondary="Make sure notifications are enabled in your browser or device settings" 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Background Processing" 
                  secondary="The app can check for new orders even when it's not open" 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Custom Sounds" 
                  secondary="Select a sound that will get your attention when working" 
                />
              </ListItem>
            </List>
          </Paper>
        </Container>
      </Box>
      
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