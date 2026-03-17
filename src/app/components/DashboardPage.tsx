import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { useNavigate } from 'react-router';
import {
  Calendar, Users, Clock, CheckCircle2, AlertCircle, TrendingUp,
  ArrowRight, Building2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

export function DashboardPage() {
  const navigate = useNavigate();
  const { session, leaveRequests, leaveBalances, employmentRecords, reads, users, departments } = useAppStore(
    'session', 'leaveRequests', 'leaveBalances', 'employmentRecords', 'departments'
  );
  const { currentUser, activeCompanyId } = session;
  const isManager = currentUser.role === 'admin' || currentUser.role === 'owner';

  // User's active employment for this company
  const userER = employmentRecords.find(er => er.userId === currentUser.id && er.companyId === activeCompanyId);

  // Leave balances for current employment
  const balances = userER ? reads.getUserLeaveBalances(userER.id) : [];

  // My pending requests
  const myRequests = reads.getLeaveRequestsForUser(currentUser.id, activeCompanyId);
  const myPending = myRequests.filter(r => ['submitted', 'pending_manager', 'pending_admin'].includes(r.status));

  // Pending approvals (manager/admin)
  const pendingApprovals = reads.getPendingApprovals(currentUser.id);

  // Company stats
  const companyEmployees = reads.getCompanyEmployees(activeCompanyId);
  const companyRequests = reads.getCompanyLeaveRequests(activeCompanyId);
  const upcomingLeave = reads.getUpcomingLeave(activeCompanyId);
  const approvedThisMonth = companyRequests.filter(r => r.status === 'approved' && r.approvedAt && r.approvedAt.startsWith('2026-03')).length;

  // Leave by type for chart
  const leaveByType = balances.map((b, idx) => {
    const lt = reads.getLeaveType(b.leaveTypeId);
    return { name: lt?.name || `Leave ${idx + 1}`, used: b.used, available: b.available, color: lt?.color || '#456E92', id: b.id };
  }).filter((item, idx, arr) => arr.findIndex(a => a.name === item.name) === idx);

  // Department breakdown
  const deptData = reads.getDepartmentsForCompany(activeCompanyId)
    .map((d, idx) => ({
      id: d.id,
      name: d.name,
      employees: d.employeeCount,
    }))
    .filter(d => d.employees > 0);

  const statusColors: Record<string, string> = {
    approved: 'text-brand-success bg-brand-success-light',
    pending_manager: 'text-brand-warning bg-brand-warning-light',
    pending_admin: 'text-brand-warning bg-brand-warning-light',
    submitted: 'text-brand-primary bg-brand-primary-light',
    rejected: 'text-brand-error bg-brand-error-light',
    cancelled: 'text-muted-foreground bg-muted',
  };

  const company = reads.getCompany(activeCompanyId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">
            {isManager ? 'Dashboard' : `Welcome back, ${currentUser.firstName}`}
          </h1>
          <p className="text-muted-foreground">
            {isManager
              ? `Overview for ${company?.name} - ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
              : `Here's your leave overview for ${company?.name}`
            }
          </p>
        </div>
        <Button onClick={() => navigate('/my-leave')} className="hidden sm:flex">
          <Calendar className="w-4 h-4 mr-2" />
          Request Leave
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {!isManager ? (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-primary-light rounded-lg">
                    <Calendar className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Available Days</p>
                    <p className="text-2xl">{balances.reduce((sum, b) => sum + b.available, 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-success-light rounded-lg">
                    <CheckCircle2 className="w-6 h-6 text-brand-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Days Used</p>
                    <p className="text-2xl">{balances.reduce((sum, b) => sum + b.used, 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-warning-light rounded-lg">
                    <Clock className="w-6 h-6 text-brand-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Requests</p>
                    <p className="text-2xl">{myPending.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-error-light rounded-lg">
                    <AlertCircle className="w-6 h-6 text-brand-error" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">To Approve</p>
                    <p className="text-2xl">{pendingApprovals.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-primary-light rounded-lg">
                    <Users className="w-6 h-6 text-brand-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Employees</p>
                    <p className="text-2xl">{companyEmployees.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-warning-light rounded-lg">
                    <Clock className="w-6 h-6 text-brand-warning" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Approvals</p>
                    <p className="text-2xl">{pendingApprovals.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-success-light rounded-lg">
                    <TrendingUp className="w-6 h-6 text-brand-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approved This Month</p>
                    <p className="text-2xl">{approvedThisMonth}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-brand-secondary-light rounded-lg">
                    <Calendar className="w-6 h-6 text-brand-secondary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Out Today</p>
                    <p className="text-2xl">{upcomingLeave.filter(r => {
                      const today = new Date().toISOString().split('T')[0];
                      return r.startDate <= today && r.endDate >= today;
                    }).length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Charts + Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Balance Chart */}
        {!isManager && leaveByType.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>My Leave Balances</CardTitle>
              <CardDescription>Usage breakdown by leave type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={leaveByType} id="dashboard-leave-balance">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                  <Tooltip />
                  <Bar dataKey="used" name="Used" stackId="a" fill="#AB5A5C" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="available" name="Available" stackId="a" fill="#456E92" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Dept breakdown for admin */}
        {isManager && deptData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Department Headcount</CardTitle>
              <CardDescription>Employee distribution across departments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart id="dashboard-dept-headcount">
                  <Pie data={deptData} dataKey="employees" nameKey="name" cx="50%" cy="45%" outerRadius={85} innerRadius={40} paddingAngle={2} label={false}>
                    {deptData.map((d) => (
                      <Cell key={d.id} fill={['#456E92', '#5F966C', '#CEA569', '#AB5A5C', '#7AA2C0', '#092E50', '#8B5CF6', '#10B981'][deptData.indexOf(d) % 8]} />
                    ))}
                  </Pie>
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                  <Tooltip formatter={(value: number, name: string) => [`${value} employees`, name]} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Pending Approvals Quick View */}
        {pendingApprovals.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>{pendingApprovals.length} request(s) awaiting your decision</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/approvals')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingApprovals.slice(0, 4).map(req => {
                  const user = reads.getUser(req.userId);
                  const lt = reads.getLeaveType(req.leaveTypeId);
                  return (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-primary-light flex items-center justify-center text-sm text-brand-primary">
                          {user?.firstName[0]}{user?.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{lt?.name} - {req.totalDays} day(s)</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        <Badge variant="outline" className={`text-xs mt-1 ${statusColors[req.status] || ''}`}>
                          {req.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>{isManager ? 'Recent Leave Requests' : 'My Recent Requests'}</CardTitle>
              <CardDescription>Latest leave activity</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/my-leave')}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(isManager ? companyRequests : myRequests).slice(0, 5).map(req => {
                const user = reads.getUser(req.userId);
                const lt = reads.getLeaveType(req.leaveTypeId);
                return (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lt?.color || '#456E92' }} />
                      <div>
                        {isManager && <p className="text-sm">{user?.firstName} {user?.lastName}</p>}
                        <p className="text-xs text-muted-foreground">{lt?.name} - {req.totalDays} day(s)</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-xs ${statusColors[req.status] || ''}`}>
                      {req.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                );
              })}
              {(isManager ? companyRequests : myRequests).length === 0 && (
                <p className="text-center py-6 text-sm text-muted-foreground">No leave requests yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Who's Out - Upcoming */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Who's Out</CardTitle>
              <CardDescription>Upcoming approved leave</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/team-calendar')}>
              Calendar <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingLeave.slice(0, 5).map(req => {
                const user = reads.getUser(req.userId);
                const lt = reads.getLeaveType(req.leaveTypeId);
                return (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-success-light flex items-center justify-center text-sm text-brand-success">
                        {user?.firstName[0]}{user?.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{lt?.name}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                );
              })}
              {upcomingLeave.length === 0 && (
                <p className="text-center py-6 text-sm text-muted-foreground">No one is out soon</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}