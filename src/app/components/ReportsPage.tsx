import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import {
  BarChart3, TrendingUp, Users, Calendar, ArrowUpRight,
} from 'lucide-react';

export function ReportsPage() {
  const { session, leaveRequests, employmentRecords, reads, leaveBalances } = useAppStore(
    'session', 'leaveRequests', 'employmentRecords', 'leaveBalances', 'leaveTypes'
  );
  const { activeCompanyId } = session;
  const company = reads.getCompany(activeCompanyId);

  const companyRequests = reads.getCompanyLeaveRequests(activeCompanyId);
  const companyERs = reads.getCompanyEmployees(activeCompanyId);
  const leaveTypes = reads.getLeaveTypesForCompany(activeCompanyId);

  // Leave by type
  const leaveByType = leaveTypes.map((lt, idx) => {
    const count = companyRequests.filter(r => r.leaveTypeId === lt.id && r.status === 'approved').length;
    const days = companyRequests.filter(r => r.leaveTypeId === lt.id && r.status === 'approved')
      .reduce((sum, r) => sum + r.totalDays, 0);
    return { id: lt.id, name: lt.name, requests: count, days, color: lt.color };
  });

  // Status breakdown
  const statusData = [
    { name: 'Approved', value: companyRequests.filter(r => r.status === 'approved').length, color: '#5F966C' },
    { name: 'Pending', value: companyRequests.filter(r => ['submitted', 'pending_manager', 'pending_admin'].includes(r.status)).length, color: '#CEA569' },
    { name: 'Rejected', value: companyRequests.filter(r => r.status === 'rejected').length, color: '#AB5A5C' },
    { name: 'Cancelled', value: companyRequests.filter(r => r.status === 'cancelled').length, color: '#5A7A96' },
  ].filter(d => d.value > 0);

  // Monthly trend (mock)
  const monthlyTrend = [
    { month: 'Jan', requests: 3, approved: 3 },
    { month: 'Feb', requests: 5, approved: 4 },
    { month: 'Mar', requests: 8, approved: 5 },
    { month: 'Apr', requests: 4, approved: 3 },
    { month: 'May', requests: 6, approved: 5 },
    { month: 'Jun', requests: 7, approved: 6 },
  ];

  // Top leave users
  const userLeaveUsage = companyERs.map(er => {
    const user = reads.getUser(er.userId);
    const totalUsed = leaveBalances
      .filter(b => b.employmentRecordId === er.id)
      .reduce((sum, b) => sum + b.used, 0);
    return { id: er.id, name: `${user?.firstName || ''} ${user?.lastName?.[0] || ''}.`, used: totalUsed };
  }).sort((a, b) => b.used - a.used).slice(0, 6);

  const totalDaysUsed = companyRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.totalDays, 0);
  const avgDaysPerEmployee = companyERs.length > 0 ? (totalDaysUsed / companyERs.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Reports & Analytics</h1>
        <p className="text-muted-foreground">Leave analytics and workforce insights for {company?.name}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <BarChart3 className="w-4 h-4 text-brand-primary" />
            </div>
            <p className="text-2xl">{companyRequests.length}</p>
            <p className="text-xs text-brand-success mt-1 flex items-center gap-0.5">
              <ArrowUpRight className="w-3 h-3" /> 12% vs last quarter
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Days Used (Total)</p>
              <Calendar className="w-4 h-4 text-brand-warning" />
            </div>
            <p className="text-2xl">{totalDaysUsed}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Avg Days/Employee</p>
              <TrendingUp className="w-4 h-4 text-brand-success" />
            </div>
            <p className="text-2xl">{avgDaysPerEmployee}</p>
            <p className="text-xs text-muted-foreground mt-1">Current year</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Approval Rate</p>
              <Users className="w-4 h-4 text-brand-secondary" />
            </div>
            <p className="text-2xl">
              {companyRequests.length > 0
                ? Math.round((companyRequests.filter(r => r.status === 'approved').length / companyRequests.length) * 100)
                : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Of all requests</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Days by Type</CardTitle>
            <CardDescription>Total approved days per leave type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leaveByType} id="reports-leave-type">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="days" name="Days" radius={[8, 8, 0, 0]}>
                  {leaveByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Request Status Breakdown</CardTitle>
            <CardDescription>Distribution of leave request statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart id="reports-status-breakdown">
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Leave Trend</CardTitle>
            <CardDescription>Requests and approvals over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend} id="reports-monthly-trend">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="requests" stroke="#456E92" strokeWidth={2} name="Requests" />
                <Line type="monotone" dataKey="approved" stroke="#5F966C" strokeWidth={2} name="Approved" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Leave Users */}
        <Card>
          <CardHeader>
            <CardTitle>Top Leave Users</CardTitle>
            <CardDescription>Employees with highest leave utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userLeaveUsage} layout="vertical" id="reports-top-users">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" width={80} />
                <Tooltip />
                <Bar dataKey="used" name="Days Used" fill="#456E92" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}