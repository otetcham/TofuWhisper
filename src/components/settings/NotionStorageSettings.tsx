import React, { useEffect, useState } from "react";

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
    <div className="rounded-lg border border-border bg-card p-4 space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Notion Storage (TofuWhisper)</h3>
        <p className="text-xs text-muted-foreground mt-1">
          OpenWhispr Cloud を使わず、個人の Notion データベースへノートを直接保存・同期します。
        </p>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Notion 保存を有効にする</label>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="h-4 w-4"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">ノート作成・更新時に自動同期する</label>
        <input
          type="checkbox"
          checked={autoSync}
          onChange={(e) => setAutoSync(e.target.checked)}
          className="h-4 w-4"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Notion Integration Token {config?.hasApiKey ? `(設定済み: ${config.apiKeyMasked})` : ""}
        </label>
        <input
          type="password"
          value={apiKeyInput}
          onChange={(e) => setApiKeyInput(e.target.value)}
          placeholder={config?.hasApiKey ? "変更する場合のみ入力" : "ntn_... または secret_..."}
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Notion Database ID または URL
        </label>
        <input
          type="text"
          value={databaseIdInput}
          onChange={(e) => setDatabaseIdInput(e.target.value)}
          placeholder="https://www.notion.so/... または 32文字のID"
          className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          設定を保存
        </button>
        <button
          type="button"
          onClick={handleTest}
          disabled={isTesting}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          {isTesting ? "テスト中..." : "接続テスト"}
        </button>
        <button
          type="button"
          onClick={handleSyncAll}
          disabled={isSyncing || !config?.enabled}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          {isSyncing ? "同期中..." : "既存ノートをすべてNotionへ同期"}
        </button>
        <button
          type="button"
          onClick={handlePullAll}
          disabled={isPulling || !config?.enabled}
          className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
        >
          {isPulling ? "取得中..." : "Notionからノートを取得"}
        </button>
      </div>

      <div className="pt-2 border-t border-border space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          まだDBがない場合：親ページのURL/IDを指定して TofuWhisper 用DBを自動作成
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={parentPageInput}
            onChange={(e) => setParentPageInput(e.target.value)}
            placeholder="Notionの親ページURLまたはID"
            className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={handleCreateDb}
            disabled={isCreatingDb || !parentPageInput.trim()}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-accent disabled:opacity-50"
          >
            {isCreatingDb ? "作成中..." : "DBを自動作成"}
          </button>
        </div>
      </div>

      {statusMsg && <p className="text-xs text-muted-foreground">{statusMsg}</p>}
      {config?.lastError && <p className="text-xs text-red-500">前回のエラー: {config.lastError}</p>}
      {config?.lastSyncedAt && (
        <p className="text-xs text-muted-foreground">
          最終同期: {new Date(config.lastSyncedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
};
