import { NextRequest, NextResponse } from 'next/server'

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
  // const allCookies = request.cookies.getAll()

  console.log('中间件检查路径:', pathname, '- Token存在:', !!token)
  if (token) {
    console.log('中间件: Token前8位:', token.substring(0, 8) + '...')
  }
  // console.log('中间件: 所有Cookie:', allCookies.map(c => `${c.name}=${c.value ? c.value.substring(0, 8) + '...' : 'empty'}`).join(', '))

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

  // 简化的token检查：如果有token，我们假设它可能有效
  // 详细的JWT验证将在各个API端点中进行（使用Node.js Runtime）
  if (token) {
    console.log('中间件: 找到token，允许继续（详细验证将在API中进行）')
    
    // 如果已登录用户访问仅客人页面（如登录、注册），重定向到首页
    if (isGuestOnlyPath) {
      console.log('中间件: 已登录用户访问客人页面，重定向到首页')
      return NextResponse.redirect(new URL('/', request.url))
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