import { NextRequest, NextResponse } from 'next/server'
import { fetchFeedDataParallel } from '@/lib/parallel-data-fetcher'
import { authenticateRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const category = url.searchParams.get('category') || 'all'

    // 获取用户信息（可选）
    const { user } = authenticateRequest(request)

    // 使用并行数据获取器
    const feedData = await fetchFeedDataParallel({
      page,
      limit,
      category: category !== 'all' ? category : undefined,
      userId: user?.userId
    })

    // 统一格式化所有内容项
    const feedItems = [
      // 格式化表白墙内容
      ...feedData.confessions.map((item: any) => ({
        id: item.id,
        type: 'confession' as const,
        title: '匿名表白',
        content: item.content,
        images: item.images,
        author: item.isAnonymous ? {
          id: 'anonymous',
          username: '匿名用户',
          nickname: '匿名用户',
          avatar: null
        } : item.author,
        createdAt: item.createdAt,
        stats: item.stats,
        isAnonymous: item.isAnonymous
      })),

      // 格式化校园圈帖子
      ...feedData.posts.map((item: any) => ({
        id: item.id,
        type: 'post' as const,
        title: item.title,
        content: item.content,
        images: item.images,
        category: item.category,
        tags: item.tags,
        author: item.author,
        createdAt: item.createdAt,
        stats: item.stats
      })),

      // 格式化跳蚤市场商品
      ...feedData.marketItems.map((item: any) => ({
        id: item.id,
        type: 'market' as const,
        title: item.title,
        content: item.description,
        images: item.images,
        price: item.price,
        category: item.category,
        condition: item.condition,
        location: item.location,
        author: item.seller,
        createdAt: item.createdAt,
        stats: item.stats
      })),

      // 格式化悬赏任务
      ...feedData.tasks.map((item: any) => ({
        id: item.id,
        type: 'task' as const,
        title: item.title,
        content: item.description,
        reward: item.reward,
        category: item.category,
        deadline: item.deadline,
        author: item.publisher,
        createdAt: item.createdAt,
        stats: item.stats
      }))
    ]

    // 按创建时间降序排列并分页
    const sortedItems = feedItems
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    // 计算总数
    const totalCount = feedItems.length

    return NextResponse.json({
      success: true,
      items: sortedItems,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('获取信息流失败:', error)
    return NextResponse.json(
      { error: '获取信息流失败' },
      { status: 500 }
    )
  }
} 