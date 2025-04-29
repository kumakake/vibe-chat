import './index.css'
import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Link, useParams } from 'react-router-dom'
import Login from './pages/Login'
import RequestRegistration from './pages/RequestRegistration'
import CompleteRegistration from './pages/CompleteRegistration'
import ChatApp from './pages/ChatApp'
import { API_URL } from '@/config';

import { io } from 'socket.io-client'
import axios from 'axios'

//const socket = io('http://localhost:3001') // backend接続
const socket = io( `${API_URL}` );

ReactDOM.createRoot(document.getElementById('root')).render(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<RequestRegistration />} />
        <Route path="/register/:token" element={<CompleteRegistration />} />
        <Route path="/chat" element={<ChatApp />} />
      </Routes>
    </BrowserRouter>
)

