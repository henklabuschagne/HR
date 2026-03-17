import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { toast } from 'sonner';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import {
  Building2, Users, Globe, Plus, MapPin, DollarSign, Pencil, Trash2,
} from 'lucide-react';

export function CompaniesPage() {
  const { companies, employmentRecords, reads, actions } = useAppStore('companies', 'employmentRecords');

  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', code: '', country: '', currency: 'USD', isActive: true });

  const handleAdd = () => {
    if (!form.name || !form.code || !form.country) { toast.error('All fields required'); return; }
    actions.addCompany({ ...form });
    toast.success('Company created');
    setShowAdd(false);
    setForm({ name: '', code: '', country: '', currency: 'USD', isActive: true });
  };

  const handleEdit = () => {
    if (!editingId) return;
    actions.updateCompany(editingId, form);
    toast.success('Company updated');
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const empCount = employmentRecords.filter(er => er.companyId === id && er.isActive).length;
    if (empCount > 0) { toast.error('Cannot delete company with active employees'); return; }
    actions.deleteCompany(id);
    toast.success('Company deleted');
  };

  const openEdit = (id: string) => {
    const c = reads.getCompany(id);
    if (!c) return;
    setForm({ name: c.name, code: c.code, country: c.country, currency: c.currency, isActive: c.isActive });
    setEditingId(id);
  };

  const formFields = (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Company Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Code *</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. ACH" /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2"><Label>Country *</Label><Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} /></div>
        <div className="space-y-2"><Label>Currency</Label><Input value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} /></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Company Management</h1>
          <p className="text-muted-foreground">Manage all companies in the platform</p>
        </div>
        <Button onClick={() => { setForm({ name: '', code: '', country: '', currency: 'USD', isActive: true }); setShowAdd(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-primary-light rounded-lg"><Building2 className="w-5 h-5 text-brand-primary" /></div><div><p className="text-xs text-muted-foreground">Total Companies</p><p className="text-xl">{companies.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-success-light rounded-lg"><Users className="w-5 h-5 text-brand-success" /></div><div><p className="text-xs text-muted-foreground">Total Employees</p><p className="text-xl">{employmentRecords.filter(er => er.isActive).length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="p-2 bg-brand-warning-light rounded-lg"><Globe className="w-5 h-5 text-brand-warning" /></div><div><p className="text-xs text-muted-foreground">Countries</p><p className="text-xl">{new Set(companies.map(c => c.country)).size}</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map(company => {
          const empCount = employmentRecords.filter(er => er.companyId === company.id && er.isActive).length;
          const depts = reads.getDepartmentsForCompany(company.id);
          return (
            <Card key={company.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-brand-primary">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-primary-light flex items-center justify-center"><Building2 className="w-6 h-6 text-brand-primary" /></div>
                    <div><h3>{company.name}</h3><p className="text-xs text-muted-foreground">{company.code}</p></div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={`text-xs border-0 ${company.isActive ? 'text-brand-success bg-brand-success-light' : 'text-muted-foreground bg-muted'}`}>{company.isActive ? 'Active' : 'Inactive'}</Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(company.id)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-brand-error" onClick={() => handleDelete(company.id)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Employees</p><p className="text-sm">{empCount}</p></div>
                  <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Departments</p><p className="text-sm">{depts.length}</p></div>
                  <div className="p-2 bg-muted rounded-lg flex items-center gap-1"><MapPin className="w-3 h-3 text-muted-foreground" /><p className="text-xs">{company.country}</p></div>
                  <div className="p-2 bg-muted rounded-lg flex items-center gap-1"><DollarSign className="w-3 h-3 text-muted-foreground" /><p className="text-xs">{company.currency}</p></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent><DialogHeader><DialogTitle>Add Company</DialogTitle><DialogDescription>Create a new company entity.</DialogDescription></DialogHeader>{formFields}<DialogFooter><Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button><Button onClick={handleAdd}>Create Company</Button></DialogFooter></DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingId} onOpenChange={() => setEditingId(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Company</DialogTitle></DialogHeader>{formFields}<DialogFooter><Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button><Button onClick={handleEdit}>Save Changes</Button></DialogFooter></DialogContent>
      </Dialog>
    </div>
  );
}
