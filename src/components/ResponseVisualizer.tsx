import React, { useState } from "react";
import {
  Card,
  Typography,
  Tag,
  Progress,
  Divider,
  Alert,
  Button,
  Empty,
  Space,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CodeOutlined,
  UnorderedListOutlined,
  CheckSquareOutlined,
  SlidersOutlined,
} from "@ant-design/icons";
import type { SystemOneResult } from "@typesafe-ai/sdk";

const { Text } = Typography;

interface ResponseVisualizerProps {
  result?: SystemOneResult<any>;
  latencyMs?: number;
  error?: string;
  isLoading: boolean;
}

export const ResponseVisualizer: React.FC<ResponseVisualizerProps> = ({
  result,
  latencyMs,
  error,
  isLoading,
}) => {
  const [showRaw, setShowRaw] = useState(false);

  if (isLoading) {
    return (
      <Card
        title={<Text strong>3. Jev Model Response & Probabilities</Text>}
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <div style={{ textAlign: "center", padding: "48px 0" }}>
          <Progress
            type="circle"
            percent={70}
            status="active"
            showInfo={false}
          />
          <div style={{ marginTop: 16 }}>
            <Text strong style={{ fontSize: 14 }}>
              Evaluating decisions with Jev in parallel...
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Calculating calibrated probabilities across all questions
          </Text>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        title={<Text strong>3. Jev Model Response</Text>}
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <Alert
          type="error"
          showIcon
          title="API Request Failed"
          description={
            <div>
              <div style={{ margin: "4px 0", fontSize: 13, color: "#a8071a" }}>
                {error}
              </div>
              {latencyMs !== undefined && (
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Response time: {latencyMs}ms
                </Text>
              )}
            </div>
          }
        />
      </Card>
    );
  }

  if (!result || !result.answers) {
    return (
      <Card
        title={<Text strong>3. Jev Model Response & Probabilities</Text>}
        style={{ borderRadius: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      >
        <Empty description="No response yet. Click 'Send to Jev' to evaluate the payload." />
      </Card>
    );
  }

  const { model, answers, usage } = result;
  const answerEntries = Object.entries(answers);

  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Space orientation="horizontal" size="small">
            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 16 }} />
            <Text strong>3. Jev Probabilities & Decisions</Text>
          </Space>
          <Space orientation="horizontal" size="small">
            {latencyMs !== undefined && (
              <Tag icon={<ClockCircleOutlined />} color="default">
                {latencyMs}ms
              </Tag>
            )}
            <Tag color="blue">{model}</Tag>
            {usage && (
              <Tag color="cyan">
                {usage.input_tokens} in / {usage.output_tokens} out tokens
              </Tag>
            )}
          </Space>
        </div>
      }
      extra={
        <Button
          size="small"
          icon={<CodeOutlined />}
          onClick={() => setShowRaw(!showRaw)}
        >
          {showRaw ? "Hide Raw JSON" : "Show Raw JSON"}
        </Button>
      }
      style={{
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
      styles={{
        body: {
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        },
      }}
    >
      {/* Raw Response Collapsible */}
      {showRaw && (
        <pre
          style={{
            margin: 0,
            fontSize: 12,
            backgroundColor: "#2d3748",
            color: "#e2e8f0",
            padding: "12px",
            borderRadius: 8,
            overflow: "auto",
            maxHeight: "240px",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}

      {/* Answer Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 16,
        }}
      >
        {answerEntries.map(([qKey, ans]: [string, any]) => {
          const isChoice = ans.type === "choice";
          const isNoul = ans.type === "noul";
          const isScore = ans.type === "score";

          return (
            <Card
              key={qKey}
              size="small"
              style={{
                borderRadius: 8,
                border: "1px solid #d9d9d9",
                background: "#fafafa",
              }}
              title={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    strong
                    style={{ fontFamily: "monospace", fontSize: 13 }}
                  >
                    {qKey}
                  </Text>
                  <Tag
                    color={isNoul ? "cyan" : isChoice ? "blue" : "purple"}
                    icon={
                      isNoul ? (
                        <CheckSquareOutlined />
                      ) : isChoice ? (
                        <UnorderedListOutlined />
                      ) : (
                        <SlidersOutlined />
                      )
                    }
                  >
                    {ans.type?.toUpperCase()}
                  </Tag>
                </div>
              }
            >
              {/* NOUL RESULT */}
              {isNoul && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Calibrated Yes/No Probability:
                    </Text>
                    <Tag
                      color={
                        ans.noul >= 0.7
                          ? "success"
                          : ans.noul <= 0.3
                            ? "default"
                            : "warning"
                      }
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        padding: "2px 8px",
                      }}
                    >
                      {(ans.noul * 100).toFixed(1)}% Yes
                    </Tag>
                  </div>
                  <Progress
                    percent={Number((ans.noul * 100).toFixed(1))}
                    status={
                      ans.noul >= 0.7
                        ? "success"
                        : ans.noul <= 0.3
                          ? "normal"
                          : "active"
                    }
                    strokeColor={{
                      "0%": "#108ee9",
                      "100%": ans.noul >= 0.7 ? "#52c41a" : "#faad14",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: "#8c8c8c",
                    }}
                  >
                    <span>0% (No)</span>
                    <span>Raw value: {ans.noul}</span>
                    <span>100% (Yes)</span>
                  </div>
                </div>
              )}

              {/* CHOICE RESULT */}
              {isChoice && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Selected Choice:
                    </Text>
                    <Space orientation="horizontal" size="small">
                      <Tag
                        color="geekblue"
                        style={{ fontSize: 13, fontWeight: "bold" }}
                      >
                        {ans.choice}
                      </Tag>
                      {ans.confidence !== undefined && (
                        <Tag color="purple" style={{ fontSize: 11 }}>
                          {(ans.confidence * 100).toFixed(0)}% Conf
                        </Tag>
                      )}
                    </Space>
                  </div>

                  <Divider style={{ margin: "6px 0" }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      Probabilities Distribution
                    </Text>
                  </Divider>

                  {ans.probabilities && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      {Object.entries(ans.probabilities)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([opt, prob]: [string, any]) => {
                          const pct = Number((prob * 100).toFixed(1));
                          const isTop = opt === ans.choice;
                          return (
                            <div key={opt}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: 2,
                                }}
                              >
                                <Text
                                  strong={isTop}
                                  style={{
                                    fontSize: 12,
                                    fontFamily: "monospace",
                                  }}
                                >
                                  {opt} {isTop && "★"}
                                </Text>
                                <Text
                                  type={isTop ? undefined : "secondary"}
                                  style={{ fontSize: 12 }}
                                >
                                  {pct}%
                                </Text>
                              </div>
                              <Progress
                                percent={pct}
                                showInfo={false}
                                strokeColor={isTop ? "#1677ff" : "#91caff"}
                                size="small"
                              />
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

              {/* SCORE RESULT */}
              {isScore && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Expected Score:
                    </Text>
                    <Space orientation="horizontal" size="small">
                      <Tag
                        color="magenta"
                        style={{ fontSize: 14, fontWeight: "bold" }}
                      >
                        {typeof ans.score === "number"
                          ? ans.score.toFixed(2)
                          : String(ans.score)}
                      </Tag>
                      {ans.confidence !== undefined && (
                        <Tag color="purple" style={{ fontSize: 11 }}>
                          {(ans.confidence * 100).toFixed(0)}% Conf
                        </Tag>
                      )}
                    </Space>
                  </div>

                  {ans.probabilities && (
                    <>
                      <Divider style={{ margin: "6px 0" }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Level Distribution
                        </Text>
                      </Divider>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {Object.entries(ans.probabilities).map(
                          ([level, prob]: [string, any]) => {
                            const pct = Number((prob * 100).toFixed(1));
                            const levelDesc = ans.legend?.[level];
                            return (
                              <div key={level}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: 2,
                                  }}
                                >
                                  <Text style={{ fontSize: 11 }}>
                                    <strong>L{level}:</strong> {levelDesc || ""}
                                  </Text>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 11 }}
                                  >
                                    {pct}%
                                  </Text>
                                </div>
                                <Progress
                                  percent={pct}
                                  showInfo={false}
                                  strokeColor="#722ed1"
                                  size="small"
                                />
                              </div>
                            );
                          },
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Card>
  );
};
