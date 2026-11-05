export type MilkType = 'cow' | 'buffalo';
export type ShiftType = 'morning' | 'evening';
export type PricingMode = 'automatic' | 'manual';
export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
export type UserRole = 'admin' | 'supplier';

export interface Supplier {
  id: string; // e.g. JDK001
  fullName: string;
  email: string;
  mobile: string;
  village: string;
  passwordHash: string;
  isVerified: boolean;
  isApproved: boolean;
  status: 'active' | 'pending' | 'suspended';
  createdAt: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    ifsc: string;
  };
}

export interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  mobile: string;
  role: 'super_admin' | 'operator';
  passwordHash: string;
  createdAt: string;
}

export interface MilkCollection {
  id: string; // e.g. MC-20261104-001
  supplierId: string;
  supplierName: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  milkType: MilkType;
  quantity: number; // in Litres
  fat: number; // e.g. 3.8 or 6.5
  snf: number; // e.g. 8.5 or 9.0
  pricingMode: PricingMode;
  appliedRate: number; // per litre
  totalAmount: number; // quantity * rate
  rateChartVersion?: string;
  enteredByAdminId: string;
  enteredByName: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RateChartConfig {
  id: string;
  version: string;
  milkType: MilkType;
  effectiveDate: string;
  baseRate: number; // Cow base at 3.5 Fat / 8.5 SNF = ₹37; Buffalo base at 6.0 Fat / 9.0 SNF = ₹62
  baseFat: number;
  baseSNF: number;
  fatStep: number; // Increment/decrement per 0.1 Fat
  snfStep: number; // Increment/decrement per 0.1 SNF
  minRate: number;
  maxRate: number;
  active: boolean;
  notes?: string;
}

export interface Payment {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionRef: string;
  notes?: string;
  isAdvance: boolean;
  recordedByAdminId: string;
  recordedByName: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  supplierId: string; // or 'all'
  title: string;
  message: string;
  type: 'collection' | 'payment' | 'statement' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  ip?: string;
}

export interface DairySettings {
  dairyName: string;
  dairyEnglishName: string;
  registrationNumber: string;
  village: string;
  district: string;
  contactPhone: string;
  contactEmail: string;
  morningShiftHours: string;
  eveningShiftHours: string;
  autoApproveSuppliers: boolean;
  activeCowChartVersion: string;
  activeBuffaloChartVersion: string;
  printerPaperWidth: '58mm' | '80mm' | 'a4';
}

export interface DairyDatabase {
  suppliers: Supplier[];
  adminUsers: AdminUser[];
  collections: MilkCollection[];
  cowRateCharts: RateChartConfig[];
  buffaloRateCharts: RateChartConfig[];
  payments: Payment[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  settings: DairySettings;
}
