const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 开始初始化数据库...');

  try {
    // 检查数据库连接
    await prisma.$connect();
    console.log('✅ 数据库连接成功');

    // 创建默认用户
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        nickname: '管理员',
        email: 'admin@example.com',
        school: '示例大学',
        major: '计算机科学',
        grade: '2024',
        role: 'ADMIN',
        isVerified: true,
      },
    });

    console.log('✅ 默认管理员用户创建成功:', adminUser.username);
    console.log('🎉 数据库初始化完成！');
    console.log('');
    console.log('默认管理员账号:');
    console.log('用户名: admin');
    console.log('密码: admin123');
    console.log('');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 