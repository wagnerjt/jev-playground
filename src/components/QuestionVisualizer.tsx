import React from "react";
import { Card, Tag, Typography, Empty, Divider } from "antd";
import {
  CheckSquareOutlined,
  UnorderedListOutlined,
  SlidersOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import type { SystemOneRequest } from "@typesafe-ai/sdk";

const { Text, Paragraph } = Typography;

interface QuestionVisualizerProps {
  payload?: SystemOneRequest;
}

export const QuestionVisualizer: React.FC<QuestionVisualizerProps> = ({
  payload,
}) => {
  if (!payload) {
    return (
      <Card
        title={
          <Text strong>2. Payload Breakdown: State, Questions & Criteria</Text>
        }
        style={{
          borderRadius: 12,
          height: "100%",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}
      >
        <Empty description="Enter or format a valid JSON payload to inspect its question structure" />
      </Card>
    );
  }

  const { state, questions, model } = payload;
  const questionEntries = questions ? Object.entries(questions) : [];

  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text strong>2. Payload Breakdown: State & Questions</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Model: {model || "jev-latest (default)"}
          </Text>
        </div>
      }
      style={{
        borderRadius: 12,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
      styles={{
        body: {
          flex: 1,
          overflowY: "auto",
          maxHeight: "600px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          padding: "16px",
        },
      }}
    >
      {/* State View */}
      <Card
        size="small"
        style={{
          background: "#f0f5ff",
          borderColor: "#adc6ff",
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}
        >
          <DatabaseOutlined style={{ color: "#2f54eb" }} />
          <Text strong style={{ color: "#1d39c4", fontSize: 13 }}>
            State (Context for Jev):
          </Text>
        </div>
        {typeof state === "string" ? (
          <Paragraph
            style={{
              margin: 0,
              fontSize: 13,
              backgroundColor: "#ffffff",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #d6e4ff",
              whiteSpace: "pre-wrap",
            }}
          >
            {state}
          </Paragraph>
        ) : (
          <pre
            style={{
              margin: 0,
              fontSize: 12,
              backgroundColor: "#ffffff",
              padding: "8px 12px",
              borderRadius: 6,
              border: "1px solid #d6e4ff",
              maxHeight: "150px",
              overflow: "auto",
            }}
          >
            {JSON.stringify(state, null, 2)}
          </pre>
        )}
      </Card>

      <Divider style={{ margin: "4px 0" }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {questionEntries.length}{" "}
          {questionEntries.length === 1 ? "Question" : "Questions"} to Evaluate
        </Text>
      </Divider>

      {/* Questions List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {questionEntries.map(([qKey, q]: [string, any]) => {
          const isChoice = q.type === "choice";
          const isNoul = q.type === "noul";
          const isScore = q.type === "score";

          return (
            <Card
              key={qKey}
              size="small"
              style={{
                borderRadius: 8,
                border: "1px solid #e8e8e8",
                backgroundColor: "#ffffff",
              }}
              title={
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 600,
                      fontSize: 13,
                      color: "#262626",
                    }}
                  >
                    {qKey}
                  </span>
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
                    {q.type?.toUpperCase()}
                  </Tag>
                </div>
              }
            >
              {/* Instructions */}
              <div style={{ marginBottom: 10 }}>
                <Text
                  type="secondary"
                  style={{ fontSize: 11, display: "block" }}
                >
                  Instructions / Question:
                </Text>
                <Text style={{ fontSize: 13, fontWeight: 500 }}>
                  {typeof q.instructions === "string"
                    ? q.instructions
                    : JSON.stringify(q.instructions)}
                </Text>
              </div>

              {/* Noul Details */}
              {isNoul && (
                <div
                  style={{
                    backgroundColor: "#e6fffb",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #87e8de",
                  }}
                >
                  <Text
                    strong
                    style={{
                      fontSize: 12,
                      color: "#006d75",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    Noul Criteria (Binary Probability Judgment):
                  </Text>
                  {q.criteria?.true || q.criteria?.false ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}
                    >
                      {q.criteria.true && (
                        <div style={{ fontSize: 12 }}>
                          <Tag color="green">true (1.0)</Tag>{" "}
                          <span>
                            {typeof q.criteria.true === "string"
                              ? q.criteria.true
                              : JSON.stringify(q.criteria.true)}
                          </span>
                        </div>
                      )}
                      {q.criteria.false && (
                        <div style={{ fontSize: 12 }}>
                          <Tag color="red">false (0.0)</Tag>{" "}
                          <span>
                            {typeof q.criteria.false === "string"
                              ? q.criteria.false
                              : JSON.stringify(q.criteria.false)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      No criteria specified. The model uses the instructions to
                      calibrate probability between 0 and 1.
                    </Text>
                  )}
                </div>
              )}

              {/* Choice Options Details */}
              {isChoice && q.criteria && typeof q.criteria === "object" && (
                <div
                  style={{
                    backgroundColor: "#f0f5ff",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #adc6ff",
                  }}
                >
                  <Text
                    strong
                    style={{
                      fontSize: 12,
                      color: "#1d39c4",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Options ({Object.keys(q.criteria).length}):
                  </Text>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {Object.entries(q.criteria).map(([optName, optDesc]) => (
                      <div
                        key={optName}
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 8,
                          fontSize: 12,
                          padding: "2px 0",
                        }}
                      >
                        <Tag color="blue" style={{ fontFamily: "monospace" }}>
                          {optName}
                        </Tag>
                        <span style={{ color: "#595959" }}>
                          {optDesc ? String(optDesc) : "(no description)"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Levels Details */}
              {isScore && Array.isArray(q.criteria) && (
                <div
                  style={{
                    backgroundColor: "#f9f0ff",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #d3adf7",
                  }}
                >
                  <Text
                    strong
                    style={{
                      fontSize: 12,
                      color: "#531dab",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Score Rubric Levels ({q.criteria.length}):
                  </Text>
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 6 }}
                  >
                    {q.criteria.map((levelDesc: unknown, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "baseline",
                          gap: 8,
                          fontSize: 12,
                        }}
                      >
                        <Tag color="purple">Level {idx}</Tag>
                        <span style={{ color: "#595959" }}>
                          {String(levelDesc)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </Card>
  );
};
