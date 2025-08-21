import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

document.title = 'Admin Panel • Face Attendance'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
) 