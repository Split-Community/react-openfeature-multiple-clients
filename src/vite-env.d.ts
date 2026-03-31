/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Harness / Split browser SDK key (optional; otherwise set key in `openfeature-bootstrap.ts`). */
  readonly VITE_SPLIT_BROWSER_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
