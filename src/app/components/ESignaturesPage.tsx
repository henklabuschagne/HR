import { useState, useCallback } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { esignReads, esignActions } from '../lib/esignStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import {
  PenTool, FileText, CheckCircle2, Send,
  Plus, ChevronRight, Eye, XCircle, AlertCircle,
  Bell, Inbox, Ban, Trash2,
} from 'lucide-react';
import type { SignatureRequest } from '../lib/types';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'text-muted-foreground bg-muted', icon: <FileText className="w-3 h-3" /> },
  sent: { label: 'Sent', color: 'text-brand-primary bg-brand-primary-light', icon: <Send className="w-3 h-3" /> },
  viewed: { label: 'Viewed', color: 'text-brand-warning bg-brand-warning-light', icon: <Eye className="w-3 h-3" /> },
  partially_signed: { label: 'Partially Signed', color: 'text-brand-warning bg-brand-warning-light', icon: <PenTool className="w-3 h-3" /> },
  signed: { label: 'Completed', color: 'text-brand-success bg-brand-success-light', icon: <CheckCircle2 className="w-3 h-3" /> },
  declined: { label: 'Declined', color: 'text-brand-error bg-brand-error-light', icon: <XCircle className="w-3 h-3" /> },
  expired: { label: 'Expired', color: 'text-muted-foreground bg-muted', icon: <AlertCircle className="w-3 h-3" /> },
};

const signerStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-muted-foreground bg-muted' },
  viewed: { label: 'Viewed', color: 'text-brand-warning bg-brand-warning-light' },
  signed: { label: 'Signed', color: 'text-brand-success bg-brand-success-light' },
  declined: { label: 'Declined', color: 'text-brand-error bg-brand-error-light' },
};

const catLabels: Record<string, string> = {
  contract: 'Employment Contract',
  nda: 'NDA',
  policy: 'Policy Agreement',
  performance: 'Performance Review',
  disciplinary: 'Disciplinary',
  other: 'Other',
};

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">{icon}</div>
      <h3 className="text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}

