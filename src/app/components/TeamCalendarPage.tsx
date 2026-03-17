import { useState, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChevronLeft, ChevronRight, Calendar, Users } from 'lucide-react';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function TeamCalendarPage() {
  const { session, leaveRequests, holidays, reads } = useAppStore('session', 'leaveRequests', 'holidays', 'employmentRecords');
  const { activeCompanyId } = session;

  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2)); // March 2026
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const departments = reads.getDepartmentsForCompany(activeCompanyId);
  const companyHolidays = reads.getHolidaysForCompany(activeCompanyId);

  // Get approved/pending leave for the month
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  const monthStartStr = monthStart.toISOString().split('T')[0];
  const monthEndStr = monthEnd.toISOString().split('T')[0];

  const relevantRequests = leaveRequests.filter(r =>
    r.companyId === activeCompanyId &&
    ['approved', 'pending_manager', 'pending_admin', 'submitted'].includes(r.status) &&
    r.startDate <= monthEndStr && r.endDate >= monthStartStr
  );

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const startPad = firstDay.getDay();

    // Previous month padding
    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(firstDay);
      d.setDate(d.getDate() - i - 1);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i), isCurrentMonth: true });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));

  const getLeaveForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return relevantRequests.filter(r => r.startDate <= dateStr && r.endDate >= dateStr);
  };

  const getHolidayForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return companyHolidays.find(h => h.date === dateStr);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
  };

  const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;

  // Who's out today
  const today = new Date().toISOString().split('T')[0];
  const outToday = leaveRequests.filter(r =>
    r.companyId === activeCompanyId && r.status === 'approved' && r.startDate <= today && r.endDate >= today
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Team Calendar</h1>
          <p className="text-muted-foreground">See who's out and upcoming team leave</p>
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => (
              <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Who's Out Today */}
      {outToday.length > 0 && (
        <Card className="border-l-4 border-l-brand-warning">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-5 h-5 text-brand-warning" />
              <p className="text-sm">Out Today ({outToday.length})</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {outToday.map(req => {
                const user = reads.getUser(req.userId);
                const lt = reads.getLeaveType(req.leaveTypeId);
                return (
                  <div key={req.id} className="flex items-center gap-2 px-3 py-1.5 bg-brand-warning-light rounded-full">
                    <div className="w-6 h-6 rounded-full bg-brand-warning text-white text-xs flex items-center justify-center">
                      {user?.firstName[0]}{user?.lastName[0]}
                    </div>
                    <span className="text-sm">{user?.firstName} {user?.lastName}</span>
                    <span className="text-xs text-muted-foreground">({lt?.name})</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calendar */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={prevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h3>{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-brand-success-light border border-brand-success-mid" /> Approved</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-brand-warning-light border border-brand-warning-mid" /> Pending</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-brand-error-light border border-brand-error-mid" /> Holiday</div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {DAY_NAMES.map(d => (
              <div key={d} className="text-xs text-muted-foreground text-center py-2">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-px">
            {calendarDays.map((day, idx) => {
              const dayLeave = getLeaveForDate(day.date);
              const holiday = getHolidayForDate(day.date);
              const weekend = isWeekend(day.date);
              const todayFlag = isToday(day.date);

              return (
                <div
                  key={idx}
                  className={`min-h-[80px] p-1 border rounded-md ${
                    !day.isCurrentMonth ? 'opacity-30' :
                    holiday ? 'bg-brand-error-light' :
                    weekend ? 'bg-muted/50' :
                    todayFlag ? 'bg-brand-primary-light border-brand-primary' :
                    'bg-white'
                  }`}
                >
                  <div className={`text-xs mb-1 ${todayFlag ? 'text-brand-primary' : 'text-muted-foreground'}`}>
                    {day.date.getDate()}
                  </div>
                  {holiday && (
                    <div className="text-[10px] text-brand-error truncate px-1 py-0.5 bg-brand-error-light rounded mb-0.5">
                      {holiday.name}
                    </div>
                  )}
                  {dayLeave.slice(0, 2).map(req => {
                    const user = reads.getUser(req.userId);
                    const isApproved = req.status === 'approved';
                    return (
                      <div
                        key={req.id}
                        className={`text-[10px] truncate px-1 py-0.5 rounded mb-0.5 ${
                          isApproved ? 'bg-brand-success-light text-brand-success' : 'bg-brand-warning-light text-brand-warning'
                        }`}
                      >
                        {user?.firstName} {user?.lastName[0]}.
                      </div>
                    );
                  })}
                  {dayLeave.length > 2 && (
                    <div className="text-[10px] text-muted-foreground px-1">+{dayLeave.length - 2} more</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Leave List */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Leave</CardTitle>
          <CardDescription>Approved leave in the next 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {relevantRequests.filter(r => r.status === 'approved').length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No upcoming leave scheduled</p>
          ) : (
            <div className="space-y-2">
              {relevantRequests.filter(r => r.status === 'approved').map(req => {
                const user = reads.getUser(req.userId);
                const lt = reads.getLeaveType(req.leaveTypeId);
                return (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-success-light text-brand-success flex items-center justify-center text-xs">
                        {user?.firstName[0]}{user?.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{lt?.name} - {req.totalDays} day(s)</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(req.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
