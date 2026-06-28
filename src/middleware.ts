import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  })

  const isAuth = !!token
  const pathname = req.nextUrl.pathname
  const isProtected = ['/app', '/dashboard', '/settings'].some(p => pathname.startsWith(p))

  if (isProtected && !isAuth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/app/:path*', '/dashboard/:path*', '/settings/:path*'],
}
