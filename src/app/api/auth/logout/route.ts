import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: '退出登录成功'
    })

    // 清除 Cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0 // 立即过期
    })

    return response

  } catch (error) {
    console.error('退出登录失败:', error)
    return NextResponse.json(
      { success: false, message: '退出登录失败' },
      { status: 500 }
    )
  }
} 