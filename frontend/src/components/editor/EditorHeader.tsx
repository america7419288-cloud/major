import React, { useState, useRef, useEffect } from 'react';
import { usePageStore } from '@/store/page.store';
import { useUIStore } from '@/store';
import { Smile, Image as ImageIcon, MessageSquare, MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import EmojiPicker from 'emoji-picker-react';

interface EditorHeaderProps {
    pageId: string;
}

export default function EditorHeader({ pageId }: EditorHeaderProps) {
    const { pages, updatePage } = usePageStore();
    const { toggleRightPanel } = useUIStore();
    const page = pages.find(p => p.id === pageId);
    
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const titleRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (titleRef.current && page) {
            titleRef.current.value = page.title;
            adjustTitleHeight();
        }
    }, [page?.id]);

    const adjustTitleHeight = () => {
        if (titleRef.current) {
            titleRef.current.style.height = 'auto';
            titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
        }
    };

    const handleTitleBlur = () => {
        if (titleRef.current && page && titleRef.current.value !== page.title) {
            updatePage(pageId, { title: titleRef.current.value });
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            titleRef.current?.blur();
        }
    };

    const handleAddCover = () => {
        const gradients = [
            'linear-gradient(to right, #ff7e5f, #feb47b)',
            'linear-gradient(to right, #6a11cb, #2575fc)',
            'linear-gradient(to right, #00b09b, #96c93d)',
            'linear-gradient(to right, #f80759, #bc4e9c)',
        ];
        const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
        updatePage(pageId, { coverImage: randomGradient });
    };

    if (!page) return null;

    return (
        <div 
            className="group relative w-full mb-8"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Cover Image */}
            {page.coverImage ? (
                <div className="relative h-[30vh] min-h-[150px] w-full overflow-hidden">
                    <div 
                        className="w-full h-full bg-cover bg-center"
                        style={{ backgroundImage: page.coverImage.startsWith('linear-gradient') ? page.coverImage : `url(${page.coverImage})` }}
                    />
                    <div className="absolute bottom-4 right-8 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm"
                            onClick={handleAddCover}
                        >
                            Change cover
                        </Button>
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            className="bg-white/80 dark:bg-zinc-800/80 backdrop-blur-sm"
                            onClick={() => updatePage(pageId, { coverImage: undefined })}
                        >
                            Remove
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="h-24 w-full" />
            )}

            <div className={cn(
                "max-w-4xl mx-auto px-12 relative",
                page.isFullWidth ? "max-w-full" : "max-w-4xl"
            )}>
                {/* Icon */}
                <div className={cn(
                    "relative mb-4 group/icon",
                    page.coverImage ? "-mt-16" : "mt-0"
                )}>
                    {page.icon ? (
                        <div 
                            className="text-7xl cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl p-2 w-fit transition-colors"
                            onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                        >
                            {page.icon}
                        </div>
                    ) : (
                        isHovering && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                onClick={() => setIsEmojiPickerOpen(true)}
                            >
                                <Smile className="w-4 h-4 mr-2" />
                                Add icon
                            </Button>
                        )
                    )}

                    {isEmojiPickerOpen && (
                        <div className="absolute top-full left-0 z-50 mt-2">
                            <div className="fixed inset-0" onClick={() => setIsEmojiPickerOpen(false)} />
                            <div className="relative">
                                <EmojiPicker 
                                    onEmojiClick={(emojiData) => {
                                        updatePage(pageId, { icon: emojiData.emoji });
                                        setIsEmojiPickerOpen(false);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Shortcuts */}
                {!page.coverImage && isHovering && (
                    <div className="flex gap-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-400 h-7 px-2"
                            onClick={handleAddCover}
                        >
                            <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
                            Add cover
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-400 h-7 px-2"
                        >
                            <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                            Add comment
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-zinc-400 h-7 px-2"
                            onClick={() => toggleRightPanel()}
                        >
                            <MoreHorizontal className="w-3.5 h-3.5 mr-1.5" />
                            Settings
                        </Button>
                    </div>
                )}

                {/* Title */}
                <textarea
                    ref={titleRef}
                    className="w-full text-5xl font-bold bg-transparent border-none outline-none resize-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800 leading-tight"
                    placeholder="Untitled"
                    onChange={adjustTitleHeight}
                    onBlur={handleTitleBlur}
                    onKeyDown={handleTitleKeyDown}
                    rows={1}
                />
            </div>
        </div>
    );
}
