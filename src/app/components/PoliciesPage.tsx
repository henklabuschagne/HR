import { useState, useCallback } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { additionalReads, additionalActions } from '../lib/additionalStore';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import {
  BookOpen, FileText, Shield, AlertCircle, CheckCircle2,
  Clock, Plus, ChevronRight, Users, Eye,
  Bell, Home, Pencil, Trash2, Send, Archive,
  ArrowRight, FileUp,
} from 'lucide-react';

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  handbook: { icon: <BookOpen className="w-4 h-4" />, color: 'text-brand-primary bg-brand-primary-light', label: 'Handbook' },
  security: { icon: <Shield className="w-4 h-4" />, color: 'text-brand-error bg-brand-error-light', label: 'Security' },
  leave: { icon: <Clock className="w-4 h-4" />, color: 'text-brand-warning bg-brand-warning-light', label: 'Leave' },
  conduct: { icon: <Users className="w-4 h-4" />, color: 'text-brand-success bg-brand-success-light', label: 'Conduct' },
  harassment: { icon: <AlertCircle className="w-4 h-4" />, color: 'text-brand-error bg-brand-error-light', label: 'Harassment' },
  remote_work: { icon: <Home className="w-4 h-4" />, color: 'text-brand-secondary bg-brand-secondary-light', label: 'Remote Work' },
  other: { icon: <FileText className="w-4 h-4" />, color: 'text-muted-foreground bg-muted', label: 'Other' },
};

const ackStatusColors: Record<string, string> = {
  pending: 'text-brand-warning bg-brand-warning-light',
  acknowledged: 'text-brand-success bg-brand-success-light',
  overdue: 'text-brand-error bg-brand-error-light',
  expired: 'text-muted-foreground bg-muted',
};

const categories = ['handbook', 'security', 'leave', 'conduct', 'harassment', 'remote_work', 'other'] as const;

type WizardStep = 'details' | 'content' | 'settings' | 'review';
const wizardSteps: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
  { key: 'details', label: 'Details', icon: <FileText className="w-4 h-4" /> },
  { key: 'content', label: 'Content', icon: <Pencil className="w-4 h-4" /> },
  { key: 'settings', label: 'Settings', icon: <Shield className="w-4 h-4" /> },
  { key: 'review', label: 'Review', icon: <Eye className="w-4 h-4" /> },
];

interface PolicyForm {
  title: string;
  description: string;
  category: string;
  content: string;
  requiresAcknowledgment: boolean;
  acknowledgmentDeadlineDays: number;
}

const emptyForm: PolicyForm = {
  title: '', description: '', category: 'handbook', content: '',
  requiresAcknowledgment: true, acknowledgmentDeadlineDays: 14,
};

