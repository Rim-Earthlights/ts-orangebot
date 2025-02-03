
/**
 * OpenAIのセッション情報レスポンス
 */
export type OpenAISessionResponse = {
  id: string,
  object: string,
  model: string,
  modalities: string[],
  instructions: string,
  voice: string,
  input_audio_format: string,
  output_audio_format: string,
  input_audio_transcription: {
    model: string
  },
  turn_detection: any,
  tools: any[],
  tool_choice: string,
  temperature: number,
  max_response_output_tokens: number,
  client_secret: {
    value: string,
    expires_at: number
  }
}

export type ModelResponse = {
  data: {
    model_name: string;
    litellm_params: {
      custom_llm_provider: string;
      model: string;
    },
    model_info: {
      id: string;
      db_model: boolean;
      key: string;
      max_tokens: number | null;
      max_input_tokens: number | null;
      max_output_tokens: number | null;
      input_cost_per_token: number | null;
      cache_creation_input_token_cost: number | null;
      cache_read_input_token_cost: number | null;
      input_cost_per_character: number | null;
      input_cost_per_token_above_128k_tokens: number | null;
      input_cost_per_query: number | null;
      input_cost_per_second: number | null;
      input_cost_per_audio_token: number | null;
      output_cost_per_token: number;
      output_cost_per_audio_token: number | null;
      output_cost_per_character: number | null;
      output_cost_per_token_above_128k_tokens: number | null;
      output_cost_per_character_above_128k_tokens: number | null;
      output_cost_per_second: number | null;
      output_cost_per_image: number | null;
      output_vector_size: number | null;
      litellm_provider: string;
      mode: string;
      supports_system_messages: boolean;
      supports_response_schema: boolean;
      supports_vision: boolean;
      supports_function_calling: boolean;
      supports_assistant_prefill: boolean;
      supports_prompt_caching: boolean;
      supports_audio_input: boolean;
      supports_audio_output: boolean;
      supports_pdf_input: boolean;
      supports_embedding_image_input: boolean;
      supports_native_streaming: boolean | null;
      tpm: number | null;
      rpm: number | null;
      supported_openai_params: string[];
    },
  }[],
}