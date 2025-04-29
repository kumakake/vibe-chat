const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./db'); // PostgreSQL接続プール

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});

app.use('/auth', require('./routes/auth'));
app.use('/auth/complete-registration', require('./routes/completeRegistration'));

const friendsRouter = require('./routes/friends');
app.use('/friends', friendsRouter);

app.get('/', (req, res) => {
  res.send('API is working');
});

// --- メッセージ保存API ---
app.post('/messages', async (req, res) => {
  const { senderLoginId, receiverLoginId, message } = req.body;
  try {
    await pool.query(
      'INSERT INTO messages (sender_login_id, receiver_login_id, message) VALUES ($1, $2, $3)',
      [senderLoginId, receiverLoginId, message]
    );
    res.status(201).json({ message: 'メッセージ保存成功' });
  } catch (err) {
    console.error('メッセージ保存失敗:', err);
    res.status(500).json({ error: 'メッセージ保存に失敗しました' });
  }
});

// --- メッセージ取得API ---
app.get('/messages/:friendLoginId', async (req, res) => {
  const loginId = req.header('x-login-id');
  const friendLoginId = req.params.friendLoginId;
  try {
    const result = await pool.query(
      `SELECT sender_login_id, receiver_login_id, message, created_at
       FROM messages
       WHERE ((sender_login_id = $1 AND receiver_login_id = $2)
          OR (sender_login_id = $2 AND receiver_login_id = $1))
         AND created_at >= NOW() - INTERVAL '7 days'
       ORDER BY created_at ASC`,
      [loginId, friendLoginId]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    console.error('メッセージ取得失敗:', err);
    res.status(500).json({ error: 'メッセージ取得に失敗しました' });
  }
});

const onlineUsers = new Map(); // socketId -> loginId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // ユーザーがオンラインになったら
  socket.on('user_online', (loginId) => {
    onlineUsers.set(socket.id, loginId);
    console.log(`${loginId} is now online`);
    broadcastUserStatus();
  });

  // ユーザーがオフラインになったら
  socket.on('user_offline', (loginId) => {
    for (const [sid, id] of onlineUsers) {
      if (id === loginId) {
        onlineUsers.delete(sid);
        break;
      }
    }
    console.log(`${loginId} is now offline`);
    broadcastUserStatus();
  });

  socket.on('send_message', (data) => {
    const { to, sender, message } = data;
    console.log(`Message from ${sender} to ${to}: ${message}`);

	io.emit("receive_message", {
	  to,
	  sender,
	  message,
	  createdAt: new Date().toISOString(),
	});
  });

  // ユーザーの状態を全員に通知
  function broadcastUserStatus() {
    const onlineList = Array.from(onlineUsers.values());
    io.emit('update_user_status', { onlineUsers: onlineList });
  }

  // 接続が切れた場合（ブラウザ閉じたときなど）
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    const loginId = onlineUsers.get(socket.id);
    if (loginId) {
      console.log(`${loginId} disconnected`);
      onlineUsers.delete(socket.id);
      broadcastUserStatus();
    }
  });
});

server.listen(3001, () => {
  console.log('Backend server running on port 3001');
});

