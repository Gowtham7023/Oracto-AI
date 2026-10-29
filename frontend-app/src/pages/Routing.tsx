import { useEffect, useState, useMemo, useId } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Cpu,
  AlertTriangle,
  Layers,
  CheckCircle2,
  RefreshCw,
  Sliders,
  Check,
} from "lucide-react";
import api, { getApiErrorMessage } from "../services/api";
import type {
  RoutingAnalyticsEntry,
  RoutingConfig,
  EscalationAnalytics,
} from "../types/api";
import { MetricCard } from "../components/MetricCard";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

const PROVIDER_COLORS: Record<string, string> = {
  ollama: "#2563EB",
  gemini: "#7C3AED",
  claude: "#EA580C",
  openai: "#16A34A",
};

function getProviderColor(p: string): string {
  return PROVIDER_COLORS[p.toLowerCase()] ?? "#4F46E5";
}

// Flow nodes definition for ReactFlow
const initialNodes: Node[] = [
  {
    id: "1",
    type: "default",
    position: { x: 30, y: 50 },
    data: {
      label: (
        <div className="text-left p-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-blue-700">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            USER REQUEST
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Prompt received</p>
        </div>
      ),
    },
    style: {
      background: "#FFFFFF",
      border: "2px solid #93C5FD",
      borderRadius: "10px",
      boxShadow: "0 2px 8px -2px rgba(37, 99, 235, 0.15)",
      width: 160,
    },
  },
  {
    id: "2",
    type: "default",
    position: { x: 230, y: 50 },
    data: {
      label: (
        <div className="text-left p-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-700">
            <span className="h-2 w-2 rounded-full bg-indigo-500" />
            COMPLEXITY CLASSIFIER
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Simple • Moderate • Complex
          </p>
        </div>
      ),
    },
    style: {
      background: "#FFFFFF",
      border: "2px solid #A5B4FC",
      borderRadius: "10px",
      boxShadow: "0 2px 8px -2px rgba(79, 70, 229, 0.15)",
      width: 175,
    },
  },
  {
    id: "3",
    type: "default",
    position: { x: 445, y: 50 },
    data: {
      label: (
        <div className="text-left p-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-purple-700">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            COST-AWARE ROUTER
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Min tier & cost ranker
          </p>
        </div>
      ),
    },
    style: {
      background: "#FFFFFF",
      border: "2px solid #C4B5FD",
      borderRadius: "10px",
      boxShadow: "0 2px 8px -2px rgba(124, 58, 237, 0.15)",
      width: 165,
    },
  },
  {
    id: "4",
    type: "default",
    position: { x: 650, y: 50 },
    data: {
      label: (
        <div className="text-left p-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-700">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            MODEL SELECTION
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Primary model picked</p>
        </div>
      ),
    },
    style: {
      background: "#FFFFFF",
      border: "2px solid #67E8F9",
      borderRadius: "10px",
      boxShadow: "0 2px 8px -2px rgba(8, 145, 178, 0.15)",
      width: 160,
    },
  },
  {
    id: "5",
    type: "default",
    position: { x: 850, y: 50 },
    data: {
      label: (
        <div className="text-left p-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            LLM PROVIDER
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Generation executed
          </p>
        </div>
      ),
    },
    style: {
      background: "#FFFFFF",
      border: "2px solid #86EFAC",
      borderRadius: "10px",
      boxShadow: "0 2px 8px -2px rgba(22, 163, 74, 0.15)",
      width: 160,
    },
  },
  {
    id: "6",
    type: "default",
    position: { x: 850, y: 170 },
    data: {
      label: (
        <div className="text-left p-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-cyan-700">
            <span className="h-2 w-2 rounded-full bg-cyan-500" />
            QUALITY VERIFICATION
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Score vs threshold</p>
        </div>
      ),
    },
    style: {
      background: "#FFFFFF",
      border: "2px solid #A5F3FC",
      borderRadius: "10px",
      boxShadow: "0 2px 8px -2px rgba(6, 182, 212, 0.15)",
      width: 160,
    },
  },
  {
    id: "7",
    type: "default",
    position: { x: 550, y: 170 },
    data: {
      label: (
        <div className="text-left p-1">
          <div className="flex items-center gap-1.5 font-bold text-xs text-rose-700">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            AUTO ESCALATION
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Re-route to frontier model
          </p>
        </div>
      ),
    },
    style: {
      background: "#FFFFFF",
      border: "2px solid #FDA4AF",
      borderRadius: "10px",
      boxShadow: "0 2px 8px -2px rgba(225, 29, 72, 0.15)",
      width: 175,
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    style: { stroke: "#3B82F6", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#3B82F6" },
  },
  {
    id: "e2-3",
    source: "2",
    target: "3",
    animated: true,
    style: { stroke: "#6366F1", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#6366F1" },
  },
  {
    id: "e3-4",
    source: "3",
    target: "4",
    animated: true,
    style: { stroke: "#8B5CF6", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#8B5CF6" },
  },
  {
    id: "e4-5",
    source: "4",
    target: "5",
    animated: true,
    style: { stroke: "#06B6D4", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#06B6D4" },
  },
  {
    id: "e5-6",
    source: "5",
    target: "6",
    animated: true,
    style: { stroke: "#10B981", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#10B981" },
  },
  {
    id: "e6-7",
    source: "6",
    target: "7",
    animated: true,
    label: "Quality < Threshold",
    labelStyle: { fontSize: 10, fill: "#E11D48", fontWeight: 600 },
    labelBgStyle: { fill: "#FFF1F2", fillOpacity: 0.9 },
    style: { stroke: "#F43F5E", strokeWidth: 2, strokeDasharray: "4 4" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#F43F5E" },
  },
  {
    id: "e7-3",
    source: "7",
    target: "3",
    animated: true,
    label: "Escalate to Higher Tier",
    labelStyle: { fontSize: 10, fill: "#7C3AED", fontWeight: 600 },
    labelBgStyle: { fill: "#F5F3FF", fillOpacity: 0.9 },
    style: { stroke: "#7C3AED", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#7C3AED" },
  },
];

const nodeTypes = {};
const edgeTypes = {};

export function Routing() {
  const [routingData, setRoutingData] = useState<RoutingAnalyticsEntry[]>([]);
  const [escalationData, setEscalationData] = useState<EscalationAnalytics | null>(null);
  const [config, setConfig] = useState<RoutingConfig | null>(null);
  const [configDraft, setConfigDraft] = useState<RoutingConfig | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [configLoading, setConfigLoading] = useState(true);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const simpleMinId = useId();
  const moderateMinId = useId();
  const complexMinId = useId();
  const qualityThresholdId = useId();
  const enableEscalationId = useId();

  const fetchData = async () => {
    try {
      const [routingRes, escalationRes] = await Promise.all([
        api.get<RoutingAnalyticsEntry[]>("/analytics/routing"),
        api.get<EscalationAnalytics>("/analytics/escalation"),
      ]);
      setError("");
      setRoutingData(routingRes.data);
      setEscalationData(escalationRes.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to load routing analytics."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setConfigLoading(true);
    void fetchData();
    void fetchConfig();
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    void fetchData();
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get<RoutingConfig>("/routing-config");
      setConfig(res.data);
      setConfigDraft(res.data);
    } catch {
      // Config unavailable
    } finally {
      setConfigLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => void fetchData());
    queueMicrotask(() => void fetchConfig());
  }, []);

  // Validation
  const configIsValid = useMemo(() => {
    if (!configDraft) return false;
    const {
      simple_min_tier,
      moderate_min_tier,
      complex_min_tier,
      quality_threshold,
    } = configDraft;
    return (
      Number.isInteger(simple_min_tier) &&
      Number.isInteger(moderate_min_tier) &&
      Number.isInteger(complex_min_tier) &&
      simple_min_tier >= 1 &&
      simple_min_tier <= moderate_min_tier &&
      moderate_min_tier <= complex_min_tier &&
      Number.isFinite(quality_threshold) &&
      quality_threshold >= 0 &&
      quality_threshold <= 1
    );
  }, [configDraft]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configDraft || !configIsValid) return;

    setConfigSaving(true);
    setConfigMessage(null);

    try {
      const res = await api.put<RoutingConfig>("/routing-config", configDraft);
      setConfig(res.data);
      setConfigDraft(res.data);
      setConfigMessage({
        type: "success",
        text: "Routing configuration saved successfully.",
      });
      setTimeout(() => setConfigMessage(null), 4000);
    } catch {
      setConfigMessage({
        type: "error",
        text: "Unable to save configuration. Please verify your settings.",
      });
    } finally {
      setConfigSaving(false);
    }
  };

  // Aggregated analytics metrics
  const totalRoutedRequests = useMemo(() => {
    return routingData.reduce((sum, item) => sum + item.requests, 0);
  }, [routingData]);

  const providerBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    routingData.forEach((item) => {
      const count = map.get(item.provider) || 0;
      map.set(item.provider, count + item.requests);
    });
    return Array.from(map.entries()).map(([provider, requests]) => ({
      name: provider,
      value: requests,
      color: getProviderColor(provider),
    }));
  }, [routingData]);

  const complexityBarData = useMemo(() => {
    const map = new Map<string, { complexity: string; [provider: string]: string | number }>();
    routingData.forEach((item) => {
      const comp = item.complexity.charAt(0).toUpperCase() + item.complexity.slice(1);
      if (!map.has(comp)) {
        map.set(comp, { complexity: comp });
      }
      const record = map.get(comp)!;
      record[item.provider] = item.requests;
    });
    return Array.from(map.values());
  }, [routingData]);

  const uniqueProviders = useMemo(() => {
    const set = new Set<string>();
    routingData.forEach((item) => set.add(item.provider));
    return Array.from(set);
  }, [routingData]);

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

      {error && <ErrorState message={error} onRetry={handleRetry} />}

      {/* SECTION 1: ROUTING FLOW DIAGRAM */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-slate-900">
            Routing Flow Architecture
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            End-to-end request lifecycle: classification, minimum tier routing, quality verification, and automatic escalation.
          </p>
        </div>

        {/* Responsive ReactFlow Canvas */}
        <div className="h-[280px] w-full rounded-lg border border-slate-200/80 bg-slate-50/40 overflow-hidden">
          <ReactFlow
            nodes={initialNodes}
            edges={initialEdges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.15 }}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={false}
            zoomOnScroll={false}
            panOnScroll={false}
            preventScrolling={false}
          >
            <Background color="#CBD5E1" gap={16} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>
      </div>

      {/* SECTION 2: COMPLEXITY ROUTING TIERS */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Complexity Routing Rules
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Simple */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-100/60 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Simple Prompts
              </span>
              <span className="font-mono text-xs font-bold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded">
                Tier 1+
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Standard Q&A, definitions, grammar fixes, text summarization, and direct factual lookups.
            </p>
            <div className="mt-4 pt-3 border-t border-emerald-100 flex items-center justify-between text-[11px] text-emerald-900 font-medium">
              <span>Target: Ollama / Local Models</span>
              <span>Ultra-low cost</span>
            </div>
          </div>

          {/* Moderate */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/30 p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-100/60 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Moderate Prompts
              </span>
              <span className="font-mono text-xs font-bold text-amber-800 bg-white border border-amber-200 px-2 py-0.5 rounded">
                Tier 2+
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Coding snippets, data transformation, multi-paragraph content, translation, and structured reasoning.
            </p>
            <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-900 font-medium">
              <span>Target: Gemini Flash / Balanced</span>
              <span>Optimal price-perf</span>
            </div>
          </div>

          {/* Complex */}
          <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-100/60 px-2.5 py-0.5 text-xs font-semibold text-purple-800">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                Complex Prompts
              </span>
              <span className="font-mono text-xs font-bold text-purple-800 bg-white border border-purple-200 px-2 py-0.5 rounded">
                Tier 3
              </span>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Architectural decisions, heavy logic, mathematical derivations, complex refactoring, and multi-turn workflows.
            </p>
            <div className="mt-4 pt-3 border-t border-purple-100 flex items-center justify-between text-[11px] text-purple-900 font-medium">
              <span>Target: Claude / Frontier Models</span>
              <span>Maximum capability</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: ROUTING ANALYTICS */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Routing Analytics
        </h2>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Requests Routed"
            value={totalRoutedRequests}
            icon={Layers}
            subtitle="Categorized & dispatched"
          />
          <MetricCard
            label="Escalation Rate"
            value={
              escalationData ? `${escalationData.escalation_rate.toFixed(1)}%` : "0.0%"
            }
            icon={AlertTriangle}
            badge={{
              text: `${escalationData?.escalated_requests || 0} escalated`,
              variant: (escalationData?.escalated_requests || 0) > 0 ? "warning" : "positive",
            }}
            subtitle="Quality triggered upgrades"
          />
          <MetricCard
            label="Direct Delivery"
            value={
              escalationData
                ? `${(
                    100 - escalationData.escalation_rate
                  ).toFixed(1)}%`
                : "100%"
            }
            icon={CheckCircle2}
            subtitle="Resolved on first attempt"
          />
          <MetricCard
            label="Active Providers"
            value={providerBreakdown.length}
            icon={Cpu}
            subtitle="Dynamic target endpoints"
          />
        </div>

        {/* Charts: Complexity by Provider & Provider Distribution */}
        {routingData.length > 0 && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Complexity & Provider Distribution */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="text-sm font-semibold text-slate-900">
                Routing by Complexity & Provider
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Volume of requests handled per complexity tier.
              </p>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={complexityBarData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="complexity"
                      tick={{ fill: "#64748B", fontSize: 12 }}
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
                    <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                    {uniqueProviders.map((provider) => (
                      <Bar
                        key={provider}
                        dataKey={provider}
                        name={provider.charAt(0).toUpperCase() + provider.slice(1)}
                        fill={getProviderColor(provider)}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Provider Share */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
              <h3 className="text-sm font-semibold text-slate-900">
                Provider Share
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proportion of total routed requests per provider.
              </p>
              <div className="mt-4 h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={providerBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {providerBreakdown.map((entry) => (
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
                        <span className="capitalize text-slate-700 text-xs">
                          {val}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: ROUTING CONFIGURATION PANEL */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Routing Configuration
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tune minimum quality tiers per complexity and set verification escalation threshold.
            </p>
          </div>
        </div>

        {configLoading ? (
          <LoadingState message="Loading routing parameters..." rows={2} />
        ) : configDraft ? (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              {/* Simple Min Tier */}
              <div className="space-y-1.5">
                <label
                  htmlFor={simpleMinId}
                  className="text-xs font-medium text-slate-700 block"
                >
                  Simple Minimum Tier
                </label>
                <select
                  id={simpleMinId}
                  value={configDraft.simple_min_tier}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      simple_min_tier: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value={1}>Tier 1 (e.g. Local / Ollama)</option>
                  <option value={2}>Tier 2 (e.g. Balanced / Gemini)</option>
                  <option value={3}>Tier 3 (e.g. Frontier / Claude)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Minimum tier required for simple requests.
                </p>
              </div>

              {/* Moderate Min Tier */}
              <div className="space-y-1.5">
                <label
                  htmlFor={moderateMinId}
                  className="text-xs font-medium text-slate-700 block"
                >
                  Moderate Minimum Tier
                </label>
                <select
                  id={moderateMinId}
                  value={configDraft.moderate_min_tier}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      moderate_min_tier: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value={1}>Tier 1</option>
                  <option value={2}>Tier 2 (Standard)</option>
                  <option value={3}>Tier 3</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Must be ≥ Simple tier.
                </p>
              </div>

              {/* Complex Min Tier */}
              <div className="space-y-1.5">
                <label
                  htmlFor={complexMinId}
                  className="text-xs font-medium text-slate-700 block"
                >
                  Complex Minimum Tier
                </label>
                <select
                  id={complexMinId}
                  value={configDraft.complex_min_tier}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      complex_min_tier: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value={1}>Tier 1</option>
                  <option value={2}>Tier 2</option>
                  <option value={3}>Tier 3 (Frontier Models)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Must be ≥ Moderate tier.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 pt-2 border-t border-slate-100">
              {/* Quality Threshold */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor={qualityThresholdId}
                    className="text-xs font-medium text-slate-700"
                  >
                    Quality Threshold
                  </label>
                  <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                    {(configDraft.quality_threshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  id={qualityThresholdId}
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={configDraft.quality_threshold}
                  onChange={(e) =>
                    setConfigDraft({
                      ...configDraft,
                      quality_threshold: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Responses scoring below this threshold will automatically trigger model escalation.
                </p>
              </div>

              {/* Enable Escalation Toggle */}
              <div className="space-y-2">
                <label
                  htmlFor={enableEscalationId}
                  className="text-xs font-medium text-slate-700 block"
                >
                  Automatic Escalation
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 cursor-pointer hover:bg-slate-50 transition">
                  <input
                    id={enableEscalationId}
                    type="checkbox"
                    checked={configDraft.enable_escalation}
                    onChange={(e) =>
                      setConfigDraft({
                        ...configDraft,
                        enable_escalation: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">
                      Enable Auto-Escalation
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      When verification fails, immediately retry using next quality tier.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Validation Message */}
            {!configIsValid && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                Invalid configuration: Simple Tier must be ≤ Moderate Tier ≤ Complex Tier, and quality threshold must be between 0 and 1.
              </div>
            )}

            {/* Feedback Message */}
            {configMessage && (
              <div
                className={`rounded-lg border p-3 text-xs font-medium flex items-center gap-2 ${
                  configMessage.type === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
              >
                {configMessage.type === "success" ? (
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span>{configMessage.text}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={!configIsValid || configSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
              >
                {configSaving ? "Saving..." : "Save Configuration"}
              </button>

              {config && (
                <button
                  type="button"
                  onClick={() => {
                    setConfigDraft(config);
                    setConfigMessage(null);
                  }}
                  disabled={configSaving}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                >
                  Reset Changes
                </button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-xs text-slate-500">
            Routing configuration unavailable from backend.
          </p>
        )}
      </div>
    </div>
  );
}
