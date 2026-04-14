import { useCurrentUser } from '@mb/app-shell';
import { Card } from '@mb/ui-primitives';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_authed/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const user = useCurrentUser();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{user.username ?? 'User'} — Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">M3 占位卡片 1</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">M3 占位卡片 2</p>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground">M3 占位卡片 3</p>
        </Card>
      </div>
    </div>
  );
}
