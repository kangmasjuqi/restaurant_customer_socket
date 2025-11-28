# 🍽️ Restaurant Customer Socket

A real-time order management system built with Node.js, Socket.io, Express, and MySQL. Track orders from placement to delivery with live updates across customer, staff/admin dashboards.

![Admin Dashboard](https://github.com/user-attachments/assets/831563ca-1bc2-4ae8-9939-818159591433)

![Customer View](https://github.com/user-attachments/assets/bdfac013-0eca-47a1-9156-09c85ec0e9c9)

## 🎥 Demo

Watch the live demo: [https://www.awesomescreenshot.com/video/46892803?key=a176971ce12450b2bccbff4cd96bfa1d](https://www.awesomescreenshot.com/video/46892803?key=a176971ce12450b2bccbff4cd96bfa1d)

## ✨ Features

- **Real-time Updates**: Instant order status synchronization across all connected clients
- **Multi-role Dashboard**: Separate views for customers, staff/administrators
- **Socket.io Integration**: WebSocket connections for live data streaming
- **REST API**: Traditional HTTP endpoints for CRUD operations
- **MySQL Database**: Persistent data storage with connection pooling
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Visual Feedback**: Animations, notifications, and sound alerts
- **Order Lifecycle**: Track orders from pending → preparing → ready → delivery → delivered

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│   Browser   │ ◄─────► │   Node.js    │ ◄─────► │  MySQL   │
│  (Frontend) │         │   (Backend)  │         │          │
│             │         │              │         │          │
│  Socket.io  │         │  Express +   │         │ Database │
│   Client    │         │  Socket.io   │         │          │
└─────────────┘         └──────────────┘         └──────────┘
```

## 📋 Prerequisites

- **Node.js** v18.16.0 or higher
- **MySQL** 5.7.30 or higher
- **npm** (comes with Node.js)

## 🚀 Quick Start

### 1. Clone or Download the Repository

```bash
git clone https://github.com/kangmasjuqi/restaurant_customer_socket.git
cd restaurant_customer_socket
```

### 2. Setup MySQL Database

```bash
mysql -u root -p
```

Run the SQL commands in file : **db_schema_data.sql**

### 3. Configure Backend

Navigate to backend directory and install dependencies:

```bash
cd backend
npm install
```

Create or edit `.env` file in the `backend` directory:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=
NODE_ENV=development
```

### 4. Start Backend Server

```bash
npm start
```

**Expected output:**
```
========================================
🚀 Order Dashboard Server Started
========================================
📡 REST API:   http://localhost:3000/api
🔌 Socket.io:  http://localhost:3000
💚 Health:     http://localhost:3000/health
========================================
✓ MySQL connected successfully
```

### 5. Start Frontend Server

Open a new terminal:

```bash
cd frontend
php -S localhost:8089
```

Or simply open the HTML files directly in your browser.

## 🌐 Access the Application

- **Customer View**: [http://localhost:8089/](http://localhost:8089/) or open `frontend/index.html`
- **Admin Dashboard**: [http://localhost:8089/admin.html](http://localhost:8089/admin.html)

## 🧪 Testing the Backend

### Health Check
```bash
curl http://localhost:3000/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-28T15:12:25.123Z",
  "database": "connected"
}
```

### Get All Orders
```bash
curl http://localhost:3000/api/orders
```

### Create New Order
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": 999,
    "customer_name": "Test Customer",
    "items": "Test Burger, Fries"
  }'
```

### Update Order Status
```bash
curl -X PUT http://localhost:3000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "preparing"}'
```

### Delete Order
```bash
curl -X DELETE http://localhost:3000/api/orders/1
```

## 📁 Project Structure

```
restaurant_customer_socket/
├── backend/
│   ├── server.js              # Main server file (Express + Socket.io)
│   ├── package.json           # Dependencies and scripts
│   ├── .env                   # Environment configuration
│   ├── .env.example           # Environment configuration sample
│
├── frontend/
│   ├── index.html            # Customer view
│   └── admin.html            # Admin dashboard
│
├── README.md                 # This file
├── db_schema_data.sql       # DB schema & dummy data
└── .gitignore               # Git ignore file
```

## 🔌 API Endpoints

### REST API

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/health` | Server health check | No |
| GET | `/api/orders` | Get all orders | No |
| GET | `/api/orders/:id` | Get single order | No |
| POST | `/api/orders` | Create new order | No |
| PUT | `/api/orders/:id` | Update order status | No |

### Socket.io Events

#### Client → Server

| Event | Data | Description | Role Required |
|-------|------|-------------|---------------|
| `join` | `{userId, role}` | Join room based on role | Any |
| `create-order` | `{customer_id, customer_name, items}` | Create new order | Any |
| `update-order-status` | `{orderId, status}` | Update order status | Staff/Admin |
| `get-all-orders` | - | Get all orders | Staff/Admin |
| `get-my-orders` | `{customerId}` | Get customer orders | Any |

#### Server → Client

| Event | Data | Description | Sent To |
|-------|------|-------------|---------|
| `order-created` | `order` | New order created | Customer + Staff/Admin |
| `order-updated` | `order` | Order status updated | Customer + Staff/Admin |
| `new-order` | `order` | New order notification | Staff/Admin |
| `order-status-changed` | `order` | Status change notification | Staff/Admin |
| `user-connected` | `{userId, role}` | User connected | Staff/Admin |

## 🎯 Order Status Flow

```
pending → preparing → ready → out_for_delivery → delivered
```

| Status | Icon | Description |
|--------|------|-------------|
| `pending` | ⏳ | Order placed, waiting to be prepared |
| `preparing` | 👨‍🍳 | Kitchen is preparing the order |
| `ready` | ✅ | Order is ready for pickup/delivery |
| `out_for_delivery` | 🚚 | Order is on the way |
| `delivered` | 🎉 | Order has been delivered |

## 🛠️ Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Socket.io** - Real-time bidirectional communication
- **MySQL2** - MySQL client with Promise support
- **dotenv** - Environment variable management
- **CORS** - Cross-Origin Resource Sharing

### Frontend
- **HTML5** - Markup
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - WebSocket client library
- **Vanilla JavaScript** - No framework, pure JS

### Database
- **MySQL** - Relational database

## 🔐 Security Considerations

> **Note**: This is a learning/demo project. For production use, implement:

- User authentication (JWT, OAuth, etc.)
- Role-based access control (RBAC)
- Input validation and sanitization
- SQL injection prevention (using prepared statements - already implemented)
- Rate limiting
- HTTPS/WSS encryption
- Environment variable protection
- CSRF protection

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### MySQL Connection Failed

Check your `.env` configuration:
- Verify `DB_USER` and `DB_PASSWORD`
- Ensure MySQL is running: `mysql -u root -p`
- Confirm database exists: `SHOW DATABASES;`

### Socket.io Not Connecting

- Ensure backend server is running on port 3000
- Check browser console for errors (F12)
- Verify CORS settings in `server.js`
- Check firewall settings

### Frontend Not Loading

- Make sure frontend server is running
- Check if port 8089 is available
- Try opening HTML files directly in browser

## 📚 Learning Resources

This project demonstrates:
- **Socket.io Rooms**: `socket.join('room-name')`
- **Event Broadcasting**: `io.to('room').emit('event', data)`
- **Event Acknowledgments**: Callbacks for confirming actions
- **MySQL Connection Pooling**: Efficient database connections
- **REST API Design**: RESTful endpoints
- **Real-time Synchronization**: Multi-client updates

### Recommended Reading
- [Socket.io Documentation](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [MySQL2 Documentation](https://github.com/sidorares/node-mysql2)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🚀 Future Enhancements

- [ ] User authentication system
- [ ] Order history and analytics
- [ ] Real-time location tracking (Google Maps API)
- [ ] Push notifications
- [ ] Email/SMS notifications
- [ ] Payment integration
- [ ] Multiple restaurant support
- [ ] Driver assignment system
- [ ] Rating and review system
- [ ] Order estimation time
- [ ] Advanced filtering and search

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
