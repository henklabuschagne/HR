import type {
  User, Company, EmploymentRecord, LeaveType, LeaveModel, LeaveBalance,
  LeaveRequest, Holiday, ApprovalWorkflow, Document, Notification,
  AuditLog, Department, AppSession, LeaveRequestStatus, UserRole,
  LeaveModelAllocation, ApprovalStep,
} from './types';

// ─── Helpers ───────────────────────────────────────────
let idCounter = 1000;
function generateId(): string { return `id_${++idCounter}`; }

// ─── LocalStorage Persistence ──────────────────────────
const STORAGE_KEY = 'appStore_state';

function saveToStorage() {
  try {
    const state = {
      idCounter,
      users, companies, employmentRecords, leaveTypes, leaveModels,
      leaveBalances, leaveRequests, holidays, workflows, documents,
      notifications, auditLogs, departments,
      sessionUserId: session.currentUser.id,
      sessionCompanyId: session.activeCompanyId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded or private browsing */ }
}

function loadFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const state = JSON.parse(raw);
    idCounter = state.idCounter || 1000;
    users = state.users || [];
    companies = state.companies || [];
    employmentRecords = state.employmentRecords || [];
    leaveTypes = state.leaveTypes || [];
    leaveModels = state.leaveModels || [];
    leaveBalances = state.leaveBalances || [];
    leaveRequests = state.leaveRequests || [];
    holidays = state.holidays || [];
    workflows = state.workflows || [];
    documents = state.documents || [];
    notifications = state.notifications || [];
    auditLogs = state.auditLogs || [];
    departments = state.departments || [];
    // Restore session
    const currentUser = users.find(u => u.id === state.sessionUserId) || users[2] || seedUsers[2];
    const activeCompanyId = state.sessionCompanyId || 'c1';
    const userERs = employmentRecords.filter(er => er.userId === currentUser.id && er.isActive);
    session = {
      currentUser,
      activeCompanyId,
      companies: currentUser.role === 'owner' ? companies : companies.filter(c => c.id === activeCompanyId),
      employmentRecords: userERs,
    };
    return true;
  } catch { return false; }
}

function resetAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('additionalStore_state');
  localStorage.removeItem('esignStore_state');
  localStorage.removeItem('payrollStore_state');
  window.location.reload();
}

// ─── Subscriber System ─────────────────────────────────
type Slice = 'session' | 'users' | 'companies' | 'employmentRecords' | 'leaveTypes' | 'leaveModels' |
  'leaveBalances' | 'leaveRequests' | 'holidays' | 'workflows' | 'documents' |
  'notifications' | 'auditLogs' | 'departments';
type Listener = () => void;

const sliceNames: Slice[] = ['session', 'users', 'companies', 'employmentRecords', 'leaveTypes',
  'leaveModels', 'leaveBalances', 'leaveRequests', 'holidays', 'workflows',
  'documents', 'notifications', 'auditLogs', 'departments'];

const subscribers: Record<Slice, Set<Listener>> = {} as any;
sliceNames.forEach(s => { subscribers[s] = new Set(); });

function notify(slice: Slice) {
  subscribers[slice].forEach(fn => fn());
  saveToStorage();
}

// ─── Seed Data ─────────────────────────────────────────

const seedUsers: User[] = [
  { id: 'u1', email: 'sarah.mitchell@acmecorp.com', firstName: 'Sarah', lastName: 'Mitchell', role: 'owner', isActive: true, createdAt: '2024-01-01' },
  { id: 'u2', email: 'james.chen@acmecorp.com', firstName: 'James', lastName: 'Chen', role: 'admin', isActive: true, createdAt: '2024-01-15' },
  { id: 'u3', email: 'emily.watson@acmecorp.com', firstName: 'Emily', lastName: 'Watson', role: 'user', isActive: true, createdAt: '2024-02-01' },
  { id: 'u4', email: 'michael.brown@acmecorp.com', firstName: 'Michael', lastName: 'Brown', role: 'user', isActive: true, createdAt: '2024-02-15' },
  { id: 'u5', email: 'lisa.park@acmecorp.com', firstName: 'Lisa', lastName: 'Park', role: 'user', isActive: true, createdAt: '2024-03-01' },
  { id: 'u6', email: 'david.kim@acmecorp.com', firstName: 'David', lastName: 'Kim', role: 'user', isActive: true, createdAt: '2024-03-10' },
  { id: 'u7', email: 'anna.johnson@acmecorp.com', firstName: 'Anna', lastName: 'Johnson', role: 'admin', isActive: true, createdAt: '2024-01-20' },
  { id: 'u8', email: 'robert.taylor@acmecorp.com', firstName: 'Robert', lastName: 'Taylor', role: 'user', isActive: true, createdAt: '2024-04-01' },
  { id: 'u9', email: 'natalie.cruz@acmecorp.com', firstName: 'Natalie', lastName: 'Cruz', role: 'user', isActive: true, createdAt: '2024-04-15' },
  { id: 'u10', email: 'marcus.webb@acmecorp.com', firstName: 'Marcus', lastName: 'Webb', role: 'user', isActive: true, createdAt: '2024-05-01' },
];

const seedCompanies: Company[] = [
  { id: 'c1', name: 'Acme Holdings', code: 'ACH', country: 'United States', currency: 'USD', isActive: true, employeeCount: 45, createdAt: '2024-01-01' },
  { id: 'c2', name: 'Acme Digital', code: 'ACD', country: 'United Kingdom', currency: 'GBP', isActive: true, employeeCount: 28, createdAt: '2024-01-01' },
  { id: 'c3', name: 'Acme Logistics', code: 'ACL', country: 'Germany', currency: 'EUR', isActive: true, employeeCount: 34, createdAt: '2024-06-01' },
];

