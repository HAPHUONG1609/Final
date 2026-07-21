import React from 'react';
import ReactDOM from 'react-dom/client';
import { installSystemNotifications } from './utils/notification.js';
import App from './App.jsx';          // chỉ import App
import './index.css';            // nếu có styles toàn cục

installSystemNotifications();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
