
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
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }[],
}