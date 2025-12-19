'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Circle, Loader2, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}

interface OrderTaskBoardProps {
  orderId: string;
}

export function OrderTaskBoard({ orderId }: OrderTaskBoardProps) {
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['order-tasks', orderId],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${orderId}/tasks`);
      if (!res.ok) throw new Error('Failed to fetch tasks');
      const result = await res.json();
      return result.data as Task[];
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch(`/api/orders/${orderId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-tasks', orderId] });
      setNewTaskTitle('');
      toast.success('Task added to workshop');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: string; status: string }) => {
      const res = await fetch(`/api/orders/${orderId}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-tasks', orderId] });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch(`/api/orders/${orderId}/tasks/${taskId}`, {
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

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate(newTaskTitle);
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
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
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
      </CardContent>
    </Card>
  );
}
