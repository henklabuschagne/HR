import type {
  OnboardingTemplate, EmployeeOnboarding, OffboardingWorkflow,
  PerformanceReviewCycle, PerformanceReview, PerformanceGoal, FeedbackNote,
  PolicyDocument, PolicyAcknowledgment,
  GoalMetric, ReviewGoalRating, ReviewMetricRating,
  IncentiveModel, IncentiveAssignment,
  PeerReview, PeerRatingEntry,
} from './types';

let idCounter = 2000;
function genId(): string { return `aid_${++idCounter}`; }

// ─── LocalStorage Persistence ──────────────────────────
const ADDITIONAL_STORAGE_KEY = 'additionalStore_state';

function saveAdditionalToStorage() {
  try {
    const state = {
      idCounter,
      onboardingTemplates, employeeOnboardings, offboardingWorkflows,
      reviewCycles, performanceReviews, performanceGoals, feedbackNotes,
      policyDocuments, policyAcknowledgments,
      goalMetrics, reviewGoalRatings, reviewMetricRatings,
      incentiveModels, incentiveAssignments, peerReviews,
    };
    localStorage.setItem(ADDITIONAL_STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded */ }
}

function loadAdditionalFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(ADDITIONAL_STORAGE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    idCounter = s.idCounter || 2000;
    onboardingTemplates = s.onboardingTemplates || [];
    employeeOnboardings = s.employeeOnboardings || [];
    offboardingWorkflows = s.offboardingWorkflows || [];
    reviewCycles = s.reviewCycles || [];
    performanceReviews = s.performanceReviews || [];
    performanceGoals = s.performanceGoals || [];
    feedbackNotes = s.feedbackNotes || [];
    policyDocuments = s.policyDocuments || [];
    policyAcknowledgments = s.policyAcknowledgments || [];
    goalMetrics = s.goalMetrics || [];
    reviewGoalRatings = s.reviewGoalRatings || [];
    reviewMetricRatings = s.reviewMetricRatings || [];
    incentiveModels = s.incentiveModels || [];
    incentiveAssignments = s.incentiveAssignments || [];
    peerReviews = s.peerReviews || [];
    return true;
  } catch { return false; }
}

// ─── Onboarding Seed Data ──────────────────────────────

let onboardingTemplates: OnboardingTemplate[] = [
  { id: 'obt1', companyId: 'c1', name: 'Developer Onboarding', description: 'Standard onboarding for development roles', isActive: true, tasks: [
    { id: 'obt1t1', title: 'Sign Employment Contract', description: 'Review and sign the employment contract', category: 'document', dueOffsetDays: -3, isRequired: true },
    { id: 'obt1t2', title: 'Complete Personal Details Form', description: 'Fill in emergency contacts, bank details, etc.', category: 'document', dueOffsetDays: 0, isRequired: true },
    { id: 'obt1t3', title: 'Setup Laptop & Dev Environment', description: 'Collect equipment and install required software', category: 'equipment', ownerId: 'u2', dueOffsetDays: 0, isRequired: true },
    { id: 'obt1t4', title: 'Create Email & Slack Accounts', description: 'IT team creates accounts', category: 'access', ownerId: 'u2', dueOffsetDays: -1, isRequired: true },
    { id: 'obt1t5', title: 'GitHub Repository Access', description: 'Grant access to relevant code repositories', category: 'access', ownerId: 'u4', dueOffsetDays: 0, isRequired: true },
    { id: 'obt1t6', title: 'Security Training', description: 'Complete mandatory security awareness training', category: 'training', dueOffsetDays: 5, isRequired: true },
    { id: 'obt1t7', title: 'Meet Your Manager', description: 'Introductory 1:1 with direct manager', category: 'introduction', dueOffsetDays: 0, isRequired: true },
    { id: 'obt1t8', title: 'Team Introduction', description: 'Meet the team and understand roles', category: 'introduction', dueOffsetDays: 1, isRequired: false },
    { id: 'obt1t9', title: 'Sign NDA', description: 'Review and sign Non-Disclosure Agreement', category: 'document', dueOffsetDays: 0, isRequired: true },
    { id: 'obt1t10', title: 'Read Company Handbook', description: 'Review and acknowledge the company handbook', category: 'policy', dueOffsetDays: 7, isRequired: true },
  ]},
  { id: 'obt2', companyId: 'c1', name: 'Finance Onboarding', description: 'Onboarding for finance department roles', isActive: true, tasks: [
    { id: 'obt2t1', title: 'Sign Employment Contract', description: 'Review and sign the employment contract', category: 'document', dueOffsetDays: -3, isRequired: true },
    { id: 'obt2t2', title: 'Accounting System Access', description: 'Setup access to accounting software', category: 'access', ownerId: 'u2', dueOffsetDays: 0, isRequired: true },
    { id: 'obt2t3', title: 'Compliance Training', description: 'Complete financial compliance training', category: 'training', dueOffsetDays: 5, isRequired: true },
    { id: 'obt2t4', title: 'Tax Forms', description: 'Complete required tax documentation', category: 'document', dueOffsetDays: 3, isRequired: true },
  ]},
];

let employeeOnboardings: EmployeeOnboarding[] = [
  { id: 'eo1', employmentRecordId: 'er6', userId: 'u8', companyId: 'c1', templateId: 'obt2', status: 'in_progress', startDate: '2024-04-01', completionPercent: 75, createdAt: '2024-03-25', tasks: [
    { id: 'eot1', taskTemplateId: 'obt2t1', title: 'Sign Employment Contract', description: 'Review and sign the employment contract', category: 'document', status: 'completed', dueDate: '2024-03-29', completedAt: '2024-03-28', completedBy: 'u8' },
    { id: 'eot2', taskTemplateId: 'obt2t2', title: 'Accounting System Access', description: 'Setup access to accounting software', category: 'access', status: 'completed', ownerId: 'u2', dueDate: '2024-04-01', completedAt: '2024-04-01', completedBy: 'u2' },
    { id: 'eot3', taskTemplateId: 'obt2t3', title: 'Compliance Training', description: 'Complete financial compliance training', category: 'training', status: 'completed', dueDate: '2024-04-06', completedAt: '2024-04-05', completedBy: 'u8' },
    { id: 'eot4', taskTemplateId: 'obt2t4', title: 'Tax Forms', description: 'Complete required tax documentation', category: 'document', status: 'pending', dueDate: '2024-04-04' },
  ]},
  { id: 'eo2', employmentRecordId: 'er5', userId: 'u6', companyId: 'c1', templateId: 'obt1', status: 'in_progress', startDate: '2024-03-10', completionPercent: 50, createdAt: '2024-03-05', tasks: [
    { id: 'eot5', taskTemplateId: 'obt1t1', title: 'Sign Contract', description: 'Sign employment contract', category: 'document', status: 'completed', dueDate: '2024-03-05', completedAt: '2024-03-04', completedBy: 'u6' },
    { id: 'eot6', taskTemplateId: 'obt1t4', title: 'Create Email & Slack', description: 'IT creates accounts', category: 'access', status: 'completed', dueDate: '2024-03-07', completedAt: '2024-03-06', completedBy: 'u2' },
    { id: 'eot7', taskTemplateId: 'obt1t3', title: 'Setup Laptop', description: 'Configure workspace and equipment', category: 'equipment', status: 'in_progress', ownerId: 'u2', dueDate: '2024-03-10' },
    { id: 'eot8', taskTemplateId: 'obt1t6', title: 'Security Training', description: 'Complete security awareness training', category: 'training', status: 'pending', dueDate: '2024-03-17' },
  ]},
  // Natalie Cruz (u9) - Product onboarding
  { id: 'eo3', employmentRecordId: 'er10', userId: 'u9', companyId: 'c1', templateId: 'obt1', status: 'completed', startDate: '2024-04-15', completionPercent: 100, createdAt: '2024-04-10', tasks: [
    { id: 'eot9', taskTemplateId: 'obt1t1', title: 'Sign Employment Contract', description: 'Review and sign the employment contract', category: 'document', status: 'completed', dueDate: '2024-04-12', completedAt: '2024-04-11', completedBy: 'u9' },
    { id: 'eot10', taskTemplateId: 'obt1t2', title: 'Complete Personal Details Form', description: 'Fill in emergency contacts, bank details, etc.', category: 'document', status: 'completed', dueDate: '2024-04-15', completedAt: '2024-04-14', completedBy: 'u9' },
    { id: 'eot11', taskTemplateId: 'obt1t4', title: 'Create Email & Slack Accounts', description: 'IT team creates accounts', category: 'access', status: 'completed', ownerId: 'u2', dueDate: '2024-04-14', completedAt: '2024-04-13', completedBy: 'u2' },
    { id: 'eot12', taskTemplateId: 'obt1t3', title: 'Setup Laptop & Tools', description: 'Collect equipment and install product management tools (Jira, Figma, Amplitude)', category: 'equipment', status: 'completed', ownerId: 'u2', dueDate: '2024-04-15', completedAt: '2024-04-15', completedBy: 'u2' },
    { id: 'eot13', taskTemplateId: 'obt1t6', title: 'Security Training', description: 'Complete mandatory security awareness training', category: 'training', status: 'completed', dueDate: '2024-04-20', completedAt: '2024-04-18', completedBy: 'u9' },
    { id: 'eot14', taskTemplateId: 'obt1t7', title: 'Meet Your Manager', description: 'Introductory 1:1 with CEO Sarah Mitchell', category: 'introduction', status: 'completed', dueDate: '2024-04-15', completedAt: '2024-04-15', completedBy: 'u9' },
    { id: 'eot15', taskTemplateId: 'obt1t8', title: 'Product & Engineering Intro', description: 'Meet development teams and understand product architecture', category: 'introduction', status: 'completed', dueDate: '2024-04-16', completedAt: '2024-04-16', completedBy: 'u9' },
    { id: 'eot16', taskTemplateId: 'obt1t9', title: 'Sign NDA', description: 'Review and sign Non-Disclosure Agreement', category: 'document', status: 'completed', dueDate: '2024-04-15', completedAt: '2024-04-14', completedBy: 'u9' },
    { id: 'eot17', taskTemplateId: 'obt1t10', title: 'Read Company Handbook', description: 'Review and acknowledge the company handbook', category: 'policy', status: 'completed', dueDate: '2024-04-22', completedAt: '2024-04-20', completedBy: 'u9' },
  ]},
  // Marcus Webb (u10) - DevOps onboarding
  { id: 'eo4', employmentRecordId: 'er11', userId: 'u10', companyId: 'c1', templateId: 'obt1', status: 'completed', startDate: '2024-05-01', completionPercent: 100, createdAt: '2024-04-25', tasks: [
    { id: 'eot18', taskTemplateId: 'obt1t1', title: 'Sign Employment Contract', description: 'Review and sign the employment contract', category: 'document', status: 'completed', dueDate: '2024-04-28', completedAt: '2024-04-27', completedBy: 'u10' },
    { id: 'eot19', taskTemplateId: 'obt1t2', title: 'Complete Personal Details Form', description: 'Fill in emergency contacts, bank details, etc.', category: 'document', status: 'completed', dueDate: '2024-05-01', completedAt: '2024-04-30', completedBy: 'u10' },
    { id: 'eot20', taskTemplateId: 'obt1t4', title: 'Create Email & Slack Accounts', description: 'IT team creates accounts', category: 'access', status: 'completed', ownerId: 'u2', dueDate: '2024-04-30', completedAt: '2024-04-29', completedBy: 'u2' },
    { id: 'eot21', taskTemplateId: 'obt1t3', title: 'Setup Laptop & Dev Environment', description: 'Configure workspace with Terraform, kubectl, Docker, and monitoring tools', category: 'equipment', status: 'completed', ownerId: 'u2', dueDate: '2024-05-01', completedAt: '2024-05-01', completedBy: 'u2' },
    { id: 'eot22', taskTemplateId: 'obt1t5', title: 'Infrastructure Access', description: 'Grant access to AWS console, Kubernetes clusters, and monitoring dashboards', category: 'access', status: 'completed', ownerId: 'u4', dueDate: '2024-05-01', completedAt: '2024-05-01', completedBy: 'u4' },
    { id: 'eot23', taskTemplateId: 'obt1t6', title: 'Security Training', description: 'Complete mandatory security awareness training', category: 'training', status: 'completed', dueDate: '2024-05-06', completedAt: '2024-05-05', completedBy: 'u10' },
    { id: 'eot24', taskTemplateId: 'obt1t7', title: 'Meet Your Manager', description: 'Introductory 1:1 with Development Manager Michael Brown', category: 'introduction', status: 'completed', dueDate: '2024-05-01', completedAt: '2024-05-01', completedBy: 'u10' },
    { id: 'eot25', taskTemplateId: 'obt1t8', title: 'Team Introduction', description: 'Meet the DevOps and Development teams', category: 'introduction', status: 'completed', dueDate: '2024-05-02', completedAt: '2024-05-02', completedBy: 'u10' },
    { id: 'eot26', taskTemplateId: 'obt1t9', title: 'Sign NDA', description: 'Review and sign Non-Disclosure Agreement', category: 'document', status: 'completed', dueDate: '2024-05-01', completedAt: '2024-04-30', completedBy: 'u10' },
    { id: 'eot27', taskTemplateId: 'obt1t10', title: 'Read Company Handbook', description: 'Review and acknowledge the company handbook', category: 'policy', status: 'completed', dueDate: '2024-05-08', completedAt: '2024-05-06', completedBy: 'u10' },
  ]},
];

