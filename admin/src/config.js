export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export const API_ENDPOINTS = {
  UPLOAD: `${API_BASE_URL}/admin/upload`,
  ATTENDANCE: `${API_BASE_URL}/admin/attendance`,
  MATCH: `${API_BASE_URL}/match/`,
  HEALTH: `${API_BASE_URL}/health`,
  READY: `${API_BASE_URL}/ready`
}

console.log(`API Base URL: ${API_BASE_URL}`)
console.log(`Environment: ${import.meta.env.DEV ? 'Development' : 'Production'}`)
console.log(`VITE_API_BASE_URL: ${import.meta.env.VITE_API_BASE_URL || 'Not set'}`)
