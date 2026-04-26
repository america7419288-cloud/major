import React, { useEffect, useState } from 'react';
import { api } from '@/lib/axios';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';

interface VersionPreviewModalProps {
  versionId: string;
  onClose: () => void;
  onRestore: () => void;
}

export default function VersionPreviewModal({ versionId, onClose, onRestore }: VersionPreviewModalProps) {
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVersion = async () => {
      try {
        const res = await api.get(`/pages/versions/${versionId}`); // This path might need adjustment based on final routes
        setContent(res.data.data.content);
      } catch (error) {
        console.error('Failed to fetch version details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVersion();
  }, [versionId]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Version Preview</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 prose dark:prose-invert max-w-none border rounded-md bg-zinc-50 dark:bg-zinc-900/50">
          {loading ? (
            <div className="space-y-4">
              <div className="h-8 w-1/3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
              <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
              <div className="h-4 w-2/3 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded" />
            </div>
          ) : content ? (
            <div dangerouslySetInnerHTML={{ __html: JSON.stringify(content) }} /> // Simplistic preview for now
          ) : (
            <div className="text-center text-zinc-500 py-20">Failed to load content</div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onRestore}>
            <RotateCcw size={16} className="mr-2" />
            Restore this version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
