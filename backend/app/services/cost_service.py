from app.core.model_registry import ModelConfig, get_benchmark_model


class CostService:

    def calculate_cost(
        self,
        model: ModelConfig,
        input_tokens: int,
        output_tokens: int,
    ) -> float:

        input_cost = (
            input_tokens / 1000
        ) * model.input_cost_per_1k_tokens

        output_cost = (
            output_tokens / 1000
        ) * model.output_cost_per_1k_tokens

        return round(
            input_cost + output_cost,
            8,
        )

    def estimate_cost(
        self,
        model: ModelConfig,
        estimated_input_tokens: int,
        estimated_output_tokens: int,
    ) -> float:
        return self.calculate_baseline_cost(
            model=model,
            input_tokens=estimated_input_tokens,
            output_tokens=estimated_output_tokens,
        )

    def calculate_baseline_cost(
        self,
        model: ModelConfig,
        input_tokens: int,
        output_tokens: int,
    ) -> float:

        return self.calculate_cost(
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )

    def calculate_benchmark_cost(
        self,
        input_tokens: int,
        output_tokens: int,
    ) -> float:
        benchmark_model = get_benchmark_model()
        return self.calculate_cost(
            model=benchmark_model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
        )


cost_service = CostService()