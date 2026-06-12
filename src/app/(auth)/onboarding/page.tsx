"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Building2,
  Users,
  BarChart3,
  Sparkles,
  Database,
  FolderOpen,
  PartyPopper,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Step schemas ────────────────────────────────────────────────────────────

const companySchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  companyType: z.string().min(1, "Select a company type"),
  address: z.string().optional(),
  website: z.string().url("Enter a valid URL (e.g. https://...)").optional().or(z.literal("")),
});

const profileSchema = z.object({
  contractorType: z.string().min(1, "Select a profile"),
});

const roleSchema = z.object({
  jobTitle: z.string().min(2, "Enter your job title"),
  teamSize: z.string().min(1, "Select team size"),
});

const projectSchema = z.object({
  projectName: z.string().optional(),
  contractValue: z.string().optional(),
  clientName: z.string().optional(),
  startDate: z.string().optional(),
});

type CompanyData = z.infer<typeof companySchema>;
type ProfileData = z.infer<typeof profileSchema>;
type RoleData = z.infer<typeof roleSchema>;
type ProjectData = z.infer<typeof projectSchema>;

// ─── Data ────────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 8;

const steps = [
  { id: 1, label: "Welcome" },
  { id: 2, label: "Company" },
  { id: 3, label: "Profile" },
  { id: 4, label: "Role" },
  { id: 5, label: "Plan" },
  { id: 6, label: "Data" },
  { id: 7, label: "Project" },
  { id: 8, label: "Finish" },
];

const companyTypes = [
  "Limited Company",
  "LLP",
  "Sole Trader",
  "Partnership",
  "Public Sector",
  "Charity / Non-Profit",
];

const contractorTypes = [
  {
    value: "main_contractor",
    label: "Main Contractor",
    description: "Tier 1 principal contractor managing full project delivery",
  },
  {
    value: "specialist_subcontractor",
    label: "Specialist Subcontractor",
    description: "Trade specialist working under a main contractor",
  },
  {
    value: "mep_contractor",
    label: "MEP Contractor",
    description: "Mechanical, electrical, and plumbing specialist",
  },
  {
    value: "civils_groundworks",
    label: "Civils / Groundworks Contractor",
    description: "Civil engineering, groundworks, and infrastructure",
  },
  {
    value: "fitout_interiors",
    label: "Fit-Out / Interiors Contractor",
    description: "CAT A/B fit-out and interior refurbishment works",
  },
  {
    value: "roofing_cladding",
    label: "Roofing / Cladding Contractor",
    description: "Roofing systems, facades, and cladding installation",
  },
  {
    value: "housebuilder_developer",
    label: "Housebuilder / Developer Commercial Team",
    description: "Residential development and commercial management",
  },
  {
    value: "public_sector",
    label: "Public Sector / Framework Contractor",
    description: "Government, local authority, and framework delivery",
  },
  {
    value: "reactive_maintenance",
    label: "Reactive Maintenance / Small Works",
    description: "Reactive and planned maintenance programmes",
  },
  {
    value: "qs_consultancy",
    label: "QS / Commercial Consultancy",
    description: "Independent quantity surveying and commercial advisory",
  },
  {
    value: "supplier",
    label: "Supplier / Plant / Materials Provider",
    description: "Materials, plant, and equipment supply chain",
  },
  {
    value: "managed_supplier",
    label: "Managed Supplier / Professional Services Agency",
    description: "Managed service and professional services delivery",
  },
];

const teamSizes = [
  { value: "1", label: "Just me" },
  { value: "2-5", label: "2–5 people" },
  { value: "6-15", label: "6–15 people" },
  { value: "16-50", label: "16–50 people" },
  { value: "51-200", label: "51–200 people" },
  { value: "200+", label: "200+ people" },
];

// ─── Shared input style ───────────────────────────────────────────────────────

function inputCls(hasError?: boolean) {
  return cn(
    "h-11 px-3.5 rounded-lg border text-sm transition-colors outline-none w-full",
    "placeholder:text-slate-400 bg-white text-slate-900",
    "focus:border-[#3B5EE8] focus:ring-2 focus:ring-[#3B5EE8]/15",
    hasError
      ? "border-red-400 focus:border-red-400 focus:ring-red-100"
      : "border-slate-200 hover:border-slate-300"
  );
}

// ─── Summary Panel ───────────────────────────────────────────────────────────

