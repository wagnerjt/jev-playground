import React from "react";
import { Card, Input, Select, Space, Typography, Tag } from "antd";
import {
  KeyOutlined,
  GlobalOutlined,
  AppstoreOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { SAMPLE_PRESETS } from "../services/presets";

const { Text } = Typography;

interface HeaderConfigProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  baseUrl: string;
  onBaseUrlChange: (url: string) => void;
  onSelectPreset: (presetJson: string) => void;
}

export const HeaderConfig: React.FC<HeaderConfigProps> = ({
  apiKey,
  onApiKeyChange,
  baseUrl,
  onBaseUrlChange,
  onSelectPreset,
}) => {
  return (
    <Card
      size="small"
      style={{
        marginBottom: 16,
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(8px)",
        borderRadius: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Space orientation="horizontal" size="middle" wrap style={{ flex: 1 }}>
          {/* API Key Input */}
          <div style={{ minWidth: 260, flex: "1 1 260px" }}>
            <Text
              strong
              style={{ fontSize: 12, display: "block", marginBottom: 4 }}
            >
              <KeyOutlined style={{ marginRight: 4, color: "#1677ff" }} />
              TypeSafe API Key:
            </Text>
            <Input.Password
              placeholder="Paste your API key (held in memory)"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              allowClear
              size="middle"
            />
          </div>

          {/* Base URL Input */}
          <div style={{ minWidth: 260, flex: "1 1 260px" }}>
            <Text
              strong
              style={{ fontSize: 12, display: "block", marginBottom: 4 }}
            >
              <GlobalOutlined style={{ marginRight: 4, color: "#52c41a" }} />
              API Base URL:
            </Text>
            <Input
              placeholder="https://api.typesafe.ai"
              value={baseUrl}
              onChange={(e) => onBaseUrlChange(e.target.value)}
              allowClear
              size="middle"
            />
          </div>

          {/* Sample Preset Selector */}
          <div style={{ minWidth: 240, flex: "1 1 240px" }}>
            <Text
              strong
              style={{ fontSize: 12, display: "block", marginBottom: 4 }}
            >
              <AppstoreOutlined style={{ marginRight: 4, color: "#722ed1" }} />
              Load Sample Preset:
            </Text>
            <Select
              placeholder="Select a sample payload..."
              style={{ width: "100%" }}
              size="middle"
              onChange={(value) => {
                const found = SAMPLE_PRESETS.find((p) => p.id === value);
                if (found) {
                  onSelectPreset(found.json);
                }
              }}
              options={SAMPLE_PRESETS.map((p) => ({
                value: p.id,
                label: (
                  <Space orientation="horizontal" size="small">
                    <Tag
                      color={
                        p.category === "noul"
                          ? "cyan"
                          : p.category === "choice"
                            ? "blue"
                            : p.category === "score"
                              ? "purple"
                              : p.category === "local"
                                ? "green"
                                : "gold"
                      }
                      style={{ fontSize: 10, padding: "0 4px" }}
                    >
                      {p.category.toUpperCase()}
                    </Tag>
                    <span>{p.name}</span>
                  </Space>
                ),
              }))}
            />
          </div>
        </Space>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Tag
            color="geekblue"
            icon={<ThunderboltOutlined />}
            style={{ padding: "4px 8px" }}
          >
            Jev System One
          </Tag>
        </div>
      </div>
    </Card>
  );
};
