import { Router, Request, Response, NextFunction } from 'express';
import {
  dairyStore,
  hashPassword,
  generateToken,
  decodeToken
} from './db.js';
import { MilkType, ShiftType, PricingMode, PaymentMethod } from './types.js';

export const apiRouter = Router();

// Auth Middleware
export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'admin' | 'supplier';
    email: string;
    name: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }
  const token = header.substring(7);
  const decoded = decodeToken<any>(token);
  if (decoded && decoded.id && decoded.role) {
    req.user = decoded;
  }
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'केवळ प्रशासक (Admin) ला या कृतीची परवानगी आहे.' });
  }
  next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'कृपया लॉगिन करा.' });
  }
  next();
}

apiRouter.use(authMiddleware);

// ==========================================
// 1. AUTHENTICATION ROUTES
// ==========================================

// Register Supplier (Gmail registration)
apiRouter.post('/auth/register-supplier', (req: Request, res: Response) => {
  try {
    const { fullName, email, mobile, village, password, confirmPassword } = req.body;

    if (!fullName || !email || !mobile || !village || !password) {
      return res.status(400).json({ error: 'कृपया सर्व माहिती भरा.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'पासवर्ड आणि कन्फर्म पासवर्ड जुळत नाहीत.' });
    }

    if (!email.toLowerCase().endsWith('@gmail.com') && !email.includes('@')) {
      return res.status(400).json({ error: 'कृपया वैध ईमेल (Gmail) पत्ता टाका.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = dairyStore.getSupplierByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'हा ईमेल आधीच नोंदणीकृत आहे.' });
    }

    const existingMobile = dairyStore.getSuppliers().find((s) => s.mobile === mobile.trim());
    if (existingMobile) {
      return res.status(400).json({ error: 'हा मोबाईल क्रमांक आधीच नोंदणीकृत आहे.' });
    }

    const newId = dairyStore.getNextSupplierId();
    const passwordHash = hashPassword(password);
    const settings = dairyStore.getSettings();

    const supplier = dairyStore.addSupplier({
      id: newId,
      fullName: fullName.trim(),
      email: cleanEmail,
      mobile: mobile.trim(),
      village: village.trim(),
      passwordHash,
      isVerified: true, // Auto-verified with verification notification
      isApproved: settings.autoApproveSuppliers,
      status: settings.autoApproveSuppliers ? 'active' : 'pending',
      createdAt: new Date().toISOString()
    });

    dairyStore.addNotification({
      id: `NOTIF-${Date.now()}`,
      supplierId: newId,
      title: 'नोंदणी यशस्वी!',
      message: `ज्योतिबा दूध संकलन केंद्रात आपले स्वागत आहे. आपला ग्राहक क्र. (Supplier ID) ${newId} आहे.`,
      type: 'system',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    dairyStore.addAuditLog({
      adminId: 'SYSTEM',
      adminName: 'Online Registration',
      action: 'SUPPLIER_REGISTERED',
      details: `नवीन दूध उत्पादक नोंदणी: ${supplier.fullName} (${supplier.id})`
    });

    const token = generateToken({
      id: supplier.id,
      role: 'supplier',
      email: supplier.email,
      name: supplier.fullName
    });

    res.json({
      success: true,
      message: 'नोंदणी यशस्वी झाली!',
      supplier: {
        id: supplier.id,
        fullName: supplier.fullName,
        email: supplier.email,
        mobile: supplier.mobile,
        village: supplier.village,
        status: supplier.status,
        isVerified: supplier.isVerified,
        isApproved: supplier.isApproved
      },
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'नोंदणी करताना त्रुटी आली.' });
  }
});

// Login Supplier
apiRouter.post('/auth/login-supplier', (req: Request, res: Response) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) {
    return res.status(400).json({ error: 'कृपया ग्राहक क्र. / ईमेल आणि पासवर्ड टाका.' });
  }

  const clean = identifier.trim().toLowerCase();
  const suppliers = dairyStore.getSuppliers();
  const supplier = suppliers.find(
    (s) => s.id.toLowerCase() === clean || s.email.toLowerCase() === clean || s.mobile === clean
  );

  if (!supplier) {
    return res.status(401).json({ error: 'ग्राहक क्र. किंवा ईमेल सापडला नाही.' });
  }

  const hash = hashPassword(password);
  if (supplier.passwordHash !== hash) {
    return res.status(401).json({ error: 'चुकीचा पासवर्ड. कृपया पुन्हा प्रयत्न करा.' });
  }

  if (supplier.status === 'suspended') {
    return res.status(403).json({ error: 'आपले खाते तात्पुरते स्थगित करण्यात आले आहे. डेअरी प्रशासनाशी संपर्क साधा.' });
  }

  const token = generateToken({
    id: supplier.id,
    role: 'supplier',
    email: supplier.email,
    name: supplier.fullName
  });

  res.json({
    success: true,
    user: {
      id: supplier.id,
      fullName: supplier.fullName,
      email: supplier.email,
      mobile: supplier.mobile,
      village: supplier.village,
      status: supplier.status,
      role: 'supplier',
      isApproved: supplier.isApproved
    },
    token
  });
});

// Login Admin
apiRouter.post('/auth/login-admin', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'कृपया प्रशासक ईमेल आणि पासवर्ड टाका.' });
  }

  const clean = email.trim().toLowerCase();
  const admin = dairyStore.getAdminByEmail(clean);
  if (!admin) {
    return res.status(401).json({ error: 'अनधिकृत प्रशासक ईमेल पत्ता.' });
  }

  const hash = hashPassword(password);
  if (admin.passwordHash !== hash) {
    return res.status(401).json({ error: 'चुकीचा प्रशासक पासवर्ड.' });
  }

  const token = generateToken({
    id: admin.id,
    role: 'admin',
    email: admin.email,
    name: admin.fullName
  });

  dairyStore.addAuditLog({
    adminId: admin.id,
    adminName: admin.fullName,
    action: 'ADMIN_LOGIN',
    details: `प्रशासक लॉगिन यशस्वी: ${admin.email}`
  });

  res.json({
    success: true,
    user: {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: 'admin',
      mobile: admin.mobile
    },
    token
  });
});

