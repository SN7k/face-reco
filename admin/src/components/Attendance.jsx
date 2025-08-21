import React, { useEffect, useState } from 'react'
import { API_ENDPOINTS } from '../config.js'

export default function Attendance() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(API_ENDPOINTS.ATTENDANCE)
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'Failed to load attendance')
        setRows(data)
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  if (loading) return <div className="helper">Loading...</div>
  if (error) return <div className="status err">{error}</div>
  if (!rows.length) return <div className="helper">No attendance records yet.</div>

  return (
    <table className="table">
      <thead>
        <tr><th>Time</th><th>User ID</th><th>Name</th></tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{r.timestamp}</td>
            <td>{r.user_id}</td>
            <td>{r.user_name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
} 