// Every user belongs to exactly one company (c1)
const seedEmploymentRecords: EmploymentRecord[] = [
  { id: 'er1', userId: 'u3', companyId: 'c1', department: 'Implementation', team: 'Project Delivery', jobTitle: 'Senior Implementation Consultant', managerId: 'u4', employmentType: 'full-time', startDate: '2024-02-01', isOnProbation: false, leaveModelId: 'lm1', location: 'New York', isActive: true },
  { id: 'er3', userId: 'u4', companyId: 'c1', department: 'Development', team: 'Backend', jobTitle: 'Development Manager', managerId: 'u2', employmentType: 'full-time', startDate: '2024-02-15', isOnProbation: false, leaveModelId: 'lm1', location: 'New York', isActive: true },
  { id: 'er4', userId: 'u5', companyId: 'c1', department: 'Marketing', team: 'Growth', jobTitle: 'Marketing Lead', managerId: 'u2', employmentType: 'full-time', startDate: '2024-03-01', isOnProbation: false, leaveModelId: 'lm1', location: 'San Francisco', isActive: true },
  { id: 'er5', userId: 'u6', companyId: 'c1', department: 'DevOps', team: 'Platform', jobTitle: 'DevOps Engineer', managerId: 'u4', employmentType: 'full-time', startDate: '2024-03-10', isOnProbation: true, leaveModelId: 'lm4', location: 'New York', isActive: true },
  { id: 'er6', userId: 'u8', companyId: 'c1', department: 'Finance', team: 'Accounting', jobTitle: 'Financial Analyst', managerId: 'u2', employmentType: 'full-time', startDate: '2024-04-01', isOnProbation: false, leaveModelId: 'lm1', location: 'New York', isActive: true },
  { id: 'er7', userId: 'u2', companyId: 'c1', department: 'HR', team: 'People Ops', jobTitle: 'HR Director', employmentType: 'full-time', startDate: '2024-01-15', isOnProbation: false, leaveModelId: 'lm3', location: 'New York', isActive: true },
  { id: 'er8', userId: 'u7', companyId: 'c1', department: 'HR', team: 'People Ops', jobTitle: 'HR Manager', managerId: 'u2', employmentType: 'full-time', startDate: '2024-01-20', isOnProbation: false, leaveModelId: 'lm1', location: 'New York', isActive: true },
  { id: 'er9', userId: 'u1', companyId: 'c1', department: 'Executive', team: 'Leadership', jobTitle: 'CEO', employmentType: 'full-time', startDate: '2024-01-01', isOnProbation: false, leaveModelId: 'lm3', location: 'New York', isActive: true },
  { id: 'er10', userId: 'u9', companyId: 'c1', department: 'Product', team: 'Product Strategy', jobTitle: 'Senior Product Manager', managerId: 'u1', employmentType: 'full-time', startDate: '2024-04-15', isOnProbation: false, leaveModelId: 'lm1', location: 'San Francisco', isActive: true },
  { id: 'er11', userId: 'u10', companyId: 'c1', department: 'DevOps', team: 'Infrastructure', jobTitle: 'Senior DevOps Engineer', managerId: 'u4', employmentType: 'full-time', startDate: '2024-05-01', isOnProbation: false, leaveModelId: 'lm1', location: 'New York', isActive: true },
];

const seedLeaveTypes: LeaveType[] = [
  { id: 'lt1', companyId: 'c1', name: 'Annual Leave', code: 'AL', color: '#456E92', isPaid: true, requiresDocument: false, allowHalfDay: true, allowNegativeBalance: false, maxDaysPerYear: 21, isActive: true },
  { id: 'lt2', companyId: 'c1', name: 'Sick Leave', code: 'SL', color: '#AB5A5C', isPaid: true, requiresDocument: true, allowHalfDay: false, allowNegativeBalance: true, maxDaysPerYear: 10, isActive: true },
  { id: 'lt3', companyId: 'c1', name: 'Family Responsibility', code: 'FR', color: '#CEA569', isPaid: true, requiresDocument: true, allowHalfDay: false, allowNegativeBalance: false, maxDaysPerYear: 3, isActive: true },
  { id: 'lt4', companyId: 'c1', name: 'Unpaid Leave', code: 'UL', color: '#5A7A96', isPaid: false, requiresDocument: false, allowHalfDay: true, allowNegativeBalance: true, maxDaysPerYear: 30, isActive: true },
  { id: 'lt5', companyId: 'c1', name: 'Study Leave', code: 'STL', color: '#5F966C', isPaid: true, requiresDocument: true, allowHalfDay: false, allowNegativeBalance: false, maxDaysPerYear: 5, isActive: true },
  { id: 'lt9', companyId: 'c1', name: 'Compassionate Leave', code: 'CL', color: '#8B5CF6', isPaid: true, requiresDocument: true, allowHalfDay: false, allowNegativeBalance: false, maxDaysPerYear: 5, isActive: true },
  { id: 'lt10', companyId: 'c1', name: 'Parental Leave', code: 'PL', color: '#7AA2C0', isPaid: true, requiresDocument: true, allowHalfDay: false, allowNegativeBalance: false, maxDaysPerYear: 20, isActive: true },
  { id: 'lt11', companyId: 'c1', name: 'Jury Duty', code: 'JD', color: '#6B7280', isPaid: true, requiresDocument: true, allowHalfDay: false, allowNegativeBalance: true, maxDaysPerYear: 10, isActive: true },
  { id: 'lt12', companyId: 'c1', name: 'Volunteer Day', code: 'VD', color: '#10B981', isPaid: true, requiresDocument: false, allowHalfDay: true, allowNegativeBalance: false, maxDaysPerYear: 2, isActive: true },
];

const seedLeaveModels: LeaveModel[] = [
  { id: 'lm1', companyId: 'c1', name: 'Standard Full-Time', description: 'Standard leave model for full-time employees', leaveTypes: [{ leaveTypeId: 'lt1', entitlement: 21 }, { leaveTypeId: 'lt2', entitlement: 10 }, { leaveTypeId: 'lt3', entitlement: 3 }, { leaveTypeId: 'lt4', entitlement: 30 }, { leaveTypeId: 'lt5', entitlement: 5 }, { leaveTypeId: 'lt9', entitlement: 5 }, { leaveTypeId: 'lt12', entitlement: 2 }], workingDays: [1, 2, 3, 4, 5], carryOverLimit: 5, accrualType: 'monthly', isDefault: true, isActive: true },
  { id: 'lm3', companyId: 'c1', name: 'Executive', description: 'Enhanced leave for executive and senior leadership', leaveTypes: [{ leaveTypeId: 'lt1', entitlement: 30 }, { leaveTypeId: 'lt2', entitlement: 15 }, { leaveTypeId: 'lt3', entitlement: 5 }, { leaveTypeId: 'lt4', entitlement: 30 }, { leaveTypeId: 'lt5', entitlement: 10 }, { leaveTypeId: 'lt9', entitlement: 10 }, { leaveTypeId: 'lt10', entitlement: 20 }, { leaveTypeId: 'lt12', entitlement: 5 }], workingDays: [1, 2, 3, 4, 5], carryOverLimit: 10, accrualType: 'annual', isDefault: false, isActive: true },
  { id: 'lm4', companyId: 'c1', name: 'Part-Time / Probation', description: 'Pro-rated leave for part-time employees and those on probation', leaveTypes: [{ leaveTypeId: 'lt1', entitlement: 12 }, { leaveTypeId: 'lt2', entitlement: 5 }, { leaveTypeId: 'lt3', entitlement: 2 }, { leaveTypeId: 'lt4', entitlement: 15 }], workingDays: [1, 2, 3, 4, 5], carryOverLimit: 3, accrualType: 'monthly', isDefault: false, isActive: true },
  { id: 'lm5', companyId: 'c1', name: 'Contractor', description: 'Minimal leave entitlements for contractors', leaveTypes: [{ leaveTypeId: 'lt4', entitlement: 20 }], workingDays: [1, 2, 3, 4, 5], carryOverLimit: 0, accrualType: 'annual', isDefault: false, isActive: true },
  { id: 'lm6', companyId: 'c1', name: 'Intern Program', description: 'Basic leave for internship positions', leaveTypes: [{ leaveTypeId: 'lt1', entitlement: 10 }, { leaveTypeId: 'lt2', entitlement: 5 }], workingDays: [1, 2, 3, 4, 5], carryOverLimit: 0, accrualType: 'monthly', isDefault: false, isActive: true },
];

