import { useState } from 'react';
import { X, Search, UserPlus, Trash2, Mail } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Workspace, WorkspaceMember, User, Role } from '@/types';
import { useAuthStore } from '@/store';
import * as Dialog from '@radix-ui/react-dialog';

interface ShareModalProps {
    workspace: Workspace;
    isOpen: boolean;
    onClose: () => void;
}

export default function ShareModal({ workspace, isOpen, onClose }: ShareModalProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();

    // Fetch workspace members
    const { data: workspaceData } = useQuery({
        queryKey: ['workspace', workspace.id],
        queryFn: () => api.get(`/workspaces/${workspace.id}`).then(res => res.data.data),
        enabled: isOpen,
    });

    const members = workspaceData?.members || [];

    // Search users
    const { data: searchResults } = useQuery({
        queryKey: ['users', 'search', searchQuery],
        queryFn: () => api.get(`/auth/search?query=${searchQuery}`).then(res => res.data.data),
        enabled: searchQuery.length >= 2,
    });

    // Add member mutation
    const addMemberMutation = useMutation({
        mutationFn: (userId: string) => api.post(`/workspaces/${workspace.id}/members`, { userId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', workspace.id] });
            setSearchQuery('');
        },
    });

    // Update role mutation
    const updateRoleMutation = useMutation({
        mutationFn: ({ memberId, role }: { memberId: string; role: Role }) =>
            api.patch(`/workspaces/${workspace.id}/members/${memberId}`, { role }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', workspace.id] });
        },
    });

    // Remove member mutation
    const removeMemberMutation = useMutation({
        mutationFn: (memberId: string) => api.delete(`/workspaces/${workspace.id}/members/${memberId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workspace', workspace.id] });
        },
    });

    const currentUserMember = members.find((m: any) => m.userId === currentUser?.id);
    const currentUserRole = currentUserMember?.role;
    const canManage = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[rgb(var(--bg))] border border-[rgb(var(--border))] rounded-xl shadow-2xl z-50 focus:outline-none overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-[rgb(var(--border))] flex items-center justify-between">
                        <Dialog.Title className="text-lg font-semibold">Share "{workspace.name}"</Dialog.Title>
                        <button onClick={onClose} className="p-1 hover:bg-[rgb(var(--bg-secondary))] rounded-md transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        {/* User Search */}
                        {canManage && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))]" size={16} />
                                    <input
                                        type="text"
                                        placeholder="Add people by name or email..."
                                        className="w-full pl-10 pr-4 py-2 bg-[rgb(var(--bg-secondary))] border border-[rgb(var(--border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>

                                {searchQuery.length >= 2 && searchResults && (
                                    <div className="bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border))] rounded-lg overflow-hidden max-h-48 overflow-y-auto shadow-inner">
                                        {searchResults.map((user: User) => (
                                            <button
                                                key={user.id}
                                                disabled={members.some((m: any) => m.userId === user.id) || addMemberMutation.isPending}
                                                onClick={() => addMemberMutation.mutate(user.id)}
                                                className="w-full flex items-center gap-3 p-3 hover:bg-[rgb(var(--bg-secondary))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group border-b border-[rgb(var(--border))] last:border-0"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs">
                                                    {user.name?.[0] || 'U'}
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <div className="text-sm font-medium">{user.name}</div>
                                                    <div className="text-xs text-[rgb(var(--text-muted))]">{user.email}</div>
                                                </div>
                                                {members.some((m: any) => m.userId === user.id) ? (
                                                    <span className="text-xs text-[rgb(var(--text-muted))] font-medium">Joined</span>
                                                ) : (
                                                    <UserPlus size={16} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                                                )}
                                            </button>
                                        ))}
                                        {searchResults.length === 0 && (
                                            <div className="p-4 text-center text-sm text-[rgb(var(--text-muted))] italic">
                                                No users found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Members List */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))]">Members ({members.length})</h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {members.map((member: WorkspaceMember) => (
                                    <div key={member.id} className="flex items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-full bg-[rgb(var(--bg-tertiary))] border border-[rgb(var(--border))] flex items-center justify-center overflow-hidden">
                                            {member.user.avatar ? (
                                                <img src={member.user.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold">{member.user.name?.[0] || 'U'}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate flex items-center">
                                                {member.user.name}
                                                {member.userId === currentUser?.id && <span className="ml-2 text-[10px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-bold">YOU</span>}
                                            </div>
                                            <div className="text-xs text-[rgb(var(--text-muted))] truncate">{member.user.email}</div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {canManage && member.role !== 'OWNER' && member.userId !== currentUser?.id ? (
                                                <>
                                                    <select
                                                        value={member.role}
                                                        onChange={(e) => updateRoleMutation.mutate({ memberId: member.id, role: e.target.value as Role })}
                                                        className="text-xs bg-transparent border-none focus:ring-0 cursor-pointer text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))] focus:outline-none"
                                                    >
                                                        <option value="ADMIN">Admin</option>
                                                        <option value="MEMBER">Member</option>
                                                        <option value="VIEWER">Viewer</option>
                                                    </select>
                                                    <button
                                                        onClick={() => removeMemberMutation.mutate(member.id)}
                                                        className="p-1 text-[rgb(var(--text-muted))] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Remove from workspace"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </>
                                            ) : (
                                                <span className="text-xs text-[rgb(var(--text-muted))] font-medium capitalize">
                                                    {member.role.toLowerCase()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-[rgb(var(--bg-secondary))] border-t border-[rgb(var(--border))] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
                            <Mail size={12} />
                            <span>Invite others to collaborate</span>
                        </div>
                        <button onClick={onClose} className="px-5 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                            Done
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
