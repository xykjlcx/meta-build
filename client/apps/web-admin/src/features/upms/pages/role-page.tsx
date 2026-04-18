import {
  type MenuVo,
  type RoleVo,
  getGetMenuQueryKey,
  getGetRoleQueryKey,
  useDeleteRoleById,
  useGetMenu,
  useGetRole,
  usePostRole,
  usePutRoleById,
  usePutRoleByIdMenu,
} from '@mb/api-sdk';
import { useCurrentUser } from '@mb/app-shell';
import { NxTable, NxTree, PageHeader } from '@mb/ui-patterns';
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
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { buildExpandedIds, formatDateTime } from '../shared';

interface RoleFormState {
  name: string;
  code: string;
  dataScope: string;
  remark: string;
  sortOrder: string;
  status: string;
}

interface RoleMenuTreeNode {
  id: string;
  raw: MenuVo;
  children: RoleMenuTreeNode[];
}

const PAGE_SIZE = 10;
const EMPTY_FORM: RoleFormState = {
  name: '',
  code: '',
  dataScope: 'SELF',
  remark: '',
  sortOrder: '1',
  status: '1',
};

function buildRoleFormState(role?: RoleVo | null): RoleFormState {
  if (!role) {
    return EMPTY_FORM;
  }

  return {
    name: role.name,
    code: role.code,
    dataScope: role.dataScope ?? 'SELF',
    remark: role.remark ?? '',
    sortOrder: String(role.sortOrder ?? 1),
    status: String(role.status),
  };
}

function RoleStatusBadge({
  status,
  t,
}: { status: number; t: ReturnType<typeof useTranslation>['t'] }) {
  if (status === 1) {
    return <Badge variant="default">{t('status.enabled')}</Badge>;
  }

  return <Badge variant="secondary">{t('status.disabled')}</Badge>;
}

function getDataScopeLabel(scope: string | null, t: ReturnType<typeof useTranslation>['t']) {
  if (scope === 'ALL') {
    return t('role.dataScope.all');
  }
  if (scope === 'DEPT') {
    return t('role.dataScope.dept');
  }
  return t('role.dataScope.self');
}

