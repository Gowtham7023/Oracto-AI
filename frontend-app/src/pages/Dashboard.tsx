import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipValueType,
} from "recharts";
import { Info } from "lucide-react";
import api from "../services/api";
import type {
  EscalationAnalytics,
  QualityAnalyticsEntry,
  StatsResponse,
} from "../types/api";

const PROVIDER_COLORS: Record<string, string> = {
  ollama: "#3b82f6",
  gemini: "#a855f7",
  claude: "#f59e0b",
};

const COMPLEXITY_COLORS: Record<string, string> = {
  Simple: "#3b82f6",
  Moderate: "#f59e0b",
  Complex: "#8b5cf6",
};

const STATUS_COLORS: Record<string, string> = {
  passed: "#10b981",
  failed: "#ef4444",
};

export function Dashboard() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [quality, setQuality] = useState<QualityAnalyticsEntry[]>([]);
  const [escalation, setEscalation] = useState<EscalationAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get<StatsResponse>("/stats"),
      api.get<QualityAnalyticsEntry[]>("/analytics/quality"),
      api.get<EscalationAnalytics>("/analytics/escalation"),
    ])
      .then(([statsRes, qualityRes, escalationRes]) => {
        setStats(statsRes.data);
        setQuality(qualityRes.data);
        setEscalation(escalationRes.data);
      })
      .catch(() => {
        setError("Unable to load dashboard data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const scoredQuality = quality.filter(
    (entry) => entry.average_quality !== null,
  );
  const totalQualityRequests = scoredQuality.reduce(
    (sum, entry) => sum + entry.requests,
    0,
  );

  const weightedQuality =
    totalQualityRequests > 0
      ? scoredQuality.reduce(
          (sum, entry) =>
            sum + (entry.average_quality ?? 0) * entry.requests,
          0,
        ) / totalQualityRequests
      : 0;

  const passedRequests = quality
    .filter((entry) => entry.verification_status.toLowerCase() === "passed")
    .reduce((sum, entry) => sum + entry.requests, 0);

  const failedRequests = quality
    .filter((entry) => entry.verification_status.toLowerCase() === "failed")
    .reduce((sum, entry) => sum + entry.requests, 0);

  // Chart data for Request Distribution
  const distributionData = stats
    ? [
        { name: "Simple", requests: stats.simple_requests },
        { name: "Moderate", requests: stats.moderate_requests },
        { name: "Complex", requests: stats.complex_requests },
      ]
    : [];

  // Chart data for Provider Usage
  const providerData = stats
    ? [
        { name: "Ollama", requests: stats.ollama_requests, key: "ollama" },
        { name: "Gemini", requests: stats.gemini_requests, key: "gemini" },
        { name: "Claude", requests: stats.claude_requests, key: "claude" },
      ]
    : [];

  // Chart data for Quality Overview
  const qualityChartData = [
    { name: "Passed", requests: passedRequests, status: "passed" },
    { name: "Failed", requests: failedRequests, status: "failed" },
  ];

  return (
    <div className="space-y-8">

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-8">
          <svg
            className="h-5 w-5 animate-spin text-indigo-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span className="text-slate-500">Loading dashboard metrics...</span>
        </div>
      )}

      {!loading && !error && !stats && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500">
          No dashboard data available.
        </div>
      )}

      {!loading && !error && stats?.total_requests === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-500">
          No requests have been recorded yet. Submit a prompt in Playground to
          populate dashboard analytics.
        </div>
      )}

      {!loading && stats && (
        <>
          {/* Top Summary Cards (Preserved) */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Total Requests</p>
              <p className="mt-2 text-3xl font-bold">{stats.total_requests}</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Actual Cost</p>
              <p className="mt-2 text-3xl font-bold">
                ${stats.total_actual_cost.toFixed(6)}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Savings</p>
              <p
                className={`mt-2 text-3xl font-bold ${stats.savings_percentage >= 0 ? "text-emerald-600" : "text-red-400"}`}
              >
                {stats.savings_percentage.toFixed(1)}%
              </p>
              <div className="mt-2 flex items-center gap-1">
                <div className="group relative inline-flex">
                  <button
                    type="button"
                    aria-label="Savings explanation"
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                  >
                    <Info className="h-3.5 w-3.5" />
                    <span>vs benchmark</span>
                  </button>
                  <div
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 shadow-lg opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
                  >
                    Savings compared with the Claude Sonnet 4.6 frontier benchmark.
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-sm text-slate-500">Average Quality</p>
              <p className="mt-2 text-3xl font-bold">
                {stats.average_quality_score !== null &&
                stats.average_quality_score !== undefined
                  ? `${(stats.average_quality_score * 100).toFixed(1)}%`
                  : "—"}
              </p>
            </div>
          </div>

          {/* 1. COST OVERVIEW */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-xl font-semibold">Cost Overview</h3>
            <p className="mt-1 text-sm text-slate-500">
              Total expenditure and cumulative routing savings.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Actual Cost</p>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-700">
                  ${stats.total_actual_cost.toFixed(6)}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Baseline Cost</p>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-700">
                  ${stats.total_baseline_cost.toFixed(6)}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Money Saved</p>
                <p
                  className={`mt-1 font-mono text-2xl font-bold ${stats.money_saved >= 0 ? "text-emerald-600" : "text-red-400"}`}
                >
                  ${stats.money_saved.toFixed(6)}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Savings Percentage</p>
                <p
                  className={`mt-1 text-2xl font-bold ${stats.savings_percentage >= 0 ? "text-emerald-600" : "text-red-400"}`}
                >
                  {stats.savings_percentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* 2 & 3. REQUEST DISTRIBUTION & PROVIDER USAGE */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 2. REQUEST DISTRIBUTION */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-semibold">Request Distribution</h3>
              <p className="mt-1 text-sm text-slate-500">
                Incoming prompt complexity classification.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Simple</p>
                  <p className="mt-1 text-xl font-bold text-blue-400">
                    {stats.simple_requests}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Moderate</p>
                  <p className="mt-1 text-xl font-bold text-amber-400">
                    {stats.moderate_requests}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Complex</p>
                  <p className="mt-1 text-xl font-bold text-purple-400">
                    {stats.complex_requests}
                  </p>
                </div>
              </div>

              <div className="mt-6 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={distributionData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={{ stroke: "#334155" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={{ stroke: "#334155" }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "0.5rem",
                        color: "#e2e8f0",
                      }}
                      cursor={{ fill: "rgba(148,163,184,0.08)" }}
                      formatter={(value: TooltipValueType | undefined) => [
                        value ?? 0,
                        "Requests",
                      ]}
                    />
                    <Bar dataKey="requests" radius={[4, 4, 0, 0]}>
                      {distributionData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={COMPLEXITY_COLORS[entry.name] ?? "#64748b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 3. PROVIDER USAGE */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-semibold">Provider Usage</h3>
              <p className="mt-1 text-sm text-slate-500">
                Request volume routed to LLM providers.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Ollama</p>
                  <p className="mt-1 text-xl font-bold text-blue-400">
                    {stats.ollama_requests}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Gemini</p>
                  <p className="mt-1 text-xl font-bold text-purple-400">
                    {stats.gemini_requests}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Claude</p>
                  <p className="mt-1 text-xl font-bold text-amber-400">
                    {stats.claude_requests}
                  </p>
                </div>
              </div>

              <div className="mt-6 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={providerData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={{ stroke: "#334155" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={{ stroke: "#334155" }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "0.5rem",
                        color: "#e2e8f0",
                      }}
                      cursor={{ fill: "rgba(148,163,184,0.08)" }}
                      formatter={(value: TooltipValueType | undefined) => [
                        value ?? 0,
                        "Requests",
                      ]}
                    />
                    <Bar dataKey="requests" radius={[4, 4, 0, 0]}>
                      {providerData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={PROVIDER_COLORS[entry.key] ?? "#64748b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 4 & 5. QUALITY OVERVIEW & ESCALATION OVERVIEW */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* 4. QUALITY OVERVIEW */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h3 className="text-xl font-semibold">Quality Overview</h3>
              <p className="mt-1 text-sm text-slate-500">
                Response verification and average quality pass rate.
              </p>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Passed</p>
                  <p className="mt-1 text-xl font-bold text-emerald-600">
                    {passedRequests}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Failed</p>
                  <p className="mt-1 text-xl font-bold text-red-400">
                    {failedRequests}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                  <p className="text-xs text-slate-500">Avg Quality</p>
                  <p className="mt-1 text-xl font-bold text-slate-700">
                    {totalQualityRequests > 0
                      ? `${(weightedQuality * 100).toFixed(1)}%`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-6 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={qualityChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={{ stroke: "#334155" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      axisLine={{ stroke: "#334155" }}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "0.5rem",
                        color: "#e2e8f0",
                      }}
                      cursor={{ fill: "rgba(148,163,184,0.08)" }}
                      formatter={(value: TooltipValueType | undefined) => [
                        value ?? 0,
                        "Requests",
                      ]}
                    />
                    <Bar dataKey="requests" radius={[4, 4, 0, 0]}>
                      {qualityChartData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.status] ?? "#64748b"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 5. ESCALATION OVERVIEW */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-semibold">Escalation Overview</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Requests automatically upgraded for quality assurance.
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="mt-1 text-xl font-bold text-slate-700">
                      {escalation?.total_requests ?? stats.total_requests}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Escalated</p>
                    <p className="mt-1 text-xl font-bold text-amber-700">
                      {escalation?.escalated_requests ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Non-Escalated</p>
                    <p className="mt-1 text-xl font-bold text-emerald-600">
                      {escalation?.non_escalated_requests ?? 0}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
                    <p className="text-xs text-slate-500">Escalation Rate</p>
                    <p className="mt-1 text-xl font-bold text-slate-700">
                      {escalation !== null && escalation !== undefined
                        ? `${escalation.escalation_rate.toFixed(2)}%`
                        : `${stats.escalation_rate.toFixed(2)}%`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Escalation Ratio Bar */}
              <div className="mt-6 pt-4 border-t border-slate-200/80">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Escalation Ratio</span>
                  <span className="font-mono text-slate-600">
                    {escalation?.escalated_requests ?? 0} /{" "}
                    {escalation?.total_requests ?? stats.total_requests}
                  </span>
                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-yellow-500 transition-all"
                    style={{
                      width: `${
                        escalation && escalation.total_requests > 0
                          ? (escalation.escalated_requests /
                              escalation.total_requests) *
                            100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 6. PERFORMANCE */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-xl font-semibold">Performance</h3>
            <p className="mt-1 text-sm text-slate-500">
              Key operational latency and quality health signals.
            </p>

            <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Average Latency</p>
                <p className="mt-1 text-2xl font-bold text-slate-700">
                  {stats.average_latency_ms.toFixed(0)} ms
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Average Quality</p>
                <p className="mt-1 text-2xl font-bold text-slate-700">
                  {stats.average_quality_score !== null &&
                  stats.average_quality_score !== undefined
                    ? `${(stats.average_quality_score * 100).toFixed(1)}%`
                    : "—"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500">Total Requests</p>
                <p className="mt-1 text-2xl font-bold text-slate-700">
                  {stats.total_requests}
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
