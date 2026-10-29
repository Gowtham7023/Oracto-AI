import { useEffect, useState, useMemo } from "react";
import {
  DollarSign,
  Route,
  ShieldCheck,
  AlertTriangle,
  Brain,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Layers,
  Cpu,
  Sparkles,
  CheckCircle2,
  Clock,
  Coins,
  Check,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import api, { getApiErrorMessage } from "../services/api";
import type {
  StatsResponse,
  CostAnalyticsEntry,
  RoutingAnalyticsEntry,
  QualityAnalyticsEntry,
  EscalationAnalytics,
  ClassifierStatus,
  ClassificationReport,
  ClassifierRetrainResponse,
  RequestRecord,
} from "../types/api";
import { MetricCard } from "../components/MetricCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

type TabId = "cost" | "routing" | "quality" | "escalation" | "classifier";

const PROVIDER_COLORS: Record<string, string> = {
  ollama: "#2563EB",
  gemini: "#7C3AED",
  claude: "#EA580C",
  openai: "#16A34A",
};

function getProviderColor(p: string): string {
  return PROVIDER_COLORS[p?.toLowerCase()] ?? "#4F46E5";
}

function formatCost(amount: number): string {
  if (amount == null || isNaN(amount)) return "$0.00";
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs < 0.0001 && abs > 0) return `${sign}$${abs.toFixed(6)}`;
  return `${sign}$${abs.toFixed(4)}`;
}

