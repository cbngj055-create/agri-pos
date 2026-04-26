import { create } from 'zustand';
import {
  initDatabase,
  insertRow,
  updateRow,
  softDeleteRow,
  getAllRows,
  getRow,
  generateId,
  nowTimestamp,
  getSyncMeta,
} from '../db/database.js';

export interface Product {
  id: string;
  name: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  category: string;
  unit: string;
  expiryDate?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  balance: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  company: string;
  balance: number;
}

export interface Payment {
  id: string;
  date: string;
  entityId: string;
  entityType: 'customer' | 'supplier';
  amount: number;
  paymentMethod: 'cash' | 'check' | 'bank_transfer';
  type: 'payment_in' | 'payment_out';
  notes: string;
  checkNumber?: string;
  checkDate?: string;
  checkStatus?: 'pending' | 'cleared' | 'bounced';
}

export interface Sale {
  id: string;
  date: string;
  items: { product?: any; productId?: string; quantity?: number; qty?: number; price?: number; buyPrice?: number }[];
  total: number;
  customerId?: string;
  type: 'cash' | 'credit';
  paidAmount?: number;
}

export interface Purchase {
  id: string;
  date: string;
  items: { product?: any; productId?: string; quantity?: number; qty?: number; price?: number; buyPrice?: number }[];
  total: number;
  supplierId?: string;
  type: 'cash' | 'credit';
  paidAmount?: number;
}

export interface Expense {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
}

export interface Prescription {
  id: string;
  cropName: string;
  title: string;
  details: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  salary: number;
  joinDate: string;
}

// --- Mappers: SQLite snake_case ↔ App camelCase ---

function mapProductRow(row: any): Product {
  return {
    id: row.id, name: row.name, barcode: row.barcode || '',
    purchasePrice: Number(row.purchase_price) || 0, salePrice: Number(row.sale_price) || 0,
    stock: Number(row.stock) || 0, category: row.category || '',
    unit: row.unit || 'piece', expiryDate: row.expiry_date || undefined,
  };
}
function mapCustomerRow(row: any): Customer {
  return { id: row.id, name: row.name, phone: row.phone || '', address: row.address || '', balance: Number(row.balance) || 0 };
}
function mapSupplierRow(row: any): Supplier {
  return { id: row.id, name: row.name, phone: row.phone || '', company: row.company || '', balance: Number(row.balance) || 0 };
}
function mapPaymentRow(row: any): Payment {
  return {
    id: row.id, date: row.date, entityId: row.entity_id, entityType: row.entity_type,
    amount: Number(row.amount) || 0, paymentMethod: row.payment_method, type: row.type,
    notes: row.notes || '', checkNumber: row.check_number || undefined,
    checkDate: row.check_date || undefined, checkStatus: row.check_status || undefined,
  };
}
function mapExpenseRow(row: any): Expense {
  return { id: row.id, date: row.date, amount: Number(row.amount) || 0, category: row.category || '', description: row.description || '' };
}
function mapEmployeeRow(row: any): Employee {
  return { id: row.id, name: row.name, role: row.role || '', phone: row.phone || '', salary: Number(row.salary) || 0, joinDate: row.join_date || '' };
}
function mapPrescriptionRow(row: any): Prescription {
  return { id: row.id, cropName: row.crop_name, title: row.title, details: row.details || '', createdAt: String(row.created_at), updatedAt: String(row.updated_at) };
}

