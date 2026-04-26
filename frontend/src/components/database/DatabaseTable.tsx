import React, { useState } from 'react';
import { Database, DatabaseItem, PropertyDef } from '@/types';
import PropertyCell from './PropertyCell';
import { useDatabaseStore } from '@/store';
import { Plus, GripVertical, MoreHorizontal, Settings2, Columns } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatabaseTableProps {
    database: Database;
    items: DatabaseItem[];
    onUpdateItem: (id: string, properties: any) => void;
    onDeleteItem: (id: string) => void;
    onCreateItem: () => void;
}

const DatabaseTable: React.FC<DatabaseTableProps> = ({
    database,
    items,
    onUpdateItem,
    onDeleteItem,
    onCreateItem
}) => {
    const handlePropertyChange = (itemId: string, propertyId: string, value: any) => {
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const updatedProperties = {
            ...item.properties,
            [propertyId]: value
        };
        onUpdateItem(itemId, updatedProperties);
    };

    return (
        <div className="w-full overflow-x-auto border rounded-xl border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
            <table className="w-full border-collapse text-left min-w-[800px]">
                <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                        <th className="w-12 px-4 py-3 font-medium text-zinc-500 text-xs"></th>
                        {database.schema.map((prop) => (
                            <th
                                key={prop.id}
                                className="px-4 py-3 font-medium text-zinc-500 text-xs border-r border-zinc-200 dark:border-zinc-800 last:border-r-0"
                                style={{ width: prop.width || 'auto' }}
                            >
                                <div className="flex items-center gap-2">
                                    <span>{prop.name}</span>
                                </div>
                            </th>
                        ))}
                        <th className="w-full px-4 py-3 font-medium text-zinc-500 text-xs"></th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-900 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors group">
                            <td className="px-4 py-2">
                                <GripVertical className="w-3.5 h-3.5 text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" />
                            </td>
                            {database.schema.map((prop) => (
                                <td key={prop.id} className="border-r border-zinc-100 dark:border-zinc-900 last:border-r-0">
                                    <PropertyCell
                                        property={prop}
                                        value={item.properties[prop.id] || item.properties[prop.name]}
                                        onChange={(val) => handlePropertyChange(item.id, prop.id, val)}
                                    />
                                </td>
                            ))}
                            <td className="w-full flex items-center justify-end px-4 h-full">
                                <button
                                    onClick={() => onDeleteItem(item.id)}
                                    className="p-1.5 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                    <tr className="group">
                        <td className="px-4 py-3"></td>
                        <td
                            colSpan={database.schema.length}
                            className="px-4 py-3 cursor-pointer text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-sm transition-colors"
                            onClick={onCreateItem}
                        >
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                <span>New item</span>
                            </div>
                        </td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default DatabaseTable;
