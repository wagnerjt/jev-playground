import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ConfigProvider, Layout, Typography, message, Row, Col } from "antd";
import { HeaderConfig } from "../components/HeaderConfig";
import { JsonEditor } from "../components/JsonEditor";
import { QuestionVisualizer } from "../components/QuestionVisualizer";
import { ResponseVisualizer } from "../components/ResponseVisualizer";
import { SAMPLE_PRESETS } from "../services/presets";
import { validateJevPayload } from "../services/validation";
import { evaluateWithJev } from "../server/jev";
import type { SystemOneResult } from "@typesafe-ai/sdk";

const { Content } = Layout;
const { Title, Text } = Typography;

export const Route = createFileRoute("/")({ component: JevWorkbench });

function JevWorkbench() {
  // Configuration held in memory
  const [apiKey, setApiKey] = useState<string>("");
  const [baseUrl, setBaseUrl] = useState<string>("https://api.typesafe.ai");

  // Raw JSON state initialized with the first sample preset (Urgency & Escalation Noul)
  const [rawJson, setRawJson] = useState<string>(SAMPLE_PRESETS[0].json);

  // Evaluation response state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiResult, setApiResult] = useState<SystemOneResult<any> | undefined>(
    undefined,
  );
  const [apiLatency, setApiLatency] = useState<number | undefined>(undefined);
  const [apiError, setApiError] = useState<string | undefined>(undefined);

  // Ant Design message api
  const [messageApi, contextHolder] = message.useMessage();

  // Validate on the fly
  const validation = useMemo(() => {
    return validateJevPayload(rawJson);
  }, [rawJson]);

  // Format JSON handler
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(rawJson);
      const formatted = JSON.stringify(parsed, null, 2);
      setRawJson(formatted);
      messageApi.success("JSON formatted successfully");
    } catch {
      messageApi.error("Cannot format invalid JSON");
    }
  };

  // Preset selection handler
  const handleSelectPreset = (presetJson: string) => {
    setRawJson(presetJson);
    setApiResult(undefined);
    setApiError(undefined);
    setApiLatency(undefined);
    messageApi.info("Sample preset loaded");
  };

  // Submit to Jev handler
  const handleSendToJev = async () => {
    if (!validation.isValid || !validation.parsedPayload) {
      messageApi.error("Please fix validation errors before sending");
      return;
    }

    if (!apiKey.trim()) {
      messageApi.warning(
        "Please enter your TypeSafe API key in the top configuration header",
      );
      return;
    }

    setIsLoading(true);
    setApiError(undefined);

    try {
      const response = await evaluateWithJev({
        data: {
          apiKey: apiKey.trim(),
          baseURL: baseUrl.trim() || undefined,
          payload: validation.parsedPayload,
        },
      });

      setApiLatency(response.latencyMs);

      if (response.success && response.result) {
        setApiResult(response.result);
        messageApi.success(`Received answers in ${response.latencyMs}ms!`);
      } else {
        setApiError(response.error || "Failed to evaluate payload");
        messageApi.error(response.error || "Evaluation failed");
      }
    } catch (err: unknown) {
      const errText = err instanceof Error ? err.message : String(err);
      setApiError(errText);
      messageApi.error(`Request failed: ${errText}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",
          borderRadius: 8,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      }}
    >
      {contextHolder}
      <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
        <Content
          style={{
            padding: "24px 32px",
            maxWidth: "1600px",
            margin: "0 auto",
            width: "100%",
          }}
        >
          {/* Page Heading */}
          <div style={{ marginBottom: 20 }}>
            <Title level={2} style={{ margin: "0 0 4px 0", color: "#1f2937" }}>
              Jev Model Decision Workbench
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Interactive playground to validate JSON messages, inspect question
              structures, and execute fast, structured decisions with System One - Compatible models.
            </Text>
          </div>

          {/* Config Header */}
          <HeaderConfig
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            baseUrl={baseUrl}
            onBaseUrlChange={setBaseUrl}
            onSelectPreset={handleSelectPreset}
          />

          {/* Top Section: Raw JSON Editor (Left) & Question Breakdown Visualizer (Right) */}
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col xs={24} lg={12}>
              <JsonEditor
                value={rawJson}
                onChange={setRawJson}
                onFormat={handleFormat}
                onSend={handleSendToJev}
                validation={validation}
                isLoading={isLoading}
                hasApiKey={Boolean(apiKey.trim())}
              />
            </Col>

            <Col xs={24} lg={12}>
              <QuestionVisualizer payload={validation.parsedPayload} />
            </Col>
          </Row>

          {/* Bottom Section: Response & Calibrated Probabilities Visualizer */}
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <ResponseVisualizer
                result={apiResult}
                latencyMs={apiLatency}
                error={apiError}
                isLoading={isLoading}
              />
            </Col>
          </Row>
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
