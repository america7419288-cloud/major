import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDatabaseStore, useAuthStore, usePresenceStore } from '@/store';
import { Database, DatabaseItem, PropertyDef } from '@/types';
import DatabaseTable from '@/components/database/DatabaseTable';
import PropertySchemaEditor from '@/components/database/PropertySchemaEditor';
import { cn } from '@/lib/utils';
import PresenceAvatars from '@/components/collaboration/PresenceAvatars';
import EmptyState from '@/components/ui/EmptyState';
import {
    Layout,
    Settings2,
    Plus,
    Filter,
    SortAsc,
    Search,
    Database as DatabaseIcon,
    Loader2,
    MessageSquare,
    LayoutList
} from 'lucide-react';
import CommentSection from '@/components/collaboration/CommentSection';
import { Button } from '@/components/ui/button';

const DatabasePage: React.FC = () => {
    const { databaseId } = useParams<{ databaseId: string }>();
    const { fetchDatabaseById, updateItem, createItem, deleteItem, loading, error } = useDatabaseStore();
    const [database, setDatabase] = useState<Database | null>(null);
    const [items, setItems] = useState<DatabaseItem[]>([]);
    const [isSchemaEditorOpen, setIsSchemaEditorOpen] = useState(false);
    const [showComments, setShowComments] = useState(false);

    const user = useAuthStore((s) => s.user);
    const joinPage = usePresenceStore((s) => s.joinPage);
    const leavePage = usePresenceStore((s) => s.leavePage);

    useEffect(() => {
        if (databaseId && user) {
            joinPage(databaseId, {
                userId: user.id,
                name: user.name ?? 'Anonymous',
                avatarUrl: user.avatar ?? undefined,
            });

            return () => {
                leavePage(databaseId, user.id);
            };
        }
    }, [databaseId, user, joinPage, leavePage]);

    useEffect(() => {
        if (databaseId) {
            loadDatabase(databaseId);
        }
    }, [databaseId]);

    const loadDatabase = async (id: string) => {
        try {
            const data = await fetchDatabaseById(id);
            setDatabase(data);
            setItems(data.items);
        } catch (err) {
            console.error('Failed to load database:', err);
        }
    };

    const handleCreateItem = async () => {
        if (!databaseId) return;
        try {
            const newItem = await createItem(databaseId, {});
            setItems([newItem, ...items]);
        } catch (err) {
            console.error('Failed to create item:', err);
        }
    };

    const handleUpdateItem = async (itemId: string, properties: any) => {
        try {
            const updatedItem = await updateItem(itemId, { properties });
            setItems(items.map(item => item.id === itemId ? updatedItem : item));
        } catch (err) {
            console.error('Failed to update item:', err);
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        try {
            await deleteItem(itemId);
            setItems(items.filter(item => item.id !== itemId));
        } catch (err) {
            console.error('Failed to delete item:', err);
        }
    };

    const handleUpdateSchema = async (newSchema: PropertyDef[]) => {
        if (!databaseId) return;
        try {
            const updatedDb = await useDatabaseStore.getState().updateDatabase(databaseId, { schema: newSchema });
            setDatabase(updatedDb);
        } catch (err) {
            console.error('Failed to update schema:', err);
        }
    };

    if (loading && !database) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] gap-4">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                <p className="text-zinc-500 animate-pulse">Loading database...</p>
            </div>
        );
    }

    if (error || !database) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <EmptyState
                    title="Database not found"
                    description="The database you're looking for doesn't exist or you don't have access."
                    icon={DatabaseIcon}
                    action={{
                        label: "Go Back",
                        onClick: () => window.history.back()
                    }}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full gap-6 p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <DatabaseIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">{database.title}</h1>
                            <p className="text-sm text-zinc-500">{items.length} items • Structured data</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <PresenceAvatars />
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn("gap-2", showComments && "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border-indigo-200")}
                                onClick={() => setShowComments(!showComments)}
                            >
                                <MessageSquare className="w-4 h-4" />
                                {showComments ? 'Hide Chat' : 'Discussion'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => setIsSchemaEditorOpen(true)}
                            >
                                <Settings2 className="w-4 h-4" />
                                Properties
                            </Button>
                            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700" onClick={handleCreateItem}>
                                <Plus className="w-4 h-4" />
                                New Item
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 p-1 border-b border-zinc-200 dark:border-zinc-800">
                    <Button variant="ghost" size="sm" className="gap-2 text-zinc-500 font-normal">
                        <Filter className="w-3.5 h-3.5" />
                        Filter
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-zinc-500 font-normal">
                        <SortAsc className="w-3.5 h-3.5" />
                        Sort
                    </Button>
                    <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />
                    <div className="flex-1 flex items-center gap-2 px-2 text-zinc-400">
                        <Search className="w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            className="bg-transparent border-none outline-none text-xs w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="flex gap-8 h-full min-h-0">
                <div className="flex-1 min-w-0">
                    <DatabaseTable
                        database={database}
                        items={items}
                        onUpdateItem={handleUpdateItem}
                        onDeleteItem={handleDeleteItem}
                        onCreateItem={handleCreateItem}
                    />
                </div>

                {showComments && (
                    <div className="w-80 flex-shrink-0 animate-in slide-in-from-right duration-300">
                        <CommentSection
                            entityType="DATABASE"
                            entityId={databaseId!}
                            onClose={() => setShowComments(false)}
                            className="rounded-xl border h-full shadow-md"
                        />
                    </div>
                )}
            </div>

            {isSchemaEditorOpen && (
                <PropertySchemaEditor
                    database={database}
                    onUpdateSchema={handleUpdateSchema}
                    onClose={() => setIsSchemaEditorOpen(false)}
                />
            )}
        </div>
    );
};

export default DatabasePage;
