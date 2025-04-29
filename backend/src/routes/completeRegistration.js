const express = require('express');
const router = express.Router();
//const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = require('../db'); // PostgreSQL接続プール

/*
// PostgreSQL接続
const pool = new Pool({
  host: 'postgres',
  user: 'postgres',
  password: 'password',
  database: 'chatapp',
});
*/

// POST /auth/complete-registration
router.post('/', async (req, res) => {
  const { token, loginId, password } = req.body;

  if (!token || !loginId || !password) {
    return res.status(400).json({ error: '全項目が必須です' });
  }

  if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return res.status(400).json({ error: 'パスワードは英大文字小文字数字を含み、12文字以上にしてください' });
  }

  try {
    // トークンから仮登録情報を取得
    const preRes = await pool.query('SELECT * FROM user_pre_registrations WHERE token = $1 AND expires_at > NOW()', [token]);
    if (preRes.rowCount === 0) {
      return res.status(400).json({ error: '無効なトークンか、期限切れです' });
    }

    const { email } = preRes.rows[0];

    // ログインID重複チェック
    const idCheck = await pool.query('SELECT 1 FROM users WHERE login_id = $1', [loginId]);
    if (idCheck.rowCount > 0) {
      return res.status(400).json({ error: 'このログインIDはすでに使用されています' });
    }

    // パスワードをハッシュ化
    const passwordHash = await bcrypt.hash(password, 10);

    // usersテーブルに登録
    await pool.query(
      'INSERT INTO users (email, login_id, password_hash) VALUES ($1, $2, $3)',
      [email, loginId, passwordHash]
    );

    // 仮登録情報は削除
    await pool.query('DELETE FROM user_pre_registrations WHERE token = $1', [token]);

    res.json({ message: '本登録が完了しました！' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '登録処理に失敗しました' });
  }
});

module.exports = router;

