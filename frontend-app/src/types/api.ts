export interface StatsResponse {
  total_requests: number;
  total_actual_cost: number;
  total_estimated_cost: number;
  total_baseline_cost: number;
  money_saved: number;
  savings_percentage: number;
  average_latency_ms: number;
  average_quality_score: number | null;
  escalation_rate: number;
  simple_requests: number;
  moderate_requests: number;
  complex_requests: number;
  ollama_requests: number;
  gemini_requests: number;
  claude_requests: number;
}

export interface CostAnalyticsEntry {
  provider: string;
  requests: number;
  actual_cost: number;
  estimated_cost: number;
  baseline_cost: number;
  money_saved: number;
  savings_percentage: number;
}

export interface RoutingAnalyticsEntry {
  complexity: string;
  provider: string;
  requests: number;
}

export interface QualityAnalyticsEntry {
  verification_status: string;
  verification_method: string;
  requests: number;
  average_quality: number | null;
}

export interface EscalationAnalytics {
  total_requests: number;
  escalated_requests: number;
  non_escalated_requests: number;
  escalation_rate: number;
}

export interface ModelRecord {
  provider: string;
  model_id: string;
  quality_tier: number;
  input_cost_per_1k_tokens: number;
  output_cost_per_1k_tokens: number;
  average_latency_ms: number;
  enabled: boolean;
}

export interface RoutingConfig {
  simple_min_tier: number;
  moderate_min_tier: number;
  complex_min_tier: number;
  quality_threshold: number;
  enable_escalation: boolean;
}

export interface ClassifierStatus {
  model_type: string;
  training_samples: number;
  test_samples: number;
  accuracy: number;
  classes: string[];
  classification_report?: ClassificationReport | null;
}

export interface ClassifierRetrainResponse
  extends Omit<ClassifierStatus, "classification_report"> {
  status: "retrained";
}

export interface ClassificationMetrics {
  precision: number;
  recall: number;
  "f1-score": number;
  support: number;
}

export type ClassificationReport = Record<
  string,
  ClassificationMetrics | number
>;

export interface QualityDimensions {
  correctness: number;
  relevance: number;
  completeness: number;
  instruction_following: number;
}

export interface QualityVerification {
  quality_score: number;
  verification_status: string;
  verification_method: string;
  dimensions: QualityDimensions;
  reason: string;
}

export interface AttemptedModel {
  provider: string;
  model: string;
  quality_tier: number;
  status: string;
  error_type: string | null;
}

export interface CompletionRouting {
  primary_provider: string;
  primary_model: string;
  final_provider: string;
  final_model: string;
  fallback_used: boolean;
  fallback_reason: string | null;
  quality_escalated: boolean;
  initial_model: string;
  initial_quality_score: number;
  final_quality_score: number;
  escalation_reason: string | null;
  attempted_models: AttemptedModel[];
}

export interface GenerationSettings {
  mode: "automatic" | "manual" | string;
  temperature: number;
  max_tokens: number;
}

export interface CompletionRequest {
  prompt: string;
  generation_mode?: "automatic" | "manual";
  temperature?: number;
  max_tokens?: number;
}

export interface CompletionResponse {
  request_id: string;
  output: string;
  complexity: string;
  confidence: number;
  required_tier: number;
  model: string;
  provider: string;
  quality_tier: number;
  routing_reason: string;
  estimated_cost: number;
  baseline_cost: number;
  actual_cost: number;
  latency_ms: number;
  quality_score: number | null;
  verification_status: string;
  verification_method: string;
  quality: QualityVerification | null;
  routing: CompletionRouting;
  escalated: boolean;
  generation_settings: GenerationSettings;
}

export interface RequestRecord {
  request_id: string;
  prompt: string;
  output: string;
  complexity: string;
  confidence: number;
  required_tier: number;
  provider: string;
  model: string;
  quality_tier: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  baseline_cost: number;
  actual_cost: number;
  latency_ms: number;
  quality_score: number | null;
  verification_status: string;
  verification_method: string;
  primary_provider: string;
  primary_model: string;
  final_provider: string;
  final_model: string;
  fallback_used: boolean;
  fallback_reason: string | null;
  quality_escalated: boolean;
  initial_model: string;
  initial_quality_score: number | null;
  final_quality_score: number | null;
  escalation_reason: string | null;
  escalated: boolean;
  routing_reason: string;
  created_at: string;
}

export interface HealthResponse {
  status: string;
}