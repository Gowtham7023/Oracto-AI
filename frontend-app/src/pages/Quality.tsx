import { useEffect, useState, useMemo } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Sparkles,
} from "lucide-react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api, { getApiErrorMessage } from "../services/api";
import type {
  QualityAnalyticsEntry,
  EscalationAnalytics,
  RequestRecord,
} from "../types/api";
import { MetricCard } from "../components/MetricCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

export function Quality() {
  const [qualityData, setQualityData] = useState<QualityAnalyticsEntry[]>([]);
  const [escalationData, setEscalationData] = useState<EscalationAnalytics | null>(null);
  const [requests, setRequests] = useState<RequestRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [qualityRes, escalationRes, requestsRes] = await Promise.all([
        api.get<QualityAnalyticsEntry[]>("/analytics/quality"),
        api.get<EscalationAnalytics>("/analytics/escalation"),
        api.get<RequestRecord[]>("/requests"),
      ]);
      setError("");
      setQualityData(qualityRes.data);
      setEscalationData(escalationRes.data);
      setRequests(requestsRes.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to load quality intelligence data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchData();
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    void fetchData();
  };

  useEffect(() => {
    queueMicrotask(() => void fetchData());
  }, []);

  // Compute top metrics from real backend analytics
  const metrics = useMemo(() => {
    let totalVerified = 0;
    let passedCount = 0;
    let failedCount = 0;
    let weightedQualitySum = 0;
    let totalScored = 0;

    qualityData.forEach((entry) => {
      totalVerified += entry.requests;
      const statusNorm = entry.verification_status?.toLowerCase();
      if (statusNorm === "passed") {
        passedCount += entry.requests;
      } else if (statusNorm === "failed") {
        failedCount += entry.requests;
      }

      if (entry.average_quality !== null) {
        weightedQualitySum += entry.average_quality * entry.requests;
        totalScored += entry.requests;
      }
    });

    const avgQuality = totalScored > 0 ? (weightedQualitySum / totalScored) * 100 : null;
    const escalatedCount = escalationData?.escalated_requests ?? 0;

    return {
      totalVerified,
      passedCount,
      failedCount,
      avgQuality,
      escalatedCount,
      passRate: totalVerified > 0 ? (passedCount / totalVerified) * 100 : 0,
      failRate: totalVerified > 0 ? (failedCount / totalVerified) * 100 : 0,
    };
  }, [qualityData, escalationData]);

  // Distribution chart data
  const distributionChartData = useMemo(() => {
    return [
      { name: "Passed", value: metrics.passedCount, color: "#16A34A" },
      { name: "Failed", value: metrics.failedCount, color: "#DC2626" },
    ].filter((d) => d.value > 0);
  }, [metrics]);

  // Method breakdown (LLM Judge vs Heuristic Fallback)
  const methodStats = useMemo(() => {
    const map = new Map<
      string,
      { method: string; requests: number; qualitySum: number; scoredCount: number }
    >();

    qualityData.forEach((entry) => {
      const rawMethod = entry.verification_method || "Heuristic Fallback";
      const method =
        rawMethod.toLowerCase().includes("llm") || rawMethod.toLowerCase().includes("judge")
          ? "LLM Judge"
          : "Heuristic Fallback";

      if (!map.has(method)) {
        map.set(method, {
          method,
          requests: 0,
          qualitySum: 0,
          scoredCount: 0,
        });
      }

      const m = map.get(method)!;
      m.requests += entry.requests;
      if (entry.average_quality !== null) {
        m.qualitySum += entry.average_quality * entry.requests;
        m.scoredCount += entry.requests;
      }
    });

    return Array.from(map.values()).map((m) => ({
      name: m.method,
      requests: m.requests,
      avgScore: m.scoredCount > 0 ? (m.qualitySum / m.scoredCount) * 100 : null,
    }));
  }, [qualityData]);

  // Quality failures from actual request records
  const qualityFailures = useMemo(() => {
    return requests.filter((r) => {
      const isFailed = r.verification_status?.toLowerCase() === "failed";
      const isEsc = Boolean(r.escalated || r.quality_escalated);
      return isFailed || isEsc;
    });
  }, [requests]);

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin text-indigo-600" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={handleRetry} />}

      {/* Loading state */}
      {loading && <LoadingState message="Loading quality analytics..." rows={4} />}

      {!loading && !error && (
        <>
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetricCard
              label="Average Quality"
              value={metrics.avgQuality !== null ? `${metrics.avgQuality.toFixed(1)}%` : "—"}
              icon={ShieldCheck}
              subtitle="Aggregated evaluation score"
            />
            <MetricCard
              label="Passed"
              value={metrics.passedCount}
              icon={CheckCircle2}
              badge={{
                text: `${metrics.passRate.toFixed(0)}%`,
                variant: "positive",
              }}
              subtitle="Satisfied quality criteria"
            />
            <MetricCard
              label="Failed"
              value={metrics.failedCount}
              icon={XCircle}
              badge={{
                text: `${metrics.failRate.toFixed(0)}%`,
                variant: metrics.failedCount > 0 ? "negative" : "neutral",
              }}
              subtitle="Below threshold score"
            />
            <MetricCard
              label="Escalated"
              value={metrics.escalatedCount}
              icon={AlertTriangle}
              badge={{
                text: `${
                  escalationData ? escalationData.escalation_rate.toFixed(1) : 0
                }%`,
                variant: metrics.escalatedCount > 0 ? "warning" : "neutral",
              }}
              subtitle="Re-routed to higher tier"
            />
          </div>

          {/* Visualizations: Quality Distribution & Verification Methods */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Quality Distribution */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h2 className="text-sm font-semibold text-slate-900">
                Quality Verification Distribution
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportion of passed versus failed verification outcomes.
              </p>

              {distributionChartData.length > 0 ? (
                <div className="mt-4 h-64 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distributionChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {distributionChartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E2E8F0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        formatter={(val: string) => (
                          <span className="text-xs text-slate-700 font-medium">
                            {val}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-8 text-center text-xs text-slate-400 py-12">
                  No verification distribution data available yet.
                </div>
              )}
            </div>

            {/* Verification Methods Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Verification Methods
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluation pipeline throughput and accuracy by method.
                </p>

                <div className="mt-4 space-y-4">
                  {methodStats.map((method) => {
                    const isLlm = method.name.toLowerCase().includes("llm");
                    return (
                      <div
                        key={method.name}
                        className="rounded-lg border border-slate-200 bg-slate-50/50 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                              {isLlm ? (
                                <Sparkles className="h-4 w-4" />
                              ) : (
                                <Cpu className="h-4 w-4" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-xs font-semibold text-slate-900">
                                {method.name}
                              </h3>
                              <p className="text-[11px] text-slate-500">
                                {method.requests} evaluations processed
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-xs font-bold text-slate-900 block">
                              {method.avgScore !== null
                                ? `${method.avgScore.toFixed(1)}%`
                                : "N/A"}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              avg score
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        {method.avgScore !== null && (
                          <div className="mt-3">
                            <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-indigo-600 transition-all"
                                style={{ width: `${Math.min(method.avgScore, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {methodStats.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">
                      No verification method breakdown recorded.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Total Evaluations: {metrics.totalVerified}</span>
                <span className="text-emerald-700 font-medium">
                  {metrics.passRate.toFixed(0)}% Overall Pass Rate
                </span>
              </div>
            </div>
          </div>

          {/* Quality Failures Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Quality Incidents & Escalations ({qualityFailures.length})
              </h2>
            </div>

            {qualityFailures.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3.5">Request</th>
                        <th className="px-4 py-3.5">Initial Model</th>
                        <th className="px-4 py-3.5">Quality Score</th>
                        <th className="px-4 py-3.5">Verification Outcome</th>
                        <th className="px-4 py-3.5">Escalated</th>
                        <th className="px-4 py-3.5">Final Model</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {qualityFailures.map((req) => (
                        <tr
                          key={req.request_id}
                          className="hover:bg-slate-50/60 transition"
                        >
                          {/* Request ID + Prompt preview */}
                          <td className="px-4 py-3 max-w-[240px]">
                            <span className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] block w-fit mb-0.5">
                              {req.request_id.slice(0, 8)}
                            </span>
                            <p className="truncate text-slate-600 font-normal text-[11px]">
                              {req.prompt}
                            </p>
                          </td>

                          {/* Initial Model */}
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                            {req.initial_model || req.primary_model || req.model}
                          </td>

                          {/* Quality Score */}
                          <td className="px-4 py-3">
                            {req.quality_score !== null ? (
                              <span
                                className={`font-semibold ${
                                  req.quality_score >= 0.8
                                    ? "text-emerald-700"
                                    : req.quality_score >= 0.6
                                    ? "text-amber-700"
                                    : "text-rose-700"
                                }`}
                              >
                                {(req.quality_score * 100).toFixed(0)}%
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          {/* Verification Reason / Status */}
                          <td className="px-4 py-3 text-slate-600 max-w-xs truncate text-[11px]">
                            {req.escalation_reason ||
                              req.fallback_reason ||
                              req.verification_status ||
                              "Verification failed"}
                          </td>

                          {/* Escalated */}
                          <td className="px-4 py-3">
                            {req.escalated || req.quality_escalated ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                Yes
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">No</span>
                            )}
                          </td>

                          {/* Final Model */}
                          <td className="px-4 py-3 font-mono text-[11px] text-slate-800">
                            {req.final_model || req.model}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                <h3 className="text-sm font-semibold text-slate-900">
                  No quality verification failures
                </h3>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                  All requests processed through Oracto met or exceeded their quality thresholds on initial generation.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
