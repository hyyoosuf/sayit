import { useState, useEffect } from 'react'

interface User {
  id: string
  username: string
  nickname?: string
  avatar?: string
  email?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 检查 localStorage 中的用户数据
        const userData = localStorage.getItem('user')
        if (!userData) {
          if (process.env.NODE_ENV === 'development') {
            console.log('未找到本地用户数据，用户为游客状态')
          }
          setLoading(false)
          return
        }

        const parsedUser = JSON.parse(userData)
        
        // 验证服务端的认证状态
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          credentials: 'include', // 包含 cookie
        })

        if (response.ok) {
          // 认证有效，设置用户数据
          setUser(parsedUser)
          if (process.env.NODE_ENV === 'development') {
            console.log('身份验证成功，用户已登录:', parsedUser.username)
          }
        } else {
          // 认证失败，清除本地数据，用户变为游客状态
          if (process.env.NODE_ENV === 'development') {
            console.log('身份验证失败，用户将以游客身份浏览')
          }
          localStorage.removeItem('user')
          setUser(null)
        }
      } catch (error) {
        console.error('验证认证状态时发生错误:', error)
        
        // 网络错误时，检查是否有本地数据，如果没有则保持游客状态
        const userData = localStorage.getItem('user')
        if (userData) {
          try {
            const parsedUser = JSON.parse(userData)
            setUser(parsedUser)
            if (process.env.NODE_ENV === 'development') {
              console.log('由于网络错误，保持本地登录状态')
            }
          } catch (parseError) {
            console.error('解析用户数据失败:', parseError)
            localStorage.removeItem('user')
            setUser(null)
          }
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('网络错误且无本地数据，用户为游客状态')
          }
        }
      } finally {
        setLoading(false)
      }
    }

    checkAuthStatus()
  }, [])

  const updateUser = (userData: User | null) => {
    setUser(userData)
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData))
      if (process.env.NODE_ENV === 'development') {
        console.log('用户状态已更新:', userData.username)
      }
    } else {
      localStorage.removeItem('user')
      if (process.env.NODE_ENV === 'development') {
        console.log('用户已退出登录')
      }
    }
  }

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      })
      console.log('退出登录响应:', response.status)
    } catch (error) {
      console.error('退出登录失败:', error)
    } finally {
      updateUser(null)
    }
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    updateUser,
    logout
  }
} 