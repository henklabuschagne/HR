import { useState, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { additionalReads, additionalActions } from '../lib/additionalStore';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import {
  Target, Star, Award, Clock, CheckCircle2, AlertCircle,
  Gauge, Percent, ChevronDown, ChevronUp, Send, ArrowLeft,
  User, FileText, MessageSquare, Sparkles,
} from 'lucide-react';

const ratingLabels: Record<number, string> = { 1: 'Needs Improvement', 2: 'Developing', 3: 'Meets Expectations', 4: 'Exceeds Expectations', 5: 'Exceptional' };
const ratingColors: Record<number, string> = { 1: 'text-brand-error', 2: 'text-brand-warning', 3: 'text-brand-primary', 4: 'text-brand-success', 5: 'text-brand-success' };
const ratingBgColors: Record<number, string> = { 1: 'bg-brand-error-light', 2: 'bg-brand-warning-light', 3: 'bg-brand-primary-light', 4: 'bg-brand-success-light', 5: 'bg-brand-success-light' };
const goalStatusColors: Record<string, string> = { not_started: 'text-muted-foreground bg-muted', in_progress: 'text-brand-primary bg-brand-primary-light', completed: 'text-brand-success bg-brand-success-light', cancelled: 'text-brand-error bg-brand-error-light' };

function InteractiveStars({ rating, onRate, size = 'md' }: { rating: number; onRate: (r: number) => void; size?: 'sm' | 'md' | 'lg' }) {
  const [hover, setHover] = useState(0);
  const sizeClasses = size === 'lg' ? 'w-7 h-7' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sizeClasses} cursor-pointer transition-all duration-150 ${
            i <= (hover || rating) ? 'text-brand-warning fill-brand-warning scale-110' : 'text-muted-foreground/30 hover:text-brand-warning/50'
          }`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onRate(i)}
        />
      ))}
      {(hover || rating) > 0 && (
        <span className={`text-sm ml-2 ${ratingColors[hover || rating]}`}>
          {ratingLabels[hover || rating]}
        </span>
      )}
    </div>
  );
}

function ReadOnlyStars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = size === 'lg' ? 'w-6 h-6' : size === 'md' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`${sizeClasses} ${i <= rating ? 'text-brand-warning fill-brand-warning' : 'text-muted-foreground/20'}`}
        />
      ))}
    </div>
  );
}

interface GoalRatingForm {
  goalId: string;
  rating: number;
  comment: string;
}

interface MetricRatingForm {
  metricId: string;
  goalId: string;
  rating: number;
}

interface ReviewFormData {
  overallRating: number;
  strengths: string;
  improvements: string;
  managerComments: string;
  goalRatings: GoalRatingForm[];
  metricRatings: MetricRatingForm[];
}

interface PerformanceReviewFormProps {
  reviewId: string;
  mode: 'self' | 'manager';
  onClose: () => void;
  onSubmitted: () => void;
}

export function PerformanceReviewForm({ reviewId, mode, onClose, onSubmitted }: PerformanceReviewFormProps) {
  const { reads } = useAppStore('session', 'users');

  // Find review and its cycle
  const reviewData = useMemo(() => {
    const allCycles = additionalReads.getReviewCyclesForCompany('c1');
    for (const c of allCycles) {
      const found = additionalReads.getReviewsForCycle(c.id).find(r => r.id === reviewId);
      if (found) return { review: found, cycle: c };
    }
    return null;
  }, [reviewId]);

  const employee = reviewData ? reads.getUser(reviewData.review.userId) : null;
  const userGoals = reviewData ? additionalReads.getGoalsForUser(reviewData.review.userId) : [];
  const existingGoalRatings = additionalReads.getGoalRatingsForReview(reviewId);
  const existingMetricRatings = additionalReads.getMetricRatingsForReview(reviewId);

  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set(userGoals.map(g => g.id)));
  const [currentStep, setCurrentStep] = useState(0); // 0=goals, 1=overall, 2=confirm

  // Form state
  const [formData, setFormData] = useState<ReviewFormData>(() => ({
    overallRating: mode === 'manager' ? 0 : 0,
    strengths: mode === 'manager' ? '' : (reviewData?.review.strengths || ''),
    improvements: mode === 'manager' ? '' : (reviewData?.review.improvements || ''),
    managerComments: '',
    goalRatings: userGoals.map(g => {
      const existing = existingGoalRatings.find(r => r.goalId === g.id);
      return {
        goalId: g.id,
        rating: mode === 'self' ? (existing?.selfRating || 0) : (existing?.managerRating || 0),
        comment: mode === 'self' ? (existing?.selfComment || '') : (existing?.managerComment || ''),
      };
    }),
    metricRatings: userGoals.flatMap(g => {
      const metrics = additionalReads.getMetricsForGoal(g.id);
      return metrics.map(m => {
        const existing = existingMetricRatings.find(r => r.metricId === m.id);
        return {
          metricId: m.id,
          goalId: g.id,
          rating: mode === 'self' ? (existing?.selfRating || 0) : (existing?.managerRating || 0),
        };
      });
    }),
  }));

  if (!reviewData || !employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Review not found</p>
      </div>
    );
  }

  const { review: rev, cycle } = reviewData;

  const toggleGoal = (id: string) => {
    setExpandedGoals(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const updateGoalRating = (goalId: string, field: 'rating' | 'comment', value: number | string) => {
    setFormData(prev => ({
      ...prev,
      goalRatings: prev.goalRatings.map(gr =>
        gr.goalId === goalId ? { ...gr, [field]: value } : gr
      ),
    }));
  };

  const updateMetricRating = (metricId: string, rating: number) => {
    setFormData(prev => ({
      ...prev,
      metricRatings: prev.metricRatings.map(mr =>
        mr.metricId === metricId ? { ...mr, rating } : mr
      ),
    }));
  };

  // Validation
  const goalsCompleted = formData.goalRatings.every(gr => gr.rating > 0 && gr.comment.trim().length > 0);
  const metricsCompleted = formData.metricRatings.length === 0 || formData.metricRatings.every(mr => mr.rating > 0);
  const overallCompleted = formData.overallRating > 0 && formData.strengths.trim().length > 0 && formData.improvements.trim().length > 0;
  const managerCommentsCompleted = mode === 'manager' ? formData.managerComments.trim().length > 0 : true;
  const canSubmit = goalsCompleted && metricsCompleted && overallCompleted && managerCommentsCompleted;

  const completedGoalCount = formData.goalRatings.filter(gr => gr.rating > 0 && gr.comment.trim().length > 0).length;
  const completedMetricCount = formData.metricRatings.filter(mr => mr.rating > 0).length;
  const totalItems = formData.goalRatings.length + formData.metricRatings.length + 3; // +3 for overall, strengths, improvements
  const completedItems = completedGoalCount + completedMetricCount + (formData.overallRating > 0 ? 1 : 0) + (formData.strengths.trim() ? 1 : 0) + (formData.improvements.trim() ? 1 : 0);
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Computed average
  const avgGoalRating = formData.goalRatings.filter(g => g.rating > 0).length > 0
    ? formData.goalRatings.filter(g => g.rating > 0).reduce((s, g) => {
        const goal = userGoals.find(ug => ug.id === g.goalId);
        return s + g.rating * ((goal?.weight || 1) / 100);
      }, 0) / (formData.goalRatings.filter(g => g.rating > 0).reduce((s, g) => {
        const goal = userGoals.find(ug => ug.id === g.goalId);
        return s + (goal?.weight || 1) / 100;
      }, 0) || 1)
    : 0;

  const handleSubmit = () => {
    // Save goal ratings
    formData.goalRatings.forEach(gr => {
      if (mode === 'self') {
        additionalActions.upsertReviewGoalRating(reviewId, gr.goalId, {
          selfRating: gr.rating,
          selfComment: gr.comment,
        });
      } else {
        additionalActions.upsertReviewGoalRating(reviewId, gr.goalId, {
          managerRating: gr.rating,
          managerComment: gr.comment,
        });
      }
    });

    // Save metric ratings
    formData.metricRatings.forEach(mr => {
      if (mode === 'self') {
        additionalActions.upsertReviewMetricRating(reviewId, mr.metricId, mr.goalId, {
          selfRating: mr.rating,
        });
      } else {
        additionalActions.upsertReviewMetricRating(reviewId, mr.metricId, mr.goalId, {
          managerRating: mr.rating,
        });
      }
    });

    // Update review
    if (mode === 'self') {
      additionalActions.updateReview(reviewId, {
        selfRating: formData.overallRating,
        strengths: formData.strengths,
        improvements: formData.improvements,
        status: 'manager_review',
      });
      toast.success('Self-review submitted successfully! Your manager will now complete their assessment.');
    } else {
      const overall = Math.round(((rev.selfRating || formData.overallRating) + formData.overallRating) / 2);
      additionalActions.updateReview(reviewId, {
        managerRating: formData.overallRating,
        managerComments: formData.managerComments,
        overallRating: overall,
        strengths: rev.strengths ? `${rev.strengths}\n\nManager: ${formData.strengths}` : formData.strengths,
        improvements: rev.improvements ? `${rev.improvements}\n\nManager: ${formData.improvements}` : formData.improvements,
        status: 'completed',
        completedAt: new Date().toISOString().split('T')[0],
      });
      toast.success('Performance review completed and finalized!');
    }
    onSubmitted();
  };

  const steps = ['Goals & Metrics', 'Overall Assessment', 'Review & Submit'];

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h2 className="text-sm sm:text-base flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-primary" />
                  {cycle.name}
                  <Badge variant="outline" className={`text-xs border-0 ${mode === 'self' ? 'bg-brand-warning-light text-brand-warning' : 'bg-brand-primary-light text-brand-primary'}`}>
                    {mode === 'self' ? 'Self Assessment' : 'Manager Review'}
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  {mode === 'self' ? `Reviewing your own performance` : `Reviewing ${employee.firstName} ${employee.lastName}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
                <span>{progressPercent}% complete</span>
                <div className="w-24"><Progress value={progressPercent} className="h-1.5" /></div>
              </div>
              <Button size="sm" onClick={handleSubmit} disabled={!canSubmit}>
                <Send className="w-3.5 h-3.5 mr-1.5" />
                {mode === 'self' ? 'Submit Self-Review' : 'Complete Review'}
              </Button>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex gap-1 pb-3">
            {steps.map((step, idx) => (
              <button
                key={step}
                onClick={() => setCurrentStep(idx)}
                className={`flex-1 text-xs py-1.5 px-2 rounded-md transition-colors ${
                  currentStep === idx
                    ? 'bg-brand-primary text-white'
                    : idx < currentStep
                    ? 'bg-brand-success-light text-brand-success'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <span className="hidden sm:inline">{idx + 1}. </span>{step}
                {idx === 0 && ` (${completedGoalCount}/${formData.goalRatings.length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Employee Profile Card (for manager mode) */}
        {mode === 'manager' && (
          <Card className="mb-6 border-brand-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand-primary-light flex items-center justify-center text-brand-primary">
                <span>{employee.firstName[0]}{employee.lastName[0]}</span>
              </div>
              <div className="flex-1">
                <h3>{employee.firstName} {employee.lastName}</h3>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
              </div>
              {rev.selfRating && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Employee Self-Rating</p>
                  <div className="flex items-center gap-2 justify-end">
                    <ReadOnlyStars rating={rev.selfRating} size="md" />
                    <span className={`text-sm ${ratingColors[rev.selfRating]}`}>{rev.selfRating}/5</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{ratingLabels[rev.selfRating]}</p>
                </div>
              )}
            </CardContent>
            {/* Show employee's self-assessment summary */}
            {(rev.strengths || rev.improvements) && (
              <div className="border-t px-4 py-3 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Employee's Self-Assessment Summary
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rev.strengths && (
                    <div className="p-2 bg-brand-success-light/50 rounded text-xs">
                      <p className="text-brand-success mb-1">Strengths</p>
                      <p className="text-foreground">{rev.strengths}</p>
                    </div>
                  )}
                  {rev.improvements && (
                    <div className="p-2 bg-brand-warning-light/50 rounded text-xs">
                      <p className="text-brand-warning mb-1">Areas for Growth</p>
                      <p className="text-foreground">{rev.improvements}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* STEP 0: Goals & Metrics */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="flex items-center gap-2"><Target className="w-5 h-5 text-brand-primary" /> Goal & Metric Ratings</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {mode === 'self'
                    ? 'Rate your performance on each goal and its metrics. Provide notes explaining your rating.'
                    : 'Review the employee\'s self-ratings and provide your manager assessment for each goal.'
                  }
                </p>
              </div>
              {avgGoalRating > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Weighted Average</p>
                  <p className={`text-xl ${ratingColors[Math.round(avgGoalRating)]}`}>{avgGoalRating.toFixed(1)}/5</p>
                </div>
              )}
            </div>

            {userGoals.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p>No goals found for this review period.</p>
              </CardContent></Card>
            ) : (
              userGoals.map(goal => {
                const goalMetrics = additionalReads.getMetricsForGoal(goal.id);
                const isExpanded = expandedGoals.has(goal.id);
                const goalForm = formData.goalRatings.find(gr => gr.goalId === goal.id);
                const goalMetricForms = formData.metricRatings.filter(mr => mr.goalId === goal.id);
                const existingGoalRating = existingGoalRatings.find(r => r.goalId === goal.id);
                const goalComplete = goalForm && goalForm.rating > 0 && goalForm.comment.trim().length > 0;
                const metricsForGoalComplete = goalMetricForms.every(mr => mr.rating > 0);

                return (
                  <Card key={goal.id} className={`transition-all ${goalComplete && metricsForGoalComplete ? 'border-l-4 border-l-brand-success' : 'border-l-4 border-l-muted'}`}>
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/30 transition-colors py-4"
                      onClick={() => toggleGoal(goal.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CardTitle className="text-base">{goal.title}</CardTitle>
                            <Badge variant="outline" className={`text-xs border-0 ${goalStatusColors[goal.status]}`}>{goal.status.replace(/_/g, ' ')}</Badge>
                            <Badge variant="outline" className="text-xs"><Percent className="w-3 h-3 mr-1" />{goal.weight}% weight</Badge>
                            <Badge variant="outline" className="text-xs capitalize">{goal.category.replace(/_/g, ' ')}</Badge>
                            {goalMetrics.length > 0 && <Badge variant="outline" className="text-xs"><Gauge className="w-3 h-3 mr-1" />{goalMetrics.length} metrics</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-3 shrink-0">
                          {goalComplete && <CheckCircle2 className="w-4 h-4 text-brand-success" />}
                          {!goalComplete && goalForm && goalForm.rating > 0 && <Clock className="w-4 h-4 text-brand-warning" />}
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-2 mt-2">
                        <Progress value={goal.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-muted-foreground">{goal.progress}%</span>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="pt-0 space-y-5">
                        {/* Show employee's self-rating (in manager mode) */}
                        {mode === 'manager' && existingGoalRating?.selfRating && (
                          <div className="p-3 bg-brand-warning-light/30 rounded-lg border border-brand-warning/20">
                            <p className="text-xs text-brand-warning mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Employee's Self-Rating</p>
                            <div className="flex items-center gap-2">
                              <ReadOnlyStars rating={existingGoalRating.selfRating} />
                              <span className="text-sm">{existingGoalRating.selfRating}/5 - {ratingLabels[existingGoalRating.selfRating]}</span>
                            </div>
                            {existingGoalRating.selfComment && (
                              <p className="text-sm mt-1.5 text-muted-foreground italic">"{existingGoalRating.selfComment}"</p>
                            )}
                          </div>
                        )}

                        {/* Rating Input */}
                        <div className="space-y-2">
                          <Label className="text-sm flex items-center gap-1.5">
                            <Star className="w-3.5 h-3.5 text-brand-warning" />
                            {mode === 'self' ? 'Your Rating' : 'Manager Rating'} *
                          </Label>
                          <InteractiveStars
                            rating={goalForm?.rating || 0}
                            onRate={(r) => updateGoalRating(goal.id, 'rating', r)}
                          />
                        </div>

                        {/* Comment Input */}
                        <div className="space-y-2">
                          <Label className="text-sm flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" />
                            {mode === 'self' ? 'Self-Assessment Notes' : 'Manager Comments'} *
                          </Label>
                          <Textarea
                            value={goalForm?.comment || ''}
                            onChange={e => updateGoalRating(goal.id, 'comment', e.target.value)}
                            rows={3}
                            placeholder={mode === 'self'
                              ? 'Describe your progress, achievements, and challenges on this goal...'
                              : 'Provide your assessment of the employee\'s performance on this goal...'
                            }
                            className="text-sm"
                          />
                        </div>

                        {/* Metrics */}
                        {goalMetrics.length > 0 && (
                          <div className="space-y-3">
                            <Separator />
                            <Label className="text-sm flex items-center gap-1.5">
                              <Gauge className="w-3.5 h-3.5 text-brand-primary" /> Metric Ratings
                            </Label>
                            {goalMetrics.map(metric => {
                              const metricForm = goalMetricForms.find(mf => mf.metricId === metric.id);
                              const pctAchieved = metric.targetValue > 0 ? Math.min(100, Math.round((metric.currentValue / metric.targetValue) * 100)) : 0;
                              const existingMetric = existingMetricRatings.find(r => r.metricId === metric.id);

                              return (
                                <div key={metric.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm">{metric.name}</p>
                                      <p className="text-xs text-muted-foreground">{metric.description}</p>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                      <Badge variant="outline" className="text-xs">{metric.weight}% weight</Badge>
                                      <p className="text-xs text-muted-foreground mt-1">{metric.currentValue} / {metric.targetValue} {metric.unit === 'percentage' ? '%' : metric.unit === 'currency' ? '$' : ''}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <Progress value={pctAchieved} className="h-1.5 flex-1" />
                                    <span className="text-xs text-brand-primary">{pctAchieved}%</span>
                                  </div>

                                  {/* Employee's metric rating (manager mode) */}
                                  {mode === 'manager' && existingMetric?.selfRating && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <User className="w-3 h-3" /> Employee rated:
                                      <ReadOnlyStars rating={existingMetric.selfRating} size="sm" />
                                      <span>{existingMetric.selfRating}/5</span>
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">{mode === 'self' ? 'Your rating:' : 'Manager rating:'}</span>
                                    <InteractiveStars
                                      rating={metricForm?.rating || 0}
                                      onRate={(r) => updateMetricRating(metric.id, r)}
                                      size="sm"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}

            <div className="flex justify-end pt-2">
              <Button onClick={() => setCurrentStep(1)} disabled={!goalsCompleted || !metricsCompleted}>
                Next: Overall Assessment <ChevronDown className="w-4 h-4 ml-1 rotate-[-90deg]" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 1: Overall Assessment */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-warning" /> Overall Assessment</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === 'self'
                  ? 'Provide your overall self-assessment considering all goals and metrics above.'
                  : 'Provide your overall manager assessment. This rating will be combined with the employee\'s self-rating.'
                }
              </p>
            </div>

            {/* Goal ratings summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4" /> Goal Ratings Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formData.goalRatings.map(gr => {
                    const goal = userGoals.find(g => g.id === gr.goalId);
                    return goal ? (
                      <div key={gr.goalId} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{goal.title}</span>
                          <Badge variant="outline" className="text-xs">{goal.weight}%</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <ReadOnlyStars rating={gr.rating} />
                          <span className={`text-sm ${ratingColors[gr.rating]}`}>{gr.rating}/5</span>
                        </div>
                      </div>
                    ) : null;
                  })}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <span className="text-sm">Weighted Average</span>
                  <span className={`text-lg ${ratingColors[Math.round(avgGoalRating)] || ''}`}>
                    {avgGoalRating.toFixed(2)}/5
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Overall Rating */}
            <Card className={formData.overallRating > 0 ? `border-l-4 border-l-brand-success` : ''}>
              <CardContent className="p-5 space-y-5">
                <div className="space-y-3">
                  <Label className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-brand-warning" />
                    {mode === 'self' ? 'Overall Self-Rating' : 'Overall Manager Rating'} *
                  </Label>
                  <InteractiveStars
                    rating={formData.overallRating}
                    onRate={r => setFormData(prev => ({ ...prev, overallRating: r }))}
                    size="lg"
                  />
                  {formData.overallRating > 0 && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${ratingBgColors[formData.overallRating]} ${ratingColors[formData.overallRating]}`}>
                      <Award className="w-4 h-4" />
                      <span className="text-sm">{formData.overallRating}/5 - {ratingLabels[formData.overallRating]}</span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-brand-success" /> Key Strengths *
                  </Label>
                  <Textarea
                    value={formData.strengths}
                    onChange={e => setFormData(prev => ({ ...prev, strengths: e.target.value }))}
                    rows={4}
                    placeholder={mode === 'self'
                      ? 'What are your top strengths this review period? What went well?'
                      : 'What are this employee\'s key strengths? What did they do well?'
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-brand-warning" /> Areas for Improvement *
                  </Label>
                  <Textarea
                    value={formData.improvements}
                    onChange={e => setFormData(prev => ({ ...prev, improvements: e.target.value }))}
                    rows={4}
                    placeholder={mode === 'self'
                      ? 'Where can you improve? What challenges did you face?'
                      : 'Where does this employee need to improve? What should they focus on?'
                    }
                  />
                </div>

                {mode === 'manager' && (
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-brand-primary" /> Manager Comments *
                    </Label>
                    <Textarea
                      value={formData.managerComments}
                      onChange={e => setFormData(prev => ({ ...prev, managerComments: e.target.value }))}
                      rows={4}
                      placeholder="Provide overall comments, development recommendations, and any notes for the employee..."
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setCurrentStep(0)}>
                <ChevronDown className="w-4 h-4 mr-1 rotate-90" /> Back to Goals
              </Button>
              <Button onClick={() => setCurrentStep(2)} disabled={!overallCompleted || (mode === 'manager' && !managerCommentsCompleted)}>
                Next: Review & Submit <ChevronDown className="w-4 h-4 ml-1 rotate-[-90deg]" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Review & Submit */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="flex items-center gap-2"><FileText className="w-5 h-5 text-brand-primary" /> Review & Submit</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Review your assessment before submitting. Once submitted, {mode === 'self' ? 'your manager will complete their review' : 'the review will be finalized'}.
              </p>
            </div>

            {/* Summary Card */}
            <Card className="border-brand-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-5 h-5 text-brand-primary" /> Assessment Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Overall */}
                <div className={`p-4 rounded-lg text-center ${ratingBgColors[formData.overallRating]}`}>
                  <p className="text-xs text-muted-foreground mb-1">{mode === 'self' ? 'Your Overall Rating' : 'Manager Overall Rating'}</p>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <ReadOnlyStars rating={formData.overallRating} size="lg" />
                    <span className={`text-2xl ${ratingColors[formData.overallRating]}`}>{formData.overallRating}/5</span>
                  </div>
                  <p className={`text-sm ${ratingColors[formData.overallRating]}`}>{ratingLabels[formData.overallRating]}</p>
                </div>

                {/* Ratings comparison for manager */}
                {mode === 'manager' && rev.selfRating && (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground">Employee Self</p>
                      <ReadOnlyStars rating={rev.selfRating} />
                      <p className="text-sm mt-1">{rev.selfRating}/5</p>
                    </div>
                    <div className="p-3 bg-brand-primary-light rounded-lg text-center">
                      <p className="text-xs text-brand-primary">Manager</p>
                      <ReadOnlyStars rating={formData.overallRating} />
                      <p className="text-sm mt-1">{formData.overallRating}/5</p>
                    </div>
                    <div className="p-3 bg-brand-success-light rounded-lg text-center">
                      <p className="text-xs text-brand-success">Final</p>
                      <ReadOnlyStars rating={Math.round((rev.selfRating + formData.overallRating) / 2)} />
                      <p className="text-sm mt-1">{((rev.selfRating + formData.overallRating) / 2).toFixed(1)}/5</p>
                    </div>
                  </div>
                )}

                {/* Goal summaries */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Goal Ratings</p>
                  <div className="space-y-1.5">
                    {formData.goalRatings.map(gr => {
                      const goal = userGoals.find(g => g.id === gr.goalId);
                      return goal ? (
                        <div key={gr.goalId} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                          <span className="truncate flex-1 mr-3">{goal.title}</span>
                          <div className="flex items-center gap-2 shrink-0">
                            <ReadOnlyStars rating={gr.rating} />
                            <span className={`${ratingColors[gr.rating]}`}>{gr.rating}/5</span>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Strengths</p>
                    <p className="text-sm">{formData.strengths}</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Areas for Improvement</p>
                    <p className="text-sm">{formData.improvements}</p>
                  </div>
                </div>

                {mode === 'manager' && formData.managerComments && (
                  <div className="p-3 border-2 border-brand-primary/20 rounded-lg bg-brand-primary-light/20">
                    <p className="text-xs text-brand-primary mb-1">Manager Comments</p>
                    <p className="text-sm">{formData.managerComments}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Warning */}
            <div className="p-4 bg-brand-warning-light/30 rounded-lg border border-brand-warning/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-brand-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-brand-warning">
                  {mode === 'self'
                    ? 'Once submitted, your self-review will be sent to your manager for their assessment. You will not be able to edit it after submission.'
                    : 'Once submitted, this review will be finalized and the employee will be able to see the complete assessment. This action cannot be undone.'
                  }
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <ChevronDown className="w-4 h-4 mr-1 rotate-90" /> Back
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit} className="min-w-[200px]">
                <Send className="w-4 h-4 mr-2" />
                {mode === 'self' ? 'Submit Self-Review' : 'Complete & Finalize Review'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}