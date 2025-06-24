# 生产环境部署指南

## 图片文件服务问题修复

### 问题描述
在生产环境中，`/uploads/` 路径下的图片文件返回404错误，无法正常加载。

### 解决方案

#### 1. Next.js 配置修复
已在 `next.config.ts` 中添加了静态文件重写规则：

```typescript
async rewrites() {
  return [
    {
      source: '/uploads/:path*',
      destination: '/api/static/uploads/:path*',
    },
  ];
}
```

#### 2. 静态文件API路由
已创建 `src/app/api/static/uploads/[...path]/route.ts` 来处理静态文件访问：

- 安全检查：确保文件路径在uploads目录内
- 文件存在检查
- 正确的Content-Type设置
- 缓存头优化

#### 3. 生产环境部署建议

##### 选项A：使用Next.js内置静态文件服务（推荐）
```bash
# 1. 构建应用
npm run build

# 2. 启动生产服务器
npm run start

# 3. 确保uploads目录权限正确
chmod 755 public/uploads
chmod 644 public/uploads/*
```

##### 选项B：使用Nginx反向代理（高性能）
如果使用Nginx作为反向代理，添加以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 静态文件直接由Nginx提供
    location /uploads/ {
        alias /path/to/your/app/public/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 其他请求转发给Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. 环境变量配置
确保在生产环境中设置正确的环境变量：

```bash
# .env.production
NODE_ENV=production
JWT_SECRET=your-production-secret-key
DATABASE_URL=your-production-database-url
```

#### 5. 日志优化
已优化身份验证相关的日志输出，在生产环境中会减少日志量：

- 开发环境：显示详细日志
- 生产环境：只显示错误和重要信息

#### 6. 文件上传目录检查
确保uploads目录存在且有正确权限：

```bash
# 创建uploads目录（如果不存在）
mkdir -p public/uploads

# 设置正确权限
chmod 755 public/uploads

# 检查目录内容
ls -la public/uploads/
```

#### 7. 故障排除

##### 检查文件是否存在
```bash
# 检查特定文件是否存在
ls -la public/uploads/1750789673535_ow8j3j6csn.webp
```

##### 检查Next.js路由
```bash
# 测试API路由
curl http://your-domain.com/api/static/uploads/1750789673535_ow8j3j6csn.webp
```

##### 检查权限
```bash
# 检查文件权限
stat public/uploads/1750789673535_ow8j3j6csn.webp
```

#### 8. 性能优化建议

1. **使用CDN**：将静态文件上传到CDN服务
2. **压缩图片**：已实现自动WebP压缩
3. **缓存策略**：已设置1年缓存期
4. **监控文件大小**：限制单文件5MB

### 重新部署步骤

1. 停止当前服务
2. 拉取最新代码
3. 安装依赖：`npm install`
4. 构建应用：`npm run build`
5. 启动服务：`npm run start`
6. 测试图片加载：访问 `http://your-domain.com/uploads/test.webp`

### 验证修复

1. 打开浏览器开发者工具
2. 访问包含图片的页面
3. 检查Network标签，确认图片请求返回200状态码
4. 确认Console中没有404错误

### 注意事项

- 确保服务器有足够的存储空间
- 定期清理过期的上传文件
- 考虑实现文件备份策略
- 监控上传文件的总大小 