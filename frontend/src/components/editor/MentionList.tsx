import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface MentionListProps {
  items: any[];
  command: (item: any) => void;
}

const MentionList = forwardRef((props: MentionListProps, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.id, label: item.name });
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="z-50 min-w-[200px] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground ${
              index === selectedIndex ? 'bg-accent text-accent-foreground' : ''
            }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={item.avatar} />
              <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span>{item.name}</span>
          </button>
        ))
      ) : (
        <div className="px-2 py-1.5 text-sm text-muted-foreground">No users found</div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';

export default MentionList;
