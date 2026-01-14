import { NextRequest } from 'next/server';
import { db } from '@/db';
import { serviceAppointments } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyH5Token } from '@/lib/h5-auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  notFoundResponse
} from '@/service/response';

// PUT /api/h5/appointments/[id] - 更新服务预约
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
    const appointmentId = BigInt(id);

    // 检查预约是否存在且属于当前用户
    const [existing] = await db
      .select()
      .from(serviceAppointments)
      .where(
        and(
          eq(serviceAppointments.id, appointmentId),
          eq(serviceAppointments.userId, user.id),
          eq(serviceAppointments.isDeleted, false)
        )
      )
      .limit(1);

    if (!existing) {
      return notFoundResponse('预约不存在');
    }

    const body = await request.json();
    const { status, notes } = body;

    const [updatedAppointment] = await db
      .update(serviceAppointments)
      .set({
        status: status || existing.status,
        notes: notes !== undefined ? notes : existing.notes,
        updatedBy: user.id,
        updatedAt: new Date()
      })
      .where(eq(serviceAppointments.id, appointmentId))
      .returning();

    return successResponse(updatedAppointment);
  } catch (error) {
    console.error('更新服务预约失败:', error);
    return errorResponse('更新服务预约失败');
  }
}

// DELETE /api/h5/appointments/[id] - 取消服务预约（软删除）
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
    const appointmentId = BigInt(id);

    // 检查预约是否存在且属于当前用户
    const [existing] = await db
      .select()
      .from(serviceAppointments)
      .where(
        and(
          eq(serviceAppointments.id, appointmentId),
          eq(serviceAppointments.userId, user.id),
          eq(serviceAppointments.isDeleted, false)
        )
      )
      .limit(1);

    if (!existing) {
      return notFoundResponse('预约不存在');
    }

    // 软删除
    await db
      .update(serviceAppointments)
      .set({
        isDeleted: true,
        deletedAt: new Date()
      })
      .where(eq(serviceAppointments.id, appointmentId));

    return successResponse(null);
  } catch (error) {
    console.error('取消服务预约失败:', error);
    return errorResponse('取消服务预约失败');
  }
}
