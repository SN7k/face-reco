import React, { useState } from 'react'
import { API_ENDPOINTS } from '../config.js'

export default function UploadForm() {
  const [name, setName] = useState('')
  const [file, setFile] = useState(null)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!name || !file) { setMsg('Please provide name and image'); setOk(false); return }
    const fd = new FormData()
    fd.append('name', name)
    fd.append('file', file)
    setMsg('Uploading...')
    setOk(false)
    try {
      const res = await fetch(API_ENDPOINTS.UPLOAD, { method: 'POST', body: fd })
      const ct = res.headers.get('content-type') || ''
      let data = null
      let text = ''
      if (ct.includes('application/json')) {
        data = await res.json()
      } else {
        text = await res.text()
      }
      if (!res.ok) {
        const detail = data?.detail || data?.message || text || `HTTP ${res.status}`
        throw new Error(detail)
      }
      setMsg(`Uploaded. User ID: ${data.user_id}`)
      setOk(true)
    } catch (err) {
      setMsg(String(err))
      setOk(false)
    }
  }

  return (
    <form onSubmit={onSubmit} encType="multipart/form-data" className="row">
      <div className="field">
        <div className="label">Name</div>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field">
        <div className="label">Image</div>
        <input className="file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])} required />
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" type="submit">Upload</button>
        <div className={`status ${ok ? 'ok' : 'err'}`}>{msg}</div>
      </div>
    </form>
  )
} 