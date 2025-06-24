import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { authenticateRequest, getClientIP, logSecurityEvent } from '@/lib/auth'

// 支持的图片格式
const ALLOWED_TYPES = ['jpg', 'jpeg', 'png', 'webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request)
    
    // 服务端认证验证
    const { isAuthenticated, user } = authenticateRequest(request)
    
    if (!isAuthenticated || !user) {
      logSecurityEvent('UNAUTHORIZED_UPLOAD_ATTEMPT', { endpoint: '/api/upload' }, clientIP)
      return NextResponse.json(
        { success: false, message: '请先登录' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, message: '请选择要上传的文件' },
        { status: 400 }
      )
    }

    // 限制文件数量
    if (files.length > 9) {
      logSecurityEvent('TOO_MANY_FILES_UPLOAD', { 
        userId: user.userId,
        fileCount: files.length 
      }, clientIP)
      return NextResponse.json(
        { success: false, message: '最多只能上传9张图片' },
        { status: 400 }
      )
    }

    const uploadedUrls: string[] = []
    const uploadDir = join(process.cwd(), 'public', 'uploads')

    // 确保上传目录存在
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch {
      // 目录已存在或其他错误，继续执行
    }

    for (const file of files) {
      // 验证文件类型
      const fileName = file.name.toLowerCase()
      const fileExtension = fileName.split('.').pop()
      
      console.log('上传文件详情:', {
        name: file.name,
        type: file.type,
        size: file.size,
        extension: fileExtension
      })
      
      if (!fileExtension || !ALLOWED_TYPES.includes(fileExtension)) {
        logSecurityEvent('INVALID_FILE_TYPE', { 
          userId: user.userId,
          fileName: file.name,
          fileType: fileExtension 
        }, clientIP)
        return NextResponse.json(
          { success: false, message: `不支持的文件格式。支持格式：${ALLOWED_TYPES.join(', ')}` },
          { status: 400 }
        )
      }
      
      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        logSecurityEvent('FILE_TOO_LARGE', { 
          userId: user.userId,
          fileName: file.name,
          fileSize: file.size 
        }, clientIP)
        return NextResponse.json(
          { success: false, message: `文件 ${file.name} 超过5MB限制` },
          { status: 400 }
        )
      }

      // 生成唯一文件名
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 15)
      const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`
      
      // 转换文件为Buffer并保存
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      const filePath = join(uploadDir, uniqueFileName)
      await writeFile(filePath, buffer)
      
      // 生成访问URL
      const fileUrl = `/uploads/${uniqueFileName}`
      uploadedUrls.push(fileUrl)
    }

    // 记录上传成功
    logSecurityEvent('FILES_UPLOADED', { 
      userId: user.userId,
      fileCount: files.length,
      fileUrls: uploadedUrls
    }, clientIP)

    return NextResponse.json({
      success: true,
      message: `成功上传 ${files.length} 张图片`,
      urls: uploadedUrls
    })

  } catch (error) {
    const clientIP = getClientIP(request)
    console.error('文件上传失败:', error)
    logSecurityEvent('UPLOAD_ERROR', { error: error instanceof Error ? error.message : 'unknown' }, clientIP)
    
    return NextResponse.json(
      { success: false, message: '文件上传失败，请重试' },
      { status: 500 }
    )
  }
} 