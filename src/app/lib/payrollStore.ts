import type { PayrollIntegration, PayrollSyncLog, PayrollExport } from './types';

// ─── LocalStorage Persistence ──────────────────────────
const PAYROLL_STORAGE_KEY = 'payrollStore_state';

function savePayrollToStorage() {
  try {
    localStorage.setItem(PAYROLL_STORAGE_KEY, JSON.stringify({
      payrollIdCounter, payrollIntegrations, payrollSyncLogs, payrollExports,
    }));
  } catch { /* quota exceeded */ }
}

function loadPayrollFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(PAYROLL_STORAGE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    payrollIdCounter = s.payrollIdCounter || 200;
    payrollIntegrations.length = 0;
    payrollIntegrations.push(...(s.payrollIntegrations || []));
    payrollSyncLogs.length = 0;
    payrollSyncLogs.push(...(s.payrollSyncLogs || []));
    payrollExports.length = 0;
    payrollExports.push(...(s.payrollExports || []));
    return true;
  } catch { return false; }
}

export const payrollIntegrations: PayrollIntegration[] = [
  {
    id: 'pi1', companyId: 'c1', provider: 'quickbooks', providerName: 'QuickBooks Payroll',
    isConnected: true, syncFrequency: 'payroll_cycle', lastSyncAt: '2026-03-01T02:00:00',
    lastSyncStatus: 'success', syncedEmployees: 6, totalEmployees: 6,
    settings: { syncLeaveData: true, syncEmployeeData: true, syncDeductions: true, autoExport: true },
    connectedAt: '2024-06-15T10:00:00',
  },
  {
    id: 'pi2', companyId: 'c2', provider: 'xero', providerName: 'Xero Payroll',
    isConnected: true, syncFrequency: 'nightly', lastSyncAt: '2026-03-10T02:00:00',
    lastSyncStatus: 'partial', syncedEmployees: 2, totalEmployees: 3,
    settings: { syncLeaveData: true, syncEmployeeData: true, syncDeductions: false, autoExport: false },
    connectedAt: '2024-08-20T14:00:00',
  },
  {
    id: 'pi3', companyId: 'c3', provider: 'sage', providerName: 'Sage Payroll',
    isConnected: false, syncFrequency: 'manual', syncedEmployees: 0, totalEmployees: 0,
    settings: { syncLeaveData: false, syncEmployeeData: false, syncDeductions: false, autoExport: false },
  },
  {
    id: 'pi4', companyId: 'c1', provider: 'adp', providerName: 'ADP Workforce Now',
    isConnected: true, syncFrequency: 'nightly', lastSyncAt: '2026-03-09T03:00:00',
    lastSyncStatus: 'success', syncedEmployees: 6, totalEmployees: 6,
    settings: { syncLeaveData: true, syncEmployeeData: true, syncDeductions: true, autoExport: false },
    connectedAt: '2025-01-10T09:00:00',
  },
  {
    id: 'pi5', companyId: 'c1', provider: 'custom', providerName: 'Legacy Payroll (CSV)',
    isConnected: false, syncFrequency: 'manual', syncedEmployees: 0, totalEmployees: 0,
    settings: { syncLeaveData: false, syncEmployeeData: false, syncDeductions: false, autoExport: false },
  },
];

