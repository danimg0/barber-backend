import { NextRequest, NextResponse } from "next/server";

// const allowedOrigins = [
// cuidado que esta me va cambiando con cada push del main
// "https://vercel.com/danis-projects-5aeb92e7/barber-backend-vhfs/8E8Lqt9snCNrWag984oVhW2hudyD",
// "http://localhost:8081",
// "http://192.168.1.148:8081",
// ];

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function middleware(request: NextRequest) {
  // Check the origin from the request
  const origin = request.headers.get("origin") ?? "";
  // const isAllowedOrigin = allowedOrigins.includes(origin);

  // const isAllowedOrigin = true; // For simplicity, allow all origins in this example
  // const origin = request.headers.get("origin") || "*"; // Default to '*' if no origin is provided

  // Handle preflighted requests
  const isPreflight = request.method === "OPTIONS";

  if (isPreflight) {
    const preflightHeaders = {
      // ...(isAllowedOrigin && { "Access-Control-Allow-Origin": origin }),
      "Access-Control-Allow-Origin": "*",
      ...corsOptions,
    };
    return NextResponse.json({}, { headers: preflightHeaders });
  }

  // Handle simple requests
  const response = NextResponse.next();

  // if (isAllowedOrigin) {
  // response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Origin", "*");
  // }

  Object.entries(corsOptions).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: "/api/:path*",
};
