import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800",
                className
            )}
        />
    );
}

export function PageSkeleton() {
    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="space-y-4">
                <Skeleton className="h-10 w-[250px]" />
                <Skeleton className="h-4 w-[400px]" />
            </div>
            <div className="space-y-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
            </div>
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="p-6 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </div>
    );
}

export function ListSkeleton() {
    return (
        <div className="space-y-4 p-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                    </div>
                </div>
            ))}
        </div>
    );
}
