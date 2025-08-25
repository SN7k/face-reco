from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from routes import admin, match
import uvicorn
from db import init_db
from pathlib import Path
import os
import logging
from fastapi import HTTPException
from models.face_recognition import preload_models

# Configure logging for Cloud Run
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log startup information
logger.info(f"Starting Face Recognition Attendance System")
logger.info(f"PORT environment variable: {os.getenv('PORT', '8000')}")
logger.info(f"PYTHONUNBUFFERED: {os.getenv('PYTHONUNBUFFERED', 'Not set')}")
logger.info(f"Working directory: {os.getcwd()}")

# Run startup tasks
try:
    from startup import main as startup_main
    startup_main()
except Exception as e:
    logger.warning(f"Startup script failed, continuing with basic initialization: {e}")
    # Fallback to basic initialization
    init_db()

app = FastAPI()

@app.on_event("startup")
async def startup_event():
    logger.info("FastAPI application starting up...")
    try:
        # Ensure database is ready
        init_db()
        logger.info("Database connection established")
        
        # Ensure uploads directory exists
        uploads_dir = Path("uploads")
        uploads_dir.mkdir(exist_ok=True)
        logger.info("Uploads directory ready")
        # Preload face model to reduce first-request latency
        preload_models()
        logger.info("Face model preloaded")
        
    except Exception as e:
        logger.error(f"Startup error: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("FastAPI application shutting down...")

# CORS
app.add_middleware(
	CORSMiddleware,
	allow_origins=[
		"*",  # adjust to specific domains in production
		"http://localhost:5173",
		"http://localhost:5174",
	],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# Initialize DB
autostart = init_db()

# Static serving for local uploads
from config import settings
uploads_dir = settings.uploads_dir
uploads_dir.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")

# Include routes
app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(match.router, prefix="/match", tags=["Match"])

@app.get("/", response_class=HTMLResponse)
def root():
	return """
	<h2>Face Recognition Attendance System</h2>
	<ul>
		<li><a href="/admin/ui">Admin Upload</a></li>
		<li><a href="/verify">Public Verification</a></li>
		<li><a href="/admin/attendance">Attendance</a></li>
	</ul>
	"""

@app.get("/health")
def health_check():
	return {"status": "healthy", "message": "Service is running"}

@app.get("/ready")
def readiness_probe():
	"""
	Readiness probe endpoint for Cloud Run
	Returns 200 only when the service is fully ready to handle requests
	"""
	try:
		# Check if database is accessible
		from db import SessionLocal
		db = SessionLocal()
		db.execute("SELECT 1")
		db.close()
		
		# Check if uploads directory is writable
		uploads_dir = Path("uploads")
		if not uploads_dir.exists():
			uploads_dir.mkdir(exist_ok=True)
		
		return {"status": "ready", "message": "Service is ready to handle requests"}
	except Exception as e:
		logger.error(f"Readiness check failed: {e}")
		raise HTTPException(status_code=503, detail="Service not ready")

@app.get("/admin/ui", response_class=HTMLResponse)
async def admin_ui():
	return """
	<h3>Admin - Register User</h3>
	<h4>Upload from file</h4>
	<form action="/admin/upload" method="post" enctype="multipart/form-data">
		<label>Name: <input type="text" name="name" required></label><br/><br/>
		<input type="file" name="file" accept="image/*" capture="environment" required />
		<button type="submit">Upload</button>
	</form>
	<hr/>
	<h4>Capture from camera</h4>
	<label>Name: <input id="cam-name" type="text" required></label><br/><br/>
	<video id="cam" autoplay playsinline width="320" height="240" style="border:1px solid #ccc"></video><br/>
	<canvas id="canvas" width="320" height="240" style="display:none"></canvas><br/>
	<button id="start">Start Camera</button>
	<button id="capture">Capture & Upload</button>
	<p id="status"></p>
	<p><a href="/">Home</a></p>
	<script>
	const video = document.getElementById('cam');
	const canvas = document.getElementById('canvas');
	const startBtn = document.getElementById('start');
	const captureBtn = document.getElementById('capture');
	const statusEl = document.getElementById('status');
	let stream;
	startBtn.onclick = async () => {
		try {
			stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
			video.srcObject = stream;
			statusEl.textContent = 'Camera started';
		} catch (e) {
			statusEl.textContent = 'Failed to start camera: ' + e;
		}
	};
	captureBtn.onclick = async () => {
		if (!stream) { statusEl.textContent = 'Start the camera first'; return; }
		const name = document.getElementById('cam-name').value.trim();
		if (!name) { statusEl.textContent = 'Enter a name'; return; }
		const ctx = canvas.getContext('2d');
		ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		canvas.toBlob(async (blob) => {
			const fd = new FormData();
			fd.append('name', name);
			fd.append('file', blob, 'capture.jpg');
			statusEl.textContent = 'Uploading...';
			const res = await fetch('/admin/upload', { method: 'POST', body: fd });
			if (!res.ok) { statusEl.textContent = 'Upload failed: ' + res.status; return; }
			const data = await res.json();
			statusEl.textContent = 'Uploaded. User ID: ' + data.user_id;
		});
	};
	</script>
	"""

@app.get("/verify", response_class=HTMLResponse)
async def verify_ui():
	return """
	<h3>Public - Verify Face</h3>
	<h4>Upload from file</h4>
	<form action="/match/" method="post" enctype="multipart/form-data">
		<input type="file" name="file" accept="image/*" capture="user" required />
		<button type="submit">Verify</button>
	</form>
	<hr/>
	<h4>Capture from camera</h4>
	<video id="v2" autoplay playsinline width="320" height="240" style="border:1px solid #ccc"></video><br/>
	<canvas id="c2" width="320" height="240" style="display:none"></canvas><br/>
	<button id="s2">Start Camera</button>
	<button id="u2">Capture & Verify</button>
	<p id="m2"></p>
	<p><a href="/">Home</a></p>
	<script>
	const v2 = document.getElementById('v2');
	const c2 = document.getElementById('c2');
	const s2 = document.getElementById('s2');
	const u2 = document.getElementById('u2');
	const m2 = document.getElementById('m2');
	let st2;
	s2.onclick = async () => {
		try {
			st2 = await navigator.mediaDevices.getUserMedia({ video: true });
			v2.srcObject = st2;
			m2.textContent = 'Camera started';
		} catch (e) {
			m2.textContent = 'Failed to start camera: ' + e;
		}
	};
	u2.onclick = async () => {
		if (!st2) { m2.textContent = 'Start the camera first'; return; }
		const ctx = c2.getContext('2d');
		ctx.drawImage(v2, 0, 0, c2.width, c2.height);
		c2.toBlob(async (blob) => {
			const fd = new FormData();
			fd.append('file', blob, 'verify.jpg');
			m2.textContent = 'Verifying...';
			const res = await fetch('/match/', { method: 'POST', body: fd });
			const data = await res.json();
			if (res.ok) {
				m2.textContent = 'Matched user ID: ' + data.user_id;
			} else {
				m2.textContent = data.detail || 'No match';
			}
		});
	};
	</script>
	"""

@app.get("/admin/attendance", response_class=HTMLResponse)
async def attendance_ui():
	return """
	<h3>Attendance</h3>
	<script>
	async function loadData() {
		const res = await fetch('/admin/attendance');
		const data = await res.json();
		const rows = data.map(r => `<tr><td>${r.timestamp}</td><td>${r.user_id}</td><td>${r.user_name}</td></tr>`).join('');
		document.getElementById('rows').innerHTML = rows;
	}
	loadData();
	</script>
	<table border="1" cellpadding="6"><thead><tr><th>Time</th><th>User ID</th><th>Name</th></tr></thead>
	<tbody id="rows"></tbody></table>
	<p><a href="/">Home</a></p>
	"""

if __name__ == "__main__":
	import uvicorn
	import os
	
	# Get port from environment variable (Cloud Run sets this)
	port = int(os.getenv("PORT", 8000))
	
	uvicorn.run(
		"main:app",
		host="0.0.0.0",
		port=port,
		reload=False  # Disable reload in production
	)