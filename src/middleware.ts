import { NextRequest, NextResponse } from 'next/server'
import { verifyTokenCached } from '@/lib/auth'

// 需要登录才能访问的路径（写权限）
const protectedPaths = [
  '/confessions/create',
  '/posts/create', 
  '/market/create',
  '/tasks/create',
  '/dashboard',
  '/profile'
]

// 需要登录才能访问的 API 路径（写操作）
const protectedApiPaths = [
  '/api/confessions/create',
  '/api/posts/create',
  '/api/market/create', 
  '/api/tasks/create',
  '/api/comments/create',
  '/api/likes/toggle'
]

// 仅登录用户不能访问的路径（如登录、注册页面）
const guestOnlyPaths = [
  '/login',
  '/register'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  console.log('中间件检查路径:', pathname, '- Token存在:', !!token)

  // 检查是否为受保护的路径
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path))
  const isProtectedApiPath = protectedApiPaths.some(path => pathname.startsWith(path))
  const isGuestOnlyPath = guestOnlyPaths.some(path => pathname.startsWith(path))

  // 如果是受保护的路径且没有 token，重定向到登录页
  if ((isProtectedPath || isProtectedApiPath) && !token) {
    console.log('中间件: 没有token，阻止访问受保护路径')
    if (isProtectedApiPath) {
      // API 路径返回 401 未授权
      return new NextResponse(
        JSON.stringify({ error: '请先登录' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 对于guest-only路径，需要验证token的有效性
  if (token && isGuestOnlyPath) {
    try {
      // 验证token是否真的有效
      const payload = verifyTokenCached(token)
      if (payload) {
        console.log('中间件: 有效token用户访问客人页面，重定向到首页')
        return NextResponse.redirect(new URL('/', request.url))
      } else {
        console.log('中间件: token无效，允许访问客人页面')
        // token无效，清除cookie并允许访问登录页
        const response = NextResponse.next()
        response.cookies.set('auth-token', '', {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 0,
          path: '/'
        })
        return response
      }
    } catch (error) {
      console.error('中间件: token验证失败', error)
      // token验证失败，清除cookie并允许访问登录页
      const response = NextResponse.next()
      response.cookies.set('auth-token', '', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 0,
        path: '/'
      })
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // 匹配所有路径，除了以下路径
    '/((?!api|_next/static|_next/image|favicon.ico|uploads).*)',
  ],
} 