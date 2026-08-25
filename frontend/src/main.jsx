import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { HospitalProvider } from './context/HospitalContext.jsx';
import App from './App.jsx';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <HospitalProvider>
          <App />
        </HospitalProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
