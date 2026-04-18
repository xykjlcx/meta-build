import {
  type RoleVo,
  type UserVo,
  getGetDeptQueryKey,
  getGetRoleQueryKey,
  getGetUserQueryKey,
  useDeleteUserById,
  useGetDept,
  useGetRole,
  useGetUser,
  usePostUser,
  usePostUserByIdResetPassword,
  usePutUserById,
  usePutUserByIdRole,
} from '@mb/api-sdk';
import { useCurrentUser } from '@mb/app-shell';
import { NxTable, PageHeader } from '@mb/ui-patterns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mb/ui-primitives';
import { useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { findTreeNodeName, flattenDeptOptions, formatDateTime } from '../shared';

interface UserFormState {
  username: string;
  password: string;
  email: string;
  phone: string;
  nickname: string;
  deptId: string;
  status: string;
}

const PAGE_SIZE = 10;
const EMPTY_FORM: UserFormState = {
  username: '',
  password: '',
  email: '',
  phone: '',
  nickname: '',
  deptId: 'NONE',
  status: '1',
};

type FormErrors = Partial<Record<keyof UserFormState, string>>;

function buildUserFormState(user?: UserVo | null): UserFormState {
  if (!user) {
    return EMPTY_FORM;
  }

  return {
    username: user.username,
    password: '',
    email: user.email ?? '',
    phone: user.phone ?? '',
    nickname: user.nickname ?? '',
    deptId: user.deptId == null ? 'NONE' : String(user.deptId),
    status: String(user.status),
  };
}

function validateUserForm(
  form: UserFormState,
  editingUser: UserVo | null,
  t: ReturnType<typeof useTranslation>['t'],
): FormErrors {
  const errors: FormErrors = {};

  if (!editingUser && form.username.trim().length < 3) {
    errors.username = t('validation.username');
  }

  if (!editingUser && form.password.length < 8) {
    errors.password = t('validation.password');
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(form.email)) {
    errors.email = t('validation.email');
  }

  return errors;
}

function UserStatusBadge({
  status,
  t,
}: { status: number; t: ReturnType<typeof useTranslation>['t'] }) {
  if (status === 1) {
    return <Badge variant="default">{t('status.enabled')}</Badge>;
  }

  return <Badge variant="secondary">{t('status.disabled')}</Badge>;
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: P2 基线页集中承载列表与 3 个对话框动作
export function UserPage() {
  const { t } = useTranslation('iam');
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [page, setPage] = useState(1);
  const [editingUser, setEditingUser] = useState<UserVo | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<UserFormState>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [deletingUser, setDeletingUser] = useState<UserVo | null>(null);
  const [assigningUser, setAssigningUser] = useState<UserVo | null>(null);
  const [resettingUser, setResettingUser] = useState<UserVo | null>(null);
  const [roleSelectionCache, setRoleSelectionCache] = useState<Record<number, number[]>>({});
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [newPassword, setNewPassword] = useState('');

  const usersQuery = useGetUser({ page, size: PAGE_SIZE });
  const rolesQuery = useGetRole({ page: 1, size: 200 });
  const deptQuery = useGetDept();

  const createMutation = usePostUser();
  const updateMutation = usePutUserById();
  const deleteMutation = useDeleteUserById();
  const resetPasswordMutation = usePostUserByIdResetPassword();
  const assignRoleMutation = usePutUserByIdRole();

  const deptOptions = useMemo(() => flattenDeptOptions(deptQuery.data ?? []), [deptQuery.data]);

  const invalidateUserQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetUserQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetDeptQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetRoleQueryKey() }),
    ]);
  };

  const openCreateDialog = useCallback(() => {
    setEditingUser(null);
    setFormErrors({});
    setFormState(EMPTY_FORM);
    setFormOpen(true);
  }, []);

  const openEditDialog = useCallback((user: UserVo) => {
    setEditingUser(user);
    setFormErrors({});
    setFormState(buildUserFormState(user));
    setFormOpen(true);
  }, []);

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: 创建和编辑共用提交流程，分支可读性优先于过早拆分
  const submitForm = async () => {
    const errors = validateUserForm(formState, editingUser, t);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      if (editingUser) {
        await updateMutation.mutateAsync({
          id: editingUser.id,
          data: {
            email: formState.email || undefined,
            phone: formState.phone || undefined,
            nickname: formState.nickname || undefined,
            deptId: formState.deptId === 'NONE' ? undefined : Number(formState.deptId),
            status: Number(formState.status),
          },
        });
        toast.success(t('message.userUpdated'));
      } else {
        await createMutation.mutateAsync({
          data: {
            username: formState.username.trim(),
            password: formState.password,
            email: formState.email || undefined,
            phone: formState.phone || undefined,
            nickname: formState.nickname || undefined,
            deptId: formState.deptId === 'NONE' ? undefined : Number(formState.deptId),
          },
        });
        toast.success(t('message.userCreated'));
      }

      await invalidateUserQueries();
      setFormOpen(false);
    } catch {
      toast.error(t('message.actionFailed'));
    }
  };

  const submitDelete = async () => {
    if (!deletingUser) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id: deletingUser.id });
      toast.success(t('message.userDeleted'));
      await invalidateUserQueries();
      setDeletingUser(null);
    } catch {
      toast.error(t('message.actionFailed'));
    }
  };

  const openAssignDialog = useCallback(
    (user: UserVo) => {
      setAssigningUser(user);
      setSelectedRoleIds(roleSelectionCache[user.id] ?? []);
    },
    [roleSelectionCache],
  );

  const submitAssignRoles = async () => {
    if (!assigningUser) {
      return;
    }

    try {
      await assignRoleMutation.mutateAsync({
        id: assigningUser.id,
        data: { roleIds: selectedRoleIds },
      });
      setRoleSelectionCache((prev) => ({ ...prev, [assigningUser.id]: selectedRoleIds }));
      toast.success(t('message.roleAssigned'));
      setAssigningUser(null);
    } catch {
      toast.error(t('message.actionFailed'));
    }
  };

  const submitResetPassword = async () => {
    if (!resettingUser || newPassword.length < 8) {
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        id: resettingUser.id,
        data: { newPassword },
      });
      toast.success(t('message.passwordReset'));
      setResettingUser(null);
      setNewPassword('');
    } catch {
      toast.error(t('message.actionFailed'));
    }
  };

  const columns = useMemo<ColumnDef<UserVo>[]>(
    () => [
      {
        accessorKey: 'username',
        header: t('field.username'),
      },
      {
        accessorKey: 'nickname',
        header: t('field.nickname'),
        cell: ({ row }) => row.original.nickname ?? '-',
      },
      {
        id: 'deptName',
        header: t('field.dept'),
        cell: ({ row }) =>
          findTreeNodeName(deptQuery.data ?? [], row.original.deptId) ?? t('status.unassigned'),
      },
      {
        accessorKey: 'email',
        header: t('field.email'),
        cell: ({ row }) => row.original.email ?? '-',
      },
      {
        accessorKey: 'phone',
        header: t('field.phone'),
        cell: ({ row }) => row.original.phone ?? '-',
      },
      {
        accessorKey: 'status',
        header: t('field.status'),
        cell: ({ row }) => <UserStatusBadge status={row.original.status} t={t} />,
      },
      {
        accessorKey: 'updatedAt',
        header: t('field.updatedAt'),
        cell: ({ row }) => formatDateTime(row.original.updatedAt),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={t('action.more')}>
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currentUser.hasPermission('iam:user:update') && (
                <DropdownMenuItem onSelect={() => openEditDialog(row.original)}>
                  {t('action.edit')}
                </DropdownMenuItem>
              )}
              {currentUser.hasPermission('iam:user:assignRole') && (
                <DropdownMenuItem onSelect={() => openAssignDialog(row.original)}>
                  {t('action.assignRole')}
                </DropdownMenuItem>
              )}
              {currentUser.hasPermission('iam:user:resetPassword') && (
                <DropdownMenuItem
                  onSelect={() => {
                    setResettingUser(row.original);
                    setNewPassword('');
                  }}
                >
                  {t('action.resetPassword')}
                </DropdownMenuItem>
              )}
              {currentUser.hasPermission('iam:user:delete') && (
                <DropdownMenuItem onSelect={() => setDeletingUser(row.original)}>
                  {t('action.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [currentUser, deptQuery.data, openAssignDialog, openEditDialog, t],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title.user')}
        description={t('description.user')}
        actions={
          currentUser.hasPermission('iam:user:create') ? (
            <Button onClick={openCreateDialog}>
              <Plus className="size-4" />
              {t('action.create')}
            </Button>
          ) : undefined
        }
      />

      <NxTable
        data={usersQuery.data?.content ?? []}
        columns={columns}
        loading={usersQuery.isLoading}
        emptyText={t('empty.user')}
        getRowId={(row) => String(row.id)}
        pagination={{
          page: usersQuery.data?.page ?? page,
          size: usersQuery.data?.size ?? PAGE_SIZE,
          totalElements: usersQuery.data?.totalElements ?? 0,
          totalPages: usersQuery.data?.totalPages ?? 0,
        }}
        paginationInfoTemplate={t('pagination.info', {
          total: '{total}',
          page: '{page}',
          pages: '{pages}',
        })}
        previousLabel={t('pagination.prev')}
        nextLabel={t('pagination.next')}
        onPaginationChange={(next) => {
          if (next.page !== page) {
            setPage(next.page);
          }
        }}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t('dialog.editUserTitle') : t('dialog.createUserTitle')}
            </DialogTitle>
            <DialogDescription>{t('dialog.userDesc')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-username">{t('field.username')}</Label>
              <Input
                id="user-username"
                value={formState.username}
                disabled={Boolean(editingUser)}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, username: event.target.value }))
                }
              />
              {formErrors.username && (
                <p className="text-sm text-destructive">{formErrors.username}</p>
              )}
            </div>

            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="user-password">{t('field.password')}</Label>
                <Input
                  id="user-password"
                  type="password"
                  value={formState.password}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, password: event.target.value }))
                  }
                />
                {formErrors.password && (
                  <p className="text-sm text-destructive">{formErrors.password}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="user-nickname">{t('field.nickname')}</Label>
              <Input
                id="user-nickname"
                value={formState.nickname}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, nickname: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">{t('field.email')}</Label>
              <Input
                id="user-email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              {formErrors.email && <p className="text-sm text-destructive">{formErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-phone">{t('field.phone')}</Label>
              <Input
                id="user-phone"
                value={formState.phone}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t('field.dept')}</Label>
              <Select
                value={formState.deptId}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, deptId: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('status.unassigned')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{t('status.unassigned')}</SelectItem>
                  {deptOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {editingUser && (
              <div className="space-y-2">
                <Label>{t('field.status')}</Label>
                <Select
                  value={formState.status}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t('status.enabled')}</SelectItem>
                    <SelectItem value="0">{t('status.disabled')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button
              onClick={() => void submitForm()}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {editingUser ? t('action.save') : t('action.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assigningUser} onOpenChange={(open) => !open && setAssigningUser(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{t('dialog.assignRoleTitle')}</DialogTitle>
            <DialogDescription>{t('hint.roleAssignmentContract')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {(rolesQuery.data?.content ?? []).map((role: RoleVo) => (
              <div
                key={role.id}
                className="flex items-start gap-3 rounded-lg border px-3 py-3 hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedRoleIds.includes(role.id)}
                  onCheckedChange={(checked) => {
                    setSelectedRoleIds((prev) =>
                      checked ? [...prev, role.id] : prev.filter((id) => id !== role.id),
                    );
                  }}
                />
                <div className="space-y-1">
                  <div className="font-medium">{role.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {role.code}
                    {role.remark ? ` · ${role.remark}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigningUser(null)}>
              {t('action.cancel')}
            </Button>
            <Button
              onClick={() => void submitAssignRoles()}
              disabled={assignRoleMutation.isPending}
            >
              {t('action.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resettingUser} onOpenChange={(open) => !open && setResettingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog.resetPasswordTitle')}</DialogTitle>
            <DialogDescription>{t('hint.resetPassword')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="reset-password">{t('field.newPassword')}</Label>
            <Input
              id="reset-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResettingUser(null)}>
              {t('action.cancel')}
            </Button>
            <Button
              onClick={() => void submitResetPassword()}
              disabled={resetPasswordMutation.isPending || newPassword.length < 8}
            >
              {t('action.resetPassword')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteUserTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm.deleteUser', { name: deletingUser?.username ?? '-' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void submitDelete()}>
              {t('action.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
