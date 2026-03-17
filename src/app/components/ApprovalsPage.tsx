import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { toast } from 'sonner';
import {
  CheckCircle2, XCircle, Clock, Loader2,
  AlertCircle, ChevronDown, ChevronUp,
} from 'lucide-react';

export function ApprovalsPage() {
  const { session, leaveRequests, reads, actions } = useAppStore('session', 'leaveRequests', 'leaveBalances', 'employmentRecords');
  const { currentUser, activeCompanyId } = session;

  const pendingApprovals = reads.getPendingApprovals(currentUser.id);
  const recentDecisions = leaveRequests.filter(
    r => r.approverId === currentUser.id && ['approved', 'rejected'].includes(r.status)
  ).sort((a, b) => new Date(b.approvedAt || b.createdAt).getTime() - new Date(a.approvedAt || a.createdAt).getTime());

  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setLoadingIds(prev => new Set(prev).add(requestId));
    const result = actions.approveLeaveRequest(requestId, currentUser.id);
    setLoadingIds(prev => { const next = new Set(prev); next.delete(requestId); return next; });
    if (result) toast.success('Leave request approved');
    else toast.error('Failed to approve request');
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setLoadingIds(prev => new Set(prev).add(selectedRequest));
    const result = actions.rejectLeaveRequest(selectedRequest, currentUser.id, rejectNote);
    setLoadingIds(prev => { const next = new Set(prev); next.delete(selectedRequest!); return next; });
    if (result) {
      toast.success('Leave request rejected');
      setShowRejectDialog(false);
      setRejectNote('');
      setSelectedRequest(null);
    } else {
      toast.error('Failed to reject request');
    }
  };

  const openRejectDialog = (requestId: string) => {
    setSelectedRequest(requestId);
    setShowRejectDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Approvals</h1>
        <p className="text-muted-foreground">Review and manage leave requests from your team</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-brand-warning-light rounded-lg">
              <Clock className="w-5 h-5 text-brand-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl">{pendingApprovals.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-brand-success-light rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-brand-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Approved (Recent)</p>
              <p className="text-2xl">{recentDecisions.filter(r => r.status === 'approved').length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-brand-error-light rounded-lg">
              <XCircle className="w-5 h-5 text-brand-error" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rejected (Recent)</p>
              <p className="text-2xl">{recentDecisions.filter(r => r.status === 'rejected').length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-warning" />
            Pending Approvals
          </CardTitle>
          <CardDescription>{pendingApprovals.length} request(s) awaiting your decision</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingApprovals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">All caught up! No pending approvals.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map(req => {
                const user = reads.getUser(req.userId);
                const lt = reads.getLeaveType(req.leaveTypeId);
                const er = reads.getEmploymentRecord(req.employmentRecordId);
                const isExpanded = expandedId === req.id;
                const isLoading = loadingIds.has(req.id);

                // Check overlap
                const overlapping = leaveRequests.filter(r =>
                  r.id !== req.id && r.companyId === req.companyId && r.status === 'approved' &&
                  r.startDate <= req.endDate && r.endDate >= req.startDate
                );

                return (
                  <div key={req.id} className="border rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center text-sm text-brand-primary">
                          {user?.firstName[0]}{user?.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{er?.jobTitle} - {er?.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(req.id)}
                          disabled={isLoading}
                          className="bg-brand-success hover:bg-brand-success/90"
                        >
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-1" />}
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRejectDialog(req.id)}
                          disabled={isLoading}
                          className="text-brand-error border-brand-error hover:bg-brand-error-light"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Leave Type</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lt?.color }} />
                          <p className="text-sm">{lt?.name}</p>
                        </div>
                      </div>
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Duration</p>
                        <p className="text-sm mt-0.5">{req.totalDays} day(s)</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">Start</p>
                        <p className="text-sm mt-0.5">{new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground">End</p>
                        <p className="text-sm mt-0.5">{new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>

                    {req.reason && (
                      <div className="mt-3 p-2 bg-brand-primary-light rounded-lg">
                        <p className="text-xs text-brand-primary"><strong>Reason:</strong> {req.reason}</p>
                      </div>
                    )}

                    {overlapping.length > 0 && (
                      <div className="mt-2 p-2 bg-brand-warning-light rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-brand-warning mt-0.5 shrink-0" />
                        <p className="text-xs text-brand-warning">
                          {overlapping.length} team member(s) already on leave during this period
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req.id)}
                      className="mt-2 text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? 'Less details' : 'More details'}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground space-y-1">
                        <p>Submitted: {new Date(req.submittedAt).toLocaleString()}</p>
                        <p>Status: {req.status.replace(/_/g, ' ')}</p>
                        <p>Employment Record: {er?.location}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Decisions */}
      {recentDecisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Decisions</CardTitle>
            <CardDescription>Your recent approval history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentDecisions.slice(0, 8).map(req => {
                const user = reads.getUser(req.userId);
                const lt = reads.getLeaveType(req.leaveTypeId);
                return (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs ${req.status === 'approved' ? 'bg-brand-success' : 'bg-brand-error'}`}>
                        {req.status === 'approved' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm">{user?.firstName} {user?.lastName} - {lt?.name}</p>
                        <p className="text-xs text-muted-foreground">{req.totalDays} day(s), {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs border-0 ${req.status === 'approved' ? 'text-brand-success bg-brand-success-light' : 'text-brand-error bg-brand-error-light'}`}>
                      {req.status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Leave Request</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this request. The employee will be notified.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (optional)..."
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={loadingIds.has(selectedRequest || '')}>
              {loadingIds.has(selectedRequest || '') && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}