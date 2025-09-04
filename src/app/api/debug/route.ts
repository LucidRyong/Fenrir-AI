// 파일 경로: src/app/api/debug/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const projectId = process.env.GCP_PROJECT_ID || "GCP_PROJECT_ID: Not Found";
    const location = process.env.GCP_LOCATION || "GCP_LOCATION: Not Found";
    const endpointId = process.env.GCP_ENDPOINT_ID || "GCP_ENDPOINT_ID: Not Found";
    
    // GOOGLE_APPLICATION_CREDENTIALS 변수는 매우 길기 때문에, 앞 100글자만 확인합니다.
    const credsPreview = (process.env.GOOGLE_APPLICATION_CREDENTIALS || "CREDS: Not Found").substring(0, 100);

    return NextResponse.json({
      message: "Debug endpoint is working. Checking environment variables...",
      projectId: projectId,
      location: location,
      endpointId: endpointId,
      credentials_preview: `${credsPreview}... (truncated)`,
    });

  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred in the debug route.';
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}