import {
  type MenuVo,
  getGetMenuQueryKey,
  useDeleteMenuById,
  useGetMenu,
  usePostMenu,
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
  Checkbox,
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
import { buildExpandedIds, flattenMenuOptions } from '../shared';

interface MenuFormState {
  parentId: string;
  name: string;
  permissionCode: string;
  menuType: string;
  icon: string;
  sortOrder: string;
  visible: boolean;
}

interface MenuTreeNode {
  id: string;
  raw: MenuVo;
  children: MenuTreeNode[];
}

const EMPTY_FORM: MenuFormState = {
  parentId: 'ROOT',
  name: '',
  permissionCode: '',
  menuType: 'MENU',
  icon: '',
  sortOrder: '1',
  visible: true,
};

function MenuTypeBadge({ type }: { type: string }) {
  if (type === 'BUTTON') {
    return <Badge variant="secondary">BUTTON</Badge>;
  }
  if (type === 'DIRECTORY') {
    return <Badge variant="outline">DIRECTORY</Badge>;
  }
  return <Badge variant="default">MENU</Badge>;
}

export function MenuPage() {
  const { t } = useTranslation('iam');
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState<MenuVo | null>(null);
  const [deletingMenu, setDeletingMenu] = useState<MenuVo | null>(null);
  const [formState, setFormState] = useState<MenuFormState>(EMPTY_FORM);

  const menuQuery = useGetMenu();
  const createMutation = usePostMenu();
  const deleteMutation = useDeleteMenuById();

  const expandedIds = useMemo(() => buildExpandedIds(menuQuery.data ?? []), [menuQuery.data]);
  const menuOptions = useMemo(() => flattenMenuOptions(menuQuery.data ?? []), [menuQuery.data]);
  const treeData = useMemo(
    () =>
      (menuQuery.data ?? []).map(function toTree(node): MenuTreeNode {
        return {
          id: String(node.id),
          raw: node,
          children: node.children.map(toTree),
        };
      }),
    [menuQuery.data],
  );

  const invalidateMenuQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: getGetMenuQueryKey() });
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
          permissionCode: formState.permissionCode.trim() || undefined,
          menuType: formState.menuType,
          icon: formState.icon.trim() || undefined,
          sortOrder: Number(formState.sortOrder),
          visible: formState.visible,
        },
      });
      toast.success(t('message.menuCreated'));
      await invalidateMenuQueries();
      setFormOpen(false);
    } catch {
      toast.error(t('message.actionFailed'));
    }
  };

  const submitDelete = async () => {
    if (!deletingMenu) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id: deletingMenu.id });
      toast.success(t('message.menuDeleted'));
      await invalidateMenuQueries();
      setDeletingMenu(null);
    } catch {
      toast.error(t('message.actionFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('title.menu')}
        description={t('description.menu')}
        actions={
          currentUser.hasPermission('iam:menu:create') ? (
            <Button onClick={() => openCreateDialog()}>
              <Plus className="size-4" />
              {t('action.create')}
            </Button>
          ) : undefined
        }
      />

      <NxLoading
        loading={menuQuery.isLoading}
        error={menuQuery.error}
        empty={(menuQuery.data?.length ?? 0) === 0}
        loadingText={t('loading.menu')}
        errorText={t('message.actionFailed')}
        emptyText={t('empty.menu')}
      >
        <div className="rounded-lg border px-3 py-3">
          <NxTree<MenuTreeNode>
            data={treeData}
            expandedIds={expandedIds}
            emptyText={t('empty.menu')}
            renderNode={(node) => {
              const originalMenu = node.raw;

              return (
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-medium">{originalMenu.name}</span>
                  <MenuTypeBadge type={originalMenu.menuType} />
                  <Badge variant={originalMenu.visible === false ? 'secondary' : 'outline'}>
                    {originalMenu.visible === false ? t('status.hidden') : t('status.visible')}
                  </Badge>
                  {originalMenu.permissionCode && (
                    <Badge variant="outline">{originalMenu.permissionCode}</Badge>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    {currentUser.hasPermission('iam:menu:create') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openCreateDialog(originalMenu.id)}
                      >
                        {t('action.createChild')}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedMenu(originalMenu);
                        setDetailOpen(true);
                      }}
                    >
                      {t('action.view')}
                    </Button>
                    {currentUser.hasPermission('iam:menu:delete') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingMenu(originalMenu)}
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('dialog.createMenuTitle')}</DialogTitle>
            <DialogDescription>{t('dialog.menuCreateDesc')}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>{t('field.parentMenu')}</Label>
              <Select
                value={formState.parentId}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, parentId: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ROOT">{t('status.rootNode')}</SelectItem>
                  {menuOptions.map((option) => (
                    <SelectItem key={option.value} value={String(option.value)}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('field.menuType')}</Label>
              <Select
                value={formState.menuType}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, menuType: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DIRECTORY">DIRECTORY</SelectItem>
                  <SelectItem value="MENU">MENU</SelectItem>
                  <SelectItem value="BUTTON">BUTTON</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu-name">{t('field.menuName')}</Label>
              <Input
                id="menu-name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu-icon">{t('field.icon')}</Label>
              <Input
                id="menu-icon"
                value={formState.icon}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, icon: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="menu-permission">{t('field.permissionCode')}</Label>
              <Input
                id="menu-permission"
                value={formState.permissionCode}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, permissionCode: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="menu-sort">{t('field.sortOrder')}</Label>
              <Input
                id="menu-sort"
                type="number"
                value={formState.sortOrder}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, sortOrder: event.target.value }))
                }
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <Checkbox
                checked={formState.visible}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, visible: Boolean(checked) }))
                }
              />
              <span>{t('field.visible')}</span>
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
            <DialogTitle>{t('dialog.menuDetailTitle')}</DialogTitle>
            <DialogDescription>{t('hint.menuContract')}</DialogDescription>
          </DialogHeader>

          {selectedMenu && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('field.menuName')}</div>
                <div className="font-medium">{selectedMenu.name}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('field.menuType')}</div>
                <div className="font-medium">{selectedMenu.menuType}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('field.permissionCode')}</div>
                <div className="font-medium">{selectedMenu.permissionCode ?? '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('field.icon')}</div>
                <div className="font-medium">{selectedMenu.icon ?? '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('field.sortOrder')}</div>
                <div className="font-medium">{selectedMenu.sortOrder ?? '-'}</div>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-muted-foreground">{t('field.visible')}</div>
                <div className="font-medium">
                  {selectedMenu.visible === false ? t('status.hidden') : t('status.visible')}
                </div>
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

      <AlertDialog open={!!deletingMenu} onOpenChange={(open) => !open && setDeletingMenu(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialog.deleteMenuTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirm.deleteMenu', { name: deletingMenu?.name ?? '-' })}
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
