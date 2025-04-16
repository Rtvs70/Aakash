# API Documentation

This document provides details about the REST API endpoints available in the Rai Guest House Management System.

## Base URL

All API endpoints are relative to your server's base URL. For local development, this is typically:

```
http://localhost:5000
```

## Authentication

Many API endpoints require authentication. To authenticate:

1. Send a POST request to `/api/auth/login` with username and password
2. Use the returned user ID in subsequent requests via the `X-User-ID` header

Example:

```javascript
// Login to get user ID
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'superman123' })
});

const userData = await loginResponse.json();

// Use user ID in subsequent authenticated requests
const response = await fetch('/api/menu', {
  headers: { 'X-User-ID': userData.id.toString() }
});
```

## API Endpoints

### Authentication

#### Login

```
POST /api/auth/login
```

Request body:
```json
{
  "username": "admin",
  "password": "superman123"
}
```

Response:
```json
{
  "id": 1,
  "username": "admin",
  "isAdmin": true,
  "lastLogin": "2023-04-16T10:00:00.000Z"
}
```

### Users

#### Get All Users

```
GET /api/users
```

Headers:
```
X-User-ID: 1
```

Response:
```json
[
  {
    "id": 1,
    "username": "admin",
    "isAdmin": true,
    "lastLogin": "2023-04-16T10:00:00.000Z"
  }
]
```

#### Create User

```
POST /api/users
```

Headers:
```
X-User-ID: 1
Content-Type: application/json
```

Request body:
```json
{
  "username": "staff1",
  "password": "password123",
  "isAdmin": false
}
```

Response:
```json
{
  "id": 2,
  "username": "staff1",
  "isAdmin": false,
  "lastLogin": null
}
```

### Menu Items

#### Get All Menu Items

```
GET /api/menu
```

Response:
```json
[
  {
    "id": 1,
    "name": "Paneer Butter Masala",
    "price": 220,
    "purchasePrice": 150,
    "category": "Dinner",
    "details": "Rich and creamy paneer dish",
    "disabled": false
  }
]
```

#### Get Menu Item by ID

```
GET /api/menu/:id
```

Response:
```json
{
  "id": 1,
  "name": "Paneer Butter Masala",
  "price": 220,
  "purchasePrice": 150,
  "category": "Dinner",
  "details": "Rich and creamy paneer dish",
  "disabled": false
}
```

#### Create Menu Item

```
POST /api/menu
```

Headers:
```
X-User-ID: 1
Content-Type: application/json
```

Request body:
```json
{
  "name": "Vegetable Biryani",
  "price": 180,
  "purchasePrice": 120,
  "category": "Dinner",
  "details": "Flavorful rice dish with mixed vegetables",
  "disabled": false
}
```

Response:
```json
{
  "id": 2,
  "name": "Vegetable Biryani",
  "price": 180,
  "purchasePrice": 120,
  "category": "Dinner",
  "details": "Flavorful rice dish with mixed vegetables",
  "disabled": false
}
```

#### Update Menu Item

```
PATCH /api/menu/:id
```

Headers:
```
X-User-ID: 1
Content-Type: application/json
```

Request body:
```json
{
  "price": 195,
  "details": "Flavorful rice dish with fresh mixed vegetables"
}
```

Response:
```json
{
  "id": 2,
  "name": "Vegetable Biryani",
  "price": 195,
  "purchasePrice": 120,
  "category": "Dinner",
  "details": "Flavorful rice dish with fresh mixed vegetables",
  "disabled": false
}
```

#### Delete Menu Item

```
DELETE /api/menu/:id
```

Headers:
```
X-User-ID: 1
```

Response: 204 No Content

### Orders

#### Get All Orders

```
GET /api/orders
```

Response:
```json
[
  {
    "id": 1,
    "timestamp": "2023-04-16T12:30:00.000Z",
    "status": "Delivered",
    "name": "Guest Name",
    "roomNumber": "101",
    "mobileNumber": "9876543210",
    "items": [
      {
        "id": 1,
        "menuItemId": 1,
        "name": "Paneer Butter Masala",
        "price": 220,
        "category": "Dinner",
        "quantity": 1
      }
    ],
    "total": 220,
    "settled": true,
    "restaurantPaid": true
  }
]
```

#### Search Orders by Room or Mobile Number

```
GET /api/orders?q=101
```

Response: Array of orders matching the query

#### Get Order by ID

```
GET /api/orders/:id
```

Response:
```json
{
  "id": 1,
  "timestamp": "2023-04-16T12:30:00.000Z",
  "status": "Delivered",
  "name": "Guest Name",
  "roomNumber": "101",
  "mobileNumber": "9876543210",
  "items": [
    {
      "id": 1,
      "menuItemId": 1,
      "name": "Paneer Butter Masala",
      "price": 220,
      "category": "Dinner",
      "quantity": 1
    }
  ],
  "total": 220,
  "settled": true,
  "restaurantPaid": true
}
```

#### Create Order

```
POST /api/orders
```

