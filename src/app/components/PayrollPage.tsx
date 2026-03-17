import { useState, useCallback } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { payrollReads, payrollActions } from '../lib/payrollStore';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import {
  RefreshCw, CheckCircle2, AlertCircle, XCircle,
  Download, Link2, Clock, ChevronRight,
  FileSpreadsheet, Loader2, Inbox, Unplug, Plug,
} from 'lucide-react';

const syncStatusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  success: { label: 'Success', color: 'text-brand-success bg-brand-success-light', icon: <CheckCircle2 className="w-3 h-3" /> },
  failed: { label: 'Failed', color: 'text-brand-error bg-brand-error-light', icon: <XCircle className="w-3 h-3" /> },
  partial: { label: 'Partial', color: 'text-brand-warning bg-brand-warning-light', icon: <AlertCircle className="w-3 h-3" /> },
  running: { label: 'Running', color: 'text-brand-primary bg-brand-primary-light', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
  pending: { label: 'Pending', color: 'text-muted-foreground bg-muted', icon: <Clock className="w-3 h-3" /> },
};

const providerLogos: Record<string, string> = {
  quickbooks: '🟢',
  xero: '🔵',
  sage: '🟡',
  adp: '🔴',
  paychex: '🟠',
  custom: '⚙️',
};

const frequencyLabels: Record<string, string> = {
  real_time: 'Real-time',
  nightly: 'Nightly',
  payroll_cycle: 'Payroll Cycle',
  manual: 'Manual',
};

const formatLabels: Record<string, string> = {
  csv: 'CSV',
  excel: 'Excel',
  xml: 'XML',
  json: 'JSON',
};

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">{icon}</div>
      <h3 className="text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}

