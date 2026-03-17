// ─── Core Types ────────────────────────────────────────

export type UserRole = 'owner' | 'admin' | 'user';
export type EmploymentType = 'full-time' | 'part-time' | 'contractor' | 'intern';
export type LeaveRequestStatus = 'draft' | 'submitted' | 'pending_manager' | 'pending_admin' | 'approved' | 'rejected' | 'cancelled' | 'returned';
export type LeaveUnit = 'full-day' | 'half-day-am' | 'half-day-pm' | 'hourly';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  code: string;
  country: string;
  currency: string;
  logoUrl?: string;
  isActive: boolean;
  employeeCount: number;
  createdAt: string;
}

export interface EmploymentRecord {
  id: string;
  userId: string;
  companyId: string;
  department: string;
  team: string;
  jobTitle: string;
  managerId?: string;
  employmentType: EmploymentType;
  startDate: string;
  endDate?: string;
  isOnProbation: boolean;
  leaveModelId: string;
  location: string;
  isActive: boolean;
}

export interface LeaveType {
  id: string;
  companyId: string;
  name: string;
  code: string;
  color: string;
  isPaid: boolean;
  requiresDocument: boolean;
  allowHalfDay: boolean;
  allowNegativeBalance: boolean;
  maxDaysPerYear: number;
  isActive: boolean;
}

export interface LeaveModel {
  id: string;
  companyId: string;
  name: string;
  description: string;
  leaveTypes: LeaveModelAllocation[];
  workingDays: number[];
  carryOverLimit: number;
  accrualType: 'annual' | 'monthly' | 'bi-weekly';
  isDefault: boolean;
  isActive: boolean;
}

export interface LeaveModelAllocation {
  leaveTypeId: string;
  entitlement: number;
  accrualRate?: number;
}

export interface LeaveBalance {
  id: string;
  employmentRecordId: string;
  leaveTypeId: string;
  entitled: number;
  used: number;
  pending: number;
  carriedOver: number;
  adjusted: number;
  available: number;
  year: number;
}

export interface LeaveRequest {
  id: string;
  employmentRecordId: string;
  userId: string;
  companyId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  unit: LeaveUnit;
  totalDays: number;
  reason: string;
  status: LeaveRequestStatus;
  approverId?: string;
  approverNote?: string;
  approvedAt?: string;
  submittedAt: string;
  createdAt: string;
  documentUrl?: string;
}

export interface Holiday {
  id: string;
  companyId: string;
  name: string;
  date: string;
  isRecurring: boolean;
}

export interface ApprovalWorkflow {
  id: string;
  companyId: string;
  name: string;
  steps: ApprovalStep[];
  isActive: boolean;
}

export interface ApprovalStep {
  order: number;
  type: 'manager' | 'admin' | 'role';
  roleId?: string;
  autoApproveBelow?: number;
}