let offboardingWorkflows: OffboardingWorkflow[] = [
  { id: 'off1', employmentRecordId: 'er4', userId: 'u5', companyId: 'c1', reason: 'resignation', lastWorkingDay: '2026-04-30', status: 'in_progress', completionPercent: 33, createdAt: '2026-03-05', tasks: [
    { id: 'offt1', title: 'Manager Notification', category: 'exit', status: 'completed', ownerId: 'u2', dueDate: '2026-03-07', completedAt: '2026-03-05' },
    { id: 'offt2', title: 'Exit Interview', category: 'exit', status: 'pending', ownerId: 'u2', dueDate: '2026-04-25' },
    { id: 'offt3', title: 'Return Laptop & Equipment', category: 'equipment', status: 'pending', ownerId: 'u5', dueDate: '2026-04-30' },
    { id: 'offt4', title: 'Revoke System Access', category: 'access', status: 'pending', ownerId: 'u2', dueDate: '2026-04-30' },
    { id: 'offt5', title: 'Final Payroll Processing', category: 'payroll', status: 'pending', ownerId: 'u2', dueDate: '2026-05-05' },
    { id: 'offt6', title: 'Knowledge Transfer', category: 'knowledge', status: 'in_progress', ownerId: 'u5', dueDate: '2026-04-25' },
  ]},
];

// ─── Performance Seed Data ─────────────────────────────

let reviewCycles: PerformanceReviewCycle[] = [
  { id: 'rc1', companyId: 'c1', name: 'Q1 2026 Review', type: 'quarterly', startDate: '2026-01-01', endDate: '2026-03-31', status: 'active', reviewCount: 8, completedCount: 5 },
  { id: 'rc2', companyId: 'c1', name: '2025 Annual Review', type: 'annual', startDate: '2025-12-01', endDate: '2026-01-31', status: 'completed', reviewCount: 8, completedCount: 8 },
  { id: 'rc3', companyId: 'c1', name: 'Q4 2025 Review', type: 'quarterly', startDate: '2025-10-01', endDate: '2025-12-31', status: 'completed', reviewCount: 5, completedCount: 5 },
  { id: 'rc4', companyId: 'c1', name: 'David Kim Probation Review', type: 'probation', startDate: '2026-03-01', endDate: '2026-03-31', status: 'draft', reviewCount: 1, completedCount: 0 },
];

let performanceReviews: PerformanceReview[] = [
  // Q1 2026
  { id: 'pr1', cycleId: 'rc1', userId: 'u3', companyId: 'c1', reviewerId: 'u4', status: 'completed', selfRating: 4, managerRating: 4, overallRating: 4, strengths: 'Exceptional project delivery, strong client relationships, and proactive risk management', improvements: 'Could improve on internal process documentation and knowledge transfer', managerComments: 'Emily delivered 2 implementations ahead of schedule and received outstanding client feedback', completedAt: '2026-03-05', createdAt: '2026-01-15' },
  { id: 'pr2', cycleId: 'rc1', userId: 'u4', companyId: 'c1', reviewerId: 'u2', status: 'manager_review', selfRating: 4, strengths: 'Good leadership and mentoring', improvements: 'Delegation skills', createdAt: '2026-01-15' },
  { id: 'pr3', cycleId: 'rc1', userId: 'u5', companyId: 'c1', reviewerId: 'u2', status: 'self_review', createdAt: '2026-01-15' },
  { id: 'pr4', cycleId: 'rc1', userId: 'u8', companyId: 'c1', reviewerId: 'u2', status: 'pending', createdAt: '2026-01-15' },
  { id: 'pr5', cycleId: 'rc1', userId: 'u6', companyId: 'c1', reviewerId: 'u4', status: 'completed', selfRating: 3, managerRating: 3, overallRating: 3, strengths: 'Good work ethic, quick learner', improvements: 'Communication with stakeholders', managerComments: 'Solid performer, room for growth', completedAt: '2026-02-28', createdAt: '2026-01-15' },
  { id: 'pr7', cycleId: 'rc1', userId: 'u7', companyId: 'c1', reviewerId: 'u2', status: 'completed', selfRating: 4, managerRating: 5, overallRating: 5, strengths: 'Exceptional HR processes, great policy work', improvements: 'Continue expanding compliance training', managerComments: 'Outstanding contributor to the HR team', completedAt: '2026-03-01', createdAt: '2026-01-15' },
  { id: 'pr18', cycleId: 'rc1', userId: 'u9', companyId: 'c1', reviewerId: 'u1', status: 'completed', selfRating: 4, managerRating: 4, overallRating: 4, strengths: 'Strong product vision, excellent competitive insights, and clear feature specifications', improvements: 'Could improve stakeholder communication cadence with dev teams', managerComments: 'Natalie has been instrumental in aligning our product roadmap with market demands', completedAt: '2026-03-06', createdAt: '2026-01-15' },
  { id: 'pr19', cycleId: 'rc1', userId: 'u10', companyId: 'c1', reviewerId: 'u4', status: 'completed', selfRating: 4, managerRating: 5, overallRating: 5, strengths: 'Outstanding infrastructure reliability, proactive monitoring, and incident response', improvements: 'Documentation of runbooks could be more detailed', managerComments: 'Marcus has transformed our infrastructure reliability. Near-zero incidents this quarter.', completedAt: '2026-03-04', createdAt: '2026-01-15' },
  // 2025 Annual
  { id: 'pr6', cycleId: 'rc2', userId: 'u3', companyId: 'c1', reviewerId: 'u4', status: 'completed', selfRating: 4, managerRating: 5, overallRating: 5, strengths: 'Led the largest client implementation of the year, exceeding all delivery milestones', improvements: 'Continue developing leadership skills and mentoring junior consultants', managerComments: 'Emily\'s work on the Meridian Corp implementation was exceptional — on time, on budget, 98% satisfaction', completedAt: '2026-01-20', createdAt: '2025-12-01' },
  { id: 'pr8', cycleId: 'rc2', userId: 'u4', companyId: 'c1', reviewerId: 'u2', status: 'completed', selfRating: 4, managerRating: 4, overallRating: 4, strengths: 'Strong leadership driving team performance', improvements: 'Work on strategic planning skills', managerComments: 'Consistently reliable manager who leads by example', completedAt: '2026-01-18', createdAt: '2025-12-01' },
  { id: 'pr9', cycleId: 'rc2', userId: 'u5', companyId: 'c1', reviewerId: 'u2', status: 'completed', selfRating: 3, managerRating: 3, overallRating: 3, strengths: 'Creative marketing ideas and brand awareness growth', improvements: 'Data-driven approach to campaign analysis', managerComments: 'Good year overall, set clearer measurable goals next year', completedAt: '2026-01-22', createdAt: '2025-12-01' },
  { id: 'pr10', cycleId: 'rc2', userId: 'u6', companyId: 'c1', reviewerId: 'u4', status: 'completed', selfRating: 3, managerRating: 2, overallRating: 2, strengths: 'Strong DevOps technical knowledge', improvements: 'Needs to improve communication and proactivity', managerComments: 'Technical skills are solid but soft skills need significant work', completedAt: '2026-01-19', createdAt: '2025-12-01' },
  { id: 'pr11', cycleId: 'rc2', userId: 'u7', companyId: 'c1', reviewerId: 'u2', status: 'completed', selfRating: 5, managerRating: 5, overallRating: 5, strengths: 'Transformed the entire HR process, exceptional policy work', improvements: 'Build a succession plan for key HR processes', managerComments: 'Anna is an indispensable member of the team', completedAt: '2026-01-21', createdAt: '2025-12-01' },
  { id: 'pr12', cycleId: 'rc2', userId: 'u8', companyId: 'c1', reviewerId: 'u2', status: 'completed', selfRating: 3, managerRating: 4, overallRating: 4, strengths: 'Precise financial analysis, great attention to detail', improvements: 'Present findings more confidently in leadership meetings', managerComments: 'Robert has exceeded expectations in his analytical work', completedAt: '2026-01-23', createdAt: '2025-12-01' },
  { id: 'pr20', cycleId: 'rc2', userId: 'u9', companyId: 'c1', reviewerId: 'u1', status: 'completed', selfRating: 4, managerRating: 4, overallRating: 4, strengths: 'Built product strategy from scratch, excellent competitive analysis framework', improvements: 'Improve velocity of spec delivery and stakeholder alignment processes', managerComments: 'Natalie brought structure and vision to our product team in her first year', completedAt: '2026-01-24', createdAt: '2025-12-01' },
  { id: 'pr21', cycleId: 'rc2', userId: 'u10', companyId: 'c1', reviewerId: 'u4', status: 'completed', selfRating: 4, managerRating: 4, overallRating: 4, strengths: 'Built robust infrastructure foundation, excellent incident response skills', improvements: 'Expand automation coverage and self-healing capabilities', managerComments: 'Marcus significantly improved our operational maturity in his first year', completedAt: '2026-01-25', createdAt: '2025-12-01' },
  // Q4 2025
  { id: 'pr13', cycleId: 'rc3', userId: 'u3', companyId: 'c1', reviewerId: 'u4', status: 'completed', selfRating: 4, managerRating: 4, overallRating: 4, strengths: 'Led the Beacon Health implementation successfully with zero scope creep', improvements: 'Expand cross-team collaboration with Product', managerComments: 'Consistent high performer in project delivery', completedAt: '2025-12-20', createdAt: '2025-10-05' },
  { id: 'pr14', cycleId: 'rc3', userId: 'u4', companyId: 'c1', reviewerId: 'u2', status: 'completed', selfRating: 4, managerRating: 4, overallRating: 4, strengths: 'Excellent team management during product launch', improvements: 'Better time estimates for complex projects', managerComments: 'Strong quarter for Michael and his team', completedAt: '2025-12-18', createdAt: '2025-10-05' },
  { id: 'pr15', cycleId: 'rc3', userId: 'u5', companyId: 'c1', reviewerId: 'u2', status: 'completed', selfRating: 3, managerRating: 3, overallRating: 3, strengths: 'Great brand awareness campaigns', improvements: 'ROI tracking needs improvement', managerComments: 'Decent quarter, needs stronger metrics focus', completedAt: '2025-12-22', createdAt: '2025-10-05' },
  { id: 'pr16', cycleId: 'rc3', userId: 'u7', companyId: 'c1', reviewerId: 'u2', status: 'completed', selfRating: 4, managerRating: 5, overallRating: 5, strengths: 'Launched new benefits program ahead of schedule', improvements: 'Document processes more thoroughly', managerComments: 'Exceptional execution on benefits rollout', completedAt: '2025-12-19', createdAt: '2025-10-05' },
  { id: 'pr17', cycleId: 'rc3', userId: 'u8', companyId: 'c1', reviewerId: 'u2', status: 'completed', selfRating: 3, managerRating: 3, overallRating: 3, strengths: 'Reliable reporting and budget tracking', improvements: 'Take more initiative on process improvements', managerComments: 'Solid work, would like to see more proactivity', completedAt: '2025-12-21', createdAt: '2025-10-05' },
];