export function RolePage() {
  const { t } = useTranslation('iam');
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [page, setPage] = useState(1);
  const [editingRole, setEditingRole] = useState<RoleVo | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formState, setFormState] = useState<RoleFormState>(EMPTY_FORM);
  const [deletingRole, setDeletingRole] = useState<RoleVo | null>(null);
  const [assigningRole, setAssigningRole] = useState<RoleVo | null>(null);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
  const [menuSelectionCache, setMenuSelectionCache] = useState<Record<number, number[]>>({});

  const rolesQuery = useGetRole({ page, size: PAGE_SIZE });
  const menuQuery = useGetMenu();
  const createMutation = usePostRole();
  const updateMutation = usePutRoleById();
  const deleteMutation = useDeleteRoleById();
  const assignMenuMutation = usePutRoleByIdMenu();

  const expandedIds = useMemo(() => buildExpandedIds(menuQuery.data ?? []), [menuQuery.data]);
  const treeData = useMemo(
    () =>
      (menuQuery.data ?? []).map(function toTree(node): RoleMenuTreeNode {
        return {
          id: String(node.id),
          raw: node,
          children: node.children.map(toTree),
        };
      }),
    [menuQuery.data],
  );

  const invalidateRoleQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetRoleQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetMenuQueryKey() }),
    ]);
  };

  const submitForm = async () => {
    try {
      if (editingRole) {
        await updateMutation.mutateAsync({
          id: editingRole.id,
          data: {
            name: formState.name.trim(),
            dataScope: formState.dataScope,
            remark: formState.remark || undefined,
            status: Number(formState.status),
            sortOrder: Number(formState.sortOrder),
          },
        });
        toast.success(t('message.roleUpdated'));
      } else {
        await createMutation.mutateAsync({
          data: {
            name: formState.name.trim(),
            code: formState.code.trim(),
            dataScope: formState.dataScope,
            remark: formState.remark || undefined,
            sortOrder: Number(formState.sortOrder),
          },
        });
        toast.success(t('message.roleCreated'));
      }

      await invalidateRoleQueries();
      setFormOpen(false);
    } catch {
      toast.error(t('message.actionFailed'));
    }
  };

  const submitDelete = async () => {
    if (!deletingRole) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id: deletingRole.id });
      toast.success(t('message.roleDeleted'));
      await invalidateRoleQueries();
      setDeletingRole(null);
    } catch {
      toast.error(t('message.actionFailed'));
    }
  };

  const submitAssignMenus = async () => {
    if (!assigningRole) {
      return;
    }

    try {
      await assignMenuMutation.mutateAsync({
        id: assigningRole.id,
        data: selectedMenuIds,
      });
      setMenuSelectionCache((prev) => ({ ...prev, [assigningRole.id]: selectedMenuIds }));
      toast.success(t('message.menuAssigned'));
      setAssigningRole(null);
    } catch {
      toast.error(t('message.actionFailed'));
    }
  };

  const columns = useMemo<ColumnDef<RoleVo>[]>(
    () => [
      {
        accessorKey: 'name',
        header: t('field.roleName'),
      },
      {
        accessorKey: 'code',
        header: t('field.roleCode'),
      },
      {
        accessorKey: 'dataScope',
        header: t('field.dataScope'),
        cell: ({ row }) => getDataScopeLabel(row.original.dataScope, t),
      },
      {
        accessorKey: 'status',
        header: t('field.status'),
        cell: ({ row }) => <RoleStatusBadge status={row.original.status} t={t} />,
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
              {currentUser.hasPermission('iam:role:update') && (
                <DropdownMenuItem
                  onSelect={() => {
                    setEditingRole(row.original);
                    setFormState(buildRoleFormState(row.original));
                    setFormOpen(true);
                  }}
                >
                  {t('action.edit')}
                </DropdownMenuItem>
              )}
              {currentUser.hasPermission('iam:role:assignMenu') && (
                <DropdownMenuItem
                  onSelect={() => {
                    setAssigningRole(row.original);
                    setSelectedMenuIds(menuSelectionCache[row.original.id] ?? []);
                  }}
                >
                  {t('action.assignMenu')}
                </DropdownMenuItem>
              )}
              {currentUser.hasPermission('iam:role:delete') && (
                <DropdownMenuItem onSelect={() => setDeletingRole(row.original)}>
                  {t('action.delete')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [currentUser, menuSelectionCache, t],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title.role')}
        description={t('description.role')}
        actions={
          currentUser.hasPermission('iam:role:create') ? (
            <Button
              onClick={() => {
                setEditingRole(null);
                setFormState(EMPTY_FORM);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              {t('action.create')}
            </Button>
          ) : undefined
        }
      />

      <NxTable
        data={rolesQuery.data?.content ?? []}
        columns={columns}
        loading={rolesQuery.isLoading}
        emptyText={t('empty.role')}
        getRowId={(row) => String(row.id)}
        pagination={{
          page: rolesQuery.data?.page ?? page,
          size: rolesQuery.data?.size ?? PAGE_SIZE,
          totalElements: rolesQuery.data?.totalElements ?? 0,
          totalPages: rolesQuery.data?.totalPages ?? 0,
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
              {editingRole ? t('dialog.editRoleTitle') : t('dialog.createRoleTitle')}
            </DialogTitle>
            <DialogDescription>{t('dialog.roleDesc')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="role-name">{t('field.roleName')}</Label>
              <Input
                id="role-name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-code">{t('field.roleCode')}</Label>
              <Input
                id="role-code"
                value={formState.code}
                disabled={Boolean(editingRole)}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t('field.dataScope')}</Label>
              <Select
                value={formState.dataScope}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, dataScope: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">{t('role.dataScope.all')}</SelectItem>
                  <SelectItem value="DEPT">{t('role.dataScope.dept')}</SelectItem>
                  <SelectItem value="SELF">{t('role.dataScope.self')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-sort">{t('field.sortOrder')}</Label>
              <Input
                id="role-sort"
                type="number"
                value={formState.sortOrder}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, sortOrder: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="role-remark">{t('field.remark')}</Label>
              <Input
                id="role-remark"
                value={formState.remark}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, remark: event.target.value }))
                }
              />
            </div>

            {editingRole && (
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
              {editingRole ? t('action.save') : t('action.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assigningRole} onOpenChange={(open) => !open && setAssigningRole(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('dialog.assignMenuTitle')}</DialogTitle>
            <DialogDescription>{t('hint.menuAssignmentContract')}</DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto rounded-lg border px-3 py-3">
            <NxTree<RoleMenuTreeNode>
              data={treeData}
              expandedIds={expandedIds}
              emptyText={t('empty.menu')}
              renderNode={(node) => {
                const originalId = Number(node.id);
                const checked = selectedMenuIds.includes(originalId);

                return (
                  <div className="flex items-center gap-3 py-1">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) => {
                        setSelectedMenuIds((prev) =>
                          next ? [...prev, originalId] : prev.filter((id) => id !== originalId),
                        );
                      }}
                    />
                    <span className="font-medium">{node.raw.name}</span>
                    <Badge variant="secondary">{node.raw.menuType}</Badge>
                  </div>
                );
              }}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigningRole(null)}>
              {t('action.cancel')}
            </Button>
            <Button
              onClick={() => void submitAssignMenus()}
              disabled={assignMenuMutation.isPending}
            >
              {t('action.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingRole} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteRoleTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm.deleteRole', { name: deletingRole?.name ?? '-' })}
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
