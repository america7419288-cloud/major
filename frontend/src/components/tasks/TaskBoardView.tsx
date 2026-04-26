import React, { useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    DragOverlay,
    closestCorners,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Task, TaskStatus } from '@/types';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTaskStore } from '@/store/task.store';

interface TaskBoardViewProps {
    tasks: Task[];
    onUpdateTask: (id: string, updates: Partial<Task>) => void;
    onSelectTask: (task: Task) => void;
    onAddTask: (status: TaskStatus) => void;
    onDeleteTask: (id: string) => void;
}

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'TODO', title: 'To Do', color: 'bg-zinc-400' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-500' },
    { id: 'REVIEW', title: 'Review', color: 'bg-amber-500' },
    { id: 'DONE', title: 'Done', color: 'bg-emerald-500' },
];

// ─── Droppable Column Wrapper ─────────────────────────────────────────────────
function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id });
    return (
        <div
            ref={setNodeRef}
            className={cn(
                'flex-grow min-h-[120px] rounded-lg transition-colors pb-10',
                isOver && 'bg-blue-500/5 ring-1 ring-blue-500/20'
            )}
        >
            {children}
        </div>
    );
}

export default function TaskBoardView({ tasks, onUpdateTask, onSelectTask, onAddTask, onDeleteTask }: TaskBoardViewProps) {
    const moveTask = useTaskStore((s) => s.moveTask);
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 }, // require 5px drag before activating
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveTask(event.active.data.current as Task);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        const draggedTask = tasks.find((t) => t.id === activeId);
        if (!draggedTask) return;

        // Dropped directly on a column
        const isOverColumn = COLUMNS.some((c) => c.id === overId);

        let newStatus = draggedTask.status;
        let newPosition = draggedTask.position;

        if (isOverColumn) {
            newStatus = overId as TaskStatus;
            const columnTasks = tasks.filter((t) => t.status === newStatus && t.id !== activeId);
            newPosition = columnTasks.length > 0 ? Math.max(...columnTasks.map((t) => t.position)) + 1000 : 1000;
        } else {
            // Dropped on a task card
            const overTask = tasks.find((t) => t.id === overId);
            if (overTask) {
                newStatus = overTask.status;
                const columnTasks = tasks
                    .filter((t) => t.status === newStatus && t.id !== activeId)
                    .sort((a, b) => a.position - b.position);
                const overIndex = columnTasks.findIndex((t) => t.id === overId);

                if (columnTasks.length === 0) {
                    newPosition = 1000;
                } else if (overIndex === 0) {
                    newPosition = columnTasks[0].position / 2;
                } else if (overIndex === columnTasks.length - 1) {
                    newPosition = columnTasks[columnTasks.length - 1].position + 1000;
                } else {
                    newPosition = (columnTasks[overIndex - 1].position + columnTasks[overIndex].position) / 2;
                }
            }
        }

        if (draggedTask.status !== newStatus || draggedTask.position !== newPosition) {
            moveTask(activeId, newStatus, newPosition);
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex gap-3 p-6 overflow-x-auto min-h-[calc(100vh-160px)] items-start">
                {COLUMNS.map((column) => {
                    const columnTasks = tasks
                        .filter((t) => t.status === column.id)
                        .sort((a, b) => a.position - b.position);

                    return (
                        <div
                            key={column.id}
                            className="flex-shrink-0 w-72 bg-zinc-50 dark:bg-zinc-900/60 rounded-xl flex flex-col border border-[rgb(var(--border))]"
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))]">
                                <div className="flex items-center gap-2">
                                    <div className={cn('w-2 h-2 rounded-full', column.color)} />
                                    <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                                        {column.title}
                                    </h3>
                                    <span className="bg-zinc-200 dark:bg-zinc-800 text-zinc-500 text-[10px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                                        {columnTasks.length}
                                    </span>
                                </div>
                                <button
                                    onClick={() => onAddTask(column.id)}
                                    className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
                                    title={`Add task to ${column.title}`}
                                >
                                    <Plus size={14} />
                                </button>
                            </div>

                            {/* Column Body */}
                            <div className="p-2 flex-1">
                                <SortableContext
                                    id={column.id}
                                    items={columnTasks.map((t) => t.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <DroppableColumn id={column.id}>
                                        {columnTasks.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-8 text-zinc-400 text-xs gap-2">
                                                <p>Drop tasks here</p>
                                            </div>
                                        ) : (
                                            columnTasks.map((task) => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    index={0}
                                                    onClick={onSelectTask}
                                                    onDelete={onDeleteTask}
                                                />
                                            ))
                                        )}
                                    </DroppableColumn>
                                </SortableContext>
                            </div>

                            {/* Add Task Footer */}
                            <button
                                onClick={() => onAddTask(column.id)}
                                className="flex items-center gap-2 px-4 py-3 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded-b-xl transition-colors border-t border-[rgb(var(--border))]"
                            >
                                <Plus size={13} />
                                Add task
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Drag Overlay */}
            <DragOverlay dropAnimation={{ duration: 150, easing: 'ease' }}>
                {activeTask ? (
                    <div className="bg-[rgb(var(--surface))] p-3 rounded-lg border border-blue-500/40 shadow-2xl opacity-95 cursor-grabbing rotate-1 w-72">
                        <h4 className="text-sm font-medium line-clamp-2">{activeTask.title}</h4>
                        {activeTask.priority && (
                            <span className="mt-2 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider text-blue-500 bg-blue-100 dark:bg-blue-900/20">
                                {activeTask.priority}
                            </span>
                        )}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}
