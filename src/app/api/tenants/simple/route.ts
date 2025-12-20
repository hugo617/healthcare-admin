import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tenants } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // 获取所有租户，不包含复杂的权限检查
    const allTenants = await db.select().from(tenants);

    // 序列化 BigInt
    const serializedTenants = allTenants.map(tenant => ({
      ...tenant,
      id: tenant.id.toString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        tenants: serializedTenants,
        total: serializedTenants.length,
        message: '获取租户列表成功（简化版）'
      }
    });
  } catch (error) {
    console.error('Simple tenant list failed:', error);
    return NextResponse.json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}