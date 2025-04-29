import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '@/config';

function RequestRegistration() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
//      const res = await axios.post('http://localhost:3001/auth/request-registration', { email });
      const res = await axios.post(`${API_URL}/auth/request-registration`, { email });
      setMessage(res.data.message);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || '登録に失敗しました');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">新規仮登録</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-700">メールアドレス</label>
            <input
              type="email"
              className="border p-2 w-full rounded bg-blue-50 focus:outline-none"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded w-full hover:bg-green-600"
          >
            仮登録する
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

export default RequestRegistration;

