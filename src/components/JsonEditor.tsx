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

const getQuotedStringEnd = (value: string, start: number): number | null => {
  for (let index = start + 1; index < value.length; index += 1) {
    if (value[index] === "\\") {
      index += 1;
    } else if (value[index] === '"') {
      return index + 1;
    }
  }

  return null;
};

type RootBlockName = "model" | "state" | "questions";

const getJsonValueEnd = (value: string, start: number): number | null => {
  const firstCharacter = value[start];
  if (firstCharacter === '"') return getQuotedStringEnd(value, start);

  if (firstCharacter === "{" || firstCharacter === "[") {
    const closingCharacters = [firstCharacter === "{" ? "}" : "]"];

    for (let index = start + 1; index < value.length; index += 1) {
      if (value[index] === '"') {
        const stringEnd = getQuotedStringEnd(value, index);
        if (stringEnd === null) return null;
        index = stringEnd - 1;
      } else if (value[index] === "{" || value[index] === "[") {
        closingCharacters.push(value[index] === "{" ? "}" : "]");
      } else if (value[index] === "}" || value[index] === "]") {
        if (closingCharacters.pop() !== value[index]) return null;
        if (closingCharacters.length === 0) return index + 1;
      }
    }

    return null;
  }

  let end = start;
  while (end < value.length && !/[\s,}\]]/.test(value[end])) end += 1;
  return end > start ? end : null;
};

const getRootBlockRanges = (
  value: string,
): Partial<Record<RootBlockName, [number, number]>> => {
  let depth = 0;
  const ranges: Partial<Record<RootBlockName, [number, number]>> = {};

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (character === '"') {
      const keyEnd = getQuotedStringEnd(value, index);
      if (keyEnd === null) return ranges;

      let key: unknown;
      try {
        key = JSON.parse(value.slice(index, keyEnd));
      } catch {
        key = undefined;
      }

      if (
        depth === 1 &&
        (key === "model" || key === "state" || key === "questions")
      ) {
        let valueStart = keyEnd;
        while (/\s/.test(value[valueStart] ?? "")) valueStart += 1;
        if (value[valueStart] === ":") {
          valueStart += 1;
          while (/\s/.test(value[valueStart] ?? "")) valueStart += 1;
          const valueEnd = getJsonValueEnd(value, valueStart);
          const isModelString = key !== "model" || value[valueStart] === '"';
          if (valueEnd !== null && isModelString) {
            ranges[key] = [index, valueEnd];
          }
        }
      }

      index = keyEnd - 1;
    } else if (character === "{" || character === "[") {
      depth += 1;
    } else if (character === "}" || character === "]") {
      depth -= 1;
    }
  }

  return ranges;
};

const rootBlockStyles: Record<
  RootBlockName,
  { backgroundColor: string; borderColor: string }
> = {
  model: {
    backgroundColor: "rgba(22, 119, 255, 0.12)",
    borderColor: "#1677ff",
  },
  state: {
    backgroundColor: "rgba(82, 196, 26, 0.12)",
    borderColor: "#389e0d",
  },
  questions: {
    backgroundColor: "rgba(250, 140, 22, 0.12)",
    borderColor: "#d46b08",
  },
};

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
  const lineNumberGutterRef = React.useRef<HTMLDivElement>(null);
  const highlightLayerRef = React.useRef<HTMLPreElement>(null);
  const rootBlockRanges = getRootBlockRanges(value);
  const rootBlockLineRanges = Object.entries(rootBlockRanges).map(
    ([block, [start, end]]) => ({
      block: block as RootBlockName,
      startLine: value.slice(0, start).split("\n").length - 1,
      endLine: value.slice(0, end - 1).split("\n").length - 1,
    }),
  );
  const editorLines = value.split("\n");

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
          <Text type="secondary" style={{ fontSize: 12, paddingRight: 16 }}>
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
      <div style={{ flex: 1, display: "flex", minHeight: "360px" }}>
        <div
          ref={lineNumberGutterRef}
          aria-hidden="true"
          style={{
            minWidth: 48,
            padding: "12px 10px 12px 8px",
            border: validation.isValid
              ? "1px solid #d9d9d9"
              : "1px solid #ff4d4f",
            borderRight: 0,
            borderRadius: "8px 0 0 8px",
            backgroundColor: "#f0f0f0",
            color: "#8c8c8c",
            fontFamily:
              "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "13px",
            lineHeight: "1.5",
            textAlign: "right",
            overflow: "hidden",
            userSelect: "none",
          }}
        >
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>
        <div
          style={{
            position: "relative",
            flex: 1,
            minHeight: "360px",
            overflow: "hidden",
            borderRadius: "0 8px 8px 0",
          }}
        >
          <pre
            ref={highlightLayerRef}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              margin: 0,
              padding: "12px",
              border: "1px solid transparent",
              borderLeft: 0,
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "13px",
              lineHeight: "1.5",
              whiteSpace: "pre",
              overflow: "hidden",
              pointerEvents: "none",
              color: "#262626",
            }}
          >
            {editorLines.map((line, lineIndex) => {
              const rootBlock = rootBlockLineRanges.find(
                ({ startLine, endLine }) =>
                  lineIndex >= startLine && lineIndex <= endLine,
              );
              const isFirstBlockLine = rootBlock?.startLine === lineIndex;
              const isLastBlockLine = rootBlock?.endLine === lineIndex;
              const blockStyle = rootBlock
                ? rootBlockStyles[rootBlock.block]
                : undefined;

              return (
                <div
                  key={lineIndex}
                  style={{
                    width: "max-content",
                    minWidth: "100%",
                    height: "19.5px",
                    lineHeight: "19.5px",
                    whiteSpace: "pre",
                    backgroundColor: blockStyle?.backgroundColor,
                    boxShadow: blockStyle
                      ? [
                          `inset 1px 0 ${blockStyle.borderColor}`,
                          `inset -1px 0 ${blockStyle.borderColor}`,
                          isFirstBlockLine
                            ? `inset 0 1px ${blockStyle.borderColor}`
                            : "",
                          isLastBlockLine
                            ? `inset 0 -1px ${blockStyle.borderColor}`
                            : "",
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : undefined,
                    borderRadius: blockStyle
                      ? `${isFirstBlockLine ? "3px 3px" : "0 0"} ${isLastBlockLine ? "3px 3px" : "0 0"}`
                      : undefined,
                  }}
                >
                  {line || " "}
                </div>
              );
            })}
          </pre>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={(e) => {
              if (lineNumberGutterRef.current) {
                lineNumberGutterRef.current.scrollTop =
                  e.currentTarget.scrollTop;
              }
              if (highlightLayerRef.current) {
                highlightLayerRef.current.scrollTop = e.currentTarget.scrollTop;
                highlightLayerRef.current.scrollLeft =
                  e.currentTarget.scrollLeft;
              }
            }}
            placeholder="Paste or write raw JSON message..."
            spellCheck={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              minHeight: "360px",
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "13px",
              lineHeight: "1.5",
              padding: "12px",
              borderRadius: "0 8px 8px 0",
              borderLeft: 0,
              border: validation.isValid
                ? "1px solid #d9d9d9"
                : "1px solid #ff4d4f",
              backgroundColor: "transparent",
              color: "transparent",
              caretColor: "#173a40",
              outline: "none",
              resize: "none",
              whiteSpace: "pre",
              overflow: "auto",
            }}
          />
        </div>
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
