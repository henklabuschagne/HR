import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { additionalReads, additionalActions } from '../lib/additionalStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import {
  Target, Star, TrendingUp, MessageSquare, Clock, CheckCircle2,
  Award, DollarSign, Gauge, ChevronDown, ChevronUp, Percent,
  UserCheck, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, Eye,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { PerformanceReviewForm } from './PerformanceReviewForm';

const ratingLabels: Record<number, string> = { 1: 'Needs Improvement', 2: 'Developing', 3: 'Meets Expectations', 4: 'Exceeds Expectations', 5: 'Exceptional' };
const ratingColors: Record<number, string> = { 1: 'text-brand-error', 2: 'text-brand-warning', 3: 'text-brand-primary', 4: 'text-brand-success', 5: 'text-brand-success' };
const reviewStatusColors: Record<string, string> = { pending: 'text-muted-foreground bg-muted', self_review: 'text-brand-warning bg-brand-warning-light', manager_review: 'text-brand-primary bg-brand-primary-light', completed: 'text-brand-success bg-brand-success-light' };
const goalStatusColors: Record<string, string> = { not_started: 'text-muted-foreground bg-muted', in_progress: 'text-brand-primary bg-brand-primary-light', completed: 'text-brand-success bg-brand-success-light', cancelled: 'text-brand-error bg-brand-error-light' };
const feedbackTypeConfig: Record<string, { color: string; label: string }> = { praise: { color: 'text-brand-success bg-brand-success-light', label: 'Praise' }, coaching: { color: 'text-brand-primary bg-brand-primary-light', label: 'Coaching' }, warning: { color: 'text-brand-error bg-brand-error-light', label: 'Warning' }, note: { color: 'text-muted-foreground bg-muted', label: 'Note' } };

function RatingStars({ rating, size = 'sm', interactive, onRate }: { rating: number; size?: 'sm' | 'lg'; interactive?: boolean; onRate?: (r: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} ${i <= rating ? 'text-brand-warning fill-brand-warning' : 'text-muted-foreground/30'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
          onClick={interactive && onRate ? () => onRate(i) : undefined}
        />
      ))}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string | number; color: string; sub?: string }) {
  return (
    <Card><CardContent className="p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}><Icon className="w-5 h-5" /></div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl">{value}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div>
    </CardContent></Card>
  );
}

