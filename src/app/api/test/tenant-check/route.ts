import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // 简单检查租户表是否存在和是否有数据
    const tenantCount = await db.select({ count: sql`COUNT(*)` }).from(tenants);
    const defaultTenant = await db.select().from(tenants).where(eq(tenants.code, 'default')).limit(1);

    return NextResponse.json({
      success: true,
      data: {
        tenantCount: tenantCount[0]?.count || 0,
        defaultTenant: defaultTenant[0] || null,
        message: '租户数据库连接成功'
      }
    });
  } catch (error) {
    console.error('Tenant check failed:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}