export function PoliciesPage() {
  const { session, reads, users } = useAppStore('session', 'users', 'employmentRecords');
  const { activeCompanyId, currentUser } = session;
  const company = reads.getCompany(activeCompanyId);

  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(v => v + 1);

  const allPolicies = additionalReads.getPoliciesForCompany(activeCompanyId);
  const publishedPolicies = allPolicies.filter(p => p.status === 'published');
  const draftPolicies = allPolicies.filter(p => p.status === 'draft');
  const archivedPolicies = allPolicies.filter(p => p.status === 'archived');
  const companyAcks = additionalReads.getCompanyAcknowledgments(activeCompanyId);

  const [selectedPolicy, setSelectedPolicy] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishTargetId, setPublishTargetId] = useState<string | null>(null);

  // Wizard state
  const [wizardStep, setWizardStep] = useState<WizardStep>('details');
  const [policyForm, setPolicyForm] = useState<PolicyForm>({ ...emptyForm });

  // Edit form state
  const [editForm, setEditForm] = useState<PolicyForm>({ ...emptyForm });
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  // ─── Compliance Stats ─────────────────────────────────
  const totalAcks = companyAcks.length;
  const acknowledged = companyAcks.filter(a => a.status === 'acknowledged').length;
  const pending = companyAcks.filter(a => a.status === 'pending').length;
  const overdue = companyAcks.filter(a => a.status === 'overdue').length;
  const complianceRate = totalAcks > 0 ? Math.round((acknowledged / totalAcks) * 100) : 0;

  // ─── Policy Actions ───────────────────────────────────
  const acknowledgePolicy = useCallback((ackId: string) => {
    const ack = companyAcks.find(a => a.id === ackId);
    if (!ack || ack.status === 'acknowledged') return;
    additionalActions.acknowledgePolicy(ack.policyId, ack.userId, activeCompanyId);
    refresh();
    const pol = allPolicies.find(p => p.id === ack.policyId);
    toast.success(`Policy "${pol?.title || 'Unknown'}" acknowledged successfully`);
  }, [allPolicies, companyAcks, activeCompanyId]);

  const sendReminder = useCallback((ackId: string) => {
    refresh();
    const ack = companyAcks.find(a => a.id === ackId);
    const user = ack ? reads.getUser(ack.userId) : null;
    toast.success(`Reminder sent to ${user?.firstName} ${user?.lastName}`);
  }, [reads, companyAcks]);

  // ─── Create Policy (as Draft) ─────────────────────────
  const handleCreateDraft = () => {
    if (!policyForm.title || !policyForm.content) {
      toast.error('Title and content are required'); return;
    }
    additionalActions.addPolicy({
      companyId: activeCompanyId,
      title: policyForm.title,
      description: policyForm.description,
      category: policyForm.category as any,
      version: 1,
      status: 'draft',
      content: policyForm.content,
      requiresAcknowledgment: policyForm.requiresAcknowledgment,
      acknowledgmentDeadlineDays: policyForm.acknowledgmentDeadlineDays,
      updatedBy: currentUser.id,
    });
    toast.success(`Draft policy "${policyForm.title}" created`);
    setShowCreateDialog(false);
    setPolicyForm({ ...emptyForm });
    setWizardStep('details');
    refresh();
  };

  // ─── Create & Publish Immediately ─────────────────────
  const handleCreateAndPublish = () => {
    if (!policyForm.title || !policyForm.content) {
      toast.error('Title and content are required'); return;
    }
    const pol = additionalActions.addPolicy({
      companyId: activeCompanyId,
      title: policyForm.title,
      description: policyForm.description,
      category: policyForm.category as any,
      version: 1,
      status: 'published',
      content: policyForm.content,
      requiresAcknowledgment: policyForm.requiresAcknowledgment,
      acknowledgmentDeadlineDays: policyForm.acknowledgmentDeadlineDays,
      publishedAt: new Date().toISOString().split('T')[0],
      updatedBy: currentUser.id,
    });
    // Create acknowledgment records for all company employees
    if (policyForm.requiresAcknowledgment) {
      createAcksForPolicy(pol.id, policyForm.acknowledgmentDeadlineDays);
    }
    toast.success(`Policy "${policyForm.title}" published and acknowledgment requests sent`);
    setShowCreateDialog(false);
    setPolicyForm({ ...emptyForm });
    setWizardStep('details');
    refresh();
  };

  // ─── Publish Existing Draft ───────────────────────────
  const handlePublishDraft = (policyId: string) => {
    setPublishTargetId(policyId);
    setShowPublishConfirm(true);
  };

  const confirmPublish = () => {
    if (!publishTargetId) return;
    const pol = allPolicies.find(p => p.id === publishTargetId);
    if (!pol) return;
    additionalActions.updatePolicy(publishTargetId, {
      status: 'published',
      publishedAt: new Date().toISOString().split('T')[0],
      updatedBy: currentUser.id,
    });
    if (pol.requiresAcknowledgment) {
      createAcksForPolicy(publishTargetId, pol.acknowledgmentDeadlineDays);
    }
    toast.success(`"${pol.title}" published successfully`);
    setShowPublishConfirm(false);
    setPublishTargetId(null);
    setSelectedPolicy(null);
    refresh();
  };

  // ─── Archive ──────────────────────────────────────────
  const handleArchive = (policyId: string) => {
    const pol = allPolicies.find(p => p.id === policyId);
    additionalActions.updatePolicy(policyId, { status: 'archived' });
    toast.success(`"${pol?.title}" archived`);
    setSelectedPolicy(null);
    refresh();
  };

  // ─── Delete ───────────────────────────────────────────
  const handleDelete = (policyId: string) => {
    const pol = allPolicies.find(p => p.id === policyId);
    additionalActions.deletePolicy(policyId);
    toast.success(`"${pol?.title}" deleted`);
    setSelectedPolicy(null);
    refresh();
  };

  // ─── Edit ─────────────────────────────────────────────
  const openEdit = (policyId: string) => {
    const pol = allPolicies.find(p => p.id === policyId);
    if (!pol) return;
    setEditForm({
      title: pol.title,
      description: pol.description,
      category: pol.category,
      content: pol.content,
      requiresAcknowledgment: pol.requiresAcknowledgment,
      acknowledgmentDeadlineDays: pol.acknowledgmentDeadlineDays,
    });
    setEditingPolicyId(policyId);
    setShowEditDialog(true);
    setSelectedPolicy(null);
  };

  const handleSaveEdit = () => {
    if (!editingPolicyId || !editForm.title || !editForm.content) {
      toast.error('Title and content are required'); return;
    }
    const pol = allPolicies.find(p => p.id === editingPolicyId);
    additionalActions.updatePolicy(editingPolicyId, {
      title: editForm.title,
      description: editForm.description,
      category: editForm.category as any,
      content: editForm.content,
      requiresAcknowledgment: editForm.requiresAcknowledgment,
      acknowledgmentDeadlineDays: editForm.acknowledgmentDeadlineDays,
      version: (pol?.version || 0) + 1,
      updatedBy: currentUser.id,
    });
    toast.success(`"${editForm.title}" updated to v${(pol?.version || 0) + 1}`);
    setShowEditDialog(false);
    setEditingPolicyId(null);
    refresh();
  };

  // ─── Helper: Create Acks for All Company Employees ────
  const createAcksForPolicy = (policyId: string, deadlineDays: number) => {
    const companyEmployees = reads.getCompanyEmployees(activeCompanyId);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + deadlineDays);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    companyEmployees.forEach(er => {
      additionalActions.addPendingAcknowledgment(policyId, er.userId, activeCompanyId, dueDateStr);
    });
  };

  const policy = selectedPolicy ? allPolicies.find(p => p.id === selectedPolicy) : null;
  const policyAcks = selectedPolicy ? additionalReads.getPolicyAcknowledgments(selectedPolicy) : [];
  const publishTarget = publishTargetId ? allPolicies.find(p => p.id === publishTargetId) : null;

  // Company employees for ack count
  const companyEmployeeCount = reads.getCompanyEmployees(activeCompanyId).length;

  // ─── Wizard Navigation ────────────────────────────────
  const currentStepIdx = wizardSteps.findIndex(s => s.key === wizardStep);
  const canNext = () => {
    if (wizardStep === 'details') return !!policyForm.title && !!policyForm.description;
    if (wizardStep === 'content') return !!policyForm.content;
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Policy Library</h1>
          <p className="text-muted-foreground">Manage and track policy acknowledgments for {company?.name}</p>
        </div>
        <Button onClick={() => { setPolicyForm({ ...emptyForm }); setWizardStep('details'); setShowCreateDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          New Policy
        </Button>
      </div>

      {/* Compliance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-primary-light rounded-lg"><BookOpen className="w-5 h-5 text-brand-primary" /></div><div><p className="text-xs text-muted-foreground">Published</p><p className="text-xl">{publishedPolicies.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-success-light rounded-lg"><CheckCircle2 className="w-5 h-5 text-brand-success" /></div><div><p className="text-xs text-muted-foreground">Acknowledged</p><p className="text-xl">{acknowledged}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-warning-light rounded-lg"><Clock className="w-5 h-5 text-brand-warning" /></div><div><p className="text-xs text-muted-foreground">Pending</p><p className="text-xl">{pending}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-error-light rounded-lg"><AlertCircle className="w-5 h-5 text-brand-error" /></div><div><p className="text-xs text-muted-foreground">Overdue</p><p className="text-xl">{overdue}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-secondary-light rounded-lg"><Eye className="w-5 h-5 text-brand-secondary" /></div><div><p className="text-xs text-muted-foreground">Compliance</p><p className="text-xl">{complianceRate}%</p></div></CardContent></Card>
      </div>

      <Tabs defaultValue="published">
        <TabsList>
          <TabsTrigger value="published">Published ({publishedPolicies.length})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({draftPolicies.length})</TabsTrigger>
          <TabsTrigger value="archived">Archived ({archivedPolicies.length})</TabsTrigger>
          <TabsTrigger value="compliance">Compliance Tracker</TabsTrigger>
        </TabsList>

        {/* Published Policies */}
        <TabsContent value="published" className="mt-4 space-y-4">
          {publishedPolicies.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" /><p className="text-sm">No published policies yet</p><p className="text-xs mt-1">Create a new policy and publish it to get started.</p></CardContent></Card>
          ) : publishedPolicies.map(pol => {
            const cat = categoryConfig[pol.category] || categoryConfig.other;
            const polAcks = additionalReads.getPolicyAcknowledgments(pol.id);
            const acked = polAcks.filter(a => a.status === 'acknowledged').length;
            const total = polAcks.length;
            return (
              <Card key={pol.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedPolicy(pol.id)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${cat.color}`}>{cat.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3>{pol.title}</h3>
                          <Badge variant="outline" className="text-xs">v{pol.version}</Badge>
                          {pol.requiresAcknowledgment && (
                            <Badge variant="outline" className="text-xs text-brand-warning bg-brand-warning-light border-0">
                              <Bell className="w-3 h-3 mr-1" /> Requires Ack
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{pol.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="capitalize">{pol.category.replace(/_/g, ' ')}</span>
                          {pol.publishedAt && <span>Published {new Date(pol.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                          {total > 0 && <span className="text-brand-primary">{acked}/{total} acknowledged</span>}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                  {total > 0 && (
                    <div className="mt-3">
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full bg-brand-success transition-all" style={{ width: `${Math.round((acked / total) * 100)}%` }} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Draft Policies */}
        <TabsContent value="drafts" className="mt-4 space-y-4">
          {draftPolicies.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-3 opacity-50" /><p className="text-sm">No draft policies</p><p className="text-xs mt-1">Click "New Policy" to create a draft.</p></CardContent></Card>
          ) : draftPolicies.map(pol => {
            const cat = categoryConfig[pol.category] || categoryConfig.other;
            return (
              <Card key={pol.id} className="hover:shadow-md transition-shadow border-dashed">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => setSelectedPolicy(pol.id)}>
                      <div className={`p-3 rounded-lg ${cat.color} opacity-60`}>{cat.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-muted-foreground">{pol.title}</h3>
                          <Badge variant="outline" className="text-xs">Draft v{pol.version}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{pol.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">Created {new Date(pol.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => openEdit(pol.id)}>
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                      <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => handlePublishDraft(pol.id)}>
                        <Send className="w-3 h-3" /> Publish
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2 text-brand-error" onClick={() => handleDelete(pol.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Archived Policies */}
        <TabsContent value="archived" className="mt-4 space-y-4">
          {archivedPolicies.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Archive className="w-10 h-10 mx-auto mb-3 opacity-50" /><p className="text-sm">No archived policies</p></CardContent></Card>
          ) : archivedPolicies.map(pol => {
            const cat = categoryConfig[pol.category] || categoryConfig.other;
            return (
              <Card key={pol.id} className="opacity-60">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg ${cat.color} opacity-40`}>{cat.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3>{pol.title}</h3>
                          <Badge variant="outline" className="text-xs">v{pol.version}</Badge>
                          <Badge variant="outline" className="text-xs text-muted-foreground">Archived</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{pol.description}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-8 px-2 text-brand-error" onClick={() => handleDelete(pol.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Compliance Tracker */}
        <TabsContent value="compliance" className="mt-4 space-y-4">
          {publishedPolicies.filter(p => p.requiresAcknowledgment).map(pol => {
            const polAcks = additionalReads.getPolicyAcknowledgments(pol.id);
            if (polAcks.length === 0) return null;
            return (
              <Card key={pol.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{pol.title}</CardTitle>
                    <Badge variant="outline" className="text-xs">Deadline: {pol.acknowledgmentDeadlineDays} days</Badge>
                  </div>
                  <CardDescription>v{pol.version} - Published {pol.publishedAt ? new Date(pol.publishedAt).toLocaleDateString() : 'N/A'}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {polAcks.map(ack => {
                      const user = reads.getUser(ack.userId);
                      return (
                        <div key={ack.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-primary-light text-brand-primary text-xs flex items-center justify-center">
                              {user?.firstName[0]}{user?.lastName[0]}
                            </div>
                            <div>
                              <p className="text-sm">{user?.firstName} {user?.lastName}</p>
                              <p className="text-xs text-muted-foreground">Due: {new Date(ack.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {ack.remindersSent > 0 && <span className="text-xs text-muted-foreground">{ack.remindersSent} reminder(s)</span>}
                            <Badge variant="outline" className={`text-xs border-0 ${ackStatusColors[ack.status]}`}>
                              {ack.status === 'acknowledged' ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Acknowledged</> :
                               ack.status === 'overdue' ? <><AlertCircle className="w-3 h-3 mr-1" /> Overdue</> :
                               <><Clock className="w-3 h-3 mr-1" /> Pending</>}
                            </Badge>
                            {ack.acknowledgedAt && <span className="text-xs text-brand-success">{new Date(ack.acknowledgedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                            {ack.status !== 'acknowledged' && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => sendReminder(ack.id)}><Bell className="w-3 h-3 mr-1" /> Remind</Button>
                                <Button size="sm" className="h-6 px-2 text-xs" onClick={() => acknowledgePolicy(ack.id)}><CheckCircle2 className="w-3 h-3 mr-1" /> Ack</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* ─── Policy Detail Dialog ──────────────────────── */}
      <Dialog open={!!selectedPolicy} onOpenChange={() => setSelectedPolicy(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          {policy && (() => {
            const cat = categoryConfig[policy.category] || categoryConfig.other;
            const updater = reads.getUser(policy.updatedBy);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${cat.color}`}>{cat.icon}</div>
                    {policy.title}
                  </DialogTitle>
                  <DialogDescription>{policy.description}</DialogDescription>
                </DialogHeader>
                <div className="flex items-center gap-2 mt-2">
                  <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => openEdit(policy.id)}>
                    <Pencil className="w-3 h-3" /> Edit
                  </Button>
                  {policy.status === 'draft' && (
                    <Button size="sm" className="h-8 gap-1 text-xs" onClick={() => handlePublishDraft(policy.id)}>
                      <Send className="w-3 h-3" /> Publish
                    </Button>
                  )}
                  {policy.status === 'published' && (
                    <Button size="sm" variant="outline" className="h-8 gap-1 text-xs" onClick={() => handleArchive(policy.id)}>
                      <Archive className="w-3 h-3" /> Archive
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="h-8 gap-1 text-xs text-brand-error" onClick={() => handleDelete(policy.id)}>
                    <Trash2 className="w-3 h-3" /> Delete
                  </Button>
                </div>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Version</p><p className="text-sm">{policy.version}</p></div>
                    <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Category</p><p className="text-sm capitalize">{policy.category.replace(/_/g, ' ')}</p></div>
                    <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Status</p><p className="text-sm capitalize">{policy.status}</p></div>
                    <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Updated By</p><p className="text-sm">{updater?.firstName} {updater?.lastName}</p></div>
                  </div>
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-xs text-muted-foreground mb-2">Policy Content</p>
                    <p className="text-sm whitespace-pre-wrap">{policy.content}</p>
                  </div>
                  {policy.requiresAcknowledgment && policyAcks.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Acknowledgment Status ({policyAcks.filter(a => a.status === 'acknowledged').length}/{policyAcks.length})</p>
                      <div className="space-y-1">
                        {policyAcks.map(ack => {
                          const user = reads.getUser(ack.userId);
                          return (
                            <div key={ack.id} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                              <span>{user?.firstName} {user?.lastName}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-xs border-0 ${ackStatusColors[ack.status]}`}>{ack.status}</Badge>
                                {ack.status !== 'acknowledged' && (
                                  <Button size="sm" className="h-6 px-2 text-xs" onClick={() => acknowledgePolicy(ack.id)}>Acknowledge</Button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ─── Create Policy Wizard ──────────────────────── */}
      <Dialog open={showCreateDialog} onOpenChange={v => { setShowCreateDialog(v); if (!v) { setWizardStep('details'); setPolicyForm({ ...emptyForm }); } }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileUp className="w-5 h-5 text-brand-primary" />
              Create New Policy
            </DialogTitle>
            <DialogDescription>Step through the wizard to define your policy.</DialogDescription>
          </DialogHeader>

          {/* Wizard Steps */}
          <div className="flex items-center gap-1 mt-2 mb-4">
            {wizardSteps.map((step, i) => {
              const isActive = step.key === wizardStep;
              const isPast = i < currentStepIdx;
              return (
                <div key={step.key} className="flex items-center">
                  <button
                    onClick={() => { if (isPast) setWizardStep(step.key); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors ${
                      isActive ? 'bg-brand-primary text-white' :
                      isPast ? 'bg-brand-primary-light text-brand-primary cursor-pointer hover:bg-brand-primary/20' :
                      'bg-muted text-muted-foreground'
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-3.5 h-3.5" /> : step.icon}
                    {step.label}
                  </button>
                  {i < wizardSteps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground mx-1" />}
                </div>
              );
            })}
          </div>

          {/* Step 1: Details */}
          {wizardStep === 'details' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Policy Title *</Label>
                <Input value={policyForm.title} onChange={e => setPolicyForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., Travel Expense Policy" />
              </div>
              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea value={policyForm.description} onChange={e => setPolicyForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief summary of the policy's purpose..." rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={policyForm.category} onValueChange={v => setPolicyForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => {
                      const cfg = categoryConfig[c];
                      return <SelectItem key={c} value={c}><div className="flex items-center gap-2">{cfg.icon}<span>{cfg.label}</span></div></SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Content */}
          {wizardStep === 'content' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Policy Content *</Label>
                <p className="text-xs text-muted-foreground">Write the full text of your policy. This will be displayed to employees.</p>
                <Textarea
                  value={policyForm.content}
                  onChange={e => setPolicyForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Enter the full policy text here..."
                  rows={12}
                  className="font-mono text-sm"
                />
              </div>
              <div className="p-3 bg-muted/50 rounded-lg border text-xs text-muted-foreground">
                <p>Content length: {policyForm.content.length} characters</p>
              </div>
            </div>
          )}

          {/* Step 3: Settings */}
          {wizardStep === 'settings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm">Require Acknowledgment</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Employees must confirm they've read and understood this policy</p>
                </div>
                <Switch
                  checked={policyForm.requiresAcknowledgment}
                  onCheckedChange={v => setPolicyForm(f => ({ ...f, requiresAcknowledgment: v }))}
                />
              </div>
              {policyForm.requiresAcknowledgment && (
                <div className="space-y-2">
                  <Label>Acknowledgment Deadline (days)</Label>
                  <p className="text-xs text-muted-foreground">Number of days employees have to acknowledge after publishing</p>
                  <div className="flex items-center gap-3">
                    {[7, 14, 30, 60].map(d => (
                      <Button
                        key={d}
                        size="sm"
                        variant={policyForm.acknowledgmentDeadlineDays === d ? 'default' : 'outline'}
                        className="h-8"
                        onClick={() => setPolicyForm(f => ({ ...f, acknowledgmentDeadlineDays: d }))}
                      >
                        {d} days
                      </Button>
                    ))}
                    <Input
                      type="number"
                      className="w-20 h-8"
                      value={policyForm.acknowledgmentDeadlineDays}
                      onChange={e => setPolicyForm(f => ({ ...f, acknowledgmentDeadlineDays: parseInt(e.target.value) || 14 }))}
                      min={1}
                    />
                  </div>
                </div>
              )}
              {policyForm.requiresAcknowledgment && (
                <div className="p-3 bg-brand-primary-light/50 rounded-lg border border-brand-primary/20">
                  <p className="text-xs text-brand-primary flex items-center gap-1"><Users className="w-3 h-3" /> {companyEmployeeCount} employees will receive acknowledgment requests upon publishing.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {wizardStep === 'review' && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${(categoryConfig[policyForm.category] || categoryConfig.other).color}`}>
                    {(categoryConfig[policyForm.category] || categoryConfig.other).icon}
                  </div>
                  <div>
                    <h4>{policyForm.title || 'Untitled Policy'}</h4>
                    <p className="text-xs text-muted-foreground capitalize">{policyForm.category.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{policyForm.description}</p>
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-1">Content Preview</p>
                  <p className="text-sm whitespace-pre-wrap line-clamp-4">{policyForm.content}</p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Acknowledgment</p>
                    <p className="text-sm">{policyForm.requiresAcknowledgment ? 'Required' : 'Not Required'}</p>
                  </div>
                  {policyForm.requiresAcknowledgment && (
                    <div className="p-2 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="text-sm">{policyForm.acknowledgmentDeadlineDays} days</p>
                    </div>
                  )}
                  <div className="p-2 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Employees</p>
                    <p className="text-sm">{companyEmployeeCount}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex !justify-between mt-4">
            <div>
              {currentStepIdx > 0 && (
                <Button variant="outline" onClick={() => setWizardStep(wizardSteps[currentStepIdx - 1].key)}>
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
              {wizardStep === 'review' ? (
                <>
                  <Button variant="outline" onClick={handleCreateDraft} className="gap-1">
                    <FileText className="w-3.5 h-3.5" /> Save as Draft
                  </Button>
                  <Button onClick={handleCreateAndPublish} className="gap-1">
                    <Send className="w-3.5 h-3.5" /> Publish Now
                  </Button>
                </>
              ) : (
                <Button onClick={() => setWizardStep(wizardSteps[currentStepIdx + 1].key)} disabled={!canNext()} className="gap-1">
                  Next <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Edit Policy Dialog ────────────────────────── */}
      <Dialog open={showEditDialog} onOpenChange={v => { setShowEditDialog(v); if (!v) setEditingPolicyId(null); }}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Policy</DialogTitle>
            <DialogDescription>Update the policy details. A new version will be created.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={editForm.category} onValueChange={v => setEditForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => {
                    const cfg = categoryConfig[c];
                    return <SelectItem key={c} value={c}><div className="flex items-center gap-2">{cfg.icon}<span>{cfg.label}</span></div></SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content *</Label>
              <Textarea value={editForm.content} onChange={e => setEditForm(f => ({ ...f, content: e.target.value }))} rows={8} className="font-mono text-sm" />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div><p className="text-sm">Require Acknowledgment</p></div>
              <Switch checked={editForm.requiresAcknowledgment} onCheckedChange={v => setEditForm(f => ({ ...f, requiresAcknowledgment: v }))} />
            </div>
            {editForm.requiresAcknowledgment && (
              <div className="space-y-2">
                <Label>Acknowledgment Deadline (days)</Label>
                <Input type="number" value={editForm.acknowledgmentDeadlineDays} onChange={e => setEditForm(f => ({ ...f, acknowledgmentDeadlineDays: parseInt(e.target.value) || 14 }))} className="w-32" min={1} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Publish Confirmation Dialog ───────────────── */}
      <Dialog open={showPublishConfirm} onOpenChange={v => { setShowPublishConfirm(v); if (!v) setPublishTargetId(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-brand-primary" />
              Publish Policy
            </DialogTitle>
            <DialogDescription>Are you sure you want to publish this policy?</DialogDescription>
          </DialogHeader>
          {publishTarget && (
            <div className="py-4 space-y-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${(categoryConfig[publishTarget.category] || categoryConfig.other).color}`}>
                    {(categoryConfig[publishTarget.category] || categoryConfig.other).icon}
                  </div>
                  <div>
                    <h4>{publishTarget.title}</h4>
                    <p className="text-xs text-muted-foreground">v{publishTarget.version} - {publishTarget.category.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              </div>
              {publishTarget.requiresAcknowledgment && (
                <div className="p-3 bg-brand-warning-light rounded-lg border border-brand-warning/20">
                  <p className="text-xs text-brand-warning flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    This will send acknowledgment requests to all {companyEmployeeCount} employees with a {publishTarget.acknowledgmentDeadlineDays}-day deadline.
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Once published, the policy will be visible to all employees. You can archive it later if needed.</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishConfirm(false)}>Cancel</Button>
            <Button onClick={confirmPublish} className="gap-1"><Send className="w-3.5 h-3.5" /> Confirm Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}