// Current Authenticated User Info
apiRouter.get('/auth/me', (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ user: null });
  }
  if (req.user.role === 'admin') {
    const admin = dairyStore.getAdminById(req.user.id);
    if (!admin) return res.status(401).json({ user: null });
    return res.json({
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: 'admin',
        mobile: admin.mobile
      }
    });
  } else {
    const supplier = dairyStore.getSupplierById(req.user.id);
    if (!supplier) return res.status(401).json({ user: null });
    return res.json({
      user: {
        id: supplier.id,
        fullName: supplier.fullName,
        email: supplier.email,
        mobile: supplier.mobile,
        village: supplier.village,
        status: supplier.status,
        role: 'supplier',
        isApproved: supplier.isApproved
      }
    });
  }
});

// ==========================================
// 2. SUPPLIER MANAGEMENT (ADMIN + SELF)
// ==========================================

// List all suppliers (Admin only)
apiRouter.get('/suppliers', requireAdmin, (req: Request, res: Response) => {
  const query = (req.query.q as string || '').toLowerCase().trim();
  let suppliers = dairyStore.getSuppliers();

  if (query) {
    suppliers = suppliers.filter(
      (s) =>
        s.id.toLowerCase().includes(query) ||
        s.fullName.toLowerCase().includes(query) ||
        s.mobile.includes(query) ||
        s.village.toLowerCase().includes(query)
    );
  }

  // Attach quick financial balances
  const enriched = suppliers.map((s) => {
    const fin = dairyStore.getSupplierFinancials(s.id);
    return {
      ...s,
      financials: fin
    };
  });

  res.json({ suppliers: enriched });
});

// Get single supplier
apiRouter.get('/suppliers/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  // Security check: supplier can only view their own record
  if (req.user?.role === 'supplier' && req.user.id.toUpperCase() !== id.toUpperCase()) {
    return res.status(403).json({ error: 'तुम्हाला फक्त स्वतःचा डेटा पाहण्याची परवानगी आहे.' });
  }

  const supplier = dairyStore.getSupplierById(id);
  if (!supplier) {
    return res.status(404).json({ error: 'उत्पादक सापडला नाही.' });
  }
  const fin = dairyStore.getSupplierFinancials(id);
  res.json({ supplier, financials: fin });
});

