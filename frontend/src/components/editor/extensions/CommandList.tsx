import React, {
    useState,
    useEffect,
    useImperativeHandle,
    forwardRef,
} from 'react';
import {
    Type,
    Heading1,
    Heading2,
    List,
    ListOrdered,
    CheckSquare,
    Code,
    Minus
} from 'lucide-react';

const CommandList = forwardRef((props: any, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item);
        }
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }) => {
            if (event.key === 'ArrowUp') {
                setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
                return true;
            }
            if (event.key === 'ArrowDown') {
                setSelectedIndex((selectedIndex + 1) % props.items.length);
                return true;
            }
            if (event.key === 'Enter') {
                selectItem(selectedIndex);
                return true;
            }
            return false;
        },
    }));

    const getIcon = (name: string) => {
        switch (name) {
            case 'Text': return <Type size={18} />;
            case 'Heading1': return <Heading1 size={18} />;
            case 'Heading2': return <Heading2 size={18} />;
            case 'List': return <List size={18} />;
            case 'ListOrdered': return <ListOrdered size={18} />;
            case 'CheckSquare': return <CheckSquare size={18} />;
            case 'Code': return <Code size={18} />;
            case 'Minus': return <Minus size={18} />;
            default: return <Type size={18} />;
        }
    };

    return (
        <div className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg-secondary))] p-1 shadow-md transition-all">
            {props.items.length > 0 ? (
                props.items.map((item: any, index: number) => (
                    <button
                        className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-[rgb(var(--text))] hover:bg-[rgb(var(--bg-tertiary))] ${index === selectedIndex ? 'bg-[rgb(var(--bg-tertiary))]' : ''}`}
                        key={index}
                        onClick={() => selectItem(index)}
                    >
                        <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg-secondary))]">
                            {getIcon(item.icon)}
                        </div>
                        <div>
                            <p className="font-medium">{item.title}</p>
                            <p className="text-xs text-[rgb(var(--text-muted))]">
                                {item.description}
                            </p>
                        </div>
                    </button>
                ))
            ) : (
                <div className="p-3 text-sm text-[rgb(var(--text-muted))]">No results found</div>
            )}
        </div>
    );
});

CommandList.displayName = 'CommandList';

export default CommandList;
