import React, { useEffect, useState } from 'react'
import { API_ENDPOINTS } from '../config.js'

export default function Attendance() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
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

  useEffect(() => { load() }, [])

  const deleteRow = async (attendanceId) => {
    setMsg('Deleting...')
    try {
      const res = await fetch(`${API_ENDPOINTS.ATTENDANCE}/${attendanceId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Delete failed')
      setRows(prev => prev.filter(r => r.attendance_id !== attendanceId))
      setMsg('Deleted')
    } catch (e) {
      setMsg(String(e))
    }
  }

  const deleteUserAll = async (userId) => {
    setMsg(`Deleting user ${userId}...`)
    try {
      const res = await fetch(`${API_ENDPOINTS.ATTENDANCE}?user_id=${encodeURIComponent(userId)}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Delete failed')
      setRows(prev => prev.filter(r => r.user_id !== userId))
      setMsg(`Deleted ${data.deleted || 0} records for user ${userId}`)
    } catch (e) {
      setMsg(String(e))
    }
  }

  const deleteAll = async () => {
    if (!confirm('Delete ALL attendance records?')) return
    setMsg('Deleting all...')
    try {
      const res = await fetch(API_ENDPOINTS.ATTENDANCE, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail || 'Delete failed')
      setRows([])
      setMsg(`Deleted ${data.deleted || 0} records`)
    } catch (e) {
      setMsg(String(e))
    }
  }

  if (loading) return <div className="helper">Loading...</div>
  if (error) return <div className="status err">{error}</div>
  if (!rows.length) return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button className="btn" type="button" onClick={load}>Refresh</button>
        <button className="btn btn-outline" type="button" onClick={deleteAll}>Delete All</button>
      </div>
      <div className="helper">No attendance records yet.</div>
      {msg && <div className="status" style={{ marginTop: 8 }}>{msg}</div>}
    </>
  )

  return (
    <>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button className="btn" type="button" onClick={load}>Refresh</button>
        <button className="btn btn-outline" type="button" onClick={deleteAll}>Delete All</button>
        {msg && <div className="status" style={{ marginLeft: 'auto' }}>{msg}</div>}
      </div>
      <table className="table">
        <thead>
          <tr><th>Time</th><th>User ID</th><th>Name</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.timestamp}</td>
              <td>{r.user_id}</td>
              <td>{r.user_name}</td>
              <td style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-outline" type="button" onClick={() => deleteRow(r.attendance_id)}>Del row</button>
                <button className="btn" type="button" onClick={() => deleteUserAll(r.user_id)}>Del user</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
} 