// Admin creates supplier directly
apiRouter.post('/suppliers', requireAdmin, (req: AuthRequest, res: Response) => {
  const { fullName, email, mobile, village, password, bankDetails } = req.body;
  if (!fullName || !mobile || !village) {
    return res.status(400).json({ error: 'कृपया नाव, मोबाईल आणि गाव भरा.' });
  }

  const newId = dairyStore.getNextSupplierId();
  const rawPass = password || 'farmer123';
  const supplier = dairyStore.addSupplier({
    id: newId,
    fullName: fullName.trim(),
    email: (email || `${newId.toLowerCase()}@jyotibadairy.com`).toLowerCase().trim(),
    mobile: mobile.trim(),
    village: village.trim(),
    passwordHash: hashPassword(rawPass),
    isVerified: true,
    isApproved: true,
    status: 'active',
    createdAt: new Date().toISOString(),
    bankDetails
  });

  dairyStore.addAuditLog({
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'SUPPLIER_CREATED_BY_ADMIN',
    details: `प्रशासकाने नवीन उत्पादक जोडला: ${supplier.fullName} (${supplier.id})`
  });

  res.json({ success: true, supplier });
});

// Update supplier
apiRouter.put('/suppliers/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const isSuperAdmin = req.user?.role === 'admin';
  const isSelf = req.user?.role === 'supplier' && req.user.id.toUpperCase() === id.toUpperCase();

  if (!isSuperAdmin && !isSelf) {
    return res.status(403).json({ error: 'या बदलावासाठी परवानगी नाही.' });
  }

  const updates: any = {};
  if (req.body.fullName) updates.fullName = req.body.fullName.trim();
  if (req.body.mobile) updates.mobile = req.body.mobile.trim();
  if (req.body.village) updates.village = req.body.village.trim();
  if (req.body.bankDetails) updates.bankDetails = req.body.bankDetails;

  // Only admin can change status or approval
  if (isSuperAdmin) {
    if (req.body.status) updates.status = req.body.status;
    if (typeof req.body.isApproved === 'boolean') updates.isApproved = req.body.isApproved;
  }

  if (req.body.newPassword) {
    updates.passwordHash = hashPassword(req.body.newPassword);
  }

  const updated = dairyStore.updateSupplier(id, updates);
  if (!updated) {
    return res.status(404).json({ error: 'उत्पादक सापडला नाही.' });
  }

  if (isSuperAdmin) {
    dairyStore.addAuditLog({
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: 'SUPPLIER_UPDATED',
      details: `उत्पादक माहिती अद्ययावत: ${updated.fullName} (${updated.id})`
    });
  }

  res.json({ success: true, supplier: updated });
});

// ==========================================
// 3. MILK COLLECTION ENTRY SYSTEM (ADMIN ONLY)
// ==========================================

// Get collections
apiRouter.get('/collections', requireAuth, (req: AuthRequest, res: Response) => {
  const isSupplier = req.user?.role === 'supplier';
  // If supplier, force supplierId to user's id
  const supplierId = isSupplier ? req.user!.id : (req.query.supplierId as string);

  let list = dairyStore.getCollections(supplierId);

  // Filters
  const { date, shift, milkType, startDate, endDate } = req.query;
  if (date) {
    list = list.filter((c) => c.date === date);
  }
  if (shift) {
    list = list.filter((c) => c.shift === shift);
  }
  if (milkType) {
    list = list.filter((c) => c.milkType === milkType);
  }
  if (startDate && endDate) {
    list = list.filter((c) => c.date >= (startDate as string) && c.date <= (endDate as string));
  }

  res.json({ collections: list });
});

// Rate preview calculation helper
apiRouter.post('/rates/calculate', (req: Request, res: Response) => {
  const { milkType, fat, snf } = req.body;
  if (!milkType || fat === undefined || snf === undefined) {
    return res.status(400).json({ error: 'कृपया दूध प्रकार, फॅट आणि एसएनएफ द्या.' });
  }
  const calc = dairyStore.calculateRate(milkType as MilkType, Number(fat), Number(snf));
  res.json(calc);
});