const seedLeaveBalances: LeaveBalance[] = [
  { id: 'lb1', employmentRecordId: 'er1', leaveTypeId: 'lt1', entitled: 21, used: 8, pending: 3, carriedOver: 2, adjusted: 0, available: 12, year: 2026 },
  { id: 'lb2', employmentRecordId: 'er1', leaveTypeId: 'lt2', entitled: 10, used: 2, pending: 0, carriedOver: 0, adjusted: 0, available: 8, year: 2026 },
  { id: 'lb3', employmentRecordId: 'er1', leaveTypeId: 'lt3', entitled: 3, used: 1, pending: 0, carriedOver: 0, adjusted: 0, available: 2, year: 2026 },
  { id: 'lb6', employmentRecordId: 'er3', leaveTypeId: 'lt1', entitled: 21, used: 5, pending: 0, carriedOver: 3, adjusted: 1, available: 20, year: 2026 },
  { id: 'lb7', employmentRecordId: 'er4', leaveTypeId: 'lt1', entitled: 21, used: 12, pending: 2, carriedOver: 0, adjusted: 0, available: 7, year: 2026 },
  { id: 'lb8', employmentRecordId: 'er5', leaveTypeId: 'lt1', entitled: 12, used: 3, pending: 0, carriedOver: 0, adjusted: 0, available: 9, year: 2026 },
  { id: 'lb9', employmentRecordId: 'er6', leaveTypeId: 'lt1', entitled: 21, used: 6, pending: 1, carriedOver: 0, adjusted: 0, available: 14, year: 2026 },
  { id: 'lb10', employmentRecordId: 'er7', leaveTypeId: 'lt1', entitled: 30, used: 4, pending: 0, carriedOver: 5, adjusted: 0, available: 31, year: 2026 },
  { id: 'lb11', employmentRecordId: 'er8', leaveTypeId: 'lt1', entitled: 21, used: 7, pending: 0, carriedOver: 2, adjusted: 0, available: 16, year: 2026 },
  { id: 'lb12', employmentRecordId: 'er9', leaveTypeId: 'lt1', entitled: 30, used: 10, pending: 0, carriedOver: 0, adjusted: 0, available: 20, year: 2026 },
  { id: 'lb13', employmentRecordId: 'er10', leaveTypeId: 'lt1', entitled: 21, used: 4, pending: 0, carriedOver: 1, adjusted: 0, available: 18, year: 2026 },
  { id: 'lb14', employmentRecordId: 'er10', leaveTypeId: 'lt2', entitled: 10, used: 1, pending: 0, carriedOver: 0, adjusted: 0, available: 9, year: 2026 },
  { id: 'lb15', employmentRecordId: 'er11', leaveTypeId: 'lt1', entitled: 21, used: 6, pending: 2, carriedOver: 0, adjusted: 0, available: 13, year: 2026 },
  { id: 'lb16', employmentRecordId: 'er11', leaveTypeId: 'lt2', entitled: 10, used: 0, pending: 0, carriedOver: 0, adjusted: 0, available: 10, year: 2026 },
];

