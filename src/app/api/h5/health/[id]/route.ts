import { NextRequest } from 'next/server';
import { db } from '@/db';
import { healthRecords } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyH5Token } from '@/lib/h5-auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse
} from '@/service/response';

// GET /api/h5/health/[id] - 获取单条健康记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('h5_token')?.value;
    if (!token) {
      return unauthorizedResponse('未登录');
    }

    const user = verifyH5Token(token);
    if (!user) {
      return unauthorizedResponse('无效的登录信息');
    }

    const { id } = await params;
    const recordId = BigInt(id);

    const [record] = await db
      .select()
      .from(healthRecords)
      .where(
        and(
          eq(healthRecords.id, recordId),
          eq(healthRecords.userId, user.id),
          eq(healthRecords.isDeleted, false)
        )
      )
      .limit(1);

    if (!record) {
      return notFoundResponse('健康记录不存在');
    }

    return successResponse(record);
  } catch (error) {
    console.error('获取健康记录失败:', error);
    return errorResponse('获取健康记录失败');
  }
}

// PUT /api/h5/health/[id] - 更新健康记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('h5_token')?.value;
    if (!token) {
      return unauthorizedResponse('未登录');
    }

    const user = verifyH5Token(token);
    if (!user) {
      return unauthorizedResponse('无效的登录信息');
    }

    const { id } = await params;
    const recordId = BigInt(id);

    // 检查记录是否存在且属于当前用户
    const [existing] = await db
      .select()
      .from(healthRecords)
      .where(
        and(
          eq(healthRecords.id, recordId),
          eq(healthRecords.userId, user.id),
          eq(healthRecords.isDeleted, false)
        )
      )
      .limit(1);

    if (!existing) {
      return notFoundResponse('健康记录不存在');
    }

    const body = await request.json();
    const { bloodPressure, bloodSugar, heartRate, weight, temperature, notes } =
      body;

    const [updatedRecord] = await db
      .update(healthRecords)
      .set({
        bloodPressure:
          bloodPressure !== undefined ? bloodPressure : existing.bloodPressure,
        bloodSugar: bloodSugar !== undefined ? bloodSugar : existing.bloodSugar,
        heartRate: heartRate !== undefined ? heartRate : existing.heartRate,
        weight: weight !== undefined ? weight : existing.weight,
        temperature:
          temperature !== undefined ? temperature : existing.temperature,
        notes: notes !== undefined ? notes : existing.notes,
        updatedBy: user.id,
        updatedAt: new Date()
      })
      .where(eq(healthRecords.id, recordId))
      .returning();

    return successResponse(updatedRecord);
  } catch (error) {
    console.error('更新健康记录失败:', error);
    return errorResponse('更新健康记录失败');
  }
}

// DELETE /api/h5/health/[id] - 删除健康记录（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('h5_token')?.value;
    if (!token) {
      return unauthorizedResponse('未登录');
    }

    const user = verifyH5Token(token);
    if (!user) {
      return unauthorizedResponse('无效的登录信息');
    }

    const { id } = await params;
    const recordId = BigInt(id);

    // 检查记录是否存在且属于当前用户
    const [existing] = await db
      .select()
      .from(healthRecords)
      .where(
        and(
          eq(healthRecords.id, recordId),
          eq(healthRecords.userId, user.id),
          eq(healthRecords.isDeleted, false)
        )
      )
      .limit(1);

    if (!existing) {
      return notFoundResponse('健康记录不存在');
    }

    // 软删除
    await db
      .update(healthRecords)
      .set({
        isDeleted: true,
        deletedAt: new Date()
      })
      .where(eq(healthRecords.id, recordId));

    return successResponse(null);
  } catch (error) {
    console.error('删除健康记录失败:', error);
    return errorResponse('删除健康记录失败');
  }
}
