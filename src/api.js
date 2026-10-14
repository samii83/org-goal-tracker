// Frontend API Client with Cookie Credentials and Fallback Support

const API_BASE = "/api";

async function request(endpoint, options = {}) {
  const config = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    credentials: "include", // Include cookies for session authentication
  };

  if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(`${API_BASE}${endpoint}`, config);
  if (!res.ok) {
    let errorDetail = `Request failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      // response was not JSON
    }
    const err = new Error(errorDetail);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export const api = {
  // Health
  checkHealth: () => request("/health"),

  // Auth
  login: (email, password = "") =>
    request("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),
  getCurrentUser: () => request("/auth/me"),

  // Users & Teams
  getUsers: () => request("/users"),
  getTeams: () => request("/teams"),

  // Goals
  getGoals: (employeeId = null) =>
    request(employeeId ? `/goals?employee_id=${employeeId}` : "/goals"),
  createGoal: (goalData, employeeId = null) =>
    request(employeeId ? `/goals?employee_id=${employeeId}` : "/goals", {
      method: "POST",
      body: goalData,
    }),
  updateGoal: (goalId, goalData) =>
    request(`/goals/${goalId}`, {
      method: "PUT",
      body: goalData,
    }),
  deleteGoal: (goalId) =>
    request(`/goals/${goalId}`, {
      method: "DELETE",
    }),
  submitGoals: (employeeId) =>
    request(`/goals/submit?employee_id=${employeeId}`, {
      method: "POST",
    }),
  approveGoal: (goalId) =>
    request(`/goals/${goalId}/approve`, {
      method: "POST",
    }),
  rejectGoal: (goalId) =>
    request(`/goals/${goalId}/reject`, {
      method: "POST",
    }),
  logAchievement: (goalId, quarter, actual, status = "On Track") =>
    request(`/goals/${goalId}/achievement`, {
      method: "POST",
      body: { quarter, actual, status },
    }),
  addCheckin: (goalId, quarter, comment) =>
    request(`/goals/${goalId}/checkin`, {
      method: "POST",
      body: { quarter, comment },
    }),
  pushSharedGoals: (sharedData) =>
    request("/goals/shared", {
      method: "POST",
      body: sharedData,
    }),
  unlockGoal: (goalId) =>
    request(`/goals/${goalId}/unlock`, {
      method: "POST",
    }),

  // Audit & Governance
  getAudit: () => request("/audit"),
  getEscalations: () => request("/escalations"),
  resolveEscalation: (id) =>
    request(`/escalations/${id}/resolve`, {
      method: "POST",
    }),

  // Dashboard Stats
  getDashboardStats: () => request("/dashboard/stats"),
};