let performanceGoals: PerformanceGoal[] = [
  // Emily Watson (u3) - Implementation team
  { id: 'pg1', userId: 'u3', companyId: 'c1', title: 'Deliver 3 Client Implementations On Time', description: 'Successfully go-live with 3 client projects within agreed timelines and budget', category: 'objective', status: 'in_progress', progress: 65, weight: 35, dueDate: '2026-06-30', createdAt: '2026-01-10' },
  { id: 'pg2', userId: 'u3', companyId: 'c1', title: 'Reduce Average Implementation Timeline by 20%', description: 'Streamline implementation playbook and tooling to shorten delivery cycles', category: 'key_result', status: 'in_progress', progress: 40, weight: 25, dueDate: '2026-04-30', createdAt: '2026-01-10' },
  { id: 'pg3', userId: 'u3', companyId: 'c1', title: 'Obtain PMP Certification', description: 'Complete Project Management Professional certification to strengthen delivery methodology', category: 'development', status: 'not_started', progress: 0, weight: 10, dueDate: '2026-09-30', createdAt: '2026-02-01' },
  { id: 'pg9', userId: 'u3', companyId: 'c1', title: 'Build Implementation Playbook v2', description: 'Document standardized implementation processes, templates, and checklists for the team', category: 'objective', status: 'in_progress', progress: 55, weight: 15, dueDate: '2026-06-30', createdAt: '2026-01-15' },
  { id: 'pg10', userId: 'u3', companyId: 'c1', title: 'Achieve 95% Client Satisfaction Score', description: 'Maintain NPS of 95%+ across all active implementation projects through proactive communication', category: 'key_result', status: 'in_progress', progress: 80, weight: 15, dueDate: '2026-09-30', createdAt: '2026-01-20' },
  // Michael Brown (u4)
  { id: 'pg4', userId: 'u4', companyId: 'c1', title: 'Improve Team Velocity by 20%', description: 'Streamline processes and remove blockers', category: 'objective', status: 'in_progress', progress: 55, weight: 40, dueDate: '2026-06-30', createdAt: '2026-01-10' },
  { id: 'pg11', userId: 'u4', companyId: 'c1', title: 'Implement Quarterly Planning Framework', description: 'Establish and document a repeatable quarterly planning process for the team', category: 'objective', status: 'in_progress', progress: 70, weight: 30, dueDate: '2026-03-31', createdAt: '2026-01-05' },
  { id: 'pg12', userId: 'u4', companyId: 'c1', title: 'Complete Technical Leadership Certification', description: 'Finish the Technical Leadership certification course', category: 'development', status: 'not_started', progress: 0, weight: 30, dueDate: '2026-08-31', createdAt: '2026-02-10' },
  // Lisa Park (u5)
  { id: 'pg5', userId: 'u5', companyId: 'c1', title: 'Launch Q2 Marketing Campaign', description: 'Design and execute major marketing campaign', category: 'objective', status: 'not_started', progress: 0, weight: 35, dueDate: '2026-06-30', createdAt: '2026-02-15' },
  { id: 'pg13', userId: 'u5', companyId: 'c1', title: 'Build Brand Style Guide', description: 'Create comprehensive brand guidelines for all marketing materials', category: 'key_result', status: 'in_progress', progress: 25, weight: 30, dueDate: '2026-05-31', createdAt: '2026-02-01' },
  { id: 'pg14', userId: 'u5', companyId: 'c1', title: 'Grow Social Media Following 40%', description: 'Increase follower count across all social media platforms by 40%', category: 'key_result', status: 'in_progress', progress: 45, weight: 35, dueDate: '2026-06-30', createdAt: '2026-01-15' },
  // David Kim (u6)
  { id: 'pg6', userId: 'u6', companyId: 'c1', title: 'Implement CI/CD Pipeline', description: 'Build automated deployment pipeline', category: 'objective', status: 'in_progress', progress: 80, weight: 40, dueDate: '2026-04-30', createdAt: '2026-01-05' },
  { id: 'pg15', userId: 'u6', companyId: 'c1', title: 'Achieve AWS Solutions Architect Cert', description: 'Pass the AWS Solutions Architect Professional exam', category: 'development', status: 'in_progress', progress: 60, weight: 25, dueDate: '2026-04-30', createdAt: '2026-01-10' },
  { id: 'pg16', userId: 'u6', companyId: 'c1', title: 'Reduce Deployment Downtime to Zero', description: 'Implement blue-green deployments to achieve zero-downtime releases', category: 'key_result', status: 'in_progress', progress: 40, weight: 35, dueDate: '2026-06-30', createdAt: '2026-01-15' },
  // Anna Johnson (u7)
  { id: 'pg7', userId: 'u7', companyId: 'c1', title: 'Revamp Onboarding Process', description: 'Redesign employee onboarding for faster time-to-productivity', category: 'objective', status: 'in_progress', progress: 45, weight: 35, dueDate: '2026-06-30', createdAt: '2026-01-10' },
  { id: 'pg17', userId: 'u7', companyId: 'c1', title: 'Launch Employee Wellness Program', description: 'Design and roll out a comprehensive employee wellness initiative', category: 'objective', status: 'in_progress', progress: 55, weight: 30, dueDate: '2026-06-30', createdAt: '2026-01-15' },
  { id: 'pg18', userId: 'u7', companyId: 'c1', title: 'Reduce Time-to-Hire by 25%', description: 'Streamline the recruitment process to reduce average hiring time', category: 'key_result', status: 'in_progress', progress: 35, weight: 35, dueDate: '2026-06-30', createdAt: '2026-02-01' },
  // Robert Taylor (u8)
  { id: 'pg8', userId: 'u8', companyId: 'c1', title: 'Automate Monthly Reporting', description: 'Build automated financial reporting dashboards', category: 'objective', status: 'in_progress', progress: 30, weight: 30, dueDate: '2026-05-31', createdAt: '2026-02-01' },
  { id: 'pg19', userId: 'u8', companyId: 'c1', title: 'Implement Budget Variance Alerts', description: 'Build real-time alerts for budget variances exceeding 5%', category: 'key_result', status: 'not_started', progress: 0, weight: 35, dueDate: '2026-07-31', createdAt: '2026-02-15' },
  { id: 'pg20', userId: 'u8', companyId: 'c1', title: 'Complete CPA Continuing Education', description: 'Complete 40 hours of continuing professional education credits', category: 'development', status: 'in_progress', progress: 45, weight: 35, dueDate: '2026-09-30', createdAt: '2026-01-10' },
  // Natalie Cruz (u9) - Product
  { id: 'pg21', userId: 'u9', companyId: 'c1', title: 'Deliver H1 Product Roadmap', description: 'Define, validate, and ship the H1 2026 product roadmap aligned with competitive landscape and customer needs', category: 'objective', status: 'in_progress', progress: 60, weight: 30, dueDate: '2026-06-30', createdAt: '2026-01-05' },
  { id: 'pg22', userId: 'u9', companyId: 'c1', title: 'Complete Quarterly Competitive Analysis', description: 'Produce detailed competitive analysis reports each quarter to inform product strategy and positioning', category: 'key_result', status: 'in_progress', progress: 75, weight: 20, dueDate: '2026-03-31', createdAt: '2026-01-10' },
  { id: 'pg23', userId: 'u9', companyId: 'c1', title: 'Author 8 Feature Specs for Development', description: 'Write detailed PRDs and feature specifications covering UX, acceptance criteria, and edge cases', category: 'objective', status: 'in_progress', progress: 50, weight: 25, dueDate: '2026-06-30', createdAt: '2026-01-15' },
  { id: 'pg24', userId: 'u9', companyId: 'c1', title: 'Increase Feature Adoption Rate to 70%', description: 'Ensure 70% of shipped features hit adoption targets within 30 days of launch', category: 'key_result', status: 'in_progress', progress: 45, weight: 15, dueDate: '2026-09-30', createdAt: '2026-01-20' },
  { id: 'pg25', userId: 'u9', companyId: 'c1', title: 'Obtain Pragmatic Institute PMC Certification', description: 'Complete the Pragmatic Institute Product Management certification', category: 'development', status: 'in_progress', progress: 30, weight: 10, dueDate: '2026-08-31', createdAt: '2026-02-01' },
  // Marcus Webb (u10) - DevOps / Infrastructure
  { id: 'pg26', userId: 'u10', companyId: 'c1', title: 'Achieve 99.9% Infrastructure Uptime', description: 'Maintain production infrastructure at 99.9%+ availability through proactive monitoring and redundancy', category: 'key_result', status: 'in_progress', progress: 85, weight: 30, dueDate: '2026-06-30', createdAt: '2026-01-05' },
  { id: 'pg27', userId: 'u10', companyId: 'c1', title: 'Migrate Core Services to Kubernetes', description: 'Containerize and migrate 5 core services from VMs to Kubernetes for improved scaling and deployment', category: 'objective', status: 'in_progress', progress: 60, weight: 25, dueDate: '2026-06-30', createdAt: '2026-01-10' },
  { id: 'pg28', userId: 'u10', companyId: 'c1', title: 'Implement Centralized Monitoring & Alerting', description: 'Deploy Prometheus/Grafana stack with PagerDuty integration for real-time incident response', category: 'objective', status: 'in_progress', progress: 70, weight: 20, dueDate: '2026-04-30', createdAt: '2026-01-15' },
  { id: 'pg29', userId: 'u10', companyId: 'c1', title: 'Reduce MTTR by 40%', description: 'Implement runbooks, automated rollbacks, and incident response procedures to cut Mean Time to Recovery', category: 'key_result', status: 'in_progress', progress: 50, weight: 15, dueDate: '2026-06-30', createdAt: '2026-01-20' },
  { id: 'pg30', userId: 'u10', companyId: 'c1', title: 'Obtain CKA Certification', description: 'Pass the Certified Kubernetes Administrator exam', category: 'development', status: 'in_progress', progress: 65, weight: 10, dueDate: '2026-05-31', createdAt: '2026-02-01' },
];

// ─── Goal Metrics Seed Data ────────────────────────────

