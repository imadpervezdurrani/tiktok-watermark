import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    framework: 'Next.js App Router (Serverless)',
    timestamp: new Date().toISOString(),
    security_shield: {
      anti_ssrf: 'Active',
      anti_injection: 'Active (Strict regex & execFile args)',
      anti_xss_csp: 'Active via next.config.js headers',
      vercel_ready: true
    }
  });
}
