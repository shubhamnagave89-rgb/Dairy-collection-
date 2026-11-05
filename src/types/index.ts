export type Language = 'mr' | 'en';
export type Theme = 'light' | 'dark';
export type UserRole = 'admin' | 'supplier' | 'guest';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'supplier';
  mobile?: string;
  village?: string;
  status?: string;
  isApproved?: boolean;
}

export interface SupplierFinancials {
  totalCollectionAmount: number;
  totalPaidAmount: number;
  remainingBalance: number;
  cowQuantity: number;
  buffaloQuantity: number;
  totalQuantity: number;
  avgFat: number;
  avgSNF: number;
}

export interface MilkCollectionItem {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  shift: 'morning' | 'evening';
  milkType: 'cow' | 'buffalo';
  quantity: number;
  fat: number;
  snf: number;
  pricingMode: 'automatic' | 'manual';
  appliedRate: number;
  totalAmount: number;
  rateChartVersion?: string;
  enteredByAdminId: string;
  enteredByName: string;
  notes?: string;
  createdAt: string;
}

export interface RateChartConfig {
  id: string;
  version: string;
  milkType: 'cow' | 'buffalo';
  effectiveDate: string;
  baseRate: number;
  baseFat: number;
  baseSNF: number;
  fatStep: number;
  snfStep: number;
  minRate: number;
  maxRate: number;
  active: boolean;
  notes?: string;
}

export interface PaymentItem {
  id: string;
  supplierId: string;
  supplierName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other';
  transactionRef: string;
  notes?: string;
  isAdvance: boolean;
  recordedByAdminId: string;
  recordedByName: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  supplierId: string;
  title: string;
  message: string;
  type: 'collection' | 'payment' | 'statement' | 'system';
  isRead: boolean;
  createdAt: string;
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

export interface AuditLogItem {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  action: string;
  details: string;
  ip?: string;
}
