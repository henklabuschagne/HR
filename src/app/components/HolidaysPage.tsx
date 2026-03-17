import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner';
import { Calendar, Plus, Trash2, Loader2, RefreshCw } from 'lucide-react';

export function HolidaysPage() {
  const { session, reads, actions } = useAppStore('session', 'holidays');
  const { activeCompanyId } = session;
  const company = reads.getCompany(activeCompanyId);

  const holidays = reads.getHolidaysForCompany(activeCompanyId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim() || !date) { toast.error('Name and date are required'); return; }
    setSaving(true);
    const result = actions.addHoliday({ companyId: activeCompanyId, name, date, isRecurring });
    setSaving(false);
    if (result) {
      toast.success('Holiday added');
      setShowAdd(false); setName(''); setDate(''); setIsRecurring(false);
    } else toast.error('Failed to add holiday');
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const result = actions.deleteHoliday(id);
    setDeletingId(null);
    if (result) toast.success('Holiday removed');
    else toast.error('Failed to remove holiday');
  };

  const upcomingHolidays = holidays.filter(h => new Date(h.date) >= new Date());
  const pastHolidays = holidays.filter(h => new Date(h.date) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Holiday Calendar</h1>
          <p className="text-muted-foreground">Public holidays for {company?.name} ({company?.country})</p>
        </div>
        <Button onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Holiday
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-primary-light rounded-lg"><Calendar className="w-5 h-5 text-brand-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Holidays</p>
              <p className="text-xl">{holidays.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-success-light rounded-lg"><Calendar className="w-5 h-5 text-brand-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Upcoming</p>
              <p className="text-xl">{upcomingHolidays.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-warning-light rounded-lg"><RefreshCw className="w-5 h-5 text-brand-warning" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Recurring</p>
              <p className="text-xl">{holidays.filter(h => h.isRecurring).length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holiday List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Holidays</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingHolidays.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No upcoming holidays</p>
          ) : (
            <div className="space-y-2">
              {upcomingHolidays.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-error-light rounded-lg">
                      <Calendar className="w-4 h-4 text-brand-error" />
                    </div>
                    <div>
                      <p className="text-sm">{h.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.isRecurring && (
                      <Badge variant="outline" className="text-xs text-brand-primary bg-brand-primary-light border-0">
                        <RefreshCw className="w-3 h-3 mr-1" /> Recurring
                      </Badge>
                    )}
                    <Button
                      variant="ghost" size="icon" className="text-brand-error hover:text-brand-error"
                      onClick={() => handleDelete(h.id)}
                      disabled={deletingId === h.id}
                    >
                      {deletingId === h.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pastHolidays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pastHolidays.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg border opacity-60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm">{h.name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {h.isRecurring && <Badge variant="outline" className="text-xs">Recurring</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Holiday Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Public Holiday</DialogTitle>
            <DialogDescription>Add a new public holiday to the company calendar.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Holiday Name</Label>
              <Input placeholder="e.g. Labor Day" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm">Recurring annually</p>
                <p className="text-xs text-muted-foreground">This holiday repeats every year</p>
              </div>
              <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}