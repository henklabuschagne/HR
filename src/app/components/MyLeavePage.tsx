import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import {
  Calendar, Plus, XCircle,
  Loader2, Info,
} from 'lucide-react';

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'text-muted-foreground bg-muted' },
  submitted: { label: 'Submitted', className: 'text-brand-primary bg-brand-primary-light' },
  pending_manager: { label: 'Pending Manager', className: 'text-brand-warning bg-brand-warning-light' },
  pending_admin: { label: 'Pending Admin', className: 'text-brand-warning bg-brand-warning-light' },
  approved: { label: 'Approved', className: 'text-brand-success bg-brand-success-light' },
  rejected: { label: 'Rejected', className: 'text-brand-error bg-brand-error-light' },
  cancelled: { label: 'Cancelled', className: 'text-muted-foreground bg-muted' },
  returned: { label: 'Returned', className: 'text-brand-warning bg-brand-warning-light' },
};

export function MyLeavePage() {
  const { session, leaveRequests, leaveBalances, employmentRecords, reads, actions } = useAppStore(
    'session', 'leaveRequests', 'leaveBalances', 'employmentRecords', 'leaveTypes'
  );
  const { currentUser, activeCompanyId } = session;

  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Form state
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const userER = employmentRecords.find(er => er.userId === currentUser.id && er.companyId === activeCompanyId);
  const balances = userER ? reads.getUserLeaveBalances(userER.id) : [];
  const myRequests = reads.getLeaveRequestsForUser(currentUser.id, activeCompanyId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const companyLeaveTypes = reads.getLeaveTypesForCompany(activeCompanyId);

  const handleSubmitRequest = async () => {
    if (!userER || !leaveTypeId || !startDate || !endDate || !reason.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) { toast.error('End date must be after start date'); return; }
    const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    setSubmitting(true);
    const result = actions.createLeaveRequest({
      employmentRecordId: userER.id,
      userId: currentUser.id,
      companyId: activeCompanyId,
      leaveTypeId,
      startDate,
      endDate,
      unit: 'full-day',
      totalDays: diffDays,
      reason,
      submittedAt: new Date().toISOString(),
    });
    setSubmitting(false);

    if (result) {
      toast.success('Leave request submitted successfully');
      setShowRequestDialog(false);
      setLeaveTypeId(''); setStartDate(''); setEndDate(''); setReason('');
    } else {
      toast.error('Failed to submit leave request');
    }
  };

  const handleCancel = async (id: string) => {
    setCancellingId(id);
    const result = actions.cancelLeaveRequest(id);
    setCancellingId(null);
    if (result) toast.success('Request cancelled');
    else toast.error('Failed to cancel request');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">My Leave</h1>
          <p className="text-muted-foreground">Manage your leave requests and view balances</p>
        </div>
        <Button onClick={() => setShowRequestDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {balances.map(bal => {
          const lt = reads.getLeaveType(bal.leaveTypeId);
          const usagePercent = bal.entitled > 0 ? Math.round((bal.used / bal.entitled) * 100) : 0;
          return (
            <Card key={bal.id} className="border-l-4" style={{ borderLeftColor: lt?.color || '#456E92' }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">{lt?.name}</p>
                  {bal.pending > 0 && (
                    <Badge variant="outline" className="text-xs text-brand-warning bg-brand-warning-light border-0">
                      {bal.pending} pending
                    </Badge>
                  )}
                </div>
                <div className="flex items-end gap-2 mb-1">
                  <p className="text-3xl">{bal.available}</p>
                  <span className="text-sm text-muted-foreground mb-1">/ {bal.entitled} days</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${usagePercent}%`, backgroundColor: lt?.color || '#456E92' }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{bal.used} used {bal.carriedOver > 0 ? `- ${bal.carriedOver} carried over` : ''}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Leave History */}
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </div>

        {['all', 'pending', 'approved', 'rejected'].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {myRequests
                    .filter(r => {
                      if (tab === 'all') return true;
                      if (tab === 'pending') return ['submitted', 'pending_manager', 'pending_admin'].includes(r.status);
                      return r.status === tab;
                    })
                    .map(req => {
                      const lt = reads.getLeaveType(req.leaveTypeId);
                      const sc = statusConfig[req.status];
                      const canCancel = ['submitted', 'pending_manager', 'pending_admin'].includes(req.status);
                      return (
                        <div key={req.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-10 rounded-full" style={{ backgroundColor: lt?.color || '#456E92' }} />
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm">{lt?.name}</p>
                                <Badge variant="outline" className={`text-xs border-0 ${sc?.className}`}>{sc?.label}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {new Date(req.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                {req.startDate !== req.endDate && ` - ${new Date(req.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                              </p>
                              {req.reason && <p className="text-xs text-muted-foreground mt-0.5">{req.reason}</p>}
                              {req.approverNote && (
                                <p className="text-xs text-brand-primary mt-0.5 flex items-center gap-1">
                                  <Info className="w-3 h-3" /> {req.approverNote}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-sm">{req.totalDays} day{req.totalDays > 1 ? 's' : ''}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(req.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </p>
                            </div>
                            {canCancel && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCancel(req.id)}
                                disabled={cancellingId === req.id}
                                className="text-brand-error hover:text-brand-error"
                              >
                                {cancellingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  {myRequests.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">No leave requests yet</p>
                      <Button variant="outline" className="mt-3" onClick={() => setShowRequestDialog(true)}>
                        Request Leave
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Request Leave Dialog */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Leave</DialogTitle>
            <DialogDescription>Submit a new leave request. Your manager will be notified.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Leave Type</Label>
              <Select value={leaveTypeId} onValueChange={setLeaveTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  {companyLeaveTypes.map(lt => {
                    const bal = balances.find(b => b.leaveTypeId === lt.id);
                    return (
                      <SelectItem key={lt.id} value={lt.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lt.color }} />
                          {lt.name}
                          {bal && <span className="text-xs text-muted-foreground ml-1">({bal.available} avail.)</span>}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
            {startDate && endDate && new Date(endDate) >= new Date(startDate) && (
              <div className="p-3 bg-brand-primary-light rounded-lg">
                <p className="text-sm text-brand-primary">
                  <strong>{Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1}</strong> working day(s) requested
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason</Label>
              <Textarea placeholder="Brief reason for leave..." value={reason} onChange={e => setReason(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestDialog(false)}>Cancel</Button>
            <Button onClick={handleSubmitRequest} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}