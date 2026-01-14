import { NextRequest } from 'next/server';
import { db } from '@/db';
import { healthRecords } from '@/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';
import { verifyH5Token } from '@/lib/h5-auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

// GET /api/h5/health - 获取健康记录列表
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('h5_token')?.value;
    if (!token) {
      return unauthorizedResponse('未登录');
    }

    const user = verifyH5Token(token);
    if (!user) {
      return unauthorizedResponse('无效的登录信息');
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 构建查询条件
    const conditions = [
      eq(healthRecords.userId, user.id),
      eq(healthRecords.isDeleted, false)
    ];

    if (startDate) {
      conditions.push(gte(healthRecords.recordDate, startDate));
    }

    if (endDate) {
      conditions.push(lte(healthRecords.recordDate, endDate));
    }

    const whereClause = and(...conditions);

    const records = await db
      .select()
      .from(healthRecords)
      .where(whereClause)
      .orderBy(desc(healthRecords.recordDate))
      .limit(100);

    return successResponse(records);
  } catch (error) {
    console.error('获取健康记录失败:', error);
    return errorResponse('获取健康记录失败');
  }
}

// POST /api/h5/health - 创建健康记录
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('h5_token')?.value;
    if (!token) {
      return unauthorizedResponse('未登录');
    }

    const user = verifyH5Token(token);
    if (!user) {
      return unauthorizedResponse('无效的登录信息');
    }

    const body = await request.json();
    const {
      recordDate,
      bloodPressure,
      bloodSugar,
      heartRate,
      weight,
      temperature,
      notes
    } = body;

    if (!recordDate) {
      return errorResponse('记录日期不能为空');
    }

    // 检查是否已存在同日期记录
    const existing = await db
      .select()
      .from(healthRecords)
      .where(
        and(
          eq(healthRecords.userId, user.id),
          eq(healthRecords.recordDate, recordDate),
          eq(healthRecords.isDeleted, false)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return errorResponse('该日期的健康记录已存在，请使用编辑功能');
    }

    const [newRecord] = await db
      .insert(healthRecords)
      .values({
        userId: user.id,
        recordDate,
        bloodPressure: bloodPressure || {},
        bloodSugar: bloodSugar || {},
        heartRate: heartRate || null,
        weight: weight || {},
        temperature: temperature || {},
        notes: notes || '',
        createdBy: user.id,
        updatedBy: user.id
      })
      .returning();

    return successResponse(newRecord);
  } catch (error) {
    console.error('创建健康记录失败:', error);
    return errorResponse('创建健康记录失败');
  }
}