export interface Document {
  id: string;
  userId: string;
  companyId?: string;
  category: 'contract' | 'id' | 'tax' | 'medical' | 'policy' | 'leave' | 'other';
  name: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  expiresAt?: string;
  uploadedBy: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'leave_request' | 'approval' | 'reminder' | 'system' | 'document' | 'announcement';
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  companyId?: string;
  action: string;
  module: string;
  details: string;
  oldValue?: string;
  newValue?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface Department {
  id: string;
  companyId: string;
  name: string;
  headId?: string;
  employeeCount: number;
}

// ─── Session / Context ─────────────────────────────────

export interface AppSession {
  currentUser: User;
  activeCompanyId: string;
  companies: Company[];
  employmentRecords: EmploymentRecord[];
}

// ─── Onboarding / Offboarding ──────────────────────────

export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';
export type OnboardingTaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue';
export type OffboardingReason = 'resignation' | 'termination' | 'contract_end' | 'retirement';

export interface OnboardingTemplate {
  id: string;
  companyId: string;
  name: string;
  description: string;
  tasks: OnboardingTaskTemplate[];
  isActive: boolean;
}

export interface OnboardingTaskTemplate {
  id: string;
  title: string;
  description: string;
  category: 'document' | 'training' | 'access' | 'equipment' | 'introduction' | 'policy';
  ownerId?: string;
  dueOffsetDays: number; // days from start date
  isRequired: boolean;
}

export interface EmployeeOnboarding {
  id: string;
  employmentRecordId: string;
  userId: string;
  companyId: string;
  templateId: string;
  status: OnboardingStatus;
  startDate: string;
  completionPercent: number;
  tasks: EmployeeOnboardingTask[];
  createdAt: string;
}

export interface EmployeeOnboardingTask {
  id: string;
  taskTemplateId: string;
  title: string;
  description: string;
  category: string;
  status: OnboardingTaskStatus;
  ownerId?: string;
  dueDate: string;
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface OffboardingWorkflow {
  id: string;
  employmentRecordId: string;
  userId: string;
  companyId: string;
  reason: OffboardingReason;
  lastWorkingDay: string;
  status: OnboardingStatus;
  completionPercent: number;
  tasks: OffboardingTask[];
  createdAt: string;
}

export interface OffboardingTask {
  id: string;
  title: string;
  category: 'access' | 'equipment' | 'knowledge' | 'payroll' | 'exit';
  status: OnboardingTaskStatus;
  ownerId?: string;
  dueDate: string;
  completedAt?: string;
  notes?: string;
}

// ─── Performance Management ────────────────────────────

export type ReviewCycleStatus = 'draft' | 'active' | 'completed' | 'archived';
export type ReviewStatus = 'pending' | 'self_review' | 'manager_review' | 'completed';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'cancelled';

export interface PerformanceReviewCycle {
  id: string;
  companyId: string;
  name: string;
  type: 'annual' | 'quarterly' | 'probation' | 'promotion';
  startDate: string;
  endDate: string;
  status: ReviewCycleStatus;
  reviewCount: number;
  completedCount: number;
}

export interface PerformanceReview {
  id: string;
  cycleId: string;
  userId: string;
  companyId: string;
  reviewerId: string;
  status: ReviewStatus;
  selfRating?: number;
  managerRating?: number;
  overallRating?: number;
  strengths?: string;
  improvements?: string;
  managerComments?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PerformanceGoal {
  id: string;
  userId: string;
  companyId: string;
  title: string;
  description: string;
  category: 'objective' | 'key_result' | 'development';
  status: GoalStatus;
  progress: number;
  weight: number; // percentage weight in overall performance
  dueDate: string;
  createdAt: string;
}

export interface GoalMetric {
  id: string;
  goalId: string;
  companyId: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: 'percentage' | 'number' | 'currency' | 'rating';
  weight: number; // percentage weight within the goal
  createdAt: string;
}

export interface ReviewGoalRating {
  id: string;
  reviewId: string;
  goalId: string;
  selfRating?: number;
  managerRating?: number;
  peerRatings?: PeerRatingEntry[];
  selfComment?: string;
  managerComment?: string;
}

export interface ReviewMetricRating {
  id: string;
  reviewId: string;
  metricId: string;
  goalId: string;
  selfRating?: number;
  managerRating?: number;
  peerRatings?: PeerRatingEntry[];
}

export interface PeerRatingEntry {
  userId: string;
  rating: number;
  comment?: string;
}

export type PeerReviewStatus = 'requested' | 'in_progress' | 'completed' | 'declined';

export interface PeerReview {
  id: string;
  reviewId: string;
  peerUserId: string;
  companyId: string;
  status: PeerReviewStatus;
  overallRating?: number;
  strengths?: string;
  improvements?: string;
  requestedAt: string;
  completedAt?: string;
}

export type IncentiveModelStatus = 'draft' | 'active' | 'archived';

export interface IncentiveModel {
  id: string;
  companyId: string;
  name: string;
  description: string;
  status: IncentiveModelStatus;
  metrics: IncentiveMetricItem[];
  goals: IncentiveGoalItem[];
  outcomes: IncentiveOutcome[];
  createdAt: string;
  updatedAt: string;
}

export interface IncentiveMetricItem {
  id: string;
  name: string;
  description: string;
  weight: number; // percentage
  targetValue: number;
  unit: string;
}

export interface IncentiveGoalItem {
  id: string;
  name: string;
  description: string;
  weight: number; // percentage
}

export interface IncentiveOutcome {
  id: string;
  name: string;
  minRating: number;
  maxRating: number;
  incentivePercent: number; // percentage of base
  description: string;
}

export interface IncentiveAssignment {
  id: string;
  modelId: string;
  userId: string;
  companyId: string;
  assignedAt: string;
  status: 'active' | 'completed' | 'cancelled';
  currentRating?: number;
  incentiveEarned?: number;
  period: string;
}

export interface FeedbackNote {
  id: string;
  fromUserId: string;
  toUserId: string;
  companyId: string;
  type: 'praise' | 'coaching' | 'warning' | 'note';
  content: string;
  isPrivate: boolean;
  createdAt: string;
}

// ─── Policy Acknowledgment ─────────────────────────────

export type PolicyStatus = 'draft' | 'published' | 'archived';
export type AcknowledgmentStatus = 'pending' | 'acknowledged' | 'overdue' | 'expired';

export interface PolicyDocument {
  id: string;
  companyId: string;
  title: string;
  description: string;
  category: 'handbook' | 'security' | 'leave' | 'conduct' | 'harassment' | 'remote_work' | 'other';
  version: number;
  status: PolicyStatus;
  content: string;
  requiresAcknowledgment: boolean;
  acknowledgmentDeadlineDays: number;
  publishedAt?: string;
  createdAt: string;
  updatedBy: string;
}

export interface PolicyAcknowledgment {
  id: string;
  policyId: string;
  userId: string;
  companyId: string;
  status: AcknowledgmentStatus;
  acknowledgedAt?: string;
  dueDate: string;
  remindersSent: number;
}

// ─── E-Signatures ──────────────────────────────────────

export type SignatureRequestStatus = 'draft' | 'sent' | 'viewed' | 'partially_signed' | 'signed' | 'declined' | 'expired';
export type SignerStatus = 'pending' | 'viewed' | 'signed' | 'declined';
export type SignatureType = 'typed' | 'drawn' | 'uploaded';

export interface SignatureRequest {
  id: string;
  companyId: string;
  title: string;
  documentName: string;
  documentCategory: 'contract' | 'nda' | 'policy' | 'performance' | 'disciplinary' | 'other';
  status: SignatureRequestStatus;
  createdBy: string;
  signers: Signer[];
  createdAt: string;
  expiresAt?: string;
  completedAt?: string;
}

export interface Signer {
  id: string;
  userId: string;
  order: number;
  status: SignerStatus;
  signatureType?: SignatureType;
  signedAt?: string;
  viewedAt?: string;
  declinedReason?: string;
  ipAddress?: string;
}

export interface SignatureAuditEntry {
  id: string;
  requestId: string;
  userId: string;
  action: 'created' | 'sent' | 'viewed' | 'signed' | 'declined' | 'expired' | 'completed' | 'reminder_sent';
  timestamp: string;
  ipAddress?: string;
  details?: string;
}

// ─── Payroll Integration ───────────────────────────────

export type PayrollProvider = 'sage' | 'xero' | 'quickbooks' | 'adp' | 'paychex' | 'custom';
export type SyncStatus = 'success' | 'failed' | 'partial' | 'running' | 'pending';
export type SyncFrequency = 'real_time' | 'nightly' | 'payroll_cycle' | 'manual';

export interface PayrollIntegration {
  id: string;
  companyId: string;
  provider: PayrollProvider;
  providerName: string;
  isConnected: boolean;
  syncFrequency: SyncFrequency;
  lastSyncAt?: string;
  lastSyncStatus?: SyncStatus;
  syncedEmployees: number;
  totalEmployees: number;
  settings: {
    syncLeaveData: boolean;
    syncEmployeeData: boolean;
    syncDeductions: boolean;
    autoExport: boolean;
  };
  connectedAt?: string;
}

export interface PayrollSyncLog {
  id: string;
  integrationId: string;
  companyId: string;
  status: SyncStatus;
  syncType: 'full' | 'incremental' | 'manual' | 'export';
  recordsSynced: number;
  recordsFailed: number;
  errors: PayrollSyncError[];
  startedAt: string;
  completedAt?: string;
  triggeredBy: string;
}

export interface PayrollSyncError {
  field: string;
  employeeId?: string;
  employeeName?: string;
  message: string;
  severity: 'warning' | 'error';
}

export interface PayrollExport {
  id: string;
  companyId: string;
  format: 'csv' | 'excel' | 'xml' | 'json';
  exportType: 'leave_data' | 'employee_data' | 'deductions' | 'full';
  period: string;
  recordCount: number;
  fileSize: number;
  status: 'completed' | 'failed' | 'generating';
  createdAt: string;
  createdBy: string;
}