function toProductRow(p: Product): Record<string, any> {
  return { id: p.id, name: p.name, barcode: p.barcode, purchase_price: p.purchasePrice, sale_price: p.salePrice, stock: p.stock, category: p.category, unit: p.unit, expiry_date: p.expiryDate || null, store_id: getSyncMeta('store_id') || '' };
}
function toCustomerRow(c: Customer): Record<string, any> {
  return { id: c.id, name: c.name, phone: c.phone, address: c.address, balance: c.balance, store_id: getSyncMeta('store_id') || '' };
}
function toSupplierRow(s: Supplier): Record<string, any> {
  return { id: s.id, name: s.name, phone: s.phone, company: s.company, balance: s.balance, store_id: getSyncMeta('store_id') || '' };
}
function toPaymentRow(p: Payment): Record<string, any> {
  return { id: p.id, date: p.date, entity_id: p.entityId, entity_type: p.entityType, amount: p.amount, payment_method: p.paymentMethod, type: p.type, notes: p.notes, check_number: p.checkNumber || null, check_date: p.checkDate || null, check_status: p.checkStatus || null, store_id: getSyncMeta('store_id') || '' };
}
function toExpenseRow(e: Expense): Record<string, any> {
  return { id: e.id, date: e.date, amount: e.amount, category: e.category, description: e.description, store_id: getSyncMeta('store_id') || '' };
}
function toEmployeeRow(e: Employee): Record<string, any> {
  return { id: e.id, name: e.name, role: e.role, phone: e.phone, salary: e.salary, join_date: e.joinDate, store_id: getSyncMeta('store_id') || '' };
}
function toPrescriptionRow(p: Prescription): Record<string, any> {
  return { id: p.id, crop_name: p.cropName, title: p.title, details: p.details, store_id: getSyncMeta('store_id') || '' };
}

// --- Load all data from SQLite ---

function loadAllFromSQLite() {
  let products: Product[] = [];
  let customers: Customer[] = [];
  let suppliers: Supplier[] = [];
  let sales: Sale[] = [];
  let purchases: Purchase[] = [];
  let expenses: Expense[] = [];
  let employees: Employee[] = [];
  let payments: Payment[] = [];
  let prescriptions: Prescription[] = [];

  try {
    products = getAllRows('products').map(mapProductRow);
    customers = getAllRows('customers').map(mapCustomerRow);
    suppliers = getAllRows('suppliers').map(mapSupplierRow);
    payments = getAllRows('payments').map(mapPaymentRow);
    expenses = getAllRows('expenses').map(mapExpenseRow);
    employees = getAllRows('employees').map(mapEmployeeRow);
    prescriptions = getAllRows('prescriptions').map(mapPrescriptionRow);

    const allOrders = getAllRows('orders');
    const allOrderItems = getAllRows('order_items');

    for (const order of allOrders) {
      const items = allOrderItems
        .filter((item: any) => item.order_id === order.id)
        .map((item: any) => ({
          productId: item.product_id,
          quantity: Number(item.quantity) || 0,
          price: Number(item.price) || 0,
          buyPrice: Number(item.buy_price) || 0,
        }));

      if (order.type === 'sale') {
        sales.push({
          id: order.id, date: order.date, items,
          total: Number(order.total) || 0,
          customerId: order.entity_id || undefined,
          type: order.payment_type === 'cash' ? 'cash' : 'credit',
          paidAmount: Number(order.paid_amount) || 0,
        } as Sale);
      } else {
        purchases.push({
          id: order.id, date: order.date, items,
          total: Number(order.total) || 0,
          supplierId: order.entity_id || undefined,
          type: order.payment_type === 'cash' ? 'cash' : 'credit',
          paidAmount: Number(order.paid_amount) || 0,
        } as Purchase);
      }
    }

    sales.reverse();
    purchases.reverse();
    payments.reverse();
    expenses.reverse();
    prescriptions.reverse();
  } catch (err) {
    console.error('Error loading from SQLite:', err);
  }

  return { products, customers, suppliers, sales, purchases, expenses, employees, payments, prescriptions };
}

// --- Store ---

interface AppState {
  dbReady: boolean;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  employees: Employee[];
  payments: Payment[];
  prescriptions: Prescription[];

  initStore: () => Promise<void>;
  refreshAll: () => void;

  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addCustomer: (customer: Customer) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;

  addSale: (sale: Sale) => void;
  addPurchase: (purchase: Purchase) => void;
  addExpense: (expense: Expense) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, payment: Partial<Payment>) => void;

  addEmployee: (employee: Employee) => void;
  deleteEmployee: (id: string) => void;

  addPrescription: (prescription: Prescription) => void;
  updatePrescription: (id: string, prescription: Partial<Prescription>) => void;
  deletePrescription: (id: string) => void;
}

