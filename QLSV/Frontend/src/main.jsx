import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';          // chỉ import App
import './index.css';            // nếu có styles toàn cục

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);