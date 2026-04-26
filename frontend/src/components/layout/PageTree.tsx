import React, { useState } from 'react';
import { PageTreeNode, usePageStore } from '@/store';
import { ChevronRight, ChevronDown, FileText, Plus, MoreHorizontal, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';

interface PageTreeProps {
    pages: PageTreeNode[];
    level?: number;
    workspaceId: string;
}

export default function PageTree({ pages, level = 0, workspaceId }: PageTreeProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { createPage } = usePageStore();
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    const toggleExpand = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleCreateNestedPage = async (e: React.MouseEvent, parentId: string) => {
        e.stopPropagation();
        setExpanded((prev) => ({ ...prev, [parentId]: true })); // Expand parent
        const newPageId = await createPage(workspaceId, parentId);
        if (newPageId) {
            navigate(`/pages/${newPageId}`);
        }
    };

    const handleNavigate = (id: string) => {
        navigate(`/pages/${id}`);
    };

    return (
        <div className="flex flex-col">
            {pages.map((page) => {
                const isExpanded = expanded[page.id];
                const hasChildren = page.children && page.children.length > 0;
                const isActive = location.pathname === `/pages/${page.id}`;

                return (
                    <div key={page.id} className="flex flex-col">
                        <div
                            onClick={() => handleNavigate(page.id)}
                            className={cn(
                                "group flex items-center min-h-[28px] px-2 py-1 text-[13px] rounded-md cursor-pointer text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--bg-tertiary))] transition-colors",
                                isActive && "bg-[rgb(var(--bg-tertiary))] text-[rgb(var(--text))] font-medium"
                            )}
                            style={{ paddingLeft: `${(level * 12) + 8}px` }}
                        >
                            {/* Expand/Collapse Icon */}
                            <div 
                                className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-[rgb(var(--border))] transition-colors opacity-0 group-hover:opacity-100"
                                onClick={(e) => toggleExpand(e, page.id)}
                            >
                                {hasChildren ? (
                                    isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                                ) : (
                                    <div className="w-1 h-1 rounded-full bg-zinc-400 opacity-50" />
                                )}
                            </div>
                            
                            <FileText size={14} className="ml-1 mr-2 opacity-80" />
                            <span className="truncate flex-1">{page.title || 'Untitled'}</span>
                            
                            {/* Shared Icon */}
                            {page._count && page._count.permissions > 0 && (
                                <Users size={12} className="ml-1 text-indigo-500 opacity-80" />
                            )}

                            {/* Action Buttons */}
                            <div className="opacity-0 group-hover:opacity-100 flex items-center ml-auto">
                                <button
                                    onClick={(e) => handleCreateNestedPage(e, page.id)}
                                    className="p-1 rounded hover:bg-[rgb(var(--border))] text-[rgb(var(--text-muted))]"
                                >
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Render Children if expanded */}
                        {isExpanded && hasChildren && (
                            <PageTree pages={page.children} level={level + 1} workspaceId={workspaceId} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
