import { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  Shield, Bell, Globe, Eye,
  Building2, AlertTriangle, RotateCcw,
} from 'lucide-react';

export function SettingsPage() {
  const { session, reads } = useAppStore('session');
  const { currentUser, activeCompanyId } = session;
  const company = reads.getCompany(activeCompanyId);
  const isOwner = currentUser.role === 'owner';
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">Settings</h1>
        <p className="text-muted-foreground">
          {isOwner ? 'Platform and company configuration' : `Settings for ${company?.name}`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Settings */}
        <Card className="border-l-4 border-l-brand-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-brand-primary" />
              Company Settings
            </CardTitle>
            <CardDescription>General company configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Company</p>
                <p>{company?.name}</p>
              </div>
              <Badge variant="outline" className="text-brand-success border-brand-success-mid bg-brand-success-light">Active</Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm">Auto-approve short leave</p>
                <p className="text-xs text-muted-foreground">Automatically approve requests under 2 days</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm">Require reason for all requests</p>
                <p className="text-xs text-muted-foreground">Employees must provide a reason when submitting leave</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm">Allow negative balances</p>
                <p className="text-xs text-muted-foreground">Let employees request leave beyond their balance</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border-l-4 border-l-brand-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-brand-warning" />
              Notifications
            </CardTitle>
            <CardDescription>Configure notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm">Email notifications</p>
                <p className="text-xs text-muted-foreground">Receive email for important events</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm">Leave request notifications</p>
                <p className="text-xs text-muted-foreground">Notify when team members request leave</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm">Approval reminders</p>
                <p className="text-xs text-muted-foreground">Send reminders for pending approvals</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm">Document expiry alerts</p>
                <p className="text-xs text-muted-foreground">Alert when documents are about to expire</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        {isOwner && (
          <Card className="border-l-4 border-l-brand-error">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-brand-error" />
                Security
              </CardTitle>
              <CardDescription>Platform-wide security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm">Two-factor authentication (MFA)</p>
                  <p className="text-xs text-muted-foreground">Require MFA for all users</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm">SSO Integration</p>
                  <p className="text-xs text-muted-foreground">Enable single sign-on</p>
                </div>
                <Badge variant="outline" className="text-xs">Coming Soon</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm">Session timeout</p>
                  <p className="text-xs text-muted-foreground">Auto-logout after inactivity</p>
                </div>
                <Select defaultValue="60">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="480">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="text-sm">Password policy</p>
                  <p className="text-xs text-muted-foreground">Minimum requirements for passwords</p>
                </div>
                <Badge variant="outline" className="text-xs text-brand-success bg-brand-success-light border-0">Strong</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Privacy */}
        <Card className="border-l-4 border-l-brand-success">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-brand-success" />
              Privacy & Data
            </CardTitle>
            <CardDescription>Data visibility and privacy rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm">Show leave type on team calendar</p>
                <p className="text-xs text-muted-foreground">Other employees can see leave type details</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm">Manager can view all balances</p>
                <p className="text-xs text-muted-foreground">Managers see detailed leave balances for reports</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm">Restrict medical document access</p>
                <p className="text-xs text-muted-foreground">Only HR admins can view medical documents</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danger Zone */}
      {(isOwner || currentUser.role === 'admin') && (
        <Card className="border-l-4 border-l-red-500 border border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Danger Zone
            </CardTitle>
            <CardDescription>Destructive actions that cannot be undone</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
              <div>
                <p className="text-sm">Reset All Data</p>
                <p className="text-xs text-muted-foreground">
                  Clear all localStorage data and restore seed data. The page will reload.
                </p>
              </div>
              {!confirmReset ? (
                <Button variant="destructive" size="sm" onClick={() => setConfirmReset(true)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Data
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setConfirmReset(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => reads.resetAllData()}>
                    Confirm Reset
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}