import { API_URL, SOCKET_URL } from '@/config';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

console.log( `socket_url-->${SOCKET_URL}` );

// const socket = io('http://localhost:3001');
const socket = io( `${SOCKET_URL}` );

function ChatApp() {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState([]);
  const [friendId, setFriendId] = useState('');
  const [selectedFriend, setSelectedFriend] = useState('');
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loginId, setLoginId] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]); // ★オンラインユーザー一覧
  const [unreadCounts, setUnreadCounts] = useState({}); // ★未読カウント追加！
  const bottomRef = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem('loginId');
    if (!id) navigate('/');
    setLoginId(id);

    socket.emit('user_online', id);

      socket.on('receive_message', (msg) => {
		console.log('receive_message受信' );

        if (msg.sender === id) return;
        if (msg.to === id) {
          setChat((prev) => [...prev, msg]);
          if (msg.sender !== selectedFriend) {
            // ★未読カウントを増やす
            setUnreadCounts((prev) => ({
              ...prev,
              [msg.sender]: (prev[msg.sender] || 0) + 1,
            }));
          }
        }
      });

	socket.on('connect', () => {
	  console.log('🟢 Socket connected:', socket.id);

      socket.on('updateFriends', (data) => {
		console.log('updateFriends受信    :', data );
	    console.log('updateFriends loginID:', id );
        if (data.loginIds.includes(id)) {
	      console.log('fetchFriends / fetchPendingRequests 呼び出し');
          fetchFriends();
          fetchPendingRequests();
        }
      });
    });

    socket.on('update_user_status', (data) => {
      console.log('オンラインユーザー一覧:', data.onlineUsers);
      setOnlineUsers(data.onlineUsers);
    });

    fetchFriends();
    fetchPendingRequests();

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      socket.emit('user_offline', id);
      socket.off('receive_message');
      socket.off('updateFriends');
      socket.off('update_user_status');
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [navigate]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  const handleBeforeUnload = () => {
    const id = localStorage.getItem('loginId');
    socket.emit('user_offline', id);
  };

  const fetchFriends = async () => {
    try {
      const loginId = localStorage.getItem('loginId');
//      const response = await axios.get('http://localhost:3001/friends/list', {
      const response = await axios.get(`${API_URL}/friends/list`, {
        headers: { 'x-login-id': loginId },
      });
      setFriends(response.data.friends);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      const loginId = localStorage.getItem('loginId');
//      const response = await axios.get('http://localhost:3001/friends/pending', {
      const response = await axios.get(`${API_URL}/friends/pending`, {
        headers: { 'x-login-id': loginId },
      });
      setPendingRequests(response.data.pendingRequests);
    } catch (error) {
      console.error(error);
    }
  };

  const sendMessage = async () => {
    if (!selectedFriend) {
      alert('送信先を選んでください！');
      return;
    }

	const now = new Date();

    const messageData = {
      to: selectedFriend,
      sender: loginId,
      message,
	  createdAt: now.toISOString(),
    };
    socket.emit('send_message', messageData);
    setChat((prev) => [...prev, messageData]);

    try {
//      await axios.post('http://localhost:3001/messages', {
      await axios.post(`${API_URL}/messages`, {
        senderLoginId: loginId,
        receiverLoginId: selectedFriend,
        message,
      });
    } catch (error) {
      console.error('メッセージ保存エラー', error);
    }

    setMessage('');
  };

  const handleFriendRequest = async () => {
    try {
      const loginId = localStorage.getItem('loginId');
//      await axios.post('http://localhost:3001/friends/request',
      await axios.post(`${API_URL}/friends/request`, 
        { friendLoginId: friendId },
        { headers: { 'x-login-id': loginId } }
      );
      alert('友達申請を送信しました！');
      setFriendId('');
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.error || '友達申請に失敗しました';
      alert(errorMessage);
    }
  };

  const handleAcceptFriend = async (requesterLoginId) => {
    try {
      const loginId = localStorage.getItem('loginId');
//      await axios.post('http://localhost:3001/friends/accept',
      await axios.post(`${API_URL}/friends/accept`, 
        { requesterLoginId },
        { headers: { 'x-login-id': loginId } }
      );
      alert('友達承認しました！');
      fetchFriends();
      fetchPendingRequests();
    } catch (error) {
      console.error(error);
      alert('友達承認に失敗しました');
    }
  };

  const logout = () => {
    socket.emit('user_offline', loginId);
    localStorage.removeItem('loginId');
    navigate('/');
  };

  const handleFriendSelect = async (friendLoginId) => {
    setSelectedFriend(friendLoginId);

	// ★未読カウントリセット
    setUnreadCounts((prev) => ({
      ...prev,
      [friendLoginId]: 0,
    }));

    try {
//      const response = await axios.get(`http://localhost:3001/messages/${friendLoginId}`, {
      const response = await axios.get(`${API_URL}/messages/${friendLoginId}`, {
        headers: { 'x-login-id': loginId },
      });
      const fetchedMessages = response.data.messages.map(m => ({
        sender: m.sender_login_id,
        to: m.receiver_login_id,
        message: m.message,
		createdAt: m.created_at,
      }));
      setChat(fetchedMessages);
    } catch (error) {
      console.error('メッセージ履歴取得エラー', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* ヘッダー */}
      <div className="flex justify-between items-center bg-gray-100 p-4 shadow">
        <h1 className="text-xl font-bold">Chatテスト</h1>
        <button onClick={logout} className="text-blue-600 hover:underline">ログアウト</button>
      </div>

      {/* メインエリア */}
      <div className="flex flex-1 overflow-hidden">
        {/* サイドバー */}
        <div className="w-1/4 bg-gray-50 p-4 border-r overflow-y-auto">
          <div className="font-bold">自分のログインID: {loginId}</div>

          <div className="mt-4">
            <div className="font-bold">■ 友達申請</div>
            <input
              type="text"
              value={friendId}
              onChange={(e) => setFriendId(e.target.value)}
              className="border p-1 w-full mt-2"
              placeholder="ログインIDを入力"
            />
            <button onClick={handleFriendRequest} className="bg-blue-500 text-white px-4 py-1 mt-2 rounded">友達申請</button>
          </div>

          <div className="mt-6">
            <div className="font-bold">■ 承認待ちリスト</div>
            {pendingRequests.map((f, i) => (
              <div key={i} className="flex items-center mt-2">
                <button
                  onClick={() => handleAcceptFriend(f)}
                  className="bg-green-400 text-white px-3 py-1 rounded w-full"
                >
                  {f}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <div className="font-bold">■ 友達リスト</div>
            {friends.map((f, i) => (
              <div key={i} className="flex items-center mt-2">
                <button
                  onClick={() => handleFriendSelect(f)}
			      className={`${selectedFriend === f ? 'bg-blue-200' : 'bg-gray-300'} px-3 py-1 rounded w-full flex justify-between items-center`}
                >
			  	  <span className="flex items-center">
                    {f}
                    {onlineUsers.includes(f) ? (
                      <span className="text-green-500 ml-2">●</span>
                    ) : (
                      <span className="text-gray-400 ml-2">●</span>
                    )}
			      </span>
			      {/* ★未読数バッジ */}
      				{unreadCounts[f] > 0 && (
        			  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">{unreadCounts[f]}</span>
				    )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* チャットエリア */}
		{/* <div className="flex-1 flex flex-col overflow-hidden"> */}
		<div className="flex flex-col h-[calc(100vh-100px)] w-full overflow-hidden">
	      {/* チャット履歴エリア（スクロールする部分） */}
          <div className="overflow-y-auto p-4 h-[calc(100vh-200px)]">
            {chat.map((c, i) => (
			  <div key={i} className="flex-shrink-0 bg-gray-100 p-2 rounded mb-2">
                <div className="text-xs text-gray-500">{c.createdAt && new Date(c.createdAt).toLocaleString()}</div>
                <strong>{c.sender}:</strong> {c.message}
              </div>
            ))}
		    <div ref={bottomRef} />
          </div>

          {/* メッセージ入力エリア（常に下固定） */}
          <div className="flex items-center border-t bg-white p-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border p-2 flex-1"
              placeholder="メッセージを入力..."
            />
           <button
             onClick={sendMessage}
             className="bg-blue-500 text-white px-6 ml-2 rounded"
           >
             送信
           </button>
          </div>
        </div>
      </div>

      {/* フッター */}
      <div className="bg-gray-100 text-center p-2 text-sm">AI翻訳研修所</div>
    </div>
  );
}

export default ChatApp;

