import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Calendar, Flag, User, AlertCircle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTaskStore, useUIStore } from '@/store';
import { CreateTaskInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE', 'CANCELLED']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  assigneeId: z.string().optional(),
  assigneeEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  dueDate: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStatus?: string;
}

export const CreateTaskModal = ({ isOpen, onClose, defaultStatus = 'TODO' }: CreateTaskModalProps) => {
  const { createTask } = useTaskStore();
  const { activeWorkspaceId } = useUIStore();
  const [members, setMembers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    watch,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      status: (defaultStatus as any) || 'TODO',
      priority: 'MEDIUM',
    },
  });

  useEffect(() => {
    if (isOpen && activeWorkspaceId) {
      reset({
        status: (defaultStatus as any) || 'TODO',
        priority: 'MEDIUM',
        title: '',
        description: '',
      });
      
      api.get(`/workspaces/${activeWorkspaceId}`).then(res => {
        setMembers(res.data.data.members || []);
      }).catch(err => console.error('Failed to fetch members', err));
    }
  }, [isOpen, activeWorkspaceId, defaultStatus, reset]);

  const onSubmit = async (data: TaskFormData) => {
    if (!activeWorkspaceId) {
      toast.error('No active workspace selected');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createTask(activeWorkspaceId, data as CreateTaskInput);
      toast.success('Task created successfully');
      onClose();
      reset();
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to create task';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPriority = watch('priority');

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-sm animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-[101] focus:outline-none overflow-hidden animate-in zoom-in-95 fade-in duration-200">
          <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
            <Dialog.Title className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
              <span className="w-2 h-6 bg-indigo-500 rounded-full" />
              Create New Task
            </Dialog.Title>
            <Dialog.Close className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-zinc-100">
              <X size={20} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Title</Label>
                <Input
                  id="title"
                  placeholder="What needs to be done?"
                  className={`bg-zinc-800/50 border-zinc-700 focus:ring-indigo-500/50 text-zinc-100 placeholder:text-zinc-500 h-11 ${errors.title ? 'border-red-500 focus:ring-red-500/50' : ''}`}
                  {...register('title')}
                  autoFocus
                />
                {errors.title && (
                  <span className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.title.message}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Description</Label>
                <textarea
                  id="description"
                  placeholder="Add more details..."
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100 placeholder:text-zinc-500 min-h-[100px] resize-none"
                  {...register('description')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Status</Label>
                  <select
                    {...register('status')}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100 appearance-none cursor-pointer"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="REVIEW">Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Priority</Label>
                  <div className="relative">
                    <select
                      {...register('priority')}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100 appearance-none cursor-pointer pl-9"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                    <Flag className={`absolute left-3 top-1/2 -translate-y-1/2 size-4 ${
                      selectedPriority === 'URGENT' ? 'text-red-500' :
                      selectedPriority === 'HIGH' ? 'text-orange-500' :
                      selectedPriority === 'MEDIUM' ? 'text-yellow-500' : 'text-zinc-500'
                    }`} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Assignee */}
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Assignee (Workspace Member)</Label>
                  <div className="relative">
                    <select
                      {...register('assigneeId')}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100 appearance-none cursor-pointer pl-9"
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member.user.id} value={member.user.id}>
                          {member.user.displayName || member.user.name || member.user.email}
                        </option>
                      ))}
                    </select>
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
                  </div>
                </div>

                {/* Assignee Email */}
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Or Assign by Email</Label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="user@example.com"
                      {...register('assigneeEmail')}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100 pl-9"
                    />
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
                  </div>
                  {errors.assigneeEmail && (
                    <span className="text-xs text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> {errors.assigneeEmail.message}
                    </span>
                  )}
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <Label className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Due Date</Label>
                  <div className="relative">
                    <input
                      type="date"
                      {...register('dueDate')}
                      className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-zinc-100 appearance-none cursor-pointer pl-9"
                    />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-10 shadow-lg shadow-indigo-500/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : 'Create Task'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
