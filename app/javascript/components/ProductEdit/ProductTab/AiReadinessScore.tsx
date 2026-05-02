import { Sparkle, RefreshCcw, CheckCircle, LightBulb } from "@boxicons/react";
import * as React from "react";

import { Button } from "$app/components/Button";

type Severity = "good" | "ok" | "weak" | "missing";

type CategoryScore = {
  label: string;
  score: number;
  severity: Severity;
  note: string;
};

type Suggestion = {
  id: string;
  category: string;
  before: string;
  after: string;
  reasoning: string;
};

const CATEGORIES: CategoryScore[] = [
  { label: "Name", score: 88, severity: "good", note: "Clear and specific" },
  { label: "Description", score: 54, severity: "weak", note: "Lacks concrete benefits" },
  { label: "Cover image", score: 70, severity: "ok", note: "Could be brighter" },
  { label: "Pricing", score: 92, severity: "good", note: "In line with similar products" },
  { label: "Social proof", score: 32, severity: "missing", note: "No testimonials yet" },
];

const SUGGESTIONS: Suggestion[] = [
  {
    id: "desc-rewrite",
    category: "Description",
    before: "A detailed guide to learning Lightroom for beginners.",
    after:
      "Master Lightroom in 7 days — 14 video lessons, 40 preset bundle included, lifetime updates. Built for photographers shooting their first paid wedding.",
    reasoning: "Adds concrete deliverables (lesson count, presets), an outcome ('first paid wedding'), and a timeline.",
  },
  {
    id: "cover-suggestion",
    category: "Cover image",
    before: "Current cover is a flat product mockup.",
    after: "Upgrade to a brighter, higher-contrast cover with the product title overlaid.",
    reasoning: "Products with text-overlay covers convert 18% better in your category (Photography → Editing).",
  },
  {
    id: "social-proof",
    category: "Social proof",
    before: "No testimonials section.",
    after:
      "Add a 'What buyers are saying' section pulling your top 3 reviews. You have 12 reviews averaging 4.8 stars.",
    reasoning: "Reviews you already have aren't surfaced on the product page — likely cost ~$240/mo in lost conversions.",
  },
];

const computeOverall = (scores: number[]) => Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

const severityRingColor = (severity: Severity) => {
  switch (severity) {
    case "good":
      return "stroke-success";
    case "ok":
      return "stroke-warning";
    case "weak":
      return "stroke-warning";
    case "missing":
      return "stroke-danger";
  }
};

const severityTextColor = (severity: Severity) => {
  switch (severity) {
    case "good":
      return "text-success";
    case "ok":
      return "text-warning";
    case "weak":
      return "text-warning";
    case "missing":
      return "text-danger";
  }
};

const severityBg = (severity: Severity) => {
  switch (severity) {
    case "good":
      return "bg-success/15";
    case "ok":
      return "bg-warning/15";
    case "weak":
      return "bg-warning/15";
    case "missing":
      return "bg-danger/15";
  }
};

const overallSeverity = (score: number): Severity => {
  if (score >= 80) return "good";
  if (score >= 60) return "ok";
  if (score >= 40) return "weak";
  return "missing";
};

const ScoreRing = ({ score, severity }: { score: number; severity: Severity }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative">
      <svg width="88" height="88" viewBox="0 0 88 88" className="rotate-[-90deg]">
        <circle cx="44" cy="44" r={radius} className="fill-none stroke-border" strokeWidth="6" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          className={`fill-none transition-all duration-500 ${severityRingColor(severity)}`}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-semibold ${severityTextColor(severity)}`}>{score}</span>
        <span className="text-xs text-muted">/ 100</span>
      </div>
    </div>
  );
};

const CategoryRow = ({ cat }: { cat: CategoryScore }) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex flex-col">
      <span className="text-sm font-medium">{cat.label}</span>
      <span className="text-xs text-muted">{cat.note}</span>
    </div>
    <div className="flex items-center gap-2">
      <span className={`text-sm font-semibold ${severityTextColor(cat.severity)}`}>{cat.score}</span>
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full ${severityRingColor(cat.severity).replace("stroke-", "bg-")}`}
          style={{ width: `${cat.score}%` }}
        />
      </div>
    </div>
  </div>
);

export const AiReadinessScore = () => {
  const [appliedIds, setAppliedIds] = React.useState<Set<string>>(new Set());
  const [recalculating, setRecalculating] = React.useState(false);
  const [scoreBoost, setScoreBoost] = React.useState(0);

  const baseScore = computeOverall(CATEGORIES.map((c) => c.score));
  const overall = Math.min(100, baseScore + scoreBoost);
  const severity = overallSeverity(overall);

  const apply = (id: string) => {
    setAppliedIds((prev) => new Set(prev).add(id));
    setScoreBoost((b) => b + 7);
  };

  const recalc = () => {
    setRecalculating(true);
    window.setTimeout(() => setRecalculating(false), 900);
  };

  const visibleSuggestions = SUGGESTIONS.filter((s) => !appliedIds.has(s.id));

  return (
    <section
      className="grid gap-6 rounded border border-accent/40 bg-accent/5 p-4 md:p-6"
      aria-label="AI readiness score"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-accent/20">
            <Sparkle className="size-5 text-accent" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Page readiness score</h3>
            <p className="text-sm text-muted">AI-graded review of how well your product page converts.</p>
          </div>
        </div>
        <Button color="primary" outline onClick={recalc} disabled={recalculating}>
          <RefreshCcw className={`size-4 ${recalculating ? "animate-spin" : ""}`} />
          {recalculating ? "Recalculating…" : "Re-score"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          <ScoreRing score={overall} severity={severity} />
          <span className={`text-xs font-medium uppercase tracking-wide ${severityTextColor(severity)}`}>
            {severity === "good" ? "Strong" : severity === "ok" ? "Decent" : severity === "weak" ? "Needs work" : "Weak"}
          </span>
        </div>

        <div className="grid gap-3">
          {CATEGORIES.map((cat) => (
            <CategoryRow key={cat.label} cat={cat} />
          ))}
        </div>
      </div>

      {visibleSuggestions.length > 0 ? (
        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LightBulb className="size-4 text-accent" />
            Top suggestions
          </div>
          {visibleSuggestions.map((s) => (
            <div key={s.id} className={`grid gap-2 rounded border border-border p-3 ${severityBg("ok")}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted">{s.category}</span>
                <Button color="primary" size="sm" onClick={() => apply(s.id)}>
                  Apply
                </Button>
              </div>
              <div className="grid gap-1 text-sm">
                <div className="text-muted line-through">{s.before}</div>
                <div>{s.after}</div>
              </div>
              <div className="text-xs text-muted">Why: {s.reasoning}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded border border-success/40 bg-success/10 p-3 text-sm">
          <CheckCircle className="size-5 text-success" />
          All suggestions applied. Re-score to see your new grade.
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted">
        <span>Powered by Claude · grounded in your last 30 days of analytics</span>
        {appliedIds.size > 0 ? <span>{appliedIds.size} applied (+{appliedIds.size * 7} pts)</span> : null}
      </div>
    </section>
  );
};