let goalMetrics: GoalMetric[] = [
  // Emily (u3) - Implementation
  { id: 'gm1', goalId: 'pg1', companyId: 'c1', name: 'Projects Delivered', description: 'Number of client implementations successfully gone live', targetValue: 3, currentValue: 2, unit: 'number', weight: 40, createdAt: '2026-01-10' },
  { id: 'gm2', goalId: 'pg1', companyId: 'c1', name: 'On-Time Delivery Rate', description: 'Percentage of projects delivered on or before deadline', targetValue: 100, currentValue: 90, unit: 'percentage', weight: 30, createdAt: '2026-01-10' },
  { id: 'gm3', goalId: 'pg1', companyId: 'c1', name: 'Budget Adherence', description: 'Percentage of projects delivered within budget', targetValue: 100, currentValue: 95, unit: 'percentage', weight: 30, createdAt: '2026-01-10' },
  { id: 'gm4', goalId: 'pg2', companyId: 'c1', name: 'Avg Implementation Days', description: 'Average number of days per implementation project', targetValue: 45, currentValue: 54, unit: 'number', weight: 50, createdAt: '2026-01-10' },
  { id: 'gm5', goalId: 'pg2', companyId: 'c1', name: 'Process Automation Rate', description: 'Percentage of implementation steps automated via tooling', targetValue: 60, currentValue: 35, unit: 'percentage', weight: 50, createdAt: '2026-01-10' },
  { id: 'gm15', goalId: 'pg9', companyId: 'c1', name: 'Playbook Sections Completed', description: 'Number of playbook sections documented and reviewed', targetValue: 12, currentValue: 7, unit: 'number', weight: 50, createdAt: '2026-01-15' },
  { id: 'gm16', goalId: 'pg9', companyId: 'c1', name: 'Template Adoption Rate', description: 'Team members using standardized templates for project delivery', targetValue: 100, currentValue: 65, unit: 'percentage', weight: 50, createdAt: '2026-01-15' },
  // Michael (u4)
  { id: 'gm6', goalId: 'pg4', companyId: 'c1', name: 'Sprint Velocity', description: 'Average story points per sprint', targetValue: 42, currentValue: 35, unit: 'number', weight: 40, createdAt: '2026-01-10' },
  { id: 'gm7', goalId: 'pg4', companyId: 'c1', name: 'Blocker Resolution Time', description: 'Average days to resolve blockers', targetValue: 1, currentValue: 1.8, unit: 'number', weight: 30, createdAt: '2026-01-10' },
  { id: 'gm8', goalId: 'pg4', companyId: 'c1', name: 'Team Satisfaction Score', description: 'Quarterly team satisfaction survey score', targetValue: 4.5, currentValue: 4.1, unit: 'rating', weight: 30, createdAt: '2026-01-10' },
  { id: 'gm17', goalId: 'pg11', companyId: 'c1', name: 'Planning Docs Created', description: 'Number of planning templates and docs finalized', targetValue: 5, currentValue: 4, unit: 'number', weight: 50, createdAt: '2026-01-05' },
  { id: 'gm18', goalId: 'pg11', companyId: 'c1', name: 'Team Adoption Rate', description: 'Team members actively using the planning framework', targetValue: 100, currentValue: 75, unit: 'percentage', weight: 50, createdAt: '2026-01-05' },
  // David (u6)
  { id: 'gm9', goalId: 'pg6', companyId: 'c1', name: 'Pipeline Uptime', description: 'CI/CD pipeline availability percentage', targetValue: 99.5, currentValue: 97.2, unit: 'percentage', weight: 50, createdAt: '2026-01-05' },
  { id: 'gm10', goalId: 'pg6', companyId: 'c1', name: 'Deployment Frequency', description: 'Deployments per week', targetValue: 10, currentValue: 7, unit: 'number', weight: 50, createdAt: '2026-01-05' },
  { id: 'gm21', goalId: 'pg16', companyId: 'c1', name: 'Zero-Downtime Releases', description: 'Percentage of releases with zero downtime', targetValue: 100, currentValue: 60, unit: 'percentage', weight: 60, createdAt: '2026-01-15' },
  { id: 'gm22', goalId: 'pg16', companyId: 'c1', name: 'Rollback Success Rate', description: 'Successful rollback completion rate', targetValue: 100, currentValue: 85, unit: 'percentage', weight: 40, createdAt: '2026-01-15' },
  // Anna (u7)
  { id: 'gm11', goalId: 'pg7', companyId: 'c1', name: 'Onboarding Time-to-Productivity', description: 'Days for new hire to reach full productivity', targetValue: 14, currentValue: 21, unit: 'number', weight: 50, createdAt: '2026-01-10' },
  { id: 'gm12', goalId: 'pg7', companyId: 'c1', name: 'New Hire Satisfaction', description: 'Onboarding satisfaction survey score', targetValue: 4.8, currentValue: 4.2, unit: 'rating', weight: 50, createdAt: '2026-01-10' },
  { id: 'gm23', goalId: 'pg17', companyId: 'c1', name: 'Program Enrollment', description: 'Employee enrollment in wellness program', targetValue: 80, currentValue: 52, unit: 'percentage', weight: 40, createdAt: '2026-01-15' },
  { id: 'gm24', goalId: 'pg17', companyId: 'c1', name: 'Satisfaction Score', description: 'Wellness program participant satisfaction', targetValue: 4.5, currentValue: 4.3, unit: 'rating', weight: 60, createdAt: '2026-01-15' },
  { id: 'gm25', goalId: 'pg18', companyId: 'c1', name: 'Avg Days-to-Hire', description: 'Average number of days from posting to offer acceptance', targetValue: 21, currentValue: 28, unit: 'number', weight: 60, createdAt: '2026-02-01' },
  { id: 'gm26', goalId: 'pg18', companyId: 'c1', name: 'Candidate Experience Score', description: 'Post-interview candidate experience rating', targetValue: 4.5, currentValue: 4.0, unit: 'rating', weight: 40, createdAt: '2026-02-01' },
  // Robert (u8)
  { id: 'gm13', goalId: 'pg8', companyId: 'c1', name: 'Reports Automated', description: 'Number of manual reports automated', targetValue: 12, currentValue: 4, unit: 'number', weight: 60, createdAt: '2026-02-01' },
  { id: 'gm14', goalId: 'pg8', companyId: 'c1', name: 'Time Saved Per Month', description: 'Hours saved per month through automation', targetValue: 40, currentValue: 12, unit: 'number', weight: 40, createdAt: '2026-02-01' },
  // Lisa (u5)
  { id: 'gm19', goalId: 'pg14', companyId: 'c1', name: 'Instagram Followers', description: 'Instagram follower growth', targetValue: 5000, currentValue: 3200, unit: 'number', weight: 50, createdAt: '2026-01-15' },
  { id: 'gm20', goalId: 'pg14', companyId: 'c1', name: 'LinkedIn Engagement Rate', description: 'LinkedIn post engagement rate', targetValue: 5, currentValue: 3.8, unit: 'percentage', weight: 50, createdAt: '2026-01-15' },
  // Natalie Cruz (u9) - Product
  { id: 'gm27', goalId: 'pg21', companyId: 'c1', name: 'Roadmap Items Shipped', description: 'Number of roadmap features shipped to production', targetValue: 12, currentValue: 7, unit: 'number', weight: 50, createdAt: '2026-01-05' },
  { id: 'gm28', goalId: 'pg21', companyId: 'c1', name: 'Stakeholder Alignment Score', description: 'Internal stakeholder satisfaction with roadmap direction', targetValue: 4.5, currentValue: 4.2, unit: 'rating', weight: 50, createdAt: '2026-01-05' },
  { id: 'gm29', goalId: 'pg22', companyId: 'c1', name: 'Competitor Reports Published', description: 'Competitive analysis reports produced', targetValue: 4, currentValue: 3, unit: 'number', weight: 50, createdAt: '2026-01-10' },
  { id: 'gm30', goalId: 'pg22', companyId: 'c1', name: 'Feature Gap Coverage', description: 'Percentage of competitive feature gaps addressed in roadmap', targetValue: 80, currentValue: 65, unit: 'percentage', weight: 50, createdAt: '2026-01-10' },
  { id: 'gm31', goalId: 'pg23', companyId: 'c1', name: 'PRDs Completed', description: 'Number of detailed PRDs authored and approved', targetValue: 8, currentValue: 4, unit: 'number', weight: 60, createdAt: '2026-01-15' },
  { id: 'gm32', goalId: 'pg23', companyId: 'c1', name: 'Dev Team Spec Clarity Score', description: 'Development team rating of spec clarity and completeness', targetValue: 4.5, currentValue: 4.3, unit: 'rating', weight: 40, createdAt: '2026-01-15' },
  { id: 'gm33', goalId: 'pg24', companyId: 'c1', name: 'Feature Adoption %', description: 'Percentage of shipped features meeting 30-day adoption target', targetValue: 70, currentValue: 52, unit: 'percentage', weight: 100, createdAt: '2026-01-20' },
  // Marcus Webb (u10) - DevOps
  { id: 'gm34', goalId: 'pg26', companyId: 'c1', name: 'Uptime Percentage', description: 'Production infrastructure uptime over trailing 30 days', targetValue: 99.9, currentValue: 99.7, unit: 'percentage', weight: 60, createdAt: '2026-01-05' },
  { id: 'gm35', goalId: 'pg26', companyId: 'c1', name: 'Incident Count', description: 'Number of P1/P2 incidents per month', targetValue: 2, currentValue: 3, unit: 'number', weight: 40, createdAt: '2026-01-05' },
  { id: 'gm36', goalId: 'pg27', companyId: 'c1', name: 'Services Migrated', description: 'Number of services migrated to Kubernetes', targetValue: 5, currentValue: 3, unit: 'number', weight: 50, createdAt: '2026-01-10' },
  { id: 'gm37', goalId: 'pg27', companyId: 'c1', name: 'Container Health Score', description: 'Average health check pass rate for containerized services', targetValue: 99, currentValue: 96, unit: 'percentage', weight: 50, createdAt: '2026-01-10' },
  { id: 'gm38', goalId: 'pg28', companyId: 'c1', name: 'Dashboards Created', description: 'Grafana dashboards deployed and active', targetValue: 8, currentValue: 6, unit: 'number', weight: 50, createdAt: '2026-01-15' },
  { id: 'gm39', goalId: 'pg28', companyId: 'c1', name: 'Alert Coverage', description: 'Percentage of critical paths covered by automated alerts', targetValue: 100, currentValue: 78, unit: 'percentage', weight: 50, createdAt: '2026-01-15' },
  { id: 'gm40', goalId: 'pg29', companyId: 'c1', name: 'MTTR Minutes', description: 'Average minutes to recover from incidents', targetValue: 15, currentValue: 25, unit: 'number', weight: 60, createdAt: '2026-01-20' },
  { id: 'gm41', goalId: 'pg29', companyId: 'c1', name: 'Runbooks Documented', description: 'Number of incident runbooks created and tested', targetValue: 10, currentValue: 6, unit: 'number', weight: 40, createdAt: '2026-01-20' },
];

// ─── Review Goal Ratings Seed Data ─────────────────────

let reviewGoalRatings: ReviewGoalRating[] = [
  // Emily (pr1 - Q1 2026)
  { id: 'rgr1', reviewId: 'pr1', goalId: 'pg1', selfRating: 4, managerRating: 4, selfComment: '2 of 3 implementations delivered on time, third on track', managerComment: 'Strong project delivery and client management skills' },
  { id: 'rgr2', reviewId: 'pr1', goalId: 'pg2', selfRating: 3, managerRating: 4, selfComment: 'Tooling improvements are showing results but timeline still needs work', managerComment: 'Good progress on process optimization' },
  { id: 'rgr3', reviewId: 'pr1', goalId: 'pg3', selfRating: 2, managerRating: 3, selfComment: 'Haven\'t started PMP yet due to active projects', managerComment: 'Understandable, can prioritize next quarter' },
  { id: 'rgr9', reviewId: 'pr1', goalId: 'pg9', selfRating: 4, managerRating: 4, selfComment: 'Playbook is taking shape, team is adopting templates', managerComment: 'Great documentation work, very useful for new hires' },
  { id: 'rgr10', reviewId: 'pr1', goalId: 'pg10', selfRating: 4, managerRating: 4, selfComment: 'Client satisfaction consistently above 90%', managerComment: 'Clients specifically praise Emily\'s communication' },
  // Michael (pr2)
  { id: 'rgr4', reviewId: 'pr2', goalId: 'pg4', selfRating: 4, selfComment: 'Team velocity improving steadily' },
  { id: 'rgr11', reviewId: 'pr2', goalId: 'pg11', selfRating: 4, selfComment: 'Framework is nearly complete and well adopted' },
  // David (pr5)
  { id: 'rgr5', reviewId: 'pr5', goalId: 'pg6', selfRating: 4, managerRating: 3, selfComment: 'Pipeline is stable and running well', managerComment: 'Good work but could improve documentation' },
  { id: 'rgr12', reviewId: 'pr5', goalId: 'pg15', selfRating: 4, managerRating: 3, selfComment: 'Studying consistently, practice exams going well', managerComment: 'Good commitment to professional development' },
  { id: 'rgr13', reviewId: 'pr5', goalId: 'pg16', selfRating: 3, managerRating: 3, selfComment: 'Blue-green deployment pattern is partially implemented', managerComment: 'Needs more testing before full rollout' },
  // Anna (pr7)
  { id: 'rgr6', reviewId: 'pr7', goalId: 'pg7', selfRating: 4, managerRating: 5, selfComment: 'New onboarding process is well received', managerComment: 'Exceptional work restructuring the entire process' },
  { id: 'rgr7', reviewId: 'pr7', goalId: 'pg17', selfRating: 4, managerRating: 5, selfComment: 'Wellness program enrollment exceeding expectations', managerComment: 'Great initiative and execution' },
  { id: 'rgr8', reviewId: 'pr7', goalId: 'pg18', selfRating: 3, managerRating: 4, selfComment: 'Making progress but still working on process optimization', managerComment: 'Good direction, keep pushing on efficiency' },
  // Natalie (pr18 - Q1 2026)
  { id: 'rgr14', reviewId: 'pr18', goalId: 'pg21', selfRating: 4, managerRating: 4, selfComment: 'Roadmap is on track, 7 of 12 features shipped', managerComment: 'Strong strategic alignment with company direction' },
  { id: 'rgr15', reviewId: 'pr18', goalId: 'pg22', selfRating: 5, managerRating: 4, selfComment: 'Q1 analysis was thorough and actionable', managerComment: 'Good insights, helped us reprioritize 2 features' },
  { id: 'rgr16', reviewId: 'pr18', goalId: 'pg23', selfRating: 4, managerRating: 4, selfComment: '4 PRDs done, dev teams are happy with the spec quality', managerComment: 'Spec quality is notably higher than before Natalie joined' },
  // Marcus (pr19 - Q1 2026)
  { id: 'rgr17', reviewId: 'pr19', goalId: 'pg26', selfRating: 4, managerRating: 5, selfComment: 'Uptime at 99.7%, close to target', managerComment: 'Excellent reliability engineering, near-perfect availability' },
  { id: 'rgr18', reviewId: 'pr19', goalId: 'pg27', selfRating: 4, managerRating: 4, selfComment: '3 of 5 services migrated, remaining 2 in progress', managerComment: 'Smooth migration with zero customer impact' },
  { id: 'rgr19', reviewId: 'pr19', goalId: 'pg28', selfRating: 4, managerRating: 4, selfComment: 'Monitoring stack is operational, still expanding coverage', managerComment: 'Great foundation, alerting has already caught 2 issues early' },
];

// ─── Review Metric Ratings Seed Data ───────────────────

let reviewMetricRatings: ReviewMetricRating[] = [
  // Emily (pr1)
  { id: 'rmr1', reviewId: 'pr1', metricId: 'gm1', goalId: 'pg1', selfRating: 4, managerRating: 4 },
  { id: 'rmr2', reviewId: 'pr1', metricId: 'gm2', goalId: 'pg1', selfRating: 4, managerRating: 4 },
  { id: 'rmr3', reviewId: 'pr1', metricId: 'gm3', goalId: 'pg1', selfRating: 4, managerRating: 5 },
  { id: 'rmr4', reviewId: 'pr1', metricId: 'gm4', goalId: 'pg2', selfRating: 3, managerRating: 3 },
  { id: 'rmr5', reviewId: 'pr1', metricId: 'gm5', goalId: 'pg2', selfRating: 3, managerRating: 4 },
  { id: 'rmr14', reviewId: 'pr1', metricId: 'gm15', goalId: 'pg9', selfRating: 4, managerRating: 4 },
  { id: 'rmr15', reviewId: 'pr1', metricId: 'gm16', goalId: 'pg9', selfRating: 3, managerRating: 4 },
  // David (pr5)
  { id: 'rmr6', reviewId: 'pr5', metricId: 'gm9', goalId: 'pg6', selfRating: 4, managerRating: 3 },
  { id: 'rmr7', reviewId: 'pr5', metricId: 'gm10', goalId: 'pg6', selfRating: 3, managerRating: 3 },
  { id: 'rmr16', reviewId: 'pr5', metricId: 'gm21', goalId: 'pg16', selfRating: 3, managerRating: 3 },
  { id: 'rmr17', reviewId: 'pr5', metricId: 'gm22', goalId: 'pg16', selfRating: 4, managerRating: 3 },
  // Anna (pr7)
  { id: 'rmr8', reviewId: 'pr7', metricId: 'gm11', goalId: 'pg7', selfRating: 4, managerRating: 5 },
  { id: 'rmr9', reviewId: 'pr7', metricId: 'gm12', goalId: 'pg7', selfRating: 4, managerRating: 5 },
  { id: 'rmr10', reviewId: 'pr7', metricId: 'gm23', goalId: 'pg17', selfRating: 4, managerRating: 5 },
  { id: 'rmr11', reviewId: 'pr7', metricId: 'gm24', goalId: 'pg17', selfRating: 4, managerRating: 5 },
  { id: 'rmr12', reviewId: 'pr7', metricId: 'gm25', goalId: 'pg18', selfRating: 3, managerRating: 4 },
  { id: 'rmr13', reviewId: 'pr7', metricId: 'gm26', goalId: 'pg18', selfRating: 3, managerRating: 4 },
  // Natalie (pr18)
  { id: 'rmr18', reviewId: 'pr18', metricId: 'gm27', goalId: 'pg21', selfRating: 4, managerRating: 4 },
  { id: 'rmr19', reviewId: 'pr18', metricId: 'gm28', goalId: 'pg21', selfRating: 4, managerRating: 4 },
  { id: 'rmr20', reviewId: 'pr18', metricId: 'gm29', goalId: 'pg22', selfRating: 5, managerRating: 4 },
  { id: 'rmr21', reviewId: 'pr18', metricId: 'gm31', goalId: 'pg23', selfRating: 4, managerRating: 4 },
  { id: 'rmr22', reviewId: 'pr18', metricId: 'gm32', goalId: 'pg23', selfRating: 4, managerRating: 5 },
  // Marcus (pr19)
  { id: 'rmr23', reviewId: 'pr19', metricId: 'gm34', goalId: 'pg26', selfRating: 4, managerRating: 5 },
  { id: 'rmr24', reviewId: 'pr19', metricId: 'gm35', goalId: 'pg26', selfRating: 3, managerRating: 4 },
  { id: 'rmr25', reviewId: 'pr19', metricId: 'gm36', goalId: 'pg27', selfRating: 4, managerRating: 4 },
  { id: 'rmr26', reviewId: 'pr19', metricId: 'gm38', goalId: 'pg28', selfRating: 4, managerRating: 4 },
  { id: 'rmr27', reviewId: 'pr19', metricId: 'gm39', goalId: 'pg28', selfRating: 3, managerRating: 4 },
];

