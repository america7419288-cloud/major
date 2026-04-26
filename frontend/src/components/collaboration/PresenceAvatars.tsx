import React from 'react';
import { usePresenceStore } from '@/store';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const PresenceAvatars: React.FC = () => {
    const activeUsers = usePresenceStore((state) => state.activeUsers);

    if (activeUsers.length === 0) return null;

    return (
        <div className="flex -space-x-2 overflow-hidden items-center px-4">
            <TooltipProvider>
                {activeUsers.map((user) => (
                    <Tooltip key={user.userId}>
                        <TooltipTrigger asChild>
                            <div
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium ring-offset-background transition-opacity hover:opacity-80"
                                style={{
                                    backgroundColor: user.avatarUrl ? 'transparent' : stringToColor(user.name)
                                }}
                            >
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt={user.name}
                                        className="h-full w-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-white">
                                        {getInitials(user.name)}
                                    </span>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{user.name} (Active now)</p>
                        </TooltipContent>
                    </Tooltip>
                ))}
            </TooltipProvider>
        </div>
    );
};

// Helper to generate a consistent color for a name
function stringToColor(string: string) {
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 70%, 45%)`;
    return color;
}

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default PresenceAvatars;
