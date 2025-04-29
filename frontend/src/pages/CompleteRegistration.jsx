import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/config';

function CompleteRegistration() {
  const { token } = useParams();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
//      const res = await axios.post('http://localhost:3001/auth/complete-registration', {
      const res = await axios.post(`${API_URL}/auth/complete-registration`, {
        token,
        loginId,
        password
      });
      setMessage(res.data.message);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || '登録に失敗しました');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">ログインID・パスワード登録</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-700">ログインID</label>
            <input
              type="text"
              className="border p-2 w-full rounded bg-blue-50 focus:outline-none"
              placeholder="ログインID"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700">パスワード</label>
            <input
              type="password"
              className="border p-2 w-full rounded bg-blue-50 focus:outline-none"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded w-full hover:bg-green-600"
          >
            登録
          </button>
        </form>

        {message && <div className="mt-4 text-center text-blue-600">{message}</div>}

        <div className="mt-6 text-center text-sm text-gray-700">
          <Link to="/" className="text-blue-600 hover:underline">← ログイン画面に戻る</Link>
        </div>
      </div>
    </div>
  )
}

export default CompleteRegistration;