const seedLeaveRequests: LeaveRequest[] = [
  { id: 'lr1', employmentRecordId: 'er1', userId: 'u3', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-03-16', endDate: '2026-03-20', unit: 'full-day', totalDays: 5, reason: 'Family vacation planned months ago', status: 'pending_manager', submittedAt: '2026-03-08T09:00:00', createdAt: '2026-03-08T09:00:00' },
  { id: 'lr2', employmentRecordId: 'er4', userId: 'u5', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-03-23', endDate: '2026-03-25', unit: 'full-day', totalDays: 3, reason: 'Personal appointment', status: 'pending_manager', submittedAt: '2026-03-09T14:30:00', createdAt: '2026-03-09T14:30:00' },
  { id: 'lr3', employmentRecordId: 'er1', userId: 'u3', companyId: 'c1', leaveTypeId: 'lt2', startDate: '2026-02-10', endDate: '2026-02-11', unit: 'full-day', totalDays: 2, reason: 'Feeling unwell', status: 'approved', approverId: 'u4', approverNote: 'Get well soon!', approvedAt: '2026-02-10T10:00:00', submittedAt: '2026-02-10T08:00:00', createdAt: '2026-02-10T08:00:00' },
  { id: 'lr4', employmentRecordId: 'er3', userId: 'u4', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-04-07', endDate: '2026-04-11', unit: 'full-day', totalDays: 5, reason: 'Annual vacation', status: 'approved', approverId: 'u2', approvedAt: '2026-03-01T09:00:00', submittedAt: '2026-02-28T16:00:00', createdAt: '2026-02-28T16:00:00' },
  { id: 'lr5', employmentRecordId: 'er5', userId: 'u6', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-03-12', endDate: '2026-03-13', unit: 'full-day', totalDays: 2, reason: 'Moving to new apartment', status: 'pending_manager', submittedAt: '2026-03-07T11:00:00', createdAt: '2026-03-07T11:00:00' },
  { id: 'lr6', employmentRecordId: 'er6', userId: 'u8', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-03-30', endDate: '2026-03-31', unit: 'full-day', totalDays: 2, reason: 'Personal matters', status: 'pending_admin', approverId: 'u2', submittedAt: '2026-03-06T10:00:00', createdAt: '2026-03-06T10:00:00' },
  { id: 'lr7', employmentRecordId: 'er1', userId: 'u3', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-01-20', endDate: '2026-01-22', unit: 'full-day', totalDays: 3, reason: 'Long weekend trip', status: 'approved', approverId: 'u4', approvedAt: '2026-01-15T09:00:00', submittedAt: '2026-01-14T09:00:00', createdAt: '2026-01-14T09:00:00' },
  // ─── Enriched Calendar Data: overlapping & varied leave ───
  // James Chen (HR Dir) - Mar 17-19, overlaps Emily Mar 16-20
  { id: 'lr8', employmentRecordId: 'er7', userId: 'u2', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-03-17', endDate: '2026-03-19', unit: 'full-day', totalDays: 3, reason: 'Family event out of state', status: 'approved', approverId: 'u1', approvedAt: '2026-03-02T09:00:00', submittedAt: '2026-03-01T11:00:00', createdAt: '2026-03-01T11:00:00' },
  // Anna Johnson (HR) - Mar 18-20, overlaps Emily & James
  { id: 'lr9', employmentRecordId: 'er8', userId: 'u7', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-03-18', endDate: '2026-03-20', unit: 'full-day', totalDays: 3, reason: 'Wedding of close friend', status: 'approved', approverId: 'u2', approvedAt: '2026-03-03T10:00:00', submittedAt: '2026-03-02T14:00:00', createdAt: '2026-03-02T14:00:00' },
  // Natalie Cruz (Product) - Mar 24-26, overlaps Lisa's Mar 23-25
  { id: 'lr10', employmentRecordId: 'er10', userId: 'u9', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-03-24', endDate: '2026-03-26', unit: 'full-day', totalDays: 3, reason: 'Product conference in Austin', status: 'approved', approverId: 'u1', approvedAt: '2026-03-05T09:00:00', submittedAt: '2026-03-04T09:00:00', createdAt: '2026-03-04T09:00:00' },
  // Marcus Webb (DevOps) - Mar 12-13, overlaps David's Mar 12-13
  { id: 'lr11', employmentRecordId: 'er11', userId: 'u10', companyId: 'c1', leaveTypeId: 'lt2', startDate: '2026-03-12', endDate: '2026-03-13', unit: 'full-day', totalDays: 2, reason: 'Recovering from flu', status: 'approved', approverId: 'u4', approvedAt: '2026-03-11T08:00:00', submittedAt: '2026-03-11T07:00:00', createdAt: '2026-03-11T07:00:00' },
  // Robert Taylor (Finance) - Mar 17 half day overlaps Emily & James
  { id: 'lr12', employmentRecordId: 'er6', userId: 'u8', companyId: 'c1', leaveTypeId: 'lt5', startDate: '2026-03-17', endDate: '2026-03-17', unit: 'full-day', totalDays: 1, reason: 'CPA exam preparation day', status: 'approved', approverId: 'u2', approvedAt: '2026-03-04T11:00:00', submittedAt: '2026-03-03T15:00:00', createdAt: '2026-03-03T15:00:00' },
  // Lisa Park - Apr 8-9, overlaps Michael's Apr 7-11
  { id: 'lr13', employmentRecordId: 'er4', userId: 'u5', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-04-08', endDate: '2026-04-09', unit: 'full-day', totalDays: 2, reason: 'House closing appointment', status: 'approved', approverId: 'u2', approvedAt: '2026-03-06T09:00:00', submittedAt: '2026-03-05T10:00:00', createdAt: '2026-03-05T10:00:00' },
  // Emily - Apr 1-3, standalone approved
  { id: 'lr14', employmentRecordId: 'er1', userId: 'u3', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-04-01', endDate: '2026-04-03', unit: 'full-day', totalDays: 3, reason: 'Spring break with kids', status: 'approved', approverId: 'u4', approvedAt: '2026-03-08T10:00:00', submittedAt: '2026-03-07T08:00:00', createdAt: '2026-03-07T08:00:00' },
  // David Kim - Mar 25-27, overlaps Natalie's Mar 24-26
  { id: 'lr15', employmentRecordId: 'er5', userId: 'u6', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-03-25', endDate: '2026-03-27', unit: 'full-day', totalDays: 3, reason: 'Personal travel', status: 'approved', approverId: 'u4', approvedAt: '2026-03-08T14:00:00', submittedAt: '2026-03-07T16:00:00', createdAt: '2026-03-07T16:00:00' },
  // Natalie Cruz - Mar 5-6, past but in March (sick)
  { id: 'lr16', employmentRecordId: 'er10', userId: 'u9', companyId: 'c1', leaveTypeId: 'lt2', startDate: '2026-03-05', endDate: '2026-03-06', unit: 'full-day', totalDays: 2, reason: 'Migraine', status: 'approved', approverId: 'u1', approvedAt: '2026-03-05T08:00:00', submittedAt: '2026-03-05T07:00:00', createdAt: '2026-03-05T07:00:00' },
  // Marcus Webb - Mar 19-20, overlaps Emily, James, Anna cluster
  { id: 'lr17', employmentRecordId: 'er11', userId: 'u10', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-03-19', endDate: '2026-03-20', unit: 'full-day', totalDays: 2, reason: 'Kubernetes conference attendance', status: 'approved', approverId: 'u4', approvedAt: '2026-03-06T09:00:00', submittedAt: '2026-03-05T14:00:00', createdAt: '2026-03-05T14:00:00' },
  // Sarah Mitchell (CEO) - Apr 9-10, overlaps Michael & Lisa
  { id: 'lr18', employmentRecordId: 'er9', userId: 'u1', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-04-09', endDate: '2026-04-10', unit: 'full-day', totalDays: 2, reason: 'Board retreat', status: 'approved', approverId: 'u1', approvedAt: '2026-03-07T09:00:00', submittedAt: '2026-03-06T16:00:00', createdAt: '2026-03-06T16:00:00' },
  // Anna Johnson - Mar 30-31, overlaps Robert's pending Mar 30-31
  { id: 'lr19', employmentRecordId: 'er8', userId: 'u7', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-03-30', endDate: '2026-03-31', unit: 'full-day', totalDays: 2, reason: 'Home renovation supervision', status: 'approved', approverId: 'u2', approvedAt: '2026-03-07T10:00:00', submittedAt: '2026-03-06T09:00:00', createdAt: '2026-03-06T09:00:00' },
  // James Chen - Apr 14-16, standalone
  { id: 'lr20', employmentRecordId: 'er7', userId: 'u2', companyId: 'c1', leaveTypeId: 'lt1', startDate: '2026-04-14', endDate: '2026-04-16', unit: 'full-day', totalDays: 3, reason: 'Anniversary trip', status: 'approved', approverId: 'u1', approvedAt: '2026-03-08T11:00:00', submittedAt: '2026-03-07T12:00:00', createdAt: '2026-03-07T12:00:00' },
  // Michael Brown - Mar 10, single-day sick (already past)
  { id: 'lr21', employmentRecordId: 'er3', userId: 'u4', companyId: 'c1', leaveTypeId: 'lt2', startDate: '2026-03-10', endDate: '2026-03-10', unit: 'full-day', totalDays: 1, reason: 'Dental surgery', status: 'approved', approverId: 'u2', approvedAt: '2026-03-09T08:00:00', submittedAt: '2026-03-09T07:00:00', createdAt: '2026-03-09T07:00:00' },
];

const seedHolidays: Holiday[] = [
  { id: 'h1', companyId: 'c1', name: 'New Year\'s Day', date: '2026-01-01', isRecurring: true },
  { id: 'h2', companyId: 'c1', name: 'Martin Luther King Jr. Day', date: '2026-01-19', isRecurring: false },
  { id: 'h3', companyId: 'c1', name: 'Presidents\' Day', date: '2026-02-16', isRecurring: false },
  { id: 'h4', companyId: 'c1', name: 'Memorial Day', date: '2026-05-25', isRecurring: false },
  { id: 'h5', companyId: 'c1', name: 'Independence Day', date: '2026-07-04', isRecurring: true },
  { id: 'h6', companyId: 'c1', name: 'Labor Day', date: '2026-09-07', isRecurring: false },
  { id: 'h7', companyId: 'c1', name: 'Thanksgiving', date: '2026-11-26', isRecurring: false },
  { id: 'h8', companyId: 'c1', name: 'Christmas Day', date: '2026-12-25', isRecurring: true },
];

const seedWorkflows: ApprovalWorkflow[] = [
  { id: 'aw1', companyId: 'c1', name: 'Standard Approval', steps: [{ order: 1, type: 'manager' }, { order: 2, type: 'admin' }], isActive: true },
  { id: 'aw2', companyId: 'c1', name: 'Quick Approval', steps: [{ order: 1, type: 'manager', autoApproveBelow: 3 }], isActive: true },
  { id: 'aw3', companyId: 'c1', name: 'Admin Only', steps: [{ order: 1, type: 'admin' }], isActive: false },
];

const seedDocuments: Document[] = [
  { id: 'd1', userId: 'u3', companyId: 'c1', category: 'contract', name: 'Employment Contract', fileName: 'contract_emily_watson.pdf', fileSize: 245000, uploadedAt: '2024-02-01', uploadedBy: 'u2' },
  { id: 'd2', userId: 'u3', companyId: 'c1', category: 'id', name: 'Passport Copy', fileName: 'passport_watson.pdf', fileSize: 1200000, uploadedAt: '2024-02-01', expiresAt: '2029-06-15', uploadedBy: 'u3' },
  { id: 'd3', userId: 'u3', companyId: 'c1', category: 'medical', name: 'Sick Note - Feb 2026', fileName: 'sick_note_feb.pdf', fileSize: 89000, uploadedAt: '2026-02-12', uploadedBy: 'u3' },
  { id: 'd4', userId: 'u4', companyId: 'c1', category: 'contract', name: 'Employment Contract', fileName: 'contract_michael_brown.pdf', fileSize: 256000, uploadedAt: '2024-02-15', uploadedBy: 'u2' },
  { id: 'd5', userId: 'u5', companyId: 'c1', category: 'contract', name: 'Employment Contract', fileName: 'contract_lisa_park.pdf', fileSize: 230000, uploadedAt: '2024-03-01', uploadedBy: 'u2' },
  { id: 'd6', userId: 'u6', companyId: 'c1', category: 'contract', name: 'Employment Contract', fileName: 'contract_david_kim.pdf', fileSize: 248000, uploadedAt: '2024-03-10', uploadedBy: 'u2' },
  { id: 'd7', userId: 'u8', companyId: 'c1', category: 'tax', name: 'W-4 Form', fileName: 'w4_robert_taylor.pdf', fileSize: 95000, uploadedAt: '2024-04-01', uploadedBy: 'u8' },
  { id: 'd8', userId: 'u9', companyId: 'c1', category: 'contract', name: 'Employment Contract', fileName: 'contract_natalie_cruz.pdf', fileSize: 240000, uploadedAt: '2024-04-15', uploadedBy: 'u2' },
  { id: 'd9', userId: 'u10', companyId: 'c1', category: 'contract', name: 'Employment Contract', fileName: 'contract_marcus_webb.pdf', fileSize: 252000, uploadedAt: '2024-05-01', uploadedBy: 'u2' },
];

const seedNotifications: Notification[] = [
  { id: 'n1', userId: 'u3', type: 'approval', title: 'Leave Approved', message: 'Your sick leave for Feb 10-11 has been approved by Michael Brown.', isRead: true, createdAt: '2026-02-10T10:00:00' },
  { id: 'n2', userId: 'u3', type: 'reminder', title: 'Upcoming Leave', message: 'Your annual leave starts on March 16. Make sure to complete handover tasks.', isRead: false, createdAt: '2026-03-09T08:00:00' },
  { id: 'n3', userId: 'u4', type: 'leave_request', title: 'New Leave Request', message: 'Emily Watson has requested 5 days of annual leave (Mar 16-20).', isRead: false, link: '/approvals', createdAt: '2026-03-08T09:01:00' },
  { id: 'n4', userId: 'u2', type: 'leave_request', title: 'Pending Admin Approval', message: 'Robert Taylor\'s leave request requires your approval.', isRead: false, link: '/approvals', createdAt: '2026-03-06T10:01:00' },
  { id: 'n5', userId: 'u3', type: 'announcement', title: 'Company Update', message: 'New holiday calendar for 2026 has been published. Please review the updated dates.', isRead: false, createdAt: '2026-03-05T12:00:00' },
  { id: 'n6', userId: 'u2', type: 'leave_request', title: 'New Leave Request', message: 'Lisa Park has requested 3 days of annual leave (Mar 23-25).', isRead: false, link: '/approvals', createdAt: '2026-03-09T14:31:00' },
];

const seedAuditLogs: AuditLog[] = [
  { id: 'al1', userId: 'u4', userName: 'Michael Brown', companyId: 'c1', action: 'Approved leave request', module: 'Leave', details: 'Approved sick leave for Emily Watson (Feb 10-11)', timestamp: '2026-02-10T10:00:00' },
  { id: 'al2', userId: 'u3', userName: 'Emily Watson', companyId: 'c1', action: 'Submitted leave request', module: 'Leave', details: 'Requested 5 days annual leave (Mar 16-20)', timestamp: '2026-03-08T09:00:00' },
  { id: 'al3', userId: 'u2', userName: 'James Chen', companyId: 'c1', action: 'Updated employee record', module: 'HR', details: 'Changed Robert Taylor department from Sales to Finance', oldValue: 'Sales', newValue: 'Finance', timestamp: '2026-03-05T11:00:00' },
  { id: 'al4', userId: 'u1', userName: 'Sarah Mitchell', action: 'Created company', module: 'Platform', details: 'Created Acme Logistics (ACL)', timestamp: '2024-06-01T09:00:00' },
  { id: 'al5', userId: 'u2', userName: 'James Chen', companyId: 'c1', action: 'Adjusted leave balance', module: 'Leave', details: 'Added 1 day to Michael Brown annual leave balance', oldValue: '19', newValue: '20', timestamp: '2026-03-01T14:00:00' },
];

const seedDepartments: Department[] = [
  { id: 'dep1', companyId: 'c1', name: 'Development', headId: 'u4', employeeCount: 1 },
  { id: 'dep2', companyId: 'c1', name: 'Marketing', headId: 'u5', employeeCount: 1 },
  { id: 'dep3', companyId: 'c1', name: 'Finance', employeeCount: 1 },
  { id: 'dep4', companyId: 'c1', name: 'HR', headId: 'u2', employeeCount: 2 },
  { id: 'dep5', companyId: 'c1', name: 'Executive', headId: 'u1', employeeCount: 1 },
  { id: 'dep6', companyId: 'c1', name: 'Sales', employeeCount: 0 },
  { id: 'dep7', companyId: 'c1', name: 'Product', headId: 'u9', employeeCount: 1 },
  { id: 'dep8', companyId: 'c1', name: 'Client Services', employeeCount: 0 },
  { id: 'dep9', companyId: 'c1', name: 'Support', employeeCount: 0 },
  { id: 'dep10', companyId: 'c1', name: 'Implementation', employeeCount: 1 },
  { id: 'dep11', companyId: 'c1', name: 'Business Development', employeeCount: 0 },
  { id: 'dep12', companyId: 'c1', name: 'DevOps', employeeCount: 2 },
];

// ─── State ─────────────────────────────────────────────

let session: AppSession = {
  currentUser: seedUsers[2], // Emily Watson as default user
  activeCompanyId: 'c1',
  companies: seedCompanies,
  employmentRecords: seedEmploymentRecords.filter(er => er.userId === 'u3'),
};

let users = [...seedUsers];
let companies = [...seedCompanies];
let employmentRecords = [...seedEmploymentRecords];
let leaveTypes = [...seedLeaveTypes];
let leaveModels = [...seedLeaveModels];
let leaveBalances = [...seedLeaveBalances];
let leaveRequests = [...seedLeaveRequests];
let holidays = [...seedHolidays];
let workflows = [...seedWorkflows];
let documents = [...seedDocuments];
let notifications = [...seedNotifications];
let auditLogs = [...seedAuditLogs];
let departments = [...seedDepartments];

// ─── Boot: try loading from localStorage ───────────────
loadFromStorage();

// ─── Session Methods ───────────────────────────────────

function loginAs(role: UserRole): User {
  const user = role === 'owner' ? users[0] : role === 'admin' ? users[1] : users[2];
  const userERs = employmentRecords.filter(er => er.userId === user.id && er.isActive);
  const companyId = userERs[0]?.companyId || 'c1';
  session = {
    ...session,
    currentUser: user,
    companies: role === 'owner' ? companies : companies.filter(c => c.id === companyId),
    activeCompanyId: companyId,
    employmentRecords: userERs,
  };
  notify('session');
  notify('notifications');
  return user;
}

function loginAsUser(userId: string): User | null {
  const user = users.find(u => u.id === userId);
  if (!user) return null;
  const userERs = employmentRecords.filter(er => er.userId === user.id && er.isActive);
  const companyId = userERs[0]?.companyId || 'c1';
  session = {
    ...session,
    currentUser: user,
    companies: user.role === 'owner' ? companies : companies.filter(c => c.id === companyId),
    activeCompanyId: companyId,
    employmentRecords: userERs,
  };
  notify('session');
  notify('notifications');
  return user;
}

// ─── Leave Request CRUD ────────────────────────────────

function createLeaveRequest(data: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>): LeaveRequest {
  const request: LeaveRequest = { ...data, id: generateId(), status: 'submitted', createdAt: new Date().toISOString() };
  leaveRequests = [...leaveRequests, request];
  const er = employmentRecords.find(e => e.id === data.employmentRecordId);
  if (er?.managerId) {
    const user = users.find(u => u.id === data.userId);
    addNotification({ userId: er.managerId, type: 'leave_request', title: 'New Leave Request', message: `${user?.firstName} ${user?.lastName} has requested ${data.totalDays} day(s) of leave.`, link: '/approvals' });
  }
  addAuditLog({ userId: data.userId, userName: getUserName(data.userId), companyId: data.companyId, action: 'Submitted leave request', module: 'Leave', details: `Requested ${data.totalDays} days (${data.startDate} to ${data.endDate})` });
  notify('leaveRequests');
  return request;
}

function approveLeaveRequest(requestId: string, approverId: string, note?: string): LeaveRequest | null {
  const idx = leaveRequests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  const now = new Date().toISOString();
  leaveRequests[idx] = { ...leaveRequests[idx], status: 'approved', approverId, approverNote: note, approvedAt: now };
  leaveRequests = [...leaveRequests];
  const req = leaveRequests[idx];
  const balIdx = leaveBalances.findIndex(b => b.employmentRecordId === req.employmentRecordId && b.leaveTypeId === req.leaveTypeId);
  if (balIdx !== -1) {
    leaveBalances[balIdx] = { ...leaveBalances[balIdx], pending: Math.max(0, leaveBalances[balIdx].pending - req.totalDays), used: leaveBalances[balIdx].used + req.totalDays, available: leaveBalances[balIdx].available - req.totalDays };
    leaveBalances = [...leaveBalances];
    notify('leaveBalances');
  }
  addNotification({ userId: req.userId, type: 'approval', title: 'Leave Approved', message: `Your leave request for ${req.startDate} to ${req.endDate} has been approved.` });
  addAuditLog({ userId: approverId, userName: getUserName(approverId), companyId: req.companyId, action: 'Approved leave request', module: 'Leave', details: `Approved ${req.totalDays} days leave for ${getUserName(req.userId)}` });
  notify('leaveRequests');
  return leaveRequests[idx];
}

function rejectLeaveRequest(requestId: string, approverId: string, note?: string): LeaveRequest | null {
  const idx = leaveRequests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  leaveRequests[idx] = { ...leaveRequests[idx], status: 'rejected', approverId, approverNote: note };
  leaveRequests = [...leaveRequests];
  const req = leaveRequests[idx];
  addNotification({ userId: req.userId, type: 'approval', title: 'Leave Rejected', message: `Your leave request for ${req.startDate} to ${req.endDate} has been rejected.${note ? ` Reason: ${note}` : ''}` });
  notify('leaveRequests');
  return leaveRequests[idx];
}

function cancelLeaveRequest(requestId: string): LeaveRequest | null {
  const idx = leaveRequests.findIndex(r => r.id === requestId);
  if (idx === -1) return null;
  leaveRequests[idx] = { ...leaveRequests[idx], status: 'cancelled' };
  leaveRequests = [...leaveRequests];
  notify('leaveRequests');
  return leaveRequests[idx];
}

// ─── Notification CRUD ─────────────────────────────────

function addNotification(data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) {
  const notif: Notification = { ...data, id: generateId(), isRead: false, createdAt: new Date().toISOString() };
  notifications = [...notifications, notif];
  notify('notifications');
}

function markNotificationRead(id: string) {
  const idx = notifications.findIndex(n => n.id === id);
  if (idx !== -1) { notifications[idx] = { ...notifications[idx], isRead: true }; notifications = [...notifications]; notify('notifications'); }
}

function markAllNotificationsRead(userId: string) {
  notifications = notifications.map(n => n.userId === userId ? { ...n, isRead: true } : n);
  notify('notifications');
}

// ─── Audit Log ─────────────────────────────────────────

function addAuditLog(data: Omit<AuditLog, 'id' | 'timestamp'>) {
  const log: AuditLog = { ...data, id: generateId(), timestamp: new Date().toISOString() };
  auditLogs = [log, ...auditLogs];
  notify('auditLogs');
}

// ─── Leave Balance Adjustments ─────────────────────────

function adjustLeaveBalance(balanceId: string, adjustment: number, reason: string): LeaveBalance | null {
  const idx = leaveBalances.findIndex(b => b.id === balanceId);
  if (idx === -1) return null;
  const old = leaveBalances[idx];
  leaveBalances[idx] = { ...old, adjusted: old.adjusted + adjustment, available: old.available + adjustment };
  leaveBalances = [...leaveBalances];
  addAuditLog({ userId: session.currentUser.id, userName: `${session.currentUser.firstName} ${session.currentUser.lastName}`, companyId: session.activeCompanyId, action: 'Adjusted leave balance', module: 'Leave', details: reason, oldValue: String(old.available), newValue: String(old.available + adjustment) });
  notify('leaveBalances');
  return leaveBalances[idx];
}

// ─── Employee / User CRUD ──────────────────────────────

function addUser(data: Omit<User, 'id' | 'createdAt'>): User {
  const user: User = { ...data, id: generateId(), createdAt: new Date().toISOString().split('T')[0] };
  users = [...users, user];
  notify('users');
  return user;
}

function updateUser(id: string, updates: Partial<User>): User | null {
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...updates };
  users = [...users];
  if (session.currentUser.id === id) { session = { ...session, currentUser: users[idx] }; notify('session'); }
  notify('users');
  return users[idx];
}

function deleteUser(id: string): boolean {
  const before = users.length;
  users = users.filter(u => u.id !== id);
  employmentRecords = employmentRecords.filter(er => er.userId !== id);
  if (users.length < before) { notify('users'); notify('employmentRecords'); return true; }
  return false;
}

function addEmploymentRecord(data: Omit<EmploymentRecord, 'id'>): EmploymentRecord {
  const er: EmploymentRecord = { ...data, id: generateId() };
  employmentRecords = [...employmentRecords, er];
  notify('employmentRecords');
  return er;
}

function updateEmploymentRecord(id: string, updates: Partial<EmploymentRecord>): EmploymentRecord | null {
  const idx = employmentRecords.findIndex(er => er.id === id);
  if (idx === -1) return null;
  employmentRecords[idx] = { ...employmentRecords[idx], ...updates };
  employmentRecords = [...employmentRecords];
  notify('employmentRecords');
  return employmentRecords[idx];
}

// ─── Company CRUD ──────────────────────────────────────

function addCompany(data: Omit<Company, 'id' | 'createdAt' | 'employeeCount'>): Company {
  const company: Company = { ...data, id: generateId(), employeeCount: 0, createdAt: new Date().toISOString().split('T')[0] };
  companies = [...companies, company];
  addAuditLog({ userId: session.currentUser.id, userName: `${session.currentUser.firstName} ${session.currentUser.lastName}`, action: 'Created company', module: 'Platform', details: `Created ${company.name} (${company.code})` });
  notify('companies');
  return company;
}

function updateCompany(id: string, updates: Partial<Company>): Company | null {
  const idx = companies.findIndex(c => c.id === id);
  if (idx === -1) return null;
  companies[idx] = { ...companies[idx], ...updates };
  companies = [...companies];
  notify('companies');
  return companies[idx];
}

function deleteCompany(id: string): boolean {
  const before = companies.length;
  companies = companies.filter(c => c.id !== id);
  if (companies.length < before) { notify('companies'); return true; }
  return false;
}

// ─── Department CRUD ───────────────────────────────────

function addDepartment(data: Omit<Department, 'id'>): Department {
  const dept: Department = { ...data, id: generateId() };
  departments = [...departments, dept];
  notify('departments');
  return dept;
}

function updateDepartment(id: string, updates: Partial<Department>): Department | null {
  const idx = departments.findIndex(d => d.id === id);
  if (idx === -1) return null;
  departments[idx] = { ...departments[idx], ...updates };
  departments = [...departments];
  notify('departments');
  return departments[idx];
}

function deleteDepartment(id: string): boolean {
  const before = departments.length;
  departments = departments.filter(d => d.id !== id);
  if (departments.length < before) { notify('departments'); return true; }
  return false;
}

// ─── Document CRUD ─────────────────────────────────────

function addDocument(data: Omit<Document, 'id'>): Document {
  const doc: Document = { ...data, id: generateId() };
  documents = [...documents, doc];
  notify('documents');
  return doc;
}

function deleteDocument(id: string): boolean {
  const before = documents.length;
  documents = documents.filter(d => d.id !== id);
  if (documents.length < before) { notify('documents'); return true; }
  return false;
}

// ─── Holiday CRUD ──────────────────────────────────────

function addHoliday(data: Omit<Holiday, 'id'>): Holiday {
  const holiday: Holiday = { ...data, id: generateId() };
  holidays = [...holidays, holiday];
  notify('holidays');
  return holiday;
}

function updateHoliday(id: string, updates: Partial<Holiday>): Holiday | null {
  const idx = holidays.findIndex(h => h.id === id);
  if (idx === -1) return null;
  holidays[idx] = { ...holidays[idx], ...updates };
  holidays = [...holidays];
  notify('holidays');
  return holidays[idx];
}

function deleteHoliday(id: string): boolean {
  const before = holidays.length;
  holidays = holidays.filter(h => h.id !== id);
  if (holidays.length < before) { notify('holidays'); return true; }
  return false;
}

// ─── Leave Type CRUD ───────────────────────────────────

function addLeaveType(data: Omit<LeaveType, 'id'>): LeaveType {
  const lt: LeaveType = { ...data, id: generateId() };
  leaveTypes = [...leaveTypes, lt];
  notify('leaveTypes');
  return lt;
}

function updateLeaveType(id: string, updates: Partial<LeaveType>): LeaveType | null {
  const idx = leaveTypes.findIndex(lt => lt.id === id);
  if (idx === -1) return null;
  leaveTypes[idx] = { ...leaveTypes[idx], ...updates };
  leaveTypes = [...leaveTypes];
  notify('leaveTypes');
  return leaveTypes[idx];
}

function deleteLeaveType(id: string): boolean {
  const before = leaveTypes.length;
  leaveTypes = leaveTypes.filter(lt => lt.id !== id);
  if (leaveTypes.length < before) { notify('leaveTypes'); return true; }
  return false;
}

// ─── Leave Model CRUD ──────────────────────────────────

function addLeaveModel(data: Omit<LeaveModel, 'id'>): LeaveModel {
  const lm: LeaveModel = { ...data, id: generateId() };
  leaveModels = [...leaveModels, lm];
  notify('leaveModels');
  return lm;
}

function updateLeaveModel(id: string, updates: Partial<LeaveModel>): LeaveModel | null {
  const idx = leaveModels.findIndex(lm => lm.id === id);
  if (idx === -1) return null;
  leaveModels[idx] = { ...leaveModels[idx], ...updates };
  leaveModels = [...leaveModels];
  notify('leaveModels');
  return leaveModels[idx];
}

function deleteLeaveModel(id: string): boolean {
  const before = leaveModels.length;
  leaveModels = leaveModels.filter(lm => lm.id !== id);
  if (leaveModels.length < before) { notify('leaveModels'); return true; }
  return false;
}

// ─── Workflow CRUD ─────────────────────────────────────

function addWorkflow(data: Omit<ApprovalWorkflow, 'id'>): ApprovalWorkflow {
  const wf: ApprovalWorkflow = { ...data, id: generateId() };
  workflows = [...workflows, wf];
  notify('workflows');
  return wf;
}

function updateWorkflow(id: string, updates: Partial<ApprovalWorkflow>): ApprovalWorkflow | null {
  const idx = workflows.findIndex(w => w.id === id);
  if (idx === -1) return null;
  workflows[idx] = { ...workflows[idx], ...updates };
  workflows = [...workflows];
  notify('workflows');
  return workflows[idx];
}

function deleteWorkflow(id: string): boolean {
  const before = workflows.length;
  workflows = workflows.filter(w => w.id !== id);
  if (workflows.length < before) { notify('workflows'); return true; }
  return false;
}

// ─── Helpers ───────────────────────────────────────────

function getUserName(userId: string): string {
  const u = users.find(user => user.id === userId);
  return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
}

function getCompanyEmployees(companyId: string) {
  return employmentRecords.filter(er => er.companyId === companyId && er.isActive);
}

function getUserLeaveBalances(employmentRecordId: string) {
  return leaveBalances.filter(b => b.employmentRecordId === employmentRecordId);
}

function getLeaveRequestsForUser(userId: string, companyId?: string) {
  return leaveRequests.filter(r => r.userId === userId && (!companyId || r.companyId === companyId));
}

function getPendingApprovals(approverId: string) {
  const managedRecords = employmentRecords.filter(er => er.managerId === approverId);
  const managedEmploymentIds = managedRecords.map(er => er.id);
  const approverUser = users.find(u => u.id === approverId);
  return leaveRequests.filter(r => {
    if (r.status === 'pending_manager' && managedEmploymentIds.includes(r.employmentRecordId)) return true;
    if (r.status === 'pending_admin' && (approverUser?.role === 'admin' || approverUser?.role === 'owner')) return true;
    if (r.status === 'submitted') {
      const er = employmentRecords.find(e => e.id === r.employmentRecordId);
      if (er?.managerId === approverId) return true;
    }
    return false;
  });
}

function getCompanyLeaveRequests(companyId: string) { return leaveRequests.filter(r => r.companyId === companyId); }

function getUpcomingLeave(companyId: string): LeaveRequest[] {
  const today = new Date().toISOString().split('T')[0];
  return leaveRequests.filter(r => r.companyId === companyId && r.status === 'approved' && r.endDate >= today);
}

// ─── Public API ────────────────────────────────────────

export const appStore = {
  get session() { return session; },
  get users() { return users; },
  get companies() { return companies; },
  get employmentRecords() { return employmentRecords; },
  get leaveTypes() { return leaveTypes; },
  get leaveModels() { return leaveModels; },
  get leaveBalances() { return leaveBalances; },
  get leaveRequests() { return leaveRequests; },
  get holidays() { return holidays; },
  get workflows() { return workflows; },
  get documents() { return documents; },
  get notifications() { return notifications; },
  get auditLogs() { return auditLogs; },
  get departments() { return departments; },

  get currentUserNotifications() { return notifications.filter(n => n.userId === session.currentUser.id); },
  get unreadNotificationCount() { return notifications.filter(n => n.userId === session.currentUser.id && !n.isRead).length; },

  getUserName, getCompanyEmployees, getUserLeaveBalances, getLeaveRequestsForUser,
  getPendingApprovals, getCompanyLeaveRequests, getUpcomingLeave,
  getUser: (id: string) => users.find(u => u.id === id),
  getCompany: (id: string) => companies.find(c => c.id === id),
  getLeaveType: (id: string) => leaveTypes.find(lt => lt.id === id),
  getLeaveModel: (id: string) => leaveModels.find(lm => lm.id === id),
  getEmploymentRecord: (id: string) => employmentRecords.find(er => er.id === id),
  getEmploymentRecordsForUser: (userId: string) => employmentRecords.filter(er => er.userId === userId),
  getHolidaysForCompany: (companyId: string) => holidays.filter(h => h.companyId === companyId),
  getDepartmentsForCompany: (companyId: string) => departments.filter(d => d.companyId === companyId),
  getLeaveTypesForCompany: (companyId: string) => leaveTypes.filter(lt => lt.companyId === companyId),
  getLeaveModelsForCompany: (companyId: string) => leaveModels.filter(lm => lm.companyId === companyId),
  getWorkflowsForCompany: (companyId: string) => workflows.filter(w => w.companyId === companyId),
  getDocumentsForUser: (userId: string) => documents.filter(d => d.userId === userId),

  loginAs, loginAsUser, createLeaveRequest, approveLeaveRequest, rejectLeaveRequest, cancelLeaveRequest,
  addNotification, markNotificationRead, markAllNotificationsRead,
  addAuditLog, adjustLeaveBalance, updateEmploymentRecord,
  addHoliday, updateHoliday, deleteHoliday,
  addUser, updateUser, deleteUser, addEmploymentRecord,
  addCompany, updateCompany, deleteCompany,
  addDepartment, updateDepartment, deleteDepartment,
  addDocument, deleteDocument,
  addLeaveType, updateLeaveType, deleteLeaveType,
  addLeaveModel, updateLeaveModel, deleteLeaveModel,
  addWorkflow, updateWorkflow, deleteWorkflow,

  subscribe(slice: Slice, listener: Listener): () => void {
    subscribers[slice].add(listener);
    return () => subscribers[slice].delete(listener);
  },

  saveToStorage,
  loadFromStorage,
  resetAllData,
};

export type { Slice };