export function Analytics() {
  const [activeTab, setActiveTab] = useState<TabId>("cost");

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [costData, setCostData] = useState<CostAnalyticsEntry[]>([]);
  const [routingData, setRoutingData] = useState<RoutingAnalyticsEntry[]>([]);
  const [qualityData, setQualityData] = useState<QualityAnalyticsEntry[]>([]);
  const [escalationData, setEscalationData] = useState<EscalationAnalytics | null>(null);
  const [classifierStatus, setClassifierStatus] = useState<ClassifierStatus | null>(null);
  const [classifierReport, setClassifierReport] = useState<ClassificationReport | null>(null);
  const [requests, setRequests] = useState<RequestRecord[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Retrain state
  const [retraining, setRetraining] = useState(false);
  const [retrainFeedback, setRetrainFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const fetchAllAnalytics = async () => {
    try {
      const [
        statsRes,
        costRes,
        routingRes,
        qualityRes,
        escalationRes,
        classifierStatusRes,
        classifierReportRes,
        requestsRes,
      ] = await Promise.all([
        api.get<StatsResponse>("/stats"),
        api.get<CostAnalyticsEntry[]>("/analytics/cost"),
        api.get<RoutingAnalyticsEntry[]>("/analytics/routing"),
        api.get<QualityAnalyticsEntry[]>("/analytics/quality"),
        api.get<EscalationAnalytics>("/analytics/escalation"),
        api.get<ClassifierStatus>("/classifier/status"),
        api.get<ClassificationReport>("/classifier/report"),
        api.get<RequestRecord[]>("/requests"),
      ]);

      setError("");
      setStats(statsRes.data);
      setCostData(costRes.data);
      setRoutingData(routingRes.data);
      setQualityData(qualityRes.data);
      setEscalationData(escalationRes.data);
      setClassifierStatus(classifierStatusRes.data);
      setClassifierReport(classifierReportRes.data);
      setRequests(requestsRes.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to load analytics workspace."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchAllAnalytics();
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    void fetchAllAnalytics();
  };

  useEffect(() => {
    queueMicrotask(() => void fetchAllAnalytics());
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainFeedback(null);

    try {
      await api.post<ClassifierRetrainResponse>("/classifier/retrain");
      // Refresh classifier status and report
      const [newStatus, newReport] = await Promise.all([
        api.get<ClassifierStatus>("/classifier/status"),
        api.get<ClassificationReport>("/classifier/report"),
      ]);
      setClassifierStatus(newStatus.data);
      setClassifierReport(newReport.data);
      setRetrainFeedback({
        type: "success",
        text: "Classifier successfully retrained and model weights updated.",
      });
      setTimeout(() => setRetrainFeedback(null), 5000);
    } catch (err: unknown) {
      setRetrainFeedback({
        type: "error",
        text: getApiErrorMessage(err, "Classifier retraining failed."),
      });
    } finally {
      setRetraining(false);
    }
  };

  // Cost by Model aggregation from actual requests
  const costByModelData = useMemo(() => {
    const map = new Map<string, { model: string; actualCost: number; requests: number }>();
    requests.forEach((req) => {
      const m = req.model || "unknown";
      if (!map.has(m)) {
        map.set(m, { model: m, actualCost: 0, requests: 0 });
      }
      const entry = map.get(m)!;
      entry.actualCost += req.actual_cost || 0;
      entry.requests++;
    });
    return Array.from(map.values()).sort((a, b) => b.actualCost - a.actualCost);
  }, [requests]);

  // Escalated requests trace
  const escalatedRequests = useMemo(() => {
    return requests.filter((r) => r.escalated || r.quality_escalated);
  }, [requests]);

  const tabs: { id: TabId; label: string; icon: typeof DollarSign }[] = [
    { id: "cost", label: "Cost", icon: DollarSign },
    { id: "routing", label: "Routing", icon: Route },
    { id: "quality", label: "Quality", icon: ShieldCheck },
    { id: "escalation", label: "Escalation", icon: AlertTriangle },
    { id: "classifier", label: "Classifier", icon: Brain },
  ];

  return (
    <div className="space-y-6">
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

      {/* Tabs navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-2 sm:space-x-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition cursor-pointer ${
                  isActive
                    ? "border-indigo-600 text-indigo-600 font-semibold"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={handleRetry} />}

      {/* Loading state */}
      {loading && <LoadingState message="Loading analytics insights..." rows={5} />}

      {!loading && !error && (
        <div className="space-y-6">
          {/* TAB 1: COST */}
          {activeTab === "cost" && (
            <div className="space-y-6">
              {/* Cost Summary Cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <MetricCard
                  label="Actual Cost"
                  value={formatCost(stats?.total_actual_cost ?? 0)}
                  icon={Coins}
                  subtitle="Spend across routed models"
                />
                <MetricCard
                  label="Baseline Cost"
                  value={formatCost(stats?.total_baseline_cost ?? 0)}
                  icon={DollarSign}
                  subtitle="Cost if all queries used frontier models"
                />
                <MetricCard
                  label="Money Saved"
                  value={formatCost(stats?.money_saved ?? 0)}
                  icon={(stats?.money_saved ?? 0) >= 0 ? TrendingUp : TrendingDown}
                  badge={{
                    text: `${(stats?.savings_percentage ?? 0).toFixed(1)}% saved`,
                    variant: (stats?.money_saved ?? 0) >= 0 ? "positive" : "negative",
                  }}
                  subtitle="Net financial efficiency gain"
                />
                <MetricCard
                  label="Average Latency"
                  value={
                    stats?.average_latency_ms != null
                      ? stats.average_latency_ms < 1000
                        ? `${stats.average_latency_ms.toFixed(0)} ms`
                        : `${(stats.average_latency_ms / 1000).toFixed(1)} s`
                      : "—"
                  }
                  icon={Clock}
                  subtitle="Mean response latency"
                />
              </div>

              {/* Charts: Actual vs Baseline & Cost by Provider */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Actual vs Baseline Chart */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Actual vs. Baseline Cost by Provider
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Compare cost incurred against frontier model benchmark.
                  </p>
                  {costData.some((c) => c.money_saved < 0) && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                      <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                      <p className="text-[11px] text-amber-700">
                        Negative savings means the routed model cost more than the Claude Sonnet 4.6 benchmark for that workload.
                      </p>
                    </div>
                  )}
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={costData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis
                          dataKey="provider"
                          tick={{ fill: "#64748B", fontSize: 12 }}
                          axisLine={{ stroke: "#E2E8F0" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#64748B", fontSize: 12 }}
                          axisLine={{ stroke: "#E2E8F0" }}
                          tickLine={false}
                          tickFormatter={(v) => `$${v}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E2E8F0",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            fontSize: "12px",
                          }}
                          formatter={(v) => [`$${Number(v).toFixed(6)}`]}
                        />
                        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                        <Bar
                          dataKey="actual_cost"
                          name="Actual Cost"
                          fill="#4F46E5"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="baseline_cost"
                          name="Baseline Cost"
                          fill="#94A3B8"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cost Share by Provider */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Cost Distribution by Provider
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Share of actual spend across registered providers.
                  </p>
                  <div className="mt-4 h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={costData.map((c) => ({
                            name: c.provider,
                            value: c.actual_cost,
                            color: getProviderColor(c.provider),
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {costData.map((c) => (
                            <Cell key={c.provider} fill={getProviderColor(c.provider)} />
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
                          formatter={(v) => [`$${Number(v).toFixed(6)}`, "Cost"]}
                        />
                        <Legend
                          formatter={(val: string) => (
                            <span className="capitalize text-xs text-slate-700">
                              {val}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Model Level Spend Breakdown */}
              {costByModelData.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    Cost Incurred by Model
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Model</th>
                          <th className="py-2.5 px-3">Requests Handled</th>
                          <th className="py-2.5 px-3">Total Spend</th>
                          <th className="py-2.5 px-3">Avg Cost / Request</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {costByModelData.map((item) => (
                          <tr key={item.model} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                              {item.model}
                            </td>
                            <td className="py-2.5 px-3">{item.requests}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-900">
                              ${item.actualCost.toFixed(6)}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-500">
                              ${(item.actualCost / item.requests).toFixed(6)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ROUTING */}
          {activeTab === "routing" && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <MetricCard
                  label="Routing Requests"
                  value={stats?.total_requests ?? 0}
                  icon={Route}
                  subtitle="Total requests dispatched"
                />
                <MetricCard
                  label="Simple Queries"
                  value={stats?.simple_requests ?? 0}
                  icon={CheckCircle2}
                  subtitle="Routed to Tier 1+ models"
                />
                <MetricCard
                  label="Moderate Queries"
                  value={stats?.moderate_requests ?? 0}
                  icon={Sparkles}
                  subtitle="Routed to Tier 2+ models"
                />
                <MetricCard
                  label="Complex Queries"
                  value={stats?.complex_requests ?? 0}
                  icon={Cpu}
                  subtitle="Routed to Tier 3 models"
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Complexity Breakdown */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Complexity Distribution
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Proportion of queries by classified tier.
                  </p>
                  <div className="mt-4 h-64 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Simple",
                              value: stats?.simple_requests ?? 0,
                              color: "#16A34A",
                            },
                            {
                              name: "Moderate",
                              value: stats?.moderate_requests ?? 0,
                              color: "#CA8A04",
                            },
                            {
                              name: "Complex",
                              value: stats?.complex_requests ?? 0,
                              color: "#7C3AED",
                            },
                          ].filter((d) => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          <Cell fill="#16A34A" />
                          <Cell fill="#CA8A04" />
                          <Cell fill="#7C3AED" />
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
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Provider Volume */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Routing by Provider & Complexity
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Volume of requests dispatched per complexity level.
                  </p>
                  <div className="mt-4 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={routingData.map((d) => ({
                          name: `${d.provider} (${d.complexity})`,
                          requests: d.requests,
                          provider: d.provider,
                        }))}
                        margin={{ top: 10, right: 10, left: -20, bottom: 40 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={{ fill: "#64748B", fontSize: 10 }}
                          angle={-25}
                          textAnchor="end"
                          axisLine={{ stroke: "#E2E8F0" }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#64748B", fontSize: 12 }}
                          axisLine={{ stroke: "#E2E8F0" }}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#FFFFFF",
                            borderColor: "#E2E8F0",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                            fontSize: "12px",
                          }}
                        />
                        <Bar dataKey="requests" fill="#4F46E5" radius={[4, 4, 0, 0]}>
                          {routingData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getProviderColor(entry.provider)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUALITY */}
          {activeTab === "quality" && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                <MetricCard
                  label="Average Quality"
                  value={
                    stats?.average_quality_score != null
                      ? `${(stats.average_quality_score * 100).toFixed(1)}%`
                      : "—"
                  }
                  icon={ShieldCheck}
                  subtitle="Composite score across requests"
                />
                <MetricCard
                  label="Evaluations Processed"
                  value={qualityData.reduce((sum, q) => sum + q.requests, 0)}
                  icon={CheckCircle2}
                  subtitle="Scored via LLM or Heuristics"
                />
                <MetricCard
                  label="Escalation Rate"
                  value={`${(stats?.escalation_rate ?? 0).toFixed(1)}%`}
                  icon={AlertTriangle}
                  badge={{
                    text: `${stats?.escalation_rate ?? 0}%`,
                    variant: (stats?.escalation_rate ?? 0) > 0 ? "warning" : "positive",
                  }}
                  subtitle="Triggers resulting in model upgrade"
                />
              </div>

              {/* Quality Distribution Chart */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
                <h3 className="text-sm font-semibold text-slate-900">
                  Quality Verification Status Breakdown
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Request volume partitioned by verification outcome and method.
                </p>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={qualityData.map((q) => ({
                        name: `${q.verification_status} (${q.verification_method || "heuristic"})`,
                        requests: q.requests,
                        status: q.verification_status,
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#64748B", fontSize: 11 }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748B", fontSize: 12 }}
                        axisLine={{ stroke: "#E2E8F0" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#FFFFFF",
                          borderColor: "#E2E8F0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="requests" fill="#16A34A" radius={[4, 4, 0, 0]}>
                        {qualityData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.verification_status?.toLowerCase() === "passed"
                                ? "#16A34A"
                                : "#DC2626"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ESCALATION */}
          {activeTab === "escalation" && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                <MetricCard
                  label="Escalation Rate"
                  value={
                    escalationData ? `${escalationData.escalation_rate.toFixed(1)}%` : "0.0%"
                  }
                  icon={AlertTriangle}
                  badge={{
                    text: `${escalationData?.escalated_requests || 0} requests`,
                    variant: (escalationData?.escalated_requests || 0) > 0 ? "warning" : "positive",
                  }}
                  subtitle="Percentage of requests escalated"
                />
                <MetricCard
                  label="Escalated Requests"
                  value={escalationData?.escalated_requests ?? 0}
                  icon={ArrowRight}
                  subtitle="Upgraded to higher tier model"
                />
                <MetricCard
                  label="Non-Escalated Requests"
                  value={escalationData?.non_escalated_requests ?? 0}
                  icon={CheckCircle2}
                  subtitle="Resolved directly at target tier"
                />
              </div>

              {/* Escalation Trace Table if requests available */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Model Escalation Pathway Trace ({escalatedRequests.length})
                </h3>

                {escalatedRequests.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Request</th>
                          <th className="py-3 px-4">Initial Model</th>
                          <th className="py-3 px-4">Escalated Model</th>
                          <th className="py-3 px-4">Quality Before → After</th>
                          <th className="py-3 px-4">Escalation Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {escalatedRequests.map((req) => (
                          <tr key={req.request_id} className="hover:bg-slate-50/60">
                            <td className="py-3 px-4 font-mono font-medium text-slate-900">
                              {req.request_id.slice(0, 8)}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-600">
                              {req.initial_model || req.primary_model || req.model}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-mono text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                                {req.final_model || req.model}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-medium">
                              <span className="text-rose-600">
                                {req.initial_quality_score != null
                                  ? `${(req.initial_quality_score * 100).toFixed(0)}%`
                                  : "—"}
                              </span>
                              <span className="text-slate-400 mx-1.5">→</span>
                              <span className="text-emerald-600">
                                {req.final_quality_score != null
                                  ? `${(req.final_quality_score * 100).toFixed(0)}%`
                                  : req.quality_score != null
                                  ? `${(req.quality_score * 100).toFixed(0)}%`
                                  : "—"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 max-w-xs truncate text-[11px]">
                              {req.escalation_reason || "Score below quality threshold"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
                    <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-900">
                      No escalated requests recorded
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      All prompts were completed at their initial routing tier.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: CLASSIFIER */}
          {activeTab === "classifier" && (
            <div className="space-y-6">
              {/* Header card with retrain button */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-base font-semibold text-slate-900">
                      Complexity Classifier Model
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Supervised ML classifier used to categorize user prompt complexity prior to routing.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleRetrain}
                  disabled={retraining}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <RefreshCw className={`h-4 w-4 ${retraining ? "animate-spin" : ""}`} />
                  {retraining ? "Retraining Classifier..." : "Retrain Classifier"}
                </button>
              </div>

              {/* Retrain feedback */}
              {retrainFeedback && (
                <div
                  className={`rounded-lg border p-3 text-xs font-medium flex items-center gap-2 ${
                    retrainFeedback.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  {retrainFeedback.type === "success" ? (
                    <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  )}
                  <span>{retrainFeedback.text}</span>
                </div>
              )}

              {/* Classifier Status Metrics */}
              {classifierStatus && (
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <MetricCard
                    label="Model Architecture"
                    value={classifierStatus.model_type || "TF-IDF + LogisticRegression"}
                    icon={Brain}
                    subtitle="Classification algorithm"
                  />
                  <MetricCard
                    label="Accuracy"
                    value={`${(classifierStatus.accuracy * 100).toFixed(1)}%`}
                    icon={CheckCircle2}
                    badge={{
                      text: "Validated",
                      variant: "positive",
                    }}
                    subtitle="Holdout test accuracy"
                  />
                  <MetricCard
                    label="Training Samples"
                    value={classifierStatus.training_samples}
                    icon={Layers}
                    subtitle="Labeled training corpus"
                  />
                  <MetricCard
                    label="Test Samples"
                    value={classifierStatus.test_samples}
                    icon={Cpu}
                    subtitle="Evaluation holdout samples"
                  />
                </div>
              )}

              {/* Classification Report Table */}
              {classifierReport && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Precision, Recall & F1-Score by Class
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3">Class</th>
                          <th className="py-2.5 px-3">Precision</th>
                          <th className="py-2.5 px-3">Recall</th>
                          <th className="py-2.5 px-3">F1-Score</th>
                          <th className="py-2.5 px-3">Support</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {["simple", "moderate", "complex"].map((cls) => {
                          const metric = classifierReport[cls];
                          if (typeof metric !== "object" || metric === null) return null;
                          return (
                            <tr key={cls} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-semibold capitalize text-slate-900">
                                {cls}
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {(metric.precision * 100).toFixed(1)}%
                              </td>
                              <td className="py-2.5 px-3 font-mono">
                                {(metric.recall * 100).toFixed(1)}%
                              </td>
                              <td className="py-2.5 px-3 font-mono font-semibold text-indigo-600">
                                {(metric["f1-score"] * 100).toFixed(1)}%
                              </td>
                              <td className="py-2.5 px-3 text-slate-500">
                                {metric.support}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
