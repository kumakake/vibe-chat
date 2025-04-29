import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { API_URL } from '@/config';

function Login() {
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
//      const res = await axios.post('http://localhost:3001/auth/login', {
      const res = await axios.post(`${API_URL}/auth/login`, {
        loginId,
        password
      });
      setMessage(res.data.message);
	  localStorage.setItem('loginId', loginId );
      navigate('/chat');
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'ログインに失敗しました');
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">ログイン</h1>

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

          <div className="text-right text-sm text-blue-600">
            <a href="#" className="hover:underline">パスワードを忘れた場合</a>
          </div>

          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
          >
            ログイン
          </button>
        </form>

        {message && <div className="mt-4 text-center text-red-600">{message}</div>}

        <div className="mt-6 text-center text-sm text-gray-700">
          アカウントをお持ちではありませんか？{' '}
          <Link to="/register" className="text-blue-600 hover:underline">新規登録</Link>
        </div>
      </div>
    </div>
  )
}

export default Login;