export const useStore = create<AppState>()((set, get) => ({
  dbReady: false,
  products: [],
  customers: [],
  suppliers: [],
  sales: [],
  purchases: [],
  expenses: [],
  employees: [],
  payments: [],
  prescriptions: [],

  initStore: async () => {
    await initDatabase();
    const data = loadAllFromSQLite();
    set({ ...data, dbReady: true });
  },

  refreshAll: () => {
    const data = loadAllFromSQLite();
    set(data);
  },

  addProduct: (product) => {
    insertRow('products', toProductRow(product));
    set({ products: getAllRows('products').map(mapProductRow) });
  },

  updateProduct: (id, productData) => {
    const existing = getRow('products', id);
    if (existing) {
      const merged = { ...mapProductRow(existing), ...productData };
      updateRow('products', id, toProductRow(merged));
      set({ products: getAllRows('products').map(mapProductRow) });
    }
  },

  deleteProduct: (id) => {
    softDeleteRow('products', id);
    set({ products: getAllRows('products').map(mapProductRow) });
  },

  addCustomer: (customer) => {
    insertRow('customers', toCustomerRow(customer));
    set({ customers: getAllRows('customers').map(mapCustomerRow) });
  },

  updateCustomer: (id, customerData) => {
    const existing = getRow('customers', id);
    if (existing) {
      const merged = { ...mapCustomerRow(existing), ...customerData };
      updateRow('customers', id, toCustomerRow(merged));
      set({ customers: getAllRows('customers').map(mapCustomerRow) });
    }
  },

  addSupplier: (supplier) => {
    insertRow('suppliers', toSupplierRow(supplier));
    set({ suppliers: getAllRows('suppliers').map(mapSupplierRow) });
  },

  updateSupplier: (id, supplierData) => {
    const existing = getRow('suppliers', id);
    if (existing) {
      const merged = { ...mapSupplierRow(existing), ...supplierData };
      updateRow('suppliers', id, toSupplierRow(merged));
      set({ suppliers: getAllRows('suppliers').map(mapSupplierRow) });
    }
  },

  addSale: (sale) => {
    const storeId = getSyncMeta('store_id') || '';

    insertRow('orders', {
      id: sale.id, type: 'sale', date: sale.date, total: sale.total,
      entity_id: sale.customerId || null, entity_type: sale.customerId ? 'customer' : null,
      payment_type: sale.type, paid_amount: sale.paidAmount ?? (sale.type === 'cash' ? sale.total : 0),
      store_id: storeId,
    });

    for (const item of sale.items) {
      insertRow('order_items', {
        id: generateId(), order_id: sale.id,
        product_id: item.productId || item.product?.id,
        quantity: item.quantity || item.qty || 0, price: item.price || 0, buy_price: item.buyPrice || 0,
        store_id: storeId,
      });

      const productId = item.productId || item.product?.id;
      if (productId) {
        const product = getRow('products', productId);
        if (product) {
          const newStock = (Number((product as any).stock) || 0) - (item.quantity || item.qty || 0);
          updateRow('products', productId, { stock: Math.max(0, newStock) });
        }
      }
    }

    const paid = sale.paidAmount ?? (sale.type === 'cash' ? sale.total : 0);
    const debt = sale.total - paid;

    if (sale.customerId && debt > 0) {
      const customer = getRow('customers', sale.customerId);
      if (customer) {
        updateRow('customers', sale.customerId, { balance: (Number((customer as any).balance) || 0) + debt });
      }
      if (paid > 0) {
        insertRow('payments', {
          id: generateId(), date: sale.date, entity_id: sale.customerId, entity_type: 'customer',
          amount: paid, payment_method: 'cash', type: 'payment_in',
          notes: 'الدفعة الأولى لفاتورة مبيعات آجل',
          check_number: null, check_date: null, check_status: null, store_id: storeId,
        });
      }
    }

    get().refreshAll();
  },

  addPurchase: (purchase) => {
    const storeId = getSyncMeta('store_id') || '';

    insertRow('orders', {
      id: purchase.id, type: 'purchase', date: purchase.date, total: purchase.total,
      entity_id: purchase.supplierId || null, entity_type: purchase.supplierId ? 'supplier' : null,
      payment_type: purchase.type, paid_amount: purchase.paidAmount ?? (purchase.type === 'cash' ? purchase.total : 0),
      store_id: storeId,
    });

    for (const item of purchase.items) {
      insertRow('order_items', {
        id: generateId(), order_id: purchase.id,
        product_id: item.productId || item.product?.id,
        quantity: item.quantity || item.qty || 0, price: item.price || 0, buy_price: item.buyPrice || 0,
        store_id: storeId,
      });

      const productId = item.productId || item.product?.id;
      if (productId) {
        const product = getRow('products', productId);
        if (product) {
          const newStock = (Number((product as any).stock) || 0) + (item.quantity || item.qty || 0);
          updateRow('products', productId, { stock: newStock });
        }
      }
    }

    const paid = purchase.paidAmount ?? (purchase.type === 'cash' ? purchase.total : 0);
    const debt = purchase.total - paid;

    if (purchase.supplierId && debt > 0) {
      const supplier = getRow('suppliers', purchase.supplierId);
      if (supplier) {
        updateRow('suppliers', purchase.supplierId, { balance: (Number((supplier as any).balance) || 0) + debt });
      }
      if (paid > 0) {
        insertRow('payments', {
          id: generateId(), date: purchase.date, entity_id: purchase.supplierId, entity_type: 'supplier',
          amount: paid, payment_method: 'cash', type: 'payment_out',
          notes: 'الدفعة الأولى لفاتورة مشتريات آجل',
          check_number: null, check_date: null, check_status: null, store_id: storeId,
        });
      }
    }

    get().refreshAll();
  },

  addExpense: (expense) => {
    insertRow('expenses', toExpenseRow(expense));
    set({ expenses: getAllRows('expenses').map(mapExpenseRow) });
  },

  addPayment: (payment) => {
    insertRow('payments', toPaymentRow(payment));

    if (payment.entityType === 'customer' && payment.checkStatus !== 'pending' && payment.checkStatus !== 'bounced') {
      const customer = getRow('customers', payment.entityId);
      if (customer) {
        updateRow('customers', payment.entityId, { balance: Math.max(0, (Number((customer as any).balance) || 0) - payment.amount) });
      }
    } else if (payment.entityType === 'supplier' && payment.checkStatus !== 'pending' && payment.checkStatus !== 'bounced') {
      const supplier = getRow('suppliers', payment.entityId);
      if (supplier) {
        updateRow('suppliers', payment.entityId, { balance: Math.max(0, (Number((supplier as any).balance) || 0) - payment.amount) });
      }
    }

    get().refreshAll();
  },

  updatePayment: (id, paymentData) => {
    const existing = getRow('payments', id);
    if (!existing) return;

    const oldPayment = mapPaymentRow(existing);
    const merged = { ...oldPayment, ...paymentData };
    updateRow('payments', id, toPaymentRow(merged));

    if (paymentData.checkStatus === 'cleared' && oldPayment.checkStatus === 'pending') {
      if (oldPayment.entityType === 'customer') {
        const customer = getRow('customers', oldPayment.entityId);
        if (customer) {
          updateRow('customers', oldPayment.entityId, { balance: Math.max(0, (Number((customer as any).balance) || 0) - oldPayment.amount) });
        }
      } else if (oldPayment.entityType === 'supplier') {
        const supplier = getRow('suppliers', oldPayment.entityId);
        if (supplier) {
          updateRow('suppliers', oldPayment.entityId, { balance: Math.max(0, (Number((supplier as any).balance) || 0) - oldPayment.amount) });
        }
      }
    }

    get().refreshAll();
  },

  addEmployee: (employee) => {
    insertRow('employees', toEmployeeRow(employee));
    set({ employees: getAllRows('employees').map(mapEmployeeRow) });
  },

  deleteEmployee: (id) => {
    softDeleteRow('employees', id);
    set({ employees: getAllRows('employees').map(mapEmployeeRow) });
  },

  addPrescription: (prescription) => {
    insertRow('prescriptions', toPrescriptionRow(prescription));
    set({ prescriptions: getAllRows('prescriptions').map(mapPrescriptionRow) });
  },

  updatePrescription: (id, data) => {
    const existing = getRow('prescriptions', id);
    if (existing) {
      const merged = { ...mapPrescriptionRow(existing), ...data, updatedAt: new Date().toISOString() };
      updateRow('prescriptions', id, toPrescriptionRow(merged));
      set({ prescriptions: getAllRows('prescriptions').map(mapPrescriptionRow) });
    }
  },

  deletePrescription: (id) => {
    softDeleteRow('prescriptions', id);
    set({ prescriptions: getAllRows('prescriptions').map(mapPrescriptionRow) });
  },
}));
