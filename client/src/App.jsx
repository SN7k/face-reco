import React, { useEffect, useRef, useState } from 'react'
import { API_ENDPOINTS } from './config.js'

export default function App() {
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [streaming, setStreaming] = useState(false)

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStreaming(true)
      }
      setMsg('Camera started'); setOk(true)
    } catch (e) {
      setMsg('Failed to start camera: ' + e); setOk(false)
    }
  }

  const verify = async () => {
    if (!streaming) { setMsg('Start camera first'); setOk(false); return }
    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(async (blob) => {
      const fd = new FormData()
      fd.append('file', blob, 'verify.jpg')
      setMsg('Verifying...'); setOk(false)
      try {
        const res = await fetch(API_ENDPOINTS.MATCH, { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.detail || 'No match')
        setMsg(`Marked present. User ID: ${data.user_id}`); setOk(true)
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
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="brand-badge" />
          <div className="brand-title">Face Attendance • Verify</div>
        </div>
      </div>
      <div className="card">
        <h3>Verify Your Attendance</h3>
        <p className="helper">Allow camera permissions, then click Verify to submit a snapshot.</p>
        <div className="media">
          <video className="video" ref={videoRef} autoPlay playsInline width={320} height={240} />
          <canvas ref={canvasRef} width={320} height={240} style={{ display: 'none' }} />
          <div className="actions">
            <button className="btn btn-outline" onClick={start} type="button">Start Camera</button>
            <button className="btn btn-primary" onClick={verify} type="button">Capture & Verify</button>
          </div>
          <div className={`status ${ok ? 'ok' : 'err'}`}>{msg}</div>
        </div>
      </div>
    </div>
  )
}
