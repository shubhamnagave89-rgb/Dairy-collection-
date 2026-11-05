import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  DairyDatabase,
  Supplier,
  AdminUser,
  MilkCollection,
  RateChartConfig,
  Payment,
  NotificationItem,
  AuditLog,
  DairySettings
} from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'dairy_db.json');

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`jyotiba_salt_${password}`).digest('hex');
}

export function generateToken(payload: object): string {
  const str = JSON.stringify({ ...payload, timestamp: Date.now() });
  return Buffer.from(str).toString('base64');
}

export function decodeToken<T = any>(token: string): T | null {
  try {
    const json = Buffer.from(token, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const DEFAULT_SETTINGS: DairySettings = {
  dairyName: 'ज्योतिबा दूध संकलन केंद्र',
  dairyEnglishName: 'Jyotiba Milk Collection Center',
  registrationNumber: 'MAH/KOP/DAIRY/2019/9421',
  village: 'वाडी रत्नागिरी (ज्योतिबा डोंगर)',
  district: 'पन्हाळा, कोल्हापूर',
  contactPhone: '+91 98220 54321 / +91 88888 12345',
  contactEmail: 'contact@jyotibadairy.com',
  morningShiftHours: 'सकाळी ६:०० ते ९:३०',
  eveningShiftHours: 'संध्याकाळी ५:०० ते ८:३०',
  autoApproveSuppliers: true,
  activeCowChartVersion: 'COW-CHART-2026-V1',
  activeBuffaloChartVersion: 'BUF-CHART-2026-V1',
  printerPaperWidth: '80mm'
};

const DEFAULT_COW_RATE: RateChartConfig = {
  id: 'rate-cow-v1',
  version: 'COW-CHART-2026-V1',
  milkType: 'cow',
  effectiveDate: '2026-01-01',
  baseRate: 36.50, // Base at 3.5 Fat / 8.5 SNF
  baseFat: 3.5,
  baseSNF: 8.5,
  fatStep: 0.35, // ₹0.35 per 0.1 Fat
  snfStep: 0.25, // ₹0.25 per 0.1 SNF
  minRate: 28.00,
  maxRate: 48.00,
  active: true,
  notes: 'शासकीय व सहकारी डेअरी नियमांनुसार प्रमाणित गाय दूध दर पत्रक'
};

const DEFAULT_BUF_RATE: RateChartConfig = {
  id: 'rate-buf-v1',
  version: 'BUF-CHART-2026-V1',
  milkType: 'buffalo',
  effectiveDate: '2026-01-01',
  baseRate: 62.00, // Base at 6.0 Fat / 9.0 SNF
  baseFat: 6.0,
  baseSNF: 9.0,
  fatStep: 0.60, // ₹0.60 per 0.1 Fat
  snfStep: 0.40, // ₹0.40 per 0.1 SNF
  minRate: 45.00,
  maxRate: 85.00,
  active: true,
  notes: 'प्रमाणित म्हैस दूध दर पत्रक - फॅट व एसएनएफ आधारित'
};

function getInitialDatabase(): DairyDatabase {
  const adminPasswordHash = hashPassword('admin123');
  const supplierPasswordHash = hashPassword('farmer123');

  const adminUsers: AdminUser[] = [
    {
      id: 'ADM001',
      email: 'admin@jyotibadairy.com',
      fullName: 'श्री. मिलिंद नागवे (डेअरी व्यवस्थापक)',
      mobile: '9822054321',
      role: 'super_admin',
      passwordHash: adminPasswordHash,
      createdAt: '2026-01-01T08:00:00.000Z'
    },
    {
      id: 'ADM002',
      email: 'nagavemilind@gmail.com',
      fullName: 'मिलिंद नागवे (प्रमुख प्रशासक)',
      mobile: '9822054321',
      role: 'super_admin',
      passwordHash: adminPasswordHash,
      createdAt: '2026-01-01T08:00:00.000Z'
    }
  ];

  const suppliers: Supplier[] = [
    {
      id: 'JDK001',
      fullName: 'रमेश विठ्ठल पाटील',
      email: 'ramesh.patil@gmail.com',
      mobile: '9822112233',
      village: 'वाडी रत्नागिरी',
      passwordHash: supplierPasswordHash,
      isVerified: true,
      isApproved: true,
      status: 'active',
      createdAt: '2026-02-01T07:00:00.000Z',
      bankDetails: {
        bankName: 'बँक ऑफ इंडिया, ज्योतिबा शाखा',
        accountNumber: '12340001009876',
        ifsc: 'BKID0001234'
      }
    },
    {
      id: 'JDK002',
      fullName: 'तानाजी यशवंत जाधव',
      email: 'tanaji.jadhav@gmail.com',
      mobile: '9822445566',
      village: 'दानेवाडी',
      passwordHash: supplierPasswordHash,
      isVerified: true,
      isApproved: true,
      status: 'active',
      createdAt: '2026-02-05T08:30:00.000Z',
      bankDetails: {
        bankName: 'कोल्हापूर जिल्हा मध्यवर्ती बँक',
        accountNumber: '998800023456',
        ifsc: 'KDCC0000456'
      }
    },
    {
      id: 'JDK003',
      fullName: 'सुरेखा संभाजी खोत',
      email: 'surekha.khot@gmail.com',
      mobile: '9822778899',
      village: 'कुशिरे',
      passwordHash: supplierPasswordHash,
      isVerified: true,
      isApproved: true,
      status: 'active',
      createdAt: '2026-02-10T09:15:00.000Z'
    },
    {
      id: 'JDK004',
      fullName: 'पांडुरंग बापू मोरे',
      email: 'pandurang.more@gmail.com',
      mobile: '9822123987',
      village: 'पोहाळे',
      passwordHash: supplierPasswordHash,
      isVerified: true,
      isApproved: true,
      status: 'active',
      createdAt: '2026-02-15T06:45:00.000Z'
    },
    {
      id: 'JDK005',
      fullName: 'आनंदा ज्ञानू कांबळे',
      email: 'ananda.kamble@gmail.com',
      mobile: '9822334411',
      village: 'केर्ले',
      passwordHash: supplierPasswordHash,
      isVerified: true,
      isApproved: true,
      status: 'active',
      createdAt: '2026-02-20T08:00:00.000Z'
    }
  ];

  // Helper date strings
  const today = new Date().toISOString().split('T')[0];
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const yesterday = d.toISOString().split('T')[0];
  d.setDate(d.getDate() - 1);
  const twoDaysAgo = d.toISOString().split('T')[0];

  const collections: MilkCollection[] = [
    // Today morning
    {
      id: `MC-${today.replace(/-/g, '')}-001`,
      supplierId: 'JDK001',
      supplierName: 'रमेश विठ्ठल पाटील',
      date: today,
      shift: 'morning',
      milkType: 'cow',
      quantity: 12.5,
      fat: 3.8,
      snf: 8.6,
      pricingMode: 'automatic',
      appliedRate: 37.80,
      totalAmount: 472.50,
      rateChartVersion: 'COW-CHART-2026-V1',
      enteredByAdminId: 'ADM001',
      enteredByName: 'श्री. मिलिंद नागवे',
      createdAt: `${today}T06:45:00.000Z`
    },
    {
      id: `MC-${today.replace(/-/g, '')}-002`,
      supplierId: 'JDK002',
      supplierName: 'तानाजी यशवंत जाधव',
      date: today,
      shift: 'morning',
      milkType: 'buffalo',
      quantity: 9.0,
      fat: 6.8,
      snf: 9.2,
      pricingMode: 'automatic',
      appliedRate: 67.60,
      totalAmount: 608.40,
      rateChartVersion: 'BUF-CHART-2026-V1',
      enteredByAdminId: 'ADM001',
      enteredByName: 'श्री. मिलिंद नागवे',
      createdAt: `${today}T07:10:00.000Z`
    },
    {
      id: `MC-${today.replace(/-/g, '')}-003`,
      supplierId: 'JDK003',
      supplierName: 'सुरेखा संभाजी खोत',
      date: today,
      shift: 'morning',
      milkType: 'cow',
      quantity: 15.0,
      fat: 4.1,
      snf: 8.7,
      pricingMode: 'automatic',
      appliedRate: 39.10,
      totalAmount: 586.50,
      rateChartVersion: 'COW-CHART-2026-V1',
      enteredByAdminId: 'ADM001',
      enteredByName: 'श्री. मिलिंद नागवे',
      createdAt: `${today}T07:35:00.000Z`
    },
    // Yesterday morning & evening
    {
      id: `MC-${yesterday.replace(/-/g, '')}-001`,
      supplierId: 'JDK001',
      supplierName: 'रमेश विठ्ठल पाटील',
      date: yesterday,
      shift: 'morning',
      milkType: 'cow',
      quantity: 12.0,
      fat: 3.7,
      snf: 8.5,
      pricingMode: 'automatic',
      appliedRate: 37.20,
      totalAmount: 446.40,
      rateChartVersion: 'COW-CHART-2026-V1',
      enteredByAdminId: 'ADM001',
      enteredByName: 'श्री. मिलिंद नागवे',
      createdAt: `${yesterday}T06:50:00.000Z`
    },
    {
      id: `MC-${yesterday.replace(/-/g, '')}-002`,
      supplierId: 'JDK001',
      supplierName: 'रमेश विठ्ठल पाटील',
      date: yesterday,
      shift: 'evening',
      milkType: 'cow',
      quantity: 11.5,
      fat: 3.8,
      snf: 8.6,
      pricingMode: 'automatic',
      appliedRate: 37.80,
      totalAmount: 434.70,
      rateChartVersion: 'COW-CHART-2026-V1',
      enteredByAdminId: 'ADM001',
      enteredByName: 'श्री. मिलिंद नागवे',
      createdAt: `${yesterday}T18:15:00.000Z`
    },
    {
      id: `MC-${yesterday.replace(/-/g, '')}-003`,
      supplierId: 'JDK002',
      supplierName: 'तानाजी यशवंत जाधव',
      date: yesterday,
      shift: 'morning',
      milkType: 'buffalo',
      quantity: 8.5,
      fat: 6.6,
      snf: 9.1,
      pricingMode: 'automatic',
      appliedRate: 66.00,
      totalAmount: 561.00,
      rateChartVersion: 'BUF-CHART-2026-V1',
      enteredByAdminId: 'ADM001',
      enteredByName: 'श्री. मिलिंद नागवे',
      createdAt: `${yesterday}T07:15:00.000Z`
    },
    {
      id: `MC-${yesterday.replace(/-/g, '')}-004`,
      supplierId: 'JDK002',
      supplierName: 'तानाजी यशवंत जाधव',
      date: yesterday,
      shift: 'evening',
      milkType: 'buffalo',
      quantity: 8.0,
      fat: 6.7,
      snf: 9.1,
      pricingMode: 'automatic',
      appliedRate: 66.60,
      totalAmount: 532.80,
      rateChartVersion: 'BUF-CHART-2026-V1',
      enteredByAdminId: 'ADM001',
      enteredByName: 'श्री. मिलिंद नागवे',
      createdAt: `${yesterday}T18:30:00.000Z`
    },
    {
      id: `MC-${yesterday.replace(/-/g, '')}-005`,
      supplierId: 'JDK004',
      supplierName: 'पांडुरंग बापू मोरे',
      date: yesterday,
      shift: 'morning',
      milkType: 'cow',
      quantity: 14.0,
      fat: 3.6,
      snf: 8.5,
      pricingMode: 'automatic',
      appliedRate: 36.85,
      totalAmount: 515.90,
      rateChartVersion: 'COW-CHART-2026-V1',
      enteredByAdminId: 'ADM001',
      enteredByName: 'श्री. मिलिंद नागवे',
      createdAt: `${yesterday}T07:45:00.000Z`
    },
    // Two days ago
    {
      id: `MC-${twoDaysAgo.replace(/-/g, '')}-001`,
      supplierId: 'JDK001',
      supplierName: 'रमेश विठ्ठल पाटील',
      date: twoDaysAgo,
      shift: 'morning',
      milkType: 'cow',
      quantity: 13.0,
      fat: 3.9,
      snf: 8.6,
      pricingMode: 'automatic',
      appliedRate: 38.15,
      totalAmount: 495.95,
      rateChartVersion: 'COW-CHART-2026-V1',
      enteredByAdminId: 'ADM001',
      enteredByName: 'श्री. मिलिंद नागवे',
      createdAt: `${twoDaysAgo}T06:55:00.000Z`
    }
  ];

  const payments: Payment[] = [
    {
      id: 'PAY-20260301-001',
      supplierId: 'JDK001',
      supplierName: 'रमेश विठ्ठल पाटील',
      amount: 1500.00,
      paymentDate: yesterday,
      paymentMethod: 'upi',
      transactionRef: 'UPI/604589214789',
      notes: '१० दिवसांचे दूध बिल अदा',
      isAdvance: false,
      recordedByAdminId: 'ADM001',
      recordedByName: 'श्री. मिलिंद नागवे',
      createdAt: `${yesterday}T11:30:00.000Z`
    },
    {
      id: 'PAY-20260301-002',
      supplierId: 'JDK002',
      supplierName: 'तानाजी यशवंत जाधव',
      amount: 2000.00,
      paymentDate: yesterday,
      paymentMethod: 'bank_transfer',
      transactionRef: 'NEFT/KDCC992145',
      notes: 'बँक खात्यावर थेट जमा',
      isAdvance: false,
      recordedByAdminId: 'ADM001',
      recordedByName: 'श्री. मिलिंद नागवे',
      createdAt: `${yesterday}T12:00:00.000Z`
    }
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'NOTIF-001',
      supplierId: 'all',
      title: 'नवीन दूध दर लागू',
      message: 'ज्योतिबा दूध संकलन केंद्रात गाय आणि म्हैस दूध दर पत्रक अद्ययावत करण्यात आले आहे.',
      type: 'system',
      isRead: false,
      createdAt: `${yesterday}T09:00:00.000Z`
    },
    {
      id: 'NOTIF-002',
      supplierId: 'JDK001',
      title: 'दूध संकलन नोंद',
      message: 'आज सकाळचे १२.५ लिटर गाय दूध (फॅट: ३.८, एसएनएफ: ८.६) नोंदवले गेले आहे. रक्कम: ₹४७२.५०',
      type: 'collection',
      isRead: false,
      createdAt: `${today}T06:45:00.000Z`
    },
    {
      id: 'NOTIF-003',
      supplierId: 'JDK001',
      title: 'पेमेंट जमा',
      message: 'तुमच्या खात्यात ₹१,५००.०० UPI द्वारे यशस्वीरीत्या जमा करण्यात आले आहेत.',
      type: 'payment',
      isRead: true,
      createdAt: `${yesterday}T11:30:00.000Z`
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'AUDIT-001',
      timestamp: new Date().toISOString(),
      adminId: 'ADM001',
      adminName: 'श्री. मिलिंद नागवे',
      action: 'SYSTEM_INITIALIZED',
      details: 'ज्योतिबा दूध संकलन केंद्र प्रणाली यशस्वीरीत्या सुरू करण्यात आली.'
    }
  ];

  return {
    suppliers,
    adminUsers,
    collections,
    cowRateCharts: [DEFAULT_COW_RATE],
    buffaloRateCharts: [DEFAULT_BUF_RATE],
    payments,
    notifications,
    auditLogs,
    settings: DEFAULT_SETTINGS
  };
}

class DairyStore {
  private data: DairyDatabase;

  constructor() {
    this.ensureDirExists();
    this.data = this.load();
  }

  private ensureDirExists() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DairyDatabase {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load database file, creating fresh initial database:', e);
    }
    const initial = getInitialDatabase();
    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(data: DairyDatabase) {
    try {
      this.ensureDirExists();
      const tmp = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      console.error('Error saving dairy db:', err);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  public getRawData(): DairyDatabase {
    return this.data;
  }

  public restore(data: DairyDatabase) {
    this.data = data;
    this.save();
  }

  // --- Suppliers ---
  public getSuppliers(): Supplier[] {
    return this.data.suppliers;
  }

  public getSupplierById(id: string): Supplier | undefined {
    return this.data.suppliers.find((s) => s.id.toUpperCase() === id.toUpperCase());
  }

  public getSupplierByEmail(email: string): Supplier | undefined {
    return this.data.suppliers.find((s) => s.email.toLowerCase() === email.toLowerCase());
  }

  public getNextSupplierId(): string {
    const nums = this.data.suppliers
      .map((s) => {
        const m = s.id.match(/^JDK(\d+)$/i);
        return m ? parseInt(m[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const max = nums.length > 0 ? Math.max(...nums) : 0;
    const next = max + 1;
    return `JDK${String(next).padStart(3, '0')}`;
  }

  public addSupplier(supplier: Supplier): Supplier {
    this.data.suppliers.push(supplier);
    this.save();
    return supplier;
  }

  public updateSupplier(id: string, updates: Partial<Supplier>): Supplier | null {
    const idx = this.data.suppliers.findIndex((s) => s.id.toUpperCase() === id.toUpperCase());
    if (idx === -1) return null;
    this.data.suppliers[idx] = { ...this.data.suppliers[idx], ...updates };
    this.save();
    return this.data.suppliers[idx];
  }

  // --- Admin Users ---
  public getAdminByEmail(email: string): AdminUser | undefined {
    return this.data.adminUsers.find((a) => a.email.toLowerCase() === email.toLowerCase());
  }

  public getAdminById(id: string): AdminUser | undefined {
    return this.data.adminUsers.find((a) => a.id === id);
  }

  // --- Milk Collections ---
  public getCollections(supplierId?: string): MilkCollection[] {
    if (supplierId) {
      return this.data.collections.filter((c) => c.supplierId.toUpperCase() === supplierId.toUpperCase());
    }
    return this.data.collections;
  }

  public addCollection(collection: MilkCollection): MilkCollection {
    this.data.collections.unshift(collection);
    this.save();
    return collection;
  }

  public updateCollection(id: string, updates: Partial<MilkCollection>): MilkCollection | null {
    const idx = this.data.collections.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.collections[idx] = {
      ...this.data.collections[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data.collections[idx];
  }

  public deleteCollection(id: string): boolean {
    const initialLen = this.data.collections.length;
    this.data.collections = this.data.collections.filter((c) => c.id !== id);
    if (this.data.collections.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // --- Rate Charts ---
  public getActiveRateChart(milkType: 'cow' | 'buffalo'): RateChartConfig {
    const list = milkType === 'cow' ? this.data.cowRateCharts : this.data.buffaloRateCharts;
    const active = list.find((c) => c.active);
    if (active) return active;
    return milkType === 'cow' ? DEFAULT_COW_RATE : DEFAULT_BUF_RATE;
  }

  public getAllRateCharts() {
    return {
      cow: this.data.cowRateCharts,
      buffalo: this.data.buffaloRateCharts
    };
  }

  public updateRateChart(milkType: 'cow' | 'buffalo', chart: RateChartConfig) {
    if (milkType === 'cow') {
      const idx = this.data.cowRateCharts.findIndex((c) => c.id === chart.id);
      if (idx >= 0) {
        this.data.cowRateCharts[idx] = chart;
      } else {
        this.data.cowRateCharts.push(chart);
      }
    } else {
      const idx = this.data.buffaloRateCharts.findIndex((c) => c.id === chart.id);
      if (idx >= 0) {
        this.data.buffaloRateCharts[idx] = chart;
      } else {
        this.data.buffaloRateCharts.push(chart);
      }
    }
    this.save();
  }

  // Calculate Rate based on configured chart
  public calculateRate(milkType: 'cow' | 'buffalo', fat: number, snf: number): {
    rate: number;
    chartVersion: string;
    details: string;
  } {
    const chart = this.getActiveRateChart(milkType);
    const fatDiff = Math.round((fat - chart.baseFat) * 10) / 10;
    const snfDiff = Math.round((snf - chart.baseSNF) * 10) / 10;

    const fatAdj = Math.round((fatDiff / 0.1) * chart.fatStep * 100) / 100;
    const snfAdj = Math.round((snfDiff / 0.1) * chart.snfStep * 100) / 100;

    let calculated = chart.baseRate + fatAdj + snfAdj;
    if (chart.minRate && calculated < chart.minRate) calculated = chart.minRate;
    if (chart.maxRate && calculated > chart.maxRate) calculated = chart.maxRate;

    calculated = Math.round(calculated * 100) / 100;

    const details = `बेस दर ₹${chart.baseRate.toFixed(2)} (${chart.baseFat}F/${chart.baseSNF}S) + फॅट फरक: ₹${fatAdj.toFixed(2)} + SNF फरक: ₹${snfAdj.toFixed(2)}`;

    return {
      rate: calculated,
      chartVersion: chart.version,
      details
    };
  }

  // --- Payments ---
  public getPayments(supplierId?: string): Payment[] {
    if (supplierId) {
      return this.data.payments.filter((p) => p.supplierId.toUpperCase() === supplierId.toUpperCase());
    }
    return this.data.payments;
  }

  public addPayment(payment: Payment): Payment {
    this.data.payments.unshift(payment);
    this.save();
    return payment;
  }

  // Financial Balance Calculation for a supplier
  public getSupplierFinancials(supplierId: string): {
    totalCollectionAmount: number;
    totalPaidAmount: number;
    remainingBalance: number;
    cowQuantity: number;
    buffaloQuantity: number;
    totalQuantity: number;
    avgFat: number;
    avgSNF: number;
  } {
    const collections = this.data.collections.filter(
      (c) => c.supplierId.toUpperCase() === supplierId.toUpperCase()
    );
    const payments = this.data.payments.filter(
      (p) => p.supplierId.toUpperCase() === supplierId.toUpperCase()
    );

    let totalCollectionAmount = 0;
    let cowQuantity = 0;
    let buffaloQuantity = 0;
    let totalFatPoints = 0;
    let totalSNFPoints = 0;

    for (const c of collections) {
      totalCollectionAmount += c.totalAmount;
      if (c.milkType === 'cow') {
        cowQuantity += c.quantity;
      } else {
        buffaloQuantity += c.quantity;
      }
      totalFatPoints += c.fat * c.quantity;
      totalSNFPoints += c.snf * c.quantity;
    }

    const totalQuantity = cowQuantity + buffaloQuantity;
    const avgFat = totalQuantity > 0 ? Math.round((totalFatPoints / totalQuantity) * 100) / 100 : 0;
    const avgSNF = totalQuantity > 0 ? Math.round((totalSNFPoints / totalQuantity) * 100) / 100 : 0;

    const totalPaidAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const remainingBalance = Math.round((totalCollectionAmount - totalPaidAmount) * 100) / 100;

    return {
      totalCollectionAmount: Math.round(totalCollectionAmount * 100) / 100,
      totalPaidAmount: Math.round(totalPaidAmount * 100) / 100,
      remainingBalance,
      cowQuantity: Math.round(cowQuantity * 100) / 100,
      buffaloQuantity: Math.round(buffaloQuantity * 100) / 100,
      totalQuantity: Math.round(totalQuantity * 100) / 100,
      avgFat,
      avgSNF
    };
  }

  // Overall Dairy Financial & Quantity Summary
  public getOverallSummary() {
    const today = new Date().toISOString().split('T')[0];
    const todayCollections = this.data.collections.filter((c) => c.date === today);

    let todayTotalQty = 0;
    let todayCowQty = 0;
    let todayBuffaloQty = 0;
    let todayAmount = 0;

    for (const c of todayCollections) {
      todayTotalQty += c.quantity;
      todayAmount += c.totalAmount;
      if (c.milkType === 'cow') todayCowQty += c.quantity;
      else todayBuffaloQty += c.quantity;
    }

    // Monthly stats
    const currentMonthPrefix = today.substring(0, 7); // YYYY-MM
    const monthCollections = this.data.collections.filter((c) => c.date.startsWith(currentMonthPrefix));
    let monthlyTotalQty = 0;
    let monthlyTotalAmount = 0;
    for (const c of monthCollections) {
      monthlyTotalQty += c.quantity;
      monthlyTotalAmount += c.totalAmount;
    }

    // All time totals
    let allTimeCollectionAmount = 0;
    for (const c of this.data.collections) {
      allTimeCollectionAmount += c.totalAmount;
    }
    const allTimePaidAmount = this.data.payments.reduce((sum, p) => sum + p.amount, 0);
    const outstandingBalances = Math.round((allTimeCollectionAmount - allTimePaidAmount) * 100) / 100;

    return {
      today: {
        totalQuantity: Math.round(todayTotalQty * 100) / 100,
        cowQuantity: Math.round(todayCowQty * 100) / 100,
        buffaloQuantity: Math.round(todayBuffaloQty * 100) / 100,
        totalAmount: Math.round(todayAmount * 100) / 100,
        entryCount: todayCollections.length
      },
      monthly: {
        totalQuantity: Math.round(monthlyTotalQty * 100) / 100,
        totalAmount: Math.round(monthlyTotalAmount * 100) / 100,
        monthName: currentMonthPrefix
      },
      financials: {
        totalPayable: Math.round(allTimeCollectionAmount * 100) / 100,
        totalPaid: Math.round(allTimePaidAmount * 100) / 100,
        outstandingBalance: outstandingBalances
      },
      supplierCounts: {
        total: this.data.suppliers.length,
        active: this.data.suppliers.filter((s) => s.status === 'active').length,
        pending: this.data.suppliers.filter((s) => s.status === 'pending').length
      }
    };
  }

  // --- Notifications ---
  public getNotifications(supplierId?: string): NotificationItem[] {
    if (supplierId) {
      return this.data.notifications.filter(
        (n) => n.supplierId === 'all' || n.supplierId.toUpperCase() === supplierId.toUpperCase()
      );
    }
    return this.data.notifications;
  }

  public addNotification(notification: NotificationItem): NotificationItem {
    this.data.notifications.unshift(notification);
    this.save();
    return notification;
  }

  public markNotificationAsRead(id: string) {
    const item = this.data.notifications.find((n) => n.id === id);
    if (item) {
      item.isRead = true;
      this.save();
    }
  }

  // --- Audit Logs ---
  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const entry: AuditLog = {
      id: `AUDIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...log
    };
    this.data.auditLogs.unshift(entry);
    // Keep last 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1000);
    }
    this.save();
  }

  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- Settings ---
  public getSettings(): DairySettings {
    return this.data.settings;
  }

  public updateSettings(settings: Partial<DairySettings>): DairySettings {
    this.data.settings = { ...this.data.settings, ...settings };
    this.save();
    return this.data.settings;
  }
}

export const dairyStore = new DairyStore();
