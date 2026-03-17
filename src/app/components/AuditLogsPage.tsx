import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Shield, Search, Clock, User, Building2, ArrowRight, Filter,
} from 'lucide-react';

export function AuditLogsPage() {
  const { auditLogs, reads, session } = useAppStore('auditLogs', 'session');
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');

  const modules = [...new Set(auditLogs.map(l => l.module))];

  const filtered = auditLogs.filter(l => {
    const matchesSearch = !search || `${l.userName} ${l.action} ${l.details}`.toLowerCase().includes(search.toLowerCase());
    const matchesModule = moduleFilter === 'all' || l.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  const moduleColors: Record<string, string> = {
    Leave: 'text-brand-primary bg-brand-primary-light',
    HR: 'text-brand-success bg-brand-success-light',
    Platform: 'text-brand-warning bg-brand-warning-light',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Audit Logs</h1>
        <p className="text-muted-foreground">Complete activity trail across the platform</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Module" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Modules</SelectItem>
            {modules.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-primary" />
            Activity Timeline
          </CardTitle>
          <CardDescription>{filtered.length} log entries</CardDescription>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-sm text-muted-foreground">No audit logs found</p>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {filtered.map(log => {
                  const company = log.companyId ? reads.getCompany(log.companyId) : null;
                  return (
                    <div key={log.id} className="relative pl-10">
                      <div className={`absolute left-2.5 w-3 h-3 rounded-full border-2 border-background ${moduleColors[log.module] || 'bg-muted'}`} />
                      <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm">{log.action}</p>
                              <Badge variant="outline" className={`text-xs border-0 ${moduleColors[log.module] || ''}`}>
                                {log.module}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{log.details}</p>
                            {log.oldValue && log.newValue && (
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="text-brand-error">{log.oldValue}</span>
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="text-brand-success">{log.newValue}</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right text-xs text-muted-foreground shrink-0 ml-4">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <p className="mt-0.5">{new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><User className="w-3 h-3" /> {log.userName}</span>
                          {company && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {company.name}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