// ─── Incentive Models Seed Data ────────────────────────

let incentiveModels: IncentiveModel[] = [
  {
    id: 'im1', companyId: 'c1', name: 'Delivery Excellence', description: 'Performance-based incentive for implementation, DevOps, and development team members',
    status: 'active', createdAt: '2026-01-01', updatedAt: '2026-01-15',
    metrics: [
      { id: 'imm1', name: 'Code Quality Score', description: 'Measured by automated code review scores', weight: 25, targetValue: 90, unit: 'percentage' },
      { id: 'imm2', name: 'Sprint Delivery Rate', description: 'Percentage of committed stories delivered', weight: 30, targetValue: 95, unit: 'percentage' },
      { id: 'imm3', name: 'Bug Resolution Time', description: 'Average hours to resolve critical bugs', weight: 20, targetValue: 4, unit: 'number' },
      { id: 'imm4', name: 'Knowledge Sharing', description: 'Tech talks, documentation contributions', weight: 25, targetValue: 5, unit: 'number' },
    ],
    goals: [
      { id: 'img1', name: 'Feature Delivery', description: 'Deliver assigned features on time with quality', weight: 40 },
      { id: 'img2', name: 'Technical Innovation', description: 'Introduce process improvements or new technologies', weight: 30 },
      { id: 'img3', name: 'Mentorship', description: 'Mentor junior team members effectively', weight: 30 },
    ],
    outcomes: [
      { id: 'imo1', name: 'Exceptional', minRating: 4.5, maxRating: 5, incentivePercent: 20, description: '20% bonus on base salary' },
      { id: 'imo2', name: 'Exceeds Expectations', minRating: 3.5, maxRating: 4.49, incentivePercent: 15, description: '15% bonus on base salary' },
      { id: 'imo3', name: 'Meets Expectations', minRating: 2.5, maxRating: 3.49, incentivePercent: 10, description: '10% bonus on base salary' },
      { id: 'imo4', name: 'Needs Improvement', minRating: 1, maxRating: 2.49, incentivePercent: 0, description: 'No bonus; performance improvement plan' },
    ],
  },
  {
    id: 'im2', companyId: 'c1', name: 'Leadership Impact', description: 'Incentive model for team leads and managers focusing on team outcomes',
    status: 'active', createdAt: '2026-01-01', updatedAt: '2026-01-10',
    metrics: [
      { id: 'imm5', name: 'Team Retention Rate', description: 'Percentage of team members retained', weight: 30, targetValue: 95, unit: 'percentage' },
      { id: 'imm6', name: 'Team Satisfaction', description: 'Quarterly team satisfaction score', weight: 25, targetValue: 4.5, unit: 'rating' },
      { id: 'imm7', name: 'Project Delivery Rate', description: 'On-time delivery of team projects', weight: 25, targetValue: 90, unit: 'percentage' },
      { id: 'imm8', name: 'Budget Adherence', description: 'Staying within allocated budget', weight: 20, targetValue: 100, unit: 'percentage' },
    ],
    goals: [
      { id: 'img4', name: 'Team Development', description: 'Grow team skills and capabilities', weight: 35 },
      { id: 'img5', name: 'Strategic Execution', description: 'Deliver on strategic priorities', weight: 40 },
      { id: 'img6', name: 'Cross-functional Collaboration', description: 'Drive collaboration across departments', weight: 25 },
    ],
    outcomes: [
      { id: 'imo5', name: 'Outstanding', minRating: 4.5, maxRating: 5, incentivePercent: 25, description: '25% bonus + equity consideration' },
      { id: 'imo6', name: 'Strong', minRating: 3.5, maxRating: 4.49, incentivePercent: 18, description: '18% bonus on base salary' },
      { id: 'imo7', name: 'Satisfactory', minRating: 2.5, maxRating: 3.49, incentivePercent: 10, description: '10% bonus on base salary' },
      { id: 'imo8', name: 'Below Expectations', minRating: 1, maxRating: 2.49, incentivePercent: 0, description: 'No bonus; coaching plan required' },
    ],
  },
  {
    id: 'im3', companyId: 'c1', name: 'Operations Excellence', description: 'Incentive model for HR and operations staff',
    status: 'draft', createdAt: '2026-02-15', updatedAt: '2026-02-15',
    metrics: [
      { id: 'imm9', name: 'Process Efficiency', description: 'Time savings from process improvements', weight: 35, targetValue: 20, unit: 'percentage' },
      { id: 'imm10', name: 'Compliance Score', description: 'Policy compliance audit score', weight: 35, targetValue: 100, unit: 'percentage' },
      { id: 'imm11', name: 'Stakeholder Satisfaction', description: 'Internal stakeholder satisfaction score', weight: 30, targetValue: 4.5, unit: 'rating' },
    ],
    goals: [
      { id: 'img7', name: 'Process Optimization', description: 'Streamline and automate operational processes', weight: 50 },
      { id: 'img8', name: 'Compliance Management', description: 'Maintain and improve compliance standards', weight: 50 },
    ],
    outcomes: [
      { id: 'imo9', name: 'Exceptional', minRating: 4.5, maxRating: 5, incentivePercent: 18, description: '18% bonus on base salary' },
      { id: 'imo10', name: 'Strong', minRating: 3, maxRating: 4.49, incentivePercent: 12, description: '12% bonus on base salary' },
      { id: 'imo11', name: 'Below Target', minRating: 1, maxRating: 2.99, incentivePercent: 0, description: 'No bonus' },
    ],
  },
];

let incentiveAssignments: IncentiveAssignment[] = [
  { id: 'ia1', modelId: 'im1', userId: 'u3', companyId: 'c1', assignedAt: '2026-01-15', status: 'active', currentRating: 3.8, incentiveEarned: 15, period: 'Q1 2026' },
  { id: 'ia2', modelId: 'im1', userId: 'u6', companyId: 'c1', assignedAt: '2026-01-15', status: 'active', currentRating: 3.2, incentiveEarned: 10, period: 'Q1 2026' },
  { id: 'ia3', modelId: 'im2', userId: 'u4', companyId: 'c1', assignedAt: '2026-01-15', status: 'active', currentRating: 4.1, incentiveEarned: 18, period: 'Q1 2026' },
  { id: 'ia4', modelId: 'im1', userId: 'u3', companyId: 'c1', assignedAt: '2025-10-01', status: 'completed', currentRating: 4.6, incentiveEarned: 20, period: 'Q4 2025' },
  { id: 'ia5', modelId: 'im2', userId: 'u4', companyId: 'c1', assignedAt: '2025-10-01', status: 'completed', currentRating: 4.3, incentiveEarned: 18, period: 'Q4 2025' },
  { id: 'ia6', modelId: 'im1', userId: 'u6', companyId: 'c1', assignedAt: '2025-10-01', status: 'completed', currentRating: 2.9, incentiveEarned: 10, period: 'Q4 2025' },
  { id: 'ia7', modelId: 'im3', userId: 'u7', companyId: 'c1', assignedAt: '2026-01-15', status: 'active', currentRating: 4.6, incentiveEarned: 18, period: 'Q1 2026' },
  { id: 'ia8', modelId: 'im1', userId: 'u8', companyId: 'c1', assignedAt: '2026-01-15', status: 'active', currentRating: 3.5, incentiveEarned: 15, period: 'Q1 2026' },
  { id: 'ia9', modelId: 'im2', userId: 'u9', companyId: 'c1', assignedAt: '2026-01-15', status: 'active', currentRating: 4.0, incentiveEarned: 18, period: 'Q1 2026' },
  { id: 'ia10', modelId: 'im1', userId: 'u10', companyId: 'c1', assignedAt: '2026-01-15', status: 'active', currentRating: 4.5, incentiveEarned: 20, period: 'Q1 2026' },
  { id: 'ia11', modelId: 'im2', userId: 'u9', companyId: 'c1', assignedAt: '2025-10-01', status: 'completed', currentRating: 3.8, incentiveEarned: 18, period: 'Q4 2025' },
  { id: 'ia12', modelId: 'im1', userId: 'u10', companyId: 'c1', assignedAt: '2025-10-01', status: 'completed', currentRating: 4.2, incentiveEarned: 15, period: 'Q4 2025' },
];

