import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/permission-guard';
import { PERMISSIONS } from '@/lib/permissions';
import { db } from '@/db';
import { tenants } from '@/db/schema';

/**
 * 导出租户数据 API
 * POST /api/tenants/export
 *
 * 支持的格式：
 * - csv: CSV 格式
 * - xlsx: Excel 格式 (TODO)
 */
export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.TENANT.READ, undefined, request);

    const body = await request.json();
    const { format = 'csv' } = body;

    // 验证格式
    const validFormats = ['csv', 'xlsx'];
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { code: -1, message: '不支持的导出格式' },
        { status: 400 }
      );
    }

    // 获取所有租户数据
    const allTenants = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        code: tenants.code,
        status: tenants.status,
        settings: tenants.settings,
        createdAt: tenants.createdAt,
        updatedAt: tenants.updatedAt
      })
      .from(tenants);

    if (format === 'csv') {
      // 生成 CSV 内容
      const headers = [
        'ID',
        '租户名称',
        '租户代码',
        '状态',
        '配置',
        '创建时间',
        '更新时间'
      ];
      const rows = allTenants.map((t) => [
        t.id.toString(),
        t.name,
        t.code,
        t.status === 'active'
          ? '正常'
          : t.status === 'inactive'
            ? '停用'
            : '暂停',
        JSON.stringify(t.settings || {}),
        t.createdAt ? new Date(t.createdAt).toLocaleString('zh-CN') : '',
        t.updatedAt ? new Date(t.updatedAt).toLocaleString('zh-CN') : ''
      ]);

      // 组合 CSV
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
      ].join('\n');

      // 添加 BOM 以支持中文
      const csvWithBOM = '\uFEFF' + csvContent;

      // 返回 CSV 文件
      return new NextResponse(csvWithBOM, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tenants_${Date.now()}.csv"`
        }
      });
    }

    // Excel 格式 (TODO: 实现导出为 .xlsx 格式)
    if (format === 'xlsx') {
      // 临时使用 CSV 格式作为 Excel 的替代方案
      const headers = [
        'ID',
        '租户名称',
        '租户代码',
        '状态',
        '配置',
        '创建时间',
        '更新时间'
      ];
      const rows = allTenants.map((t) => [
        t.id.toString(),
        t.name,
        t.code,
        t.status === 'active'
          ? '正常'
          : t.status === 'inactive'
            ? '停用'
            : '暂停',
        JSON.stringify(t.settings || {}),
        t.createdAt ? new Date(t.createdAt).toLocaleString('zh-CN') : '',
        t.updatedAt ? new Date(t.updatedAt).toLocaleString('zh-CN') : ''
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
      ].join('\n');

      const csvWithBOM = '\uFEFF' + csvContent;

      return new NextResponse(csvWithBOM, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="tenants_${Date.now()}.csv"`
        }
      });
    }

    return NextResponse.json(
      { code: -1, message: '不支持的导出格式' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[TENANT EXPORT] Error:', error);
    return NextResponse.json(
      {
        code: -1,
        message: error instanceof Error ? error.message : '导出失败'
      },
      { status: 500 }
    );
  }
}
