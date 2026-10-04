const API_BASE = '/api';

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('smartdairy_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return data;
}

function buildQueryString(params: Record<string, any> = {}): string {
  const cleanParams: Record<string, string> = {};
  for (const [key, val] of Object.entries(params)) {
    if (val !== undefined && val !== null && val !== '' && val !== 'undefined' && val !== 'ALL') {
      cleanParams[key] = String(val);
    }
  }
  const q = new URLSearchParams(cleanParams).toString();
  return q ? `?${q}` : '';
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData: { name: string; email: string; password: string; role?: string; farmName?: string }) =>
    apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  getDatabaseInfo: () => apiRequest('/auth/database-info'),
  getMe: () => apiRequest('/auth/me'),

  // Cows
  getCows: (params: { riskLevel?: string; search?: string } = {}) => {
    return apiRequest(`/cows${buildQueryString(params)}`);
  },
  getCow: (id: string) => apiRequest(`/cows/${id}`),
  createCow: (cowData: any) =>
    apiRequest('/cows', { method: 'POST', body: JSON.stringify(cowData) }),
  updateCow: (id: string, cowData: any) =>
    apiRequest(`/cows/${id}`, { method: 'PUT', body: JSON.stringify(cowData) }),

  // RFID
  scanRfid: (scanData: { tagUid: string; readerId: string; stationId?: string }) =>
    apiRequest('/rfid/scan', { method: 'POST', body: JSON.stringify(scanData) }),
  getRfidEvents: () => apiRequest('/rfid/events'),

  // Sessions
  getSessions: (params: { page?: number; limit?: number; status?: string; riskLevel?: string } = {}) => {
    return apiRequest(`/sessions${buildQueryString(params)}`);
  },
  getLiveSession: () => apiRequest('/sessions/live'),
  getSession: (id: string) => apiRequest(`/sessions/${id}`),
  startSession: (sessionData: { stationId: string; cowId?: string }) =>
    apiRequest('/sessions/start', { method: 'POST', body: JSON.stringify(sessionData) }),
  endSession: (id: string) =>
    apiRequest(`/sessions/${id}/end`, { method: 'POST' }),
  assignCowToSession: (id: string, cowId: string) =>
    apiRequest(`/sessions/${id}/assign-cow`, { method: 'POST', body: JSON.stringify({ cowId }) }),

  // Sensors
  getSensors: () => apiRequest('/sensors'),
  getSensor: (id: string) => apiRequest(`/sensors/${id}`),
  setSensorStatus: (id: string, status: string, message?: string) =>
    apiRequest(`/sensors/${id}/status`, { method: 'POST', body: JSON.stringify({ status, message }) }),

  // Readings
  getReadingsBySession: (sessionId: string) => apiRequest(`/readings/session/${sessionId}`),

  // Health
  getHealthSummary: (params: { riskLevel?: string; sortBy?: string } = {}) => {
    return apiRequest(`/health/cows${buildQueryString(params)}`);
  },
  getCowHealth: (cowId: string) => apiRequest(`/health/cows/${cowId}`),
  getHerdForecast: () => apiRequest('/health/herd-forecast'),

  // AI
  getAiWeights: () => apiRequest('/ai/weights'),
  updateAiWeights: (weights: any) =>
    apiRequest('/ai/weights', { method: 'POST', body: JSON.stringify(weights) }),
  analyzeSession: (sessionId: string) =>
    apiRequest(`/ai/analyze/${sessionId}`, { method: 'POST' }),

  // Alerts
  getAlerts: (params: { status?: string; severity?: string } = {}) => {
    return apiRequest(`/alerts${buildQueryString(params)}`);
  },
  acknowledgeAlert: (id: string, note?: string) =>
    apiRequest(`/alerts/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ note }) }),
  resolveAlert: (id: string, resolutionNote?: string) =>
    apiRequest(`/alerts/${id}/resolve`, { method: 'POST', body: JSON.stringify({ resolutionNote }) }),

  // CIP
  getCipStatus: () => apiRequest('/cip/status'),
  startCip: (stationId?: string) =>
    apiRequest('/cip/start', { method: 'POST', body: JSON.stringify({ stationId }) }),
  stopCip: () => apiRequest('/cip/stop', { method: 'POST' }),

  // Dashboard & Map
  getDashboardSummary: () => apiRequest('/dashboard/summary'),
  getDashboardTrends: () => apiRequest('/dashboard/trends'),
  getFarmGeoData: () => apiRequest('/map/farm-geo'),

  // Simulation
  startSimulation: (stationId?: string, cowCode?: string) =>
    apiRequest('/simulation/start', { method: 'POST', body: JSON.stringify({ stationId, cowCode }) }),
  stopSimulation: () => apiRequest('/simulation/stop', { method: 'POST' }),
  pauseSimulation: () => apiRequest('/simulation/pause', { method: 'POST' }),
  resumeSimulation: () => apiRequest('/simulation/resume', { method: 'POST' }),
  runScenario: (scenario: string, stationId?: string, cowId?: string) =>
    apiRequest('/simulation/scenario', {
      method: 'POST',
      body: JSON.stringify({ scenario, stationId, cowId })
    }),
  toggleNetwork: (online: boolean) =>
    apiRequest('/simulation/network', { method: 'POST', body: JSON.stringify({ online }) })
};
