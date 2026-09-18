export type DifyConfig = {
  apiUrl: string;
  apiKey: string | null;
  configured: boolean;
};

export function getDifyConfig(): DifyConfig {
  const apiUrl = (process.env.DIFY_API_URL?.trim() || "https://api.dify.ai/v1").replace(/\/+$/, "");
  const apiKey = process.env.DIFY_API_KEY?.trim() || null;

  return {
    apiUrl,
    apiKey,
    configured: Boolean(apiKey),
  };
}

export function getDifyUserId(userId: string) {
  return `sifcas:${userId}`;
}
