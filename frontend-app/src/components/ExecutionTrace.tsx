import {
  CheckCircle2,
  AlertCircle,
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  Clock,
  Coins,
} from "lucide-react";
import type { RequestRecord } from "../types/api";

interface ExecutionTraceProps {
  request: RequestRecord;
}

export function ExecutionTrace({ request }: ExecutionTraceProps) {
  const isEscalated = Boolean(request.escalated || request.quality_escalated);
  const isFallback = Boolean(request.fallback_used);
  const isPassed = request.verification_status?.toLowerCase() === "passed";
  const isFailed = request.verification_status?.toLowerCase() === "failed";

  const steps = [
    {
      id: "request",
      title: "Request Received",
      icon: Layers,
      color: "bg-blue-50 text-blue-700 border-blue-200",
      iconColor: "text-blue-600 bg-blue-100",
      content: (
        <div className="text-xs text-slate-600">
          <p className="font-mono text-slate-500">ID: {request.request_id}</p>
          <p className="mt-1 line-clamp-2 italic text-slate-700 bg-slate-50 p-2 rounded-md border border-slate-100">
            "{request.prompt}"
          </p>
        </div>
      ),
    },
    {
      id: "complexity",
      title: "Complexity Classifier",
      icon: Cpu,
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      iconColor: "text-indigo-600 bg-indigo-100",
      content: (
        <div className="flex items-center gap-3 text-xs">
          <div>
            <span className="text-slate-400">Classification:</span>{" "}
            <span className="font-semibold capitalize text-slate-800">
              {request.complexity}
            </span>
          </div>
          <div>
            <span className="text-slate-400">Confidence:</span>{" "}
            <span className="font-semibold text-slate-800">
              {(request.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div>
            <span className="text-slate-400">Required Tier:</span>{" "}
            <span className="font-semibold text-slate-800">
              Tier {request.required_tier}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: "routing",
      title: "Cost-Aware Router",
      icon: Sparkles,
      color: "bg-purple-50 text-purple-700 border-purple-200",
      iconColor: "text-purple-600 bg-purple-100",
      content: (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Selected Provider:</span>
            <span className="font-medium capitalize text-slate-800">
              {request.provider}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-slate-700">{request.model}</span>
          </div>
          {request.routing_reason && (
            <p className="text-slate-500 text-[11px]">
              Reason: {request.routing_reason}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "generation",
      title: "LLM Generation",
      icon: Clock,
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconColor: "text-emerald-600 bg-emerald-100",
      content: (
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Latency:{" "}
              <strong className="text-slate-800">
                {(request.latency_ms / 1000).toFixed(2)} s
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Coins className="h-3.5 w-3.5 text-slate-400" />
            <span>
              Cost:{" "}
              <strong className="text-slate-800">
                ${request.actual_cost.toFixed(6)}
              </strong>
            </span>
          </div>
          <div className="text-slate-500 col-span-2 text-[11px]">
            Tokens: {request.input_tokens || 0} in / {request.output_tokens || 0}{" "}
            out ({(request.input_tokens || 0) + (request.output_tokens || 0)}{" "}
            total)
          </div>
        </div>
      ),
    },
    {
      id: "quality",
      title: "Quality Verification",
      icon: ShieldCheck,
      color: isPassed
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : isFailed
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-amber-50 text-amber-700 border-amber-200",
      iconColor: isPassed
        ? "text-emerald-600 bg-emerald-100"
        : isFailed
        ? "text-rose-600 bg-rose-100"
        : "text-amber-600 bg-amber-100",
      content: (
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Status:</span>
            <span
              className={`font-semibold capitalize ${
                isPassed
                  ? "text-emerald-700"
                  : isFailed
                  ? "text-rose-700"
                  : "text-slate-700"
              }`}
            >
              {request.verification_status}
            </span>
            {request.quality_score !== null && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-400">Score:</span>
                <span className="font-semibold text-slate-800">
                  {(request.quality_score * 100).toFixed(0)}%
                </span>
              </>
            )}
          </div>
          {request.verification_method && (
            <p className="text-slate-500 text-[11px]">
              Method: {request.verification_method}
            </p>
          )}
        </div>
      ),
    },
    {
      id: "escalation",
      title: "Escalation & Final Outcome",
      icon: ArrowUpRight,
      color: isEscalated
        ? "bg-purple-50 text-purple-700 border-purple-200"
        : isFallback
        ? "bg-orange-50 text-orange-700 border-orange-200"
        : "bg-slate-50 text-slate-700 border-slate-200",
      iconColor: isEscalated
        ? "text-purple-600 bg-purple-100"
        : isFallback
        ? "text-orange-600 bg-orange-100"
        : "text-slate-500 bg-slate-100",
      content: (
        <div className="text-xs space-y-1">
          {isEscalated ? (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-purple-700">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Automatic Escalation Triggered</span>
              </div>
              <p className="text-slate-600 text-[11px]">
                Upgraded from{" "}
                <strong className="font-mono">
                  {request.initial_model || request.model}
                </strong>{" "}
                to{" "}
                <strong className="font-mono">
                  {request.final_model || request.model}
                </strong>
              </p>
              {request.escalation_reason && (
                <p className="text-slate-500 text-[11px]">
                  Reason: {request.escalation_reason}
                </p>
              )}
            </div>
          ) : isFallback ? (
            <div className="space-y-1">
              <span className="font-medium text-orange-700">
                Provider Fallback Used
              </span>
              {request.fallback_reason && (
                <p className="text-slate-500 text-[11px]">
                  Reason: {request.fallback_reason}
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Direct execution completed successfully</span>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        Execution Trace
      </h3>
      <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div key={step.id} className="relative">
              {/* Stepper node dot */}
              <div className="absolute -left-6 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white ring-2 ring-slate-200">
                <span className="h-2 w-2 rounded-full bg-indigo-600" />
              </div>

              {/* Step Card */}
              <div className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-md ${step.iconColor}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-900">
                    {step.title}
                  </h4>
                </div>
                {step.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
