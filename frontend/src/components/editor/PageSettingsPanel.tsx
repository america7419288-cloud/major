import React, { useState } from 'react';
import { usePageStore } from '@/store/page.store';
import { 
    Type, 
    Maximize2, 
    Minimize2, 
    Type as TypeIcon, 
    Clock, 
    FileText,
    History,
    Share2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import VersionHistoryPanel from '../page/VersionHistoryPanel';
import PageShareModal from '../collaboration/PageShareModal';

interface PageSettingsPanelProps {
    pageId: string;
}

export default function PageSettingsPanel({ pageId }: PageSettingsPanelProps) {
    const { pages, updatePage } = usePageStore();
    const [showVersionHistory, setShowVersionHistory] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const page = pages.find(p => p.id === pageId);

    if (!page) return null;

    if (showVersionHistory) {
        return <VersionHistoryPanel pageId={pageId} onClose={() => setShowVersionHistory(false)} />;
    }

    const getWordCount = () => {
        try {
            const content = typeof page.content === 'string' ? JSON.parse(page.content) : page.content;
            const text = JSON.stringify(content).replace(/[^\w\s]/g, ' ');
            return text.split(/\s+/).filter(Boolean).length;
        } catch {
            return 0;
        }
    };

    return (
        <div className="w-72 border-l border-zinc-200 dark:border-zinc-800 h-full bg-white dark:bg-zinc-950 p-6 flex flex-col gap-8 overflow-y-auto">
            <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Style</h3>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'default', label: 'Default', class: 'font-sans' },
                        { id: 'serif', label: 'Serif', class: 'font-serif' },
                        { id: 'mono', label: 'Mono', class: 'font-mono' },
                    ].map((style) => (
                        <button
                            key={style.id}
                            onClick={() => updatePage(pageId, { fontStyle: style.id as any })}
                            className={cn(
                                "flex flex-col items-center gap-1.5 p-2 rounded-md border transition-all",
                                page.fontStyle === style.id 
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600" 
                                    : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                            )}
                        >
                            <span className={cn("text-lg", style.class)}>Ag</span>
                            <span className="text-[10px] font-medium">{style.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Page Layout</h3>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm">Small text</Label>
                        <p className="text-[10px] text-zinc-500">Reduce font size for more content</p>
                    </div>
                    <Switch 
                        checked={page.isSmallText} 
                        onCheckedChange={(val) => updatePage(pageId, { isSmallText: val })} 
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label className="text-sm">Full width</Label>
                        <p className="text-[10px] text-zinc-500">Use the entire width of the screen</p>
                    </div>
                    <Switch 
                        checked={page.isFullWidth} 
                        onCheckedChange={(val) => updatePage(pageId, { isFullWidth: val })} 
                    />
                </div>
            </div>

            <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-4">Information</h3>
                <div className="flex items-center gap-3 text-zinc-500">
                    <FileText size={14} />
                    <span className="text-xs">{getWordCount()} words</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-500">
                    <Clock size={14} />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">Last edited</span>
                        <span className="text-xs">{format(new Date(page.updatedAt), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                </div>

                <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 h-9 text-xs"
                    onClick={() => setShowShareModal(true)}
                >
                    <Share2 size={14} />
                    Share this page
                </Button>

                <Button 
                    variant="outline" 
                    className="w-full justify-start gap-2 h-9 text-xs"
                    onClick={() => setShowVersionHistory(true)}
                >
                    <History size={14} />
                    View version history
                </Button>
            </div>

            <PageShareModal 
                pageId={pageId} 
                pageTitle={page.title} 
                isOpen={showShareModal} 
                onClose={() => setShowShareModal(false)} 
            />
        </div>
    );
}
