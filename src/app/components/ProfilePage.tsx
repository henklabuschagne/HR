import { useAppStore } from '../hooks/useAppStore';
import { additionalReads } from '../lib/additionalStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  User, Mail, MapPin, Building2, Calendar, Briefcase,
  Users, Clock, Shield, FileText, Target, Star, BookOpen, CheckCircle2,
} from 'lucide-react';

export function ProfilePage() {
  const { session, reads } = useAppStore('session', 'employmentRecords', 'leaveBalances', 'leaveRequests');
  const { currentUser, activeCompanyId } = session;

  const allERs = reads.getEmploymentRecordsForUser(currentUser.id);
  const activeER = allERs.find(er => er.companyId === activeCompanyId);
  const balances = activeER ? reads.getUserLeaveBalances(activeER.id) : [];

  // Performance data
  const reviews = additionalReads.getReviewsForUser(currentUser.id);
  const goals = additionalReads.getGoalsForUser(currentUser.id);
  const feedback = additionalReads.getFeedbackForUser(currentUser.id);

  // Policy data
  const userAcks = additionalReads.getUserAcknowledgments(currentUser.id);
  const policies = additionalReads.getPoliciesForCompany(activeCompanyId).filter(p => p.status === 'published');

  const ratingLabels: Record<number, string> = { 1: 'Needs Improvement', 2: 'Developing', 3: 'Meets Expectations', 4: 'Exceeds Expectations', 5: 'Exceptional' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-1">My Profile</h1>
        <p className="text-muted-foreground">View and manage your personal information</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-brand-primary flex items-center justify-center text-white text-2xl shrink-0">
              {currentUser.firstName[0]}{currentUser.lastName[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl">{currentUser.firstName} {currentUser.lastName}</h2>
                <Badge variant="outline" className="capitalize text-brand-success border-brand-success-mid bg-brand-success-light">Active</Badge>
              </div>
              <p className="text-muted-foreground">{activeER?.jobTitle || 'Employee'}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {currentUser.email}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {activeER?.location}</span>
                <span className="flex items-center gap-1"><Building2 className="w-4 h-4" /> {activeER?.department}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="employment">
        <TabsList>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="leave">Leave Summary</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="employment" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Briefcase className="w-5 h-5 text-brand-primary" /> Employment Details</CardTitle>
              <CardDescription>Current employment at {reads.getCompany(activeCompanyId)?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { label: 'Job Title', value: activeER?.jobTitle, icon: Briefcase },
                  { label: 'Department', value: activeER?.department, icon: Building2 },
                  { label: 'Team', value: activeER?.team, icon: Users },
                  { label: 'Location', value: activeER?.location, icon: MapPin },
                  { label: 'Employment Type', value: activeER?.employmentType?.replace('-', ' '), icon: Clock },
                  { label: 'Start Date', value: activeER?.startDate ? new Date(activeER.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-', icon: Calendar },
                  { label: 'Manager', value: activeER?.managerId ? reads.getUserName(activeER.managerId) : 'None assigned', icon: User },
                  { label: 'Leave Model', value: activeER?.leaveModelId ? reads.getLeaveModel(activeER.leaveModelId)?.name : '-', icon: FileText },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg"><item.icon className="w-4 h-4 text-muted-foreground" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm capitalize">{item.value || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
              {activeER?.isOnProbation && (
                <div className="mt-4 p-3 bg-brand-warning-light rounded-lg flex items-center gap-2">
                  <Shield className="w-4 h-4 text-brand-warning" />
                  <p className="text-sm text-brand-warning">Currently on probation</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {balances.map(bal => {
              const lt = reads.getLeaveType(bal.leaveTypeId);
              const pct = bal.entitled > 0 ? Math.round((bal.used / bal.entitled) * 100) : 0;
              return (
                <Card key={bal.id} className="border-l-4" style={{ borderLeftColor: lt?.color }}>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-2">{lt?.name}</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl">{bal.available}</span>
                      <span className="text-sm text-muted-foreground mb-1">/ {bal.entitled}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: lt?.color }} />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>{bal.used} used</span>
                      <span>{bal.pending} pending</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4 mt-4">
          {/* Recent Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-brand-warning" /> My Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-center py-6 text-sm text-muted-foreground">No performance reviews yet</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map(r => {
                    const reviewer = reads.getUser(r.reviewerId);
                    return (
                      <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm">Review by {reviewer?.firstName} {reviewer?.lastName}</p>
                            <Badge variant="outline" className={`text-xs border-0 ${r.status === 'completed' ? 'text-brand-success bg-brand-success-light' : 'text-brand-warning bg-brand-warning-light'}`}>
                              {r.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          {r.overallRating && <p className="text-xs text-muted-foreground mt-1">{ratingLabels[r.overallRating]} ({r.overallRating}/5)</p>}
                          {r.managerComments && <p className="text-xs text-muted-foreground mt-1 italic">"{r.managerComments}"</p>}
                        </div>
                        {r.overallRating && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} className={`w-4 h-4 ${i <= r.overallRating! ? 'text-brand-warning fill-brand-warning' : 'text-muted-foreground/30'}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-brand-primary" /> My Goals</CardTitle>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <p className="text-center py-6 text-sm text-muted-foreground">No goals assigned</p>
              ) : (
                <div className="space-y-3">
                  {goals.map(g => (
                    <div key={g.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <p className="text-sm">{g.title}</p>
                          <Badge variant="outline" className={`text-xs border-0 ${g.status === 'completed' ? 'text-brand-success bg-brand-success-light' : g.status === 'in_progress' ? 'text-brand-primary bg-brand-primary-light' : 'text-muted-foreground bg-muted'}`}>
                            {g.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <span className="text-sm text-brand-primary">{g.progress}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="h-2 rounded-full bg-brand-primary transition-all" style={{ width: `${g.progress}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Due {new Date(g.dueDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Feedback */}
          {feedback.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Feedback Received</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {feedback.map(f => {
                    const from = reads.getUser(f.fromUserId);
                    return (
                      <div key={f.id} className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-xs border-0 ${f.type === 'praise' ? 'text-brand-success bg-brand-success-light' : f.type === 'coaching' ? 'text-brand-primary bg-brand-primary-light' : 'text-muted-foreground bg-muted'}`}>
                            {f.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">from {from?.firstName} {from?.lastName}</span>
                        </div>
                        <p className="text-sm">{f.content}</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="policies" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-brand-primary" /> Policy Acknowledgments</CardTitle>
              <CardDescription>Track your acknowledgment status for company policies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {policies.map(policy => {
                  const ack = userAcks.find(a => a.policyId === policy.id);
                  return (
                    <div key={policy.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-primary-light rounded-lg">
                          <BookOpen className="w-4 h-4 text-brand-primary" />
                        </div>
                        <div>
                          <p className="text-sm">{policy.title}</p>
                          <p className="text-xs text-muted-foreground">v{policy.version} - {policy.category.replace(/_/g, ' ')}</p>
                        </div>
                      </div>
                      {ack?.status === 'acknowledged' ? (
                        <Badge variant="outline" className="text-xs border-0 text-brand-success bg-brand-success-light">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Acknowledged
                        </Badge>
                      ) : ack?.status === 'overdue' ? (
                        <Badge variant="outline" className="text-xs border-0 text-brand-error bg-brand-error-light">Overdue</Badge>
                      ) : ack?.status === 'pending' ? (
                        <Badge variant="outline" className="text-xs border-0 text-brand-warning bg-brand-warning-light">Pending</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Not required</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
