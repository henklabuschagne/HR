import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Shield, UserCog, User, Calendar, Loader2, ChevronDown, ChevronUp, Building2 } from 'lucide-react';
import type { UserRole } from '../lib/types';

interface UserInfo {
  id: string;
  name: string;
  email: string;
  department: string;
  jobTitle: string;
}

const roleConfig: { role: UserRole; label: string; description: string; icon: React.ReactNode; permissions: string[] }[] = [
  {
    role: 'owner',
    label: 'Application Owner',
    description: 'Global platform owner with full access to all companies and settings.',
    icon: <Shield className="w-6 h-6 text-brand-primary" />,
    permissions: ['Manage all companies', 'Global settings & security', 'View cross-company analytics', 'Audit log access'],
  },
  {
    role: 'admin',
    label: 'HR Admin',
    description: 'Company-level HR administrator managing employees and leave policies.',
    icon: <UserCog className="w-6 h-6 text-brand-success" />,
    permissions: ['Manage employees', 'Configure leave models', 'Run reports', 'Approve/adjust balances'],
  },
  {
    role: 'user',
    label: 'Employee',
    description: 'Standard employee with self-service access. Also acts as a manager for direct reports.',
    icon: <User className="w-6 h-6 text-brand-warning" />,
    permissions: ['Request & track leave', 'View team calendar', 'Approve direct reports', 'Personal profile'],
  },
];

const usersByRole: Record<UserRole, UserInfo[]> = {
  owner: [
    { id: 'u1', name: 'Sarah Mitchell', email: 'sarah.mitchell@acmecorp.com', department: 'Executive', jobTitle: 'CEO' },
  ],
  admin: [
    { id: 'u2', name: 'James Chen', email: 'james.chen@acmecorp.com', department: 'HR', jobTitle: 'HR Director' },
    { id: 'u7', name: 'Anna Johnson', email: 'anna.johnson@acmecorp.com', department: 'HR', jobTitle: 'HR Manager' },
  ],
  user: [
    { id: 'u3', name: 'Emily Watson', email: 'emily.watson@acmecorp.com', department: 'Implementation', jobTitle: 'Senior Implementation Consultant' },
    { id: 'u4', name: 'Michael Brown', email: 'michael.brown@acmecorp.com', department: 'Development', jobTitle: 'Development Manager' },
    { id: 'u9', name: 'Natalie Cruz', email: 'natalie.cruz@acmecorp.com', department: 'Product', jobTitle: 'Senior Product Manager' },
    { id: 'u10', name: 'Marcus Webb', email: 'marcus.webb@acmecorp.com', department: 'DevOps', jobTitle: 'Senior DevOps Engineer' },
    { id: 'u5', name: 'Lisa Park', email: 'lisa.park@acmecorp.com', department: 'Marketing', jobTitle: 'Marketing Lead' },
    { id: 'u6', name: 'David Kim', email: 'david.kim@acmecorp.com', department: 'DevOps', jobTitle: 'DevOps Engineer' },
    { id: 'u8', name: 'Robert Taylor', email: 'robert.taylor@acmecorp.com', department: 'Finance', jobTitle: 'Financial Analyst' },
  ],
};

export function LoginPage() {
  const navigate = useNavigate();
  const { actions } = useAppStore('session');
  const [loading, setLoading] = useState<string | null>(null);
  const [expandedRole, setExpandedRole] = useState<UserRole | null>('user');

  const handleLoginAsUser = async (userId: string) => {
    setLoading(userId);
    const user = actions.loginAsUser(userId);
    setLoading(null);
    if (user) {
      navigate('/dashboard');
    }
  };

  const toggleRole = (role: UserRole) => {
    setExpandedRole(prev => prev === role ? null : role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-primary-light to-brand-secondary-light">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-3xl text-brand-main mb-2">Leave & HR Manager</h1>
          <p className="text-muted-foreground">A premium multi-company leave and HR platform</p>
        </div>

        <div className="space-y-4">
          {roleConfig.map(({ role, label, description, icon, permissions }) => {
            const users = usersByRole[role];
            const isExpanded = expandedRole === role;

            return (
              <Card key={role} className="border-2 hover:border-brand-primary transition-colors overflow-hidden">
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-brand-primary-light/50 transition-colors"
                  onClick={() => toggleRole(role)}
                >
                  <div className="w-12 h-12 bg-brand-primary-light rounded-full flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-brand-main">{label}</h3>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                        {users.length} {users.length === 1 ? 'user' : 'users'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{description}</p>
                  </div>
                  <div className="shrink-0 text-muted-foreground">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t">
                    {/* Permissions strip */}
                    <div className="px-4 py-2 bg-muted/30 border-b">
                      <div className="flex flex-wrap gap-2">
                        {permissions.map(p => (
                          <span key={p} className="text-xs text-muted-foreground flex items-center gap-1">
                            <div className="w-1 h-1 rounded-full bg-brand-primary" />
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* User list */}
                    <div className="divide-y">
                      {users.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-4 px-4 py-3 hover:bg-brand-primary-light/30 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-brand-secondary-light flex items-center justify-center shrink-0">
                            <span className="text-sm text-brand-primary">
                              {user.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-brand-main truncate">{user.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Building2 className="w-3 h-3" />
                              <span className="truncate">{user.department} · {user.jobTitle}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <Button
                            size="sm"
                            className="shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLoginAsUser(user.id);
                            }}
                            disabled={loading !== null}
                          >
                            {loading === user.id ? (
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                            ) : null}
                            Login
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-brand-primary-light rounded-lg border border-brand-secondary max-w-xl mx-auto">
          <p className="text-sm text-brand-main mb-1">Demo Mode</p>
          <p className="text-xs text-muted-foreground">
            Select any user above to log in. Each role has different permissions. All data is stored in-memory.
          </p>
        </div>
      </div>
    </div>
  );
}
