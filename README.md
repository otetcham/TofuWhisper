<p align="center">
  <img src="src/assets/icon.png" alt="TofuWhisper" width="120" />
</p>

<h1 align="center">TofuWhisper</h1>

<p align="center">
  <strong>TofuWhisper</strong> is a privacy-first fork of <a href="https://github.com/OpenWhispr/openwhispr">OpenWhispr</a> that stores and syncs your notes & transcriptions directly to your personal <strong>Notion</strong> database — with zero dependency on OpenWhispr Cloud.
</p>

---

## Key Differences from OpenWhispr

- **Personal Notion Storage (No OpenWhispr Cloud)**
  - OpenWhispr Cloud API, account sign-in, and Plans & Billing UI are completely removed.
  - On first launch, you connect your Notion Integration Token and target Notion Database (or auto-create a new `TofuWhisper Notes` database under a parent page).
  - Notes (AI summary, raw notes, and transcripts) are automatically synced to Notion and can also be pulled back from Notion into TofuWhisper.
- **No Conflict with OpenWhispr**
  - Uses package/app ID `tofu-whisper` (`com.tofuwhisper.app`), storing local SQLite & settings in its own `tofu-whisper` userData directory so it runs cleanly alongside OpenWhispr.
- **Japanese-Specialized Local Models**
  - Includes **Kotoba-Whisper v2.0**, **Kotoba-Whisper v2.0 Q5**, and **Kotoba-Whisper v1.0** in the local Whisper model registry for high-accuracy Japanese dictation.
- **Custom Google Calendar OAuth**
  - Configure your own Google Cloud Desktop OAuth Client ID & Secret directly in Calendar settings (`401: invalid_client` fix), with automatic calendar event sync when connected.
- **Pro Features Unlocked Locally**
  - Local subscription gates and upgrade prompts are removed.

## Quick Start (Development)

```bash
git clone https://github.com/otetcham/TofuWhisper.git
cd TofuWhisper
git checkout notion-whisper
npm install
npm run dev
```

Requires Node.js 24+.

## Windows `.exe` Build (GitHub Actions)

Pushing to `notion-whisper` triggers `.github/workflows/build-notionwhisper-win.yml` on `windows-latest`, compiling native dependencies (`better-sqlite3`, `windows-key-listener.exe`, `windows-fast-paste.exe`) and outputting the installer under the **`TofuWhisper-Windows-Exe`** workflow artifact.

## License & Acknowledgments

[MIT](LICENSE) — Built on top of [OpenWhispr](https://github.com/OpenWhispr/openwhispr), [whisper.cpp](https://github.com/ggerganov/whisper.cpp), [Kotoba-Whisper](https://huggingface.co/kotoba-tech/kotoba-whisper-v2.0-ggml), [sherpa-onnx](https://github.com/k2-fsa/sherpa-onnx), and [Electron](https://www.electronjs.org/).
