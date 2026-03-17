import { useState, useCallback, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { additionalReads, additionalActions } from '../lib/additionalStore';
import { appStore } from '../lib/appStore';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Progress } from './ui/progress';
import {
  Target, Star, TrendingUp, MessageSquare, Plus, ChevronRight, Clock, CheckCircle2, User,
  Award, Trash2, BarChart3, DollarSign, Gauge, Edit2, Eye, UserPlus, ChevronDown, ChevronUp,
  Percent, X, FileText, Users, Download, Bell, UserCheck,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, Legend,
  LineChart, Line,
} from 'recharts';
import type { IncentiveMetricItem, IncentiveGoalItem, IncentiveOutcome } from '../lib/types';
import { PerformanceReviewForm } from './PerformanceReviewForm';

const ratingLabels: Record<number, string> = { 1: 'Needs Improvement', 2: 'Developing', 3: 'Meets Expectations', 4: 'Exceeds Expectations', 5: 'Exceptional' };
const ratingColors: Record<number, string> = { 1: 'text-brand-error', 2: 'text-brand-warning', 3: 'text-brand-primary', 4: 'text-brand-success', 5: 'text-brand-success' };
const reviewStatusColors: Record<string, string> = { pending: 'text-muted-foreground bg-muted', self_review: 'text-brand-warning bg-brand-warning-light', manager_review: 'text-brand-primary bg-brand-primary-light', completed: 'text-brand-success bg-brand-success-light' };
const goalStatusColors: Record<string, string> = { not_started: 'text-muted-foreground bg-muted', in_progress: 'text-brand-primary bg-brand-primary-light', completed: 'text-brand-success bg-brand-success-light', cancelled: 'text-brand-error bg-brand-error-light' };
const feedbackTypeConfig: Record<string, { color: string; label: string }> = { praise: { color: 'text-brand-success bg-brand-success-light', label: 'Praise' }, coaching: { color: 'text-brand-primary bg-brand-primary-light', label: 'Coaching' }, warning: { color: 'text-brand-error bg-brand-error-light', label: 'Warning' }, note: { color: 'text-muted-foreground bg-muted', label: 'Note' } };
const CHART_COLORS = ['#456E92', '#5F966C', '#CEA569', '#AB5A5C', '#7AA2C0', '#8BB896'];

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

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card><CardContent className="p-4 flex items-center gap-3">
      <div className={`p-2 rounded-lg ${color}`}><Icon className="w-5 h-5" /></div>
      <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-xl">{value}</p></div>
    </CardContent></Card>
  );
}

