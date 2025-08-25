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
  const [cameras, setCameras] = useState([])
  const cameraIdxRef = useRef(0)

  const startWithFacing = async (targetFacing) => {
    try {
      const current = videoRef.current && videoRef.current.srcObject
      if (current && current.getTracks) current.getTracks().forEach(t => t.stop())
      let stream = null
      // Try exact, then ideal, then default
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
      // Populate device list
      const devices = await navigator.mediaDevices.enumerateDevices()
      const vids = devices.filter(d => d.kind === 'videoinput')
      setCameras(vids)
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

  const nextDevice = async () => {
    try {
      const devices = cameras.length ? cameras : (await navigator.mediaDevices.enumerateDevices()).filter(d => d.kind === 'videoinput')
      if (!devices.length) { setMsg('No cameras found'); return }
      cameraIdxRef.current = (cameraIdxRef.current + 1) % devices.length
      const target = devices[cameraIdxRef.current]
      const current = videoRef.current && videoRef.current.srcObject
      if (current && current.getTracks) current.getTracks().forEach(t => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: target.deviceId } } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setStreaming(true)
      }
      setCameras(devices)
      setMsg(`Switched to device: ${target.label || cameraIdxRef.current + 1}`)
    } catch (e) {
      setMsg('Failed to switch device: ' + e)
    }
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
        <button className="btn" type="button" onClick={nextDevice}>Next Camera</button>
        <button className="btn btn-primary" type="button" onClick={capture}>Capture & Upload</button>
      </div>
      <div className={`status ${ok ? 'ok' : 'err'}`}>{msg}</div>
    </div>
  )
} 