export const payrollSyncLogs: PayrollSyncLog[] = [
  {
    id: 'psl1', integrationId: 'pi1', companyId: 'c1', status: 'success', syncType: 'full',
    recordsSynced: 6, recordsFailed: 0, errors: [],
    startedAt: '2026-03-01T02:00:00', completedAt: '2026-03-01T02:03:22', triggeredBy: 'system',
  },
  {
    id: 'psl2', integrationId: 'pi1', companyId: 'c1', status: 'success', syncType: 'incremental',
    recordsSynced: 2, recordsFailed: 0, errors: [],
    startedAt: '2026-02-15T02:00:00', completedAt: '2026-02-15T02:01:10', triggeredBy: 'system',
  },
  {
    id: 'psl3', integrationId: 'pi1', companyId: 'c1', status: 'failed', syncType: 'incremental',
    recordsSynced: 4, recordsFailed: 2, errors: [
      { field: 'tax_code', employeeId: 'u5', employeeName: 'Lisa Park', message: 'Invalid tax code format', severity: 'error' },
      { field: 'bank_account', employeeId: 'u8', employeeName: 'Robert Taylor', message: 'Bank account verification pending', severity: 'warning' },
    ],
    startedAt: '2026-02-01T02:00:00', completedAt: '2026-02-01T02:02:45', triggeredBy: 'system',
  },
  {
    id: 'psl4', integrationId: 'pi1', companyId: 'c1', status: 'success', syncType: 'manual',
    recordsSynced: 6, recordsFailed: 0, errors: [],
    startedAt: '2026-01-15T10:30:00', completedAt: '2026-01-15T10:33:15', triggeredBy: 'James Chen',
  },
  {
    id: 'psl5', integrationId: 'pi2', companyId: 'c2', status: 'partial', syncType: 'full',
    recordsSynced: 2, recordsFailed: 1, errors: [
      { field: 'national_insurance', employeeId: 'u6', employeeName: 'David Kim', message: 'NI number format invalid for probation employee', severity: 'warning' },
    ],
    startedAt: '2026-03-10T02:00:00', completedAt: '2026-03-10T02:04:00', triggeredBy: 'system',
  },
  {
    id: 'psl6', integrationId: 'pi2', companyId: 'c2', status: 'success', syncType: 'full',
    recordsSynced: 3, recordsFailed: 0, errors: [],
    startedAt: '2026-02-10T02:00:00', completedAt: '2026-02-10T02:03:30', triggeredBy: 'system',
  },
  // Additional sync logs
  {
    id: 'psl7', integrationId: 'pi4', companyId: 'c1', status: 'success', syncType: 'full',
    recordsSynced: 6, recordsFailed: 0, errors: [],
    startedAt: '2026-03-09T03:00:00', completedAt: '2026-03-09T03:02:48', triggeredBy: 'system',
  },
  {
    id: 'psl8', integrationId: 'pi4', companyId: 'c1', status: 'success', syncType: 'incremental',
    recordsSynced: 3, recordsFailed: 0, errors: [],
    startedAt: '2026-03-08T03:00:00', completedAt: '2026-03-08T03:01:12', triggeredBy: 'system',
  },
  {
    id: 'psl9', integrationId: 'pi4', companyId: 'c1', status: 'failed', syncType: 'full',
    recordsSynced: 0, recordsFailed: 6, errors: [
      { field: 'api_connection', message: 'ADP API rate limit exceeded. Retry after 60 seconds.', severity: 'error' },
      { field: 'authentication', message: 'OAuth token refresh failed temporarily', severity: 'error' },
    ],
    startedAt: '2026-03-05T03:00:00', completedAt: '2026-03-05T03:00:08', triggeredBy: 'system',
  },
  {
    id: 'psl10', integrationId: 'pi1', companyId: 'c1', status: 'success', syncType: 'export',
    recordsSynced: 6, recordsFailed: 0, errors: [],
    startedAt: '2026-02-28T09:00:00', completedAt: '2026-02-28T09:01:05', triggeredBy: 'James Chen',
  },
  {
    id: 'psl11', integrationId: 'pi1', companyId: 'c1', status: 'partial', syncType: 'incremental',
    recordsSynced: 5, recordsFailed: 1, errors: [
      { field: 'overtime_hours', employeeId: 'u4', employeeName: 'Michael Brown', message: 'Overtime hours exceed maximum allowed (60hrs)', severity: 'warning' },
    ],
    startedAt: '2025-12-15T02:00:00', completedAt: '2025-12-15T02:02:30', triggeredBy: 'system',
  },
  {
    id: 'psl12', integrationId: 'pi2', companyId: 'c2', status: 'success', syncType: 'manual',
    recordsSynced: 3, recordsFailed: 0, errors: [],
    startedAt: '2026-01-20T11:00:00', completedAt: '2026-01-20T11:02:50', triggeredBy: 'Anna Johnson',
  },
];

export const payrollExports: PayrollExport[] = [
  { id: 'pe1', companyId: 'c1', format: 'csv', exportType: 'leave_data', period: 'Feb 2026', recordCount: 8, fileSize: 12400, status: 'completed', createdAt: '2026-03-01T09:00:00', createdBy: 'James Chen' },
  { id: 'pe2', companyId: 'c1', format: 'excel', exportType: 'full', period: 'Jan 2026', recordCount: 24, fileSize: 89000, status: 'completed', createdAt: '2026-02-01T09:00:00', createdBy: 'James Chen' },
  { id: 'pe3', companyId: 'c1', format: 'csv', exportType: 'employee_data', period: 'Q1 2026', recordCount: 6, fileSize: 8200, status: 'completed', createdAt: '2026-03-08T14:00:00', createdBy: 'James Chen' },
  { id: 'pe4', companyId: 'c1', format: 'json', exportType: 'deductions', period: 'Feb 2026', recordCount: 4, fileSize: 5600, status: 'completed', createdAt: '2026-03-02T11:00:00', createdBy: 'James Chen' },
  { id: 'pe5', companyId: 'c2', format: 'csv', exportType: 'leave_data', period: 'Feb 2026', recordCount: 5, fileSize: 7800, status: 'completed', createdAt: '2026-03-01T09:30:00', createdBy: 'Anna Johnson' },
  { id: 'pe6', companyId: 'c2', format: 'excel', exportType: 'full', period: 'Feb 2026', recordCount: 12, fileSize: 45000, status: 'completed', createdAt: '2026-03-03T10:00:00', createdBy: 'Anna Johnson' },
  // Additional exports
  { id: 'pe7', companyId: 'c1', format: 'excel', exportType: 'full', period: 'Dec 2025', recordCount: 22, fileSize: 84000, status: 'completed', createdAt: '2026-01-02T09:00:00', createdBy: 'James Chen' },
  { id: 'pe8', companyId: 'c1', format: 'csv', exportType: 'leave_data', period: 'Jan 2026', recordCount: 6, fileSize: 9100, status: 'completed', createdAt: '2026-02-01T09:30:00', createdBy: 'James Chen' },
  { id: 'pe9', companyId: 'c1', format: 'xml', exportType: 'employee_data', period: 'Mar 2026', recordCount: 6, fileSize: 15200, status: 'completed', createdAt: '2026-03-10T08:00:00', createdBy: 'Sarah Mitchell' },
  { id: 'pe10', companyId: 'c1', format: 'json', exportType: 'full', period: 'Q4 2025', recordCount: 42, fileSize: 128000, status: 'completed', createdAt: '2026-01-05T14:00:00', createdBy: 'James Chen' },
  { id: 'pe11', companyId: 'c2', format: 'csv', exportType: 'deductions', period: 'Jan 2026', recordCount: 3, fileSize: 4200, status: 'completed', createdAt: '2026-02-02T10:00:00', createdBy: 'Anna Johnson' },
];

