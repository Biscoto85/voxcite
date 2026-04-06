import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { AdminQG } from './components/admin/AdminQG';
import './styles/index.css';

// Route /qg to the admin interface, everything else to the app
const isAdmin = window.location.pathname.startsWith('/qg');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdmin ? <AdminQG /> : <App />}
  </StrictMode>,
);
