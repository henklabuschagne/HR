import { createBrowserRouter, redirect } from 'react-router';
import { LoginPage } from './components/LoginPage';
import { AppLayout } from './components/AppLayout';
import { DashboardPage } from './components/DashboardPage';
import { MyLeavePage } from './components/MyLeavePage';
import { ApprovalsPage } from './components/ApprovalsPage';
import { TeamCalendarPage } from './components/TeamCalendarPage';
import { ProfilePage } from './components/ProfilePage';
import { DocumentsPage } from './components/DocumentsPage';
import { EmployeesPage } from './components/EmployeesPage';
import { LeaveModelsPage } from './components/LeaveModelsPage';
import { HolidaysPage } from './components/HolidaysPage';
import { ReportsPage } from './components/ReportsPage';
import { CompaniesPage } from './components/CompaniesPage';
import { AuditLogsPage } from './components/AuditLogsPage';
import { SettingsPage } from './components/SettingsPage';
import { OnboardingPage } from './components/OnboardingPage';
import { PerformancePage } from './components/PerformancePage';
import { MyPerformancePage } from './components/MyPerformancePage';
import { PoliciesPage } from './components/PoliciesPage';
import { ESignaturesPage } from './components/ESignaturesPage';
import { PayrollPage } from './components/PayrollPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ErrorBoundary, RootErrorBoundary } from './components/ErrorBoundary';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
    ErrorBoundary: RootErrorBoundary,
  },
  {
    path: '/',
    Component: AppLayout,
    ErrorBoundary: RootErrorBoundary,
    children: [
      { index: true, loader: () => redirect('/login') },
      { path: 'dashboard', Component: DashboardPage, ErrorBoundary },
      { path: 'my-leave', Component: MyLeavePage, ErrorBoundary },
      { path: 'approvals', Component: ApprovalsPage, ErrorBoundary },
      { path: 'team-calendar', Component: TeamCalendarPage, ErrorBoundary },
      { path: 'my-performance', Component: MyPerformancePage, ErrorBoundary },
      { path: 'profile', Component: ProfilePage, ErrorBoundary },
      { path: 'documents', Component: DocumentsPage, ErrorBoundary },
      { path: 'employees', Component: EmployeesPage, ErrorBoundary },
      { path: 'leave-models', Component: LeaveModelsPage, ErrorBoundary },
      { path: 'holidays', Component: HolidaysPage, ErrorBoundary },
      { path: 'reports', Component: ReportsPage, ErrorBoundary },
      { path: 'companies', Component: CompaniesPage, ErrorBoundary },
      { path: 'audit-logs', Component: AuditLogsPage, ErrorBoundary },
      { path: 'settings', Component: SettingsPage, ErrorBoundary },
      { path: 'onboarding', Component: OnboardingPage, ErrorBoundary },
      { path: 'performance', Component: PerformancePage, ErrorBoundary },
      { path: 'policies', Component: PoliciesPage, ErrorBoundary },
      { path: 'e-signatures', Component: ESignaturesPage, ErrorBoundary },
      { path: 'payroll', Component: PayrollPage, ErrorBoundary },
      { path: 'analytics', Component: AnalyticsPage, ErrorBoundary },
    ],
  },
]);