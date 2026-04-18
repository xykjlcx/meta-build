import {
  type DeptVo,
  type UserVo,
  getGetDeptQueryKey,
  useDeleteDeptById,
  useGetDept,
  useGetUser,
  usePostDept,
} from '@mb/api-sdk';
import { useCurrentUser } from '@mb/app-shell';
import { NxLoading, NxTree, PageHeader } from '@mb/ui-patterns';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@mb/ui-primitives';
import { useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { buildExpandedIds, flattenDeptOptions, formatDate } from '../shared';

interface DeptFormState {
  parentId: string;
  name: string;
  leaderUserId: string;
  sortOrder: string;
}

interface DeptTreeNode {
  id: string;
  raw: DeptVo;
  children: DeptTreeNode[];
}

const EMPTY_FORM: DeptFormState = {
  parentId: 'ROOT',
  name: '',
  leaderUserId: 'NONE',
  sortOrder: '1',
};

export function DeptPage() {
  const { t } = useTranslation('iam');
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<DeptVo | null>(null);
  const [deletingDept, setDeletingDept] = useState<DeptVo | null>(null);
  const [formState, setFormState] = useState<DeptFormState>(EMPTY_FORM);

  const deptQuery = useGetDept();
  const usersQuery = useGetUser({ page: 1, size: 200 });
  const createMutation = usePostDept();
  const deleteMutation = useDeleteDeptById();

  const expandedIds = useMemo(() => buildExpandedIds(deptQuery.data ?? []), [deptQuery.data]);
  const deptOptions = useMemo(() => flattenDeptOptions(deptQuery.data ?? []), [deptQuery.data]);
  const userOptions = usersQuery.data?.content ?? [];
  const treeData = useMemo(
    () =>
      (deptQuery.data ?? []).map(function toTree(node): DeptTreeNode {
        return {
          id: String(node.id),
          raw: node,
          children: node.children.map(toTree),
        };
      }),
    [deptQuery.data],
  );

  const invalidateDeptQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: getGetDeptQueryKey() });
  };

  const openCreateDialog = (parentId?: number | null) => {
    setFormState({
      ...EMPTY_FORM,
      parentId: parentId == null ? 'ROOT' : String(parentId),
    });
    setFormOpen(true);
  };

  const submitCreate = async () => {
    try {
      await createMutation.mutateAsync({
        data: {
          parentId: formState.parentId === 'ROOT' ? undefined : Number(formState.parentId),
          name: formState.name.trim(),
          leaderUserId:
            formState.leaderUserId === 'NONE' ? undefined : Number(formState.leaderUserId),
          sortOrder: Number(formState.sortOrder),
        },
      });
      toast.success(t('message.deptCreated'));
      await invalidateDeptQueries();
      setFormOpen(false);
    } catch {
      toast.error(t('message.actionFailed'));
    }
  };

  const submitDelete = async () => {
    if (!deletingDept) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id: deletingDept.id });
      toast.success(t('message.deptDeleted'));
      await invalidateDeptQueries();
      setDeletingDept(null);
    } catch {
      toast.error(t('message.actionFailed'));
    }
  };

  const resolveLeaderName = (leaderUserId: number | null) =>
    userOptions.find((user: UserVo) => user.id === leaderUserId)?.nickname ??
    userOptions.find((user: UserVo) => user.id === leaderUserId)?.username ??
    t('status.unassigned');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title.dept')}
        description={t('description.dept')}
        actions={
          currentUser.hasPermission('iam:dept:create') ? (
            <Button onClick={() => openCreateDialog()}>
              <Plus className="size-4" />
              {t('action.create')}
            </Button>
          ) : undefined
        }
      />

      <NxLoading
        loading={deptQuery.isLoading}
        error={deptQuery.error}
        empty={(deptQuery.data?.length ?? 0) === 0}
        loadingText={t('loading.dept')}
        errorText={t('message.actionFailed')}
        emptyText={t('empty.dept')}
      >
        <div className="rounded-lg border px-3 py-3">
          <NxTree<DeptTreeNode>
            data={treeData}
            expandedIds={expandedIds}
            emptyText={t('empty.dept')}
            renderNode={(node) => {
              const originalDept = node.raw;

              return (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium">{originalDept.name}</span>
                  <Badge variant="secondary">
                    {t('dept.leader')}: {resolveLeaderName(originalDept.leaderUserId)}
                  </Badge>
                  <Badge variant="outline">
                    {t('dept.sortOrder')}: {originalDept.sortOrder}
                  </Badge>
                  <div className="ml-auto flex items-center gap-2">
                    {currentUser.hasPermission('iam:dept:create') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCreateDialog(originalDept.id)}
                      >
                        {t('action.createChild')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDept(originalDept);
                        setDetailOpen(true);
                      }}
                    >
                      {t('action.view')}
                    </Button>
                    {currentUser.hasPermission('iam:dept:delete') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingDept(originalDept)}
                      >
                        {t('action.delete')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            }}
          />
        </div>
      </NxLoading>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog.createDeptTitle')}</DialogTitle>
            <DialogDescription>{t('dialog.deptCreateDesc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('field.parentDept')}</Label>
              <Select
                value={formState.parentId}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, parentId: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROOT">{t('status.rootNode')}</SelectItem>
                  {deptOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dept-name">{t('field.deptName')}</Label>
              <Input
                id="dept-name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t('field.leader')}</Label>
              <Select
                value={formState.leaderUserId}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, leaderUserId: value }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">{t('status.unassigned')}</SelectItem>
                  {userOptions.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.nickname ?? user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dept-sort">{t('field.sortOrder')}</Label>
              <Input
                id="dept-sort"
                type="number"
                value={formState.sortOrder}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, sortOrder: event.target.value }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button onClick={() => void submitCreate()} disabled={createMutation.isPending}>
              {t('action.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('dialog.deptDetailTitle')}</DialogTitle>
            <DialogDescription>{t('hint.deptContract')}</DialogDescription>
          </DialogHeader>

          {selectedDept && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('field.deptName')}</div>
                <div className="font-medium">{selectedDept.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('field.leader')}</div>
                <div className="font-medium">{resolveLeaderName(selectedDept.leaderUserId)}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('field.sortOrder')}</div>
                <div className="font-medium">{selectedDept.sortOrder}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('field.createdAt')}</div>
                <div className="font-medium">{formatDate(selectedDept.createdAt)}</div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              {t('action.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingDept} onOpenChange={(open) => !open && setDeletingDept(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteDeptTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm.deleteDept', { name: deletingDept?.name ?? '-' })}
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