export function PayrollPage() {
  const { session, reads } = useAppStore('session');
  const { activeCompanyId, currentUser } = session;
  const company = reads.getCompany(activeCompanyId);

  const [, forceUpdate] = useState(0);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<string>('full');
  const [exportFormat, setExportFormat] = useState<string>('csv');

  const integrations = payrollReads.getIntegrationsForCompany(activeCompanyId);
  const syncLogs = payrollReads.getSyncLogsForCompany(activeCompanyId);
  const exports = payrollReads.getExportsForCompany(activeCompanyId);

  const integration = selectedIntegration ? payrollReads.getIntegration(selectedIntegration) : null;
  const integrationLogs = selectedIntegration ? payrollReads.getSyncLogsForIntegration(selectedIntegration) : [];

  const connectedCount = integrations.filter(i => i.isConnected).length;
  const lastSync = syncLogs[0];
  const failedSyncs = syncLogs.filter(l => l.status === 'failed').length;
  const totalRecordsSynced = syncLogs.filter(l => l.status === 'success').reduce((s, l) => s + l.recordsSynced, 0);

  const handleSyncNow = useCallback((integrationId: string) => {
    const integ = payrollReads.getIntegration(integrationId);
    if (!integ) return;
    setSyncing(integrationId);
    const userName = `${currentUser.firstName} ${currentUser.lastName}`;
    // Simulate a brief delay
    setTimeout(() => {
      const log = payrollActions.triggerSync(integrationId, activeCompanyId, userName);
      setSyncing(null);
      forceUpdate(v => v + 1);
      if (log.status === 'success') {
        toast.success('Sync completed successfully', {
          description: `${log.recordsSynced} records synced from ${integ.providerName}.`,
        });
      } else {
        toast.warning('Sync completed with warnings', {
          description: `${log.recordsSynced} synced, ${log.recordsFailed} failed. Check sync logs for details.`,
        });
      }
    }, 1500);
  }, [activeCompanyId, currentUser]);

  const handleToggleSetting = useCallback((integrationId: string, setting: 'syncEmployeeData' | 'syncLeaveData' | 'syncDeductions' | 'autoExport') => {
    payrollActions.toggleSetting(integrationId, setting);
    forceUpdate(v => v + 1);
    const integ = payrollReads.getIntegration(integrationId);
    const newVal = integ?.settings[setting];
    toast.success(`${setting.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} ${newVal ? 'enabled' : 'disabled'}`, {
      description: `Setting updated for ${integ?.providerName}.`,
    });
  }, []);

  const handleGenerateExport = useCallback(() => {
    const userName = `${currentUser.firstName} ${currentUser.lastName}`;
    const exp = payrollActions.generateExport(
      activeCompanyId,
      exportType as any,
      exportFormat as any,
      userName,
    );
    setExportDialogOpen(false);
    forceUpdate(v => v + 1);
    toast.success('Export generated successfully', {
      description: `${exp.recordCount} records exported as ${formatLabels[exp.format]} (${formatFileSize(exp.fileSize)}).`,
    });
  }, [activeCompanyId, currentUser, exportType, exportFormat]);

  const handleDownloadExport = useCallback((exportId: string) => {
    const exp = exports.find(e => e.id === exportId);
    if (!exp) return;
    toast.success('Download started', {
      description: `${exp.exportType.replace(/_/g, ' ')} - ${exp.period} (${formatLabels[exp.format]})`,
    });
  }, [exports]);

  const handleConnectToggle = useCallback((integrationId: string) => {
    const integ = payrollReads.getIntegration(integrationId);
    if (!integ) return;
    if (integ.isConnected) {
      payrollActions.disconnectProvider(integrationId);
      toast.warning(`${integ.providerName} disconnected`, {
        description: 'Sync has been paused. Data will not be updated until reconnected.',
      });
    } else {
      payrollActions.connectProvider(integrationId);
      toast.success(`${integ.providerName} connected`, {
        description: 'You can now configure sync settings and trigger the first sync.',
      });
    }
    forceUpdate(v => v + 1);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Payroll Integration</h1>
          <p className="text-muted-foreground">Sync employee and leave data with payroll for {company?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
            <Download className="w-4 h-4 mr-2" /> New Export
          </Button>
          <Button>
            <Link2 className="w-4 h-4 mr-2" />
            Connect Provider
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-primary-light rounded-lg"><Link2 className="w-5 h-5 text-brand-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Connected Providers</p>
              <p className="text-xl">{connectedCount}/{integrations.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-success-light rounded-lg"><RefreshCw className="w-5 h-5 text-brand-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Last Sync</p>
              <p className="text-sm">{lastSync ? new Date(lastSync.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-error-light rounded-lg"><AlertCircle className="w-5 h-5 text-brand-error" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Failed Syncs</p>
              <p className="text-xl">{failedSyncs}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-warning-light rounded-lg"><Download className="w-5 h-5 text-brand-warning" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Exports</p>
              <p className="text-xl">{exports.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers">
        <TabsList>
          <TabsTrigger value="providers">Providers ({integrations.length})</TabsTrigger>
          <TabsTrigger value="sync-logs">Sync Logs ({syncLogs.length})</TabsTrigger>
          <TabsTrigger value="exports">Exports ({exports.length})</TabsTrigger>
        </TabsList>

        {/* Providers */}
        <TabsContent value="providers" className="mt-4 space-y-4">
          {integrations.length === 0 ? (
            <EmptyState
              icon={<Unplug className="w-8 h-8 text-muted-foreground" />}
              title="No payroll providers"
              description="Connect a payroll provider to begin syncing employee and leave data."
            />
          ) : (
            integrations.map(integ => {
              const lastSyncStatus = integ.lastSyncStatus ? syncStatusConfig[integ.lastSyncStatus] : null;
              const isSyncing = syncing === integ.id;
              return (
                <Card key={integ.id} className={`hover:shadow-md transition-shadow cursor-pointer ${integ.isConnected ? 'border-l-4 border-l-brand-success' : 'border-l-4 border-l-muted'}`} onClick={() => setSelectedIntegration(integ.id)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl">{providerLogos[integ.provider]}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3>{integ.providerName}</h3>
                            <Badge variant="outline" className={`text-xs border-0 ${integ.isConnected ? 'text-brand-success bg-brand-success-light' : 'text-muted-foreground bg-muted'}`}>
                              {integ.isConnected ? 'Connected' : 'Not Connected'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">Frequency: {frequencyLabels[integ.syncFrequency]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {integ.isConnected && (
                          <Button size="sm" variant="outline" disabled={isSyncing} onClick={(e) => { e.stopPropagation(); handleSyncNow(integ.id); }}>
                            {isSyncing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                            {isSyncing ? 'Syncing...' : 'Sync Now'}
                          </Button>
                        )}
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                    {integ.isConnected && (
                      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Synced Employees</p>
                          <p className="text-sm">{integ.syncedEmployees}/{integ.totalEmployees}</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Last Sync</p>
                          <p className="text-sm">{integ.lastSyncAt ? new Date(integ.lastSyncAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}</p>
                        </div>
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Last Status</p>
                          {lastSyncStatus ? (
                            <Badge variant="outline" className={`text-xs border-0 mt-0.5 ${lastSyncStatus.color}`}>
                              {lastSyncStatus.icon} <span className="ml-1">{lastSyncStatus.label}</span>
                            </Badge>
                          ) : <span className="text-sm text-muted-foreground">-</span>}
                        </div>
                        <div className="p-2 bg-muted rounded-lg">
                          <p className="text-xs text-muted-foreground">Connected Since</p>
                          <p className="text-sm">{integ.connectedAt ? new Date(integ.connectedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Sync Logs */}
        <TabsContent value="sync-logs" className="mt-4">
          {syncLogs.length === 0 ? (
            <Card>
              <CardContent className="p-0">
                <EmptyState
                  icon={<RefreshCw className="w-8 h-8 text-muted-foreground" />}
                  title="No sync history"
                  description="Sync logs will appear here after the first data synchronization."
                />
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Records</TableHead>
                        <TableHead className="hidden sm:table-cell">Errors</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Triggered By</TableHead>
                        <TableHead className="hidden md:table-cell">Duration</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {syncLogs.map(log => {
                        const sc = syncStatusConfig[log.status];
                        const duration = log.completedAt
                          ? Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)
                          : null;
                        return (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm">{new Date(log.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs capitalize">{log.syncType}</Badge></TableCell>
                            <TableCell className="text-sm">
                              <span className="text-brand-success">{log.recordsSynced}</span>
                              {log.recordsFailed > 0 && <span className="text-brand-error ml-1">/ {log.recordsFailed} failed</span>}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {log.errors.length > 0 ? (
                                <Badge variant="outline" className="text-xs text-brand-error bg-brand-error-light border-0">{log.errors.length} issue(s)</Badge>
                              ) : (
                                <span className="text-xs text-muted-foreground">None</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs border-0 ${sc.color}`}>
                                {sc.icon} <span className="ml-1">{sc.label}</span>
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{log.triggeredBy}</TableCell>
                            <TableCell className="text-xs text-muted-foreground hidden md:table-cell">{duration ? `${duration}s` : '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Error Details */}
              {syncLogs.some(l => l.errors.length > 0) && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-brand-error" /> Recent Sync Errors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {syncLogs.filter(l => l.errors.length > 0).slice(0, 5).flatMap(l =>
                        l.errors.map((err, i) => (
                          <div key={`${l.id}-${i}`} className={`flex items-start gap-3 p-3 rounded-lg border ${err.severity === 'error' ? 'bg-brand-error-light/30' : 'bg-brand-warning-light/30'}`}>
                            {err.severity === 'error' ? <XCircle className="w-4 h-4 text-brand-error mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 text-brand-warning mt-0.5 shrink-0" />}
                            <div>
                              <p className="text-sm">{err.message}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Field: {err.field} {err.employeeName && `· Employee: ${err.employeeName}`} · {new Date(l.startedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* Exports */}
        <TabsContent value="exports" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Export History</CardTitle>
                <CardDescription>Previously generated payroll exports</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(true)}>
                <Download className="w-4 h-4 mr-2" /> New Export
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {exports.length === 0 ? (
                <EmptyState
                  icon={<FileSpreadsheet className="w-8 h-8 text-muted-foreground" />}
                  title="No exports yet"
                  description="Generate your first payroll export to see it here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Format</TableHead>
                      <TableHead className="hidden sm:table-cell">Records</TableHead>
                      <TableHead className="hidden sm:table-cell">Size</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exports.map(exp => (
                      <TableRow key={exp.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-brand-primary" />
                            <span className="text-sm capitalize">{exp.exportType.replace(/_/g, ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{exp.period}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{formatLabels[exp.format]}</Badge></TableCell>
                        <TableCell className="text-sm hidden sm:table-cell">{exp.recordCount}</TableCell>
                        <TableCell className="text-xs text-muted-foreground hidden sm:table-cell">{formatFileSize(exp.fileSize)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(exp.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          <br /><span className="text-[10px]">{exp.createdBy}</span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDownloadExport(exp.id)}>
                            <Download className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Integration Detail Dialog */}
      <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {integration && (() => {
            const isSyncing = syncing === integration.id;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span className="text-2xl">{providerLogos[integration.provider]}</span>
                    {integration.providerName}
                  </DialogTitle>
                  <DialogDescription>Configure sync settings and data scope</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-3">
                    {([
                      { key: 'syncEmployeeData' as const, label: 'Sync Employee Data', desc: 'ID, salary, tax details, bank account' },
                      { key: 'syncLeaveData' as const, label: 'Sync Leave Data', desc: 'Leave taken, unpaid leave, sick leave' },
                      { key: 'syncDeductions' as const, label: 'Sync Deductions', desc: 'Pay period deductions and bonuses' },
                      { key: 'autoExport' as const, label: 'Auto-Export', desc: 'Automatically export at each payroll cycle' },
                    ]).map(item => (
                      <div key={item.key} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="text-sm">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <Switch
                          checked={integration.settings[item.key]}
                          onCheckedChange={() => handleToggleSetting(integration.id, item.key)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Sync Frequency</p>
                      <p className="text-sm capitalize">{frequencyLabels[integration.syncFrequency]}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant="outline" className={`text-xs mt-0.5 border-0 ${integration.isConnected ? 'text-brand-success bg-brand-success-light' : 'text-muted-foreground bg-muted'}`}>
                        {integration.isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                  </div>

                  {/* Recent sync logs for this integration */}
                  {integrationLogs.length > 0 && (
                    <div>
                      <p className="text-sm mb-2">Recent Sync History</p>
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {integrationLogs.slice(0, 5).map(log => {
                          const sc = syncStatusConfig[log.status];
                          return (
                            <div key={log.id} className="flex items-center justify-between p-2 bg-muted rounded-lg text-xs">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-[10px] border-0 ${sc.color}`}>
                                  {sc.icon} <span className="ml-1">{sc.label}</span>
                                </Badge>
                                <span className="text-muted-foreground capitalize">{log.syncType}</span>
                              </div>
                              <span className="text-muted-foreground">{new Date(log.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {integration.isConnected ? (
                      <>
                        <Button className="flex-1" disabled={isSyncing} onClick={() => handleSyncNow(integration.id)}>
                          {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                          {isSyncing ? 'Syncing...' : 'Sync Now'}
                        </Button>
                        <Button variant="outline" className="flex-1" onClick={() => { setSelectedIntegration(null); setExportDialogOpen(true); }}>
                          <Download className="w-4 h-4 mr-2" /> Export
                        </Button>
                        <Button variant="ghost" size="icon" title="Disconnect" onClick={() => { handleConnectToggle(integration.id); setSelectedIntegration(null); }}>
                          <Unplug className="w-4 h-4 text-brand-error" />
                        </Button>
                      </>
                    ) : (
                      <Button className="flex-1" onClick={() => { handleConnectToggle(integration.id); setSelectedIntegration(null); }}>
                        <Plug className="w-4 h-4 mr-2" /> Connect Provider
                      </Button>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Generate Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-brand-primary" /> Generate Payroll Export
            </DialogTitle>
            <DialogDescription>Configure and download payroll data for the current period.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-sm mb-2">Export Type</p>
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Payroll Data</SelectItem>
                  <SelectItem value="leave_data">Leave Data Only</SelectItem>
                  <SelectItem value="employee_data">Employee Data Only</SelectItem>
                  <SelectItem value="deductions">Deductions Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="text-sm mb-2">Format</p>
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Company</span>
                <span className="text-sm">{company?.name}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-sm text-muted-foreground">Period</span>
                <span className="text-sm">{new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleGenerateExport}>
                <Download className="w-4 h-4 mr-2" /> Generate Export
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