let feedbackNotes: FeedbackNote[] = [
  { id: 'fn1', fromUserId: 'u4', toUserId: 'u3', companyId: 'c1', type: 'praise', content: 'Excellent job on the Beacon Health go-live last week. The client was thrilled with the smooth cutover — zero issues on day one!', isPrivate: false, createdAt: '2026-03-05' },
  { id: 'fn2', fromUserId: 'u2', toUserId: 'u4', companyId: 'c1', type: 'coaching', content: 'Consider involving the team earlier in architectural decisions. It helps with buy-in.', isPrivate: true, createdAt: '2026-02-20' },
  { id: 'fn3', fromUserId: 'u2', toUserId: 'u3', companyId: 'c1', type: 'praise', content: 'Great work on the implementation playbook. The standardized checklists are already saving time on new projects.', isPrivate: false, createdAt: '2026-02-15' },
  { id: 'fn4', fromUserId: 'u4', toUserId: 'u6', companyId: 'c1', type: 'coaching', content: 'Your technical skills are strong. Try to communicate more proactively with stakeholders about progress.', isPrivate: true, createdAt: '2026-02-28' },
  { id: 'fn5', fromUserId: 'u4', toUserId: 'u3', companyId: 'c1', type: 'note', content: 'Emily proactively identified a data migration risk on the TechVault project and resolved it before it became an issue. Great foresight.', isPrivate: false, createdAt: '2026-01-30' },
  { id: 'fn6', fromUserId: 'u2', toUserId: 'u7', companyId: 'c1', type: 'praise', content: 'Anna\'s work on the new policy framework has been exceptional. She handled everything with great attention to detail.', isPrivate: false, createdAt: '2026-03-02' },
  { id: 'fn7', fromUserId: 'u3', toUserId: 'u4', companyId: 'c1', type: 'praise', content: 'Michael ran the sprint planning session really well. Clear priorities and great facilitation.', isPrivate: false, createdAt: '2026-03-06' },
  { id: 'fn8', fromUserId: 'u7', toUserId: 'u3', companyId: 'c1', type: 'praise', content: 'Emily helped onboard a new implementation team member with a full walkthrough of our project delivery process. Great team spirit!', isPrivate: false, createdAt: '2026-02-28' },
  { id: 'fn9', fromUserId: 'u2', toUserId: 'u8', companyId: 'c1', type: 'coaching', content: 'Robert, try to present your budget analysis results in the weekly standup more proactively. The leadership team values your insights.', isPrivate: true, createdAt: '2026-03-03' },
  { id: 'fn10', fromUserId: 'u4', toUserId: 'u5', companyId: 'c1', type: 'coaching', content: 'Lisa, let\'s work on setting more measurable KPIs for the next marketing campaign. I can help you with a data framework.', isPrivate: false, createdAt: '2026-02-18' },
  { id: 'fn11', fromUserId: 'u3', toUserId: 'u6', companyId: 'c1', type: 'praise', content: 'David fixed the CI pipeline issue at 11pm on a Friday. True dedication to keeping the team unblocked.', isPrivate: false, createdAt: '2026-03-08' },
  { id: 'fn12', fromUserId: 'u9', toUserId: 'u3', companyId: 'c1', type: 'praise', content: 'Emily\'s implementation feedback on the new reporting feature spec was invaluable. She caught edge cases our team missed entirely.', isPrivate: false, createdAt: '2026-01-25' },
  { id: 'fn13', fromUserId: 'u5', toUserId: 'u7', companyId: 'c1', type: 'praise', content: 'Anna, thank you for quickly processing my benefits enrollment change. You made it so easy!', isPrivate: false, createdAt: '2026-02-12' },
  { id: 'fn14', fromUserId: 'u2', toUserId: 'u5', companyId: 'c1', type: 'warning', content: 'Lisa, the Q1 campaign reports were submitted late two weeks in a row. Please prioritize timely delivery going forward.', isPrivate: true, createdAt: '2026-03-09' },
  { id: 'fn15', fromUserId: 'u8', toUserId: 'u2', companyId: 'c1', type: 'praise', content: 'James, your open-door policy really helps the finance team feel heard. Thank you for your leadership style.', isPrivate: false, createdAt: '2026-02-08' },
  // Natalie Cruz (u9) feedback
  { id: 'fn16', fromUserId: 'u1', toUserId: 'u9', companyId: 'c1', type: 'praise', content: 'Natalie\'s competitive analysis presentation to the board was outstanding. Clear, actionable, and exactly what we needed to adjust our Q2 priorities.', isPrivate: false, createdAt: '2026-03-01' },
  { id: 'fn17', fromUserId: 'u4', toUserId: 'u9', companyId: 'c1', type: 'praise', content: 'The feature specs Natalie writes are the best we\'ve ever had. Detailed acceptance criteria, clear edge cases, and realistic scope. Dev team loves them.', isPrivate: false, createdAt: '2026-02-22' },
  { id: 'fn18', fromUserId: 'u3', toUserId: 'u9', companyId: 'c1', type: 'coaching', content: 'Natalie, it would be helpful to include implementation complexity estimates in your PRDs. It helps us plan client timelines better.', isPrivate: false, createdAt: '2026-02-10' },
  { id: 'fn19', fromUserId: 'u9', toUserId: 'u4', companyId: 'c1', type: 'praise', content: 'Michael\'s dev team consistently delivers on the specs I provide. Great collaboration and communication throughout the build process.', isPrivate: false, createdAt: '2026-03-07' },
  // Marcus Webb (u10) feedback
  { id: 'fn20', fromUserId: 'u4', toUserId: 'u10', companyId: 'c1', type: 'praise', content: 'Marcus\'s Kubernetes migration has been flawless. Zero downtime during the transition and the team barely noticed. That\'s the sign of great ops work.', isPrivate: false, createdAt: '2026-03-04' },
  { id: 'fn21', fromUserId: 'u6', toUserId: 'u10', companyId: 'c1', type: 'praise', content: 'Marcus, the new Grafana dashboards you set up are incredible. I can now see deployment health at a glance. Game changer for the DevOps team.', isPrivate: false, createdAt: '2026-02-25' },
  { id: 'fn22', fromUserId: 'u10', toUserId: 'u6', companyId: 'c1', type: 'coaching', content: 'David, when deploying config changes, always run the pre-flight checks I set up. We caught a misconfiguration last week that could have caused an outage.', isPrivate: false, createdAt: '2026-03-02' },
  { id: 'fn23', fromUserId: 'u2', toUserId: 'u10', companyId: 'c1', type: 'praise', content: 'Marcus handled the production incident last Tuesday with incredible calm and precision. Resolved in 12 minutes with full transparency to stakeholders.', isPrivate: false, createdAt: '2026-03-06' },
  { id: 'fn24', fromUserId: 'u10', toUserId: 'u3', companyId: 'c1', type: 'praise', content: 'Emily\'s requirements for the client data migration were crystal clear. Made it very easy to set up the infrastructure and pipelines correctly the first time.', isPrivate: false, createdAt: '2026-02-14' },
];

// ─── Peer Reviews Seed Data ────────────────────────────

let peerReviews: PeerReview[] = [
  { id: 'pvr1', reviewId: 'pr1', peerUserId: 'u4', companyId: 'c1', status: 'completed', overallRating: 4, strengths: 'Emily delivers projects with precision and always keeps stakeholders informed', improvements: 'Could delegate more implementation tasks to build team capacity', requestedAt: '2026-01-20', completedAt: '2026-02-15' },
  { id: 'pvr2', reviewId: 'pr1', peerUserId: 'u9', companyId: 'c1', status: 'completed', overallRating: 5, strengths: 'Emily\'s implementation feedback on product specs is invaluable — catches issues before they reach clients', improvements: 'None notable — consistently strong performer', requestedAt: '2026-01-20', completedAt: '2026-02-18' },
  { id: 'pvr3', reviewId: 'pr2', peerUserId: 'u3', companyId: 'c1', status: 'completed', overallRating: 4, strengths: 'Michael is a fair and approachable leader', improvements: 'Could be more decisive on architectural decisions', requestedAt: '2026-01-20', completedAt: '2026-02-20' },
  { id: 'pvr4', reviewId: 'pr5', peerUserId: 'u10', companyId: 'c1', status: 'completed', overallRating: 3, strengths: 'David is technically capable and reliable', improvements: 'Needs to communicate progress more proactively and follow pre-flight procedures', requestedAt: '2026-01-20', completedAt: '2026-02-22' },
  { id: 'pvr5', reviewId: 'pr3', peerUserId: 'u7', companyId: 'c1', status: 'requested', requestedAt: '2026-02-01' },
  { id: 'pvr6', reviewId: 'pr7', peerUserId: 'u5', companyId: 'c1', status: 'completed', overallRating: 5, strengths: 'Anna is incredibly organized and detail-oriented', improvements: 'Could involve more stakeholders in policy development', requestedAt: '2026-01-20', completedAt: '2026-02-25' },
  { id: 'pvr7', reviewId: 'pr7', peerUserId: 'u3', companyId: 'c1', status: 'completed', overallRating: 4, strengths: 'Anna handles HR queries with professionalism and speed', improvements: 'Could share more updates on policy changes proactively', requestedAt: '2026-01-20', completedAt: '2026-02-28' },
  { id: 'pvr8', reviewId: 'pr2', peerUserId: 'u5', companyId: 'c1', status: 'completed', overallRating: 4, strengths: 'Michael is supportive and encourages new ideas', improvements: 'Sometimes slow to make decisions on cross-team requests', requestedAt: '2026-01-25', completedAt: '2026-02-26' },
  { id: 'pvr9', reviewId: 'pr5', peerUserId: 'u4', companyId: 'c1', status: 'completed', overallRating: 3, strengths: 'David is dependable and works hard', improvements: 'Should communicate blockers earlier instead of going silent', requestedAt: '2026-01-25', completedAt: '2026-02-24' },
  { id: 'pvr10', reviewId: 'pr1', peerUserId: 'u7', companyId: 'c1', status: 'completed', overallRating: 5, strengths: 'Emily is always willing to help across departments and brings real-world implementation perspective', improvements: 'No significant areas for improvement', requestedAt: '2026-01-22', completedAt: '2026-02-20' },
  { id: 'pvr11', reviewId: 'pr4', peerUserId: 'u3', companyId: 'c1', status: 'requested', requestedAt: '2026-03-01' },
  { id: 'pvr12', reviewId: 'pr4', peerUserId: 'u7', companyId: 'c1', status: 'requested', requestedAt: '2026-03-01' },
  // Natalie (pr18) peer reviews
  { id: 'pvr13', reviewId: 'pr18', peerUserId: 'u4', companyId: 'c1', status: 'completed', overallRating: 4, strengths: 'Natalie\'s specs are thorough and dev-friendly, best we\'ve worked with', improvements: 'Could attend more dev standups to stay closer to implementation details', requestedAt: '2026-01-20', completedAt: '2026-02-20' },
  { id: 'pvr14', reviewId: 'pr18', peerUserId: 'u3', companyId: 'c1', status: 'completed', overallRating: 4, strengths: 'Natalie has a strong understanding of the market and translates it into clear product direction', improvements: 'Include implementation team earlier in the spec review process', requestedAt: '2026-01-20', completedAt: '2026-02-22' },
  { id: 'pvr15', reviewId: 'pr18', peerUserId: 'u10', companyId: 'c1', status: 'completed', overallRating: 5, strengths: 'Product requirements are clear on infrastructure and scaling needs — makes my planning much easier', improvements: 'No concerns — great cross-functional partner', requestedAt: '2026-01-25', completedAt: '2026-02-24' },
  // Marcus (pr19) peer reviews
  { id: 'pvr16', reviewId: 'pr19', peerUserId: 'u6', companyId: 'c1', status: 'completed', overallRating: 5, strengths: 'Marcus is an incredible mentor. I\'ve learned more about infrastructure in 3 months than my entire career before', improvements: 'Could document his tribal knowledge into runbooks faster', requestedAt: '2026-01-20', completedAt: '2026-02-18' },
  { id: 'pvr17', reviewId: 'pr19', peerUserId: 'u4', companyId: 'c1', status: 'completed', overallRating: 5, strengths: 'Marcus transformed our infrastructure reliability. Incident response is now world-class', improvements: 'None — he sets the standard for our DevOps culture', requestedAt: '2026-01-20', completedAt: '2026-02-20' },
  { id: 'pvr18', reviewId: 'pr19', peerUserId: 'u3', companyId: 'c1', status: 'completed', overallRating: 4, strengths: 'Marcus makes infrastructure setup for client implementations seamless. Great partner to work with', improvements: 'Could proactively communicate planned maintenance windows earlier', requestedAt: '2026-01-22', completedAt: '2026-02-25' },
  // Emily peer review from Marcus
  { id: 'pvr19', reviewId: 'pr1', peerUserId: 'u10', companyId: 'c1', status: 'completed', overallRating: 4, strengths: 'Emily provides excellent requirements for infrastructure setup during client implementations', improvements: 'Could participate more in infrastructure capacity planning discussions', requestedAt: '2026-01-22', completedAt: '2026-02-22' },
];

// ─── Policy Seed Data ──────────────────────────────────

let policyDocuments: PolicyDocument[] = [
  { id: 'pd1', companyId: 'c1', title: 'Employee Handbook 2026', description: 'Comprehensive guide to company policies, benefits, and procedures', category: 'handbook', version: 3, status: 'published', content: 'This handbook outlines our company values, policies, benefits, and expectations for all employees.', requiresAcknowledgment: true, acknowledgmentDeadlineDays: 14, publishedAt: '2026-01-15', createdAt: '2024-01-01', updatedBy: 'u2' },
  { id: 'pd2', companyId: 'c1', title: 'Information Security Policy', description: 'Guidelines for handling sensitive data and system access', category: 'security', version: 2, status: 'published', content: 'All employees must follow these security guidelines to protect company and client data.', requiresAcknowledgment: true, acknowledgmentDeadlineDays: 7, publishedAt: '2026-02-01', createdAt: '2024-06-01', updatedBy: 'u1' },
  { id: 'pd3', companyId: 'c1', title: 'Leave Policy', description: 'Detailed leave entitlements and request procedures', category: 'leave', version: 2, status: 'published', content: 'This policy covers annual leave, sick leave, family responsibility leave, and all other leave types.', requiresAcknowledgment: true, acknowledgmentDeadlineDays: 14, publishedAt: '2026-01-10', createdAt: '2024-01-15', updatedBy: 'u2' },
  { id: 'pd4', companyId: 'c1', title: 'Code of Conduct', description: 'Expected professional behavior and ethics guidelines', category: 'conduct', version: 1, status: 'published', content: 'Our code of conduct establishes the standards of behavior expected from all employees.', requiresAcknowledgment: true, acknowledgmentDeadlineDays: 14, publishedAt: '2024-01-20', createdAt: '2024-01-20', updatedBy: 'u1' },
  { id: 'pd5', companyId: 'c1', title: 'Anti-Harassment Policy', description: 'Zero-tolerance policy on workplace harassment', category: 'harassment', version: 1, status: 'published', content: 'We maintain a zero-tolerance policy for harassment of any kind.', requiresAcknowledgment: true, acknowledgmentDeadlineDays: 7, publishedAt: '2024-02-01', createdAt: '2024-02-01', updatedBy: 'u1' },
  { id: 'pd6', companyId: 'c1', title: 'Remote Work Policy', description: 'Guidelines for hybrid and remote work arrangements', category: 'remote_work', version: 2, status: 'published', content: 'This policy defines the expectations for employees working remotely or in a hybrid arrangement.', requiresAcknowledgment: true, acknowledgmentDeadlineDays: 14, publishedAt: '2026-01-20', createdAt: '2024-03-01', updatedBy: 'u2' },
  { id: 'pd8', companyId: 'c1', title: 'Data Retention Policy (Draft)', description: 'How long we retain different types of data', category: 'security', version: 1, status: 'draft', content: 'Draft policy covering data retention periods.', requiresAcknowledgment: false, acknowledgmentDeadlineDays: 14, createdAt: '2026-03-01', updatedBy: 'u1' },
];

