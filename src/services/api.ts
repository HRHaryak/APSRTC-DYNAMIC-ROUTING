const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper to get auth token
const getAuthToken = () => {
  return localStorage.getItem("access_token");
};

// Helper to make authenticated requests
const authenticatedFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> || {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("user_data");
      window.location.href = "/login";
    }
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

// Dashboard APIs
export const fetchDashboardKPIs = async () => {
  return authenticatedFetch("/api/dashboard/kpis");
};

// Live Data APIs
export const fetchLiveBuses = async () => {
  return authenticatedFetch("/api/live/buses");
};

// Analytics APIs
export const fetchRouteAnalytics = async () => {
  return authenticatedFetch("/api/analytics/routes");
};

export const fetchODMatrix = async (routeId: string) => {
  return authenticatedFetch(`/api/analytics/od-matrix/${routeId}`);
};

export const fetchTemporalPatterns = async () => {
  return authenticatedFetch("/api/analytics/temporal-patterns");
};

export const fetchEfficiencyMetrics = async () => {
  return authenticatedFetch("/api/analytics/efficiency");
};

// AI APIs
export const fetchAIRecommendations = async () => {
  return authenticatedFetch("/api/ai/recommendations");
};

export const fetchDelayPrediction = async (busId: string) => {
  return authenticatedFetch(`/api/ai/delay/${busId}`);
};

export const fetchDemandForecast = async (routeId: string, hour?: number) => {
  const params = hour !== undefined ? `?hour=${hour}` : "";
  return authenticatedFetch(`/api/ai/demand/${routeId}${params}`);
};

export const fetchAnomalies = async () => {
  return authenticatedFetch("/api/ai/anomalies");
};

export const submitRecommendationFeedback = async (recId: string, action: string, comment: string = "") => {
  return authenticatedFetch("/api/ai/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rec_id: recId, action, comment }),
  });
};

// History APIs
export const fetchMonthlyStats = async (year: number, month: number) => {
  return authenticatedFetch(`/api/history/monthly-stats?year=${year}&month=${month}`);
};

// Reports APIs
export const fetchReportsData = async () => {
  return authenticatedFetch("/api/reports/performance");
};

// Admin APIs (admin only)
export const fetchAuditLogs = async (limit: number = 100, username?: string, eventType?: string) => {
  let params = `?limit=${limit}`;
  if (username) params += `&username=${username}`;
  if (eventType) params += `&event_type=${eventType}`;
  return authenticatedFetch(`/api/admin/audit-logs${params}`);
};

export const fetchComplianceReport = async () => {
  return authenticatedFetch("/api/admin/compliance-report");
};

export const fetchSystemStats = async () => {
  return authenticatedFetch("/api/admin/system-stats");
};

export const triggerModelRetraining = async () => {
  return authenticatedFetch("/api/admin/retrain-models", { method: "POST" });
};

// User Management APIs (admin only)
export const fetchUsers = async () => {
  return authenticatedFetch("/api/auth/users");
};

export const fetchCurrentUser = async () => {
  return authenticatedFetch("/api/auth/me");
};
