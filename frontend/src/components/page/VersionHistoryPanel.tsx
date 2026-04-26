import React, { useEffect, useState } from 'react';
import { usePageStore } from '@/store/page.store';
import { api } from '@/lib/axios';
import { format } from 'date-fns';
import { History, RotateCcw, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListSkeleton } from '@/components/ui/SkeletonLoader';
import VersionPreviewModal from './VersionPreviewModal';

interface Version {
  id: string;
  title: string;
  createdAt: string;
  changeDescription: string;
  createdBy: {
    id: string;
    name: string;
    avatar: string;
  };
}

interface VersionHistoryPanelProps {
  pageId: string;
  onClose: () => void;
}

export default function VersionHistoryPanel({ pageId, onClose }: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewVersion, setPreviewVersion] = useState<Version | null>(null);
  const { restoreVersion } = usePageStore() as any;

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const res = await api.get(`/pages/${pageId}/versions`);
        setVersions(res.data.data);
      } catch (error) {
        console.error('Failed to fetch versions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [pageId]);

  const handleRestore = async (versionId: string) => {
    try {
      await restoreVersion(pageId, versionId);
      onClose();
    } catch (error) {
      console.error('Failed to restore version:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 w-80">
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <History size={18} />
          <span>Version History</span>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X size={18} />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <ListSkeleton />
        ) : versions.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            <p className="text-sm">No versions found for this page.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {versions.map((version) => (
              <div
                key={version.id}
                className="p-3 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 group transition-colors"
              >
                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={version.createdBy.avatar} />
                    <AvatarFallback>{version.createdBy.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {format(new Date(version.createdAt), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="text-xs text-zinc-500 truncate">
                      {version.createdBy.name} • {version.changeDescription || 'No description'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] flex-1"
                    onClick={() => setPreviewVersion(version)}
                  >
                    <Eye size={12} className="mr-1" />
                    Preview
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-[10px] flex-1"
                    onClick={() => handleRestore(version.id)}
                  >
                    <RotateCcw size={12} className="mr-1" />
                    Restore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {previewVersion && (
        <VersionPreviewModal
          versionId={previewVersion.id}
          onClose={() => setPreviewVersion(null)}
          onRestore={() => handleRestore(previewVersion.id)}
        />
      )}
    </div>
  );
}
