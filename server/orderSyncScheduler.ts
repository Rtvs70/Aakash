import { syncOrdersToSheet } from "./googleSheetsSync";
import { storage } from "./storage";

let lastSyncStatus: { success: boolean; timestamp: Date; message: string } | null = null;
let newOrderCount = 0;

/**
 * Manually sync orders to Google Sheets
 * @param spreadsheetId The Google Spreadsheet ID
 * @param sheetGid The sheet GID (usually "0" for the first sheet)
 * @returns The sync status object
 */
export async function manualOrderSync(spreadsheetId: string, sheetGid: string) {
  try {
    const orders = await storage.getOrders();
    const result = await syncOrdersToSheet({ orders, spreadsheetId, sheetGid });
    lastSyncStatus = { success: result.success, timestamp: new Date(), message: result.message };
    
    // Save the sync status to storage for persistence
    await storage.setAdminSetting({
      key: "lastOrderSyncStatus",
      value: JSON.stringify(lastSyncStatus)
    });
    
    return lastSyncStatus;
  } catch (error: any) {
    const errorStatus = { 
      success: false, 
      timestamp: new Date(), 
      message: error.message || "An unexpected error occurred during sync" 
    };
    lastSyncStatus = errorStatus;
    
    // Save the error status
    await storage.setAdminSetting({
      key: "lastOrderSyncStatus",
      value: JSON.stringify(errorStatus)
    });
    
    return errorStatus;
  }
}

/**
 * Get the last order sync status
 * @returns The last sync status or null if no sync has been performed
 */
export function getLastOrderSyncStatus() {
  return lastSyncStatus;
}

/**
 * Load the last sync status from storage
 * This should be called on server startup
 */
export async function loadLastSyncStatus() {
  try {
    const savedStatus = await storage.getAdminSetting("lastOrderSyncStatus");
    if (savedStatus && savedStatus.value) {
      lastSyncStatus = JSON.parse(savedStatus.value);
      // Convert the timestamp string back to a Date object
      if (lastSyncStatus && typeof lastSyncStatus.timestamp === 'string') {
        lastSyncStatus.timestamp = new Date(lastSyncStatus.timestamp);
      }
    }
  } catch (error) {
    console.error("Error loading last sync status:", error);
  }
}

/**
 * Increment the order count and sync if threshold is reached
 * This should be called after every new order is created
 * @param spreadsheetId The Google Spreadsheet ID
 * @param sheetGid The sheet GID
 */
export function incrementOrderCountAndMaybeSync(spreadsheetId: string, sheetGid: string) {
  newOrderCount++;
  console.log(`Order count incremented to ${newOrderCount}`);
  
  if (newOrderCount >= 10) {
    console.log("Threshold reached, syncing orders to Google Sheets");
    newOrderCount = 0;
    manualOrderSync(spreadsheetId, sheetGid);
  }
}

/**
 * Schedule nightly order sync at 1:00 AM
 * @param spreadsheetId The Google Spreadsheet ID
 * @param sheetGid The sheet GID
 */
export function scheduleNightlyOrderSync(spreadsheetId: string, sheetGid: string) {
  const now = new Date();
  const next1am = new Date(now);
  next1am.setHours(1, 0, 0, 0);
  if (now > next1am) next1am.setDate(next1am.getDate() + 1);
  const msUntil1am = next1am.getTime() - now.getTime();
  
  console.log(`Scheduled nightly order sync in ${Math.floor(msUntil1am / (1000 * 60 * 60))} hours and ${Math.floor((msUntil1am % (1000 * 60 * 60)) / (1000 * 60))} minutes`);
  
  setTimeout(() => {
    console.log("Running nightly order sync");
    manualOrderSync(spreadsheetId, sheetGid);
    setInterval(() => {
      console.log("Running daily order sync");
      manualOrderSync(spreadsheetId, sheetGid);
    }, 24 * 60 * 60 * 1000);
  }, msUntil1am);
}