Request body:
```json
{
  "name": "New Guest",
  "roomNumber": "102",
  "mobileNumber": "9876543211",
  "items": [
    {
      "id": 1,
      "menuItemId": 1,
      "name": "Paneer Butter Masala",
      "price": 220,
      "category": "Dinner",
      "quantity": 2
    }
  ],
  "total": 440,
  "status": "Pending",
  "settled": false,
  "restaurantPaid": false
}
```

Response: The created order object

#### Update Order Status

```
PATCH /api/orders/:id/status
```

Headers:
```
X-User-ID: 1
Content-Type: application/json
```

Request body:
```json
{
  "status": "Preparing",
  "settled": false,
  "restaurantPaid": false
}
```

Response: The updated order object

### Tourism Places

#### Get All Tourism Places

```
GET /api/tourism
```

Response:
```json
[
  {
    "id": 1,
    "title": "Mahakaleshwar Temple",
    "description": "One of the 12 Jyotirlingas in India",
    "distance": "3 km",
    "tags": ["Religious", "Historical"],
    "mapsLink": "https://goo.gl/maps/example",
    "photoLinks": ["https://example.com/photo1.jpg"]
  }
]
```

#### Get Tourism Place by ID

```
GET /api/tourism/:id
```

Response:
```json
{
  "id": 1,
  "title": "Mahakaleshwar Temple",
  "description": "One of the 12 Jyotirlingas in India",
  "distance": "3 km",
  "tags": ["Religious", "Historical"],
  "mapsLink": "https://goo.gl/maps/example",
  "photoLinks": ["https://example.com/photo1.jpg"]
}
```

#### Create Tourism Place

```
POST /api/tourism
```

Headers:
```
X-User-ID: 1
Content-Type: application/json
```

Request body:
```json
{
  "title": "Kalideh Palace",
  "description": "Historical palace on the banks of the Shipra River",
  "distance": "5 km",
  "tags": ["Historical"],
  "mapsLink": "https://goo.gl/maps/example2",
  "photoLinks": ["https://example.com/photo2.jpg"]
}
```

Response: The created tourism place object

#### Update Tourism Place

```
PATCH /api/tourism/:id
```

Headers:
```
X-User-ID: 1
Content-Type: application/json
```

Request body:
```json
{
  "description": "Updated description",
  "photoLinks": ["https://example.com/photo2.jpg", "https://example.com/photo3.jpg"]
}
```

Response: The updated tourism place object

#### Delete Tourism Place

```
DELETE /api/tourism/:id
```

Headers:
```
X-User-ID: 1
```

Response: 204 No Content

### Admin Settings

#### Get Setting by Key

```
GET /api/settings/:key
```

Response:
```json
{
  "id": 1,
  "key": "contactInfo",
  "value": "Phone: +1234567890, Email: info@raiguesthouse.com"
}
```

#### Create or Update Setting

```
POST /api/settings
```

Headers:
```
X-User-ID: 1
Content-Type: application/json
```

Request body:
```json
{
  "key": "welcomeMessage",
  "value": "Welcome to Rai Guest House!"
}
```

Response: The created/updated setting object

### Activity Logs

#### Get Activity Logs

```
GET /api/activity-logs
```

Headers:
```
X-User-ID: 1
```

Response:
```json
[
  {
    "id": 1,
    "userId": 1,
    "action": "LOGIN",
    "details": "User admin logged in",
    "timestamp": "2023-04-16T10:00:00.000Z"
  }
]
```

## WebSocket API

The system also provides real-time updates via WebSocket connection.

### Connection

Connect to the WebSocket server at:

```
ws://localhost:5000/ws
```

Or for secure connections:

```
wss://your-domain.com/ws
```

### Message Types

#### Connection Confirmation

When you first connect, you'll receive:

```json
{
  "type": "connection",
  "message": "Connected to Rai Guest House WebSocket server"
}
```

#### New Order Notification

When a new order is placed:

```json
{
  "type": "new-order",
  "order": {
    "id": 3,
    "timestamp": "2023-04-16T14:45:00.000Z",
    "status": "Pending",
    "name": "Another Guest",
    "roomNumber": "103",
    "mobileNumber": "9876543212",
    "items": [...],
    "total": 350,
    "settled": false,
    "restaurantPaid": false
  }
}
```

#### Order Status Update

When an order status is updated:

```json
{
  "type": "order-status-update",
  "order": {
    "id": 3,
    "timestamp": "2023-04-16T14:45:00.000Z",
    "status": "Preparing",
    "name": "Another Guest",
    "roomNumber": "103",
    "mobileNumber": "9876543212",
    "items": [...],
    "total": 350,
    "settled": false,
    "restaurantPaid": false
  }
}
```

## Error Responses

All API endpoints return appropriate HTTP status codes:

- 200: Success
- 201: Resource created
- 204: Success (no content)
- 400: Bad request (invalid input)
- 401: Unauthorized (authentication required)
- 404: Resource not found
- 500: Server error

Error responses include a message and sometimes detailed validation errors:

```json
{
  "message": "Invalid menu item data",
  "errors": [
    {
      "path": ["price"],
      "message": "Expected number, received string"
    }
  ]
}
```

## Rate Limiting

The API does not currently implement rate limiting. Consider adding rate limiting for production deployments.