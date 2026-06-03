import { NextRequest, NextResponse } from 'next/server';

function backendBase() {
  return (process.env.BACKEND_URL ?? 'http://localhost:4000').replace(/\/$/, '');
}

async function forward(req: NextRequest, pathSegments: string[]) {
  const path = pathSegments.join('/');
  const target = `${backendBase()}/${path}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.text();
  }

  const res = await fetch(target, init);
  const body = await res.text();
  const out = new NextResponse(body, { status: res.status });

  res.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'transfer-encoding') return;
    out.headers.set(key, value);
  });

  return out;
}

type RouteCtx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const { path } = await ctx.params;
  return forward(req, path);
}
