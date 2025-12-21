import {
  successResponse,
  errorResponse,
  unauthorizedResponse
} from '@/service/response';
import { getUserPermissions } from '@/lib/server-permissions';
import { auth, verifyToken, getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    let session = null;

    // 首先尝试从 auth() 函数获取session（从cookies）
    try {
      session = await auth();
    } catch (error) {
      console.error('Error getting session from cookies:', error);
    }

    // 如果从cookies获取失败，尝试从Authorization header获取
    if (!session) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
          const user = verifyToken(token);
          if (user) {
            session = { user };
          }
        } catch (error) {
          console.error('Error verifying token from header:', error);
        }
      }
    }

    // 最后尝试从Request cookies中获取
    if (!session) {
      try {
        const user = getCurrentUser(request);
        if (user) {
          session = { user };
        }
      } catch (error) {
        console.error('Error getting user from request:', error);
      }
    }

    if (!session?.user) {
      return unauthorizedResponse('未登录');
    }
    const permissions = await getUserPermissions(session.user.id);
    return successResponse(permissions);
  } catch (error) {
    console.error('获取用户权限失败:', error);
    return errorResponse('获取权限失败');
  }
}
