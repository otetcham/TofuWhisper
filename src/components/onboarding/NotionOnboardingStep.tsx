import React, { useEffect, useState } from "react";
import { NotionStorageSettings } from "../settings/NotionStorageSettings";
import { BrandMark } from "./OnboardingShell";

interface NotionOnboardingStepProps {
  onComplete: () => void;
}

function NotionLogoSvg({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z"
        fill="#ffffff"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z"
        fill="#000000"
      />
    </svg>
  );
}

export const NotionOnboardingStep: React.FC<NotionOnboardingStepProps> = ({ onComplete }) => {
  const [isReady, setIsReady] = useState(false);

  const checkReady = async () => {
    const api = (window as unknown as { electronAPI?: Record<string, () => Promise<{ enabled?: boolean; hasApiKey?: boolean; databaseId?: string }>> }).electronAPI;
    const cfg = await api?.getNotionStorageConfig?.();
    setIsReady(Boolean(cfg?.enabled && cfg?.hasApiKey && cfg?.databaseId));
  };

  useEffect(() => {
    void checkReady();
    const timer = setInterval(() => {
      void checkReady();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-5 py-4 px-2">
      <div className="flex flex-col items-center text-center gap-2">
        <div className="flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <span className="text-muted-foreground text-sm">×</span>
          <NotionLogoSvg className="h-9 w-9" />
        </div>
        <h1 className="text-xl font-bold text-[var(--onboarding-text-primary)]">
          TofuWhisper へようこそ
        </h1>
        <p className="text-xs text-[var(--onboarding-text-secondary)]">
          すべてのノート・文字起こしは個人の Notion データベースに保存されます。まず Notion アカウントを連携してください（必須）。
        </p>
      </div>

      <NotionStorageSettings />

      <button
        type="button"
        onClick={onComplete}
        disabled={!isReady}
        className="w-full rounded-xl bg-[var(--onboarding-accent)] px-4 py-2.5 text-sm font-semibold text-[var(--onboarding-accent-foreground)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isReady ? "次へ（モデル / API の選択へ）" : "Notion を有効にして設定を保存すると次へ進めます"}
      </button>
    </div>
  );
};
