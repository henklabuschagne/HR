import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAppStore } from '../hooks/useAppStore';
import { esignReads } from '../lib/esignStore';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { ScrollArea } from './ui/scroll-area';
import {
  LayoutDashboard, Calendar, ClipboardList, Users, FileText,
  BarChart3, Settings, LogOut, Bell, CheckCircle2, Building2,
  UserCircle, Briefcase, Shield, ChevronRight, Clock, Menu, X,
  UserPlus, Target, BookOpen, PenTool, DollarSign, PieChart,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
  roles?: string[];
}

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, unreadCount, notifications, actions, reads } = useAppStore('session', 'notifications', 'leaveRequests');
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { currentUser, activeCompanyId } = session;
  const activeCompany = reads.getCompany(activeCompanyId);
  const pendingApprovals = reads.getPendingApprovals(currentUser.id);
  const pendingEsignatures = esignReads.getPendingSignatures(currentUser.id).length;

  const mainNav: NavItem[] = [
    { label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/dashboard' },
    { label: 'My Leave', icon: <Calendar className="w-5 h-5" />, path: '/my-leave' },
    { label: 'My Performance', icon: <Target className="w-5 h-5" />, path: '/my-performance' },
    { label: 'Team Calendar', icon: <Users className="w-5 h-5" />, path: '/team-calendar' },
    { label: 'Approvals', icon: <CheckCircle2 className="w-5 h-5" />, path: '/approvals', badge: pendingApprovals.length || undefined },
    { label: 'My Profile', icon: <UserCircle className="w-5 h-5" />, path: '/profile' },
    { label: 'Documents', icon: <FileText className="w-5 h-5" />, path: '/documents' },
  ];

  const adminNav: NavItem[] = [
    { label: 'Employees', icon: <Briefcase className="w-5 h-5" />, path: '/employees', roles: ['admin', 'owner'] },
    { label: 'Onboarding', icon: <UserPlus className="w-5 h-5" />, path: '/onboarding', roles: ['admin', 'owner'] },
    { label: 'Leave Models', icon: <ClipboardList className="w-5 h-5" />, path: '/leave-models', roles: ['admin', 'owner'] },
    { label: 'Holidays', icon: <Calendar className="w-5 h-5" />, path: '/holidays', roles: ['admin', 'owner'] },
    { label: 'Performance', icon: <Target className="w-5 h-5" />, path: '/performance', roles: ['admin', 'owner'] },
    { label: 'Policies', icon: <BookOpen className="w-5 h-5" />, path: '/policies', roles: ['admin', 'owner'] },
    { label: 'E-Signatures', icon: <PenTool className="w-5 h-5" />, path: '/e-signatures', roles: ['admin', 'owner'], badge: pendingEsignatures || undefined },
    { label: 'Payroll', icon: <DollarSign className="w-5 h-5" />, path: '/payroll', roles: ['admin', 'owner'] },
    { label: 'Reports', icon: <BarChart3 className="w-5 h-5" />, path: '/reports', roles: ['admin', 'owner'] },
    { label: 'Analytics', icon: <PieChart className="w-5 h-5" />, path: '/analytics', roles: ['admin', 'owner'] },
  ];

  const ownerNav: NavItem[] = [
    { label: 'Companies', icon: <Building2 className="w-5 h-5" />, path: '/companies', roles: ['owner'] },
    { label: 'Audit Logs', icon: <Shield className="w-5 h-5" />, path: '/audit-logs', roles: ['owner', 'admin'] },
    { label: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/settings', roles: ['owner', 'admin'] },
  ];

  const visibleAdminNav = adminNav.filter(item => !item.roles || item.roles.includes(currentUser.role));
  const visibleOwnerNav = ownerNav.filter(item => !item.roles || item.roles.includes(currentUser.role));

  const handleLogout = () => { navigate('/login'); };

  const handleMarkAllRead = () => { actions.markAllNotificationsRead(currentUser.id); };

  const isActive = (path: string) => location.pathname === path;

  const renderNavItem = (item: NavItem) => (
    <button
      key={item.path}
      onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors w-full text-left ${
        isActive(item.path)
          ? 'bg-brand-primary-light text-brand-primary'
          : 'text-foreground/80 hover:bg-muted hover:text-foreground'
      }`}
    >
      <span className={isActive(item.path) ? 'text-brand-primary' : 'text-muted-foreground'}>{item.icon}</span>
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <Badge variant="destructive" className="text-xs px-1.5 py-0.5 min-w-[20px] text-center">
          {item.badge}
        </Badge>
      )}
    </button>
  );

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-border">
        <h2 className="text-brand-main flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <span>Leave & HR</span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">{currentUser.firstName} {currentUser.lastName}</p>
        <Badge variant="outline" className="mt-1 text-xs capitalize">{currentUser.role}</Badge>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto space-y-1">
        {mainNav.map(renderNavItem)}

        {visibleAdminNav.length > 0 && (
          <>
            <div className="my-4 border-t border-border" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider px-4 py-2">Administration</p>
            {visibleAdminNav.map(renderNavItem)}
          </>
        )}

        {visibleOwnerNav.length > 0 && (
          <>
            <div className="my-4 border-t border-border" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider px-4 py-2">Platform</p>
            {visibleOwnerNav.map(renderNavItem)}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-foreground/80 hover:text-foreground hover:bg-muted transition-colors w-full"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
          Log Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden lg:flex w-64 bg-white h-screen flex-col border-r border-border">
        {sidebarContent}
      </aside>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <aside className="relative w-72 bg-white h-screen flex flex-col shadow-xl">
            <button onClick={() => setMobileMenuOpen(false)} className="absolute top-4 right-4 p-1 rounded-md hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border bg-white flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden p-1.5 rounded-md hover:bg-muted">
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>{activeCompany?.name}</span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground">{location.pathname.split('/')[1]?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover open={showNotifications} onOpenChange={setShowNotifications}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-error text-white text-[10px] rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-3 border-b">
                  <h4 className="text-sm">Notifications</h4>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-xs text-brand-primary hover:underline">
                      Mark all read
                    </button>
                  )}
                </div>
                <ScrollArea className="max-h-80">
                  {notifications.length === 0 ? (
                    <p className="text-center py-8 text-sm text-muted-foreground">No notifications</p>
                  ) : (
                    notifications.slice(0, 10).map(n => (
                      <div
                        key={n.id}
                        className={`px-3 py-2.5 border-b last:border-0 cursor-pointer hover:bg-muted/50 ${!n.isRead ? 'bg-brand-primary-light/50' : ''}`}
                        onClick={() => {
                          if (!n.isRead) actions.markNotificationRead(n.id);
                          if (n.link) { navigate(n.link); setShowNotifications(false); }
                        }}
                      >
                        <div className="flex items-start gap-2">
                          {!n.isRead && <div className="w-2 h-2 rounded-full bg-brand-primary mt-1.5 shrink-0" />}
                          <div className={!n.isRead ? '' : 'ml-4'}>
                            <p className="text-sm">{n.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(n.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-sm">
              {currentUser.firstName[0]}{currentUser.lastName[0]}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
