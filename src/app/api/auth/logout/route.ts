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
      secure: false, // 在HTTP环境下设为false
      sameSite: 'lax',
      maxAge: 0, // 立即过期
      path: '/' // 确保在所有路径下都清除
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