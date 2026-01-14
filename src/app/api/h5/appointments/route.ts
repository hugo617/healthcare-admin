import { NextRequest } from 'next/server';
import { db } from '@/db';
import { serviceAppointments } from '@/db/schema';
import { eq, desc, and, gte } from 'drizzle-orm';
import { verifyH5Token } from '@/lib/h5-auth';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';

// GET /api/h5/appointments - 获取服务预约列表
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
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');

    // 构建查询条件
    const conditions = [
      eq(serviceAppointments.userId, user.id),
      eq(serviceAppointments.isDeleted, false)
    ];

    if (status) {
      conditions.push(eq(serviceAppointments.status, status));
    }

    if (startDate) {
      conditions.push(gte(serviceAppointments.appointmentDate, startDate));
    }

    const whereClause = and(...conditions);

    const appointments = await db
      .select()
      .from(serviceAppointments)
      .where(whereClause)
      .orderBy(
        desc(serviceAppointments.appointmentDate),
        desc(serviceAppointments.appointmentTime)
      )
      .limit(50);

    return successResponse(appointments);
  } catch (error) {
    console.error('获取服务预约失败:', error);
    return errorResponse('获取服务预约失败');
  }
}

// POST /api/h5/appointments - 创建服务预约
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
    const { appointmentDate, appointmentTime, serviceType, notes } = body;

    if (!appointmentDate || !appointmentTime || !serviceType) {
      return errorResponse('预约日期、时间和服务类型不能为空');
    }

    // 检查是否已存在同时间的预约
    const existing = await db
      .select()
      .from(serviceAppointments)
      .where(
        and(
          eq(serviceAppointments.userId, user.id),
          eq(serviceAppointments.appointmentDate, appointmentDate),
          eq(serviceAppointments.appointmentTime, appointmentTime),
          eq(serviceAppointments.isDeleted, false)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return errorResponse('该时间段已有预约，请选择其他时间');
    }

    const [newAppointment] = await db
      .insert(serviceAppointments)
      .values({
        userId: user.id,
        appointmentDate,
        appointmentTime,
        serviceType,
        notes: notes || '',
        status: 'pending',
        createdBy: user.id,
        updatedBy: user.id
      })
      .returning();

    return successResponse(newAppointment);
  } catch (error) {
    console.error('创建服务预约失败:', error);
    return errorResponse('创建服务预约失败');
  }
}