interface SummaryData {
  companyName?: string;
  companyType?: string;
  contractorType?: string;
  jobTitle?: string;
  teamSize?: string;
  demoData?: string;
  projectName?: string;
}

function SummaryPanel({ data, currentStep }: { data: SummaryData; currentStep: number }) {
  if (currentStep <= 1) return null;

  const items = [
    data.companyName && { label: "Company", value: data.companyName },
    data.companyType && { label: "Type", value: data.companyType },
    data.contractorType && {
      label: "Profile",
      value: contractorTypes.find((c) => c.value === data.contractorType)?.label,
    },
    data.jobTitle && { label: "Role", value: data.jobTitle },
    data.teamSize && {
      label: "Team",
      value: teamSizes.find((t) => t.value === data.teamSize)?.label,
    },
    data.demoData && { label: "Start with", value: data.demoData },
    data.projectName && { label: "First project", value: data.projectName },
  ].filter(Boolean) as { label: string; value: string }[];

  if (items.length === 0) return null;

  return (
    <div className="bg-[#F8FAFC] rounded-xl border border-slate-200 p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Your setup so far
      </p>
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-start justify-between gap-2">
            <span className="text-xs text-slate-500 flex-shrink-0 pt-0.5">{item.label}</span>
            <span className="text-xs font-medium text-slate-800 text-right">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Accumulated data
  const [summaryData, setSummaryData] = useState<SummaryData>({});
  const [selectedContractorType, setSelectedContractorType] = useState("");
  const [demoChoice, setDemoChoice] = useState<"demo" | "fresh" | "">("");

  const companyForm = useForm<CompanyData>({ resolver: zodResolver(companySchema) });
  const profileForm = useForm<ProfileData>({ resolver: zodResolver(profileSchema) });
  const roleForm = useForm<RoleData>({ resolver: zodResolver(roleSchema) });
  const projectForm = useForm<ProjectData>({ resolver: zodResolver(projectSchema) });

  const next = () => setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const handleSaveExit = () => {
    router.push("/app/home");
  };

  // Step-specific submit handlers
  const handleCompanyNext = companyForm.handleSubmit((data) => {
    setSummaryData((prev) => ({
      ...prev,
      companyName: data.companyName,
      companyType: data.companyType,
    }));
    next();
  });

  const handleProfileNext = () => {
    if (!selectedContractorType) {
      profileForm.setError("contractorType", { message: "Select a profile to continue" });
      return;
    }
    setSummaryData((prev) => ({ ...prev, contractorType: selectedContractorType }));
    next();
  };

  const handleRoleNext = roleForm.handleSubmit((data) => {
    setSummaryData((prev) => ({
      ...prev,
      jobTitle: data.jobTitle,
      teamSize: data.teamSize,
    }));
    next();
  });

  const handleDemoNext = () => {
    if (!demoChoice) return;
    setSummaryData((prev) => ({
      ...prev,
      demoData: demoChoice === "demo" ? "Demo project data" : "Fresh start",
    }));
    next();
  };

  const handleProjectNext = projectForm.handleSubmit((data) => {
    setSummaryData((prev) => ({
      ...prev,
      projectName: data.projectName || undefined,
    }));
    next();
  });

  const handleFinish = async () => {
    setSaving(true);
    // Simulate saving — in production this would persist to Supabase
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    router.push("/app/home");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Image
          src="/measuredeck-logo-DB_Uf-KZ.png"
          alt="MeasureDeck"
          width={140}
          height={32}
          className="object-contain"
        />
        <button
          type="button"
          onClick={handleSaveExit}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Save &amp; Exit
        </button>
      </header>

      {/* Progress stepper */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-0">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <button
                  type="button"
                  onClick={() => step.id < currentStep && setCurrentStep(step.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 group",
                    step.id < currentStep ? "cursor-pointer" : "cursor-default"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      step.id < currentStep
                        ? "bg-[#10B981] text-white"
                        : step.id === currentStep
                        ? "bg-[#3B5EE8] text-white ring-4 ring-[#3B5EE8]/20"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    {step.id < currentStep ? <Check className="w-3.5 h-3.5" /> : step.id}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] font-medium hidden sm:block",
                      step.id === currentStep
                        ? "text-[#3B5EE8]"
                        : step.id < currentStep
                        ? "text-[#10B981]"
                        : "text-slate-400"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                {idx < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-1 rounded transition-all",
                      step.id < currentStep ? "bg-[#10B981]" : "bg-slate-200"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-3xl flex gap-8">
          {/* Step content */}
          <div className="flex-1 min-w-0">
            {/* ── STEP 1: Welcome ────────────────────────────────────── */}
            {currentStep === 1 && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="relative mb-6">
                  <div className="w-24 h-24 rounded-2xl bg-[#0D1B2E] flex items-center justify-center shadow-lg">
                    <Image
                      src="/measuredeck-logo-DB_Uf-KZ.png"
                      alt="MeasureDeck"
                      width={72}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <span className="absolute -top-2 -right-2 text-2xl animate-bounce">👋</span>
                </div>
                <h1 className="text-3xl font-bold text-[#0D1B2E] tracking-tight">
                  Welcome to MeasureDeck
                </h1>
                <p className="mt-3 text-slate-500 text-base max-w-md leading-relaxed">
                  Let&apos;s get your commercial workspace set up in just a few minutes. We&apos;ll
                  tailor MeasureDeck to how your team works.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={next}
                    className="inline-flex items-center gap-2 h-11 px-6 rounded-lg font-semibold text-sm text-white bg-[#3B5EE8] hover:bg-[#2d4fd4] transition-all"
                  >
                    Get started
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-4 text-xs text-slate-400">Takes about 3 minutes</p>
              </div>
            )}

            {/* ── STEP 2: Company & Workspace ────────────────────────── */}
            {currentStep === 2 && (
              <div>
                <StepHeader
                  icon={<Building2 className="w-5 h-5 text-[#3B5EE8]" />}
                  title="Company & workspace details"
                  description="Tell us about your organisation so we can set up your workspace."
                />
                <form onSubmit={handleCompanyNext} className="flex flex-col gap-5 mt-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Company name *</label>
                    <input
                      type="text"
                      placeholder="Acme Construction Ltd"
                      {...companyForm.register("companyName")}
                      className={inputCls(!!companyForm.formState.errors.companyName)}
                    />
                    {companyForm.formState.errors.companyName && (
                      <p className="text-xs text-red-500">
                        {companyForm.formState.errors.companyName.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Company type *</label>
                    <select
                      {...companyForm.register("companyType")}
                      className={cn(
                        inputCls(!!companyForm.formState.errors.companyType),
                        "appearance-none"
                      )}
                      style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                        backgroundRepeat: "no-repeat",
                        backgroundPosition: "right 12px center",
                      }}
                    >
                      <option value="">Select company type…</option>
                      {companyTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    {companyForm.formState.errors.companyType && (
                      <p className="text-xs text-red-500">
                        {companyForm.formState.errors.companyType.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Office address <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="123 High Street, London, EC1A 1BB"
                      {...companyForm.register("address")}
                      className={inputCls()}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Website <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.yourcompany.com"
                      {...companyForm.register("website")}
                      className={inputCls(!!companyForm.formState.errors.website)}
                    />
                    {companyForm.formState.errors.website && (
                      <p className="text-xs text-red-500">
                        {companyForm.formState.errors.website.message}
                      </p>
                    )}
                  </div>

                  <StepFooter onBack={back} submitLabel="Continue" />
                </form>
              </div>
            )}

            {/* ── STEP 3: Commercial Profile ──────────────────────────── */}
            {currentStep === 3 && (
              <div>
                <StepHeader
                  icon={<BarChart3 className="w-5 h-5 text-[#3B5EE8]" />}
                  title="Your commercial profile"
                  description="Select the option that best describes your business. This helps us tailor your workflows."
                />
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {contractorTypes.map((ct) => (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => {
                        setSelectedContractorType(ct.value);
                        profileForm.clearErrors("contractorType");
                      }}
                      className={cn(
                        "text-left p-4 rounded-xl border-2 transition-all",
                        selectedContractorType === ct.value
                          ? "border-[#3B5EE8] bg-[#3B5EE8]/5"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all",
                            selectedContractorType === ct.value
                              ? "border-[#3B5EE8] bg-[#3B5EE8]"
                              : "border-slate-300"
                          )}
                        >
                          {selectedContractorType === ct.value && (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <div>
                          <p
                            className={cn(
                              "text-sm font-semibold",
                              selectedContractorType === ct.value
                                ? "text-[#3B5EE8]"
                                : "text-slate-800"
                            )}
                          >
                            {ct.label}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            {ct.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
                {profileForm.formState.errors.contractorType && (
                  <p className="mt-2 text-xs text-red-500">
                    {profileForm.formState.errors.contractorType.message}
                  </p>
                )}
                <div className="mt-6">
                  <StepFooter onBack={back} onNext={handleProfileNext} />
                </div>
              </div>
            )}

            {/* ── STEP 4: Role Setup ──────────────────────────────────── */}
            {currentStep === 4 && (
              <div>
                <StepHeader
                  icon={<Users className="w-5 h-5 text-[#3B5EE8]" />}
                  title="Your role"
                  description="Help us personalise your experience based on your position."
                />
                <form onSubmit={handleRoleNext} className="flex flex-col gap-5 mt-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Job title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Senior Quantity Surveyor"
                      {...roleForm.register("jobTitle")}
                      className={inputCls(!!roleForm.formState.errors.jobTitle)}
                    />
                    {roleForm.formState.errors.jobTitle && (
                      <p className="text-xs text-red-500">
                        {roleForm.formState.errors.jobTitle.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">Commercial team size *</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {teamSizes.map((ts) => (
                        <label key={ts.value} className="cursor-pointer">
                          <input
                            type="radio"
                            value={ts.value}
                            {...roleForm.register("teamSize")}
                            className="sr-only"
                          />
                          <div
                            className={cn(
                              "px-3 py-2.5 rounded-lg border-2 text-center text-sm transition-all",
                              roleForm.watch("teamSize") === ts.value
                                ? "border-[#3B5EE8] bg-[#3B5EE8]/5 text-[#3B5EE8] font-semibold"
                                : "border-slate-200 hover:border-slate-300 text-slate-700"
                            )}
                          >
                            {ts.label}
                          </div>
                        </label>
                      ))}
                    </div>
                    {roleForm.formState.errors.teamSize && (
                      <p className="text-xs text-red-500">
                        {roleForm.formState.errors.teamSize.message}
                      </p>
                    )}
                  </div>

                  <StepFooter onBack={back} submitLabel="Continue" />
                </form>
              </div>
            )}

            {/* ── STEP 5: Plan Selection ──────────────────────────────── */}
            {currentStep === 5 && (
              <div>
                <StepHeader
                  icon={<Sparkles className="w-5 h-5 text-[#3B5EE8]" />}
                  title="Choose your plan"
                  description="Start free, upgrade whenever you're ready. No credit card required."
                />
                <div className="mt-6">
                  <div className="rounded-2xl border-2 border-[#3B5EE8] bg-[#3B5EE8]/5 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-[#0D1B2E]">Free Trial</h3>
                          <span className="px-2 py-0.5 rounded-full bg-[#3B5EE8] text-white text-xs font-semibold">
                            Recommended
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm">
                          Full access for 14 days — explore every feature with no commitment.
                        </p>
                        <ul className="mt-4 flex flex-col gap-2">
                          {[
                            "Unlimited projects during trial",
                            "Full CVR and cost reporting",
                            "Subcontract order management",
                            "Team collaboration tools",
                          ].map((f) => (
                            <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                              <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-3xl font-bold text-[#0D1B2E]">£0</p>
                        <p className="text-xs text-slate-500">for 14 days</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={next}
                      className="mt-5 w-full h-11 rounded-lg font-semibold text-sm text-white bg-[#3B5EE8] hover:bg-[#2d4fd4] transition-all flex items-center justify-center gap-2"
                    >
                      Start Free Trial
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="mt-3 text-center text-xs text-slate-400">
                    Full plan pricing available after your trial.
                  </p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={back}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 6: Demo Data ───────────────────────────────────── */}
            {currentStep === 6 && (
              <div>
                <StepHeader
                  icon={<Database className="w-5 h-5 text-[#3B5EE8]" />}
                  title="How would you like to start?"
                  description="We can load example construction project data so you can explore MeasureDeck straight away."
                />
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {
                      id: "demo" as const,
                      title: "Load demo project data",
                      description:
                        "Pre-populated with a realistic commercial project — perfect for exploring all features.",
                      badge: "Recommended",
                    },
                    {
                      id: "fresh" as const,
                      title: "Start fresh",
                      description:
                        "Begin with a blank workspace and build up your own commercial data from day one.",
                      badge: null,
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDemoChoice(opt.id)}
                      className={cn(
                        "text-left p-5 rounded-xl border-2 transition-all",
                        demoChoice === opt.id
                          ? "border-[#3B5EE8] bg-[#3B5EE8]/5"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      )}
                    >
                      {opt.badge && (
                        <span className="inline-block mb-2 px-2 py-0.5 rounded-full bg-[#3B5EE8]/10 text-[#3B5EE8] text-xs font-semibold">
                          {opt.badge}
                        </span>
                      )}
                      <p
                        className={cn(
                          "font-semibold text-sm",
                          demoChoice === opt.id ? "text-[#3B5EE8]" : "text-slate-800"
                        )}
                      >
                        {opt.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                        {opt.description}
                      </p>
                    </button>
                  ))}
                </div>
                <div className="mt-6">
                  <StepFooter onBack={back} onNext={handleDemoNext} disabled={!demoChoice} />
                </div>
              </div>
            )}

            {/* ── STEP 7: First Project ───────────────────────────────── */}
            {currentStep === 7 && (
              <div>
                <StepHeader
                  icon={<FolderOpen className="w-5 h-5 text-[#3B5EE8]" />}
                  title="Set up your first project"
                  description="All fields are optional — you can add or edit these details any time in MeasureDeck."
                />
                <form onSubmit={handleProjectNext} className="flex flex-col gap-5 mt-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Project name <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Riverside Apartments — Block A"
                      {...projectForm.register("projectName")}
                      className={inputCls()}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Contract value <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
                        £
                      </span>
                      <input
                        type="text"
                        placeholder="e.g. 2,500,000"
                        {...projectForm.register("contractValue")}
                        className={cn(inputCls(), "pl-7")}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Client name <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Riverside Developments Ltd"
                      {...projectForm.register("clientName")}
                      className={inputCls()}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Start date <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="date"
                      {...projectForm.register("startDate")}
                      className={inputCls()}
                    />
                  </div>

                  <StepFooter onBack={back} submitLabel="Continue" skipLabel="Skip for now" onSkip={next} />
                </form>
              </div>
            )}

            {/* ── STEP 8: Finish ──────────────────────────────────────── */}
            {currentStep === 8 && (
              <div className="flex flex-col items-center text-center py-8">
                <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-5">
                  <PartyPopper className="w-10 h-10 text-[#10B981]" />
                </div>
                <h1 className="text-3xl font-bold text-[#0D1B2E] tracking-tight">
                  You&apos;re all set!
                </h1>
                <p className="mt-3 text-slate-500 text-base max-w-md leading-relaxed">
                  Your MeasureDeck workspace is ready. Head to your dashboard to start managing
                  commercial costs, contracts, and reporting in one place.
                </p>

                <div className="mt-8 w-full max-w-sm bg-[#F8FAFC] rounded-xl border border-slate-200 p-5 text-left">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    What&apos;s waiting for you
                  </p>
                  <ul className="flex flex-col gap-2.5">
                    {[
                      "Live cost value reconciliation (CVR) dashboard",
                      "Subcontract order management",
                      "Variation and instruction tracker",
                      "Commercial risk register",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                  className={cn(
                    "mt-8 h-12 px-8 rounded-xl font-bold text-white bg-[#3B5EE8] hover:bg-[#2d4fd4]",
                    "transition-all active:scale-[0.99] disabled:opacity-70",
                    "flex items-center gap-2"
                  )}
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Go to Dashboard
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Summary sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <SummaryPanel data={summaryData} currentStep={currentStep} />
          </aside>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StepHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-[#3B5EE8]/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-xl font-bold text-[#0D1B2E]">{title}</h2>
        <p className="text-sm text-slate-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function StepFooter({
  onBack,
  onNext,
  submitLabel = "Continue",
  skipLabel,
  onSkip,
  disabled = false,
}: {
  onBack?: () => void;
  onNext?: () => void;
  submitLabel?: string;
  skipLabel?: string;
  onSkip?: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between pt-2">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back
      </button>
      <div className="flex items-center gap-2">
        {skipLabel && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="h-10 px-4 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {skipLabel}
          </button>
        )}
        <button
          type={onNext ? "button" : "submit"}
          onClick={onNext}
          disabled={disabled}
          className={cn(
            "h-10 px-5 rounded-lg font-semibold text-sm text-white transition-all",
            "bg-[#3B5EE8] hover:bg-[#2d4fd4] active:scale-[0.99]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-1.5"
          )}
        >
          {submitLabel}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
