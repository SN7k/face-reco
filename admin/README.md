# Admin Panel (React)

A simple React admin panel to upload images or capture from camera and send to the FastAPI backend.

## Run

1. Install dependencies

```
npm install
```

2. Start dev server (proxies API calls to FastAPI at http://localhost:8000)

```
npm run dev
```

Open http://localhost:5173

## Notes
- Upload posts to `/admin/upload`
- Attendance reads from `/admin/attendance`
- Proxy is configured in `vite.config.js` for `/admin` and `/match` 