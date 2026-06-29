"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import React from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WizardStep {
  id: string;
  label: string;
  description?: string;
  optional?: boolean;
}

export interface WizardShellProps {
  /** Array of step definitions */
  steps: WizardStep[];
  /** Zero-based current step index */
  currentStep: number;
  /** Called when user navigates between steps */
  onStepChange: (step: number) => void;
  /** Main form content for current step */
  children: React.ReactNode;
  /** Right panel content (summary) */
  rightPanel?: React.ReactNode;
  /** Called when "Save Draft" is clicked */
  onSaveDraft?: () => void;
  /** Called when the wizard is closed/cancelled */
  onClose?: () => void;
  /** Title shown in the wizard header */
  title: string;
  /** Subtitle / context info */
  subtitle?: string;
  /** Back button disabled */
  backDisabled?: boolean;
  /** Next/Submit button label override */
  nextLabel?: string;
  /** Whether we are on the last step */
  isLastStep?: boolean;
  /** Whether the submit/next action is loading */
  isSubmitting?: boolean;
  /** Called when Next is clicked (return false to prevent navigation) */
  onNext: () => boolean | Promise<boolean>;
  /** Submit button disabled */
  nextDisabled?: boolean;
  /** Show success state */
  showSuccess?: boolean;
  /** Success content */
  successContent?: React.ReactNode;
  /** Show the right panel at all? */
  showRightPanel?: boolean;
  /** Unique key for localStorage draft persistence (e.g. 'change-wizard') */
  wizardId?: string;
  /** Current form data to persist in draft */
  formData?: Record<string, unknown>;
  /** Called when a draft is resumed with the saved step index and form data */
  onDraftResume?: (step: number, data: Record<string, unknown>) => void;
}

// ─── Step indicator animations ───────────────────────────────────────────────

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

// ─── Stepper component ────────────────────────────────────────────────────────

interface StepperProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
}

