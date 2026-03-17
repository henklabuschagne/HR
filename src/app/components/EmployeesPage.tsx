import { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { additionalReads } from '../lib/additionalStore';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  Search, Users, UserPlus, Building2, Briefcase,
  Calendar, ChevronRight, Filter, Star, Target, BookOpen,
  CheckCircle2, Pencil, Trash2, X, Check, UserMinus,
  ArrowRightLeft, ClipboardList,
} from 'lucide-react';

// ─── Inline Editable Field ────────────────────────────────
function InlineField({
  label, value, onSave, type = 'text', options,
}: {
  label: string;
  value: string;
  onSave: (newVal: string) => void;
  type?: 'text' | 'select';
  options?: { value: string; label: string }[];
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing && inputRef.current) inputRef.current.focus(); }, [editing]);

  const commit = () => {
    if (draft.trim() && draft !== value) {
      onSave(draft.trim());
      toast.success(`${label} updated`);
    }
    setEditing(false);
  };

  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    if (type === 'select' && options) {
      return (
        <div className="p-3 bg-brand-primary-light/30 rounded-lg border border-brand-primary/30">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <Select value={draft} onValueChange={v => { setDraft(v); onSave(v); toast.success(`${label} updated`); setEditing(false); }}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex gap-1 mt-1 justify-end">
            <Button size="sm" variant="ghost" className="h-6 px-1.5" onClick={cancel}><X className="w-3 h-3" /></Button>
          </div>
        </div>
      );
    }
    return (
      <div className="p-3 bg-brand-primary-light/30 rounded-lg border border-brand-primary/30">
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
            className="h-7 text-sm"
          />
          <Button size="sm" variant="ghost" className="h-7 px-1.5 text-brand-success shrink-0" onClick={commit}><Check className="w-3 h-3" /></Button>
          <Button size="sm" variant="ghost" className="h-7 px-1.5 text-brand-error shrink-0" onClick={cancel}><X className="w-3 h-3" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="p-3 bg-muted rounded-lg group cursor-pointer hover:bg-muted/80 transition-colors relative"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm capitalize">{value || <span className="italic text-muted-foreground">Not set</span>}</p>
      <Pencil className="w-3 h-3 text-muted-foreground absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// ─── Bulk Action Bar ──────────────────────────────────────
function BulkActionBar({
  count,
  onClear,
  onBulkAssignModel,
  onBulkChangeDept,
  onBulkDeactivate,
}: {
  count: number;
  onClear: () => void;
  onBulkAssignModel: () => void;
  onBulkChangeDept: () => void;
  onBulkDeactivate: () => void;
}) {
  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 bg-brand-primary text-white px-5 py-3 rounded-xl shadow-lg animate-in slide-in-from-top-2 duration-200">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-5 h-5" />
        <span className="text-sm">{count} employee{count > 1 ? 's' : ''} selected</span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs" onClick={onBulkAssignModel}>
          <ArrowRightLeft className="w-3.5 h-3.5" /> Assign Leave Model
        </Button>
        <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs" onClick={onBulkChangeDept}>
          <Building2 className="w-3.5 h-3.5" /> Change Department
        </Button>
        <Button size="sm" variant="secondary" className="h-8 gap-1.5 text-xs bg-white/10 hover:bg-white/20 text-white border-0" onClick={onBulkDeactivate}>
          <UserMinus className="w-3.5 h-3.5" /> Deactivate
        </Button>
        <Button size="sm" variant="ghost" className="h-8 px-2 text-white/80 hover:text-white hover:bg-white/10" onClick={onClear}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export function EmployeesPage() {
  const { session, employmentRecords, users, reads, actions } = useAppStore('session', 'employmentRecords', 'users', 'leaveBalances', 'leaveModels');
  const { activeCompanyId, currentUser } = session;

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkModelDialog, setShowBulkModelDialog] = useState(false);
  const [showBulkDeptDialog, setShowBulkDeptDialog] = useState(false);
  const [bulkLeaveModel, setBulkLeaveModel] = useState('');
  const [bulkDepartment, setBulkDepartment] = useState('');

  // Add form state
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', department: '', team: '',
    jobTitle: '', location: '', employmentType: 'full-time' as string,
    leaveModelId: '', managerId: '',
  });

  const companyERs = reads.getCompanyEmployees(activeCompanyId);
  const departments = reads.getDepartmentsForCompany(activeCompanyId);
  const companyLeaveModels = reads.getLeaveModelsForCompany(activeCompanyId);

  const filteredERs = companyERs.filter(er => {
    const user = reads.getUser(er.userId);
    if (!user) return false;
    const matchesSearch = !search || `${user.firstName} ${user.lastName} ${user.email} ${er.jobTitle}`.toLowerCase().includes(search.toLowerCase());
    const matchesDept = deptFilter === 'all' || er.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const selectedER = selectedEmployee ? reads.getEmploymentRecord(selectedEmployee) : null;
  const selectedUser = selectedER ? reads.getUser(selectedER.userId) : null;
  const selectedBalances = selectedER ? reads.getUserLeaveBalances(selectedER.id) : [];
  const selectedReviews = selectedUser ? additionalReads.getReviewsForUser(selectedUser.id) : [];
  const selectedGoals = selectedUser ? additionalReads.getGoalsForUser(selectedUser.id) : [];
  const selectedPolicyAcks = selectedUser ? additionalReads.getUserAcknowledgments(selectedUser.id) : [];

  const ratingLabels: Record<number, string> = { 1: 'Needs Improvement', 2: 'Developing', 3: 'Meets Expectations', 4: 'Exceeds Expectations', 5: 'Exceptional' };

  // ─── Inline Save Handlers ─────────────────────────────
  const saveUserField = useCallback((field: string, value: string) => {
    if (!selectedUser) return;
    actions.updateUser(selectedUser.id, { [field]: value });
  }, [selectedUser, actions]);

  const saveERField = useCallback((field: string, value: string) => {
    if (!selectedER) return;
    actions.updateEmploymentRecord(selectedER.id, { [field]: value });
  }, [selectedER, actions]);

  // ─── Add Employee ─────────────────────────────────────
  const handleAdd = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.department || !formData.jobTitle) {
      toast.error('Please fill in all required fields'); return;
    }
    const user = actions.addUser({ firstName: formData.firstName, lastName: formData.lastName, email: formData.email, role: 'user', isActive: true });
    actions.addEmploymentRecord({
      userId: user.id, companyId: activeCompanyId, department: formData.department, team: formData.team,
      jobTitle: formData.jobTitle, managerId: formData.managerId || undefined, employmentType: formData.employmentType as any,
      startDate: new Date().toISOString().split('T')[0], isOnProbation: true,
      leaveModelId: formData.leaveModelId || companyLeaveModels[0]?.id || '', location: formData.location, isActive: true,
    });
    toast.success(`${formData.firstName} ${formData.lastName} added successfully`);
    setShowAddDialog(false);
    resetForm();
  };

  const handleDeactivate = (erId: string) => {
    actions.updateEmploymentRecord(erId, { isActive: false });
    toast.success('Employee deactivated');
    setSelectedEmployee(null);
  };

  const resetForm = () => setFormData({ firstName: '', lastName: '', email: '', department: '', team: '', jobTitle: '', location: '', employmentType: 'full-time', leaveModelId: '', managerId: '' });

  // ─── Bulk Selection ────────────────────────────────────
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredERs.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredERs.map(er => er.id)));
    }
  };

  // ─── Bulk Actions ──────────────────────────────────────
  const handleBulkAssignModel = () => {
    if (!bulkLeaveModel) { toast.error('Please select a leave model'); return; }
    let count = 0;
    selectedIds.forEach(id => {
      actions.updateEmploymentRecord(id, { leaveModelId: bulkLeaveModel });
      count++;
    });
    const model = reads.getLeaveModel(bulkLeaveModel);
    toast.success(`Leave model "${model?.name}" assigned to ${count} employee${count > 1 ? 's' : ''}`);
    setSelectedIds(new Set());
    setShowBulkModelDialog(false);
    setBulkLeaveModel('');
  };

  const handleBulkChangeDept = () => {
    if (!bulkDepartment) { toast.error('Please select a department'); return; }
    let count = 0;
    selectedIds.forEach(id => {
      actions.updateEmploymentRecord(id, { department: bulkDepartment });
      count++;
    });
    toast.success(`${count} employee${count > 1 ? 's' : ''} moved to ${bulkDepartment}`);
    setSelectedIds(new Set());
    setShowBulkDeptDialog(false);
    setBulkDepartment('');
  };

  const handleBulkDeactivate = () => {
    let count = 0;
    selectedIds.forEach(id => {
      actions.updateEmploymentRecord(id, { isActive: false });
      count++;
    });
    toast.success(`${count} employee${count > 1 ? 's' : ''} deactivated`);
    setSelectedIds(new Set());
  };

  const managerOptions = users.filter(u => u.isActive).map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }));
  const leaveModelOptions = companyLeaveModels.map(lm => ({ value: lm.id, label: lm.name }));
  const empTypeOptions = ['full-time', 'part-time', 'contractor', 'intern'].map(t => ({ value: t, label: t }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Employee Directory</h1>
          <p className="text-muted-foreground">{companyERs.length} employees in {reads.getCompany(activeCompanyId)?.name}</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-primary-light rounded-lg"><Users className="w-5 h-5 text-brand-primary" /></div><div><p className="text-xs text-muted-foreground">Total</p><p className="text-xl">{companyERs.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-success-light rounded-lg"><Briefcase className="w-5 h-5 text-brand-success" /></div><div><p className="text-xs text-muted-foreground">Full-time</p><p className="text-xl">{companyERs.filter(er => er.employmentType === 'full-time').length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-warning-light rounded-lg"><Building2 className="w-5 h-5 text-brand-warning" /></div><div><p className="text-xs text-muted-foreground">Departments</p><p className="text-xl">{departments.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-error-light rounded-lg"><Calendar className="w-5 h-5 text-brand-error" /></div><div><p className="text-xs text-muted-foreground">On Probation</p><p className="text-xl">{companyERs.filter(er => er.isOnProbation).length}</p></div></CardContent></Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-48"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <BulkActionBar
          count={selectedIds.size}
          onClear={() => setSelectedIds(new Set())}
          onBulkAssignModel={() => setShowBulkModelDialog(true)}
          onBulkChangeDept={() => setShowBulkDeptDialog(true)}
          onBulkDeactivate={handleBulkDeactivate}
        />
      )}

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 pl-4">
                  <Checkbox
                    checked={filteredERs.length > 0 && selectedIds.size === filteredERs.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredERs.map(er => {
                const user = reads.getUser(er.userId);
                if (!user) return null;
                const isChecked = selectedIds.has(er.id);
                return (
                  <TableRow key={er.id} className={`cursor-pointer ${isChecked ? 'bg-brand-primary-light/40' : ''}`}>
                    <TableCell className="pl-4" onClick={e => e.stopPropagation()}>
                      <Checkbox checked={isChecked} onCheckedChange={() => toggleSelect(er.id)} />
                    </TableCell>
                    <TableCell onClick={() => setSelectedEmployee(er.id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center text-xs">{user.firstName[0]}{user.lastName[0]}</div>
                        <div><p className="text-sm">{user.firstName} {user.lastName}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm" onClick={() => setSelectedEmployee(er.id)}>{er.department}</TableCell>
                    <TableCell className="text-sm" onClick={() => setSelectedEmployee(er.id)}>{er.jobTitle}</TableCell>
                    <TableCell className="text-sm" onClick={() => setSelectedEmployee(er.id)}>{er.location}</TableCell>
                    <TableCell onClick={() => setSelectedEmployee(er.id)}><Badge variant="outline" className="text-xs capitalize">{er.employmentType}</Badge></TableCell>
                    <TableCell onClick={() => setSelectedEmployee(er.id)}>
                      {er.isOnProbation ? (
                        <Badge variant="outline" className="text-xs text-brand-warning bg-brand-warning-light border-0">Probation</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs text-brand-success bg-brand-success-light border-0">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell onClick={() => setSelectedEmployee(er.id)}><ChevronRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee Detail with Inline Editing */}
      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
          {selectedUser && selectedER && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white">{selectedUser.firstName[0]}{selectedUser.lastName[0]}</div>
                  <div><p>{selectedUser.firstName} {selectedUser.lastName}</p><p className="text-sm text-muted-foreground">{selectedER.jobTitle}</p></div>
                </DialogTitle>
                <div className="flex items-center gap-2 pt-2">
                  <Badge variant="outline" className="text-xs capitalize">{selectedER.employmentType}</Badge>
                  {selectedER.isOnProbation && <Badge variant="outline" className="text-xs text-brand-warning bg-brand-warning-light border-0">Probation</Badge>}
                  <div className="flex-1" />
                  <Button size="sm" variant="outline" className="text-brand-error gap-1" onClick={() => handleDeactivate(selectedER.id)}>
                    <Trash2 className="w-3 h-3" /> Deactivate
                  </Button>
                </div>
              </DialogHeader>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><Pencil className="w-3 h-3" /> Click any field to edit inline</p>
              <Tabs defaultValue="details" className="mt-2">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="leave">Leave</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="policies">Policies</TabsTrigger>
                </TabsList>

                {/* ─── Details Tab with Inline Editing ─── */}
                <TabsContent value="details" className="mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InlineField label="First Name" value={selectedUser.firstName} onSave={v => saveUserField('firstName', v)} />
                    <InlineField label="Last Name" value={selectedUser.lastName} onSave={v => saveUserField('lastName', v)} />
                    <InlineField label="Email" value={selectedUser.email} onSave={v => saveUserField('email', v)} />
                    <InlineField label="Department" value={selectedER.department} onSave={v => saveERField('department', v)} />
                    <InlineField label="Team" value={selectedER.team} onSave={v => saveERField('team', v)} />
                    <InlineField label="Job Title" value={selectedER.jobTitle} onSave={v => saveERField('jobTitle', v)} />
                    <InlineField label="Location" value={selectedER.location} onSave={v => saveERField('location', v)} />
                    <InlineField
                      label="Employment Type" value={selectedER.employmentType}
                      onSave={v => saveERField('employmentType', v)}
                      type="select" options={empTypeOptions}
                    />
                    <InlineField
                      label="Manager"
                      value={selectedER.managerId || ''}
                      onSave={v => saveERField('managerId', v)}
                      type="select"
                      options={[{ value: '', label: 'None' }, ...managerOptions]}
                    />
                    <InlineField
                      label="Leave Model"
                      value={selectedER.leaveModelId}
                      onSave={v => saveERField('leaveModelId', v)}
                      type="select"
                      options={leaveModelOptions}
                    />
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Start Date</p>
                      <p className="text-sm">{new Date(selectedER.startDate).toLocaleDateString()}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-sm">{selectedER.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </TabsContent>

                {/* ─── Leave Tab ─── */}
                <TabsContent value="leave" className="mt-4">
                  <div className="space-y-3">
                    {selectedBalances.length === 0 ? (
                      <p className="text-center py-6 text-sm text-muted-foreground">No leave balances</p>
                    ) : selectedBalances.map(bal => {
                      const lt = reads.getLeaveType(bal.leaveTypeId);
                      return (
                        <div key={bal.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lt?.color }} />
                            <span className="text-sm">{lt?.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-muted-foreground">{bal.used} used</span>
                            <span className="text-muted-foreground">{bal.pending} pending</span>
                            <span className="text-brand-primary">{bal.available} available</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* ─── Performance Tab ─── */}
                <TabsContent value="performance" className="mt-4 space-y-4">
                  {selectedReviews.length > 0 && (
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-2 flex items-center gap-1"><Star className="w-4 h-4" /> Reviews</h4>
                      <div className="space-y-2">
                        {selectedReviews.map(r => (
                          <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <Badge variant="outline" className={`text-xs border-0 ${r.status === 'completed' ? 'text-brand-success bg-brand-success-light' : 'text-brand-warning bg-brand-warning-light'}`}>{r.status.replace(/_/g, ' ')}</Badge>
                              {r.overallRating && <span className="text-xs text-muted-foreground ml-2">{ratingLabels[r.overallRating]}</span>}
                            </div>
                            {r.overallRating && <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <Star key={i} className={`w-3 h-3 ${i <= r.overallRating! ? 'text-brand-warning fill-brand-warning' : 'text-muted-foreground/30'}`} />)}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedGoals.length > 0 && (
                    <div>
                      <h4 className="text-sm text-muted-foreground mb-2 flex items-center gap-1"><Target className="w-4 h-4" /> Goals</h4>
                      <div className="space-y-2">
                        {selectedGoals.map(g => (
                          <div key={g.id} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-sm">{g.title}</p>
                              <span className="text-sm text-brand-primary">{g.progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-brand-primary" style={{ width: `${g.progress}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedReviews.length === 0 && selectedGoals.length === 0 && (
                    <p className="text-center py-6 text-sm text-muted-foreground">No performance data</p>
                  )}
                </TabsContent>

                {/* ─── Policies Tab ─── */}
                <TabsContent value="policies" className="mt-4">
                  <div className="space-y-2">
                    {selectedPolicyAcks.length === 0 ? (
                      <p className="text-center py-6 text-sm text-muted-foreground">No policy acknowledgments</p>
                    ) : selectedPolicyAcks.map(ack => {
                      const policy = additionalReads.getPoliciesForCompany(activeCompanyId).find(p => p.id === ack.policyId);
                      return (
                        <div key={ack.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{policy?.title || 'Unknown policy'}</span>
                          </div>
                          <Badge variant="outline" className={`text-xs border-0 ${ack.status === 'acknowledged' ? 'text-brand-success bg-brand-success-light' : ack.status === 'overdue' ? 'text-brand-error bg-brand-error-light' : 'text-brand-warning bg-brand-warning-light'}`}>
                            {ack.status === 'acknowledged' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                            {ack.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Employee Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Add Employee</DialogTitle><DialogDescription>Add a new employee to the company.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name *</Label><Input value={formData.firstName} onChange={e => setFormData(f => ({ ...f, firstName: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Last Name *</Label><Input value={formData.lastName} onChange={e => setFormData(f => ({ ...f, lastName: e.target.value }))} /></div>
            </div>
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={formData.email} onChange={e => setFormData(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Department *</Label><Input value={formData.department} onChange={e => setFormData(f => ({ ...f, department: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Team</Label><Input value={formData.team} onChange={e => setFormData(f => ({ ...f, team: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Job Title *</Label><Input value={formData.jobTitle} onChange={e => setFormData(f => ({ ...f, jobTitle: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Location</Label><Input value={formData.location} onChange={e => setFormData(f => ({ ...f, location: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <Select value={formData.employmentType} onValueChange={v => setFormData(f => ({ ...f, employmentType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{['full-time', 'part-time', 'contractor', 'intern'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Leave Model</Label>
                <Select value={formData.leaveModelId} onValueChange={v => setFormData(f => ({ ...f, leaveModelId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select model" /></SelectTrigger>
                  <SelectContent>{companyLeaveModels.map(lm => <SelectItem key={lm.id} value={lm.id}>{lm.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <Select value={formData.managerId} onValueChange={v => setFormData(f => ({ ...f, managerId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {users.filter(u => u.isActive).map(u => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAdd}>Add Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Assign Leave Model Dialog */}
      <Dialog open={showBulkModelDialog} onOpenChange={setShowBulkModelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Leave Model</DialogTitle>
            <DialogDescription>Assign a leave model to {selectedIds.size} selected employee{selectedIds.size > 1 ? 's' : ''}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Leave Model</Label>
              <Select value={bulkLeaveModel} onValueChange={setBulkLeaveModel}>
                <SelectTrigger><SelectValue placeholder="Select leave model" /></SelectTrigger>
                <SelectContent>
                  {companyLeaveModels.map(lm => (
                    <SelectItem key={lm.id} value={lm.id}>
                      <div className="flex items-center gap-2">
                        <span>{lm.name}</span>
                        <span className="text-xs text-muted-foreground">({lm.description})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">Employees to update:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedIds).slice(0, 8).map(id => {
                  const er = reads.getEmploymentRecord(id);
                  const u = er ? reads.getUser(er.userId) : null;
                  return u ? (
                    <Badge key={id} variant="outline" className="text-xs">{u.firstName} {u.lastName}</Badge>
                  ) : null;
                })}
                {selectedIds.size > 8 && <Badge variant="outline" className="text-xs">+{selectedIds.size - 8} more</Badge>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkModelDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkAssignModel}>Assign to {selectedIds.size} Employee{selectedIds.size > 1 ? 's' : ''}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Change Department Dialog */}
      <Dialog open={showBulkDeptDialog} onOpenChange={setShowBulkDeptDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Department</DialogTitle>
            <DialogDescription>Move {selectedIds.size} selected employee{selectedIds.size > 1 ? 's' : ''} to a different department.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={bulkDepartment} onValueChange={setBulkDepartment}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-xs text-muted-foreground mb-2">Employees to update:</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedIds).slice(0, 8).map(id => {
                  const er = reads.getEmploymentRecord(id);
                  const u = er ? reads.getUser(er.userId) : null;
                  return u ? (
                    <Badge key={id} variant="outline" className="text-xs">{u.firstName} {u.lastName}</Badge>
                  ) : null;
                })}
                {selectedIds.size > 8 && <Badge variant="outline" className="text-xs">+{selectedIds.size - 8} more</Badge>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeptDialog(false)}>Cancel</Button>
            <Button onClick={handleBulkChangeDept}>Move {selectedIds.size} Employee{selectedIds.size > 1 ? 's' : ''}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
