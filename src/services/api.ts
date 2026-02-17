import { createClient } from "@supabase/supabase-js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Supabase client for Auth (already used in the app likely, or we need to import it)
// Checking if there is an existing supabase client file.
// I saw `supabase/client.ts` or `integrations/supabase/client.ts` in file list? 
// list_dir showed `supabase` folder in root, but `src/integrations` has something.
// I'll check `src/integrations/supabase/client.ts` first.
// If not found, I will just assumes the user is logged in via supabase auth provider 
// and get the session token to send to backend.

export const fetchDashboardKPIs = async (token: string) => {
  const response = await fetch(`${API_URL}/api/dashboard/kpis`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch KPIs");
  return response.json();
};

export const fetchLiveBuses = async (token: string) => {
  const response = await fetch(`${API_URL}/api/live/buses`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch live buses");
  return response.json();
};

export const fetchRouteAnalytics = async (token: string) => {
  const response = await fetch(`${API_URL}/api/analytics/routes`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch analytics");
  return response.json();
};

export const fetchAIRecommendations = async (token: string) => {
  const response = await fetch(`${API_URL}/api/ai/recommendations`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch recommendations");
  return response.json();
};

export const fetchMonthlyStats = async (token: string, year: number, month: number) => {
  const response = await fetch(`${API_URL}/api/history/monthly-stats?year=${year}&month=${month}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch monthly stats");
  return response.json();
};

export const fetchReportsData = async (token: string) => {
  const response = await fetch(`${API_URL}/api/reports/performance`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error("Failed to fetch reports data");
  return response.json();
};
