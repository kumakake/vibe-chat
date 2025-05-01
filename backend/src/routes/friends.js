const express = require('express');
const router = express.Router();
const pool = require('../db'); // PostgreSQL接続プール

// 友達申請エンドポイント
router.post('/request', async (req, res) => {
  console.log( "friend/request start" );

  const { friendLoginId } = req.body;
  const loginId = req.headers['x-login-id']; // 例：仮にヘッダーからログインIDもらう（あとでちゃんと認証つける）

  if (!loginId) {
    return res.status(401).json({ error: '未ログインです' });
  }

  try {
    // 申請相手のユーザーを検索
    const userRes = await pool.query('SELECT id FROM users WHERE login_id = $1', [friendLoginId]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: '相手が存在しません' });
    }

    const friendUserId = userRes.rows[0].id;

    // 自分のユーザー情報を取得
    const myRes = await pool.query('SELECT id FROM users WHERE login_id = $1', [loginId]);
    if (myRes.rows.length === 0) {
      return res.status(401).json({ error: 'ログイン情報が正しくありません' });
    }

    const myUserId = myRes.rows[0].id;

    // すでに申請済みか確認
    const checkRes = await pool.query(
      'SELECT * FROM friends WHERE user_id = $1 AND friend_id = $2',
      [myUserId, friendUserId]
    );
    if (checkRes.rows.length > 0) {
      return res.status(400).json({ error: 'すでに申請済みまたは友達です' });
    }

    // friend_status: 'pending' として登録
    await pool.query(
      'INSERT INTO friends (user_id, friend_id, friend_status) VALUES ($1, $2, $3)',
      [myUserId, friendUserId, 'pending']
    );

	console.log(`友達申請: ${loginId} -> ${friendLoginId}`);
	req.io.emit('updateFriends', {
		loginIds: [friendLoginId, loginId]
	});

    res.json({ message: '友達申請を送信しました' });
  } catch (err) {
  console.log( "friend/request e01" );
    console.error(err);
    res.status(500).json({ error: '申請処理に失敗しました' });
  }
});

// 友達リスト取得
router.get('/list', async (req, res) => {
  console.log( "friend/list start" );

  const loginId = req.headers['x-login-id'];

  if (!loginId) {
    return res.status(401).json({ error: '未ログインです' });
  }

  try {
    // 自分のユーザーID取得
    const myRes = await pool.query('SELECT id FROM users WHERE login_id = $1', [loginId]);
    if (myRes.rows.length === 0) {
      return res.status(401).json({ error: 'ログイン情報が正しくありません' });
    }

    const myUserId = myRes.rows[0].id;

    // 友達リスト（承認済み only）を取得
    const friendsRes = await pool.query(
      `SELECT u.login_id
       FROM friends f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = $1 AND f.friend_status = 'accepted'`,
      [myUserId]
    );

    res.json({ friends: friendsRes.rows.map(r => r.login_id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '友達リスト取得に失敗しました' });
  }
});

// 友達申請承認エンドポイント
router.post('/accept', async (req, res) => {
  console.log( "friend/accept start" );

  const { requesterLoginId } = req.body; // 承認する相手のログインID
  const loginId = req.headers['x-login-id']; // 自分のログインID

  if (!loginId) {
    return res.status(401).json({ error: '未ログインです' });
  }

  try {
    // 自分のユーザーID取得
    const myRes = await pool.query('SELECT id FROM users WHERE login_id = $1', [loginId]);
    if (myRes.rows.length === 0) {
      return res.status(401).json({ error: 'ログイン情報が正しくありません' });
    }
    const myUserId = myRes.rows[0].id;

    // 申請してきた相手のユーザーID取得
    const requesterRes = await pool.query('SELECT id FROM users WHERE login_id = $1', [requesterLoginId]);
    if (requesterRes.rows.length === 0) {
      return res.status(404).json({ error: '申請者が存在しません' });
    }
    const requesterUserId = requesterRes.rows[0].id;

    // トランザクション開始
    await pool.query('BEGIN');

    // 元の申請（user → 自分）を accepted に更新
    const updateRes = await pool.query(
      `UPDATE friends
       SET friend_status = 'accepted'
       WHERE user_id = $1 AND friend_id = $2 AND friend_status = 'pending'`,
      [requesterUserId, myUserId]
    );

    if (updateRes.rowCount === 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: '承認できる申請が見つかりませんでした' });
    }

    // 逆向き（自分 → 相手）も新規登録する
    await pool.query(
      `INSERT INTO friends (user_id, friend_id, friend_status, created_at)
       VALUES ($1, $2, 'accepted', now())
       ON CONFLICT (user_id, friend_id) DO NOTHING`,
      [myUserId, requesterUserId]
    );

    await pool.query('COMMIT');

	console.log(`友達申請: ${requesterLoginId} -> ${loginId}`);
	req.io.emit('updateFriends', { loginIds: [loginId, requesterLoginId] });

    res.json({ message: '友達承認しました！' });
  } catch (err) {
    console.error('友達承認エラー:', err.message);
    await pool.query('ROLLBACK');
    res.status(500).json({ error: '友達承認に失敗しました' });
  }
});

// 承認待ちリスト取得
router.get('/pending', async (req, res) => {
  console.log( "friend/pending start" );

  const loginId = req.headers['x-login-id'];

  if (!loginId) {
    return res.status(401).json({ error: '未ログインです' });
  }

  try {
    // 自分のユーザーIDを取得
    const myRes = await pool.query('SELECT id FROM users WHERE login_id = $1', [loginId]);
    if (myRes.rows.length === 0) {
      return res.status(401).json({ error: 'ログイン情報が正しくありません' });
    }
    const myUserId = myRes.rows[0].id;

	console.log( "login_id-->", loginId );
	console.log( "user_id -->", myUserId );

    // 自分宛にpendingな申請をしてきたユーザーを取得
    const pendingRes = await pool.query(
      `SELECT u.login_id
       FROM friends f
       JOIN users u ON f.user_id = u.id
       WHERE f.friend_id = $1 AND f.friend_status = 'pending'`,
      [myUserId]
    );

    res.json({ pendingRequests: pendingRes.rows.map(r => r.login_id) });
  } catch (err) {
    console.error('承認待ちリスト取得エラー:', err.message);
    res.status(500).json({ error: '承認待ちリスト取得に失敗しました' });
  }
});

module.exports = router;

