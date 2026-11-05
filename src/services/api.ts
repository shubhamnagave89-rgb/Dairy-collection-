import {
  UserProfile,
  MilkCollectionItem,
  PaymentItem,
  NotificationItem,
  DairySettings,
  AuditLogItem,
  RateChartConfig
} from '../types/index.js';

const TOKEN_KEY = 'jyotiba_dairy_auth_token';

export const api = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.error || 'सर्व्हरकडून प्रतिसाद मिळाला नाही.');
    }

    return data as T;
  },

  // Auth
  async getCurrentUser(): Promise<{ user: UserProfile | null }> {
    return this.request<{ user: UserProfile | null }>('/auth/me');
  },

  async registerSupplier(payload: any): Promise<{ success: boolean; supplier: UserProfile; token: string }> {
    const res = await this.request<any>('/auth/register-supplier', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  },

  async loginSupplier(identifier: string, password: string): Promise<{ success: boolean; user: UserProfile; token: string }> {
    const res = await this.request<any>('/auth/login-supplier', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  },

  async loginAdmin(email: string, password: string): Promise<{ success: boolean; user: UserProfile; token: string }> {
    const res = await this.request<any>('/auth/login-admin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  },

  logout() {
    this.clearToken();
  },

  // Suppliers
  async getSuppliers(query = ''): Promise<{ suppliers: any[] }> {
    return this.request<{ suppliers: any[] }>(`/suppliers?q=${encodeURIComponent(query)}`);
  },

  async getSupplier(id: string): Promise<{ supplier: any; financials: any }> {
    return this.request<{ supplier: any; financials: any }>(`/suppliers/${id}`);
  },

  async addSupplier(data: any): Promise<{ success: boolean; supplier: any }> {
    return this.request<any>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateSupplier(id: string, updates: any): Promise<{ success: boolean; supplier: any }> {
    return this.request<any>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  // Milk Collections
  async getCollections(params: Record<string, string> = {}): Promise<{ collections: MilkCollectionItem[] }> {
    const query = new URLSearchParams(params).toString();
    return this.request<{ collections: MilkCollectionItem[] }>(`/collections${query ? `?${query}` : ''}`);
  },

  async addCollection(data: any): Promise<{ success: boolean; collection: MilkCollectionItem }> {
    return this.request<any>('/collections', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateCollection(id: string, updates: any): Promise<{ success: boolean; collection: MilkCollectionItem }> {
    return this.request<any>(`/collections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  },

  async deleteCollection(id: string): Promise<{ success: boolean; message: string }> {
    return this.request<any>(`/collections/${id}`, {
      method: 'DELETE'
    });
  },

  // Rates
  async getRates(): Promise<{ cow: RateChartConfig[]; buffalo: RateChartConfig[] }> {
    return this.request<any>('/rates');
  },

  async calculateRate(milkType: string, fat: number, snf: number): Promise<{ rate: number; chartVersion: string; details: string }> {
    return this.request<any>('/rates/calculate', {
      method: 'POST',
      body: JSON.stringify({ milkType, fat, snf })
    });
  },

  async updateRateChart(milkType: string, chart: RateChartConfig): Promise<{ success: boolean; charts: any }> {
    return this.request<any>('/rates', {
      method: 'PUT',
      body: JSON.stringify({ milkType, chart })
    });
  },

  // Payments
  async getPayments(supplierId?: string): Promise<{ payments: PaymentItem[] }> {
    return this.request<any>(`/payments${supplierId ? `?supplierId=${supplierId}` : ''}`);
  },

  async addPayment(data: any): Promise<{ success: boolean; payment: PaymentItem; financials: any }> {
    return this.request<any>('/payments', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  // Reports
  async getDashboardSummary(): Promise<any> {
    return this.request<any>('/reports/dashboard');
  },

  async getSupplierStatement(params: Record<string, string>): Promise<any> {
    const query = new URLSearchParams(params).toString();
    return this.request<any>(`/reports/supplier-statement?${query}`);
  },

  async getDailySheet(date?: string): Promise<any> {
    return this.request<any>(`/reports/daily-sheet${date ? `?date=${date}` : ''}`);
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    return this.request<any>('/notifications');
  },

  async markNotificationRead(id: string): Promise<any> {
    return this.request<any>(`/notifications/${id}/read`, { method: 'PATCH' });
  },

  // Settings & Logs
  async getSettings(): Promise<{ settings: DairySettings }> {
    return this.request<any>('/settings');
  },

  async updateSettings(settings: Partial<DairySettings>): Promise<{ success: boolean; settings: DairySettings }> {
    return this.request<any>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  },

  async getAuditLogs(): Promise<{ logs: AuditLogItem[] }> {
    return this.request<any>('/audit-logs');
  },

  async restoreDatabase(data: any): Promise<any> {
    return this.request<any>('/backup/import', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
};
