import React, { useState } from 'react'
import UploadForm from './components/UploadForm'
import CaptureForm from './components/CaptureForm'
import Attendance from './components/Attendance'

export default function App() {
  const [tab, setTab] = useState('upload')

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="brand-badge" />
          <div className="brand-title">Face Attendance • Admin</div>
        </div>
        <div className="tabs" role="tablist" aria-label="Sections">
          <button className={"tab" + (tab === 'upload' ? ' active' : '')} onClick={() => setTab('upload')} role="tab">Upload</button>
          <button className={"tab" + (tab === 'capture' ? ' active' : '')} onClick={() => setTab('capture')} role="tab">Capture</button>
          <button className={"tab" + (tab === 'attendance' ? ' active' : '')} onClick={() => setTab('attendance')} role="tab">Attendance</button>
        </div>
      </div>

      {tab === 'upload' && (
        <div className="card">
          <h3>Register User by Upload</h3>
          <p className="helper">Upload a clear frontal face image. Supported formats: JPG, PNG.</p>
          <UploadForm />
        </div>
      )}

      {tab === 'capture' && (
        <div className="card">
          <h3>Register User by Camera</h3>
          <p className="helper">Position the face in good lighting and capture a frame.</p>
          <CaptureForm />
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card">
          <h3>Attendance</h3>
          <p className="helper">Latest verifications recorded by the system.</p>
          <Attendance />
        </div>
      )}
    </div>
  )
} 