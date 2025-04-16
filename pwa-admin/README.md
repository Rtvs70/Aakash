# Rai Guest House Admin PWA

This is a Progressive Web App (PWA) for the admin interface of the Rai Guest House Management System. It provides real-time notifications, offline capabilities, and a mobile-friendly interface for managing orders and settings.

## Features

- **Real-time Order Notifications**: Get instant alerts when new orders are placed
- **Customizable Notification Sounds**: Choose from multiple sounds with volume control
- **Offline Support**: Basic functionality without internet connection
- **Background Sync**: Updates and syncs data when the app is in the background
- **Installable**: Add to home screen for app-like experience
- **Responsive Design**: Works on all devices (mobile, tablet, desktop)

## Getting Started

### Running the PWA

1. From the root directory, install dependencies:
   ```
   npm install
   ```

2. Build the PWA:
   ```
   cd pwa-admin
   npm run build
   ```

3. Start the server:
   ```
   cd ..
   npm run dev
   ```

4. Navigate to `http://localhost:5000/admin` in your browser

### Installing as a PWA

1. Open the admin interface in Chrome, Edge, or other modern browser
2. Log in with your admin credentials
3. Look for the installation icon in the browser's address bar or menu
4. Follow the prompts to install the app
5. The app will be added to your home screen or app drawer

## Using the PWA

### Enabling Notifications

1. When first using the app, you'll be prompted to allow notifications
2. Click "Allow" to enable real-time order alerts
3. In Settings, you can customize notification sounds and behavior

### Managing Orders

1. From the Dashboard, view pending, preparing, and delivered orders
2. Click on any order to see details and update status
3. Use the filter options to find specific orders

### Offline Usage

The app will work even when you're offline with some limitations:

- Previously loaded orders and data will be available
- You can update order statuses, which will sync when online
- New orders won't appear until you're back online

### Background Operation

The app can:
- Check for new orders periodically in the background
- Show notifications even when the app is closed
- Sync changes when connectivity is restored

## Troubleshooting

### Notifications Not Working

1. Check browser permissions (Settings > Site Settings > Notifications)
2. Make sure you're using a supported browser (Chrome, Edge, Firefox)
3. Verify sound settings in the app's Settings page
4. On mobile, check that system notifications are enabled

### App Not Installing

1. Make sure you're using a modern browser that supports PWAs
2. Try visiting the site in a regular window (not incognito/private)
3. You must use the app at least once before installing
4. On iOS, use the "Add to Home Screen" option in the share menu

### Offline Issues

1. The app requires an initial connection to set up offline mode
2. Some features will be limited when offline
3. If data appears missing, try refreshing when online

## For Developers

### Code Structure

The PWA follows a standard React.js application structure:

```
pwa-admin/
├── public/             # Static files and service worker
│   ├── service-worker.js  # Service worker code
│   ├── manifest.json   # PWA manifest
│   └── ...
├── src/
│   ├── context/        # React contexts for state management
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   └── ...
└── ...
```

### Key Technologies

- **React**: UI framework
- **Service Worker**: For offline functionality and push notifications
- **WebSockets**: Real-time communication with the server
- **IndexedDB**: Client-side storage for offline data
- **Background Sync API**: For syncing when the app is in the background

### Adding Custom Notification Sounds

1. Add your sound files to the `public/static/media/` directory
2. Update the `AVAILABLE_SOUNDS` array in `src/pages/SoundSettingsPage.js`