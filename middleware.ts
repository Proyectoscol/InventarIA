import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // El middleware de autenticación se maneja en las rutas API individuales
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"]
}