export function MyPerformancePage() {
  const { session, reads, users } = useAppStore('session', 'users', 'employmentRecords');
  const { activeCompanyId, currentUser } = session;

  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(v => v + 1), []);

  // Data filtered to current user
  const myGoals = additionalReads.getGoalsForUser(currentUser.id);
  const myReviews = additionalReads.getReviewsForUser(currentUser.id);
  const feedbackReceived = additionalReads.getFeedbackForUser(currentUser.id);
  const feedbackGiven = additionalReads.getFeedbackByUser(currentUser.id);
  const myIncentives = additionalReads.getAssignmentsForUser(currentUser.id);
  const peerReviewsForMe = additionalReads.getPeerReviewsForPeer(currentUser.id);
  const reviewCycles = additionalReads.getReviewCyclesForCompany(activeCompanyId);

  // State
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [selectedReview, setSelectedReview] = useState<string | null>(null);
  const [selectedIncentive, setSelectedIncentive] = useState<string | null>(null);
  const [peerReviewToSubmit, setPeerReviewToSubmit] = useState<string | null>(null);
  const [peerForm, setPeerForm] = useState({ rating: 0, strengths: '', improvements: '' });
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [fbForm, setFbForm] = useState({ toUserId: '', type: 'praise' as string, content: '', isPrivate: false });
  const [activeReviewForm, setActiveReviewForm] = useState<string | null>(null);

  const companyUsers = users.filter(u => reads.getEmploymentRecordsForUser(u.id).some(er => er.companyId === activeCompanyId));

  // Computed stats
  const activeGoals = myGoals.filter(g => g.status === 'in_progress');
  const completedGoals = myGoals.filter(g => g.status === 'completed');
  const avgProgress = myGoals.length > 0 ? Math.round(myGoals.reduce((s, g) => s + g.progress, 0) / myGoals.length) : 0;
  const latestReview = myReviews.filter(r => r.overallRating).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))[0];
  const pendingPeerReviews = peerReviewsForMe.filter(p => p.status === 'requested');
  const activeIncentiveAssignment = myIncentives.find(a => a.status === 'active');
  const activeReviews = myReviews.filter(r => r.status !== 'completed');

  // Performance trend over time
  const performanceTrend = useMemo(() => {
    const seen = new Set<string>();
    return myReviews
      .filter(r => r.overallRating)
      .sort((a, b) => (a.completedAt || '').localeCompare(b.completedAt || ''))
      .map(r => {
        const cycle = reviewCycles.find(c => c.id === r.cycleId);
        let name = cycle?.name?.replace('Review', '').trim() || 'Unknown';
        if (seen.has(name)) name = `${name} (${r.id})`;
        seen.add(name);
        return { cycle: name, rating: r.overallRating || 0, self: r.selfRating || 0, manager: r.managerRating || 0 };
      });
  }, [myReviews, reviewCycles]);

  // Skills radar from goal categories
  const skillsRadar = useMemo(() => {
    const categories = ['objective', 'key_result', 'development'];
    return categories.map(cat => {
      const catGoals = myGoals.filter(g => g.category === cat);
      const avgProg = catGoals.length > 0 ? Math.round(catGoals.reduce((s, g) => s + g.progress, 0) / catGoals.length) : 0;
      return { category: cat === 'key_result' ? 'Key Results' : cat === 'objective' ? 'Objectives' : 'Development', progress: avgProg, count: catGoals.length };
    });
  }, [myGoals]);

  const toggleGoalExpand = (id: string) => {
    setExpandedGoals(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const updateGoalProgress = useCallback((goalId: string, increment: number) => {
    const goal = myGoals.find(g => g.id === goalId);
    if (!goal) return;
    const newProgress = Math.min(100, Math.max(0, goal.progress + increment));
    additionalActions.updateGoal(goalId, { progress: newProgress, status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started' });
    refresh();
    toast.success(`Goal progress updated to ${newProgress}%`);
  }, [myGoals, refresh]);

  const handleSubmitPeerReview = () => {
    if (!peerReviewToSubmit || peerForm.rating === 0) { toast.error('Please provide a rating'); return; }
    if (!peerForm.strengths || !peerForm.improvements) { toast.error('Please fill in strengths and improvements'); return; }
    additionalActions.updatePeerReview(peerReviewToSubmit, {
      status: 'completed', overallRating: peerForm.rating, strengths: peerForm.strengths,
      improvements: peerForm.improvements, completedAt: new Date().toISOString().split('T')[0],
    });
    toast.success('Peer review submitted successfully');
    setPeerReviewToSubmit(null);
    setPeerForm({ rating: 0, strengths: '', improvements: '' });
    refresh();
  };

  const startSelfReview = (reviewId: string) => {
    const review = myReviews.find(r => r.id === reviewId);
    if (!review) return;
    if (review.status === 'pending') {
      additionalActions.updateReview(reviewId, { status: 'self_review' });
      toast.success('Review moved to self-review stage. You can now begin your self-assessment.');
      refresh();
    } else if (review.status === 'self_review') {
      setActiveReviewForm(reviewId);
    }
  };

  const handleAddFeedback = () => {
    if (!fbForm.toUserId || !fbForm.content) { toast.error('Recipient and content required'); return; }
    additionalActions.addFeedback({ ...fbForm, fromUserId: currentUser.id, companyId: activeCompanyId, type: fbForm.type as any });
    toast.success('Feedback submitted');
    setShowFeedbackDialog(false);
    setFbForm({ toUserId: '', type: 'praise', content: '', isPrivate: false });
    refresh();
  };

  const ratingTrend = latestReview?.overallRating && performanceTrend.length >= 2
    ? (latestReview.overallRating - performanceTrend[performanceTrend.length - 2].rating)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">My Performance</h1>
          <p className="text-muted-foreground">Track your goals, reviews, feedback, and incentives</p>
        </div>
        {pendingPeerReviews.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-brand-warning-light rounded-lg">
            <AlertCircle className="w-4 h-4 text-brand-warning" />
            <span className="text-sm text-brand-warning">{pendingPeerReviews.length} pending peer review{pendingPeerReviews.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Target} label="Active Goals" value={activeGoals.length} color="bg-brand-primary-light text-brand-primary" sub={`${completedGoals.length} completed`} />
        <StatCard icon={Star} label="Latest Rating" value={latestReview?.overallRating ? `${latestReview.overallRating}/5` : 'N/A'} color="bg-brand-warning-light text-brand-warning" sub={latestReview?.overallRating ? ratingLabels[latestReview.overallRating] : 'No review yet'} />
        <StatCard icon={MessageSquare} label="Feedback" value={feedbackReceived.length} color="bg-brand-success-light text-brand-success" sub={`${feedbackGiven.length} given`} />
        <StatCard icon={DollarSign} label="Incentive" value={activeIncentiveAssignment ? `${activeIncentiveAssignment.incentiveEarned ?? 0}%` : '-'} color="bg-brand-secondary-light text-brand-secondary" sub={activeIncentiveAssignment ? `Rating: ${(activeIncentiveAssignment.currentRating ?? 0).toFixed(1)}/5` : 'No active incentive'} />
      </div>

      {/* Quick Actions: Pending Peer Reviews */}
      {pendingPeerReviews.length > 0 && (
        <Card className="border-brand-warning/30 bg-brand-warning-light/20">
          <CardContent className="p-4">
            <h3 className="text-sm flex items-center gap-2 mb-3"><UserCheck className="w-4 h-4 text-brand-warning" /> Pending Peer Reviews</h3>
            <div className="space-y-2">
              {pendingPeerReviews.map(pr => {
                const allReviews = reviewCycles.flatMap(c => additionalReads.getReviewsForCycle(c.id));
                const parentReview = allReviews.find(r => r.id === pr.reviewId);
                const reviewee = parentReview ? reads.getUser(parentReview.userId) : null;
                const cycle = parentReview ? reviewCycles.find(c => c.id === parentReview.cycleId) : null;
                return (
                  <div key={pr.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-warning-light flex items-center justify-center text-xs text-brand-warning">{reviewee?.firstName?.[0]}{reviewee?.lastName?.[0]}</div>
                      <div>
                        <p className="text-sm">{reviewee?.firstName} {reviewee?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{cycle?.name} - Requested {new Date(pr.requestedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => setPeerReviewToSubmit(pr.id)}>Submit Review</Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">My Goals</TabsTrigger>
          <TabsTrigger value="reviews">My Reviews</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="incentives">My Incentives</TabsTrigger>
        </TabsList>

        {/* ─── OVERVIEW ─── */}
        <TabsContent value="overview" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Trend */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> My Rating Trend
                  {ratingTrend !== 0 && (
                    <Badge variant="outline" className={`text-xs ${ratingTrend > 0 ? 'text-brand-success' : ratingTrend < 0 ? 'text-brand-error' : ''}`}>
                      {ratingTrend > 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : ratingTrend < 0 ? <ArrowDownRight className="w-3 h-3 mr-0.5" /> : <Minus className="w-3 h-3 mr-0.5" />}
                      {ratingTrend > 0 ? '+' : ''}{ratingTrend.toFixed(1)}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={performanceTrend} id="myperf-trend">
                      <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                      <XAxis dataKey="cycle" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="rating" name="Overall" stroke="#456E92" strokeWidth={2} dot={{ fill: '#456E92', r: 4 }} />
                      <Line type="monotone" dataKey="self" name="Self" stroke="#CEA569" strokeWidth={1.5} strokeDasharray="4 4" dot={{ fill: '#CEA569', r: 3 }} />
                      <Line type="monotone" dataKey="manager" name="Manager" stroke="#5F966C" strokeWidth={1.5} strokeDasharray="4 4" dot={{ fill: '#5F966C', r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No completed reviews yet</div>
                )}
              </CardContent>
            </Card>

            {/* Goal Progress Radar */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Goal Progress by Category</CardTitle></CardHeader>
              <CardContent>
                {skillsRadar.some(s => s.count > 0) ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={skillsRadar} id="myperf-skills-radar">
                      <PolarGrid stroke="#ececf0" />
                      <PolarAngleAxis dataKey="category" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                      <Radar name="Progress" dataKey="progress" stroke="#456E92" fill="#456E92" fillOpacity={0.3} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">No goals set yet</div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Active Reviews - Enhanced In-Review Banner */}
          {activeReviews.length > 0 && (
            <div className="space-y-3">
              {activeReviews.map(review => {
                const cycle = reviewCycles.find(c => c.id === review.cycleId);
                const reviewer = reads.getUser(review.reviewerId);
                const isSelfReview = review.status === 'self_review';
                const isPending = review.status === 'pending';
                const isManagerReview = review.status === 'manager_review';

                return (
                  <Card key={review.id} className={`border-2 ${isSelfReview ? 'border-brand-warning bg-brand-warning-light/10' : isManagerReview ? 'border-brand-primary bg-brand-primary-light/10' : 'border-muted'}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl shrink-0 ${isSelfReview ? 'bg-brand-warning-light' : isManagerReview ? 'bg-brand-primary-light' : 'bg-muted'}`}>
                            <Award className={`w-6 h-6 ${isSelfReview ? 'text-brand-warning' : isManagerReview ? 'text-brand-primary' : 'text-muted-foreground'}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <h3 className="text-base">{cycle?.name}</h3>
                              <Badge variant="outline" className={`border-0 ${reviewStatusColors[review.status]}`}>{review.status.replace(/_/g, ' ')}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">Reviewer: {reviewer?.firstName} {reviewer?.lastName}</p>
                            {isSelfReview && (
                              <p className="text-sm text-brand-warning mt-2 flex items-center gap-1.5">
                                <AlertCircle className="w-4 h-4" />
                                Your self-assessment is due. Rate yourself on each goal, metric, and provide notes.
                              </p>
                            )}
                            {isManagerReview && (
                              <p className="text-sm text-brand-primary mt-2 flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                Your self-review has been submitted. Waiting for manager assessment.
                              </p>
                            )}
                            {isPending && (
                              <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                Review has been created. Click to start your self-assessment.
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {(isPending || isSelfReview) && (
                            <Button onClick={() => startSelfReview(review.id)} className={isSelfReview ? 'bg-brand-warning hover:bg-brand-warning/90 text-white' : ''}>
                              {isPending ? 'Start Review' : 'Begin Self-Assessment'}
                            </Button>
                          )}
                          {isManagerReview && (
                            <Badge variant="outline" className="text-xs border-brand-primary text-brand-primary px-3 py-1.5">
                              Awaiting Manager
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Goal Progress Overview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2"><Target className="w-4 h-4" /> Goal Progress Summary</span>
                <span className="text-xs text-muted-foreground">{avgProgress}% average</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {myGoals.slice(0, 5).map(goal => (
                <div key={goal.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm truncate">{goal.title}</p>
                      <Badge variant="outline" className={`text-xs border-0 shrink-0 ${goalStatusColors[goal.status]}`}>{goal.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={goal.progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground w-8 text-right">{goal.progress}%</span>
                    </div>
                  </div>
                </div>
              ))}
              {myGoals.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No goals assigned yet</p>}
            </CardContent>
          </Card>

          {/* Recent Feedback */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Recent Feedback</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {feedbackReceived.slice(0, 3).map(fb => {
                const from = reads.getUser(fb.fromUserId);
                const config = feedbackTypeConfig[fb.type];
                return (
                  <div key={fb.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                    <div className={`p-1.5 rounded-lg shrink-0 ${config.color}`}><MessageSquare className="w-3 h-3" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-2">{fb.content}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>From {from?.firstName} {from?.lastName}</span>
                        <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {feedbackReceived.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No feedback received yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── MY GOALS ─── */}
        <TabsContent value="goals" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{myGoals.length} total goals - {avgProgress}% average progress</p>
          </div>
          {myGoals.map(goal => {
            const goalMetrics = additionalReads.getMetricsForGoal(goal.id);
            const isExpanded = expandedGoals.has(goal.id);
            return (
              <Card key={goal.id} className="border-l-4" style={{ borderLeftColor: goal.status === 'completed' ? '#5F966C' : goal.status === 'in_progress' ? '#456E92' : '#ececf0' }}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="cursor-pointer" onClick={() => toggleGoalExpand(goal.id)}>{goal.title}</h4>
                        <Badge variant="outline" className={`text-xs border-0 ${goalStatusColors[goal.status]}`}>{goal.status.replace(/_/g, ' ')}</Badge>
                        <Badge variant="outline" className="text-xs capitalize">{goal.category.replace(/_/g, ' ')}</Badge>
                        <Badge variant="outline" className="text-xs"><Percent className="w-3 h-3 mr-1" />{goal.weight}% weight</Badge>
                        {goalMetrics.length > 0 && <Badge variant="outline" className="text-xs"><Gauge className="w-3 h-3 mr-1" />{goalMetrics.length} metrics</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{goal.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Due {new Date(goal.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4 flex flex-col items-end gap-1">
                      <p className="text-2xl text-brand-primary">{goal.progress}%</p>
                      <div className="flex gap-1">
                        {goal.status !== 'completed' && goal.status !== 'cancelled' && (
                          <>
                            <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => updateGoalProgress(goal.id, -10)}>-10</Button>
                            <Button size="sm" variant="outline" className="h-6 px-2 text-xs" onClick={() => updateGoalProgress(goal.id, 10)}>+10</Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 px-1" onClick={() => toggleGoalExpand(goal.id)}>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3"><div className="w-full bg-muted rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${goal.progress}%`, backgroundColor: goal.status === 'completed' ? '#5F966C' : '#456E92' }} /></div></div>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <h4 className="text-sm flex items-center gap-1"><Gauge className="w-4 h-4 text-brand-primary" /> Metrics</h4>
                      {goalMetrics.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No metrics defined for this goal.</p>
                      ) : (
                        <div className="space-y-2">
                          {goalMetrics.map(m => {
                            const pctAchieved = m.targetValue > 0 ? Math.min(100, Math.round((m.currentValue / m.targetValue) * 100)) : 0;
                            return (
                              <div key={m.id} className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                  <div>
                                    <span className="text-sm">{m.name}</span>
                                    <Badge variant="outline" className="text-xs ml-2">{m.weight}% weight</Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">{m.currentValue} / {m.targetValue} {m.unit === 'percentage' ? '%' : m.unit === 'currency' ? '$' : ''}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{m.description}</p>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1"><Progress value={pctAchieved} className="h-1.5" /></div>
                                  <span className="text-xs text-brand-primary">{pctAchieved}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
          {myGoals.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p>No goals assigned yet. Your manager will set goals for you.</p>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ─── MY REVIEWS ─── */}
        <TabsContent value="reviews" className="mt-4 space-y-4">
          {myReviews.length > 0 ? myReviews.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map(review => {
            const cycle = reviewCycles.find(c => c.id === review.cycleId);
            const reviewer = reads.getUser(review.reviewerId);
            const peerReviewsForReview = additionalReads.getPeerReviewsForReview(review.id);
            const completedPeers = peerReviewsForReview.filter(p => p.status === 'completed');
            const peerAvg = completedPeers.length > 0 ? (completedPeers.reduce((s, p) => s + (p.overallRating || 0), 0) / completedPeers.length) : 0;

            return (
              <Card key={review.id} className={`hover:shadow-md transition-shadow ${review.status !== 'completed' ? 'border-l-4 border-l-brand-primary' : ''}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${review.status === 'completed' ? 'bg-brand-success-light' : 'bg-brand-primary-light'}`}>
                        <Award className={`w-5 h-5 ${review.status === 'completed' ? 'text-brand-success' : 'text-brand-primary'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3>{cycle?.name}</h3>
                          <Badge variant="outline" className={`text-xs border-0 ${reviewStatusColors[review.status]}`}>{review.status.replace(/_/g, ' ')}</Badge>
                          <Badge variant="outline" className="text-xs capitalize">{cycle?.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">Reviewer: {reviewer?.firstName} {reviewer?.lastName} - {new Date(cycle?.startDate || '').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.overallRating && <RatingStars rating={review.overallRating} size="lg" />}
                      {(review.status === 'pending' || review.status === 'self_review') && (
                        <Button size="sm" onClick={() => startSelfReview(review.id)}>
                          {review.status === 'pending' ? 'Start' : 'Begin Self-Assessment'}
                        </Button>
                      )}
                      {review.status === 'completed' && (
                        <Button size="sm" variant="ghost" onClick={() => setSelectedReview(review.id)}><Eye className="w-4 h-4" /></Button>
                      )}
                    </div>
                  </div>

                  {review.overallRating && (
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <div className="p-2 bg-muted rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Self</p>
                        <p className="text-sm">{review.selfRating || '-'}/5</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Manager</p>
                        <p className="text-sm">{review.managerRating || '-'}/5</p>
                      </div>
                      <div className="p-2 bg-muted rounded-lg text-center">
                        <p className="text-xs text-muted-foreground">Peer Avg</p>
                        <p className="text-sm">{completedPeers.length > 0 ? peerAvg.toFixed(1) : '-'}/5</p>
                      </div>
                    </div>
                  )}

                  {completedPeers.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <UserCheck className="w-3 h-3" />
                      <span>{completedPeers.length} peer review{completedPeers.length > 1 ? 's' : ''} completed</span>
                      {peerReviewsForReview.some(p => p.status === 'requested') && (
                        <Badge variant="outline" className="text-xs text-brand-warning">{peerReviewsForReview.filter(p => p.status === 'requested').length} pending</Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }) : (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p>No reviews assigned yet.</p>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* ─── FEEDBACK ─── */}
        <TabsContent value="feedback" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowFeedbackDialog(true)}><MessageSquare className="w-4 h-4 mr-2" /> Give Feedback</Button>
          </div>

          <Tabs defaultValue="received">
            <TabsList className="h-auto gap-1 p-1">
              <TabsTrigger value="received">Received ({feedbackReceived.length})</TabsTrigger>
              <TabsTrigger value="given">Given ({feedbackGiven.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="received" className="mt-3 space-y-3">
              {feedbackReceived.map(fb => {
                const from = reads.getUser(fb.fromUserId);
                const config = feedbackTypeConfig[fb.type];
                return (
                  <Card key={fb.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${config.color}`}><MessageSquare className="w-4 h-4" /></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs border-0 ${config.color}`}>{config.label}</Badge>
                            {fb.isPrivate && <Badge variant="outline" className="text-xs">Private</Badge>}
                          </div>
                          <p className="text-sm">{fb.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>From <strong>{from?.firstName} {from?.lastName}</strong></span>
                            <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {feedbackReceived.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No feedback received yet</p>}
            </TabsContent>

            <TabsContent value="given" className="mt-3 space-y-3">
              {feedbackGiven.map(fb => {
                const to = reads.getUser(fb.toUserId);
                const config = feedbackTypeConfig[fb.type];
                return (
                  <Card key={fb.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg shrink-0 ${config.color}`}><MessageSquare className="w-4 h-4" /></div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`text-xs border-0 ${config.color}`}>{config.label}</Badge>
                          </div>
                          <p className="text-sm">{fb.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>To <strong>{to?.firstName} {to?.lastName}</strong></span>
                            <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {feedbackGiven.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No feedback given yet</p>}
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ─── MY INCENTIVES ─── */}
        <TabsContent value="incentives" className="mt-4 space-y-4">
          {myIncentives.length > 0 ? myIncentives.sort((a, b) => b.assignedAt.localeCompare(a.assignedAt)).map(assignment => {
            const model = additionalReads.getIncentiveModel(assignment.modelId);
            const statusColor = assignment.status === 'active' ? 'text-brand-primary bg-brand-primary-light' : assignment.status === 'completed' ? 'text-brand-success bg-brand-success-light' : 'text-muted-foreground bg-muted';
            return (
              <Card key={assignment.id} className={assignment.status === 'active' ? 'border-l-4 border-l-brand-primary' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-brand-warning-light rounded-lg"><DollarSign className="w-5 h-5 text-brand-warning" /></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3>{model?.name}</h3>
                          <Badge variant="outline" className={`text-xs border-0 ${statusColor}`}>{assignment.status}</Badge>
                          <Badge variant="outline" className="text-xs">{assignment.period}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{model?.description}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedIncentive(assignment.id)}><Eye className="w-4 h-4" /></Button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Current Rating</p>
                      {assignment.currentRating ? (
                        <>
                          <div className="flex justify-center mt-1"><RatingStars rating={Math.round(assignment.currentRating)} /></div>
                          <p className="text-xs text-muted-foreground mt-0.5">{assignment.currentRating.toFixed(1)}/5</p>
                        </>
                      ) : <p className="text-sm mt-1">N/A</p>}
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Incentive Earned</p>
                      <p className="text-2xl text-brand-success mt-1">{assignment.incentiveEarned ?? 0}%</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Outcome Tier</p>
                      <p className="text-sm mt-1">{model?.outcomes.find(o => (assignment.currentRating || 0) >= o.minRating && (assignment.currentRating || 0) <= o.maxRating)?.name || 'N/A'}</p>
                    </div>
                  </div>

                  {model && model.outcomes.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs text-muted-foreground">Outcome Tiers</p>
                      <div className="flex gap-1">
                        {model.outcomes.map(o => {
                          const isActive = assignment.currentRating !== undefined && assignment.currentRating >= o.minRating && assignment.currentRating <= o.maxRating;
                          return (
                            <div key={o.id} className={`flex-1 p-2 rounded text-center text-xs ${isActive ? 'bg-brand-primary-light text-brand-primary ring-1 ring-brand-primary' : 'bg-muted text-muted-foreground'}`}>
                              <p>{o.name}</p>
                              <p>{o.incentivePercent}%</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          }) : (
            <Card><CardContent className="p-8 text-center text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p>No incentive models assigned yet.</p>
            </CardContent></Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ═══ DIALOGS ═══ */}

      {/* Review Detail Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedReview && (() => {
            const review = myReviews.find(r => r.id === selectedReview);
            if (!review) return null;
            const cycle = reviewCycles.find(c => c.id === review.cycleId);
            const reviewer = reads.getUser(review.reviewerId);
            const userGoals = myGoals;
            const goalRatings = additionalReads.getGoalRatingsForReview(review.id);
            const peerReviewsForReview = additionalReads.getPeerReviewsForReview(review.id);
            const completedPeers = peerReviewsForReview.filter(p => p.status === 'completed');
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{cycle?.name}</DialogTitle>
                  <DialogDescription>
                    Reviewed by {reviewer?.firstName} {reviewer?.lastName} - Completed {review.completedAt ? new Date(review.completedAt).toLocaleDateString() : 'N/A'}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-4 pb-4">
                    {/* Ratings */}
                    {review.overallRating && (
                      <div className="p-4 bg-brand-primary-light rounded-lg text-center">
                        <p className="text-xs text-brand-primary mb-1">Overall Rating</p>
                        <div className="flex items-center justify-center gap-2">
                          <RatingStars rating={review.overallRating} size="lg" />
                          <span className={`text-lg ${ratingColors[review.overallRating]}`}>{review.overallRating}/5</span>
                        </div>
                        <p className="text-sm text-brand-primary mt-1">{ratingLabels[review.overallRating]}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Self Rating</p>
                        {review.selfRating ? <><RatingStars rating={review.selfRating} size="lg" /><p className="text-xs text-muted-foreground mt-1">{ratingLabels[review.selfRating]}</p></> : <p className="text-sm text-muted-foreground">Not submitted</p>}
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Manager Rating</p>
                        {review.managerRating ? <><RatingStars rating={review.managerRating} size="lg" /><p className="text-xs text-muted-foreground mt-1">{ratingLabels[review.managerRating]}</p></> : <p className="text-sm text-muted-foreground">Not submitted</p>}
                      </div>
                    </div>

                    {review.strengths && <div className="p-3 border rounded-lg"><p className="text-xs text-muted-foreground mb-1">Strengths</p><p className="text-sm">{review.strengths}</p></div>}
                    {review.improvements && <div className="p-3 border rounded-lg"><p className="text-xs text-muted-foreground mb-1">Areas for Improvement</p><p className="text-sm">{review.improvements}</p></div>}
                    {review.managerComments && <div className="p-3 bg-brand-success-light rounded-lg"><p className="text-xs text-brand-success mb-1">Manager Comments</p><p className="text-sm">{review.managerComments}</p></div>}

                    {/* Goal Ratings */}
                    {goalRatings.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-brand-primary" /> Goal Ratings</h4>
                        {goalRatings.map(gr => {
                          const goal = userGoals.find(g => g.id === gr.goalId);
                          return goal ? (
                            <div key={gr.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm">{goal.title}</span>
                                <Badge variant="outline" className="text-xs">{goal.weight}%</Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-2 bg-muted/50 rounded">
                                  <p className="text-xs text-muted-foreground mb-1">Self</p>
                                  <RatingStars rating={gr.selfRating || 0} />
                                  {gr.selfComment && <p className="text-xs text-muted-foreground mt-1 italic">{gr.selfComment}</p>}
                                </div>
                                <div className="p-2 bg-muted/50 rounded">
                                  <p className="text-xs text-muted-foreground mb-1">Manager</p>
                                  <RatingStars rating={gr.managerRating || 0} />
                                  {gr.managerComment && <p className="text-xs text-muted-foreground mt-1 italic">{gr.managerComment}</p>}
                                </div>
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* 360° Peer Reviews */}
                    {completedPeers.length > 0 && (
                      <div className="space-y-2 border-t pt-4">
                        <h4 className="text-sm flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-brand-primary" /> 360° Peer Reviews ({completedPeers.length})
                        </h4>
                        {completedPeers.map(pr => {
                          const peer = reads.getUser(pr.peerUserId);
                          return (
                            <div key={pr.id} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-brand-primary-light flex items-center justify-center text-xs text-brand-primary">{peer?.firstName?.[0]}{peer?.lastName?.[0]}</div>
                                  <span className="text-sm">{peer?.firstName} {peer?.lastName}</span>
                                </div>
                                <RatingStars rating={pr.overallRating || 0} />
                              </div>
                              {pr.strengths && <p className="text-xs"><span className="text-muted-foreground">Strengths:</span> {pr.strengths}</p>}
                              {pr.improvements && <p className="text-xs mt-1"><span className="text-muted-foreground">To improve:</span> {pr.improvements}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Incentive Detail Dialog */}
      <Dialog open={!!selectedIncentive} onOpenChange={() => setSelectedIncentive(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedIncentive && (() => {
            const assignment = myIncentives.find(a => a.id === selectedIncentive);
            if (!assignment) return null;
            const model = additionalReads.getIncentiveModel(assignment.modelId);
            if (!model) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{model.name}</DialogTitle>
                  <DialogDescription>{model.description} - {assignment.period}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-6 pb-4">
                    <div>
                      <h4 className="text-sm mb-2 flex items-center gap-2"><Gauge className="w-4 h-4 text-brand-primary" /> Metrics</h4>
                      <div className="space-y-2">
                        {model.metrics.map(m => (
                          <div key={m.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div><p className="text-sm">{m.name}</p><p className="text-xs text-muted-foreground">{m.description}</p></div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">Target: {m.targetValue} {m.unit}</Badge>
                              <Badge variant="outline" className="text-xs text-brand-primary">{m.weight}%</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm mb-2 flex items-center gap-2"><Target className="w-4 h-4 text-brand-primary" /> Goals</h4>
                      <div className="space-y-2">
                        {model.goals.map(g => (
                          <div key={g.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                            <div><p className="text-sm">{g.name}</p><p className="text-xs text-muted-foreground">{g.description}</p></div>
                            <Badge variant="outline" className="text-xs text-brand-primary">{g.weight}%</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm mb-2 flex items-center gap-2"><Award className="w-4 h-4 text-brand-warning" /> Outcome Tiers</h4>
                      <div className="space-y-2">
                        {model.outcomes.map(o => {
                          const isActive = assignment.currentRating !== undefined && assignment.currentRating >= o.minRating && assignment.currentRating <= o.maxRating;
                          return (
                            <div key={o.id} className={`flex items-center justify-between p-3 rounded-lg border ${isActive ? 'ring-2 ring-brand-primary bg-brand-primary-light/30' : ''}`}>
                              <div>
                                <p className="text-sm">{o.name} {isActive && <Badge variant="outline" className="text-xs text-brand-primary ml-1">Current</Badge>}</p>
                                <p className="text-xs text-muted-foreground">{o.description}</p>
                                <p className="text-xs text-muted-foreground mt-1">Rating range: {o.minRating} - {o.maxRating}</p>
                              </div>
                              <p className="text-lg text-brand-success">{o.incentivePercent}%</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Peer Review Submission Dialog */}
      <Dialog open={!!peerReviewToSubmit} onOpenChange={() => { setPeerReviewToSubmit(null); setPeerForm({ rating: 0, strengths: '', improvements: '' }); }}>
        <DialogContent>
          {peerReviewToSubmit && (() => {
            const pr = peerReviewsForMe.find(p => p.id === peerReviewToSubmit);
            if (!pr) return null;
            const allReviewsList = reviewCycles.flatMap(c => additionalReads.getReviewsForCycle(c.id));
            const parentReview = allReviewsList.find(r => r.id === pr.reviewId);
            const reviewee = parentReview ? reads.getUser(parentReview.userId) : null;
            const cycle = parentReview ? reviewCycles.find(c => c.id === parentReview.cycleId) : null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle>Peer Review for {reviewee?.firstName} {reviewee?.lastName}</DialogTitle>
                  <DialogDescription>{cycle?.name} - Provide your 360° feedback</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>Overall Rating *</Label>
                    <div className="flex items-center gap-3">
                      <RatingStars rating={peerForm.rating} size="lg" interactive onRate={r => setPeerForm(f => ({ ...f, rating: r }))} />
                      {peerForm.rating > 0 && <span className="text-sm text-muted-foreground">{ratingLabels[peerForm.rating]}</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Strengths *</Label>
                    <Textarea value={peerForm.strengths} onChange={e => setPeerForm(f => ({ ...f, strengths: e.target.value }))} rows={3} placeholder="What does this person do well?" />
                  </div>
                  <div className="space-y-2">
                    <Label>Areas for Improvement *</Label>
                    <Textarea value={peerForm.improvements} onChange={e => setPeerForm(f => ({ ...f, improvements: e.target.value }))} rows={3} placeholder="What could this person improve?" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setPeerReviewToSubmit(null); setPeerForm({ rating: 0, strengths: '', improvements: '' }); }}>Cancel</Button>
                  <Button onClick={handleSubmitPeerReview}>Submit Peer Review</Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ═══ FULL-SCREEN REVIEW FORM ═══ */}
      {activeReviewForm && (
        <div className="fixed inset-0 z-50 bg-background overflow-auto">
          <PerformanceReviewForm
            reviewId={activeReviewForm}
            mode="self"
            onClose={() => setActiveReviewForm(null)}
            onSubmitted={() => { setActiveReviewForm(null); refresh(); }}
          />
        </div>
      )}

      {/* Give Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Give Feedback</DialogTitle><DialogDescription>Provide feedback to a colleague</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>To *</Label>
              <Select value={fbForm.toUserId} onValueChange={v => setFbForm(f => ({ ...f, toUserId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select colleague" /></SelectTrigger>
                <SelectContent>
                  {companyUsers.filter(u => u.id !== currentUser.id).map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={fbForm.type} onValueChange={v => setFbForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['praise', 'coaching', 'note'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Content *</Label><Textarea value={fbForm.content} onChange={e => setFbForm(f => ({ ...f, content: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowFeedbackDialog(false)}>Cancel</Button><Button onClick={handleAddFeedback}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