// Add Milk Collection (ADMIN ONLY)
apiRouter.post('/collections', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const {
      supplierId,
      date,
      shift,
      milkType,
      quantity,
      fat,
      snf,
      pricingMode,
      manualRate,
      notes
    } = req.body;

    if (!supplierId || !date || !shift || !milkType || !quantity) {
      return res.status(400).json({ error: 'कृपया सर्व आवश्यक रकाने भरा.' });
    }

    const supplier = dairyStore.getSupplierById(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'हा ग्राहक क्र. (Supplier ID) डेअरीमध्ये नोंदणीकृत नाही.' });
    }

    if (supplier.status !== 'active') {
      return res.status(400).json({ error: 'या उत्पादकाचे खाते सक्रिय नाही.' });
    }

    // Check duplicate entry for same date, shift, and milkType
    const existingList = dairyStore.getCollections(supplierId);
    const duplicate = existingList.find(
      (c) => c.date === date && c.shift === shift && c.milkType === milkType
    );
    if (duplicate) {
      return res.status(409).json({
        error: `या उत्पादकाचे ${date} रोजी ${shift === 'morning' ? 'सकाळ' : 'संध्याकाळ'} सत्राचे ${milkType === 'cow' ? 'गाय' : 'म्हैस'} दूध आधीच नोंदवले आहे (नोंद क्र: ${duplicate.id}).`
      });
    }

    const qty = Number(quantity);
    const fatVal = Number(fat || 0);
    const snfVal = Number(snf || 0);

    let appliedRate = 0;
    let rateChartVersion = undefined;

    if (pricingMode === 'manual') {
      if (!manualRate || Number(manualRate) <= 0) {
        return res.status(400).json({ error: 'कृपया मॅन्युअल दर टाका.' });
      }
      appliedRate = Math.round(Number(manualRate) * 100) / 100;
    } else {
      // Automatic Rate Chart calculation
      const calculated = dairyStore.calculateRate(milkType as MilkType, fatVal, snfVal);
      appliedRate = calculated.rate;
      rateChartVersion = calculated.chartVersion;
    }

    const totalAmount = Math.round(qty * appliedRate * 100) / 100;
    const cleanDate = date.replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const id = `MC-${cleanDate}-${rand}`;

    const collection = dairyStore.addCollection({
      id,
      supplierId: supplier.id,
      supplierName: supplier.fullName,
      date,
      shift: shift as ShiftType,
      milkType: milkType as MilkType,
      quantity: qty,
      fat: fatVal,
      snf: snfVal,
      pricingMode: (pricingMode || 'automatic') as PricingMode,
      appliedRate,
      totalAmount,
      rateChartVersion,
      enteredByAdminId: req.user!.id,
      enteredByName: req.user!.name,
      notes,
      createdAt: new Date().toISOString()
    });

    // Notify supplier in-app
    const shiftLabel = shift === 'morning' ? 'सकाळ' : 'संध्याकाळ';
    const milkLabel = milkType === 'cow' ? 'गाय' : 'म्हैस';
    dairyStore.addNotification({
      id: `NOTIF-${Date.now()}`,
      supplierId: supplier.id,
      title: 'नवीन दूध संकलन नोंद',
      message: `${date} (${shiftLabel}): ${qty} लिटर ${milkLabel} दूध (फॅट: ${fatVal}, SNF: ${snfVal}) नोंदवले. दर: ₹${appliedRate}/ली, एकूण रक्कम: ₹${totalAmount}`,
      type: 'collection',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    // Audit log
    dairyStore.addAuditLog({
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: 'COLLECTION_ADDED',
      details: `${collection.supplierName} (${collection.supplierId}): ${collection.quantity}L ${milkLabel} @ ₹${appliedRate} = ₹${totalAmount}`
    });

    res.json({ success: true, collection });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'नोंद साठवताना त्रुटी आली.' });
  }
});

