import React, { useEffect, useRef, useState } from 'react'
import { API_ENDPOINTS } from './config.js'

export default function App() {
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [streaming, setStreaming] = useState(false)
  const timerRef = useRef(null)
  const [live, setLive] = useState(false)
  const [facing, setFacing] = useState('user') // 'user' | 'environment'

  const startWithFacing = async (targetFacing) => {
    try {
      const current = videoRef.current && videoRef.current.srcObject
      if (current && current.getTracks) current.getTracks().forEach(t => t.stop())
      let stream = null
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: targetFacing } } })
      } catch (_) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: targetFacing } } })
        } catch (__) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true })
        }
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStreaming(true)
      }
      setFacing(targetFacing)
      setMsg('Camera started'); setOk(true)
    } catch (e) {
      setMsg('Failed to start camera: ' + e); setOk(false)
    }
  }

  const start = async () => startWithFacing(facing)

  const switchCamera = async () => {
    const next = facing === 'user' ? 'environment' : 'user'
    setMsg('Switching camera...')
    try { await startWithFacing(next) } catch {}
  }

  const verify = async () => {
    if (!streaming) { setMsg('Start camera first'); setOk(false); return }
    const video = videoRef.current
    const canvas = canvasRef.current
    // Sync canvas size to actual video stream dimensions for best quality
    if (video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
    }
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

  const startLive = async () => {
    if (!streaming) { await start() }
    if (timerRef.current) return
    setLive(true)
    const INTERVAL_MS = 2000
    const tick = async () => {
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
        fd.append('file', blob, 'frame.jpg')
        try {
          const res = await fetch(API_ENDPOINTS.STREAM, { method: 'POST', body: fd })
          const data = await res.json()
          if (res.ok && data.user_id) {
            setMsg(`Matched: ${data.user_id} (created=${data.created ? 'yes' : 'no'})`); setOk(true)
          } else {
            const sc = typeof data.score === 'number' ? ` (score=${data.score.toFixed(3)})` : ''
            setMsg(`No match${sc}`); setOk(false)
          }
        } catch (e) {
          setMsg(String(e)); setOk(false)
        }
      }, 'image/jpeg')
    }
    timerRef.current = setInterval(tick, INTERVAL_MS)
    setMsg('Live verification started'); setOk(true)
  }

  const stopLive = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    setLive(false)
    setMsg('Live verification stopped')
  }

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current)
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
        <p className="helper">Use single capture or Live Verify to stream frames every 2s.</p>
        <div className="media">
          <video className="video" ref={videoRef} autoPlay playsInline />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="actions">
            <button className="btn btn-outline" onClick={start} type="button">Start Camera</button>
            <button className="btn" onClick={switchCamera} type="button">Switch Camera</button>
            <button className="btn btn-primary" onClick={verify} type="button">Capture & Verify</button>
            {!live && <button className="btn" onClick={startLive} type="button">Start Live Verify</button>}
            {live && <button className="btn btn-outline" onClick={stopLive} type="button">Stop Live</button>}
          </div>
          <div className={`status ${ok ? 'ok' : 'err'}`}>{msg}</div>
        </div>
      </div>
    </div>
  )
}
