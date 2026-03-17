import { useState, useCallback } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { additionalReads, additionalActions } from '../lib/additionalStore';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import {
  UserPlus, CheckCircle2, Clock, AlertCircle, ChevronRight,
  Briefcase, FileText, Shield, Monitor, BookOpen, Handshake,
  LogOut as LogOutIcon, Package,
} from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  document: <FileText className="w-4 h-4" />,
  training: <BookOpen className="w-4 h-4" />,
  access: <Shield className="w-4 h-4" />,
  equipment: <Monitor className="w-4 h-4" />,
  introduction: <Handshake className="w-4 h-4" />,
  policy: <BookOpen className="w-4 h-4" />,
  knowledge: <BookOpen className="w-4 h-4" />,
  payroll: <Briefcase className="w-4 h-4" />,
  exit: <LogOutIcon className="w-4 h-4" />,
};

const statusColors: Record<string, string> = {
  pending: 'text-brand-warning bg-brand-warning-light',
  in_progress: 'text-brand-primary bg-brand-primary-light',
  completed: 'text-brand-success bg-brand-success-light',
  overdue: 'text-brand-error bg-brand-error-light',
  not_started: 'text-muted-foreground bg-muted',
  cancelled: 'text-muted-foreground bg-muted',
};

export function OnboardingPage() {
  const { session, reads } = useAppStore('session', 'employmentRecords', 'users');
  const { activeCompanyId } = session;
  const company = reads.getCompany(activeCompanyId);

  const templates = additionalReads.getOnboardingTemplatesForCompany(activeCompanyId);
  const activeOnboardings = additionalReads.getEmployeeOnboardings(activeCompanyId);
  const offboardings = additionalReads.getOffboardingWorkflows(activeCompanyId);

  const [selectedOnboarding, setSelectedOnboarding] = useState<string | null>(null);
  const [selectedOffboarding, setSelectedOffboarding] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [, forceUpdate] = useState(0);

  const completeOnboardingTask = useCallback((onboardingId: string, taskId: string) => {
    const result = additionalActions.completeOnboardingTask(onboardingId, taskId, session.currentUser.id);
    forceUpdate(v => v + 1);
    if (result) toast.success('Task marked as complete');
    else toast.error('Failed to complete task');
  }, [session.currentUser.id]);

  const completeOffboardingTask = useCallback((offboardingId: string, taskId: string) => {
    const result = additionalActions.completeOffboardingTask(offboardingId, taskId);
    forceUpdate(v => v + 1);
    if (result) toast.success('Task marked as complete');
    else toast.error('Failed to complete task');
  }, []);

  const onboarding = selectedOnboarding ? activeOnboardings.find(o => o.id === selectedOnboarding) : null;
  const offboarding = selectedOffboarding ? offboardings.find(o => o.id === selectedOffboarding) : null;
  const template = selectedTemplate ? templates.find(t => t.id === selectedTemplate) : null;

  const totalActive = activeOnboardings.filter(o => o.status === 'in_progress').length;
  const totalOffboarding = offboardings.filter(o => o.status === 'in_progress').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Onboarding & Offboarding</h1>
          <p className="text-muted-foreground">Manage employee lifecycle for {company?.name}</p>
        </div>
        <Button>
          <UserPlus className="w-4 h-4 mr-2" />
          Start Onboarding
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-primary-light rounded-lg"><UserPlus className="w-5 h-5 text-brand-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Active Onboardings</p>
              <p className="text-xl">{totalActive}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-warning-light rounded-lg"><LogOutIcon className="w-5 h-5 text-brand-warning" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Active Offboardings</p>
              <p className="text-xl">{totalOffboarding}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-success-light rounded-lg"><Package className="w-5 h-5 text-brand-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Templates</p>
              <p className="text-xl">{templates.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-brand-error-light rounded-lg"><AlertCircle className="w-5 h-5 text-brand-error" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue Tasks</p>
              <p className="text-xl">
                {activeOnboardings.reduce((sum, o) => sum + o.tasks.filter(t => t.status === 'overdue').length, 0) +
                  offboardings.reduce((sum, o) => sum + o.tasks.filter(t => t.status === 'overdue').length, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="onboarding">
        <TabsList>
          <TabsTrigger value="onboarding">Onboarding ({activeOnboardings.length})</TabsTrigger>
          <TabsTrigger value="offboarding">Offboarding ({offboardings.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        {/* Active Onboardings */}
        <TabsContent value="onboarding" className="mt-4 space-y-4">
          {activeOnboardings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <UserPlus className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No active onboardings</p>
              </CardContent>
            </Card>
          ) : (
            activeOnboardings.map(ob => {
              const user = reads.getUser(ob.userId);
              const er = reads.getEmploymentRecord(ob.employmentRecordId);
              const tmpl = additionalReads.getOnboardingTemplate(ob.templateId);
              const completedTasks = ob.tasks.filter(t => t.status === 'completed').length;
              return (
                <Card key={ob.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedOnboarding(ob.id)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary">
                          {user?.firstName[0]}{user?.lastName[0]}
                        </div>
                        <div>
                          <p>{user?.firstName} {user?.lastName}</p>
                          <p className="text-sm text-muted-foreground">{er?.jobTitle} - {er?.department}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Template: {tmpl?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-xs border-0 ${statusColors[ob.status]}`}>
                          {ob.status.replace(/_/g, ' ')}
                        </Badge>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">{completedTasks} of {ob.tasks.length} tasks</span>
                        <span className="text-brand-primary">{ob.completionPercent}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full bg-brand-primary transition-all" style={{ width: `${ob.completionPercent}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Offboarding */}
        <TabsContent value="offboarding" className="mt-4 space-y-4">
          {offboardings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <LogOutIcon className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">No active offboardings</p>
              </CardContent>
            </Card>
          ) : (
            offboardings.map(ob => {
              const user = reads.getUser(ob.userId);
              const er = reads.getEmploymentRecord(ob.employmentRecordId);
              const completedTasks = ob.tasks.filter(t => t.status === 'completed').length;
              return (
                <Card key={ob.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-brand-warning" onClick={() => setSelectedOffboarding(ob.id)}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-brand-warning-light flex items-center justify-center text-brand-warning">
                          {user?.firstName[0]}{user?.lastName[0]}
                        </div>
                        <div>
                          <p>{user?.firstName} {user?.lastName}</p>
                          <p className="text-sm text-muted-foreground">{er?.jobTitle} - {er?.department}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-xs capitalize">{ob.reason.replace(/_/g, ' ')}</Badge>
                            <span className="text-xs text-muted-foreground">Last day: {new Date(ob.lastWorkingDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted-foreground">{completedTasks} of {ob.tasks.length} tasks</span>
                        <span className="text-brand-warning">{ob.completionPercent}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full bg-brand-warning transition-all" style={{ width: `${ob.completionPercent}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          {templates.map(tmpl => (
            <Card key={tmpl.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTemplate(tmpl.id)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-primary-light rounded-lg">
                      <Package className="w-6 h-6 text-brand-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3>{tmpl.name}</h3>
                        <Badge variant="outline" className={`text-xs border-0 ${tmpl.isActive ? 'text-brand-success bg-brand-success-light' : 'text-muted-foreground bg-muted'}`}>
                          {tmpl.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{tmpl.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['document', 'training', 'access', 'equipment', 'introduction', 'policy'].map(cat => {
                    const count = tmpl.tasks.filter(t => t.category === cat).length;
                    if (count === 0) return null;
                    return (
                      <div key={cat} className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground">
                        {categoryIcons[cat]}
                        <span className="capitalize">{cat}</span>
                        <span>({count})</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Onboarding Detail Dialog */}
      <Dialog open={!!selectedOnboarding} onOpenChange={() => setSelectedOnboarding(null)}>
        <DialogContent className="sm:max-w-2xl">
          {onboarding && (() => {
            const user = reads.getUser(onboarding.userId);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center text-white">
                      {user?.firstName[0]}{user?.lastName[0]}
                    </div>
                    {user?.firstName} {user?.lastName} - Onboarding
                  </DialogTitle>
                  <DialogDescription>Started {new Date(onboarding.startDate).toLocaleDateString()}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
                  {onboarding.tasks.map(task => (
                    <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg border ${task.status === 'completed' ? 'bg-brand-success-light/30' : task.status === 'overdue' ? 'bg-brand-error-light/30' : ''}`}>
                      <div className={`p-1.5 rounded-lg ${statusColors[task.status] || 'bg-muted'}`}>
                        {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm">{task.title}</p>
                          <Badge variant="outline" className={`text-xs border-0 ${statusColors[task.status]}`}>
                            {task.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {categoryIcons[task.category]}
                          <span className="capitalize">{task.category}</span>
                          <span>Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          {task.completedAt && <span className="text-brand-success">Completed {new Date(task.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                        </div>
                      </div>
                      {task.status !== 'completed' && (
                        <Button size="sm" variant="outline" className="shrink-0" onClick={(e) => { e.stopPropagation(); completeOnboardingTask(onboarding.id, task.id); }}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Offboarding Detail Dialog */}
      <Dialog open={!!selectedOffboarding} onOpenChange={() => setSelectedOffboarding(null)}>
        <DialogContent className="sm:max-w-2xl">
          {offboarding && (() => {
            const user = reads.getUser(offboarding.userId);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-warning flex items-center justify-center text-white">
                      {user?.firstName[0]}{user?.lastName[0]}
                    </div>
                    {user?.firstName} {user?.lastName} - Offboarding
                  </DialogTitle>
                  <DialogDescription>Last working day: {new Date(offboarding.lastWorkingDay).toLocaleDateString()} ({offboarding.reason.replace(/_/g, ' ')})</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 mt-4 max-h-[60vh] overflow-y-auto">
                  {offboarding.tasks.map(task => (
                    <div key={task.id} className={`flex items-start gap-3 p-3 rounded-lg border ${task.status === 'completed' ? 'bg-brand-success-light/30' : ''}`}>
                      <div className={`p-1.5 rounded-lg ${statusColors[task.status] || 'bg-muted'}`}>
                        {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm">{task.title}</p>
                          <Badge variant="outline" className={`text-xs border-0 ${statusColors[task.status]}`}>
                            {task.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {categoryIcons[task.category] || <Briefcase className="w-4 h-4" />}
                          <span className="capitalize">{task.category}</span>
                          <span>Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          {task.ownerId && <span>Owner: {reads.getUserName(task.ownerId)}</span>}
                        </div>
                      </div>
                      {task.status !== 'completed' && (
                        <Button size="sm" variant="outline" className="shrink-0" onClick={(e) => { e.stopPropagation(); completeOffboardingTask(offboarding.id, task.id); }}>
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Complete
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="sm:max-w-2xl">
          {template && (
            <>
              <DialogHeader>
                <DialogTitle>{template.name}</DialogTitle>
                <DialogDescription>{template.description} - {template.tasks.length} tasks</DialogDescription>
              </DialogHeader>
              <div className="space-y-2 mt-4 max-h-[60vh] overflow-y-auto">
                {template.tasks.map((task, idx) => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <span className="w-6 h-6 rounded-full bg-brand-primary-light text-brand-primary text-xs flex items-center justify-center shrink-0">{idx + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm">{task.title}</p>
                        {task.isRequired && <Badge variant="outline" className="text-xs text-brand-error border-brand-error-mid">Required</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {categoryIcons[task.category]}
                        <span className="capitalize">{task.category}</span>
                        <span>Due: {task.dueOffsetDays < 0 ? `${Math.abs(task.dueOffsetDays)} days before start` : task.dueOffsetDays === 0 ? 'Start date' : `${task.dueOffsetDays} days after start`}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}