// Update Milk Collection (ADMIN ONLY)
apiRouter.put('/collections/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { quantity, fat, snf, pricingMode, appliedRate, notes } = req.body;

  const collections = dairyStore.getCollections();
  const existing = collections.find((c) => c.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'दूध संकलन नोंद सापडली नाही.' });
  }

  const qty = quantity !== undefined ? Number(quantity) : existing.quantity;
  const fatVal = fat !== undefined ? Number(fat) : existing.fat;
  const snfVal = snf !== undefined ? Number(snf) : existing.snf;
  const mode = pricingMode || existing.pricingMode;

  let finalRate = existing.appliedRate;
  let chartVersion = existing.rateChartVersion;

  if (mode === 'manual' && appliedRate !== undefined) {
    finalRate = Number(appliedRate);
  } else if (mode === 'automatic') {
    const calc = dairyStore.calculateRate(existing.milkType, fatVal, snfVal);
    finalRate = calc.rate;
    chartVersion = calc.chartVersion;
  }

  const totalAmount = Math.round(qty * finalRate * 100) / 100;

  const updated = dairyStore.updateCollection(id, {
    quantity: qty,
    fat: fatVal,
    snf: snfVal,
    pricingMode: mode,
    appliedRate: finalRate,
    totalAmount,
    rateChartVersion: chartVersion,
    notes: notes !== undefined ? notes : existing.notes
  });

  dairyStore.addNotification({
    id: `NOTIF-${Date.now()}`,
    supplierId: existing.supplierId,
    title: 'दूध संकलन नोंद दुरुस्ती',
    message: `${existing.date} ची नोंद दुरुस्त करण्यात आली आहे. नवीन प्रमाण: ${qty} लिटर, एकूण: ₹${totalAmount}`,
    type: 'collection',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  dairyStore.addAuditLog({
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'COLLECTION_UPDATED',
    details: `नोंद क्र. ${id} दुरुस्त केली: ${qty}L @ ₹${finalRate}`
  });

  res.json({ success: true, collection: updated });
});

// Delete Milk Collection (ADMIN ONLY)
apiRouter.delete('/collections/:id', requireAdmin, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const collections = dairyStore.getCollections();
  const existing = collections.find((c) => c.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'नोंद सापडली नाही.' });
  }

  dairyStore.deleteCollection(id);

  dairyStore.addAuditLog({
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'COLLECTION_DELETED',
    details: `नोंद क्र. ${id} वगळण्यात आली (${existing.supplierName}, ${existing.quantity}L)`
  });

  res.json({ success: true, message: 'नोंद यशस्वीरीत्या वगळली.' });
});

// ==========================================
// 4. RATE CHART MANAGEMENT
// ==========================================

apiRouter.get('/rates', (req: Request, res: Response) => {
  res.json(dairyStore.getAllRateCharts());
});

apiRouter.put('/rates', requireAdmin, (req: AuthRequest, res: Response) => {
  const { milkType, chart } = req.body;
  if (!milkType || !chart) {
    return res.status(400).json({ error: 'दर पत्रक माहिती अपूर्ण आहे.' });
  }

  dairyStore.updateRateChart(milkType, chart);

  dairyStore.addAuditLog({
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'RATE_CHART_UPDATED',
    details: `${milkType === 'cow' ? 'गाय' : 'म्हैस'} दूध दर पत्रक अद्ययावत: आवृत्ती ${chart.version}, बेस दर ₹${chart.baseRate}`
  });

  // Notify all suppliers
  dairyStore.addNotification({
    id: `NOTIF-${Date.now()}`,
    supplierId: 'all',
    title: 'दूध दर पत्रक बदल',
    message: `${milkType === 'cow' ? 'गाय' : 'म्हैस'} दूध दरांचे नवीन पत्रक (${chart.version}) लागू करण्यात आले आहे.`,
    type: 'system',
    isRead: false,
    createdAt: new Date().toISOString()
  });

  res.json({ success: true, charts: dairyStore.getAllRateCharts() });
});

// ==========================================
// 5. PAYMENT MANAGEMENT
// ==========================================

apiRouter.get('/payments', requireAuth, (req: AuthRequest, res: Response) => {
  const isSupplier = req.user?.role === 'supplier';
  const supplierId = isSupplier ? req.user!.id : (req.query.supplierId as string);
  const list = dairyStore.getPayments(supplierId);
  res.json({ payments: list });
});

