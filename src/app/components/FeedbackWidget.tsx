// Floating feedback widget — always visible, context-aware.
// Submits to /api/feedback which creates a GitHub issue.

import { useState } from 'react';
import { MessageSquarePlus, X, Send, CheckCircle2, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeedbackWidgetProps {
  /** Current workspace view — captured automatically and included in the issue. */
  view: string;
  /** Freeform description of what's currently open (e.g. "Configure › Walls › Wall 2"). */
  context?: string;
}

type Step = 'closed' | 'goal' | 'result' | 'rating' | 'done';

const RATING_OPTIONS: { value: number; label: string; emoji: string }[] = [
  { value: 1, label: 'Very easy',   emoji: '😊' },
  { value: 2, label: 'Easy',        emoji: '🙂' },
  { value: 3, label: 'OK',          emoji: '😐' },
  { value: 4, label: 'Difficult',   emoji: '😕' },
  { value: 5, label: 'Blocked',     emoji: '😤' },
];

export function FeedbackWidget({ view, context = '' }: FeedbackWidgetProps) {
  const [step,    setStep]    = useState<Step>('closed');
  const [goal,    setGoal]    = useState('');
  const [result,  setResult]  = useState('');
  const [rating,  setRating]  = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const reset = () => {
    setStep('closed');
    setGoal('');
    setResult('');
    setRating(null);
    setError(null);
  };

  const submit = async () => {
    if (!goal.trim() || !result.trim() || rating === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal:      goal.trim(),
          result:    result.trim(),
          rating,
          view,
          context,
          url:       window.location.href,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Submission failed');
      setStep('done');
    } catch {
      setError('Could not send feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">

      {/* ── Panel ── */}
      {step !== 'closed' && (
        <div className="w-80 rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between bg-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquarePlus className="size-4 text-slate-300" />
              <span className="text-sm font-semibold text-white">Share feedback</span>
            </div>
            <button
              type="button"
              onClick={reset}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="px-4 py-4">

            {/* Step: goal */}
            {step === 'goal' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Step 1 of 3
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  What were you trying to do?
                </p>
                <textarea
                  autoFocus
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g. I wanted to add a solar panel to the roof surface…"
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!goal.trim()}
                  onClick={() => setStep('result')}
                  className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Next <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}

            {/* Step: result */}
            {step === 'result' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Step 2 of 3
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  What happened? What did you expect instead?
                </p>
                <textarea
                  autoFocus
                  rows={3}
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="e.g. I couldn't find the install button, or the numbers didn't update…"
                  className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('goal')}
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={!result.trim()}
                    onClick={() => setStep('rating')}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-slate-700 cursor-pointer transition-colors"
                  >
                    Next <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step: rating */}
            {step === 'rating' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Step 3 of 3
                </p>
                <p className="text-sm font-semibold text-slate-800">
                  How difficult was this task overall?
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {RATING_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRating(opt.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-lg border py-2 text-lg transition-all cursor-pointer',
                        rating === opt.value
                          ? 'border-slate-700 bg-slate-800 shadow-sm scale-105'
                          : 'border-slate-200 bg-slate-50 hover:border-slate-300',
                      )}
                      title={opt.label}
                    >
                      {opt.emoji}
                      <span className="text-[9px] font-semibold text-slate-500 leading-none">
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
                {error && (
                  <p className="text-[11px] text-red-500">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('result')}
                    className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={rating === null || loading}
                    onClick={submit}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-40 hover:bg-primary/90 cursor-pointer transition-colors"
                  >
                    {loading
                      ? <span className="animate-pulse">Sending…</span>
                      : <><Send className="size-3.5" /> Send</>}
                  </button>
                </div>
              </div>
            )}

            {/* Done */}
            {step === 'done' && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <CheckCircle2 className="size-10 text-green-500" />
                <p className="text-sm font-semibold text-slate-800">Thank you!</p>
                <p className="text-xs text-slate-500 leading-snug">
                  Your feedback has been recorded and will help us improve the tool.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
                >
                  Close
                </button>
              </div>
            )}

          </div>

          {/* Context footer */}
          {step !== 'done' && (
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-2">
              <p className="text-[10px] text-slate-400 truncate">
                📍 {view}{context ? ` › ${context}` : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Trigger button ── */}
      {step === 'closed' && (
        <button
          type="button"
          onClick={() => setStep('goal')}
          className="flex items-center gap-2 rounded-full bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-slate-700 cursor-pointer transition-all hover:scale-105"
        >
          <MessageSquarePlus className="size-4" />
          Feedback
        </button>
      )}
    </div>
  );
}
