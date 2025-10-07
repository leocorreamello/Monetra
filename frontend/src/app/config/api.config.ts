type EnvConfig = {
  NG_APP_API_BASE_URL?: string;
};

const runtimeConfig: EnvConfig =
  (globalThis as { __env?: EnvConfig }).__env ?? {};

const rawBaseUrl = (runtimeConfig.NG_APP_API_BASE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  ''
);

export const API_BASE_URL = rawBaseUrl;
