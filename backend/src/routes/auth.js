const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
//const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const pool = require('../db'); // PostgreSQL接続プール
let sgMail;
let transporter;

if( process.env.NODE_ENV == 'production' ) {
	sgMail   = require('@sendgrid/mail');
	sgMail.setApiKey( process.env.SG_API );
} else {
	const nodemailer = require('nodemailer');
	transporter = nodemailer.createTransport({
		host: process.env.MAIL_HOST,
		port: process.env.MAIL_PORT
	});
}


router.post('/request-registration', async (req, res) => {
	const { email } = req.body;

	if (!email) {
		return res.status(400).json({ error: 'メールアドレスが必要です' });
	}

	const token = uuidv4();
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

	try {
		await pool.query(
			'INSERT INTO user_pre_registrations (email, token, expires_at) VALUES ($1, $2, $3)',
			[email, token, expiresAt]
		);

		const link = `${process.env.FRONT_HOST}/register/${token}`;

		if( process.env.NODE_ENV == 'production' ) {
			const response = await sgMail.send({
				from: 'no-reply@example.com',
				to: email,
				subject: '【ChatApp】本登録のご案内',
				text: `以下のリンクからログインIDとパスワードを登録してください。\n\n${link}\n\nこのリンクは24時間以内に登録してください。`,
			});
		} else {
			await transporter.sendMail({
				from: 'no-reply@example.com',
				to: email,
				subject: '【ChatApp】本登録のご案内',
				text: `以下のリンクからログインIDとパスワードを登録してください。\n\n${link}\n\nこのリンクは24時間以内に登録してください。`,
			});
		}
		res.json({ message: '確認メールを送信しました' });
	} catch (error) {
		console.error(error);
		if (error.code === '23505') {
			return res.status(400).json({ error: 'すでに登録されたメールアドレスです' });
		}
		res.status(500).json({ error: '登録処理に失敗しました' });
	}
});

// ログイン処理
router.post('/login', async (req, res) => {
	console.log( "auth/login start" );

	const { loginId, password } = req.body;

	if (!loginId || !password) {
		return res.status(400).json({ error: 'ログインIDとパスワードを入力してください' });
	}

	try {
		const result = await pool.query(
			'SELECT * FROM users WHERE login_id = $1',
			[loginId]
		);

		if (result.rows.length === 0) {
			return res.status(400).json({ error: 'ログインIDまたはパスワードが間違っています' });
		}

		const user = result.rows[0];

		const isMatch = await bcrypt.compare(password, user.password_hash);
		if (!isMatch) {
			return res.status(400).json({ error: 'ログインIDまたはパスワードが間違っています' });
		}

		res.json({ message: 'ログインに成功しました' });
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: 'ログイン処理に失敗しました' });
	}
});

module.exports = router;