apiRouter.post('/payments', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const { supplierId, amount, paymentDate, paymentMethod, transactionRef, notes, isAdvance } = req.body;

    if (!supplierId || !amount || !paymentDate || !paymentMethod) {
      return res.status(400).json({ error: 'कृपया सर्व माहिती भरा.' });
    }

    const supplier = dairyStore.getSupplierById(supplierId);
    if (!supplier) {
      return res.status(404).json({ error: 'उत्पादक सापडला नाही.' });
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      return res.status(400).json({ error: 'कृपया वैध रक्कम टाका.' });
    }

    const fin = dairyStore.getSupplierFinancials(supplierId);

    // Business check: payment cannot exceed outstanding balance unless advance is explicitly authorized
    if (!isAdvance && payAmount > fin.remainingBalance && fin.remainingBalance > 0) {
      return res.status(400).json({
        error: `देय शिल्लक रकमेपेक्षा (₹${fin.remainingBalance.toFixed(2)}) जास्त रक्कम देता येत नाही. आगाऊ रक्कम (Advance) देण्यासाठी कृपया 'आगाऊ उचल' पर्याय निवडा.`
      });
    }

    const cleanDate = paymentDate.replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const id = `PAY-${cleanDate}-${rand}`;

    const payment = dairyStore.addPayment({
      id,
      supplierId: supplier.id,
      supplierName: supplier.fullName,
      amount: Math.round(payAmount * 100) / 100,
      paymentDate,
      paymentMethod: paymentMethod as PaymentMethod,
      transactionRef: transactionRef || '',
      notes,
      isAdvance: Boolean(isAdvance),
      recordedByAdminId: req.user!.id,
      recordedByName: req.user!.name,
      createdAt: new Date().toISOString()
    });

    const methodLabels: Record<string, string> = {
      cash: 'रोख',
      upi: 'UPI / गुगल पे',
      bank_transfer: 'बँक ट्रान्सफर (NEFT)',
      cheque: 'धनादेश (Cheque)',
      other: 'इतर'
    };

    dairyStore.addNotification({
      id: `NOTIF-${Date.now()}`,
      supplierId: supplier.id,
      title: 'पेमेंट जमा',
      message: `${paymentDate} रोजी ₹${payAmount.toFixed(2)} रक्कम (${methodLabels[paymentMethod] || paymentMethod}) जमा करण्यात आली आहे.`,
      type: 'payment',
      isRead: false,
      createdAt: new Date().toISOString()
    });

    dairyStore.addAuditLog({
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: 'PAYMENT_RECORDED',
      details: `${payment.supplierName} (${payment.supplierId}): रक्कम ₹${payment.amount} (${payment.paymentMethod})`
    });

    const updatedFin = dairyStore.getSupplierFinancials(supplierId);
    res.json({ success: true, payment, financials: updatedFin });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'पेमेंट नोंदवताना त्रुटी आली.' });
  }
});

// ==========================================
// 6. REPORTS & ANALYTICS
// ==========================================

// Dashboard overall metrics
apiRouter.get('/reports/dashboard', requireAdmin, (req: Request, res: Response) => {
  const summary = dairyStore.getOverallSummary();
  res.json(summary);
});

