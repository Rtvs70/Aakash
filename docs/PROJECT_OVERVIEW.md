# Rai Guest House WebApp – Project Overview

## Vision

The Rai Guest House Management System is designed to:

- Provide a seamless digital experience for guests to order food, explore tourism information, and interact with the guest house services
- Equip administrators with a Progressive Web App (PWA) for real-time order notifications, offline capabilities, and full management control from mobile devices
- Operate across any platform (Windows, Linux, macOS, cloud providers) without reliance on Replit or platform-specific features
- Integrate with Google Sheets for order tracking and historical data

## Architecture

- **Frontend**: React + TypeScript
- **Backend**: Express.js + TypeScript
- **Database**: In-memory by default, with optional PostgreSQL support
- **Admin Interface**: PWA with service worker, notifications, and mobile-first design
- **Communication**: Real-time updates via WebSockets
- **Styling**: Tailwind CSS and Shadcn UI
- **Build Tool**: Vite (portable configuration without Replit plugins)

## Key Features

- Guest ordering system
- Tourism info with photos and maps
- Admin panel with real-time order management
- Mobile-ready, offline-supporting PWA
- Theme customization with light/dark/system appearance
- Error handling with modals and debugging tools
- Google Sheets integration for orders
- Portable setup for deployment on any platform
- WebSocket reconnection handling and stability fixes

## What Was Removed

The system was initially built with Replit-specific dependencies. These have been removed:

- Replit-specific Vite plugins for theming and error handling
- Replit Cartographer (source mapping tool)

## What Was Added or Changed

| Area | Description |
|------|-------------|
| Custom Theme Handler | Fully portable and React-based with system preference detection |
| Error Handler | Modal-based UI for runtime and unhandled promise errors |
| WebSocket Handler | Centralized context, connection backoff, cleanup, and message management |
| `.env` Management | Unified setup for local and production use |
| Deployment | Supports traditional Node hosting, Docker, Render, Railway, and Netlify |
| Database | Optional PostgreSQL support with Drizzle ORM |
| Startup Scripts | Platform-specific scripts for Linux/macOS and Windows |
| Portable Configuration | Script and guide for converting Replit projects to universal setup |

## Files and Documentation

- `README.md`: PWA setup and usage
- `MANUAL.md`: Full system breakdown, file purposes, structure
- `DEPLOYMENT.md`: Detailed hosting options and instructions
- `DOTENV_SETUP.md`: Environment variable guide
- `DATABASE.md`: Data model and PostgreSQL migration
- `THEME_HANDLER.md`: Custom theme system
- `ERROR_HANDLING.md`: Runtime and promise error capture
- `WEBSOCKET_FIXES.txt`: Stability improvements for live updates
- `PORTABLE_SETUP.md`: Make the project work outside of Replit
- `REMOVAL_INSTRUCTIONS.md`: What was removed and what replaced it
- `API.md`: REST API and WebSocket message formats

## Next Steps

1. Complete bug fixes based on updated logic
2. Ensure orders sync properly to Google Sheets
3. Improve image loading from Google Drive for tourism section
4. Finalize AWS deployment based on preferred method (Docker, EC2, etc.)
5. Provide backup and migration documentation for PostgreSQL setup