export function ESignaturesPage() {
  const { session, reads } = useAppStore('session', 'users');
  const { activeCompanyId, currentUser } = session;
  const company = reads.getCompany(activeCompanyId);

  const [, forceUpdate] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineTarget, setDeclineTarget] = useState<{ requestId: string; signerId: string } | null>(null);

  // ─── Create Flow State ────────────
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createDocName, setCreateDocName] = useState('');
  const [createCategory, setCreateCategory] = useState<SignatureRequest['documentCategory']>('contract');
  const [createSignerIds, setCreateSignerIds] = useState<string[]>([]);

  const companyEmployees = reads.getCompanyEmployees(activeCompanyId);
  const availableUsers = companyEmployees.map(er => reads.getUser(er.userId)).filter(Boolean);

  const resetCreateForm = useCallback(() => {
    setCreateTitle('');
    setCreateDocName('');
    setCreateCategory('contract');
    setCreateSignerIds([]);
  }, []);

  const handleCreate = useCallback((sendImmediately: boolean) => {
    if (!createTitle.trim() || !createDocName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (createSignerIds.length === 0) {
      toast.error('Please add at least one signer');
      return;
    }
    const userName = `${currentUser.firstName} ${currentUser.lastName}`;
    const newId = esignActions.createRequest(
      activeCompanyId,
      createTitle.trim(),
      createDocName.trim(),
      createCategory,
      currentUser.id,
      userName,
      createSignerIds,
      sendImmediately,
    );
    setCreateDialogOpen(false);
    resetCreateForm();
    forceUpdate(v => v + 1);
    if (sendImmediately) {
      toast.success('Signature request sent', {
        description: `"${createTitle.trim()}" has been sent to ${createSignerIds.length} signer(s).`,
      });
    } else {
      toast.success('Draft saved', {
        description: `"${createTitle.trim()}" saved as draft. You can send it later.`,
      });
    }
    setSelectedRequest(newId);
  }, [createTitle, createDocName, createCategory, createSignerIds, currentUser, activeCompanyId, resetCreateForm]);

  const toggleSigner = useCallback((userId: string) => {
    setCreateSignerIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }, []);

  const moveSignerUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setCreateSignerIds(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveSignerDown = useCallback((idx: number) => {
    setCreateSignerIds(prev => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const allRequests = esignReads.getSignatureRequestsForCompany(activeCompanyId);
  const request = selectedRequest ? esignReads.getSignatureRequest(selectedRequest) : null;
  const auditEntries = selectedRequest ? esignReads.getAuditEntriesForRequest(selectedRequest) : [];

  const completed = allRequests.filter(r => r.status === 'signed').length;
  const pendingCount = allRequests.filter(r => ['sent', 'viewed', 'partially_signed'].includes(r.status)).length;
  const drafts = allRequests.filter(r => r.status === 'draft').length;
  const declinedCount = allRequests.filter(r => r.status === 'declined').length;
  const expiredCount = allRequests.filter(r => r.status === 'expired').length;
  const totalSigners = allRequests.reduce((sum, r) => sum + r.signers.length, 0);
  const signedSigners = allRequests.reduce((sum, r) => sum + r.signers.filter(s => s.status === 'signed').length, 0);

  const handleSign = useCallback((requestId: string, signerId: string) => {
    const userName = `${currentUser.firstName} ${currentUser.lastName}`;
    esignActions.signDocument(requestId, signerId, currentUser.id, userName);
    forceUpdate(v => v + 1);
    toast.success('Document signed successfully', {
      description: 'Your typed signature has been applied.',
    });
  }, [currentUser]);

  const handleSendReminder = useCallback((requestId: string) => {
    const req = esignReads.getSignatureRequest(requestId);
    if (!req) return;
    const pendingSigners = req.signers.filter(s => s.status === 'pending' || s.status === 'viewed');
    const names = pendingSigners.map(s => {
      const u = reads.getUser(s.userId);
      return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
    });
    if (names.length === 0) {
      toast.info('No pending signers to remind');
      return;
    }
    esignActions.sendReminder(requestId, currentUser.id, names);
    forceUpdate(v => v + 1);
    toast.success('Reminder sent', {
      description: `Notified ${names.join(', ')}`,
    });
  }, [currentUser, reads]);

  const handleDecline = useCallback(() => {
    if (!declineTarget || !declineReason.trim()) return;
    const userName = `${currentUser.firstName} ${currentUser.lastName}`;
    esignActions.declineDocument(declineTarget.requestId, declineTarget.signerId, currentUser.id, userName, declineReason);
    setDeclineDialogOpen(false);
    setDeclineReason('');
    setDeclineTarget(null);
    forceUpdate(v => v + 1);
    toast.error('Document declined', {
      description: 'The sender has been notified of your decision.',
    });
  }, [declineTarget, declineReason, currentUser]);

  const handleSendDraft = useCallback((requestId: string) => {
    const userName = `${currentUser.firstName} ${currentUser.lastName}`;
    esignActions.sendDraft(requestId, currentUser.id, userName);
    forceUpdate(v => v + 1);
    toast.success('Document sent for signing', {
      description: 'All signers have been notified.',
    });
  }, [currentUser]);

  const handleVoid = useCallback((requestId: string) => {
    const userName = `${currentUser.firstName} ${currentUser.lastName}`;
    esignActions.voidRequest(requestId, currentUser.id, userName);
    forceUpdate(v => v + 1);
    setSelectedRequest(null);
    toast.warning('Document voided', {
      description: 'This document has been cancelled and can no longer be signed.',
    });
  }, [currentUser]);

  const filterRequests = (tab: string) => {
    return allRequests.filter(r => {
      if (tab === 'pending') return ['sent', 'viewed', 'partially_signed'].includes(r.status);
      if (tab === 'completed') return r.status === 'signed';
      if (tab === 'drafts') return r.status === 'draft';
      return true;
    });
  };

  const renderRequestTable = (filtered: typeof allRequests) => {
    if (filtered.length === 0) {
      const emptyMessages: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
        default: { icon: <Inbox className="w-8 h-8 text-muted-foreground" />, title: 'No signature requests', desc: 'Create a new signature request to get started.' },
      };
      const msg = emptyMessages.default;
      return <EmptyState icon={msg.icon} title={msg.title} description={msg.desc} />;
    }
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Document</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead>Signers</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Created</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(req => {
            const sc = statusConfig[req.status];
            const signedCount = req.signers.filter(s => s.status === 'signed').length;
            const creator = reads.getUser(req.createdBy);
            return (
              <TableRow key={req.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRequest(req.id)}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-primary-light rounded-lg shrink-0">
                      <FileText className="w-4 h-4 text-brand-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm truncate">{req.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.documentName}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant="outline" className="text-xs capitalize">{catLabels[req.documentCategory] || req.documentCategory}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {req.signers.slice(0, 3).map(s => {
                      const user = reads.getUser(s.userId);
                      return (
                        <div
                          key={s.id}
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] border-2 border-white -ml-1 first:ml-0 ${
                            s.status === 'signed' ? 'bg-brand-success text-white' : s.status === 'declined' ? 'bg-brand-error text-white' : s.status === 'viewed' ? 'bg-brand-warning text-white' : 'bg-muted text-muted-foreground'
                          }`}
                          title={`${user?.firstName} ${user?.lastName} - ${s.status}`}
                        >
                          {user?.firstName[0]}{user?.lastName[0]}
                        </div>
                      );
                    })}
                    {req.signers.length > 3 && <span className="text-xs text-muted-foreground ml-1">+{req.signers.length - 3}</span>}
                    {req.signers.length > 0 && <span className="text-xs text-muted-foreground ml-2">{signedCount}/{req.signers.length}</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-xs border-0 ${sc.color}`}>
                    {sc.icon} <span className="ml-1">{sc.label}</span>
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground hidden md:table-cell">
                  {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  <br />
                  <span className="text-[10px]">by {creator?.firstName} {creator?.lastName}</span>
                </TableCell>
                <TableCell><ChevronRight className="w-4 h-4 text-muted-foreground" /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">E-Signatures</h1>
          <p className="text-muted-foreground">Manage digital document signing for {company?.name}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Signature Request
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-primary-light rounded-lg"><Send className="w-5 h-5 text-brand-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Awaiting</p>
              <p className="text-xl">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-success-light rounded-lg"><CheckCircle2 className="w-5 h-5 text-brand-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-xl">{completed}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg"><FileText className="w-5 h-5 text-muted-foreground" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Drafts</p>
              <p className="text-xl">{drafts}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-error-light rounded-lg"><XCircle className="w-5 h-5 text-brand-error" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Declined</p>
              <p className="text-xl">{declinedCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-warning-light rounded-lg"><AlertCircle className="w-5 h-5 text-brand-warning" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Expired</p>
              <p className="text-xl">{expiredCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-primary-light rounded-lg"><PenTool className="w-5 h-5 text-brand-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Collected</p>
              <p className="text-xl">{signedSigners}/{totalSigners}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All ({allRequests.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed})</TabsTrigger>
          <TabsTrigger value="drafts">Drafts ({drafts})</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'completed', 'drafts'].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {renderRequestTable(filterRequests(tab))}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {request && (() => {
            const sc = statusConfig[request.status];
            const creator = reads.getUser(request.createdBy);
            const isActiveRequest = ['sent', 'viewed', 'partially_signed'].includes(request.status);
            const currentUserSigner = request.signers.find(s => s.userId === currentUser.id && (s.status === 'pending' || s.status === 'viewed'));
            const hasPendingSigners = request.signers.some(s => s.status === 'pending' || s.status === 'viewed');

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="p-2 bg-brand-primary-light rounded-lg"><PenTool className="w-5 h-5 text-brand-primary" /></div>
                    <span className="truncate">{request.title}</span>
                  </DialogTitle>
                  <DialogDescription>{request.documentName} - {catLabels[request.documentCategory]}</DialogDescription>
                </DialogHeader>

                {/* Action bar */}
                {(isActiveRequest || request.status === 'draft') && (
                  <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/50 rounded-lg border">
                    {currentUserSigner && (
                      <>
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); handleSign(request.id, currentUserSigner.id); }}>
                          <PenTool className="w-3.5 h-3.5 mr-1.5" /> Sign Now
                        </Button>
                        <Button size="sm" variant="destructive" onClick={(e) => {
                          e.stopPropagation();
                          setDeclineTarget({ requestId: request.id, signerId: currentUserSigner.id });
                          setDeclineDialogOpen(true);
                        }}>
                          <XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline
                        </Button>
                      </>
                    )}
                    {isActiveRequest && hasPendingSigners && (
                      <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleSendReminder(request.id); }}>
                        <Bell className="w-3.5 h-3.5 mr-1.5" /> Send Reminder
                      </Button>
                    )}
                    {request.status === 'draft' && (
                      <Button size="sm" onClick={(e) => { e.stopPropagation(); handleSendDraft(request.id); }}>
                        <Send className="w-3.5 h-3.5 mr-1.5" /> Send for Signing
                      </Button>
                    )}
                    {isActiveRequest && (
                      <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={(e) => { e.stopPropagation(); handleVoid(request.id); }}>
                        <Ban className="w-3.5 h-3.5 mr-1.5" /> Void
                      </Button>
                    )}
                  </div>
                )}

                <Tabs defaultValue="signers" className="mt-4">
                  <TabsList>
                    <TabsTrigger value="signers">Signers ({request.signers.length})</TabsTrigger>
                    <TabsTrigger value="audit">Audit Trail ({auditEntries.length})</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  <TabsContent value="signers" className="mt-4 space-y-2">
                    {request.signers.length === 0 ? (
                      <EmptyState
                        icon={<PenTool className="w-8 h-8 text-muted-foreground" />}
                        title="No signers added"
                        description="Add signers to this draft before sending."
                      />
                    ) : (
                      request.signers.map((signer) => {
                        const user = reads.getUser(signer.userId);
                        const ssc = signerStatusConfig[signer.status];
                        const canSign = signer.userId === currentUser.id && (signer.status === 'pending' || signer.status === 'viewed') && isActiveRequest;
                        return (
                          <div key={signer.id} className={`flex items-center justify-between p-3 rounded-lg border ${canSign ? 'border-brand-primary bg-brand-primary-light/20' : ''}`}>
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-brand-primary-light text-brand-primary text-xs flex items-center justify-center shrink-0">{signer.order}</span>
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs ${
                                signer.status === 'signed' ? 'bg-brand-success text-white' : signer.status === 'declined' ? 'bg-brand-error text-white' : 'bg-muted text-muted-foreground'
                              }`}>
                                {user?.firstName[0]}{user?.lastName[0]}
                              </div>
                              <div>
                                <p className="text-sm">{user?.firstName} {user?.lastName}</p>
                                <p className="text-xs text-muted-foreground">{user?.email}</p>
                              </div>
                            </div>
                            <div className="text-right flex items-center gap-2">
                              <div>
                                <Badge variant="outline" className={`text-xs border-0 ${ssc.color}`}>{ssc.label}</Badge>
                                {signer.signedAt && (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    {new Date(signer.signedAt).toLocaleString()} · {signer.signatureType}
                                  </p>
                                )}
                                {signer.declinedReason && (
                                  <p className="text-[10px] text-brand-error mt-1 max-w-48 truncate" title={signer.declinedReason}>
                                    {signer.declinedReason}
                                  </p>
                                )}
                                {signer.viewedAt && !signer.signedAt && signer.status !== 'declined' && (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    Viewed {new Date(signer.viewedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                              {canSign && (
                                <Button size="sm" className="ml-2" onClick={(e) => { e.stopPropagation(); handleSign(request.id, signer.id); }}>
                                  <PenTool className="w-3 h-3 mr-1" /> Sign
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </TabsContent>

                  <TabsContent value="audit" className="mt-4">
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                      <div className="space-y-3">
                        {auditEntries.map(entry => {
                          const user = reads.getUser(entry.userId);
                          const actionColors: Record<string, string> = {
                            created: 'bg-brand-primary-light',
                            sent: 'bg-brand-primary-light',
                            viewed: 'bg-brand-warning-light',
                            signed: 'bg-brand-success-light',
                            declined: 'bg-brand-error-light',
                            completed: 'bg-brand-success',
                            reminder_sent: 'bg-brand-warning-light',
                            expired: 'bg-muted',
                          };
                          return (
                            <div key={entry.id} className="relative pl-10">
                              <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-background ${actionColors[entry.action] || 'bg-muted'}`} />
                              <div className="p-3 rounded-lg border">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm capitalize">{entry.action.replace(/_/g, ' ')}</span>
                                    <span className="text-xs text-muted-foreground">by {user?.firstName} {user?.lastName}</span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{new Date(entry.timestamp).toLocaleString()}</span>
                                </div>
                                {entry.details && <p className="text-xs text-muted-foreground mt-1">{entry.details}</p>}
                                {entry.ipAddress && <p className="text-[10px] text-muted-foreground mt-0.5">IP: {entry.ipAddress}</p>}
                              </div>
                            </div>
                          );
                        })}
                        {auditEntries.length === 0 && (
                          <EmptyState
                            icon={<FileText className="w-8 h-8 text-muted-foreground" />}
                            title="No audit trail"
                            description="Activity will appear here once the document is sent."
                          />
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="mt-4 space-y-3">
                    {[
                      { label: 'Status', value: sc.label },
                      { label: 'Category', value: catLabels[request.documentCategory] },
                      { label: 'Created By', value: `${creator?.firstName} ${creator?.lastName}` },
                      { label: 'Created', value: new Date(request.createdAt).toLocaleString() },
                      { label: 'Expires', value: request.expiresAt ? new Date(request.expiresAt).toLocaleString() : 'No expiry' },
                      { label: 'Completed', value: request.completedAt ? new Date(request.completedAt).toLocaleString() : 'Not yet' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <span className="text-sm">{item.value}</span>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Decline Confirmation Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-brand-error" /> Decline Document
            </DialogTitle>
            <DialogDescription>Please provide a reason for declining this document. The sender will be notified.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <Textarea
              placeholder="Enter your reason for declining..."
              value={declineReason}
              onChange={e => setDeclineReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setDeclineDialogOpen(false); setDeclineReason(''); }}>Cancel</Button>
              <Button variant="destructive" disabled={!declineReason.trim()} onClick={handleDecline}>
                <XCircle className="w-4 h-4 mr-2" /> Confirm Decline
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═══ Create Signature Request Dialog ═══ */}
      <Dialog open={createDialogOpen} onOpenChange={(open) => { setCreateDialogOpen(open); if (!open) resetCreateForm(); }}>
        <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-brand-primary-light rounded-lg"><Plus className="w-5 h-5 text-brand-primary" /></div>
              New Signature Request
            </DialogTitle>
            <DialogDescription>Create a document signing request and select signers from your company.</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-5">
            {/* Document Details */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Document Details</p>
              <div className="space-y-2">
                <Label htmlFor="esign-title">Title *</Label>
                <Input
                  id="esign-title"
                  placeholder="e.g. Employment Contract - John Doe"
                  value={createTitle}
                  onChange={e => setCreateTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="esign-docname">Document File Name *</Label>
                <Input
                  id="esign-docname"
                  placeholder="e.g. contract_john_doe.pdf"
                  value={createDocName}
                  onChange={e => setCreateDocName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={createCategory} onValueChange={(v) => setCreateCategory(v as SignatureRequest['documentCategory'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(catLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Signer Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Select Signers *</p>
                <Badge variant="outline" className="text-xs">{createSignerIds.length} selected</Badge>
              </div>
              <div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
                {availableUsers.map(user => {
                  if (!user) return null;
                  const isSelected = createSignerIds.includes(user.id);
                  return (
                    <label
                      key={user.id}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${isSelected ? 'bg-brand-primary-light/30' : 'hover:bg-muted/50'}`}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleSigner(user.id)}
                      />
                      <div className="w-8 h-8 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center text-xs shrink-0">
                        {user.firstName[0]}{user.lastName[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] capitalize shrink-0">{user.role}</Badge>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Signing Order */}
            {createSignerIds.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Signing Order</p>
                <div className="border rounded-lg divide-y">
                  {createSignerIds.map((userId, idx) => {
                    const user = reads.getUser(userId);
                    if (!user) return null;
                    return (
                      <div key={userId} className="flex items-center gap-3 p-3">
                        <span className="w-6 h-6 rounded-full bg-brand-primary-light text-brand-primary text-xs flex items-center justify-center shrink-0">{idx + 1}</span>
                        <div className="w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs shrink-0">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{user.firstName} {user.lastName}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === 0} onClick={() => moveSignerUp(idx)}>
                            <ChevronRight className="w-3.5 h-3.5 -rotate-90" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={idx === createSignerIds.length - 1} onClick={() => moveSignerDown(idx)}>
                            <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-brand-error" onClick={() => toggleSigner(userId)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary */}
            {createTitle.trim() && createSignerIds.length > 0 && (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <p className="text-sm">Summary</p>
                <p className="text-xs text-muted-foreground">
                  "{createTitle.trim()}" ({catLabels[createCategory]}) will be sent to {createSignerIds.length} signer{createSignerIds.length > 1 ? 's' : ''} with a 30-day expiry.
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2 border-t">
              <Button variant="outline" onClick={() => { setCreateDialogOpen(false); resetCreateForm(); }}>
                Cancel
              </Button>
              <Button
                variant="outline"
                disabled={!createTitle.trim() || !createDocName.trim() || createSignerIds.length === 0}
                onClick={() => handleCreate(false)}
              >
                <FileText className="w-4 h-4 mr-2" /> Save as Draft
              </Button>
              <Button
                disabled={!createTitle.trim() || !createDocName.trim() || createSignerIds.length === 0}
                onClick={() => handleCreate(true)}
              >
                <Send className="w-4 h-4 mr-2" /> Send for Signing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}