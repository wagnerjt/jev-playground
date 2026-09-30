import React from "react";
import { Card, Button, Space, Typography, Alert, Badge, Tooltip } from "antd";
import {
  SendOutlined,
  FormatPainterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import type { ValidationResult } from "../services/validation";

const { Text } = Typography;

interface JsonEditorProps {
  value: string;
  onChange: (val: string) => void;
  onFormat: () => void;
  onSend: () => void;
  validation: ValidationResult;
  isLoading: boolean;
  hasApiKey: boolean;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChange,
  onFormat,
  onSend,
  validation,
  isLoading,
  hasApiKey,
}) => {
  const lineCount = value.split("\n").length;

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
          <Space orientation="horizontal" size="small">
            <Text strong>1. Raw JSON Message</Text>
            {validation.isValid ? (
              <Badge
                status="success"
                text={
                  <Text type="success" style={{ fontSize: 12 }}>
                    Valid Payload
                  </Text>
                }
              />
            ) : (
              <Badge
                status="error"
                text={
                  <Text type="danger" style={{ fontSize: 12 }}>
                    Payload Issues
                  </Text>
                }
              />
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {lineCount} {lineCount === 1 ? "line" : "lines"}
          </Text>
        </div>
      }
      extra={
        <Space orientation="horizontal" size="small">
          <Button
            icon={<FormatPainterOutlined />}
            size="small"
            onClick={onFormat}
            disabled={isLoading}
          >
            Format
          </Button>
          <Tooltip
            title={
              !hasApiKey
                ? "Please provide an API key in the configuration above"
                : !validation.isValid
                  ? "Fix payload validation errors before sending"
                  : ""
            }
          >
            <Button
              type="primary"
              icon={<SendOutlined />}
              size="small"
              onClick={onSend}
              loading={isLoading}
              disabled={!validation.isValid}
              style={{
                backgroundColor: validation.isValid ? "#1677ff" : undefined,
              }}
            >
              Send to Jev
            </Button>
          </Tooltip>
        </Space>
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
          display: "flex",
          flexDirection: "column",
          gap: 12,
          padding: "12px 16px",
        },
      }}
    >
      <div style={{ position: "relative", flex: 1, display: "flex" }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste or write raw JSON message..."
          spellCheck={false}
          style={{
            width: "100%",
            minHeight: "360px",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "13px",
            lineHeight: "1.5",
            padding: "12px",
            borderRadius: 8,
            border: validation.isValid
              ? "1px solid #d9d9d9"
              : "1px solid #ff4d4f",
            backgroundColor: "#fafafa",
            outline: "none",
            resize: "vertical",
            whiteSpace: "pre",
            overflowX: "auto",
          }}
        />
      </div>

      {/* Validation feedback messages */}
      {validation.errors.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            maxHeight: "150px",
            overflowY: "auto",
          }}
        >
          {validation.errors.map((err, i) => (
            <Alert
              key={i}
              type={err.severity === "error" ? "error" : "warning"}
              showIcon
              icon={
                err.severity === "error" ? (
                  <CloseCircleOutlined />
                ) : (
                  <WarningOutlined />
                )
              }
              title={
                <span style={{ fontSize: 12 }}>
                  <strong>[{err.path}]</strong> {err.message}
                </span>
              }
              style={{ padding: "4px 8px" }}
            />
          ))}
        </div>
      )}

      {validation.isValid && validation.errors.length === 0 && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          title={
            <span style={{ fontSize: 12 }}>
              Payload passes @typesafe-ai/sdk validation. Ready to send.
            </span>
          }
          style={{ padding: "4px 8px" }}
        />
      )}
    </Card>
  );
};
