import { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Mail, Shield, User } from 'lucide-react';
import { usePageStore } from '@/store/page.store';
import { useAuthStore } from '@/store';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PageShareModalProps {
    pageId: string;
    pageTitle: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function PageShareModal({ pageId, pageTitle, isOpen, onClose }: PageShareModalProps) {
    const [email, setEmail] = useState('');
    const [permissions, setPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const { sharePage, fetchPermissions, removePermission } = usePageStore();
    const { user: currentUser } = useAuthStore();

    useEffect(() => {
        if (isOpen) {
            loadPermissions();
        }
    }, [isOpen, pageId]);

    const loadPermissions = async () => {
        const data = await fetchPermissions(pageId);
        setPermissions(data);
    };

    const handleShare = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        try {
            await sharePage(pageId, email, 'CAN_VIEW');
            setEmail('');
            loadPermissions();
        } catch (error) {
            // Error handled by store
        } finally {
            setLoading(true);
            // Reload after a short delay to ensure DB consistency if needed
            setTimeout(loadPermissions, 500);
            setLoading(false);
        }
    };

    const handleRemove = async (permissionId: string) => {
        try {
            await removePermission(pageId, permissionId);
            loadPermissions();
        } catch (error) {
            // Error handled by store
        }
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 focus:outline-none overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                        <Dialog.Title className="text-lg font-semibold flex items-center gap-2">
                            <Shield className="w-5 h-5 text-indigo-500" />
                            Share "{pageTitle}"
                        </Dialog.Title>
                        <button onClick={onClose} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4 space-y-6">
                        {/* Share Form */}
                        <form onSubmit={handleShare} className="space-y-3">
                            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                Share with email
                            </label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                    <input
                                        type="email"
                                        placeholder="user@example.com"
                                        className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" disabled={loading || !email.trim()}>
                                    {loading ? 'Sharing...' : 'Share'}
                                </Button>
                            </div>
                            <p className="text-[10px] text-zinc-500">
                                Shared pages are read-only for invited users.
                            </p>
                        </form>

                        {/* Permissions List */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                                People with access ({permissions.length})
                            </h4>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {permissions.length === 0 ? (
                                    <div className="text-center py-8 text-zinc-400">
                                        <User className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No one else has access yet</p>
                                    </div>
                                ) : (
                                    permissions.map((permission) => (
                                        <div key={permission.id} className="flex items-center gap-3 group">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
                                                {permission.user.avatar ? (
                                                    <img src={permission.user.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-bold">{permission.user.name?.[0] || 'U'}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium truncate flex items-center">
                                                    {permission.user.name || 'User'}
                                                    {permission.userId === currentUser?.id && (
                                                        <span className="ml-2 text-[10px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-bold">YOU</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-zinc-500 truncate">{permission.user.email}</div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-1 rounded font-medium uppercase tracking-tighter">
                                                    {permission.level.replace('_', ' ')}
                                                </span>
                                                {permission.userId !== currentUser?.id && (
                                                    <button
                                                        onClick={() => handleRemove(permission.id)}
                                                        className="p-1 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Remove access"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end">
                        <Button variant="ghost" onClick={onClose}>
                            Done
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