function Stepper({ steps, currentStep, onStepChange }: StepperProps) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto">
      {steps.map((step, idx) => {
        const isDone = idx < currentStep;
        const isActive = idx === currentStep;
        const isPending = idx > currentStep;

        return (
          <React.Fragment key={step.id}>
            {/* Step node */}
            <button
              type="button"
              onClick={() => {
                if (isDone) onStepChange(idx);
              }}
              className={cn(
                "flex flex-col items-center gap-1.5 min-w-[60px] group",
                isDone ? "cursor-pointer" : "cursor-default"
              )}
              disabled={!isDone}
              title={step.label}
            >
              <div
                className={cn(
                  "step-circle",
                  isDone && "step-done",
                  isActive && "step-active",
                  isPending && "step-pending"
                )}
              >
                {isDone ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] font-500 whitespace-nowrap transition-colors",
                  isActive && "text-[var(--primary)] font-600",
                  isDone && "text-[var(--text-secondary)]",
                  isPending && "text-[var(--text-muted)]"
                )}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 min-w-[16px] h-[2px] mx-1 mt-[-12px] rounded-full transition-colors duration-300"
                style={{
                  background: isDone
                    ? "var(--primary)"
                    : "var(--border)",
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Success overlay ──────────────────────────────────────────────────────────

function SuccessOverlay({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="flex flex-col items-center justify-center gap-6 py-16 px-6 text-center"
    >
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 300, damping: 18 }}
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={{ background: "var(--success-bg)", border: "2px solid var(--success)" }}
      >
        <Check className="w-9 h-9" style={{ color: "var(--success)" }} strokeWidth={2.5} />
      </motion.div>
      {children}
    </motion.div>
  );
}

// ─── WizardShell ──────────────────────────────────────────────────────────────

interface WizardDraft {
  currentStep: number;
  formData: Record<string, unknown>;
}

export function WizardShell({
  steps,
  currentStep,
  onStepChange,
  children,
  rightPanel,
  onSaveDraft,
  onClose,
  title,
  subtitle,
  backDisabled = false,
  nextLabel,
  isLastStep = false,
  isSubmitting = false,
  onNext,
  nextDisabled = false,
  showSuccess = false,
  successContent,
  showRightPanel = true,
  wizardId,
  formData,
  onDraftResume,
}: WizardShellProps) {
  const [direction, setDirection] = React.useState(1);
  const [showDraftDialog, setShowDraftDialog] = React.useState(false);
  const [pendingDraft, setPendingDraft] = React.useState<WizardDraft | null>(null);

  const draftKey = wizardId ? `wizard-draft-${wizardId}` : null;

  React.useEffect(() => {
    if (!draftKey) return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved) as WizardDraft;
        setPendingDraft(parsed);
        setShowDraftDialog(true);
      }
    } catch {
      // corrupted draft — ignore
    }
  }, [draftKey]);

  React.useEffect(() => {
    if (!draftKey || showSuccess) return;
    try {
      const draft: WizardDraft = {
        currentStep,
        formData: formData ?? {},
      };
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {
      // storage unavailable — ignore
    }
  }, [draftKey, currentStep, formData, showSuccess]);

  React.useEffect(() => {
    if (showSuccess && draftKey) {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
    }
  }, [showSuccess, draftKey]);

  function handleResumeDraft() {
    if (pendingDraft && onDraftResume) {
      onDraftResume(pendingDraft.currentStep, pendingDraft.formData);
    }
    setShowDraftDialog(false);
    setPendingDraft(null);
  }

  function handleDiscardDraft() {
    if (draftKey) {
      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }
    }
    setShowDraftDialog(false);
    setPendingDraft(null);
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      onStepChange(currentStep - 1);
    }
  };

  const handleNext = async () => {
    const ok = await onNext();
    if (ok) {
      setDirection(1);
      if (!isLastStep) {
        onStepChange(currentStep + 1);
      }
    }
  };

  const stepLabel = nextLabel ?? (isLastStep ? "Submit" : "Next");

  /* Lock body scroll while the wizard modal is open. */
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  /* Close on Escape. */
  React.useEffect(() => {
    if (!onClose) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Draft resume dialog */}
      {showDraftDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleDiscardDraft}
          />
          <div
            className="relative rounded-2xl px-6 py-5 w-full max-w-sm flex flex-col gap-4"
            style={{
              background: "var(--bg-surface)",
              boxShadow: "var(--shadow-lg)",
              border: "1px solid var(--border)",
            }}
          >
            <div>
              <h3 className="text-[15px] font-700" style={{ color: "var(--text-primary)" }}>
                Resume draft?
              </h3>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
                You have an unsaved draft for this wizard. Would you like to continue where you left off?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="btn btn-secondary btn-sm flex-1"
              >
                Start fresh
              </button>
              <button
                type="button"
                onClick={handleResumeDraft}
                className="btn btn-primary btn-sm flex-1"
              >
                Resume draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0"
        style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative flex flex-col bg-[var(--bg-surface)] rounded-[var(--radius-2xl)] overflow-hidden"
        style={{
          boxShadow: "var(--shadow-lg)",
          minHeight: "min(90vh, 720px)",
          maxHeight: "90vh",
          width: "100%",
          maxWidth: "1100px",
        }}
      >
      {/* ── Header ── */}
      <div
        className="flex-shrink-0 border-b px-6 py-4"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-[17px] font-700 leading-tight" style={{ color: "var(--text-primary)" }}>
              {title}
            </h2>
            {subtitle && (
              <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {subtitle}
              </p>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-icon flex-shrink-0"
              aria-label="Close wizard"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Stepper */}
        {!showSuccess && (
          <Stepper
            steps={steps}
            currentStep={currentStep}
            onStepChange={onStepChange}
          />
        )}
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div className={cn("flex-1 overflow-y-auto", showRightPanel && rightPanel ? "lg:w-[60%]" : "w-full")}>
          {showSuccess ? (
            <SuccessOverlay>{successContent}</SuccessOverlay>
          ) : (
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="p-6"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Right summary panel */}
        {showRightPanel && rightPanel && !showSuccess && (
          <div
            className="hidden lg:flex flex-col w-[340px] flex-shrink-0 overflow-y-auto border-l"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-subtle)",
            }}
          >
            <div className="p-5">
              <p className="text-[11px] font-700 uppercase tracking-[0.06em] mb-4" style={{ color: "var(--text-muted)" }}>
                Summary
              </p>
              {rightPanel}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky bottom bar ── */}
      {!showSuccess && (
        <div
          className="flex-shrink-0 flex items-center justify-between gap-3 px-6 py-4 border-t"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-surface)",
          }}
        >
          {/* Left: step info + save draft */}
          <div className="flex items-center gap-4">
            <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
              Step {currentStep + 1} of {steps.length}
            </span>
            {onSaveDraft && (
              <button
                type="button"
                onClick={onSaveDraft}
                className="text-[12px] underline underline-offset-2"
                style={{ color: "var(--text-muted)" }}
              >
                Save Draft
              </button>
            )}
          </div>

          {/* Right: back + next */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0 || backDisabled}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={nextDisabled || isSubmitting}
              className="btn btn-primary btn-sm"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {stepLabel}
                  {!isLastStep && <ChevronRight className="w-4 h-4" />}
                </>
              )}
            </button>
          </div>
        </div>
      )}
      </motion.div>
    </div>
  );
}

// ─── Helper: SummaryRow ────────────────────────────────────────────────────────

export function SummaryRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex flex-col gap-0.5 py-2 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
      <span className="text-[11px] font-600 uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>{label}</span>
      <span className="text-[13px] font-500" style={{ color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

export function SummarySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <p className="text-[12px] font-700 mb-2" style={{ color: "var(--text-secondary)" }}>{title}</p>
      <div className="rounded-[var(--radius)] overflow-hidden border" style={{ borderColor: "var(--border)" }}>
        <div className="divide-y" style={{ background: "var(--bg-surface)" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default WizardShell;
