import { createServerFn } from "@tanstack/react-start";
import { TypeSafeClient } from "@typesafe-ai/sdk";
import type { SystemOneRequest, SystemOneResult } from "@typesafe-ai/sdk";

export interface EvaluateJevInput {
  apiKey?: string;
  baseURL?: string;
  payload: SystemOneRequest;
}

export interface EvaluateJevResponse {
  success: boolean;
  result?: SystemOneResult<any>;
  latencyMs?: number;
  error?: string;
}

export const evaluateWithJev = createServerFn({ method: "POST" })
  .validator((data: unknown): EvaluateJevInput => {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid request data");
    }
    const d = data as Record<string, unknown>;
    return {
      apiKey: typeof d.apiKey === "string" ? d.apiKey : undefined,
      baseURL: typeof d.baseURL === "string" ? d.baseURL : undefined,
      payload: d.payload as SystemOneRequest,
    };
  })
  .handler(async ({ data }): Promise<EvaluateJevResponse> => {
    const { apiKey, baseURL, payload } = data;

    const resolvedApiKey = apiKey?.trim() || process.env.TYPESAFE_API_KEY;
    if (!resolvedApiKey) {
      return {
        success: false,
        error:
          "No API key provided. Please input your TypeSafe API key in the configuration header or set the TYPESAFE_API_KEY environment variable.",
      };
    }

    let resolvedBaseURL =
      baseURL?.trim() ||
      process.env.TYPESAFE_BASE_URL ||
      "https://api.typesafe.ai";

    // If endpoint is passed with /v1/systemone, strip it so TypeSafeClient's path concatenation doesn't duplicate it
    resolvedBaseURL = resolvedBaseURL.replace(/\/v1\/systemone\/?$/, "");

    const startTime = Date.now();

    try {
      // Use the TypeSafe SDK client on the server
      const client = new TypeSafeClient({
        apiKey: resolvedApiKey,
        baseURL: resolvedBaseURL,
        defaultModel: payload.model || "jev-latest",
      });

      const result = await client.systemOne(payload);
      const latencyMs = Date.now() - startTime;

      return {
        success: true,
        result,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - startTime;
      const errorMsg =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null
            ? JSON.stringify(err)
            : String(err);

      return {
        success: false,
        error: errorMsg,
        latencyMs,
      };
    }
  });