export function PerformancePage() {
  const { session, reads, users } = useAppStore('session', 'users', 'employmentRecords');
  const { activeCompanyId, currentUser } = session;
  const company = reads.getCompany(activeCompanyId);

  const [, forceUpdate] = useState(0);
  const refresh = useCallback(() => forceUpdate(v => v + 1), []);

  // Data reads
  const reviewCycles = additionalReads.getReviewCyclesForCompany(activeCompanyId);
  const allGoals = additionalReads.getGoalsForCompany(activeCompanyId);
  const allFeedback = additionalReads.getAllFeedback(activeCompanyId);
  const incentiveModels = additionalReads.getIncentiveModelsForCompany(activeCompanyId);
  const allAssignments = additionalReads.getAssignmentsForCompany(activeCompanyId);
  const allMetrics = additionalReads.getMetricsForCompany(activeCompanyId);

  // State
  const [selectedCycle, setSelectedCycle] = useState<string | null>(null);
  const [selectedReviewUser, setSelectedReviewUser] = useState<string | null>(null);
  const [showAddCycle, setShowAddCycle] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddFeedback, setShowAddFeedback] = useState(false);
  const [showAddMetric, setShowAddMetric] = useState(false);
  const [selectedGoalForMetric, setSelectedGoalForMetric] = useState<string | null>(null);
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [showIncentiveModelDialog, setShowIncentiveModelDialog] = useState(false);
  const [selectedIncentiveModel, setSelectedIncentiveModel] = useState<string | null>(null);
  const [showAssignModel, setShowAssignModel] = useState(false);
  const [assignModelId, setAssignModelId] = useState('');
  const [editingIncentiveModel, setEditingIncentiveModel] = useState<string | null>(null);
  const [showAddPeerReviewer, setShowAddPeerReviewer] = useState(false);
  const [peerReviewerUserId, setPeerReviewerUserId] = useState('');
  const [managerReviewForm, setManagerReviewForm] = useState<string | null>(null);

  // Forms
  const [cycleForm, setCycleForm] = useState({ name: '', type: 'quarterly' as string, startDate: '', endDate: '' });
  const [goalForm, setGoalForm] = useState({ userId: '', title: '', description: '', category: 'objective' as string, dueDate: '', weight: 20 });
  const [fbForm, setFbForm] = useState({ toUserId: '', type: 'praise' as string, content: '', isPrivate: false });
  const [metricForm, setMetricForm] = useState({ name: '', description: '', targetValue: 0, unit: 'number' as string, weight: 50 });
  const [incentiveForm, setIncentiveForm] = useState({
    name: '', description: '', status: 'draft' as string,
    metrics: [] as IncentiveMetricItem[], goals: [] as IncentiveGoalItem[], outcomes: [] as IncentiveOutcome[],
  });
  const [assignForm, setAssignForm] = useState({ userId: '', period: 'Q1 2026' });

  // Computed
  const activeCycles = reviewCycles.filter(c => c.status === 'active');
  const totalReviews = reviewCycles.reduce((sum, c) => sum + c.reviewCount, 0);
  const completedReviews = reviewCycles.reduce((sum, c) => sum + c.completedCount, 0);
  const activeGoals = allGoals.filter(g => g.status === 'in_progress');
  const activeModels = incentiveModels.filter(m => m.status === 'active');

  const cycleReviews = selectedCycle ? additionalReads.getReviewsForCycle(selectedCycle) : [];
  const selectedReview = selectedReviewUser ? cycleReviews.find(r => r.userId === selectedReviewUser) : null;

  const companyUsers = users.filter(u => reads.getEmploymentRecordsForUser(u.id).some(er => er.companyId === activeCompanyId));
  const isOwnerOrAdmin = currentUser.role === 'owner' || currentUser.role === 'admin';

  // Handlers
  const toggleGoalExpand = (id: string) => {
    setExpandedGoals(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const submitReview = useCallback((reviewId: string) => {
    const review = cycleReviews.find(r => r.id === reviewId);
    if (!review) return;
    if (review.status === 'pending') {
      additionalActions.updateReview(reviewId, { status: 'self_review' });
      toast.success('Review moved to self-review stage. Employee can now begin their self-assessment.');
    } else if (review.status === 'self_review') {
      // In a real app the employee would do this themselves — admin fast-track
      additionalActions.updateReview(reviewId, { selfRating: 4, strengths: 'Strong technical skills and initiative', improvements: 'Continue developing cross-functional collaboration', status: 'manager_review' });
      toast.success('Self-review submitted (fast-tracked by admin). Manager can now review.');
    } else if (review.status === 'manager_review') {
      // Open the full manager review form
      setManagerReviewForm(reviewId);
    }
    refresh();
  }, [cycleReviews, refresh]);

  const updateGoalProgress = useCallback((goalId: string, increment: number) => {
    const goal = allGoals.find(g => g.id === goalId);
    if (!goal) return;
    const newProgress = Math.min(100, Math.max(0, goal.progress + increment));
    additionalActions.updateGoal(goalId, { progress: newProgress, status: newProgress === 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started' });
    refresh();
    toast.success(`Goal progress updated to ${newProgress}%`);
  }, [allGoals, refresh]);

  const handleAddCycle = () => {
    if (!cycleForm.name || !cycleForm.startDate || !cycleForm.endDate) { toast.error('All fields required'); return; }
    additionalActions.addReviewCycle({ ...cycleForm, companyId: activeCompanyId, type: cycleForm.type as any, status: 'draft', reviewCount: 0, completedCount: 0 });
    toast.success('Review cycle created'); setShowAddCycle(false); setCycleForm({ name: '', type: 'quarterly', startDate: '', endDate: '' }); refresh();
  };

  const handleActivateCycle = (cycleId: string) => {
    const cycle = reviewCycles.find(c => c.id === cycleId);
    if (!cycle) return;
    additionalActions.updateReviewCycle(cycleId, { status: 'active' });
    // Send notifications to all company employees
    companyUsers.forEach(u => {
      appStore.addNotification({ userId: u.id, type: 'system', title: 'Review Cycle Activated', message: `The review cycle "${cycle.name}" has been activated. Please prepare for your performance review.`, link: '/performance' });
    });
    toast.success(`Review cycle "${cycle.name}" activated — ${companyUsers.length} notifications sent`);
    refresh();
  };

  const handleDeleteCycle = (id: string) => { additionalActions.deleteReviewCycle(id); toast.success('Review cycle deleted'); setSelectedCycle(null); refresh(); };

  const handleAddGoal = () => {
    if (!goalForm.userId || !goalForm.title || !goalForm.dueDate) { toast.error('All fields required'); return; }
    additionalActions.addGoal({ ...goalForm, companyId: activeCompanyId, category: goalForm.category as any, status: 'not_started', progress: 0, weight: goalForm.weight });
    toast.success('Goal created'); setShowAddGoal(false); setGoalForm({ userId: '', title: '', description: '', category: 'objective', dueDate: '', weight: 20 }); refresh();
  };

  const handleDeleteGoal = (id: string) => { additionalActions.deleteGoal(id); toast.success('Goal deleted'); refresh(); };

  const handleAddFeedback = () => {
    if (!fbForm.toUserId || !fbForm.content) { toast.error('Recipient and content required'); return; }
    additionalActions.addFeedback({ ...fbForm, fromUserId: currentUser.id, companyId: activeCompanyId, type: fbForm.type as any });
    toast.success('Feedback submitted'); setShowAddFeedback(false); setFbForm({ toUserId: '', type: 'praise', content: '', isPrivate: false }); refresh();
  };

  const handleAddMetric = () => {
    if (!metricForm.name || !selectedGoalForMetric) { toast.error('Name and goal required'); return; }
    additionalActions.addGoalMetric({ ...metricForm, goalId: selectedGoalForMetric, companyId: activeCompanyId, currentValue: 0, unit: metricForm.unit as any });
    toast.success('Metric added'); setShowAddMetric(false); setMetricForm({ name: '', description: '', targetValue: 0, unit: 'number', weight: 50 }); refresh();
  };

  const handleRateGoal = (reviewId: string, goalId: string, rating: number, isSelf: boolean) => {
    additionalActions.upsertReviewGoalRating(reviewId, goalId, isSelf ? { selfRating: rating } : { managerRating: rating });
    toast.success('Goal rating saved'); refresh();
  };

  const handleRateMetric = (reviewId: string, metricId: string, goalId: string, rating: number, isSelf: boolean) => {
    additionalActions.upsertReviewMetricRating(reviewId, metricId, goalId, isSelf ? { selfRating: rating } : { managerRating: rating });
    toast.success('Metric rating saved'); refresh();
  };

  // Incentive handlers
  const resetIncentiveForm = () => setIncentiveForm({ name: '', description: '', status: 'draft', metrics: [], goals: [], outcomes: [] });

  const handleSaveIncentiveModel = () => {
    if (!incentiveForm.name) { toast.error('Name is required'); return; }
    if (editingIncentiveModel) {
      additionalActions.updateIncentiveModel(editingIncentiveModel, { ...incentiveForm, status: incentiveForm.status as any });
      toast.success('Incentive model updated');
    } else {
      additionalActions.addIncentiveModel({ ...incentiveForm, companyId: activeCompanyId, status: incentiveForm.status as any });
      toast.success('Incentive model created');
    }
    setShowIncentiveModelDialog(false); resetIncentiveForm(); setEditingIncentiveModel(null); refresh();
  };

  const handleDeleteIncentiveModel = (id: string) => { additionalActions.deleteIncentiveModel(id); toast.success('Incentive model deleted'); setSelectedIncentiveModel(null); refresh(); };

  const handleAssignModel = () => {
    if (!assignForm.userId || !assignModelId) { toast.error('Select an employee'); return; }
    const model = additionalReads.getIncentiveModel(assignModelId);
    additionalActions.addIncentiveAssignment({ modelId: assignModelId, userId: assignForm.userId, companyId: activeCompanyId, assignedAt: new Date().toISOString().split('T')[0], status: 'active', period: assignForm.period });
    // Send notification to assigned employee
    appStore.addNotification({ userId: assignForm.userId, type: 'system', title: 'Incentive Model Assigned', message: `You have been assigned the incentive model "${model?.name || 'Unknown'}" for period ${assignForm.period}.`, link: '/performance' });
    const assignedUser = reads.getUser(assignForm.userId);
    toast.success(`Model assigned to ${assignedUser?.firstName} ${assignedUser?.lastName} — notification sent`);
    setShowAssignModel(false); setAssignForm({ userId: '', period: 'Q1 2026' }); refresh();
  };

  // Peer review handlers
  const handleAddPeerReviewer = () => {
    if (!peerReviewerUserId || !selectedReview) { toast.error('Select a peer reviewer'); return; }
    const existingPeers = additionalReads.getPeerReviewsForReview(selectedReview.id);
    if (existingPeers.some(p => p.peerUserId === peerReviewerUserId)) { toast.error('This peer has already been added'); return; }
    additionalActions.addPeerReview({ reviewId: selectedReview.id, peerUserId: peerReviewerUserId, companyId: activeCompanyId, status: 'requested', requestedAt: new Date().toISOString().split('T')[0] });
    // Notify peer
    const reviewUser = reads.getUser(selectedReview.userId);
    appStore.addNotification({ userId: peerReviewerUserId, type: 'system', title: '360° Peer Review Request', message: `You have been asked to provide a peer review for ${reviewUser?.firstName} ${reviewUser?.lastName}.`, link: '/performance' });
    toast.success('Peer reviewer added and notified');
    setPeerReviewerUserId(''); setShowAddPeerReviewer(false); refresh();
  };

  const handleCompletePeerReview = (peerReviewId: string, rating: number, strengths: string, improvements: string) => {
    additionalActions.updatePeerReview(peerReviewId, { status: 'completed', overallRating: rating, strengths, improvements, completedAt: new Date().toISOString().split('T')[0] });
    toast.success('Peer review submitted'); refresh();
  };

  const handlePeerGoalRating = (reviewId: string, goalId: string, peerUserId: string, rating: number) => {
    additionalActions.addPeerGoalRating(reviewId, goalId, peerUserId, rating);
    toast.success('Peer goal rating saved'); refresh();
  };

  // Export functions
  const exportCSV = useCallback(() => {
    const headers = ['Employee', 'Goals', 'Avg Progress', 'Latest Rating', 'Incentive %', 'Feedback Count', 'Peer Avg Rating'];
    const rows = companyUsers.map(u => {
      const userGoals = allGoals.filter(g => g.userId === u.id);
      const avgProgress = userGoals.length > 0 ? Math.round(userGoals.reduce((s, g) => s + g.progress, 0) / userGoals.length) : 0;
      const latestReview = additionalReads.getReviewsForUser(u.id).filter(r => r.overallRating).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))[0];
      const activeInc = additionalReads.getActiveAssignmentsForUser(u.id);
      const feedbackCount = additionalReads.getFeedbackForUser(u.id).length;
      const peerReviews = additionalReads.getReviewsForUser(u.id).flatMap(r => additionalReads.getPeerReviewsForReview(r.id).filter(p => p.status === 'completed' && p.overallRating));
      const peerAvg = peerReviews.length > 0 ? (peerReviews.reduce((s, p) => s + (p.overallRating || 0), 0) / peerReviews.length).toFixed(1) : 'N/A';
      return [`${u.firstName} ${u.lastName}`, userGoals.length, `${avgProgress}%`, latestReview?.overallRating || 'N/A', activeInc.length > 0 ? `${activeInc[0].incentiveEarned}%` : '-', feedbackCount, peerAvg];
    });
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `performance-report-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  }, [companyUsers, allGoals]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Performance Report — ${company?.name || 'Company'}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    const tableData = companyUsers.map(u => {
      const userGoals = allGoals.filter(g => g.userId === u.id);
      const avgProgress = userGoals.length > 0 ? Math.round(userGoals.reduce((s, g) => s + g.progress, 0) / userGoals.length) : 0;
      const latestReview = additionalReads.getReviewsForUser(u.id).filter(r => r.overallRating).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))[0];
      const activeInc = additionalReads.getActiveAssignmentsForUser(u.id);
      const feedbackCount = additionalReads.getFeedbackForUser(u.id).length;
      const peerReviews = additionalReads.getReviewsForUser(u.id).flatMap(r => additionalReads.getPeerReviewsForReview(r.id).filter(p => p.status === 'completed' && p.overallRating));
      const peerAvg = peerReviews.length > 0 ? (peerReviews.reduce((s, p) => s + (p.overallRating || 0), 0) / peerReviews.length).toFixed(1) : 'N/A';
      return [`${u.firstName} ${u.lastName}`, String(userGoals.length), `${avgProgress}%`, latestReview?.overallRating ? `${latestReview.overallRating}/5` : 'N/A', activeInc.length > 0 ? `${activeInc[0].incentiveEarned}%` : '-', String(feedbackCount), peerAvg];
    });
    autoTable(doc, { startY: 34, head: [['Employee', 'Goals', 'Progress', 'Rating', 'Incentive', 'Feedback', 'Peer Avg']], body: tableData, styles: { fontSize: 9 }, headStyles: { fillColor: [69, 110, 146] } });
    doc.save(`performance-report-${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exported successfully');
  }, [companyUsers, allGoals, company]);

  const addIncentiveMetric = () => {
    const id = `temp_${Date.now()}`;
    setIncentiveForm(f => ({ ...f, metrics: [...f.metrics, { id, name: '', description: '', weight: 25, targetValue: 0, unit: 'percentage' }] }));
  };
  const addIncentiveGoal = () => {
    const id = `temp_${Date.now()}`;
    setIncentiveForm(f => ({ ...f, goals: [...f.goals, { id, name: '', description: '', weight: 33 }] }));
  };
  const addIncentiveOutcome = () => {
    const id = `temp_${Date.now()}`;
    setIncentiveForm(f => ({ ...f, outcomes: [...f.outcomes, { id, name: '', minRating: 1, maxRating: 5, incentivePercent: 10, description: '' }] }));
  };

  // Analytics data
  const ratingDistribution = useMemo(() => {
    const dist = [0, 0, 0, 0, 0];
    const allReviews = reviewCycles.flatMap(c => additionalReads.getReviewsForCycle(c.id));
    allReviews.forEach(r => { if (r.overallRating) dist[r.overallRating - 1]++; });
    return [1, 2, 3, 4, 5].map(r => ({ rating: `${r} - ${ratingLabels[r]}`, count: dist[r - 1], fill: CHART_COLORS[r - 1] }));
  }, [reviewCycles]);

  const goalCompletionByUser = useMemo(() => {
    return companyUsers.map(u => {
      const userGoals = allGoals.filter(g => g.userId === u.id);
      const completed = userGoals.filter(g => g.status === 'completed').length;
      const total = userGoals.length;
      return { name: `${u.firstName} ${u.lastName?.[0]}.`, id: u.id, completed, inProgress: userGoals.filter(g => g.status === 'in_progress').length, notStarted: total - completed - userGoals.filter(g => g.status === 'in_progress').length };
    }).filter(d => d.completed + d.inProgress + d.notStarted > 0);
  }, [companyUsers, allGoals]);

  const performanceTrend = useMemo(() => {
    const seen = new Set<string>();
    return reviewCycles.filter(c => c.status === 'completed' || c.status === 'active').map(c => {
      const reviews = additionalReads.getReviewsForCycle(c.id).filter(r => r.overallRating);
      const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + (r.overallRating || 0), 0) / reviews.length : 0;
      let name = c.name.replace('Review', '').trim();
      if (seen.has(name)) name = `${name} (${c.id})`;
      seen.add(name);
      return { cycle: name, avgRating: parseFloat(avg.toFixed(2)), reviews: reviews.length };
    });
  }, [reviewCycles]);

  const incentiveSummary = useMemo(() => {
    const activeAsg = allAssignments.filter(a => a.status === 'active');
    const completedAsg = allAssignments.filter(a => a.status === 'completed');
    const totalActive = activeAsg.reduce((s, a) => s + (a.incentiveEarned || 0), 0);
    const totalCompleted = completedAsg.reduce((s, a) => s + (a.incentiveEarned || 0), 0);
    return { activeCount: activeAsg.length, completedCount: completedAsg.length, activeTotal: totalActive, completedTotal: totalCompleted };
  }, [allAssignments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1">Performance Management</h1>
          <p className="text-muted-foreground">Goals, reviews, incentives, and analytics for {company?.name}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={Target} label="Active Cycles" value={activeCycles.length} color="bg-brand-primary-light text-brand-primary" />
        <StatCard icon={CheckCircle2} label="Reviews Done" value={`${completedReviews}/${totalReviews}`} color="bg-brand-success-light text-brand-success" />
        <StatCard icon={TrendingUp} label="Active Goals" value={activeGoals.length} color="bg-brand-warning-light text-brand-warning" />
        <StatCard icon={DollarSign} label="Incentive Models" value={activeModels.length} color="bg-brand-secondary-light text-brand-secondary" />
        <StatCard icon={MessageSquare} label="Feedback Notes" value={allFeedback.length} color="bg-muted text-muted-foreground" />
      </div>

      <Tabs defaultValue="cycles">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="cycles">Review Cycles</TabsTrigger>
          <TabsTrigger value="goals">Goals & Metrics</TabsTrigger>
          <TabsTrigger value="incentives">Incentive Models</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>

        {/* ─── REVIEW CYCLES ─── */}
        <TabsContent value="cycles" className="mt-4 space-y-4">
          <div className="flex justify-end"><Button onClick={() => setShowAddCycle(true)}><Plus className="w-4 h-4 mr-2" /> New Review Cycle</Button></div>
          {reviewCycles.map(cycle => {
            const pct = cycle.reviewCount > 0 ? Math.round((cycle.completedCount / cycle.reviewCount) * 100) : 0;
            const sc = cycle.status === 'active' ? 'text-brand-primary bg-brand-primary-light' : cycle.status === 'completed' ? 'text-brand-success bg-brand-success-light' : 'text-muted-foreground bg-muted';
            return (
              <Card key={cycle.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedCycle(cycle.id)}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-brand-primary-light rounded-lg"><Award className="w-6 h-6 text-brand-primary" /></div>
                      <div>
                        <div className="flex items-center gap-2"><h3>{cycle.name}</h3><Badge variant="outline" className={`text-xs border-0 ${sc}`}>{cycle.status}</Badge><Badge variant="outline" className="text-xs capitalize">{cycle.type}</Badge></div>
                        <p className="text-sm text-muted-foreground mt-1">{new Date(cycle.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(cycle.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwnerOrAdmin && cycle.status === 'draft' && <Button size="sm" variant="outline" className="text-brand-primary" onClick={e => { e.stopPropagation(); handleActivateCycle(cycle.id); }}><Bell className="w-3 h-3 mr-1" /> Activate</Button>}
                      {isOwnerOrAdmin && <Button variant="ghost" size="icon" className="text-brand-error" onClick={e => { e.stopPropagation(); handleDeleteCycle(cycle.id); }}><Trash2 className="w-4 h-4" /></Button>}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Reviews</p><p className="text-sm">{cycle.reviewCount}</p></div>
                    <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Completed</p><p className="text-sm">{cycle.completedCount}</p></div>
                    <div className="p-2 bg-muted rounded-lg"><p className="text-xs text-muted-foreground">Progress</p><p className="text-sm">{pct}%</p></div>
                  </div>
                  {cycle.status === 'active' && <div className="mt-3"><div className="w-full bg-muted rounded-full h-2"><div className="h-2 rounded-full bg-brand-primary transition-all" style={{ width: `${pct}%` }} /></div></div>}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ─── GOALS & METRICS ─── */}
        <TabsContent value="goals" className="mt-4 space-y-4">
          <div className="flex justify-end gap-2">
            <Button onClick={() => setShowAddGoal(true)}><Plus className="w-4 h-4 mr-2" /> New Goal</Button>
          </div>
          {allGoals.map(goal => {
            const user = reads.getUser(goal.userId);
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
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {user?.firstName} {user?.lastName}</span>
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
                        {isOwnerOrAdmin && <Button size="sm" variant="ghost" className="h-6 px-1 text-brand-error" onClick={() => handleDeleteGoal(goal.id)}><Trash2 className="w-3 h-3" /></Button>}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3"><div className="w-full bg-muted rounded-full h-2"><div className="h-2 rounded-full transition-all" style={{ width: `${goal.progress}%`, backgroundColor: goal.status === 'completed' ? '#5F966C' : '#456E92' }} /></div></div>

                  {/* Expanded Metrics */}
                  {isExpanded && (
                    <div className="mt-4 space-y-3 border-t pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm flex items-center gap-1"><Gauge className="w-4 h-4 text-brand-primary" /> Metrics</h4>
                        {isOwnerOrAdmin && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setSelectedGoalForMetric(goal.id); setShowAddMetric(true); }}><Plus className="w-3 h-3 mr-1" /> Add Metric</Button>}
                      </div>
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
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground">{m.currentValue} / {m.targetValue} {m.unit === 'percentage' ? '%' : m.unit === 'currency' ? '$' : ''}</span>
                                    {isOwnerOrAdmin && (
                                      <Button size="sm" variant="ghost" className="h-5 px-1 text-brand-error" onClick={() => { additionalActions.deleteGoalMetric(m.id); refresh(); toast.success('Metric deleted'); }}><Trash2 className="w-3 h-3" /></Button>
                                    )}
                                  </div>
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
        </TabsContent>

        {/* ─── INCENTIVE MODELS ─── */}
        <TabsContent value="incentives" className="mt-4 space-y-4">
          <div className="flex justify-end">
            {isOwnerOrAdmin && <Button onClick={() => { resetIncentiveForm(); setEditingIncentiveModel(null); setShowIncentiveModelDialog(true); }}><Plus className="w-4 h-4 mr-2" /> New Incentive Model</Button>}
          </div>

          {incentiveModels.map(model => {
            const modelAssignments = additionalReads.getAssignmentsForModel(model.id);
            const activeAsg = modelAssignments.filter(a => a.status === 'active');
            const statusColor = model.status === 'active' ? 'text-brand-success bg-brand-success-light' : model.status === 'draft' ? 'text-muted-foreground bg-muted' : 'text-brand-warning bg-brand-warning-light';
            return (
              <Card key={model.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-brand-warning-light rounded-lg"><DollarSign className="w-6 h-6 text-brand-warning" /></div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3>{model.name}</h3>
                          <Badge variant="outline" className={`text-xs border-0 ${statusColor}`}>{model.status}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{model.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedIncentiveModel(model.id)}><Eye className="w-4 h-4" /></Button>
                      {isOwnerOrAdmin && (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => {
                            setEditingIncentiveModel(model.id);
                            setIncentiveForm({ name: model.name, description: model.description, status: model.status, metrics: [...model.metrics], goals: [...model.goals], outcomes: [...model.outcomes] });
                            setShowIncentiveModelDialog(true);
                          }}><Edit2 className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => { setAssignModelId(model.id); setShowAssignModel(true); }}><UserPlus className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-brand-error" onClick={() => handleDeleteIncentiveModel(model.id)}><Trash2 className="w-4 h-4" /></Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    <div className="p-2 bg-muted rounded-lg text-center"><p className="text-xs text-muted-foreground">Metrics</p><p className="text-sm">{model.metrics.length}</p></div>
                    <div className="p-2 bg-muted rounded-lg text-center"><p className="text-xs text-muted-foreground">Goals</p><p className="text-sm">{model.goals.length}</p></div>
                    <div className="p-2 bg-muted rounded-lg text-center"><p className="text-xs text-muted-foreground">Outcomes</p><p className="text-sm">{model.outcomes.length}</p></div>
                    <div className="p-2 bg-muted rounded-lg text-center"><p className="text-xs text-muted-foreground">Assigned</p><p className="text-sm">{activeAsg.length}</p></div>
                  </div>
                  {activeAsg.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {activeAsg.map(a => {
                        const u = reads.getUser(a.userId);
                        return (
                          <div key={a.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-xs">
                            <div className="w-6 h-6 rounded-full bg-brand-primary-light flex items-center justify-center text-xs text-brand-primary">{u?.firstName?.[0]}{u?.lastName?.[0]}</div>
                            <span>{u?.firstName} {u?.lastName}</span>
                            {a.currentRating && <Badge variant="outline" className="text-xs">{a.currentRating}/5</Badge>}
                            {a.incentiveEarned != null && <Badge variant="outline" className="text-xs text-brand-success">{a.incentiveEarned}%</Badge>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* ─── ANALYTICS ─── */}
        <TabsContent value="analytics" className="mt-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Rating Distribution */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Rating Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={ratingDistribution} id="perf-rating-dist">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                    <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="count" name="Employees" radius={[4, 4, 0, 0]}>
                      {ratingDistribution.map((entry, idx) => <Cell key={`cell-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Trend */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Performance Trend</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={performanceTrend} id="perf-trend">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                    <XAxis dataKey="cycle" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 5]} />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="avgRating" name="Avg Rating" stroke="#456E92" strokeWidth={2} dot={{ fill: '#456E92' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Goal Completion by User */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Goal Status by Employee</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={goalCompletionByUser} layout="vertical" id="perf-goal-completion">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ececf0" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="completed" name="Completed" stackId="a" fill="#5F966C" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#456E92" />
                    <Bar dataKey="notStarted" name="Not Started" stackId="a" fill="#ececf0" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Incentive Summary */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="w-4 h-4" /> Incentive Summary</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-brand-primary-light rounded-lg text-center">
                    <p className="text-xs text-brand-primary">Active Assignments</p>
                    <p className="text-2xl text-brand-primary mt-1">{incentiveSummary.activeCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Avg {incentiveSummary.activeCount > 0 ? Math.round(incentiveSummary.activeTotal / incentiveSummary.activeCount) : 0}% earned</p>
                  </div>
                  <div className="p-4 bg-brand-success-light rounded-lg text-center">
                    <p className="text-xs text-brand-success">Completed</p>
                    <p className="text-2xl text-brand-success mt-1">{incentiveSummary.completedCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Avg {incentiveSummary.completedCount > 0 ? Math.round(incentiveSummary.completedTotal / incentiveSummary.completedCount) : 0}% earned</p>
                  </div>
                </div>
                {/* Incentive by employee */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Active Employee Incentives</p>
                  {allAssignments.filter(a => a.status === 'active').map(a => {
                    const u = reads.getUser(a.userId);
                    const model = additionalReads.getIncentiveModel(a.modelId);
                    return (
                      <div key={a.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-brand-primary-light flex items-center justify-center text-xs text-brand-primary">{u?.firstName?.[0]}{u?.lastName?.[0]}</div>
                          <div>
                            <p className="text-xs">{u?.firstName} {u?.lastName}</p>
                            <p className="text-xs text-muted-foreground">{model?.name} - {a.period}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {a.currentRating && <RatingStars rating={Math.round(a.currentRating)} />}
                          <Badge variant="outline" className="text-xs text-brand-success">{a.incentiveEarned}%</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Report Table */}
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><FileText className="w-4 h-4" /> Performance Report</CardTitle>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={exportCSV}><Download className="w-3 h-3 mr-1" /> CSV</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={exportPDF}><Download className="w-3 h-3 mr-1" /> PDF</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 text-xs text-muted-foreground">Employee</th>
                      <th className="text-center p-2 text-xs text-muted-foreground">Goals</th>
                      <th className="text-center p-2 text-xs text-muted-foreground">Avg Progress</th>
                      <th className="text-center p-2 text-xs text-muted-foreground">Latest Rating</th>
                      <th className="text-center p-2 text-xs text-muted-foreground">Incentive</th>
                      <th className="text-center p-2 text-xs text-muted-foreground">Feedback</th>
                      <th className="text-center p-2 text-xs text-muted-foreground">Peer Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyUsers.map(u => {
                      const userGoals = allGoals.filter(g => g.userId === u.id);
                      const avgProgress = userGoals.length > 0 ? Math.round(userGoals.reduce((s, g) => s + g.progress, 0) / userGoals.length) : 0;
                      const latestReview = additionalReads.getReviewsForUser(u.id).filter(r => r.overallRating).sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''))[0];
                      const activeInc = additionalReads.getActiveAssignmentsForUser(u.id);
                      const feedbackCount = additionalReads.getFeedbackForUser(u.id).length;
                      return (
                        <tr key={u.id} className="border-b hover:bg-muted/30">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-brand-primary-light flex items-center justify-center text-xs text-brand-primary">{u.firstName[0]}{u.lastName[0]}</div>
                              <span>{u.firstName} {u.lastName}</span>
                            </div>
                          </td>
                          <td className="text-center p-2">{userGoals.length}</td>
                          <td className="text-center p-2"><div className="flex items-center justify-center gap-2"><Progress value={avgProgress} className="w-16 h-1.5" /><span className="text-xs">{avgProgress}%</span></div></td>
                          <td className="text-center p-2">{latestReview?.overallRating ? <div className="flex justify-center"><RatingStars rating={latestReview.overallRating} /></div> : <span className="text-xs text-muted-foreground">N/A</span>}</td>
                          <td className="text-center p-2">{activeInc.length > 0 ? <Badge variant="outline" className="text-xs text-brand-success">{activeInc[0].incentiveEarned}%</Badge> : <span className="text-xs text-muted-foreground">-</span>}</td>
                          <td className="text-center p-2">{feedbackCount}</td>
                          <td className="text-center p-2">{(() => { const prs = additionalReads.getReviewsForUser(u.id).flatMap(r => additionalReads.getPeerReviewsForReview(r.id).filter(p => p.status === 'completed' && p.overallRating)); return prs.length > 0 ? <div className="flex justify-center"><RatingStars rating={Math.round(prs.reduce((s, p) => s + (p.overallRating || 0), 0) / prs.length)} /></div> : <span className="text-xs text-muted-foreground">N/A</span>; })()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── FEEDBACK ─── */}
        <TabsContent value="feedback" className="mt-4 space-y-3">
          <div className="flex justify-end"><Button onClick={() => setShowAddFeedback(true)}><Plus className="w-4 h-4 mr-2" /> Give Feedback</Button></div>
          {allFeedback.map(fb => {
            const from = reads.getUser(fb.fromUserId);
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
                        {fb.isPrivate && <Badge variant="outline" className="text-xs">Private</Badge>}
                      </div>
                      <p className="text-sm">{fb.content}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span><strong>{from?.firstName} {from?.lastName}</strong> &rarr; {to?.firstName} {to?.lastName}</span>
                        <span>{new Date(fb.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-brand-error" onClick={() => { additionalActions.deleteFeedback(fb.id); refresh(); toast.success('Feedback deleted'); }}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* ═══ DIALOGS ═══ */}

      {/* Review Cycle Detail */}
      <Dialog open={!!selectedCycle} onOpenChange={() => { setSelectedCycle(null); setSelectedReviewUser(null); setShowAddPeerReviewer(false); setPeerReviewerUserId(''); }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedCycle && (() => {
            const cycle = reviewCycles.find(c => c.id === selectedCycle);
            if (!cycle) return null;
            return (
              <>
                <DialogHeader><DialogTitle>{cycle.name}</DialogTitle><DialogDescription>{cycle.type} review - {new Date(cycle.startDate).toLocaleDateString()} to {new Date(cycle.endDate).toLocaleDateString()}</DialogDescription></DialogHeader>
                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-3 pb-4">
                    {selectedReview ? (() => {
                      const reviewUser = reads.getUser(selectedReview.userId);
                      const userGoals = allGoals.filter(g => g.userId === selectedReview.userId);
                      const goalRatings = additionalReads.getGoalRatingsForReview(selectedReview.id);
                      const metricRatings = additionalReads.getMetricRatingsForReview(selectedReview.id);
                      const isSelfPhase = selectedReview.status === 'self_review';
                      const isManagerPhase = selectedReview.status === 'manager_review';
                      const canSelfRate = isSelfPhase && (currentUser.id === selectedReview.userId || isOwnerOrAdmin);
                      const canManagerRate = isManagerPhase && (currentUser.id === selectedReview.reviewerId || isOwnerOrAdmin);

                      return (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedReviewUser(null)} className="text-brand-primary">&larr; Back to Reviews</Button>
                            {selectedReview.status !== 'completed' && <Button size="sm" onClick={() => submitReview(selectedReview.id)}>{selectedReview.status === 'pending' ? 'Start Review' : selectedReview.status === 'self_review' ? 'Fast-track Self-Review' : 'Begin Manager Assessment'}</Button>}
                          </div>

                          <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center text-sm text-brand-primary">{reviewUser?.firstName[0]}{reviewUser?.lastName[0]}</div>
                            <div>
                              <p className="text-sm">{reviewUser?.firstName} {reviewUser?.lastName}</p>
                              <Badge variant="outline" className={`text-xs border-0 ${reviewStatusColors[selectedReview.status]}`}>{selectedReview.status.replace(/_/g, ' ')}</Badge>
                            </div>
                          </div>

                          {/* Overall Ratings */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground mb-1">Self Rating</p>{selectedReview.selfRating ? <><RatingStars rating={selectedReview.selfRating} size="lg" /><p className="text-xs text-muted-foreground mt-1">{ratingLabels[selectedReview.selfRating]}</p></> : <p className="text-sm text-muted-foreground">Not submitted</p>}</div>
                            <div className="p-3 bg-muted rounded-lg"><p className="text-xs text-muted-foreground mb-1">Manager Rating</p>{selectedReview.managerRating ? <><RatingStars rating={selectedReview.managerRating} size="lg" /><p className="text-xs text-muted-foreground mt-1">{ratingLabels[selectedReview.managerRating]}</p></> : <p className="text-sm text-muted-foreground">Not submitted</p>}</div>
                          </div>

                          {selectedReview.overallRating && <div className="p-4 bg-brand-primary-light rounded-lg text-center"><p className="text-xs text-brand-primary mb-1">Overall Rating</p><div className="flex items-center justify-center gap-2"><RatingStars rating={selectedReview.overallRating} size="lg" /><span className={`text-lg ${ratingColors[selectedReview.overallRating]}`}>{selectedReview.overallRating}/5</span></div><p className="text-sm text-brand-primary mt-1">{ratingLabels[selectedReview.overallRating]}</p></div>}

                          {/* Per-Goal Ratings */}
                          {userGoals.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-brand-primary" /> Goal-Level Ratings</h4>
                              {userGoals.map(goal => {
                                const gr = goalRatings.find(r => r.goalId === goal.id);
                                const goalMetricsForGoal = additionalReads.getMetricsForGoal(goal.id);
                                return (
                                  <div key={goal.id} className="p-3 border rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-sm">{goal.title}</span>
                                        <Badge variant="outline" className="text-xs ml-2">{goal.weight}%</Badge>
                                      </div>
                                      <span className="text-xs text-muted-foreground">{goal.progress}% complete</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="p-2 bg-muted/50 rounded">
                                        <p className="text-xs text-muted-foreground mb-1">Self Rating</p>
                                        <RatingStars rating={gr?.selfRating || 0} size="sm" interactive={canSelfRate} onRate={r => handleRateGoal(selectedReview.id, goal.id, r, true)} />
                                        {gr?.selfComment && <p className="text-xs text-muted-foreground mt-1 italic">{gr.selfComment}</p>}
                                      </div>
                                      <div className="p-2 bg-muted/50 rounded">
                                        <p className="text-xs text-muted-foreground mb-1">Manager Rating</p>
                                        <RatingStars rating={gr?.managerRating || 0} size="sm" interactive={canManagerRate} onRate={r => handleRateGoal(selectedReview.id, goal.id, r, false)} />
                                        {gr?.managerComment && <p className="text-xs text-muted-foreground mt-1 italic">{gr.managerComment}</p>}
                                      </div>
                                    </div>

                                    {/* Per-Metric Ratings within Goal */}
                                    {goalMetricsForGoal.length > 0 && (
                                      <div className="ml-4 space-y-1 border-l-2 border-brand-primary/20 pl-3">
                                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Gauge className="w-3 h-3" /> Metric Ratings</p>
                                        {goalMetricsForGoal.map(m => {
                                          const mr = metricRatings.find(r => r.metricId === m.id);
                                          return (
                                            <div key={m.id} className="flex items-center justify-between p-1.5 bg-muted/30 rounded text-xs">
                                              <div className="flex items-center gap-2">
                                                <span>{m.name}</span>
                                                <Badge variant="outline" className="text-xs">{m.weight}%</Badge>
                                              </div>
                                              <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-1">
                                                  <span className="text-muted-foreground">Self:</span>
                                                  <RatingStars rating={mr?.selfRating || 0} interactive={canSelfRate} onRate={r => handleRateMetric(selectedReview.id, m.id, goal.id, r, true)} />
                                                </div>
                                                <div className="flex items-center gap-1">
                                                  <span className="text-muted-foreground">Mgr:</span>
                                                  <RatingStars rating={mr?.managerRating || 0} interactive={canManagerRate} onRate={r => handleRateMetric(selectedReview.id, m.id, goal.id, r, false)} />
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {selectedReview.strengths && <div className="p-3 border rounded-lg"><p className="text-xs text-muted-foreground mb-1">Strengths</p><p className="text-sm">{selectedReview.strengths}</p></div>}
                          {selectedReview.improvements && <div className="p-3 border rounded-lg"><p className="text-xs text-muted-foreground mb-1">Areas for Improvement</p><p className="text-sm">{selectedReview.improvements}</p></div>}
                          {selectedReview.managerComments && <div className="p-3 bg-brand-success-light rounded-lg"><p className="text-xs text-brand-success mb-1">Manager Comments</p><p className="text-sm">{selectedReview.managerComments}</p></div>}

                          {/* 360° Peer Reviews */}
                          {(() => {
                            const peerReviewsList = additionalReads.getPeerReviewsForReview(selectedReview.id);
                            const completedPeers = peerReviewsList.filter(p => p.status === 'completed');
                            const peerAvg = completedPeers.length > 0 ? (completedPeers.reduce((s, p) => s + (p.overallRating || 0), 0) / completedPeers.length) : 0;
                            return (
                              <div className="space-y-3 border-t pt-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm flex items-center gap-2"><UserCheck className="w-4 h-4 text-brand-primary" /> 360° Peer Reviews ({completedPeers.length}/{peerReviewsList.length})</h4>
                                  <div className="flex items-center gap-2">
                                    {completedPeers.length > 0 && <Badge variant="outline" className="text-xs text-brand-primary">Avg: {peerAvg.toFixed(1)}/5</Badge>}
                                    {isOwnerOrAdmin && selectedReview.status !== 'completed' && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowAddPeerReviewer(true)}><Plus className="w-3 h-3 mr-1" /> Add Peer</Button>}
                                  </div>
                                </div>
                                {peerReviewsList.length === 0 ? (
                                  <p className="text-xs text-muted-foreground italic">No peer reviewers assigned yet. Add peers for 360° feedback.</p>
                                ) : (
                                  <div className="space-y-2">
                                    {peerReviewsList.map(pr => {
                                      const peer = reads.getUser(pr.peerUserId);
                                      const statusColor = pr.status === 'completed' ? 'text-brand-success bg-brand-success-light' : pr.status === 'requested' ? 'text-brand-warning bg-brand-warning-light' : pr.status === 'declined' ? 'text-brand-error bg-brand-error-light' : 'text-brand-primary bg-brand-primary-light';
                                      return (
                                        <div key={pr.id} className="p-3 border rounded-lg">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                              <div className="w-7 h-7 rounded-full bg-brand-primary-light flex items-center justify-center text-xs text-brand-primary">{peer?.firstName?.[0]}{peer?.lastName?.[0]}</div>
                                              <div>
                                                <span className="text-sm">{peer?.firstName} {peer?.lastName}</span>
                                                <Badge variant="outline" className={`text-xs border-0 ml-2 ${statusColor}`}>{pr.status}</Badge>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {pr.overallRating && <RatingStars rating={pr.overallRating} />}
                                              {isOwnerOrAdmin && pr.status === 'requested' && (
                                                <Button size="sm" variant="ghost" className="h-6 px-1 text-brand-error" onClick={() => { additionalActions.deletePeerReview(pr.id); refresh(); toast.success('Peer reviewer removed'); }}><Trash2 className="w-3 h-3" /></Button>
                                              )}
                                            </div>
                                          </div>
                                          {pr.status === 'completed' && (
                                            <div className="ml-9 space-y-1">
                                              {pr.strengths && <p className="text-xs"><span className="text-muted-foreground">Strengths:</span> {pr.strengths}</p>}
                                              {pr.improvements && <p className="text-xs"><span className="text-muted-foreground">Areas to improve:</span> {pr.improvements}</p>}
                                            </div>
                                          )}
                                          {pr.status === 'requested' && currentUser.id === pr.peerUserId && (
                                            <div className="ml-9 mt-2 p-2 bg-brand-warning-light rounded">
                                              <p className="text-xs text-brand-warning mb-2">You have been asked to provide feedback. Click below to submit your peer review.</p>
                                              <Button size="sm" className="h-6 text-xs" onClick={() => handleCompletePeerReview(pr.id, 4, 'Great team player with strong skills', 'Could improve on cross-team collaboration')}>Submit Peer Review</Button>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* Per-goal peer ratings display */}
                                {completedPeers.length > 0 && userGoals.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> Peer Goal Ratings</p>
                                    {userGoals.map(goal => {
                                      const gr = goalRatings.find(r => r.goalId === goal.id);
                                      const peerRatingsForGoal = gr?.peerRatings || [];
                                      const peerGoalAvg = peerRatingsForGoal.length > 0 ? (peerRatingsForGoal.reduce((s, p) => s + p.rating, 0) / peerRatingsForGoal.length) : null;
                                      return (
                                        <div key={goal.id} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
                                          <span>{goal.title}</span>
                                          <div className="flex items-center gap-2">
                                            {peerGoalAvg !== null ? (
                                              <><RatingStars rating={Math.round(peerGoalAvg)} /><span className="text-muted-foreground">{peerGoalAvg.toFixed(1)}</span></>
                                            ) : (
                                              completedPeers.map(pr => (
                                                <Button key={pr.id} size="sm" variant="ghost" className="h-5 px-1 text-xs" onClick={() => handlePeerGoalRating(selectedReview.id, goal.id, pr.peerUserId, 4)}>
                                                  Rate ({reads.getUser(pr.peerUserId)?.firstName?.[0]})
                                                </Button>
                                              ))
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })() : (
                      cycleReviews.map(review => {
                        const user = reads.getUser(review.userId);
                        const reviewer = reads.getUser(review.reviewerId);
                        return (
                          <div key={review.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => setSelectedReviewUser(review.userId)}>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-brand-primary-light flex items-center justify-center text-sm text-brand-primary">{user?.firstName[0]}{user?.lastName[0]}</div>
                              <div><p className="text-sm">{user?.firstName} {user?.lastName}</p><p className="text-xs text-muted-foreground">Reviewer: {reviewer?.firstName} {reviewer?.lastName}</p></div>
                            </div>
                            <div className="flex items-center gap-2">
                              {review.overallRating && <RatingStars rating={review.overallRating} />}
                              <Badge variant="outline" className={`text-xs border-0 ${reviewStatusColors[review.status]}`}>{review.status.replace(/_/g, ' ')}</Badge>
                              {review.status === 'manager_review' && (
                                <Button size="sm" variant="outline" className="text-xs h-7" onClick={(e) => { e.stopPropagation(); setManagerReviewForm(review.id); }}>
                                  Begin Assessment
                                </Button>
                              )}
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Add Review Cycle */}
      <Dialog open={showAddCycle} onOpenChange={setShowAddCycle}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Review Cycle</DialogTitle><DialogDescription>Create a new performance review cycle for your company</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={cycleForm.name} onChange={e => setCycleForm(f => ({ ...f, name: e.target.value }))} placeholder="Q2 2026 Review" /></div>
            <div className="space-y-2"><Label>Type / Frequency</Label><Select value={cycleForm.type} onValueChange={v => setCycleForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['annual', 'quarterly', 'probation', 'promotion'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Start Date *</Label><Input type="date" value={cycleForm.startDate} onChange={e => setCycleForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label>End Date *</Label><Input type="date" value={cycleForm.endDate} onChange={e => setCycleForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddCycle(false)}>Cancel</Button><Button onClick={handleAddCycle}>Create Cycle</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Goal */}
      <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Goal</DialogTitle><DialogDescription>Create a new performance goal for an employee</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Employee *</Label><Select value={goalForm.userId} onValueChange={v => setGoalForm(f => ({ ...f, userId: v }))}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{companyUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Title *</Label><Input value={goalForm.title} onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={goalForm.description} onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Category</Label><Select value={goalForm.category} onValueChange={v => setGoalForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['objective', 'key_result', 'development'].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Weight %</Label><Input type="number" value={goalForm.weight} onChange={e => setGoalForm(f => ({ ...f, weight: parseInt(e.target.value) || 0 }))} min={0} max={100} /></div>
              <div className="space-y-2"><Label>Due Date *</Label><Input type="date" value={goalForm.dueDate} onChange={e => setGoalForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddGoal(false)}>Cancel</Button><Button onClick={handleAddGoal}>Create Goal</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Metric to Goal */}
      <Dialog open={showAddMetric} onOpenChange={setShowAddMetric}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Metric</DialogTitle><DialogDescription>Add a measurable metric to this goal</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Name *</Label><Input value={metricForm.name} onChange={e => setMetricForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g., Code Coverage" /></div>
            <div className="space-y-2"><Label>Description</Label><Textarea value={metricForm.description} onChange={e => setMetricForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Target Value</Label><Input type="number" value={metricForm.targetValue} onChange={e => setMetricForm(f => ({ ...f, targetValue: parseFloat(e.target.value) || 0 }))} /></div>
              <div className="space-y-2"><Label>Unit</Label><Select value={metricForm.unit} onValueChange={v => setMetricForm(f => ({ ...f, unit: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['percentage', 'number', 'currency', 'rating'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Weight %</Label><Input type="number" value={metricForm.weight} onChange={e => setMetricForm(f => ({ ...f, weight: parseInt(e.target.value) || 0 }))} min={0} max={100} /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddMetric(false)}>Cancel</Button><Button onClick={handleAddMetric}>Add Metric</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Give Feedback */}
      <Dialog open={showAddFeedback} onOpenChange={setShowAddFeedback}>
        <DialogContent>
          <DialogHeader><DialogTitle>Give Feedback</DialogTitle><DialogDescription>Provide feedback to a colleague</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>To *</Label><Select value={fbForm.toUserId} onValueChange={v => setFbForm(f => ({ ...f, toUserId: v }))}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{companyUsers.filter(u => u.id !== currentUser.id).map(u => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Type</Label><Select value={fbForm.type} onValueChange={v => setFbForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['praise', 'coaching', 'warning', 'note'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Content *</Label><Textarea value={fbForm.content} onChange={e => setFbForm(f => ({ ...f, content: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddFeedback(false)}>Cancel</Button><Button onClick={handleAddFeedback}>Submit Feedback</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Incentive Model Create/Edit Dialog */}
      <Dialog open={showIncentiveModelDialog} onOpenChange={(open) => { if (!open) { setShowIncentiveModelDialog(false); setEditingIncentiveModel(null); } }}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>{editingIncentiveModel ? 'Edit' : 'Create'} Incentive Model</DialogTitle><DialogDescription>Define metrics, goals, and outcome tiers for the incentive model</DialogDescription></DialogHeader>
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 pb-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Name *</Label><Input value={incentiveForm.name} onChange={e => setIncentiveForm(f => ({ ...f, name: e.target.value }))} placeholder="Delivery Excellence" /></div>
                  <div className="space-y-2"><Label>Status</Label><Select value={incentiveForm.status} onValueChange={v => setIncentiveForm(f => ({ ...f, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['draft', 'active', 'archived'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
                </div>
                <div className="space-y-2"><Label>Description</Label><Textarea value={incentiveForm.description} onChange={e => setIncentiveForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              </div>

              {/* Metrics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm flex items-center gap-2"><Gauge className="w-4 h-4 text-brand-primary" /> Metrics ({incentiveForm.metrics.length})</h4>
                  <Button size="sm" variant="outline" onClick={addIncentiveMetric}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </div>
                {incentiveForm.metrics.map((m, idx) => (
                  <div key={m.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Metric {idx + 1}</span>
                      <Button size="sm" variant="ghost" className="h-5 px-1 text-brand-error" onClick={() => setIncentiveForm(f => ({ ...f, metrics: f.metrics.filter(x => x.id !== m.id) }))}><X className="w-3 h-3" /></Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Input placeholder="Name" value={m.name} onChange={e => { const metrics = [...incentiveForm.metrics]; metrics[idx] = { ...m, name: e.target.value }; setIncentiveForm(f => ({ ...f, metrics })); }} className="col-span-2" />
                      <Input type="number" placeholder="Target" value={m.targetValue || ''} onChange={e => { const metrics = [...incentiveForm.metrics]; metrics[idx] = { ...m, targetValue: parseFloat(e.target.value) || 0 }; setIncentiveForm(f => ({ ...f, metrics })); }} />
                      <Input type="number" placeholder="Weight %" value={m.weight || ''} onChange={e => { const metrics = [...incentiveForm.metrics]; metrics[idx] = { ...m, weight: parseInt(e.target.value) || 0 }; setIncentiveForm(f => ({ ...f, metrics })); }} />
                    </div>
                    <Input placeholder="Description" value={m.description} onChange={e => { const metrics = [...incentiveForm.metrics]; metrics[idx] = { ...m, description: e.target.value }; setIncentiveForm(f => ({ ...f, metrics })); }} />
                  </div>
                ))}
                {incentiveForm.metrics.length > 0 && (() => {
                  const totalW = incentiveForm.metrics.reduce((s, m) => s + m.weight, 0);
                  return <p className={`text-xs ${totalW === 100 ? 'text-brand-success' : 'text-brand-error'}`}>Total weight: {totalW}% {totalW !== 100 ? '(should be 100%)' : ''}</p>;
                })()}
              </div>

              {/* Goals */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-brand-primary" /> Goals ({incentiveForm.goals.length})</h4>
                  <Button size="sm" variant="outline" onClick={addIncentiveGoal}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </div>
                {incentiveForm.goals.map((g, idx) => (
                  <div key={g.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Goal {idx + 1}</span>
                      <Button size="sm" variant="ghost" className="h-5 px-1 text-brand-error" onClick={() => setIncentiveForm(f => ({ ...f, goals: f.goals.filter(x => x.id !== g.id) }))}><X className="w-3 h-3" /></Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="Name" value={g.name} onChange={e => { const goals = [...incentiveForm.goals]; goals[idx] = { ...g, name: e.target.value }; setIncentiveForm(f => ({ ...f, goals })); }} className="col-span-2" />
                      <Input type="number" placeholder="Weight %" value={g.weight || ''} onChange={e => { const goals = [...incentiveForm.goals]; goals[idx] = { ...g, weight: parseInt(e.target.value) || 0 }; setIncentiveForm(f => ({ ...f, goals })); }} />
                    </div>
                    <Input placeholder="Description" value={g.description} onChange={e => { const goals = [...incentiveForm.goals]; goals[idx] = { ...g, description: e.target.value }; setIncentiveForm(f => ({ ...f, goals })); }} />
                  </div>
                ))}
                {incentiveForm.goals.length > 0 && (() => {
                  const totalW = incentiveForm.goals.reduce((s, g) => s + g.weight, 0);
                  return <p className={`text-xs ${totalW === 100 ? 'text-brand-success' : 'text-brand-error'}`}>Total weight: {totalW}% {totalW !== 100 ? '(should be 100%)' : ''}</p>;
                })()}
              </div>

              {/* Outcomes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm flex items-center gap-2"><Award className="w-4 h-4 text-brand-warning" /> Outcomes ({incentiveForm.outcomes.length})</h4>
                  <Button size="sm" variant="outline" onClick={addIncentiveOutcome}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </div>
                {incentiveForm.outcomes.map((o, idx) => (
                  <div key={o.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Outcome {idx + 1}</span>
                      <Button size="sm" variant="ghost" className="h-5 px-1 text-brand-error" onClick={() => setIncentiveForm(f => ({ ...f, outcomes: f.outcomes.filter(x => x.id !== o.id) }))}><X className="w-3 h-3" /></Button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <Input placeholder="Name" value={o.name} onChange={e => { const outcomes = [...incentiveForm.outcomes]; outcomes[idx] = { ...o, name: e.target.value }; setIncentiveForm(f => ({ ...f, outcomes })); }} />
                      <Input type="number" placeholder="Min Rating" value={o.minRating || ''} onChange={e => { const outcomes = [...incentiveForm.outcomes]; outcomes[idx] = { ...o, minRating: parseFloat(e.target.value) || 0 }; setIncentiveForm(f => ({ ...f, outcomes })); }} />
                      <Input type="number" placeholder="Max Rating" value={o.maxRating || ''} onChange={e => { const outcomes = [...incentiveForm.outcomes]; outcomes[idx] = { ...o, maxRating: parseFloat(e.target.value) || 0 }; setIncentiveForm(f => ({ ...f, outcomes })); }} />
                      <Input type="number" placeholder="Incentive %" value={o.incentivePercent || ''} onChange={e => { const outcomes = [...incentiveForm.outcomes]; outcomes[idx] = { ...o, incentivePercent: parseFloat(e.target.value) || 0 }; setIncentiveForm(f => ({ ...f, outcomes })); }} />
                    </div>
                    <Input placeholder="Description" value={o.description} onChange={e => { const outcomes = [...incentiveForm.outcomes]; outcomes[idx] = { ...o, description: e.target.value }; setIncentiveForm(f => ({ ...f, outcomes })); }} />
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => { setShowIncentiveModelDialog(false); setEditingIncentiveModel(null); }}>Cancel</Button>
            <Button onClick={handleSaveIncentiveModel}>{editingIncentiveModel ? 'Update' : 'Create'} Model</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Incentive Model Detail */}
      <Dialog open={!!selectedIncentiveModel} onOpenChange={() => setSelectedIncentiveModel(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          {selectedIncentiveModel && (() => {
            const model = additionalReads.getIncentiveModel(selectedIncentiveModel);
            if (!model) return null;
            const modelAssignments = additionalReads.getAssignmentsForModel(model.id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">{model.name} <Badge variant="outline" className={`text-xs border-0 ${model.status === 'active' ? 'text-brand-success bg-brand-success-light' : 'text-muted-foreground bg-muted'}`}>{model.status}</Badge></DialogTitle>
                  <DialogDescription>{model.description}</DialogDescription>
                </DialogHeader>
                <ScrollArea className="flex-1 -mx-6 px-6">
                  <div className="space-y-6 pb-4">
                    {/* Metrics */}
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

                    {/* Goals */}
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

                    {/* Outcomes */}
                    <div>
                      <h4 className="text-sm mb-2 flex items-center gap-2"><Award className="w-4 h-4 text-brand-warning" /> Outcomes</h4>
                      <div className="space-y-2">
                        {model.outcomes.map(o => (
                          <div key={o.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                              <p className="text-sm">{o.name}</p>
                              <p className="text-xs text-muted-foreground">{o.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">Rating range: {o.minRating} - {o.maxRating}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg text-brand-success">{o.incentivePercent}%</p>
                              <p className="text-xs text-muted-foreground">incentive</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Assignments */}
                    <div>
                      <h4 className="text-sm mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-brand-primary" /> Assignments ({modelAssignments.length})</h4>
                      <div className="space-y-2">
                        {modelAssignments.map(a => {
                          const u = reads.getUser(a.userId);
                          const statusColor = a.status === 'active' ? 'text-brand-primary bg-brand-primary-light' : a.status === 'completed' ? 'text-brand-success bg-brand-success-light' : 'text-muted-foreground bg-muted';
                          return (
                            <div key={a.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-brand-primary-light flex items-center justify-center text-xs text-brand-primary">{u?.firstName?.[0]}{u?.lastName?.[0]}</div>
                                <div>
                                  <p className="text-sm">{u?.firstName} {u?.lastName}</p>
                                  <p className="text-xs text-muted-foreground">{a.period}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`text-xs border-0 ${statusColor}`}>{a.status}</Badge>
                                {a.currentRating && <RatingStars rating={Math.round(a.currentRating)} />}
                                {a.incentiveEarned != null && <Badge variant="outline" className="text-xs text-brand-success">{a.incentiveEarned}%</Badge>}
                              </div>
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

      {/* Assign Incentive Model to Employee */}
      <Dialog open={showAssignModel} onOpenChange={setShowAssignModel}>
        <DialogContent>
          <DialogHeader><DialogTitle>Assign Incentive Model</DialogTitle><DialogDescription>Assign this model to an employee for a period</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Employee *</Label><Select value={assignForm.userId} onValueChange={v => setAssignForm(f => ({ ...f, userId: v }))}><SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger><SelectContent>{companyUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Period</Label><Input value={assignForm.period} onChange={e => setAssignForm(f => ({ ...f, period: e.target.value }))} placeholder="Q1 2026" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAssignModel(false)}>Cancel</Button><Button onClick={handleAssignModel}>Assign</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Peer Reviewer */}
      <Dialog open={showAddPeerReviewer} onOpenChange={setShowAddPeerReviewer}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Peer Reviewer</DialogTitle><DialogDescription>Select a colleague to provide 360° feedback for this review</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Peer Reviewer *</Label>
              <Select value={peerReviewerUserId} onValueChange={setPeerReviewerUserId}>
                <SelectTrigger><SelectValue placeholder="Select peer" /></SelectTrigger>
                <SelectContent>
                  {companyUsers.filter(u => {
                    if (!selectedReview) return false;
                    if (u.id === selectedReview.userId || u.id === selectedReview.reviewerId) return false;
                    const existingPeers = additionalReads.getPeerReviewsForReview(selectedReview.id);
                    return !existingPeers.some(p => p.peerUserId === u.id);
                  }).map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">The selected peer will receive a notification requesting them to provide feedback. Their review will include overall rating, strengths, and areas for improvement.</p>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setShowAddPeerReviewer(false)}>Cancel</Button><Button onClick={handleAddPeerReviewer}><UserCheck className="w-4 h-4 mr-2" /> Request Review</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ FULL-SCREEN MANAGER REVIEW FORM ═══ */}
      {managerReviewForm && (
        <div className="fixed inset-0 z-50 bg-background overflow-auto">
          <PerformanceReviewForm
            reviewId={managerReviewForm}
            mode="manager"
            onClose={() => setManagerReviewForm(null)}
            onSubmitted={() => { setManagerReviewForm(null); refresh(); }}
          />
        </div>
      )}
    </div>
  );
}
