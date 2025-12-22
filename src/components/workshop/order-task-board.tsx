'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  Loader2,
  Package,
  Plus,
  Settings2,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { fetchApi } from '@/lib/fetch-api';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  materialId?: string;
  materialQty?: number;
  consumedAt?: string;
  material?: {
    name: string;
    unitOfMeasure: string;
  };
}

interface OrderTaskBoardProps {
  orderId: string;
}

export function OrderTaskBoard({ orderId }: OrderTaskBoardProps) {
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Temporary state for editing/creation
  const [tempMaterialId, setTempMaterialId] = useState<string | null>(null);
  const [tempMaterialQty, setTempMaterialQty] = useState<string>('');

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['order-tasks', orderId],
    queryFn: async () => {
      const res = await fetchApi(`/api/orders/${orderId}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const result = await res.json();
      return result.data as Task[];
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async ({
      title,
      materialId,
      materialQty,
    }: {
      title: string;
      materialId?: string | null;
      materialQty?: number | null;
    }) => {
      const res = await fetchApi(`/api/orders/${orderId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, materialId, materialQty }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-tasks', orderId] });
      setNewTaskTitle('');
      setTempMaterialId(null);
      setTempMaterialQty('');
      setIsCreateDialogOpen(false);
      toast.success('Task added to workshop');
    },
  });

  const { data: inventory } = useQuery({
    queryKey: ['inventory-list'],
    queryFn: async () => {
      const res = await fetchApi('/api/inventory');
      if (!res.ok) throw new Error('Failed to load inventory');
      const data = await res.json();
      return data.data;
    },
    enabled: isEditDialogOpen || isCreateDialogOpen,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
      materialId,
      materialQty,
    }: {
      taskId: string;
      status?: string;
      materialId?: string | null;
      materialQty?: number | null;
    }) => {
      const res = await fetchApi(`/api/orders/${orderId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, materialId, materialQty }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-tasks', orderId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsEditDialogOpen(false);
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetchApi(`/api/orders/${orderId}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-tasks', orderId] });
      toast.success('Task removed');
    },
  });

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTempMaterialId(task.materialId || null);
    setTempMaterialQty(task.materialQty?.toString() || '');
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editingTask) return;
    updateTaskMutation.mutate({
      taskId: editingTask.id,
      materialId: tempMaterialId,
      materialQty: tempMaterialQty ? Number(tempMaterialQty) : null,
    });
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate({
      title: newTaskTitle,
      materialId: tempMaterialId,
      materialQty: tempMaterialQty ? Number(tempMaterialQty) : null,
    });
  };

  const handleOpenCreate = () => {
    setTempMaterialId(null);
    setTempMaterialQty('');
    setIsCreateDialogOpen(true);
  };

  const tasks = tasksData || [];
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <Card className="border-none shadow-md overflow-hidden bg-slate-50/50">
      <CardHeader className="bg-white border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold font-heading flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Workshop Steps
            </CardTitle>
            <CardDescription>Break down this order into specific tasks</CardDescription>
          </div>
          <Badge variant="secondary" className="px-3 font-mono">
            {completedCount}/{tasks.length} Done
          </Badge>
        </div>
        {tasks.length > 0 && (
          <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <form onSubmit={handleAddTask} className="flex gap-2">
          <Input
            placeholder="e.g. Cutting fabric, First fitting..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="bg-white border-slate-200"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenCreate}
            className="shrink-0 bg-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Options
          </Button>
          <Button
            type="submit"
            disabled={createTaskMutation.isPending || !newTaskTitle.trim()}
            className="shrink-0"
          >
            {createTaskMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </form>

        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary opacity-20" />
            </div>
          ) : tasks.length > 0 ? (
            tasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 group',
                  task.status === 'COMPLETED'
                    ? 'bg-emerald-50/30 border-emerald-100 opacity-75'
                    : 'bg-white border-slate-200 hover:border-primary/30'
                )}
              >
                <button
                  type="button"
                  onClick={() =>
                    updateTaskMutation.mutate({
                      taskId: task.id,
                      status: task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED',
                    })
                  }
                  className="shrink-0"
                >
                  {task.status === 'COMPLETED' ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500 fill-emerald-50" />
                  ) : (
                    <Circle className="h-5 w-5 text-slate-300 hover:text-primary transition-colors" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      'text-sm font-medium truncate',
                      task.status === 'COMPLETED' && 'text-slate-500 line-through'
                    )}
                  >
                    {task.title}
                  </p>
                  {task.material && (
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                      <Package className="h-3 w-3" />
                      <span>
                        {task.material.name} ({task.materialQty} {task.material.unitOfMeasure})
                      </span>
                      {task.consumedAt && (
                        <Badge
                          variant="outline"
                          className="text-[8px] h-3 px-1 ml-1 bg-emerald-50 text-emerald-600 border-emerald-100"
                        >
                          Consumed
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(task)}
                    className="text-slate-400 hover:text-primary p-1"
                    title="Task Settings"
                    disabled={task.status === 'COMPLETED'}
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteTaskMutation.mutate(task.id)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 bg-white/50 border-2 border-dashed rounded-xl">
              <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-6 w-6 text-slate-300" />
              </div>
              <p className="text-sm font-medium text-slate-500 text-center px-4">
                No workshop steps added yet. Start by breaking down the work.
              </p>
            </div>
          )}
        </div>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Task Details: {editingTask?.title}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Link Material from Inventory</Label>
                <Select
                  value={tempMaterialId || 'none'}
                  onValueChange={(val) => setTempMaterialId(val === 'none' ? null : val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a material..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No material linked</SelectItem>
                    {inventory?.map((inv: any) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.name} ({Number(inv.quantity)} {inv.unitOfMeasure} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Quantity to Deduct (
                  {inventory?.find((i: any) => i.id === tempMaterialId)?.unitOfMeasure || 'units'})
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={tempMaterialQty}
                  onChange={(e) => setTempMaterialQty(e.target.value)}
                  placeholder="e.g. 2.5"
                  disabled={!tempMaterialId}
                />
                <p className="text-[10px] text-muted-foreground">
                  Stock will be auto-deducted when this task is marked as COMPLETED.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSaveEdit} disabled={updateTaskMutation.isPending}>
                {updateTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New Task Details</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Task Title</Label>
                <Input
                  placeholder="e.g. Cutting fabric"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Link Material from Inventory</Label>
                <Select
                  value={tempMaterialId || 'none'}
                  onValueChange={(val) => setTempMaterialId(val === 'none' ? null : val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a material..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No material linked</SelectItem>
                    {inventory?.map((inv: any) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.name} ({Number(inv.quantity)} {inv.unitOfMeasure} available)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Quantity to Deduct (
                  {inventory?.find((i: any) => i.id === tempMaterialId)?.unitOfMeasure || 'units'})
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  value={tempMaterialQty}
                  onChange={(e) => setTempMaterialQty(e.target.value)}
                  placeholder="e.g. 2.5"
                  disabled={!tempMaterialId}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddTask} disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
