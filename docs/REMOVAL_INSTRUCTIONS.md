# Removing Replit Dependencies

This guide details the process of removing Replit-specific dependencies from the Rai Guest House Management System to ensure it can run independently on any platform.

## What Dependencies Were Removed

The following Replit-specific dependencies have been removed:

1. `@replit/vite-plugin-shadcn-theme-json` - Used for theme customization
2. `@replit/vite-plugin-runtime-error-modal` - Used for displaying runtime errors
3. `@replit/vite-plugin-cartographer` - Used for Replit-specific source mapping

## Custom Replacements Created

For each removed dependency, a custom implementation has been created:

### Theme Handling (`@replit/vite-plugin-shadcn-theme-json`)

- Created `client/src/contexts/ThemeContext.tsx`
- Provides identical theme functionality:
  - Light/dark mode toggle
  - Theme color customization
  - Theme persistence
  - System theme detection
  - Border radius control

### Error Handling (`@replit/vite-plugin-runtime-error-modal`)

- Created `client/src/utils/errorHandler.ts`
- Provides similar error handling capabilities:
  - Error capturing and display
  - Stack trace information
  - Error dismissal
  - Page reload option
  - Styling consistent with the original implementation

## Configuration Changes

### Vite Configuration

The Replit-specific Vite configuration has been replaced with a portable version that:

1. Maintains all path aliases (@, @shared, @assets)
2. Keeps the same build output structure
3. Preserves all React-related settings
4. Removes any Replit-specific plugins and features

The portable configuration is available at `vite.config.portable.ts` and can be renamed to `vite.config.ts` when deploying outside Replit.

### Environment Variables

A portable `.env` file template has been created that:

1. Contains all necessary environment variables
2. Uses standard Node.js environment variable naming
3. Is compatible with all platforms
4. Includes clear documentation for each variable

## Startup Scripts

Platform-specific startup scripts have been created:

1. `scripts/start.sh` for Linux/macOS
2. `scripts/start.bat` for Windows

These scripts:
- Check for prerequisites (Node.js)
- Verify and create the .env file if needed
- Install dependencies if necessary
- Start the application in either development or production mode

## How to Use the Portable Version

Run the `scripts/make-portable.js` script to prepare the project for deployment on any platform:

```bash
node scripts/make-portable.js
```

This will:
1. Create the portable Vite configuration
2. Generate the custom theme and error handling utilities
3. Set up the .env file
4. Create the startup scripts

See `docs/PORTABLE_SETUP.md` for detailed instructions on using the portable version.

## Testing Independence

To verify the application works independently:

1. Run the `make-portable.js` script
2. Rename `vite.config.portable.ts` to `vite.config.ts`
3. Start the application using the provided scripts
4. Verify all features work without any Replit-specific functionality

## Implementation Details

### ThemeContext.tsx

The custom theme implementation uses React's Context API to:
- Store theme preferences
- Apply theme settings to the document
- Persist theme choices in localStorage
- Detect and apply system preferences

### errorHandler.ts

The custom error handler:
- Captures runtime errors and unhandled promise rejections
- Creates a visually consistent error modal
- Provides debug information
- Offers error recovery options