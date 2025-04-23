import { google } from "googleapis";
import { Order } from "@shared/schema";

const API_KEY = process.env.VITE_GOOGLE_API_KEY || "AIzaSyAJZpKzn-qinbXK3iTPo4wzP6AvtnO7AYQ";

export async function syncOrdersToSheet({
  orders,
  spreadsheetId,
  sheetGid
}: {
  orders: Order[];
  spreadsheetId: string;
  sheetGid: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const sheets = google.sheets({ version: "v4", auth: API_KEY });
    const values = [
      [
        "Order ID",
        "Timestamp",
        "Name",
        "Room Number",
        "Mobile Number",
        "Items",
        "Total",
        "Status",
        "Settled"
      ],
      ...orders.map((order) => [
        order.id,
        new Date(order.timestamp).toLocaleString(),
        order.name || "",
        order.roomNumber,
        order.mobileNumber,
        order.items.map((item) => `${item.name} x${item.quantity}`).join(", "),
        order.total,
        order.status,
        order.settled ? "Yes" : "No"
      ])
    ];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A1:I${orders.length + 1}`,
      valueInputOption: "RAW",
      requestBody: { values }
    });
    return { success: true, message: "Orders synced to Google Sheet successfully." };
  } catch (error: any) {
    return { success: false, message: error.message || "Failed to sync orders." };
  }
}