let policyAcknowledgments: PolicyAcknowledgment[] = [
  { id: 'pa1', policyId: 'pd1', userId: 'u3', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-01-20', dueDate: '2026-01-29', remindersSent: 0 },
  { id: 'pa2', policyId: 'pd1', userId: 'u4', companyId: 'c1', status: 'pending', dueDate: '2026-01-29', remindersSent: 1 },
  { id: 'pa3', policyId: 'pd1', userId: 'u5', companyId: 'c1', status: 'overdue', dueDate: '2026-01-29', remindersSent: 3 },
  { id: 'pa4', policyId: 'pd1', userId: 'u8', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-01-25', dueDate: '2026-01-29', remindersSent: 0 },
  { id: 'pa5', policyId: 'pd2', userId: 'u3', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-02-05', dueDate: '2026-02-08', remindersSent: 0 },
  { id: 'pa6', policyId: 'pd2', userId: 'u4', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-02-06', dueDate: '2026-02-08', remindersSent: 0 },
  { id: 'pa7', policyId: 'pd2', userId: 'u5', companyId: 'c1', status: 'pending', dueDate: '2026-02-08', remindersSent: 2 },
  { id: 'pa8', policyId: 'pd3', userId: 'u3', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-01-15', dueDate: '2026-01-24', remindersSent: 0 },
  { id: 'pa9', policyId: 'pd4', userId: 'u3', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2024-01-25', dueDate: '2024-02-03', remindersSent: 0 },
  { id: 'pa10', policyId: 'pd6', userId: 'u3', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-01-28', dueDate: '2026-02-03', remindersSent: 0 },
  { id: 'pa11', policyId: 'pd6', userId: 'u4', companyId: 'c1', status: 'pending', dueDate: '2026-02-03', remindersSent: 1 },
  { id: 'pa12', policyId: 'pd6', userId: 'u6', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-01-18', dueDate: '2026-01-24', remindersSent: 0 },
  // Natalie Cruz (u9)
  { id: 'pa13', policyId: 'pd1', userId: 'u9', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-01-22', dueDate: '2026-01-29', remindersSent: 0 },
  { id: 'pa14', policyId: 'pd2', userId: 'u9', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-02-04', dueDate: '2026-02-08', remindersSent: 0 },
  { id: 'pa15', policyId: 'pd3', userId: 'u9', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-01-18', dueDate: '2026-01-24', remindersSent: 0 },
  { id: 'pa16', policyId: 'pd4', userId: 'u9', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2024-04-20', dueDate: '2024-04-29', remindersSent: 0 },
  { id: 'pa17', policyId: 'pd5', userId: 'u9', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2024-04-22', dueDate: '2024-04-29', remindersSent: 0 },
  { id: 'pa18', policyId: 'pd6', userId: 'u9', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-01-25', dueDate: '2026-02-03', remindersSent: 0 },
  // Marcus Webb (u10)
  { id: 'pa19', policyId: 'pd1', userId: 'u10', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-01-24', dueDate: '2026-01-29', remindersSent: 0 },
  { id: 'pa20', policyId: 'pd2', userId: 'u10', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2026-02-03', dueDate: '2026-02-08', remindersSent: 0 },
  { id: 'pa21', policyId: 'pd3', userId: 'u10', companyId: 'c1', status: 'pending', dueDate: '2026-01-24', remindersSent: 2 },
  { id: 'pa22', policyId: 'pd4', userId: 'u10', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2024-05-10', dueDate: '2024-05-15', remindersSent: 0 },
  { id: 'pa23', policyId: 'pd5', userId: 'u10', companyId: 'c1', status: 'acknowledged', acknowledgedAt: '2024-05-12', dueDate: '2024-05-15', remindersSent: 0 },
  { id: 'pa24', policyId: 'pd6', userId: 'u10', companyId: 'c1', status: 'overdue', dueDate: '2026-02-03', remindersSent: 3 },
];

// ─── Boot: try loading from localStorage ───────────────
loadAdditionalFromStorage();

// ─── CRUD Actions ──────────────────────────────────────

const _additionalActions = {
  // Review Cycles
  addReviewCycle(data: Omit<PerformanceReviewCycle, 'id'>): PerformanceReviewCycle {
    const rc: PerformanceReviewCycle = { ...data, id: genId() };
    reviewCycles = [...reviewCycles, rc];
    return rc;
  },
  updateReviewCycle(id: string, updates: Partial<PerformanceReviewCycle>): PerformanceReviewCycle | null {
    const idx = reviewCycles.findIndex(r => r.id === id);
    if (idx === -1) return null;
    reviewCycles[idx] = { ...reviewCycles[idx], ...updates };
    reviewCycles = [...reviewCycles];
    return reviewCycles[idx];
  },
  deleteReviewCycle(id: string): boolean {
    const before = reviewCycles.length;
    reviewCycles = reviewCycles.filter(r => r.id !== id);
    performanceReviews = performanceReviews.filter(r => r.cycleId !== id);
    return reviewCycles.length < before;
  },

  // Reviews
  addReview(data: Omit<PerformanceReview, 'id' | 'createdAt'>): PerformanceReview {
    const r: PerformanceReview = { ...data, id: genId(), createdAt: new Date().toISOString().split('T')[0] };
    performanceReviews = [...performanceReviews, r];
    return r;
  },
  updateReview(id: string, updates: Partial<PerformanceReview>): PerformanceReview | null {
    const idx = performanceReviews.findIndex(r => r.id === id);
    if (idx === -1) return null;
    performanceReviews[idx] = { ...performanceReviews[idx], ...updates };
    performanceReviews = [...performanceReviews];
    return performanceReviews[idx];
  },

  // Goals
  addGoal(data: Omit<PerformanceGoal, 'id' | 'createdAt'>): PerformanceGoal {
    const g: PerformanceGoal = { ...data, id: genId(), createdAt: new Date().toISOString().split('T')[0] };
    performanceGoals = [...performanceGoals, g];
    return g;
  },
  updateGoal(id: string, updates: Partial<PerformanceGoal>): PerformanceGoal | null {
    const idx = performanceGoals.findIndex(g => g.id === id);
    if (idx === -1) return null;
    performanceGoals[idx] = { ...performanceGoals[idx], ...updates };
    performanceGoals = [...performanceGoals];
    return performanceGoals[idx];
  },
  deleteGoal(id: string): boolean {
    const before = performanceGoals.length;
    performanceGoals = performanceGoals.filter(g => g.id !== id);
    return performanceGoals.length < before;
  },

  // Feedback
  addFeedback(data: Omit<FeedbackNote, 'id' | 'createdAt'>): FeedbackNote {
    const f: FeedbackNote = { ...data, id: genId(), createdAt: new Date().toISOString().split('T')[0] };
    feedbackNotes = [...feedbackNotes, f];
    return f;
  },
  deleteFeedback(id: string): boolean {
    const before = feedbackNotes.length;
    feedbackNotes = feedbackNotes.filter(f => f.id !== id);
    return feedbackNotes.length < before;
  },

  // Policies
  addPolicy(data: Omit<PolicyDocument, 'id' | 'createdAt'>): PolicyDocument {
    const p: PolicyDocument = { ...data, id: genId(), createdAt: new Date().toISOString().split('T')[0] };
    policyDocuments = [...policyDocuments, p];
    return p;
  },
  updatePolicy(id: string, updates: Partial<PolicyDocument>): PolicyDocument | null {
    const idx = policyDocuments.findIndex(p => p.id === id);
    if (idx === -1) return null;
    policyDocuments[idx] = { ...policyDocuments[idx], ...updates };
    policyDocuments = [...policyDocuments];
    return policyDocuments[idx];
  },
  deletePolicy(id: string): boolean {
    const before = policyDocuments.length;
    policyDocuments = policyDocuments.filter(p => p.id !== id);
    policyAcknowledgments = policyAcknowledgments.filter(a => a.policyId !== id);
    return policyDocuments.length < before;
  },

  // Acknowledgments
  acknowledgePolicy(policyId: string, userId: string, companyId: string): PolicyAcknowledgment {
    const existing = policyAcknowledgments.find(a => a.policyId === policyId && a.userId === userId);
    if (existing) {
      const idx = policyAcknowledgments.indexOf(existing);
      policyAcknowledgments[idx] = { ...existing, status: 'acknowledged', acknowledgedAt: new Date().toISOString().split('T')[0] };
      policyAcknowledgments = [...policyAcknowledgments];
      return policyAcknowledgments[idx];
    }
    const ack: PolicyAcknowledgment = { id: genId(), policyId, userId, companyId, status: 'acknowledged', acknowledgedAt: new Date().toISOString().split('T')[0], dueDate: new Date().toISOString().split('T')[0], remindersSent: 0 };
    policyAcknowledgments = [...policyAcknowledgments, ack];
    return ack;
  },

  addPendingAcknowledgment(policyId: string, userId: string, companyId: string, dueDate: string): PolicyAcknowledgment {
    const existing = policyAcknowledgments.find(a => a.policyId === policyId && a.userId === userId);
    if (existing) return existing;
    const ack: PolicyAcknowledgment = { id: genId(), policyId, userId, companyId, status: 'pending', dueDate, remindersSent: 0 };
    policyAcknowledgments = [...policyAcknowledgments, ack];
    return ack;
  },

  // Onboarding task completion
  completeOnboardingTask(onboardingId: string, taskId: string, completedBy: string): boolean {
    const idx = employeeOnboardings.findIndex(o => o.id === onboardingId);
    if (idx === -1) return false;
    const ob = { ...employeeOnboardings[idx] };
    const taskIdx = ob.tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return false;
    ob.tasks = [...ob.tasks];
    ob.tasks[taskIdx] = { ...ob.tasks[taskIdx], status: 'completed', completedAt: new Date().toISOString().split('T')[0], completedBy };
    ob.completionPercent = Math.round((ob.tasks.filter(t => t.status === 'completed').length / ob.tasks.length) * 100);
    if (ob.completionPercent === 100) ob.status = 'completed';
    employeeOnboardings[idx] = ob;
    employeeOnboardings = [...employeeOnboardings];
    return true;
  },

  completeOffboardingTask(workflowId: string, taskId: string): boolean {
    const idx = offboardingWorkflows.findIndex(o => o.id === workflowId);
    if (idx === -1) return false;
    const wf = { ...offboardingWorkflows[idx] };
    const taskIdx = wf.tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return false;
    wf.tasks = [...wf.tasks];
    wf.tasks[taskIdx] = { ...wf.tasks[taskIdx], status: 'completed', completedAt: new Date().toISOString().split('T')[0] };
    wf.completionPercent = Math.round((wf.tasks.filter(t => t.status === 'completed').length / wf.tasks.length) * 100);
    if (wf.completionPercent === 100) wf.status = 'completed';
    offboardingWorkflows[idx] = wf;
    offboardingWorkflows = [...offboardingWorkflows];
    return true;
  },

  // Goal Metrics
  addGoalMetric(data: Omit<GoalMetric, 'id' | 'createdAt'>): GoalMetric {
    const m: GoalMetric = { ...data, id: genId(), createdAt: new Date().toISOString().split('T')[0] };
    goalMetrics = [...goalMetrics, m];
    return m;
  },
  updateGoalMetric(id: string, updates: Partial<GoalMetric>): GoalMetric | null {
    const idx = goalMetrics.findIndex(m => m.id === id);
    if (idx === -1) return null;
    goalMetrics[idx] = { ...goalMetrics[idx], ...updates };
    goalMetrics = [...goalMetrics];
    return goalMetrics[idx];
  },
  deleteGoalMetric(id: string): boolean {
    const before = goalMetrics.length;
    goalMetrics = goalMetrics.filter(m => m.id !== id);
    return goalMetrics.length < before;
  },

  // Review Goal Ratings
  addReviewGoalRating(data: Omit<ReviewGoalRating, 'id'>): ReviewGoalRating {
    const r: ReviewGoalRating = { ...data, id: genId() };
    reviewGoalRatings = [...reviewGoalRatings, r];
    return r;
  },
  updateReviewGoalRating(id: string, updates: Partial<ReviewGoalRating>): ReviewGoalRating | null {
    const idx = reviewGoalRatings.findIndex(r => r.id === id);
    if (idx === -1) return null;
    reviewGoalRatings[idx] = { ...reviewGoalRatings[idx], ...updates };
    reviewGoalRatings = [...reviewGoalRatings];
    return reviewGoalRatings[idx];
  },
  upsertReviewGoalRating(reviewId: string, goalId: string, updates: Partial<ReviewGoalRating>): ReviewGoalRating {
    const existing = reviewGoalRatings.find(r => r.reviewId === reviewId && r.goalId === goalId);
    if (existing) {
      const idx = reviewGoalRatings.indexOf(existing);
      reviewGoalRatings[idx] = { ...existing, ...updates };
      reviewGoalRatings = [...reviewGoalRatings];
      return reviewGoalRatings[idx];
    }
    const r: ReviewGoalRating = { id: genId(), reviewId, goalId, ...updates };
    reviewGoalRatings = [...reviewGoalRatings, r];
    return r;
  },

  // Review Metric Ratings
  addReviewMetricRating(data: Omit<ReviewMetricRating, 'id'>): ReviewMetricRating {
    const r: ReviewMetricRating = { ...data, id: genId() };
    reviewMetricRatings = [...reviewMetricRatings, r];
    return r;
  },
  updateReviewMetricRating(id: string, updates: Partial<ReviewMetricRating>): ReviewMetricRating | null {
    const idx = reviewMetricRatings.findIndex(r => r.id === id);
    if (idx === -1) return null;
    reviewMetricRatings[idx] = { ...reviewMetricRatings[idx], ...updates };
    reviewMetricRatings = [...reviewMetricRatings];
    return reviewMetricRatings[idx];
  },
  upsertReviewMetricRating(reviewId: string, metricId: string, goalId: string, updates: Partial<ReviewMetricRating>): ReviewMetricRating {
    const existing = reviewMetricRatings.find(r => r.reviewId === reviewId && r.metricId === metricId);
    if (existing) {
      const idx = reviewMetricRatings.indexOf(existing);
      reviewMetricRatings[idx] = { ...existing, ...updates };
      reviewMetricRatings = [...reviewMetricRatings];
      return reviewMetricRatings[idx];
    }
    const r: ReviewMetricRating = { id: genId(), reviewId, metricId, goalId, ...updates };
    reviewMetricRatings = [...reviewMetricRatings, r];
    return r;
  },

  // Incentive Models
  addIncentiveModel(data: Omit<IncentiveModel, 'id' | 'createdAt' | 'updatedAt'>): IncentiveModel {
    const now = new Date().toISOString().split('T')[0];
    const m: IncentiveModel = { ...data, id: genId(), createdAt: now, updatedAt: now };
    incentiveModels = [...incentiveModels, m];
    return m;
  },
  updateIncentiveModel(id: string, updates: Partial<IncentiveModel>): IncentiveModel | null {
    const idx = incentiveModels.findIndex(m => m.id === id);
    if (idx === -1) return null;
    incentiveModels[idx] = { ...incentiveModels[idx], ...updates, updatedAt: new Date().toISOString().split('T')[0] };
    incentiveModels = [...incentiveModels];
    return incentiveModels[idx];
  },
  deleteIncentiveModel(id: string): boolean {
    const before = incentiveModels.length;
    incentiveModels = incentiveModels.filter(m => m.id !== id);
    incentiveAssignments = incentiveAssignments.filter(a => a.modelId !== id);
    return incentiveModels.length < before;
  },

  // Incentive Assignments
  addIncentiveAssignment(data: Omit<IncentiveAssignment, 'id'>): IncentiveAssignment {
    const a: IncentiveAssignment = { ...data, id: genId() };
    incentiveAssignments = [...incentiveAssignments, a];
    return a;
  },
  updateIncentiveAssignment(id: string, updates: Partial<IncentiveAssignment>): IncentiveAssignment | null {
    const idx = incentiveAssignments.findIndex(a => a.id === id);
    if (idx === -1) return null;
    incentiveAssignments[idx] = { ...incentiveAssignments[idx], ...updates };
    incentiveAssignments = [...incentiveAssignments];
    return incentiveAssignments[idx];
  },
  deleteIncentiveAssignment(id: string): boolean {
    const before = incentiveAssignments.length;
    incentiveAssignments = incentiveAssignments.filter(a => a.id !== id);
    return incentiveAssignments.length < before;
  },

  // Peer Reviews
  addPeerReview(data: Omit<PeerReview, 'id'>): PeerReview {
    const pr: PeerReview = { ...data, id: genId() };
    peerReviews = [...peerReviews, pr];
    return pr;
  },
  updatePeerReview(id: string, updates: Partial<PeerReview>): PeerReview | null {
    const idx = peerReviews.findIndex(p => p.id === id);
    if (idx === -1) return null;
    peerReviews[idx] = { ...peerReviews[idx], ...updates };
    peerReviews = [...peerReviews];
    return peerReviews[idx];
  },
  deletePeerReview(id: string): boolean {
    const before = peerReviews.length;
    peerReviews = peerReviews.filter(p => p.id !== id);
    return peerReviews.length < before;
  },
  addPeerGoalRating(reviewId: string, goalId: string, peerUserId: string, rating: number, comment?: string): ReviewGoalRating {
    const existing = reviewGoalRatings.find(r => r.reviewId === reviewId && r.goalId === goalId);
    const entry: import('./types').PeerRatingEntry = { userId: peerUserId, rating, comment };
    if (existing) {
      const idx = reviewGoalRatings.indexOf(existing);
      const peerRatings = [...(existing.peerRatings || []).filter(p => p.userId !== peerUserId), entry];
      reviewGoalRatings[idx] = { ...existing, peerRatings };
      reviewGoalRatings = [...reviewGoalRatings];
      return reviewGoalRatings[idx];
    }
    const r: ReviewGoalRating = { id: genId(), reviewId, goalId, peerRatings: [entry] };
    reviewGoalRatings = [...reviewGoalRatings, r];
    return r;
  },
  addPeerMetricRating(reviewId: string, metricId: string, goalId: string, peerUserId: string, rating: number): ReviewMetricRating {
    const existing = reviewMetricRatings.find(r => r.reviewId === reviewId && r.metricId === metricId);
    const entry: import('./types').PeerRatingEntry = { userId: peerUserId, rating };
    if (existing) {
      const idx = reviewMetricRatings.indexOf(existing);
      const peerRatings = [...(existing.peerRatings || []).filter(p => p.userId !== peerUserId), entry];
      reviewMetricRatings[idx] = { ...existing, peerRatings };
      reviewMetricRatings = [...reviewMetricRatings];
      return reviewMetricRatings[idx];
    }
    const r: ReviewMetricRating = { id: genId(), reviewId, metricId, goalId, peerRatings: [entry] };
    reviewMetricRatings = [...reviewMetricRatings, r];
    return r;
  },

  // Onboarding Templates
  addOnboardingTemplate(data: Omit<OnboardingTemplate, 'id'>): OnboardingTemplate {
    const t: OnboardingTemplate = { ...data, id: genId() };
    onboardingTemplates = [...onboardingTemplates, t];
    return t;
  },
  updateOnboardingTemplate(id: string, updates: Partial<OnboardingTemplate>): OnboardingTemplate | null {
    const idx = onboardingTemplates.findIndex(t => t.id === id);
    if (idx === -1) return null;
    onboardingTemplates[idx] = { ...onboardingTemplates[idx], ...updates };
    onboardingTemplates = [...onboardingTemplates];
    return onboardingTemplates[idx];
  },
  deleteOnboardingTemplate(id: string): boolean {
    const before = onboardingTemplates.length;
    onboardingTemplates = onboardingTemplates.filter(t => t.id !== id);
    return onboardingTemplates.length < before;
  },

  // Employee Onboarding
  addEmployeeOnboarding(data: Omit<EmployeeOnboarding, 'id' | 'createdAt'>): EmployeeOnboarding {
    const o: EmployeeOnboarding = { ...data, id: genId(), createdAt: new Date().toISOString().split('T')[0] };
    employeeOnboardings = [...employeeOnboardings, o];
    return o;
  },
  updateEmployeeOnboarding(id: string, updates: Partial<EmployeeOnboarding>): EmployeeOnboarding | null {
    const idx = employeeOnboardings.findIndex(o => o.id === id);
    if (idx === -1) return null;
    employeeOnboardings[idx] = { ...employeeOnboardings[idx], ...updates };
    employeeOnboardings = [...employeeOnboardings];
    return employeeOnboardings[idx];
  },

  // Offboarding Workflows
  addOffboardingWorkflow(data: Omit<OffboardingWorkflow, 'id' | 'createdAt'>): OffboardingWorkflow {
    const w: OffboardingWorkflow = { ...data, id: genId(), createdAt: new Date().toISOString().split('T')[0] };
    offboardingWorkflows = [...offboardingWorkflows, w];
    return w;
  },
  updateOffboardingWorkflow(id: string, updates: Partial<OffboardingWorkflow>): OffboardingWorkflow | null {
    const idx = offboardingWorkflows.findIndex(o => o.id === id);
    if (idx === -1) return null;
    offboardingWorkflows[idx] = { ...offboardingWorkflows[idx], ...updates };
    offboardingWorkflows = [...offboardingWorkflows];
    return offboardingWorkflows[idx];
  },
};

// Proxy wrapper: auto-persist to localStorage after every action
export const additionalActions = new Proxy(_additionalActions, {
  get(target, prop, receiver) {
    const val = Reflect.get(target, prop, receiver);
    if (typeof val === 'function') {
      return function (this: unknown, ...args: unknown[]) {
        const result = (val as Function).apply(target, args);
        saveAdditionalToStorage();
        return result;
      };
    }
    return val;
  },
}) as typeof _additionalActions;

// ─── Getter Functions ──────────────────────────────────

export const additionalReads = {
  getOnboardingTemplatesForCompany: (companyId: string) => onboardingTemplates.filter(t => t.companyId === companyId),
  getOnboardingTemplate: (id: string) => onboardingTemplates.find(t => t.id === id),
  getEmployeeOnboardings: (companyId: string) => employeeOnboardings.filter(o => o.companyId === companyId),
  getOnboardingForUser: (userId: string) => employeeOnboardings.filter(o => o.userId === userId),
  getOffboardingWorkflows: (companyId: string) => offboardingWorkflows.filter(o => o.companyId === companyId),

  getReviewCyclesForCompany: (companyId: string) => reviewCycles.filter(rc => rc.companyId === companyId),
  getReviewsForCycle: (cycleId: string) => performanceReviews.filter(r => r.cycleId === cycleId),
  getReviewsForUser: (userId: string) => performanceReviews.filter(r => r.userId === userId),
  getReview: (id: string) => performanceReviews.find(r => r.id === id),
  getGoalsForUser: (userId: string) => performanceGoals.filter(g => g.userId === userId),
  getGoalsForCompany: (companyId: string) => performanceGoals.filter(g => g.companyId === companyId),
  getFeedbackForUser: (userId: string) => feedbackNotes.filter(f => f.toUserId === userId),
  getFeedbackByUser: (userId: string) => feedbackNotes.filter(f => f.fromUserId === userId),
  getAllFeedback: (companyId: string) => feedbackNotes.filter(f => f.companyId === companyId),

  getPoliciesForCompany: (companyId: string) => policyDocuments.filter(p => p.companyId === companyId),
  getPublishedPolicies: (companyId: string) => policyDocuments.filter(p => p.companyId === companyId && p.status === 'published'),
  getPolicyAcknowledgments: (policyId: string) => policyAcknowledgments.filter(a => a.policyId === policyId),
  getUserAcknowledgments: (userId: string) => policyAcknowledgments.filter(a => a.userId === userId),
  getCompanyAcknowledgments: (companyId: string) => policyAcknowledgments.filter(a => a.companyId === companyId),
  getPendingAcknowledgments: (userId: string) => policyAcknowledgments.filter(a => a.userId === userId && (a.status === 'pending' || a.status === 'overdue')),

  getMetricsForGoal: (goalId: string) => goalMetrics.filter(m => m.goalId === goalId),
  getMetricsForCompany: (companyId: string) => goalMetrics.filter(m => m.companyId === companyId),
  getGoalMetric: (id: string) => goalMetrics.find(m => m.id === id),

  getGoalRatingsForReview: (reviewId: string) => reviewGoalRatings.filter(r => r.reviewId === reviewId),
  getGoalRating: (reviewId: string, goalId: string) => reviewGoalRatings.find(r => r.reviewId === reviewId && r.goalId === goalId),

  getMetricRatingsForReview: (reviewId: string) => reviewMetricRatings.filter(r => r.reviewId === reviewId),
  getMetricRating: (reviewId: string, metricId: string) => reviewMetricRatings.find(r => r.reviewId === reviewId && r.metricId === metricId),

  getIncentiveModelsForCompany: (companyId: string) => incentiveModels.filter(m => m.companyId === companyId),
  getIncentiveModel: (id: string) => incentiveModels.find(m => m.id === id),
  getActiveIncentiveModels: (companyId: string) => incentiveModels.filter(m => m.companyId === companyId && m.status === 'active'),

  getAssignmentsForModel: (modelId: string) => incentiveAssignments.filter(a => a.modelId === modelId),
  getAssignmentsForUser: (userId: string) => incentiveAssignments.filter(a => a.userId === userId),
  getAssignmentsForCompany: (companyId: string) => incentiveAssignments.filter(a => a.companyId === companyId),
  getActiveAssignmentsForUser: (userId: string) => incentiveAssignments.filter(a => a.userId === userId && a.status === 'active'),

  // Peer Reviews
  getPeerReviewsForReview: (reviewId: string) => peerReviews.filter(p => p.reviewId === reviewId),
  getPeerReviewsForPeer: (peerUserId: string) => peerReviews.filter(p => p.peerUserId === peerUserId),
  getPeerReviewsForCompany: (companyId: string) => peerReviews.filter(p => p.companyId === companyId),
  getPeerReview: (id: string) => peerReviews.find(p => p.id === id),
};

export function resetAdditionalData() {
  localStorage.removeItem(ADDITIONAL_STORAGE_KEY);
}