import type { SignatureRequest, SignatureAuditEntry } from './types';

// ─── LocalStorage Persistence ──────────────────────────
const ESIGN_STORAGE_KEY = 'esignStore_state';

function saveEsignToStorage() {
  try {
    localStorage.setItem(ESIGN_STORAGE_KEY, JSON.stringify({
      esignIdCounter, signatureRequests, signatureAuditEntries,
    }));
  } catch { /* quota exceeded */ }
}

function loadEsignFromStorage(): boolean {
  try {
    const raw = localStorage.getItem(ESIGN_STORAGE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    esignIdCounter = s.esignIdCounter || 100;
    signatureRequests.length = 0;
    signatureRequests.push(...(s.signatureRequests || []));
    signatureAuditEntries.length = 0;
    signatureAuditEntries.push(...(s.signatureAuditEntries || []));
    return true;
  } catch { return false; }
}

export const signatureRequests: SignatureRequest[] = [
  {
    id: 'sr1', companyId: 'c1', title: 'Emily Watson Employment Contract', documentName: 'contract_emily_watson_v2.pdf',
    documentCategory: 'contract', status: 'signed', createdBy: 'u2',
    signers: [
      { id: 'sg1', userId: 'u2', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2024-01-28T10:00:00', viewedAt: '2024-01-28T09:55:00', ipAddress: '192.168.1.10' },
      { id: 'sg2', userId: 'u3', order: 2, status: 'signed', signatureType: 'drawn', signedAt: '2024-01-29T14:30:00', viewedAt: '2024-01-29T14:20:00', ipAddress: '192.168.1.25' },
      { id: 'sg3', userId: 'u1', order: 3, status: 'signed', signatureType: 'typed', signedAt: '2024-01-30T09:00:00', viewedAt: '2024-01-30T08:50:00', ipAddress: '10.0.0.1' },
    ],
    createdAt: '2024-01-27T08:00:00', completedAt: '2024-01-30T09:00:00',
  },
  {
    id: 'sr2', companyId: 'c1', title: 'NDA - Michael Brown', documentName: 'nda_michael_brown.pdf',
    documentCategory: 'nda', status: 'signed', createdBy: 'u2',
    signers: [
      { id: 'sg4', userId: 'u4', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2024-02-10T11:00:00', viewedAt: '2024-02-10T10:45:00', ipAddress: '192.168.1.30' },
    ],
    createdAt: '2024-02-09T09:00:00', completedAt: '2024-02-10T11:00:00',
  },
  {
    id: 'sr3', companyId: 'c1', title: 'Remote Work Agreement - Lisa Park', documentName: 'remote_work_lisa_park.pdf',
    documentCategory: 'policy', status: 'partially_signed', createdBy: 'u2',
    signers: [
      { id: 'sg5', userId: 'u5', order: 1, status: 'signed', signatureType: 'drawn', signedAt: '2026-03-05T14:00:00', viewedAt: '2026-03-05T13:50:00', ipAddress: '192.168.2.15' },
      { id: 'sg6', userId: 'u2', order: 2, status: 'pending' },
    ],
    createdAt: '2026-03-04T10:00:00', expiresAt: '2026-04-04T10:00:00',
  },
  {
    id: 'sr4', companyId: 'c1', title: 'Q1 Performance Review - Emily Watson', documentName: 'perf_review_q1_emily.pdf',
    documentCategory: 'performance', status: 'sent', createdBy: 'u4',
    signers: [
      { id: 'sg7', userId: 'u3', order: 1, status: 'viewed', viewedAt: '2026-03-08T09:00:00' },
      { id: 'sg8', userId: 'u4', order: 2, status: 'pending' },
    ],
    createdAt: '2026-03-07T16:00:00', expiresAt: '2026-04-07T16:00:00',
  },
  {
    id: 'sr5', companyId: 'c1', title: 'Robert Taylor Employment Contract', documentName: 'contract_robert_taylor.pdf',
    documentCategory: 'contract', status: 'signed', createdBy: 'u2',
    signers: [
      { id: 'sg9', userId: 'u2', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2024-03-25T10:00:00', viewedAt: '2024-03-25T09:50:00', ipAddress: '192.168.1.10' },
      { id: 'sg10', userId: 'u8', order: 2, status: 'signed', signatureType: 'drawn', signedAt: '2024-03-26T11:30:00', viewedAt: '2024-03-26T11:00:00', ipAddress: '192.168.3.5' },
      { id: 'sg11', userId: 'u1', order: 3, status: 'signed', signatureType: 'typed', signedAt: '2024-03-27T08:00:00', viewedAt: '2024-03-27T07:50:00', ipAddress: '10.0.0.1' },
    ],
    createdAt: '2024-03-24T08:00:00', completedAt: '2024-03-27T08:00:00',
  },
  {
    id: 'sr6', companyId: 'c2', title: 'David Kim UK Contract', documentName: 'contract_david_kim_uk.pdf',
    documentCategory: 'contract', status: 'signed', createdBy: 'u7',
    signers: [
      { id: 'sg12', userId: 'u7', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2024-03-05T10:00:00', viewedAt: '2024-03-05T09:45:00', ipAddress: '10.0.1.5' },
      { id: 'sg13', userId: 'u6', order: 2, status: 'signed', signatureType: 'typed', signedAt: '2024-03-06T15:00:00', viewedAt: '2024-03-06T14:30:00', ipAddress: '10.0.1.20' },
    ],
    createdAt: '2024-03-04T08:00:00', completedAt: '2024-03-06T15:00:00',
  },
  {
    id: 'sr7', companyId: 'c1', title: 'Updated Security Policy Acceptance', documentName: 'security_policy_v2.pdf',
    documentCategory: 'policy', status: 'sent', createdBy: 'u1',
    signers: [
      { id: 'sg14', userId: 'u3', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2026-02-05T10:00:00', viewedAt: '2026-02-05T09:50:00' },
      { id: 'sg15', userId: 'u4', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2026-02-06T11:00:00', viewedAt: '2026-02-06T10:45:00' },
      { id: 'sg16', userId: 'u5', order: 1, status: 'pending' },
      { id: 'sg17', userId: 'u8', order: 1, status: 'viewed', viewedAt: '2026-02-07T08:00:00' },
    ],
    createdAt: '2026-02-01T08:00:00', expiresAt: '2026-03-01T08:00:00',
  },
  {
    id: 'sr8', companyId: 'c1', title: 'Disciplinary Notice - Draft', documentName: 'disciplinary_draft.pdf',
    documentCategory: 'disciplinary', status: 'draft', createdBy: 'u2',
    signers: [],
    createdAt: '2026-03-09T16:00:00',
  },
  // ─── Additional rich data ────────────────────────────────
  {
    id: 'sr9', companyId: 'c1', title: 'Annual Bonus Agreement - Michael Brown', documentName: 'bonus_agreement_michael_brown.pdf',
    documentCategory: 'contract', status: 'signed', createdBy: 'u2',
    signers: [
      { id: 'sg18', userId: 'u4', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2025-12-20T10:00:00', viewedAt: '2025-12-20T09:30:00', ipAddress: '192.168.1.30' },
      { id: 'sg19', userId: 'u2', order: 2, status: 'signed', signatureType: 'typed', signedAt: '2025-12-21T11:00:00', viewedAt: '2025-12-21T10:45:00', ipAddress: '192.168.1.10' },
      { id: 'sg20', userId: 'u1', order: 3, status: 'signed', signatureType: 'drawn', signedAt: '2025-12-22T09:00:00', viewedAt: '2025-12-22T08:30:00', ipAddress: '10.0.0.1' },
    ],
    createdAt: '2025-12-19T08:00:00', completedAt: '2025-12-22T09:00:00',
  },
  {
    id: 'sr10', companyId: 'c1', title: 'IT Equipment Loan Form - Lisa Park', documentName: 'equipment_loan_lisa_park.pdf',
    documentCategory: 'other', status: 'expired', createdBy: 'u2',
    signers: [
      { id: 'sg21', userId: 'u5', order: 1, status: 'pending' },
    ],
    createdAt: '2025-11-01T08:00:00', expiresAt: '2025-12-01T08:00:00',
  },
  {
    id: 'sr11', companyId: 'c1', title: 'Non-Compete Amendment - Emily Watson', documentName: 'non_compete_amendment_emily.pdf',
    documentCategory: 'nda', status: 'declined', createdBy: 'u2',
    signers: [
      { id: 'sg22', userId: 'u3', order: 1, status: 'declined', viewedAt: '2026-01-10T10:00:00', declinedReason: 'Clause 4.2 is overly restrictive. Needs legal review.' },
    ],
    createdAt: '2026-01-08T08:00:00',
  },
  {
    id: 'sr12', companyId: 'c1', title: 'Salary Revision Letter - Robert Taylor', documentName: 'salary_revision_robert_taylor.pdf',
    documentCategory: 'contract', status: 'sent', createdBy: 'u2',
    signers: [
      { id: 'sg23', userId: 'u8', order: 1, status: 'viewed', viewedAt: '2026-03-09T11:00:00' },
      { id: 'sg24', userId: 'u2', order: 2, status: 'pending' },
      { id: 'sg25', userId: 'u1', order: 3, status: 'pending' },
    ],
    createdAt: '2026-03-08T15:00:00', expiresAt: '2026-04-08T15:00:00',
  },
  {
    id: 'sr13', companyId: 'c1', title: 'Confidentiality Agreement - All Development', documentName: 'confidentiality_development_2026.pdf',
    documentCategory: 'nda', status: 'partially_signed', createdBy: 'u1',
    signers: [
      { id: 'sg26', userId: 'u3', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2026-02-20T09:00:00', viewedAt: '2026-02-20T08:45:00', ipAddress: '192.168.1.25' },
      { id: 'sg27', userId: 'u4', order: 1, status: 'signed', signatureType: 'drawn', signedAt: '2026-02-20T14:00:00', viewedAt: '2026-02-20T13:30:00', ipAddress: '192.168.1.30' },
      { id: 'sg28', userId: 'u5', order: 1, status: 'viewed', viewedAt: '2026-02-21T10:00:00' },
      { id: 'sg29', userId: 'u8', order: 1, status: 'pending' },
    ],
    createdAt: '2026-02-18T08:00:00', expiresAt: '2026-03-18T08:00:00',
  },
  {
    id: 'sr14', companyId: 'c2', title: 'UK GDPR Data Processing Agreement', documentName: 'gdpr_dpa_uk_2026.pdf',
    documentCategory: 'policy', status: 'sent', createdBy: 'u7',
    signers: [
      { id: 'sg30', userId: 'u6', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2026-03-02T10:00:00', viewedAt: '2026-03-02T09:30:00', ipAddress: '10.0.1.20' },
      { id: 'sg31', userId: 'u7', order: 2, status: 'pending' },
    ],
    createdAt: '2026-03-01T08:00:00', expiresAt: '2026-04-01T08:00:00',
  },
  {
    id: 'sr15', companyId: 'c1', title: 'Intellectual Property Assignment', documentName: 'ip_assignment_all_staff.pdf',
    documentCategory: 'contract', status: 'draft', createdBy: 'u1',
    signers: [],
    createdAt: '2026-03-10T08:00:00',
  },
  {
    id: 'sr16', companyId: 'c2', title: 'Anna Johnson Promotion Letter', documentName: 'promotion_anna_johnson.pdf',
    documentCategory: 'contract', status: 'signed', createdBy: 'u7',
    signers: [
      { id: 'sg32', userId: 'u7', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2025-09-15T10:00:00', viewedAt: '2025-09-15T09:30:00', ipAddress: '10.0.1.5' },
    ],
    createdAt: '2025-09-14T08:00:00', completedAt: '2025-09-15T10:00:00',
  },
  // Natalie Cruz (u9) - signed employment contract
  {
    id: 'sr17', companyId: 'c1', title: 'Natalie Cruz Employment Contract', documentName: 'contract_natalie_cruz_v1.pdf',
    documentCategory: 'contract', status: 'signed', createdBy: 'u2',
    signers: [
      { id: 'sg33', userId: 'u2', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2024-04-10T10:00:00', viewedAt: '2024-04-10T09:45:00', ipAddress: '192.168.1.10' },
      { id: 'sg34', userId: 'u9', order: 2, status: 'signed', signatureType: 'drawn', signedAt: '2024-04-11T14:00:00', viewedAt: '2024-04-11T13:50:00', ipAddress: '192.168.4.10' },
      { id: 'sg35', userId: 'u1', order: 3, status: 'signed', signatureType: 'typed', signedAt: '2024-04-12T09:00:00', viewedAt: '2024-04-12T08:45:00', ipAddress: '10.0.0.1' },
    ],
    createdAt: '2024-04-09T08:00:00', completedAt: '2024-04-12T09:00:00',
  },
  // Natalie Cruz - NDA
  {
    id: 'sr18', companyId: 'c1', title: 'NDA - Natalie Cruz', documentName: 'nda_natalie_cruz.pdf',
    documentCategory: 'nda', status: 'signed', createdBy: 'u2',
    signers: [
      { id: 'sg36', userId: 'u9', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2024-04-14T11:00:00', viewedAt: '2024-04-14T10:30:00', ipAddress: '192.168.4.10' },
    ],
    createdAt: '2024-04-13T09:00:00', completedAt: '2024-04-14T11:00:00',
  },
  // Natalie Cruz - Q1 Performance Review signature (pending)
  {
    id: 'sr19', companyId: 'c1', title: 'Q1 Performance Review - Natalie Cruz', documentName: 'perf_review_q1_natalie.pdf',
    documentCategory: 'performance', status: 'sent', createdBy: 'u1',
    signers: [
      { id: 'sg37', userId: 'u9', order: 1, status: 'viewed', viewedAt: '2026-03-08T10:00:00' },
      { id: 'sg38', userId: 'u1', order: 2, status: 'pending' },
    ],
    createdAt: '2026-03-07T15:00:00', expiresAt: '2026-04-07T15:00:00',
  },
  // Marcus Webb (u10) - signed employment contract
  {
    id: 'sr20', companyId: 'c1', title: 'Marcus Webb Employment Contract', documentName: 'contract_marcus_webb_v1.pdf',
    documentCategory: 'contract', status: 'signed', createdBy: 'u2',
    signers: [
      { id: 'sg39', userId: 'u2', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2024-04-26T10:00:00', viewedAt: '2024-04-26T09:30:00', ipAddress: '192.168.1.10' },
      { id: 'sg40', userId: 'u10', order: 2, status: 'signed', signatureType: 'drawn', signedAt: '2024-04-27T11:00:00', viewedAt: '2024-04-27T10:45:00', ipAddress: '192.168.5.10' },
      { id: 'sg41', userId: 'u1', order: 3, status: 'signed', signatureType: 'typed', signedAt: '2024-04-28T09:00:00', viewedAt: '2024-04-28T08:30:00', ipAddress: '10.0.0.1' },
    ],
    createdAt: '2024-04-25T08:00:00', completedAt: '2024-04-28T09:00:00',
  },
  // Marcus Webb - NDA
  {
    id: 'sr21', companyId: 'c1', title: 'NDA - Marcus Webb', documentName: 'nda_marcus_webb.pdf',
    documentCategory: 'nda', status: 'signed', createdBy: 'u2',
    signers: [
      { id: 'sg42', userId: 'u10', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2024-04-30T14:00:00', viewedAt: '2024-04-30T13:30:00', ipAddress: '192.168.5.10' },
    ],
    createdAt: '2024-04-29T09:00:00', completedAt: '2024-04-30T14:00:00',
  },
  // Marcus Webb - Infrastructure Access Agreement (pending his signature)
  {
    id: 'sr22', companyId: 'c1', title: 'Infrastructure Admin Access Agreement - Marcus Webb', documentName: 'infra_access_agreement_marcus.pdf',
    documentCategory: 'policy', status: 'partially_signed', createdBy: 'u1',
    signers: [
      { id: 'sg43', userId: 'u10', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2026-02-15T10:00:00', viewedAt: '2026-02-15T09:30:00', ipAddress: '192.168.5.10' },
      { id: 'sg44', userId: 'u4', order: 2, status: 'signed', signatureType: 'typed', signedAt: '2026-02-16T11:00:00', viewedAt: '2026-02-16T10:30:00', ipAddress: '192.168.1.30' },
      { id: 'sg45', userId: 'u1', order: 3, status: 'pending' },
    ],
    createdAt: '2026-02-14T08:00:00', expiresAt: '2026-03-14T08:00:00',
  },
  // Both new employees - Confidentiality agreement (added to existing sr13 signers would be complex, so separate request)
  {
    id: 'sr23', companyId: 'c1', title: 'Security Policy Acceptance - New Hires 2024', documentName: 'security_policy_new_hires.pdf',
    documentCategory: 'policy', status: 'signed', createdBy: 'u2',
    signers: [
      { id: 'sg46', userId: 'u9', order: 1, status: 'signed', signatureType: 'typed', signedAt: '2024-04-20T09:00:00', viewedAt: '2024-04-20T08:45:00', ipAddress: '192.168.4.10' },
      { id: 'sg47', userId: 'u10', order: 1, status: 'signed', signatureType: 'drawn', signedAt: '2024-05-05T10:00:00', viewedAt: '2024-05-05T09:30:00', ipAddress: '192.168.5.10' },
    ],
    createdAt: '2024-04-18T08:00:00', completedAt: '2024-05-05T10:00:00',
  },
];

export const signatureAuditEntries: SignatureAuditEntry[] = [
  { id: 'sae1', requestId: 'sr1', userId: 'u2', action: 'created', timestamp: '2024-01-27T08:00:00', details: 'Signature request created for Emily Watson Employment Contract' },
  { id: 'sae2', requestId: 'sr1', userId: 'u2', action: 'sent', timestamp: '2024-01-27T08:01:00', details: 'Sent to HR Director James Chen for signing' },
  { id: 'sae3', requestId: 'sr1', userId: 'u2', action: 'signed', timestamp: '2024-01-28T10:00:00', ipAddress: '192.168.1.10', details: 'Signed by James Chen (typed signature)' },
  { id: 'sae4', requestId: 'sr1', userId: 'u3', action: 'viewed', timestamp: '2024-01-29T14:20:00', ipAddress: '192.168.1.25', details: 'Viewed by Emily Watson' },
  { id: 'sae5', requestId: 'sr1', userId: 'u3', action: 'signed', timestamp: '2024-01-29T14:30:00', ipAddress: '192.168.1.25', details: 'Signed by Emily Watson (drawn signature)' },
  { id: 'sae6', requestId: 'sr1', userId: 'u1', action: 'signed', timestamp: '2024-01-30T09:00:00', ipAddress: '10.0.0.1', details: 'Signed by Sarah Mitchell (typed signature)' },
  { id: 'sae7', requestId: 'sr1', userId: 'u1', action: 'completed', timestamp: '2024-01-30T09:00:00', details: 'All parties have signed. Document locked.' },
  { id: 'sae8', requestId: 'sr4', userId: 'u4', action: 'created', timestamp: '2026-03-07T16:00:00', details: 'Performance review signature request created' },
  { id: 'sae9', requestId: 'sr4', userId: 'u4', action: 'sent', timestamp: '2026-03-07T16:01:00', details: 'Sent to Emily Watson for review' },
  { id: 'sae10', requestId: 'sr4', userId: 'u3', action: 'viewed', timestamp: '2026-03-08T09:00:00', ipAddress: '192.168.1.25', details: 'Viewed by Emily Watson' },
  // Additional audit entries for richer data
  { id: 'sae11', requestId: 'sr3', userId: 'u2', action: 'created', timestamp: '2026-03-04T10:00:00', details: 'Remote work agreement created for Lisa Park' },
  { id: 'sae12', requestId: 'sr3', userId: 'u2', action: 'sent', timestamp: '2026-03-04T10:01:00', details: 'Sent to Lisa Park and James Chen for signing' },
  { id: 'sae13', requestId: 'sr3', userId: 'u5', action: 'viewed', timestamp: '2026-03-05T13:50:00', ipAddress: '192.168.2.15', details: 'Viewed by Lisa Park' },
  { id: 'sae14', requestId: 'sr3', userId: 'u5', action: 'signed', timestamp: '2026-03-05T14:00:00', ipAddress: '192.168.2.15', details: 'Signed by Lisa Park (drawn signature)' },
  { id: 'sae15', requestId: 'sr7', userId: 'u1', action: 'created', timestamp: '2026-02-01T08:00:00', details: 'Security policy acceptance created for all development staff' },
  { id: 'sae16', requestId: 'sr7', userId: 'u1', action: 'sent', timestamp: '2026-02-01T08:01:00', details: 'Sent to Emily Watson, Michael Brown, Lisa Park, Robert Taylor' },
  { id: 'sae17', requestId: 'sr7', userId: 'u3', action: 'signed', timestamp: '2026-02-05T10:00:00', details: 'Signed by Emily Watson (typed signature)' },
  { id: 'sae18', requestId: 'sr7', userId: 'u4', action: 'signed', timestamp: '2026-02-06T11:00:00', details: 'Signed by Michael Brown (typed signature)' },
  { id: 'sae19', requestId: 'sr7', userId: 'u8', action: 'viewed', timestamp: '2026-02-07T08:00:00', details: 'Viewed by Robert Taylor' },
  { id: 'sae20', requestId: 'sr7', userId: 'u1', action: 'reminder_sent', timestamp: '2026-02-15T08:00:00', details: 'Reminder sent to Lisa Park and Robert Taylor' },
  { id: 'sae21', requestId: 'sr11', userId: 'u2', action: 'created', timestamp: '2026-01-08T08:00:00', details: 'Non-compete amendment created for Emily Watson' },
  { id: 'sae22', requestId: 'sr11', userId: 'u2', action: 'sent', timestamp: '2026-01-08T08:01:00', details: 'Sent to Emily Watson for review and signing' },
  { id: 'sae23', requestId: 'sr11', userId: 'u3', action: 'viewed', timestamp: '2026-01-10T10:00:00', ipAddress: '192.168.1.25', details: 'Viewed by Emily Watson' },
  { id: 'sae24', requestId: 'sr11', userId: 'u3', action: 'declined', timestamp: '2026-01-10T10:05:00', ipAddress: '192.168.1.25', details: 'Declined by Emily Watson: Clause 4.2 is overly restrictive' },
  { id: 'sae25', requestId: 'sr12', userId: 'u2', action: 'created', timestamp: '2026-03-08T15:00:00', details: 'Salary revision letter created for Robert Taylor' },
  { id: 'sae26', requestId: 'sr12', userId: 'u2', action: 'sent', timestamp: '2026-03-08T15:01:00', details: 'Sent to Robert Taylor, James Chen, and Sarah Mitchell' },
  { id: 'sae27', requestId: 'sr12', userId: 'u8', action: 'viewed', timestamp: '2026-03-09T11:00:00', ipAddress: '192.168.3.5', details: 'Viewed by Robert Taylor' },
  { id: 'sae28', requestId: 'sr13', userId: 'u1', action: 'created', timestamp: '2026-02-18T08:00:00', details: 'Confidentiality agreement created for all Development staff' },
  { id: 'sae29', requestId: 'sr13', userId: 'u3', action: 'signed', timestamp: '2026-02-20T09:00:00', details: 'Signed by Emily Watson (typed signature)' },
  { id: 'sae30', requestId: 'sr13', userId: 'u4', action: 'signed', timestamp: '2026-02-20T14:00:00', details: 'Signed by Michael Brown (drawn signature)' },
  { id: 'sae31', requestId: 'sr13', userId: 'u5', action: 'viewed', timestamp: '2026-02-21T10:00:00', details: 'Viewed by Lisa Park' },
  { id: 'sae32', requestId: 'sr10', userId: 'u2', action: 'created', timestamp: '2025-11-01T08:00:00', details: 'Equipment loan form created for Lisa Park' },
  { id: 'sae33', requestId: 'sr10', userId: 'u2', action: 'sent', timestamp: '2025-11-01T08:01:00', details: 'Sent to Lisa Park for signing' },
  { id: 'sae34', requestId: 'sr10', userId: 'u2', action: 'expired', timestamp: '2025-12-01T08:00:00', details: 'Document expired - no signatures collected within deadline' },
  // Natalie Cruz audit entries
  { id: 'sae35', requestId: 'sr17', userId: 'u2', action: 'created', timestamp: '2024-04-09T08:00:00', details: 'Employment contract created for Natalie Cruz' },
  { id: 'sae36', requestId: 'sr17', userId: 'u2', action: 'sent', timestamp: '2024-04-09T08:01:00', details: 'Sent to James Chen, Natalie Cruz, and Sarah Mitchell' },
  { id: 'sae37', requestId: 'sr17', userId: 'u2', action: 'signed', timestamp: '2024-04-10T10:00:00', ipAddress: '192.168.1.10', details: 'Signed by James Chen (typed signature)' },
  { id: 'sae38', requestId: 'sr17', userId: 'u9', action: 'signed', timestamp: '2024-04-11T14:00:00', ipAddress: '192.168.4.10', details: 'Signed by Natalie Cruz (drawn signature)' },
  { id: 'sae39', requestId: 'sr17', userId: 'u1', action: 'signed', timestamp: '2024-04-12T09:00:00', ipAddress: '10.0.0.1', details: 'Signed by Sarah Mitchell (typed signature)' },
  { id: 'sae40', requestId: 'sr17', userId: 'u1', action: 'completed', timestamp: '2024-04-12T09:00:00', details: 'All parties have signed. Document locked.' },
  { id: 'sae41', requestId: 'sr19', userId: 'u1', action: 'created', timestamp: '2026-03-07T15:00:00', details: 'Q1 Performance review signature request created for Natalie Cruz' },
  { id: 'sae42', requestId: 'sr19', userId: 'u1', action: 'sent', timestamp: '2026-03-07T15:01:00', details: 'Sent to Natalie Cruz for review' },
  { id: 'sae43', requestId: 'sr19', userId: 'u9', action: 'viewed', timestamp: '2026-03-08T10:00:00', ipAddress: '192.168.4.10', details: 'Viewed by Natalie Cruz' },
  // Marcus Webb audit entries
  { id: 'sae44', requestId: 'sr20', userId: 'u2', action: 'created', timestamp: '2024-04-25T08:00:00', details: 'Employment contract created for Marcus Webb' },
  { id: 'sae45', requestId: 'sr20', userId: 'u2', action: 'sent', timestamp: '2024-04-25T08:01:00', details: 'Sent to James Chen, Marcus Webb, and Sarah Mitchell' },
  { id: 'sae46', requestId: 'sr20', userId: 'u2', action: 'signed', timestamp: '2024-04-26T10:00:00', ipAddress: '192.168.1.10', details: 'Signed by James Chen (typed signature)' },
  { id: 'sae47', requestId: 'sr20', userId: 'u10', action: 'signed', timestamp: '2024-04-27T11:00:00', ipAddress: '192.168.5.10', details: 'Signed by Marcus Webb (drawn signature)' },
  { id: 'sae48', requestId: 'sr20', userId: 'u1', action: 'signed', timestamp: '2024-04-28T09:00:00', ipAddress: '10.0.0.1', details: 'Signed by Sarah Mitchell (typed signature)' },
  { id: 'sae49', requestId: 'sr20', userId: 'u1', action: 'completed', timestamp: '2024-04-28T09:00:00', details: 'All parties have signed. Document locked.' },
  { id: 'sae50', requestId: 'sr22', userId: 'u1', action: 'created', timestamp: '2026-02-14T08:00:00', details: 'Infrastructure access agreement created for Marcus Webb' },
  { id: 'sae51', requestId: 'sr22', userId: 'u1', action: 'sent', timestamp: '2026-02-14T08:01:00', details: 'Sent to Marcus Webb, Michael Brown, and Sarah Mitchell' },
  { id: 'sae52', requestId: 'sr22', userId: 'u10', action: 'signed', timestamp: '2026-02-15T10:00:00', ipAddress: '192.168.5.10', details: 'Signed by Marcus Webb (typed signature)' },
  { id: 'sae53', requestId: 'sr22', userId: 'u4', action: 'signed', timestamp: '2026-02-16T11:00:00', ipAddress: '192.168.1.30', details: 'Signed by Michael Brown (typed signature)' },
];

let esignIdCounter = 100;
function genId() { return `esign_${++esignIdCounter}`; }

// Boot: try loading from localStorage
loadEsignFromStorage();

export const esignReads = {
  getSignatureRequestsForCompany: (companyId: string) =>
    signatureRequests.filter(r => r.companyId === companyId),
  getSignatureRequest: (id: string) =>
    signatureRequests.find(r => r.id === id),
  getSignatureRequestsForUser: (userId: string) =>
    signatureRequests.filter(r => r.signers.some(s => s.userId === userId)),
  getPendingSignatures: (userId: string) =>
    signatureRequests.filter(r =>
      r.status !== 'signed' && r.status !== 'declined' && r.status !== 'expired' && r.status !== 'draft' &&
      r.signers.some(s => s.userId === userId && s.status === 'pending')
    ),
  getAuditEntriesForRequest: (requestId: string) =>
    signatureAuditEntries.filter(e => e.requestId === requestId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
};

// ─── Mutable actions ────────────────────────────────────

export const esignActions = {
  signDocument(requestId: string, signerId: string, userId: string, userName: string) {
    const req = signatureRequests.find(r => r.id === requestId);
    if (!req) return;
    const signer = req.signers.find(s => s.id === signerId);
    if (!signer || signer.status === 'signed') return;

    const now = new Date().toISOString();
    signer.status = 'signed';
    signer.signatureType = 'typed';
    signer.signedAt = now;
    signer.viewedAt = signer.viewedAt || now;
    signer.ipAddress = '192.168.1.100';

    signatureAuditEntries.push({
      id: genId(), requestId, userId, action: 'signed',
      timestamp: now, ipAddress: '192.168.1.100',
      details: `Signed by ${userName} (typed signature)`,
    });

    const allSigned = req.signers.every(s => s.status === 'signed');
    if (allSigned) {
      req.status = 'signed';
      req.completedAt = now;
      signatureAuditEntries.push({
        id: genId(), requestId, userId, action: 'completed',
        timestamp: now, details: 'All parties have signed. Document locked.',
      });
    } else {
      const anySigned = req.signers.some(s => s.status === 'signed');
      if (anySigned) req.status = 'partially_signed';
    }
    saveEsignToStorage();
  },

  sendReminder(requestId: string, userId: string, targetNames: string[]) {
    const now = new Date().toISOString();
    signatureAuditEntries.push({
      id: genId(), requestId, userId, action: 'reminder_sent',
      timestamp: now, details: `Reminder sent to ${targetNames.join(', ')}`,
    });
    saveEsignToStorage();
  },

  declineDocument(requestId: string, signerId: string, userId: string, userName: string, reason: string) {
    const req = signatureRequests.find(r => r.id === requestId);
    if (!req) return;
    const signer = req.signers.find(s => s.id === signerId);
    if (!signer) return;

    const now = new Date().toISOString();
    signer.status = 'declined';
    signer.declinedReason = reason;
    signer.viewedAt = signer.viewedAt || now;
    req.status = 'declined';

    signatureAuditEntries.push({
      id: genId(), requestId, userId, action: 'declined',
      timestamp: now, ipAddress: '192.168.1.100',
      details: `Declined by ${userName}: ${reason}`,
    });
    saveEsignToStorage();
  },

  sendDraft(requestId: string, userId: string, userName: string) {
    const req = signatureRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'draft') return;
    req.status = 'sent';
    const now = new Date().toISOString();

    signatureAuditEntries.push({
      id: genId(), requestId, userId, action: 'sent',
      timestamp: now, details: `Document sent for signing by ${userName}`,
    });
    saveEsignToStorage();
  },

  voidRequest(requestId: string, userId: string, userName: string) {
    const req = signatureRequests.find(r => r.id === requestId);
    if (!req) return;
    req.status = 'expired';
    const now = new Date().toISOString();
    signatureAuditEntries.push({
      id: genId(), requestId, userId, action: 'expired',
      timestamp: now, details: `Document voided by ${userName}`,
    });
    saveEsignToStorage();
  },

  createRequest(
    companyId: string,
    title: string,
    documentName: string,
    documentCategory: SignatureRequest['documentCategory'],
    createdBy: string,
    createdByName: string,
    signerUserIds: string[],
    sendImmediately: boolean,
  ): string {
    const now = new Date().toISOString();
    const requestId = genId();

    const signers: SignatureRequest['signers'] = signerUserIds.map((userId, idx) => ({
      id: genId(),
      userId,
      order: idx + 1,
      status: 'pending' as const,
    }));

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const request: SignatureRequest = {
      id: requestId,
      companyId,
      title,
      documentName,
      documentCategory,
      status: sendImmediately ? 'sent' : 'draft',
      createdBy,
      signers,
      createdAt: now,
      expiresAt,
    };

    signatureRequests.unshift(request);

    signatureAuditEntries.push({
      id: genId(), requestId, userId: createdBy, action: 'created',
      timestamp: now, details: `Signature request created: ${title}`,
    });

    if (sendImmediately && signerUserIds.length > 0) {
      signatureAuditEntries.push({
        id: genId(), requestId, userId: createdBy, action: 'sent',
        timestamp: now, details: `Document sent for signing by ${createdByName}`,
      });
    }

    saveEsignToStorage();
    return requestId;
  },
};

export function resetEsignData() {
  localStorage.removeItem(ESIGN_STORAGE_KEY);
}