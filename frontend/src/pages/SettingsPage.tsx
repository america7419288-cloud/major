import { useState } from 'react';
import { User, Settings, Palette, Globe, Shield, LogOut, Save, Camera } from 'lucide-react';
import { useAuthStore, useUIStore } from '@/store';
import { api } from '@/lib/api/client';
import { toast } from 'sonner';

export default function SettingsPage() {
    const { user, updateUser, clearAuth } = useAuthStore();
    const { theme, setTheme } = useUIStore();
    const [activeTab, setActiveTab] = useState<'account' | 'appearance' | 'workspace'>('account');

    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const res = await api.put('/auth/profile', { name, bio, avatar });
            updateUser(res.data.data);
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const tabs = [
        { id: 'account', label: 'Account', icon: User },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'workspace', label: 'Workspaces', icon: Globe },
    ];

    return (
        <div className="max-w-4xl mx-auto p-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Settings</h1>
                <p className="text-[rgb(var(--text-muted))]">Manage your account settings and preferences.</p>
            </header>

            <div className="flex gap-8">
                {/* Sidebar Tabs */}
                <aside className="w-64 flex flex-col gap-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                        ? 'bg-[rgb(var(--accent-primary))] text-white'
                                        : 'hover:bg-[rgb(var(--bg-secondary))] text-[rgb(var(--text-secondary))]'
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                    <div className="mt-4 pt-4 border-t border-[rgb(var(--border-primary))]">
                        <button
                            onClick={clearAuth}
                            className="flex items-center gap-3 px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full text-left"
                        >
                            <LogOut size={18} />
                            <span className="font-medium">Log out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 bg-[rgb(var(--bg-secondary))] rounded-xl border border-[rgb(var(--border-primary))] p-8">
                    {activeTab === 'account' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <section>
                                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="relative group">
                                            <img
                                                src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`}
                                                alt={name}
                                                className="w-24 h-24 rounded-full object-cover border-2 border-[rgb(var(--border-primary))]"
                                            />
                                            <button className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Camera size={24} className="text-white" />
                                            </button>
                                        </div>
                                        <div className="flex-1">
                                            <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                                                Avatar URL
                                            </label>
                                            <input
                                                type="text"
                                                value={avatar}
                                                onChange={(e) => setAvatar(e.target.value)}
                                                className="w-full bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] transition-all"
                                                placeholder="https://example.com/avatar.png"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] transition-all"
                                            placeholder="Your name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="w-full bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-lg px-4 py-2 opacity-50 cursor-not-allowed"
                                        />
                                        <p className="text-xs text-[rgb(var(--text-muted))] mt-1">Email cannot be changed.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1.5 text-[rgb(var(--text-secondary))]">
                                            Bio
                                        </label>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            rows={4}
                                            className="w-full bg-[rgb(var(--bg-primary))] border border-[rgb(var(--border-primary))] rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[rgb(var(--accent-primary))] transition-all resize-none"
                                            placeholder="Tell us about yourself..."
                                        />
                                    </div>

                                    <div className="flex justify-end pt-4">
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isSaving}
                                            className="flex items-center gap-2 bg-[rgb(var(--accent-primary))] text-white px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                        >
                                            {isSaving ? 'Saving...' : (
                                                <>
                                                    <Save size={18} />
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'appearance' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <section>
                                <h2 className="text-xl font-semibold mb-4">Theme Preferences</h2>
                                <p className="text-[rgb(var(--text-secondary))] mb-6">
                                    Choose how the application looks to you.
                                </p>

                                <div className="grid grid-cols-3 gap-4">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${theme === 'light'
                                                ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-primary))]/5'
                                                : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--text-muted))]'
                                            }`}
                                    >
                                        <div className="w-full aspect-video bg-gray-100 rounded-lg mb-3 border border-gray-200" />
                                        <span className="font-medium">Light</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${theme === 'dark'
                                                ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-primary))]/5'
                                                : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--text-muted))]'
                                            }`}
                                    >
                                        <div className="w-full aspect-video bg-gray-900 rounded-lg mb-3 border border-gray-800" />
                                        <span className="font-medium">Dark</span>
                                    </button>
                                    <button
                                        onClick={() => setTheme('system')}
                                        className={`p-4 rounded-xl border-2 transition-all text-left ${theme === 'system'
                                                ? 'border-[rgb(var(--accent-primary))] bg-[rgb(var(--accent-primary))]/5'
                                                : 'border-[rgb(var(--border-primary))] hover:border-[rgb(var(--text-muted))]'
                                            }`}
                                    >
                                        <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-900 rounded-lg mb-3 border border-gray-400" />
                                        <span className="font-medium">System</span>
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    {activeTab === 'workspace' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 text-center py-12">
                            <Globe size={48} className="mx-auto text-[rgb(var(--text-muted))] mb-4" />
                            <h2 className="text-xl font-semibold">Workspace Management</h2>
                            <p className="text-[rgb(var(--text-secondary))] max-w-sm mx-auto">
                                Workspace management features are available in the workspace switcher and menu.
                            </p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