// Supplier Statement Data
apiRouter.get('/reports/supplier-statement', requireAuth, (req: AuthRequest, res: Response) => {
  const { supplierId, startDate, endDate, month } = req.query;
  const targetId = (req.user?.role === 'supplier' ? req.user.id : supplierId) as string;

  if (!targetId) {
    return res.status(400).json({ error: 'कृपया उत्पादक निवडा.' });
  }

  const supplier = dairyStore.getSupplierById(targetId);
  if (!supplier) {
    return res.status(404).json({ error: 'उत्पादक सापडला नाही.' });
  }

  let collections = dairyStore.getCollections(targetId);
  let payments = dairyStore.getPayments(targetId);

  if (month) {
    collections = collections.filter((c) => c.date.startsWith(month as string));
    payments = payments.filter((p) => p.paymentDate.startsWith(month as string));
  } else if (startDate && endDate) {
    collections = collections.filter((c) => c.date >= (startDate as string) && c.date <= (endDate as string));
    payments = payments.filter((p) => p.paymentDate >= (startDate as string) && p.paymentDate <= (endDate as string));
  }

  // Summary computations
  let cowQty = 0;
  let bufQty = 0;
  let totalAmount = 0;
  let totalFatPoints = 0;
  let totalSNFPoints = 0;

  for (const c of collections) {
    totalAmount += c.totalAmount;
    if (c.milkType === 'cow') cowQty += c.quantity;
    else bufQty += c.quantity;
    totalFatPoints += c.fat * c.quantity;
    totalSNFPoints += c.snf * c.quantity;
  }

  const totalQty = cowQty + bufQty;
  const avgFat = totalQty > 0 ? Math.round((totalFatPoints / totalQty) * 100) / 100 : 0;
  const avgSNF = totalQty > 0 ? Math.round((totalSNFPoints / totalQty) * 100) / 100 : 0;
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const allTimeFin = dairyStore.getSupplierFinancials(targetId);

  res.json({
    supplier: {
      id: supplier.id,
      fullName: supplier.fullName,
      village: supplier.village,
      mobile: supplier.mobile,
      bankDetails: supplier.bankDetails
    },
    period: {
      month: month || null,
      startDate: startDate || null,
      endDate: endDate || null
    },
    summary: {
      cowQuantity: Math.round(cowQty * 100) / 100,
      buffaloQuantity: Math.round(bufQty * 100) / 100,
      totalQuantity: Math.round(totalQty * 100) / 100,
      avgFat,
      avgSNF,
      totalAmount: Math.round(totalAmount * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      periodBalance: Math.round((totalAmount - totalPaid) * 100) / 100,
      lifetimeBalance: allTimeFin.remainingBalance
    },
    collections,
    payments,
    settings: dairyStore.getSettings()
  });
});

// Daily register sheet for admin
apiRouter.get('/reports/daily-sheet', requireAdmin, (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
  const collections = dairyStore.getCollections().filter((c) => c.date === date);

  const morning = collections.filter((c) => c.shift === 'morning');
  const evening = collections.filter((c) => c.shift === 'evening');

  res.json({
    date,
    morning,
    evening,
    totalRecords: collections.length
  });
});

// ==========================================
// 7. NOTIFICATIONS
// ==========================================

apiRouter.get('/notifications', requireAuth, (req: AuthRequest, res: Response) => {
  const targetId = req.user?.role === 'supplier' ? req.user.id : undefined;
  const list = dairyStore.getNotifications(targetId);
  res.json({ notifications: list });
});

apiRouter.patch('/notifications/:id/read', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  dairyStore.markNotificationAsRead(id);
  res.json({ success: true });
});

// ==========================================
// 8. AUDIT LOGS & SETTINGS
// ==========================================

apiRouter.get('/audit-logs', requireAdmin, (req: Request, res: Response) => {
  res.json({ logs: dairyStore.getAuditLogs() });
});

apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json({ settings: dairyStore.getSettings() });
});

apiRouter.put('/settings', requireAdmin, (req: AuthRequest, res: Response) => {
  const updated = dairyStore.updateSettings(req.body);
  dairyStore.addAuditLog({
    adminId: req.user!.id,
    adminName: req.user!.name,
    action: 'SETTINGS_UPDATED',
    details: 'डेअरी प्रणाली सेटिंग्ज अद्ययावत केली'
  });
  res.json({ success: true, settings: updated });
});

// Database Backup Export (Admin only)
apiRouter.get('/backup/export', requireAdmin, (req: Request, res: Response) => {
  const raw = dairyStore.getRawData();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="jyotiba_dairy_backup_${Date.now()}.json"`);
  res.send(JSON.stringify(raw, null, 2));
});

// Database Restore (Admin only)
apiRouter.post('/backup/import', requireAdmin, (req: AuthRequest, res: Response) => {
  try {
    const data = req.body;
    if (!data.suppliers || !data.collections || !data.adminUsers) {
      return res.status(400).json({ error: 'अवैध डेटाबेस बॅकअप फाईल.' });
    }
    dairyStore.restore(data);
    dairyStore.addAuditLog({
      adminId: req.user!.id,
      adminName: req.user!.name,
      action: 'DATABASE_RESTORED',
      details: 'प्रणाली डेटाबेस यशस्वीरीत्या पूर्ववत केला.'
    });
    res.json({ success: true, message: 'डेटाबेस पूर्ववत केला.' });
  } catch (err: any) {
    res.status(500).json({ error: 'डेटाबेस लोड करताना त्रुटी आली.' });
  }
});
