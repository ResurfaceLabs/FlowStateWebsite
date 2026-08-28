/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SHEETS_ENDPOINT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
