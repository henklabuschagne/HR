import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import {
  Plus, ArrowRight, CheckCircle2, Layers, ChevronRight, Pencil, Trash2,
} from 'lucide-react';

export function LeaveModelsPage() {
  const { session, reads, actions } = useAppStore('session', 'leaveModels', 'leaveTypes', 'workflows');
  const { activeCompanyId } = session;

  const leaveModels = reads.getLeaveModelsForCompany(activeCompanyId);
  const leaveTypes = reads.getLeaveTypesForCompany(activeCompanyId);
  const workflows = reads.getWorkflowsForCompany(activeCompanyId);
  const company = reads.getCompany(activeCompanyId);

  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [showAddModel, setShowAddModel] = useState(false);
  const [showAddType, setShowAddType] = useState(false);
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);

  // Leave Model form
  const [modelForm, setModelForm] = useState({ name: '', description: '', carryOverLimit: 5, accrualType: 'monthly' as string, isDefault: false });
  const [modelAllocations, setModelAllocations] = useState<{ leaveTypeId: string; entitlement: number }[]>([]);

  // Leave Type form
  const [typeForm, setTypeForm] = useState({ name: '', code: '', color: '#456E92', isPaid: true, requiresDocument: false, allowHalfDay: false, allowNegativeBalance: false, maxDaysPerYear: 21 });

  // Workflow form
  const [wfForm, setWfForm] = useState({ name: '', steps: [{ order: 1, type: 'manager' as string, autoApproveBelow: 0 }] });

  const model = selectedModel ? reads.getLeaveModel(selectedModel) : null;
  const dayNames = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handleAddModel = () => {
    if (!modelForm.name) { toast.error('Name is required'); return; }
    actions.addLeaveModel({ ...modelForm, companyId: activeCompanyId, leaveTypes: modelAllocations, workingDays: [1,2,3,4,5], accrualType: modelForm.accrualType as any, isActive: true });
    toast.success('Leave model created');
    setShowAddModel(false);
    setModelForm({ name: '', description: '', carryOverLimit: 5, accrualType: 'monthly', isDefault: false });
    setModelAllocations([]);
  };

  const handleDeleteModel = (id: string) => {
    actions.deleteLeaveModel(id);
    toast.success('Leave model deleted');
    setSelectedModel(null);
  };

  const handleAddType = () => {
    if (!typeForm.name || !typeForm.code) { toast.error('Name and code are required'); return; }
    actions.addLeaveType({ ...typeForm, companyId: activeCompanyId, isActive: true });
    toast.success('Leave type created');
    setShowAddType(false);
    setTypeForm({ name: '', code: '', color: '#456E92', isPaid: true, requiresDocument: false, allowHalfDay: false, allowNegativeBalance: false, maxDaysPerYear: 21 });
  };

  const handleUpdateType = () => {
    if (!editingType) return;
    actions.updateLeaveType(editingType, { ...typeForm });
    toast.success('Leave type updated');
    setEditingType(null);
  };

  const handleDeleteType = (id: string) => {
    actions.deleteLeaveType(id);
    toast.success('Leave type deleted');
  };

  const handleAddWorkflow = () => {
    if (!wfForm.name) { toast.error('Name is required'); return; }
    actions.addWorkflow({ companyId: activeCompanyId, name: wfForm.name, steps: wfForm.steps.map(s => ({ order: s.order, type: s.type as any, autoApproveBelow: s.autoApproveBelow || undefined })), isActive: true });
    toast.success('Workflow created');
    setShowAddWorkflow(false);
    setWfForm({ name: '', steps: [{ order: 1, type: 'manager', autoApproveBelow: 0 }] });
  };

  const handleDeleteWorkflow = (id: string) => {
    actions.deleteWorkflow(id);
    toast.success('Workflow deleted');
  };

  const openEditType = (ltId: string) => {
    const lt = reads.getLeaveType(ltId);
    if (!lt) return;
    setTypeForm({ name: lt.name, code: lt.code, color: lt.color, isPaid: lt.isPaid, requiresDocument: lt.requiresDocument, allowHalfDay: lt.allowHalfDay, allowNegativeBalance: lt.allowNegativeBalance, maxDaysPerYear: lt.maxDaysPerYear });
    setEditingType(ltId);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Leave Configuration</h1>
          <p className="text-muted-foreground">Manage leave models, types, and approval workflows for {company?.name}</p>
        </div>
      </div>

      <Tabs defaultValue="models">
        <TabsList>
          <TabsTrigger value="models">Leave Models ({leaveModels.length})</TabsTrigger>
          <TabsTrigger value="types">Leave Types ({leaveTypes.length})</TabsTrigger>
          <TabsTrigger value="workflows">Workflows ({workflows.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddModel(true)}><Plus className="w-4 h-4 mr-2" /> New Leave Model</Button>
          </div>
          {leaveModels.map(lm => (
            <Card key={lm.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedModel(lm.id)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-primary-light rounded-lg"><Layers className="w-6 h-6 text-brand-primary" /></div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3>{lm.name}</h3>
                        {lm.isDefault && <Badge variant="outline" className="text-xs text-brand-primary bg-brand-primary-light border-0">Default</Badge>}
                        <Badge variant="outline" className={`text-xs border-0 ${lm.isActive ? 'text-brand-success bg-brand-success-light' : 'text-muted-foreground bg-muted'}`}>{lm.isActive ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{lm.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-brand-error" onClick={e => { e.stopPropagation(); handleDeleteModel(lm.id); }}><Trash2 className="w-4 h-4" /></Button>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Leave Types</p><p className="text-sm">{lm.leaveTypes.length} types</p></div>
                  <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Working Days</p><p className="text-sm">{lm.workingDays.map(d => dayNames[d]).join(', ')}</p></div>
                  <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Carry-Over</p><p className="text-sm">{lm.carryOverLimit} days</p></div>
                  <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Accrual</p><p className="text-sm capitalize">{lm.accrualType}</p></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="types" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddType(true)}><Plus className="w-4 h-4 mr-2" /> New Leave Type</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {leaveTypes.map(lt => (
              <Card key={lt.id} className="border-l-4" style={{ borderLeftColor: lt.color }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lt.color }} />
                      <h4>{lt.name}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="text-xs">{lt.code}</Badge>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditType(lt.id)}><Pencil className="w-3 h-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-brand-error" onClick={() => handleDeleteType(lt.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Paid</span><span>{lt.isPaid ? 'Yes' : 'No'}</span></div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Max Days</span><span>{lt.maxDaysPerYear}/yr</span></div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Half Day</span><span>{lt.allowHalfDay ? 'Yes' : 'No'}</span></div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded"><span className="text-muted-foreground">Document</span><span>{lt.requiresDocument ? 'Required' : 'Optional'}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="workflows" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddWorkflow(true)}><Plus className="w-4 h-4 mr-2" /> New Workflow</Button>
          </div>
          {workflows.map(wf => (
            <Card key={wf.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-success-light rounded-lg"><CheckCircle2 className="w-5 h-5 text-brand-success" /></div>
                    <div>
                      <h4>{wf.name}</h4>
                      <Badge variant="outline" className={`text-xs mt-1 border-0 ${wf.isActive ? 'text-brand-success bg-brand-success-light' : 'text-muted-foreground bg-muted'}`}>{wf.isActive ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-brand-error" onClick={() => handleDeleteWorkflow(wf.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {wf.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="px-3 py-2 bg-muted rounded-lg text-sm">
                        <p className="text-xs text-muted-foreground">Step {step.order}</p>
                        <p className="capitalize">{step.type}</p>
                        {step.autoApproveBelow && <p className="text-xs text-brand-success mt-0.5">Auto-approve &lt; {step.autoApproveBelow} days</p>}
                      </div>
                      {idx < wf.steps.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Model Detail Dialog */}
      <Dialog open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
        <DialogContent className="sm:max-w-2xl">
          {model && (
            <>
              <DialogHeader><DialogTitle>{model.name}</DialogTitle><DialogDescription>{model.description}</DialogDescription></DialogHeader>
              <div className="space-y-4 mt-4">
                <h4 className="text-sm text-muted-foreground">Included Leave Types & Entitlements</h4>
                <div className="space-y-2">
                  {model.leaveTypes.map(alloc => {
                    const lt = reads.getLeaveType(alloc.leaveTypeId);
                    return (
                      <div key={alloc.leaveTypeId} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lt?.color }} />
                          <span className="text-sm">{lt?.name}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">{alloc.entitlement} days/year</span>
                          {lt?.isPaid && <Badge variant="outline" className="text-xs text-brand-success bg-brand-success-light border-0">Paid</Badge>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Carry-Over</p><p className="text-sm">{model.carryOverLimit} days max</p></div>
                  <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Accrual Type</p><p className="text-sm capitalize">{model.accrualType}</p></div>
                  <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Working Days</p><p className="text-sm">{model.workingDays.map(d => dayNames[d]).join(', ')}</p></div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Leave Model Dialog */}
      <Dialog open={showAddModel} onOpenChange={setShowAddModel}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>New Leave Model</DialogTitle><DialogDescription>Create a new leave model with entitlements.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={modelForm.name} onChange={e => setModelForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Input value={modelForm.description} onChange={e => setModelForm(f => ({ ...f, description: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Carry-Over Limit (days)</Label><Input type="number" value={modelForm.carryOverLimit} onChange={e => setModelForm(f => ({ ...f, carryOverLimit: Number(e.target.value) }))} /></div>
              <div className="space-y-2">
                <Label>Accrual Type</Label>
                <Select value={modelForm.accrualType} onValueChange={v => setModelForm(f => ({ ...f, accrualType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['annual', 'monthly', 'bi-weekly'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Leave Type Entitlements</Label>
              {leaveTypes.map(lt => {
                const alloc = modelAllocations.find(a => a.leaveTypeId === lt.id);
                return (
                  <div key={lt.id} className="flex items-center gap-3 p-2 border rounded-lg">
                    <Checkbox checked={!!alloc} onCheckedChange={checked => {
                      if (checked) setModelAllocations(a => [...a, { leaveTypeId: lt.id, entitlement: lt.maxDaysPerYear }]);
                      else setModelAllocations(a => a.filter(x => x.leaveTypeId !== lt.id));
                    }} />
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lt.color }} />
                    <span className="text-sm flex-1">{lt.name}</span>
                    {alloc && <Input type="number" className="w-20 h-8 text-xs" value={alloc.entitlement} onChange={e => setModelAllocations(a => a.map(x => x.leaveTypeId === lt.id ? { ...x, entitlement: Number(e.target.value) } : x))} />}
                    {alloc && <span className="text-xs text-muted-foreground">days</span>}
                  </div>
                );
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModel(false)}>Cancel</Button>
            <Button onClick={handleAddModel}>Create Model</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Leave Type Dialog */}
      <Dialog open={showAddType || !!editingType} onOpenChange={v => { if (!v) { setShowAddType(false); setEditingType(null); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingType ? 'Edit Leave Type' : 'New Leave Type'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name *</Label><Input value={typeForm.name} onChange={e => setTypeForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Code *</Label><Input value={typeForm.code} onChange={e => setTypeForm(f => ({ ...f, code: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Color</Label><Input type="color" value={typeForm.color} onChange={e => setTypeForm(f => ({ ...f, color: e.target.value }))} className="h-10" /></div>
              <div className="space-y-2"><Label>Max Days/Year</Label><Input type="number" value={typeForm.maxDaysPerYear} onChange={e => setTypeForm(f => ({ ...f, maxDaysPerYear: Number(e.target.value) }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'isPaid', label: 'Paid Leave' },
                { key: 'requiresDocument', label: 'Requires Document' },
                { key: 'allowHalfDay', label: 'Allow Half Day' },
                { key: 'allowNegativeBalance', label: 'Allow Negative Balance' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-2 p-2 border rounded-lg">
                  <Checkbox checked={(typeForm as any)[key]} onCheckedChange={v => setTypeForm(f => ({ ...f, [key]: v }))} />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddType(false); setEditingType(null); }}>Cancel</Button>
            <Button onClick={editingType ? handleUpdateType : handleAddType}>{editingType ? 'Save Changes' : 'Create Type'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Workflow Dialog */}
      <Dialog open={showAddWorkflow} onOpenChange={setShowAddWorkflow}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Approval Workflow</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={wfForm.name} onChange={e => setWfForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Steps</Label>
              {wfForm.steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg">
                  <span className="text-xs text-muted-foreground w-14">Step {idx + 1}</span>
                  <Select value={step.type} onValueChange={v => setWfForm(f => ({ ...f, steps: f.steps.map((s, i) => i === idx ? { ...s, type: v } : s) }))}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{['manager', 'admin', 'role'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" placeholder="Auto-approve below (days)" className="w-40 text-xs" value={step.autoApproveBelow || ''} onChange={e => setWfForm(f => ({ ...f, steps: f.steps.map((s, i) => i === idx ? { ...s, autoApproveBelow: Number(e.target.value) } : s) }))} />
                  {wfForm.steps.length > 1 && <Button variant="ghost" size="icon" className="h-7 w-7 text-brand-error" onClick={() => setWfForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }))}><Trash2 className="w-3 h-3" /></Button>}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setWfForm(f => ({ ...f, steps: [...f.steps, { order: f.steps.length + 1, type: 'admin', autoApproveBelow: 0 }] }))}><Plus className="w-3 h-3 mr-1" /> Add Step</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddWorkflow(false)}>Cancel</Button>
            <Button onClick={handleAddWorkflow}>Create Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
