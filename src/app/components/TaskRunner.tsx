// Floating task runner — guides participants through the user-testing session.
// Sits bottom-left (feedback widget is bottom-right) so both are accessible.

import { ClipboardList, ChevronRight, ChevronLeft, ChevronDown, CheckCircle2, MessageSquarePlus } from 'lucide-react';
import { TESTING_TASKS } from '@/app/config/testingTasks';
import { cn } from '@/lib/utils';

export interface FeedbackRequest {
  taskId: string;
  taskTitle: string;
  prefillGoal: string;
}

interface TaskRunnerProps {
  taskIndex: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onFeedbackRequest: (req: FeedbackRequest) => void;
  onSkipTask: () => void;
  onPrevTask: () => void;
}

export function TaskRunner({
  taskIndex,
  collapsed,
  onToggleCollapsed,
  onFeedbackRequest,
  onSkipTask,
  onPrevTask,
}: TaskRunnerProps) {
  const allDone = taskIndex >= TESTING_TASKS.length;
  const task = allDone ? null : TESTING_TASKS[taskIndex];

  if (allDone) {
    return (
      <div className="fixed bottom-5 left-5 z-50">
        <div className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
          <CheckCircle2 className="size-4" />
          All tasks complete — thank you!
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-5 z-50 flex flex-col items-end gap-2">

      {!collapsed && task && (
        <div className="w-80 rounded-xl border border-slate-200 bg-white shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between bg-slate-800 px-4 py-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-4 text-slate-300" />
              <span className="text-sm font-semibold text-white">
                Task {taskIndex + 1} of {TESTING_TASKS.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{task.timeEstimate}</span>
              <button
                type="button"
                onClick={onToggleCollapsed}
                title="Minimise"
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="px-4 py-4 flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-800">{task.title}</p>
            <p className="text-[12px] text-slate-600 leading-snug">{task.description}</p>

            <ol className="flex flex-col gap-2">
              {task.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-[12px] text-slate-700 leading-snug">
                  <span className="shrink-0 mt-0.5 flex size-4 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  onFeedbackRequest({
                    taskId: task.id,
                    taskTitle: task.title,
                    prefillGoal: task.feedbackGoalHint,
                  })
                }
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700 cursor-pointer transition-colors"
              >
                <MessageSquarePlus className="size-3.5" />
                Give feedback
              </button>
              {taskIndex > 0 && (
                <button
                  type="button"
                  onClick={onPrevTask}
                  title="Go back to previous task"
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onSkipTask}
                title="Skip to next task without submitting feedback"
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="border-t border-slate-100 bg-slate-50 px-4 py-2 flex items-center gap-1.5">
            {TESTING_TASKS.map((t, i) => (
              <div
                key={t.id}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  i < taskIndex
                    ? 'bg-green-500'
                    : i === taskIndex
                    ? 'bg-slate-700'
                    : 'bg-slate-200',
                )}
              />
            ))}
            <span className="ml-2 text-[10px] text-slate-400 shrink-0">
              {taskIndex} / {TESTING_TASKS.length}
            </span>
          </div>
        </div>
      )}

      {/* Collapsed badge / toggle button */}
      <button
        type="button"
        onClick={onToggleCollapsed}
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg cursor-pointer transition-all hover:scale-105',
          collapsed
            ? 'bg-slate-800 text-white hover:bg-slate-700'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
        )}
      >
        <ClipboardList className="size-4" />
        {collapsed
          ? `Task ${taskIndex + 1} / ${TESTING_TASKS.length} — ${task?.title}`
          : 'Hide tasks'}
      </button>
    </div>
  );
}
