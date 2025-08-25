import React, { useEffect, useRef, useState } from 'react'
import { API_ENDPOINTS } from '../config.js'

export default function CaptureForm() {
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const [facing, setFacing] = useState('environment') // 'user' | 'environment'

  const start = async () => {
    try {
      // Stop existing tracks before switching
      const current = videoRef.current && videoRef.current.srcObject
      if (current && current.getTracks) current.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStreaming(true)
      }
      setMsg('Camera started'); setOk(true)
    } catch (e) {
      setMsg('Failed to start camera: ' + e); setOk(false)
    }
  }

  const switchCamera = async () => {
    setFacing(prev => prev === 'user' ? 'environment' : 'user')
    setMsg('Switching camera...')
    try { await start() } catch {}
  }

  const capture = async () => {
    if (!streaming) { setMsg('Start camera first'); setOk(false); return }
    if (!name) { setMsg('Enter name'); setOk(false); return }
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(async (blob) => {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('file', blob, `${name}.jpg`)
      setMsg('Uploading...'); setOk(false)
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
        setMsg(`Uploaded. User ID: ${data.user_id}`); setOk(true)
      } catch (err) {
        setMsg(String(err)); setOk(false)
      }
    }, 'image/jpeg')
  }

  useEffect(() => () => {
    const v = videoRef.current
    const s = v && v.srcObject
    if (s && s.getTracks) s.getTracks().forEach(t => t.stop())
  }, [])

  return (
    <div className="media">
      <div className="field">
        <div className="label">Name</div>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <video className="video" ref={videoRef} autoPlay playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
      <div className="actions">
        <button className="btn btn-outline" type="button" onClick={start}>Start Camera</button>
        <button className="btn" type="button" onClick={switchCamera}>Switch Camera</button>
        <button className="btn btn-primary" type="button" onClick={capture}>Capture & Upload</button>
      </div>
      <div className={`status ${ok ? 'ok' : 'err'}`}>{msg}</div>
    </div>
  )
} 