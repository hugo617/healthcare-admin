/**
 * 权限模板管理对话框组件
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import {
  Copy,
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Loader2,
  X,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { PermissionSelector } from './PermissionSelector';
import type {
  PermissionTemplate,
  Permission
} from '@/app/admin/dashboard/account/permission/types';
import { apiRequest } from '@/service/api/base';

interface PermissionTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onApplyTemplate?: (template: PermissionTemplate) => void;
}

interface TemplateFormData {
  name: string;
  description: string;
  permissionIds: number[];
}

export function PermissionTemplateDialog({
  open,
  onClose,
  onApplyTemplate
}: PermissionTemplateDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] =
    useState<PermissionTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<PermissionTemplate | null>(null);
  const [deleteConfirmTemplate, setDeleteConfirmTemplate] =
    useState<PermissionTemplate | null>(null);

  // 表单状态
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    permissionIds: []
  });
  const [submitting, setSubmitting] = useState(false);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);

  // 加载模板列表
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/permission-templates');

      if (data.code === 0) {
        setTemplates(data.data || []);
      } else {
        toast.error(data.message || '获取模板列表失败');
      }
    } catch (error) {
      toast.error('获取模板列表失败');
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取所有权限（用于选择）
  const fetchAllPermissions = useCallback(async () => {
    try {
      const data = await apiRequest('/permissions/all');
      if (data.code === 0) {
        setAllPermissions(data.data || []);
      }
    } catch (error) {
      console.error('获取权限列表失败:', error);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchTemplates();
      fetchAllPermissions();
    }
  }, [open, fetchTemplates, fetchAllPermissions]);

  // 重置表单
  const resetForm = () => {
    setFormData({ name: '', description: '', permissionIds: [] });
    setEditingTemplate(null);
    setShowCreateForm(false);
  };

  // 打开创建表单
  const handleOpenCreateForm = () => {
    resetForm();
    setShowCreateForm(true);
  };

  // 打开编辑表单
  const handleEditTemplate = async (template: PermissionTemplate) => {
    try {
      const data = await apiRequest(`/permission-templates/${template.id}`);

      if (data.code === 0) {
        setFormData({
          name: data.data.name,
          description: data.data.description || '',
          permissionIds: data.data.permissionIds || []
        });
        setEditingTemplate(data.data);
        setShowCreateForm(true);
      } else {
        toast.error(data.message || '获取模板详情失败');
      }
    } catch (error) {
      toast.error('获取模板详情失败');
    }
  };

  // 预览模板
  const handlePreviewTemplate = async (template: PermissionTemplate) => {
    try {
      const data = await apiRequest(`/permission-templates/${template.id}`);

      if (data.code === 0) {
        setPreviewTemplate(data.data);
      } else {
        toast.error(data.message || '获取模板详情失败');
      }
    } catch (error) {
      toast.error('获取模板详情失败');
    }
  };

  // 删除模板
  const handleDeleteTemplate = async (template: PermissionTemplate) => {
    try {
      const data = await apiRequest(`/permission-templates/${template.id}`, {
        method: 'DELETE'
      });

      if (data.code === 0) {
        toast.success('模板删除成功');
        fetchTemplates();
        setDeleteConfirmTemplate(null);
      } else {
        toast.error(data.message || '删除模板失败');
      }
    } catch (error) {
      toast.error('删除模板失败');
    }
  };

  // 提交表单
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('模板名称不能为空');
      return;
    }

    try {
      setSubmitting(true);

      const url = editingTemplate
        ? `/permission-templates/${editingTemplate.id}`
        : '/permission-templates';

      const method = editingTemplate ? 'PUT' : 'POST';

      const data = await apiRequest(url, {
        method,
        body: JSON.stringify(formData)
      });

      if (data.code === 0) {
        toast.success(editingTemplate ? '模板更新成功' : '模板创建成功');
        resetForm();
        fetchTemplates();
      } else {
        toast.error(data.message || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyTemplate = (template: PermissionTemplate) => {
    if (onApplyTemplate) {
      onApplyTemplate(template);
    }
    onClose();
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description?.toLowerCase().includes(searchQuery.toLowerCase()) ??
        false)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className='max-h-[80vh] max-w-4xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>权限模板管理</DialogTitle>
            <DialogDescription>
              选择预设模板快速分配权限，或创建自定义模板
            </DialogDescription>
          </DialogHeader>

          {!showCreateForm ? (
            <>
              {/* 搜索栏 */}
              <div className='flex items-center gap-2'>
                <div className='relative flex-1'>
                  <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                  <Input
                    placeholder='搜索模板...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-9'
                  />
                </div>
                <Button onClick={handleOpenCreateForm}>
                  <Plus className='mr-2 h-4 w-4' />
                  新建模板
                </Button>
              </div>

              {/* 模板列表 */}
              {loading ? (
                <div className='flex items-center justify-center py-12'>
                  <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
                </div>
              ) : filteredTemplates.length === 0 ? (
                <div className='text-muted-foreground py-12 text-center text-sm'>
                  {searchQuery ? '未找到匹配的模板' : '暂无权限模板'}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>模板名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>权限数量</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead className='text-center'>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell className='font-medium'>
                          {template.name}
                        </TableCell>
                        <TableCell className='text-muted-foreground text-sm'>
                          {template.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant='secondary'>
                            {template.permissionCount ||
                              template.permissionIds?.length ||
                              0}{' '}
                            个权限
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {template.isSystem ? (
                            <Badge variant='default' className='text-xs'>
                              系统
                            </Badge>
                          ) : (
                            <Badge variant='outline' className='text-xs'>
                              自定义
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className='flex justify-center gap-1'>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => handleApplyTemplate(template)}
                              title='应用模板'
                            >
                              <Copy className='h-4 w-4' />
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              onClick={() => handlePreviewTemplate(template)}
                              title='预览'
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                            {!template.isSystem && (
                              <>
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  onClick={() => handleEditTemplate(template)}
                                  title='编辑'
                                >
                                  <Edit className='h-4 w-4' />
                                </Button>
                                <Button
                                  size='sm'
                                  variant='ghost'
                                  className='text-destructive'
                                  onClick={() =>
                                    setDeleteConfirmTemplate(template)
                                  }
                                  title='删除'
                                >
                                  <Trash2 className='h-4 w-4' />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          ) : (
            <>
              {/* 创建/编辑表单 */}
              <div className='flex items-center justify-between'>
                <h3 className='text-lg font-semibold'>
                  {editingTemplate ? '编辑模板' : '新建模板'}
                </h3>
                <Button variant='ghost' size='sm' onClick={resetForm}>
                  <X className='h-4 w-4' />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='grid gap-2'>
                  <Label htmlFor='template-name'>模板名称 *</Label>
                  <Input
                    id='template-name'
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder='请输入模板名称'
                    required
                  />
                </div>

                <div className='grid gap-2'>
                  <Label htmlFor='template-desc'>描述</Label>
                  <Textarea
                    id='template-desc'
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder='请输入模板描述'
                    className='min-h-[80px] resize-none'
                  />
                </div>

                <div className='grid gap-2'>
                  <Label>选择权限 *</Label>
                  <PermissionSelector
                    value={formData.permissionIds}
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        permissionIds: val as number[]
                      })
                    }
                    mode='multiple'
                    placeholder='点击选择权限...'
                  />
                  {formData.permissionIds.length > 0 && (
                    <div className='mt-2'>
                      <div className='text-muted-foreground mb-2 flex items-center justify-between text-sm'>
                        <span>已选 {formData.permissionIds.length} 个权限</span>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='h-6 px-2 text-xs'
                          onClick={() =>
                            setFormData({ ...formData, permissionIds: [] })
                          }
                        >
                          清空
                        </Button>
                      </div>
                      <div className='bg-muted/50 max-h-32 space-y-1 overflow-y-auto rounded-md border p-2'>
                        {formData.permissionIds.map((id) => {
                          const perm = allPermissions.find((p) => p.id === id);
                          if (!perm) return null;
                          return (
                            <div
                              key={id}
                              className='bg-background flex items-center justify-between rounded px-2 py-1 text-sm'
                            >
                              <span className='font-medium'>{perm.name}</span>
                              <div className='flex items-center gap-2'>
                                <span className='text-muted-foreground font-mono text-xs'>
                                  {perm.code}
                                </span>
                                <X
                                  className='text-muted-foreground hover:text-foreground h-3 w-3 cursor-pointer'
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      permissionIds:
                                        formData.permissionIds.filter(
                                          (p) => p !== id
                                        )
                                    });
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className='flex justify-end gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    取消
                  </Button>
                  <Button type='submit' disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        提交中...
                      </>
                    ) : editingTemplate ? (
                      '更新'
                    ) : (
                      '创建'
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog
        open={!!previewTemplate}
        onOpenChange={() => setPreviewTemplate(null)}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>模板详情</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className='space-y-4'>
              <div>
                <Label className='text-muted-foreground text-sm'>
                  模板名称
                </Label>
                <p className='font-medium'>{previewTemplate.name}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-sm'>描述</Label>
                <p>{previewTemplate.description || '-'}</p>
              </div>
              <div>
                <Label className='text-muted-foreground text-sm'>
                  权限数量
                </Label>
                <p>
                  {previewTemplate.permissionCount ||
                    previewTemplate.permissionIds?.length ||
                    0}{' '}
                  个权限
                </p>
              </div>
              <div>
                <Label className='text-muted-foreground text-sm'>类型</Label>
                <p>{previewTemplate.isSystem ? '系统模板' : '自定义模板'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <AlertDialog
        open={!!deleteConfirmTemplate}
        onOpenChange={() => setDeleteConfirmTemplate(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除模板 "{deleteConfirmTemplate?.name}"
              吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteConfirmTemplate &&
                handleDeleteTemplate(deleteConfirmTemplate)
              }
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
