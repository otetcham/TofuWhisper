import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Toggle } from "../ui/toggle";
import { Badge } from "../ui/badge";
import { SettingsPanel, SettingsPanelRow, SettingsRow } from "../ui/SettingsSection";

interface NotionConfig {
  enabled: boolean;
  autoSync: boolean;
  databaseId: string;
  hasApiKey: boolean;
  apiKeyMasked: string;
  lastError: string | null;
  lastSyncedAt: string | null;
}

export const NotionStorageSettings: React.FC = () => {
  const [config, setConfig] = useState<NotionConfig | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [databaseIdInput, setDatabaseIdInput] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [parentPageInput, setParentPageInput] = useState("");
  const [isCreatingDb, setIsCreatingDb] = useState(false);

  const api = (window as unknown as { electronAPI?: Record<string, (...args: unknown[]) => Promise<unknown>> }).electronAPI;

  const loadConfig = async () => {
    if (!api?.getNotionStorageConfig) return;
    const cfg = (await api.getNotionStorageConfig()) as NotionConfig;
    setConfig(cfg);
    setDatabaseIdInput(cfg.databaseId || "");
    setEnabled(cfg.enabled);
    setAutoSync(cfg.autoSync);
  };

  useEffect(() => {
    void loadConfig();
  }, []);

  const handleSave = async () => {
    if (!api?.saveNotionStorageConfig) return;
    const updated = (await api.saveNotionStorageConfig({
      enabled,
      autoSync,
      databaseId: databaseIdInput,
      ...(apiKeyInput ? { apiKey: apiKeyInput } : {}),
    })) as NotionConfig;
    setConfig(updated);
    setApiKeyInput("");
    setStatusMsg("Notion設定を保存しました。");
  };

  const handleTest = async () => {
    if (!api?.testNotionStorageConnection) return;
    setIsTesting(true);
    setStatusMsg(null);
    try {
      const res = (await api.testNotionStorageConnection({
        apiKey: apiKeyInput || undefined,
        databaseId: databaseIdInput || undefined,
      })) as { ok: boolean; databaseTitle?: string; error?: string };
      if (res.ok) {
        setStatusMsg(`接続成功: "${res.databaseTitle}"`);
      } else {
        setStatusMsg(`接続エラー: ${res.error}`);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncAll = async () => {
    if (!api?.syncAllNotesToNotion) return;
    setIsSyncing(true);
    setStatusMsg(null);
    try {
      const res = (await api.syncAllNotesToNotion()) as {
        ok: boolean;
        total?: number;
        synced?: number;
        failed?: number;
        error?: string;
      };
      if (res.ok) {
        setStatusMsg(`同期完了: ${res.synced}/${res.total} 件成功 (失敗: ${res.failed} 件)`);
        await loadConfig();
      } else {
        setStatusMsg(`同期エラー: ${res.error}`);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullAll = async () => {
    if (!api?.pullAllNotesFromNotion) return;
    setIsPulling(true);
    setStatusMsg(null);
    try {
      const res = (await api.pullAllNotesFromNotion()) as {
        ok: boolean;
        total?: number;
        imported?: number;
        error?: string;
      };
      if (res.ok) {
        setStatusMsg(`Notionから取得完了: ${res.imported} 件を新規インポート (全 ${res.total} 件中)`);
      } else {
        setStatusMsg(`取得エラー: ${res.error}`);
      }
    } finally {
      setIsPulling(false);
    }
  };

  const handleCreateDb = async () => {
    if (!api?.createNotionDatabase) return;
    setIsCreatingDb(true);
    setStatusMsg(null);
    try {
      const res = (await api.createNotionDatabase({
        apiKey: apiKeyInput || undefined,
        parentPageId: parentPageInput,
      })) as { ok: boolean; databaseId?: string; databaseTitle?: string; error?: string };
      if (res.ok && res.databaseId) {
        setDatabaseIdInput(res.databaseId);
        setEnabled(true);
        setStatusMsg(`Notionデータベース「${res.databaseTitle}」を作成・接続しました。`);
        await loadConfig();
      } else {
        setStatusMsg(`作成エラー: ${res.error}`);
      }
    } finally {
      setIsCreatingDb(false);
    }
  };

  return (
    <SettingsPanel>
      <SettingsPanelRow>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold text-foreground">Notion Storage (TofuWhisper)</p>
              {config?.enabled && config?.hasApiKey && config?.databaseId && (
                <Badge variant="success">接続済み</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">
              OpenWhispr Cloud を使わず、個人の Notion データベースへノートを保存・取得します。
            </p>
          </div>
        </div>
      </SettingsPanelRow>

      <SettingsPanelRow>
        <SettingsRow
          label="Notion 保存を有効にする"
          description="ノート・文字起こしデータの保存先として Notion を使用します"
        >
          <Toggle checked={enabled} onChange={setEnabled} />
        </SettingsRow>
      </SettingsPanelRow>

      <SettingsPanelRow>
        <SettingsRow
          label="自動同期"
          description="ノートの作成・更新時に自動で Notion へ反映します"
        >
          <Toggle checked={autoSync} onChange={setAutoSync} />
        </SettingsRow>
      </SettingsPanelRow>

      <SettingsPanelRow>
        <div className="space-y-2.5">
          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Notion Integration Token {config?.hasApiKey ? `(設定済み: ${config.apiKeyMasked})` : ""}
            </label>
            <Input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={config?.hasApiKey ? "変更する場合のみ入力" : "ntn_... または secret_..."}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-foreground">
              Notion Database ID または URL
            </label>
            <Input
              type="text"
              value={databaseIdInput}
              onChange={(e) => setDatabaseIdInput(e.target.value)}
              placeholder="https://www.notion.so/... または 32文字のID"
            />
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button size="sm" onClick={handleSave}>
              設定を保存
            </Button>
            <Button size="sm" variant="outline" onClick={handleTest} disabled={isTesting}>
              {isTesting ? "テスト中..." : "接続テスト"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleSyncAll}
              disabled={isSyncing || !config?.enabled}
            >
              {isSyncing ? "同期中..." : "すべてNotionへ同期"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handlePullAll}
              disabled={isPulling || !config?.enabled}
            >
              {isPulling ? "取得中..." : "Notionから取得"}
            </Button>
          </div>
        </div>
      </SettingsPanelRow>

      <SettingsPanelRow>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">
            DBがない場合：親ページURL/IDを指定して TofuWhisper 用DBを自動作成
          </label>
          <div className="flex gap-2">
            <Input
              type="text"
              value={parentPageInput}
              onChange={(e) => setParentPageInput(e.target.value)}
              placeholder="Notionの親ページURLまたはID"
              className="flex-1"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateDb}
              disabled={isCreatingDb || !parentPageInput.trim()}
              className="shrink-0"
            >
              {isCreatingDb ? "作成中..." : "DBを自動作成"}
            </Button>
          </div>
        </div>
      </SettingsPanelRow>

      {(statusMsg || config?.lastError || config?.lastSyncedAt) && (
        <SettingsPanelRow>
          <div className="space-y-1">
            {statusMsg && <p className="text-xs text-muted-foreground">{statusMsg}</p>}
            {config?.lastError && <p className="text-xs text-destructive">前回のエラー: {config.lastError}</p>}
            {config?.lastSyncedAt && (
              <p className="text-xs text-muted-foreground">
                最終同期: {new Date(config.lastSyncedAt).toLocaleString()}
              </p>
            )}
          </div>
        </SettingsPanelRow>
      )}
    </SettingsPanel>
  );
};
