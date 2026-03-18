type OpenAIResponse = {
  output_text?: string;
  output?: unknown;
};

export async function openaiJson<T>(params: {
  model: string;
  system: string;
  user: unknown[];
  jsonSchema: unknown;
}): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が未設定です");
  }

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      input: [
        { role: "system", content: [{ type: "input_text", text: params.system }] },
        { role: "user", content: params.user },
      ],
      response_format: {
        type: "json_schema",
        json_schema: params.jsonSchema,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }

  const json = (await res.json()) as OpenAIResponse;
  // Responses API は output_text に JSON 文字列が入ることが多い
  const raw = json.output_text;
  if (!raw) {
    // 何らかの理由で output_text が空なら丸ごと返す
    return json as unknown as T;
  }
  return JSON.parse(raw) as T;
}

export async function openaiText(params: { model: string; system: string; userText: string }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY が未設定です");
  }
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      input: [
        { role: "system", content: [{ type: "input_text", text: params.system }] },
        { role: "user", content: [{ type: "input_text", text: params.userText }] },
      ],
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI API error: ${res.status} ${text}`);
  }
  const json = (await res.json()) as OpenAIResponse;
  return (json.output_text ?? "").trim();
}

