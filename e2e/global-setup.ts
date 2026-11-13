import { request } from '@playwright/test';

export default async function globalSetup(): Promise<void> {
  const healthUrl = 'http://localhost:5000/api/system/config';
  const apiRequest = await request.newContext({ timeout: 10_000 });

  try {
    const response = await apiRequest.get(healthUrl);
    if (!response.ok()) {
      throw new Error(`The backend health check returned HTTP ${response.status()}.`);
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `The Flask backend is not available at ${healthUrl}. Start it in the backend repository with "flask run", then retry. ${detail}`,
    );
  } finally {
    await apiRequest.dispose();
  }
}
