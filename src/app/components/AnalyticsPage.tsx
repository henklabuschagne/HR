import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAppStore } from '../hooks/useAppStore';
import { additionalReads } from '../lib/additionalStore';
import { esignReads } from '../lib/esignStore';
import { payrollReads } from '../lib/payrollStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  BarChart3, Users, TrendingUp, TrendingDown, Calendar,
  Target, CheckCircle2, Clock, AlertCircle, Download,
  PenTool, Link2, FileText, ExternalLink,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RPieChart, Pie, Cell, Area, AreaChart,
} from 'recharts';

const COLORS = ['#0ea5e9', '#f97316', '#10b981', '#f43f5e', '#8b5cf6', '#eab308', '#14b8a6', '#ec4899'];

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">{icon}</div>
      <h3 className="text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
    </div>
  );
}

function StatCard({ icon, iconBg, label, value, subtitle, onClick }: { icon: React.ReactNode; iconBg: string; label: string; value: string | number; subtitle?: string; onClick?: () => void }) {
  return (
    <Card className={onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''} onClick={onClick}>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl">{value}</p>
          {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
        </div>
        {onClick && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
      </CardContent>
    </Card>
  );
}

export function AnalyticsPage() {
  const { session, reads } = useAppStore('session', 'leaveRequests', 'employmentRecords', 'users');
  const { activeCompanyId } = session;
  const company = reads.getCompany(activeCompanyId);
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState<string>('6');

  const companyEmployees = reads.getCompanyEmployees(activeCompanyId);
  const companyRequests = reads.getCompanyLeaveRequests(activeCompanyId);
  const departments = reads.getDepartmentsForCompany(activeCompanyId);
  const leaveTypes = reads.getLeaveTypesForCompany(activeCompanyId);

  // Performance data
  const reviewCycles = additionalReads.getReviewCyclesForCompany(activeCompanyId);
  const goals = additionalReads.getGoalsForCompany(activeCompanyId);
  const feedback = additionalReads.getAllFeedback(activeCompanyId);
  const onboardings = additionalReads.getEmployeeOnboardings(activeCompanyId);
  const policies = additionalReads.getPoliciesForCompany(activeCompanyId);
  const acks = additionalReads.getCompanyAcknowledgments(activeCompanyId);

  // E-Sign data
  const esignRequests = esignReads.getSignatureRequestsForCompany(activeCompanyId);

  // Payroll data
  const payrollIntegrations = payrollReads.getIntegrationsForCompany(activeCompanyId);
  const payrollSyncLogs = payrollReads.getSyncLogsForCompany(activeCompanyId);
  const payrollExports = payrollReads.getExportsForCompany(activeCompanyId);

  const months = parseInt(dateRange);

  // ─── Workforce Analytics ─────────────────
  const activeEmployees = companyEmployees.filter(e => e.isActive).length;
  const onProbation = companyEmployees.filter(e => e.isOnProbation).length;
  const deptData = departments.map(d => ({ name: d.name, count: d.employeeCount }));
  const typeBreakdown = companyEmployees.reduce<Record<string, number>>((acc, e) => {
    acc[e.employmentType] = (acc[e.employmentType] || 0) + 1;
    return acc;
  }, {});
  const typeData = Object.entries(typeBreakdown).map(([name, value]) => ({ name: name.replace('-', ' '), value }));

  // Tenure distribution
  const tenureData = useMemo(() => {
    const now = new Date(2026, 2, 10);
    const buckets = { '< 6 mo': 0, '6-12 mo': 0, '1-2 yr': 0, '2+ yr': 0 };
    companyEmployees.forEach(e => {
      const start = new Date(e.startDate);
      const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      if (diffMonths < 6) buckets['< 6 mo']++;
      else if (diffMonths < 12) buckets['6-12 mo']++;
      else if (diffMonths < 24) buckets['1-2 yr']++;
      else buckets['2+ yr']++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [companyEmployees]);

  // ─── Leave Analytics (filtered by date range) ─────────
  const leaveData = useMemo(() => {
    const approved = companyRequests.filter(r => r.status === 'approved');
    const totalLeaveDays = approved.reduce((sum, r) => sum + r.totalDays, 0);
    const avgLeaveDays = activeEmployees > 0 ? (totalLeaveDays / activeEmployees).toFixed(1) : '0';
    const pending = companyRequests.filter(r => ['pending_manager', 'pending_admin', 'submitted'].includes(r.status)).length;

    const monthlyLeave = Array.from({ length: months }, (_, i) => {
      const d = new Date(2026, 2 - i, 1);
      const monthStr = d.toLocaleString('en-US', { month: 'short' });
      const monthApproved = approved.filter(r => {
        const rd = new Date(r.startDate);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      });
      return { month: monthStr, days: monthApproved.reduce((s, r) => s + r.totalDays, 0) };
    }).reverse();

    const leaveByType = leaveTypes.map(lt => ({
      name: lt.name,
      count: approved.filter(r => r.leaveTypeId === lt.id).length,
      days: approved.filter(r => r.leaveTypeId === lt.id).reduce((s, r) => s + r.totalDays, 0),
      color: lt.color,
    })).filter(l => l.count > 0);

    // Leave by department
    const leaveByDept = departments.map(dept => {
      const deptEmployees = companyEmployees.filter(e => e.department === dept.name);
      const deptUserIds = deptEmployees.map(e => e.userId);
      const deptDays = approved.filter(r => deptUserIds.includes(r.userId)).reduce((s, r) => s + r.totalDays, 0);
      return { name: dept.name, days: deptDays };
    }).filter(d => d.days > 0);

    return { approved, totalLeaveDays, avgLeaveDays, pending, monthlyLeave, leaveByType, leaveByDept };
  }, [companyRequests, activeEmployees, months, leaveTypes, departments, companyEmployees]);

  // ─── Performance Analytics ───────────────
  const activeReviewCycles = reviewCycles.filter(rc => rc.status === 'active');
  const completedReviews = reviewCycles.reduce((s, rc) => s + rc.completedCount, 0);
  const totalReviews = reviewCycles.reduce((s, rc) => s + rc.reviewCount, 0);
  const goalsInProgress = goals.filter(g => g.status === 'in_progress').length;
  const goalsCompleted = goals.filter(g => g.status === 'completed').length;
  const avgProgress = goals.length > 0 ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length) : 0;
  const goalsByStatus = [
    { name: 'In Progress', value: goalsInProgress, color: '#0ea5e9' },
    { name: 'Completed', value: goalsCompleted, color: '#10b981' },
    { name: 'Not Started', value: goals.filter(g => g.status === 'not_started').length, color: '#94a3b8' },
    { name: 'Cancelled', value: goals.filter(g => g.status === 'cancelled').length, color: '#f43f5e' },
  ].filter(g => g.value > 0);

  // Rating distribution
  const ratingDistribution = useMemo(() => {
    const reviews = additionalReads.getReviewCyclesForCompany(activeCompanyId);
    const allReviews = reviews.flatMap(rc => additionalReads.getReviewsForCycle(rc.id));
    const completed = allReviews.filter(r => r.overallRating);
    const dist = [1, 2, 3, 4, 5].map(rating => ({
      rating: `${rating} Star${rating > 1 ? 's' : ''}`,
      count: completed.filter(r => r.overallRating === rating).length,
    }));
    return dist;
  }, [activeCompanyId]);

  // ─── Onboarding Analytics ────────────────
  const activeOnboardings = onboardings.filter(o => o.status === 'in_progress');
  const avgOnboardingCompletion = activeOnboardings.length > 0
    ? Math.round(activeOnboardings.reduce((s, o) => s + o.completionPercent, 0) / activeOnboardings.length)
    : 0;

  // ─── Policy Analytics ───────────────────
  const publishedPolicies = policies.filter(p => p.status === 'published').length;
  const acknowledgedCount = acks.filter(a => a.status === 'acknowledged').length;
  const overdueCount = acks.filter(a => a.status === 'overdue').length;
  const pendingAckCount = acks.filter(a => a.status === 'pending').length;
  const complianceRate = acks.length > 0 ? Math.round((acknowledgedCount / acks.length) * 100) : 0;

  // ─── E-Sign Analytics ──────────────────
  const esignCompleted = esignRequests.filter(r => r.status === 'signed').length;
  const esignPending = esignRequests.filter(r => ['sent', 'viewed', 'partially_signed'].includes(r.status)).length;
  const esignDeclined = esignRequests.filter(r => r.status === 'declined').length;
  const esignTotalSigners = esignRequests.reduce((s, r) => s + r.signers.length, 0);
  const esignSignedSigners = esignRequests.reduce((s, r) => s + r.signers.filter(sg => sg.status === 'signed').length, 0);
  const esignCompletionRate = esignTotalSigners > 0 ? Math.round((esignSignedSigners / esignTotalSigners) * 100) : 0;

  const esignByCategory = useMemo(() => {
    const cats: Record<string, number> = {};
    esignRequests.forEach(r => { cats[r.documentCategory] = (cats[r.documentCategory] || 0) + 1; });
    return Object.entries(cats).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
    }));
  }, [esignRequests]);

  // ─── Payroll Analytics ─────────────────
  const connectedProviders = payrollIntegrations.filter(i => i.isConnected).length;
  const successSyncs = payrollSyncLogs.filter(l => l.status === 'success').length;
  const failedSyncs = payrollSyncLogs.filter(l => l.status === 'failed').length;
  const totalRecordsSynced = payrollSyncLogs.reduce((s, l) => s + l.recordsSynced, 0);

  const handleExport = () => {
    toast.success('Report export started', {
      description: 'Your analytics report is being generated and will download shortly.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl mb-1">Advanced Analytics</h1>
          <p className="text-muted-foreground">HR insights and metrics for {company?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Last 3 months</SelectItem>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" /> Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workforce">
        <TabsList className="flex-wrap">
          <TabsTrigger value="workforce">Workforce</TabsTrigger>
          <TabsTrigger value="leave">Leave</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="operations">HR Operations</TabsTrigger>
          <TabsTrigger value="esign">E-Signatures</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        {/* ═══ WORKFORCE ═══ */}
        <TabsContent value="workforce" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-5 h-5 text-brand-primary" />} iconBg="bg-brand-primary-light" label="Total Headcount" value={activeEmployees} onClick={() => navigate('/employees')} />
            <StatCard icon={<TrendingUp className="w-5 h-5 text-brand-success" />} iconBg="bg-brand-success-light" label="On Probation" value={onProbation} onClick={() => navigate('/employees')} />
            <StatCard icon={<BarChart3 className="w-5 h-5 text-brand-warning" />} iconBg="bg-brand-warning-light" label="Departments" value={departments.length} />
            <StatCard icon={<Target className="w-5 h-5 text-purple-500" />} iconBg="bg-purple-50" label="Employment Types" value={Object.keys(typeBreakdown).length} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Headcount by Department</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/employees')}>
                    View Employees <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {deptData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={deptData} layout="vertical" id="analytics-dept">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={<Users className="w-8 h-8 text-muted-foreground" />} title="No departments" description="Department data will appear once configured." />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Employment Type Breakdown</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                {typeData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <RPieChart id="analytics-emp-type">
                      <Pie data={typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </RPieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={<BarChart3 className="w-8 h-8 text-muted-foreground" />} title="No employee data" description="Employee type distribution will appear here." />
                )}
              </CardContent>
            </Card>
          </div>
          {/* Tenure Distribution */}
          <Card>
            <CardHeader><CardTitle className="text-base">Tenure Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={tenureData} id="analytics-tenure">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Employees" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ LEAVE ═══ */}
        <TabsContent value="leave" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Calendar className="w-5 h-5 text-brand-primary" />} iconBg="bg-brand-primary-light" label="Total Leave Days" value={leaveData.totalLeaveDays} />
            <StatCard icon={<TrendingDown className="w-5 h-5 text-brand-warning" />} iconBg="bg-brand-warning-light" label="Avg Days/Employee" value={leaveData.avgLeaveDays} />
            <StatCard icon={<Clock className="w-5 h-5 text-orange-500" />} iconBg="bg-orange-50" label="Pending Requests" value={leaveData.pending} onClick={() => navigate('/approvals')} />
            <StatCard icon={<CheckCircle2 className="w-5 h-5 text-brand-success" />} iconBg="bg-brand-success-light" label="Approved" value={leaveData.approved.length} onClick={() => navigate('/my-leave')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Leave Trend (Last {months} Months)</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/my-leave')}>
                    View Leave <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={leaveData.monthlyLeave} id="analytics-leave-trend">
                    <defs>
                      <linearGradient id="leaveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="days" stroke="#0ea5e9" fill="url(#leaveGrad)" name="Leave Days" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Leave by Type</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {leaveData.leaveByType.map(lt => (
                    <div key={lt.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: lt.color }} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">{lt.name}</span>
                          <span className="text-xs text-muted-foreground">{lt.days} days ({lt.count} requests)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div className="h-2 rounded-full transition-all" style={{ width: `${leaveData.totalLeaveDays > 0 ? (lt.days / leaveData.totalLeaveDays * 100) : 0}%`, backgroundColor: lt.color }} />
                        </div>
                      </div>
                    </div>
                  ))}
                  {leaveData.leaveByType.length === 0 && (
                    <EmptyState icon={<Calendar className="w-8 h-8 text-muted-foreground" />} title="No leave data" description="Approved leave data will appear here." />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Leave by Department */}
          {leaveData.leaveByDept.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Leave Days by Department</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={leaveData.leaveByDept} id="analytics-leave-dept">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="days" fill="#f97316" radius={[4, 4, 0, 0]} name="Leave Days" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ PERFORMANCE ═══ */}
        <TabsContent value="performance" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Target className="w-5 h-5 text-brand-primary" />} iconBg="bg-brand-primary-light" label="Active Review Cycles" value={activeReviewCycles.length} onClick={() => navigate('/performance')} />
            <StatCard icon={<CheckCircle2 className="w-5 h-5 text-brand-success" />} iconBg="bg-brand-success-light" label="Reviews Completed" value={`${completedReviews}/${totalReviews}`} onClick={() => navigate('/performance')} />
            <StatCard icon={<TrendingUp className="w-5 h-5 text-brand-warning" />} iconBg="bg-brand-warning-light" label="Goals in Progress" value={goalsInProgress} onClick={() => navigate('/performance')} />
            <StatCard icon={<BarChart3 className="w-5 h-5 text-purple-500" />} iconBg="bg-purple-50" label="Avg Goal Progress" value={`${avgProgress}%`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Review Cycle Progress</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/performance')}>
                    View Reviews <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {reviewCycles.length > 0 ? (
                  <div className="space-y-4">
                    {reviewCycles.map(rc => {
                      const pct = rc.reviewCount > 0 ? Math.round((rc.completedCount / rc.reviewCount) * 100) : 0;
                      return (
                        <div key={rc.id}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{rc.name}</span>
                              <Badge variant="outline" className="text-[10px] capitalize">{rc.type}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-[10px] border-0 ${rc.status === 'active' ? 'text-brand-success bg-brand-success-light' : rc.status === 'completed' ? 'text-brand-primary bg-brand-primary-light' : 'text-muted-foreground bg-muted'}`}>{rc.status}</Badge>
                              <span className="text-xs text-muted-foreground">{rc.completedCount}/{rc.reviewCount}</span>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="h-2 rounded-full bg-brand-primary transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState icon={<Target className="w-8 h-8 text-muted-foreground" />} title="No review cycles" description="Performance review data will appear here." />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Goals by Status</CardTitle></CardHeader>
              <CardContent className="flex items-center justify-center">
                {goalsByStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <RPieChart id="analytics-goals-status">
                      <Pie data={goalsByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {goalsByStatus.map((g, i) => <Cell key={i} fill={g.color} />)}
                      </Pie>
                      <Tooltip />
                    </RPieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={<BarChart3 className="w-8 h-8 text-muted-foreground" />} title="No goals" description="Goal tracking data will appear here." />
                )}
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Rating Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ratingDistribution} id="analytics-rating-dist">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Reviews" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Feedback Activity</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: 'Praise', count: feedback.filter(f => f.type === 'praise').length, color: 'text-brand-success' },
                    { label: 'Coaching', count: feedback.filter(f => f.type === 'coaching').length, color: 'text-brand-primary' },
                    { label: 'Warnings', count: feedback.filter(f => f.type === 'warning').length, color: 'text-brand-error' },
                    { label: 'Notes', count: feedback.filter(f => f.type === 'note').length, color: 'text-muted-foreground' },
                  ].map(item => (
                    <div key={item.label} className="text-center p-4 bg-muted rounded-lg">
                      <p className={`text-2xl ${item.color}`}>{item.count}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ HR OPERATIONS ═══ */}
        <TabsContent value="operations" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Users className="w-5 h-5 text-brand-primary" />} iconBg="bg-brand-primary-light" label="Active Onboardings" value={activeOnboardings.length} onClick={() => navigate('/onboarding')} />
            <StatCard icon={<CheckCircle2 className="w-5 h-5 text-brand-success" />} iconBg="bg-brand-success-light" label="Policy Compliance" value={`${complianceRate}%`} onClick={() => navigate('/policies')} />
            <StatCard icon={<AlertCircle className="w-5 h-5 text-brand-error" />} iconBg="bg-brand-error-light" label="Overdue Acknowledgments" value={overdueCount} onClick={() => navigate('/policies')} />
            <StatCard icon={<BarChart3 className="w-5 h-5 text-brand-warning" />} iconBg="bg-brand-warning-light" label="Published Policies" value={publishedPolicies} onClick={() => navigate('/policies')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Onboarding Progress</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/onboarding')}>
                    View All <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {activeOnboardings.length > 0 ? (
                  <div className="space-y-4">
                    {activeOnboardings.map(ob => {
                      const user = reads.getUser(ob.userId);
                      return (
                        <div key={ob.id} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-primary-light text-brand-primary flex items-center justify-center text-xs">
                            {user?.firstName[0]}{user?.lastName[0]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm">{user?.firstName} {user?.lastName}</span>
                              <span className="text-xs text-muted-foreground">{ob.completionPercent}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${ob.completionPercent >= 75 ? 'bg-brand-success' : ob.completionPercent >= 50 ? 'bg-brand-warning' : 'bg-brand-primary'}`} style={{ width: `${ob.completionPercent}%` }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState icon={<Users className="w-8 h-8 text-muted-foreground" />} title="No active onboardings" description="Active onboarding progress will appear here." />
                )}
                <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg Onboarding Completion</span>
                  <span className="text-sm">{avgOnboardingCompletion}%</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Policy Compliance Overview</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/policies')}>
                    View Policies <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center mb-4">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={complianceRate >= 80 ? '#10b981' : complianceRate >= 60 ? '#f97316' : '#f43f5e'} strokeWidth="3" strokeDasharray={`${complianceRate}, 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl">{complianceRate}%</span>
                      <span className="text-[10px] text-muted-foreground">Compliance</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-brand-success-light rounded-lg">
                    <p className="text-sm text-brand-success">{acknowledgedCount}</p>
                    <p className="text-[10px] text-muted-foreground">Acknowledged</p>
                  </div>
                  <div className="p-2 bg-brand-warning-light rounded-lg">
                    <p className="text-sm text-brand-warning">{pendingAckCount}</p>
                    <p className="text-[10px] text-muted-foreground">Pending</p>
                  </div>
                  <div className="p-2 bg-brand-error-light rounded-lg">
                    <p className="text-sm text-brand-error">{overdueCount}</p>
                    <p className="text-[10px] text-muted-foreground">Overdue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ E-SIGNATURES ═══ */}
        <TabsContent value="esign" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<PenTool className="w-5 h-5 text-brand-primary" />} iconBg="bg-brand-primary-light" label="Total Requests" value={esignRequests.length} onClick={() => navigate('/e-signatures')} />
            <StatCard icon={<CheckCircle2 className="w-5 h-5 text-brand-success" />} iconBg="bg-brand-success-light" label="Completed" value={esignCompleted} onClick={() => navigate('/e-signatures')} />
            <StatCard icon={<Clock className="w-5 h-5 text-brand-warning" />} iconBg="bg-brand-warning-light" label="Awaiting Signatures" value={esignPending} onClick={() => navigate('/e-signatures')} />
            <StatCard icon={<Target className="w-5 h-5 text-purple-500" />} iconBg="bg-purple-50" label="Completion Rate" value={`${esignCompletionRate}%`} subtitle={`${esignSignedSigners}/${esignTotalSigners} signers`} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Documents by Category</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/e-signatures')}>
                    View All <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                {esignByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <RPieChart id="analytics-esign-category">
                      <Pie data={esignByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {esignByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </RPieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={<PenTool className="w-8 h-8 text-muted-foreground" />} title="No documents" description="E-signature document data will appear here." />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Signature Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Completed', value: esignCompleted, total: esignRequests.length, color: 'bg-brand-success', textColor: 'text-brand-success' },
                    { label: 'Pending', value: esignPending, total: esignRequests.length, color: 'bg-brand-warning', textColor: 'text-brand-warning' },
                    { label: 'Declined', value: esignDeclined, total: esignRequests.length, color: 'bg-brand-error', textColor: 'text-brand-error' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{item.label}</span>
                        <span className={`text-sm ${item.textColor}`}>{item.value} <span className="text-muted-foreground text-xs">/ {item.total}</span></span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className={`h-2.5 rounded-full ${item.color} transition-all`} style={{ width: `${item.total > 0 ? (item.value / item.total * 100) : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-xl text-brand-primary">{esignTotalSigners}</p>
                    <p className="text-xs text-muted-foreground">Total Signers</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <p className="text-xl text-brand-success">{esignSignedSigners}</p>
                    <p className="text-xs text-muted-foreground">Signatures Collected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ PAYROLL ═══ */}
        <TabsContent value="payroll" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<Link2 className="w-5 h-5 text-brand-primary" />} iconBg="bg-brand-primary-light" label="Connected Providers" value={`${connectedProviders}/${payrollIntegrations.length}`} onClick={() => navigate('/payroll')} />
            <StatCard icon={<CheckCircle2 className="w-5 h-5 text-brand-success" />} iconBg="bg-brand-success-light" label="Successful Syncs" value={successSyncs} onClick={() => navigate('/payroll')} />
            <StatCard icon={<AlertCircle className="w-5 h-5 text-brand-error" />} iconBg="bg-brand-error-light" label="Failed Syncs" value={failedSyncs} onClick={() => navigate('/payroll')} />
            <StatCard icon={<FileText className="w-5 h-5 text-brand-warning" />} iconBg="bg-brand-warning-light" label="Total Exports" value={payrollExports.length} onClick={() => navigate('/payroll')} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Sync History</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/payroll')}>
                    View All <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {payrollSyncLogs.length > 0 ? (
                  <div className="space-y-2">
                    {payrollSyncLogs.slice(0, 8).map(log => {
                      const statusColors: Record<string, string> = {
                        success: 'bg-brand-success',
                        failed: 'bg-brand-error',
                        partial: 'bg-brand-warning',
                      };
                      return (
                        <div key={log.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full ${statusColors[log.status] || 'bg-muted'}`} />
                            <div>
                              <p className="text-sm capitalize">{log.syncType} sync</p>
                              <p className="text-xs text-muted-foreground">{log.recordsSynced} records · {log.triggeredBy}</p>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(log.startedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState icon={<Link2 className="w-8 h-8 text-muted-foreground" />} title="No sync history" description="Payroll sync data will appear here." />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Provider Overview</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {payrollIntegrations.map(integ => (
                    <div key={integ.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{({'quickbooks':'🟢','xero':'🔵','sage':'🟡','adp':'🔴','paychex':'🟠','custom':'⚙️'} as Record<string,string>)[integ.provider]}</span>
                        <div>
                          <p className="text-sm">{integ.providerName}</p>
                          <p className="text-xs text-muted-foreground">{integ.syncedEmployees}/{integ.totalEmployees} employees synced</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs border-0 ${integ.isConnected ? 'text-brand-success bg-brand-success-light' : 'text-muted-foreground bg-muted'}`}>
                        {integ.isConnected ? 'Connected' : 'Disconnected'}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-3 bg-muted rounded-lg flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Records Synced</span>
                  <span className="text-sm">{totalRecordsSynced.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}