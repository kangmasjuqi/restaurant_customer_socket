require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// MySQL Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'socket_restaurant',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection
pool.getConnection()
  .then(conn => {
    console.log('✓ MySQL connected successfully');
    conn.release();
  })
  .catch(err => {
    console.error('✗ MySQL connection failed:', err.message);
  });

// ============================================
// REST API ENDPOINTS
// ============================================

// GET all orders or filter by customer_id
app.get('/api/orders', async (req, res) => {
  try {
    const { customer_id } = req.query;
    
    let query = 'SELECT * FROM orders ORDER BY created_at DESC';
    let params = [];
    
    if (customer_id) {
      query = 'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC';
      params = [customer_id];
    }
    
    const [orders] = await pool.execute(query, params);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET single order by ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    const [orders] = await pool.execute(
      'SELECT * FROM orders WHERE id = ?',
      [req.params.id]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(orders[0]);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST create new order
app.post('/api/orders', async (req, res) => {
  try {
    const { customer_id, customer_name, items } = req.body;
    
    if (!customer_id || !customer_name || !items) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO orders (customer_id, customer_name, items, status) VALUES (?, ?, ?, ?)',
      [customer_id, customer_name, items, 'pending']
    );
    
    const [newOrder] = await pool.execute(
      'SELECT * FROM orders WHERE id = ?',
      [result.insertId]
    );
    
    // Emit real-time event
    const order = newOrder[0];
    io.to(`customer-${order.customer_id}`).emit('order-created', order);
    io.to('staff-room').to('admin-room').emit('new-order', order);
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PUT update order status
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    
    const validStatuses = ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    await pool.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );
    
    const [updatedOrder] = await pool.execute(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );
    
    if (updatedOrder.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Emit real-time event
    const order = updatedOrder[0];
    io.to(`customer-${order.customer_id}`).emit('order-updated', order);
    io.to('staff-room').to('admin-room').emit('order-status-changed', order);
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// DELETE order
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const [result] = await pool.execute(
      'DELETE FROM orders WHERE id = ?',
      [req.params.id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    database: 'connected'
  });
});

// ============================================
// SOCKET.IO REAL-TIME EVENTS
// ============================================

const connectedUsers = {
  customers: new Map(),
  staff: new Set(),
  admins: new Set()
};

io.on('connection', (socket) => {
  console.log('✓ Client connected:', socket.id);

  // User joins with role
  socket.on('join', ({ userId, role }) => {
    socket.userId = userId;
    socket.role = role;

    if (role === 'customer') {
      connectedUsers.customers.set(userId, socket.id);
      socket.join(`customer-${userId}`);
    } else if (role === 'staff') {
      connectedUsers.staff.add(socket.id);
      socket.join('staff-room');
    } else if (role === 'admin') {
      connectedUsers.admins.add(socket.id);
      socket.join('admin-room');
    }

    console.log(`✓ User ${userId} joined as ${role}`);
    io.to('staff-room').to('admin-room').emit('user-connected', { userId, role });
  });

  // Create new order (via Socket.io)
  socket.on('create-order', async (orderData, callback) => {
    try {
      const { customer_id, customer_name, items } = orderData;
      
      const [result] = await pool.execute(
        'INSERT INTO orders (customer_id, customer_name, items, status) VALUES (?, ?, ?, ?)',
        [customer_id, customer_name, items, 'pending']
      );
      
      const [newOrder] = await pool.execute(
        'SELECT * FROM orders WHERE id = ?',
        [result.insertId]
      );
      
      const order = newOrder[0];
      
      // Broadcast to relevant users
      io.to(`customer-${order.customer_id}`).emit('order-created', order);
      io.to('staff-room').to('admin-room').emit('new-order', order);

      callback({ success: true, order });
    } catch (error) {
      console.error('Error creating order:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Update order status (via Socket.io)
  socket.on('update-order-status', async ({ orderId, status }, callback) => {
    // Check authorization
    if (socket.role !== 'staff' && socket.role !== 'admin') {
      return callback({ success: false, error: 'Unauthorized' });
    }

    try {
      await pool.execute(
        'UPDATE orders SET status = ? WHERE id = ?',
        [status, orderId]
      );
      
      const [updatedOrder] = await pool.execute(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );
      
      const order = updatedOrder[0];
      
      // Broadcast updates
      io.to(`customer-${order.customer_id}`).emit('order-updated', order);
      io.to('staff-room').to('admin-room').emit('order-status-changed', order);

      callback({ success: true, order });
    } catch (error) {
      console.error('Error updating order:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Get all orders (staff/admin only)
  socket.on('get-all-orders', async (callback) => {
    if (socket.role !== 'staff' && socket.role !== 'admin') {
      return callback({ success: false, error: 'Unauthorized' });
    }

    try {
      const [orders] = await pool.execute(
        'SELECT * FROM orders ORDER BY created_at DESC'
      );
      callback({ success: true, orders });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Get customer orders
  socket.on('get-my-orders', async ({ customerId }, callback) => {
    try {
      const [orders] = await pool.execute(
        'SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC',
        [customerId]
      );
      callback({ success: true, orders });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    console.log('✗ Client disconnected:', socket.id);
    
    if (socket.role === 'customer' && socket.userId) {
      connectedUsers.customers.delete(socket.userId);
    } else if (socket.role === 'staff') {
      connectedUsers.staff.delete(socket.id);
    } else if (socket.role === 'admin') {
      connectedUsers.admins.delete(socket.id);
    }
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log('========================================');
  console.log('🚀 Order Dashboard Server Started');
  console.log('========================================');
  console.log(`📡 REST API:   http://localhost:${PORT}/api`);
  console.log(`🔌 Socket.io:  http://localhost:${PORT}`);
  console.log(`💚 Health:     http://localhost:${PORT}/health`);
  console.log('========================================');
});