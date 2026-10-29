import { useEffect, useState, useMemo } from "react";
import {
  RefreshCw,
  Search,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
} from "lucide-react";
import api, { getApiErrorMessage } from "../services/api";
import type { RequestRecord } from "../types/api";
import { MetricCard } from "../components/MetricCard";
import {
  ComplexityBadge,
  StatusBadge,
  ProviderBadge,
} from "../components/StatusBadge";
import { DetailDrawer } from "../components/DetailDrawer";
import { ExecutionTrace } from "../components/ExecutionTrace";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

function formatLatency(ms: number): string {
  if (ms == null || isNaN(ms)) return "—";
  if (ms < 1000) return `${ms.toFixed(0)} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatCost(cost: number): string {
  if (cost == null || isNaN(cost)) return "—";
  return `$${cost.toFixed(6)}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
  } catch {
    return dateStr;
  }
}

export function Requests() {
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [complexityFilter, setComplexityFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Detail drawer
  const [selectedRequest, setSelectedRequest] = useState<RequestRecord | null>(
    null,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const fetchRequests = async () => {
    try {
      const response = await api.get<RequestRecord[]>("/requests");
      setError("");
      setRequests(response.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "Unable to load request history."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchRequests();
  };

  const handleRetry = () => {
    setLoading(true);
    setError("");
    void fetchRequests();
  };

  useEffect(() => {
    queueMicrotask(() => void fetchRequests());
  }, []);

  // Compute summary stats from actual loaded data
  const summary = useMemo(() => {
    const total = requests.length;
    let successful = 0;
    let failed = 0;
    let escalated = 0;

    requests.forEach((req) => {
      const statusNorm = req.verification_status?.toLowerCase();
      if (statusNorm === "failed") {
        failed++;
      } else {
        successful++;
      }

      if (req.escalated || req.quality_escalated) {
        escalated++;
      }
    });

    return { total, successful, failed, escalated };
  }, [requests]);

  // Unique providers dynamically extracted from loaded data
  const dynamicProviders = useMemo(() => {
    const provs = new Set<string>();
    requests.forEach((r) => {
      if (r.provider) provs.add(r.provider.toLowerCase());
    });
    return Array.from(provs).sort();
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      // Search filter: ID, prompt, model, provider
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesId = req.request_id?.toLowerCase().includes(query);
        const matchesPrompt = req.prompt?.toLowerCase().includes(query);
        const matchesModel = req.model?.toLowerCase().includes(query);
        const matchesProvider = req.provider?.toLowerCase().includes(query);
        if (!matchesId && !matchesPrompt && !matchesModel && !matchesProvider) {
          return false;
        }
      }

      // Complexity filter
      if (
        complexityFilter !== "all" &&
        req.complexity?.toLowerCase() !== complexityFilter.toLowerCase()
      ) {
        return false;
      }

      // Provider filter
      if (
        providerFilter !== "all" &&
        req.provider?.toLowerCase() !== providerFilter.toLowerCase()
      ) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        const statusNorm = req.verification_status?.toLowerCase();
        const isEsc = req.escalated || req.quality_escalated;
        const isFall = req.fallback_used;

        if (statusFilter === "passed" && statusNorm !== "passed") return false;
        if (statusFilter === "failed" && statusNorm !== "failed") return false;
        if (statusFilter === "escalated" && !isEsc) return false;
        if (statusFilter === "fallback" && !isFall) return false;
      }

      return true;
    });
  }, [requests, search, complexityFilter, providerFilter, statusFilter]);

  const handleRowClick = async (req: RequestRecord) => {
    setSelectedRequest(req);
    setIsDrawerOpen(true);
    // Optionally fetch full record if needed, but req already contains all fields
    try {
      const res = await api.get<RequestRecord>(`/requests/${req.request_id}`);
      if (res.data) {
        setSelectedRequest(res.data);
      }
    } catch {
      // Keep existing req data if single fetch fails
    }
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleClearFilters = () => {
    setSearch("");
    setComplexityFilter("all");
    setProviderFilter("all");
    setStatusFilter("all");
  };

  const hasActiveFilters =
    Boolean(search) ||
    complexityFilter !== "all" ||
    providerFilter !== "all" ||
    statusFilter !== "all";

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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard
          label="Total Requests"
          value={summary.total}
          icon={Database}
          subtitle="All processed queries"
        />
        <MetricCard
          label="Successful"
          value={summary.successful}
          icon={CheckCircle2}
          badge={{
            text: `${summary.total > 0 ? ((summary.successful / summary.total) * 100).toFixed(0) : 0}%`,
            variant: "positive",
          }}
          subtitle="Passed verification"
        />
        <MetricCard
          label="Failed"
          value={summary.failed}
          icon={XCircle}
          badge={{
            text: `${summary.total > 0 ? ((summary.failed / summary.total) * 100).toFixed(0) : 0}%`,
            variant: summary.failed > 0 ? "negative" : "neutral",
          }}
          subtitle="Verification failures"
        />
        <MetricCard
          label="Escalated"
          value={summary.escalated}
          icon={AlertTriangle}
          badge={{
            text: `${summary.total > 0 ? ((summary.escalated / summary.total) * 100).toFixed(0) : 0}%`,
            variant: summary.escalated > 0 ? "warning" : "neutral",
          }}
          subtitle="Model auto-upgrades"
        />
      </div>

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search requests by prompt, ID, or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Complexity Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <label htmlFor="filter-complexity" className="font-medium">
                Complexity:
              </label>
              <select
                id="filter-complexity"
                value={complexityFilter}
                onChange={(e) => setComplexityFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
              </select>
            </div>

            {/* Provider Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <label htmlFor="filter-provider" className="font-medium">
                Provider:
              </label>
              <select
                id="filter-provider"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 capitalize focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All</option>
                {dynamicProviders.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <label htmlFor="filter-status" className="font-medium">
                Status:
              </label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="escalated">Escalated</option>
                <option value="fallback">Fallback</option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && <ErrorState message={error} onRetry={handleRetry} />}

      {/* Loading state */}
      {loading && <LoadingState message="Loading requests..." rows={5} />}

      {/* Empty State */}
      {!loading && !error && requests.length === 0 && (
        <EmptyState
          title="No requests yet"
          description="Start by running a prompt in the Playground to see intelligent routing in action."
          actionText="Open Playground"
          actionHref="/playground"
        />
      )}

      {/* No Search Results */}
      {!loading &&
        !error &&
        requests.length > 0 &&
        filteredRequests.length === 0 && (
          <EmptyState
            title="No matching requests"
            description="Try changing your search terms or clearing your active filters."
            actionText="Clear Filters"
            onAction={handleClearFilters}
          />
        )}

      {/* Table */}
      {!loading && !error && filteredRequests.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Request</th>
                  <th className="px-4 py-3.5">Complexity</th>
                  <th className="px-4 py-3.5">Provider</th>
                  <th className="px-4 py-3.5">Model</th>
                  <th className="px-4 py-3.5">Cost</th>
                  <th className="px-4 py-3.5">Latency</th>
                  <th className="px-4 py-3.5">Quality</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredRequests.map((req) => {
                  const shortId = req.request_id
                    ? req.request_id.slice(0, 8)
                    : "—";
                  const isEscalated = Boolean(
                    req.escalated || req.quality_escalated,
                  );
                  const isFallback = Boolean(req.fallback_used);
                  const displayStatus = isEscalated
                    ? "escalated"
                    : isFallback
                    ? "fallback"
                    : req.verification_status || "passed";

                  return (
                    <tr
                      key={req.request_id}
                      onClick={() => handleRowClick(req)}
                      className="hover:bg-slate-50/80 cursor-pointer transition"
                    >
                      {/* Request ID + prompt preview */}
                      <td className="px-4 py-3 max-w-[280px]">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono font-medium text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {shortId}
                          </span>
                        </div>
                        <p className="truncate text-slate-600 font-normal">
                          {req.prompt}
                        </p>
                      </td>

                      {/* Complexity */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ComplexityBadge
                          complexity={req.complexity}
                          size="sm"
                        />
                      </td>

                      {/* Provider */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ProviderBadge provider={req.provider} />
                      </td>

                      {/* Model */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                        {req.model}
                      </td>

                      {/* Cost */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-900">
                        {formatCost(req.actual_cost)}
                      </td>

                      {/* Latency */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {formatLatency(req.latency_ms)}
                      </td>

                      {/* Quality */}
                      <td className="px-4 py-3 whitespace-nowrap font-medium">
                        {req.quality_score !== null ? (
                          <span
                            className={
                              req.quality_score >= 0.8
                                ? "text-emerald-700"
                                : req.quality_score >= 0.6
                                ? "text-amber-700"
                                : "text-rose-700"
                            }
                          >
                            {(req.quality_score * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge status={displayStatus} size="sm" />
                      </td>

                      {/* Time */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-400 text-[11px]">
                        {formatDate(req.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500 flex items-center justify-between">
            <span>
              Showing {filteredRequests.length} of {requests.length} requests
            </span>
            <span className="text-slate-400">Click any row to inspect execution trace</span>
          </div>
        </div>
      )}

      {/* Request Detail Drawer */}
      <DetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Request Details"
        subtitle={selectedRequest?.request_id}
        badge={
          selectedRequest && (
            <StatusBadge
              status={
                selectedRequest.escalated || selectedRequest.quality_escalated
                  ? "escalated"
                  : selectedRequest.fallback_used
                  ? "fallback"
                  : selectedRequest.verification_status || "passed"
              }
              size="sm"
            />
          )
        }
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* ID & Timestamp */}
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/60 p-3 text-xs">
              <div>
                <span className="text-slate-400">Request ID:</span>
                <span className="ml-2 font-mono font-medium text-slate-800">
                  {selectedRequest.request_id}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyId(selectedRequest.request_id)}
                className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 border border-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              >
                {copiedId ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-[11px] text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* Prompt & Response */}
            <div className="space-y-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  User Prompt
                </h3>
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-800 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-sans">
                  {selectedRequest.prompt}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
                  Model Response
                </h3>
                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5 text-xs text-slate-800 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap font-sans">
                  {selectedRequest.output || (
                    <span className="italic text-slate-400">
                      No response text captured.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Execution Trace */}
            <div className="border-t border-slate-200 pt-5">
              <ExecutionTrace request={selectedRequest} />
            </div>

            {/* Complexity & Routing Details */}
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Routing & Complexity Classification
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="text-slate-400 block text-[11px]">
                    Complexity Tier
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <ComplexityBadge
                      complexity={selectedRequest.complexity}
                      size="sm"
                    />
                    <span className="text-slate-500 font-mono text-[11px]">
                      Required Tier {selectedRequest.required_tier}
                    </span>
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="text-slate-400 block text-[11px]">
                    Classification Confidence
                  </span>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {(selectedRequest.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3 col-span-2">
                  <span className="text-slate-400 block text-[11px]">
                    Model Selection Pathway
                  </span>
                  <div className="mt-1.5 flex items-center gap-2 text-xs">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                      {selectedRequest.primary_model || selectedRequest.initial_model || selectedRequest.model}
                    </span>
                    {(selectedRequest.escalated || selectedRequest.quality_escalated || selectedRequest.fallback_used) && (
                      <>
                        <ArrowRight className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                        <span className="font-mono bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-semibold">
                          {selectedRequest.final_model || selectedRequest.model}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Performance & Token Economics */}
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Performance & Cost Breakdown
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <span className="text-slate-400 block text-[11px]">
                    Latency
                  </span>
                  <span className="mt-1 block font-semibold text-slate-900">
                    {formatLatency(selectedRequest.latency_ms)}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <span className="text-slate-400 block text-[11px]">
                    Actual Cost
                  </span>
                  <span className="mt-1 block font-mono font-semibold text-slate-900">
                    {formatCost(selectedRequest.actual_cost)}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <span className="text-slate-400 block text-[11px]">
                    Baseline Cost
                  </span>
                  <span className="mt-1 block font-mono text-slate-500">
                    {formatCost(selectedRequest.baseline_cost)}
                  </span>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <span className="text-slate-400 block text-[11px]">
                    Tokens
                  </span>
                  <span className="mt-1 block font-mono text-slate-800">
                    {(selectedRequest.input_tokens || 0) + (selectedRequest.output_tokens || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Verification */}
            <div className="border-t border-slate-200 pt-5 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Quality Verification
              </h3>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="text-slate-400 block text-[11px]">
                    Score
                  </span>
                  <p className="mt-1 text-base font-bold text-slate-900">
                    {selectedRequest.quality_score !== null
                      ? `${(selectedRequest.quality_score * 100).toFixed(0)}%`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="text-slate-400 block text-[11px]">
                    Status
                  </span>
                  <div className="mt-1">
                    <StatusBadge
                      status={selectedRequest.verification_status || "passed"}
                      size="sm"
                    />
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="text-slate-400 block text-[11px]">
                    Method
                  </span>
                  <p className="mt-1 font-medium capitalize text-slate-800">
                    {selectedRequest.verification_method || "Heuristic"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