let payrollIdCounter = 200;
function genId(prefix: string) { return `${prefix}_${++payrollIdCounter}`; }

export const payrollReads = {
  getIntegrationsForCompany: (companyId: string) =>
    payrollIntegrations.filter(i => i.companyId === companyId),
  getIntegration: (id: string) =>
    payrollIntegrations.find(i => i.id === id),
  getSyncLogsForIntegration: (integrationId: string) =>
    payrollSyncLogs.filter(l => l.integrationId === integrationId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
  getSyncLogsForCompany: (companyId: string) =>
    payrollSyncLogs.filter(l => l.companyId === companyId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()),
  getExportsForCompany: (companyId: string) =>
    payrollExports.filter(e => e.companyId === companyId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  getAllIntegrations: () => payrollIntegrations,
};

// ─── Mutable actions ────────────────────────────────────

export const payrollActions = {
  triggerSync(integrationId: string, companyId: string, triggeredBy: string): PayrollSyncLog {
    const integ = payrollIntegrations.find(i => i.id === integrationId);
    const now = new Date();
    const completedAt = new Date(now.getTime() + (Math.random() * 3000 + 1000));
    const totalRecords = integ?.totalEmployees || 6;
    const failCount = Math.random() > 0.8 ? 1 : 0;
    const status = failCount > 0 ? 'partial' as const : 'success' as const;

    const errors = failCount > 0 ? [
      { field: 'pay_period', employeeName: 'Auto-generated', message: 'Pay period dates overlap with existing records', severity: 'warning' as const },
    ] : [];

    const log: PayrollSyncLog = {
      id: genId('psl'),
      integrationId, companyId, status, syncType: 'manual',
      recordsSynced: totalRecords - failCount, recordsFailed: failCount,
      errors,
      startedAt: now.toISOString(), completedAt: completedAt.toISOString(),
      triggeredBy,
    };
    payrollSyncLogs.unshift(log);

    if (integ) {
      integ.lastSyncAt = now.toISOString();
      integ.lastSyncStatus = status;
      integ.syncedEmployees = totalRecords - failCount;
    }

    savePayrollToStorage();
    return log;
  },

  toggleSetting(integrationId: string, setting: keyof PayrollIntegration['settings']) {
    const integ = payrollIntegrations.find(i => i.id === integrationId);
    if (!integ) return;
    integ.settings[setting] = !integ.settings[setting];
    savePayrollToStorage();
  },

  generateExport(companyId: string, exportType: PayrollExport['exportType'], format: PayrollExport['format'], createdBy: string): PayrollExport {
    const now = new Date();
    const periodMonth = now.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const recordCount = exportType === 'full' ? Math.floor(Math.random() * 20 + 10) : Math.floor(Math.random() * 8 + 3);
    const sizeMultiplier = format === 'excel' ? 4000 : format === 'xml' ? 2500 : format === 'json' ? 1400 : 1000;

    const exp: PayrollExport = {
      id: genId('pe'),
      companyId, format, exportType,
      period: periodMonth,
      recordCount,
      fileSize: recordCount * sizeMultiplier + Math.floor(Math.random() * 5000),
      status: 'completed',
      createdAt: now.toISOString(),
      createdBy,
    };
    payrollExports.unshift(exp);
    savePayrollToStorage();
    return exp;
  },

  connectProvider(integrationId: string) {
    const integ = payrollIntegrations.find(i => i.id === integrationId);
    if (!integ) return;
    integ.isConnected = true;
    integ.connectedAt = new Date().toISOString();
    integ.syncedEmployees = 0;
    integ.totalEmployees = 0;
    savePayrollToStorage();
  },

  disconnectProvider(integrationId: string) {
    const integ = payrollIntegrations.find(i => i.id === integrationId);
    if (!integ) return;
    integ.isConnected = false;
    integ.lastSyncAt = undefined;
    integ.lastSyncStatus = undefined;
    integ.syncedEmployees = 0;
    savePayrollToStorage();
  },
};

export function resetPayrollData() {
  localStorage.removeItem(PAYROLL_STORAGE_KEY);
}

// ─── Initialize from storage ────────────────────────────

loadPayrollFromStorage();