import React, { useState } from 'react';
import { Database, PropertyDef, PropertyType } from '@/types';
import {
    X,
    Plus,
    Settings2,
    ChevronRight,
    Type,
    Hash,
    List,
    CheckSquare,
    Calendar,
    Link,
    Mail,
    Phone,
    Users,
    Trash2,
    GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PropertySchemaEditorProps {
    database: Database;
    onUpdateSchema: (schema: PropertyDef[]) => void;
    onClose: () => void;
}

const PROPERTY_TYPES: { type: PropertyType; label: string; icon: any }[] = [
    { type: 'TEXT', label: 'Text', icon: Type },
    { type: 'NUMBER', label: 'Number', icon: Hash },
    { type: 'SELECT', label: 'Select', icon: List },
    { type: 'MULTI_SELECT', label: 'Multi-select', icon: List },
    { type: 'CHECKBOX', label: 'Checkbox', icon: CheckSquare },
    { type: 'DATE', label: 'Date', icon: Calendar },
    { type: 'URL', label: 'URL', icon: Link },
    { type: 'EMAIL', label: 'Email', icon: Mail },
    { type: 'PHONE', label: 'Phone', icon: Phone },
    { type: 'PERSON', label: 'Person', icon: Users },
];

const PropertySchemaEditor: React.FC<PropertySchemaEditorProps> = ({ database, onUpdateSchema, onClose }) => {
    const [schema, setSchema] = useState<PropertyDef[]>(database.schema);

    const handleAddProperty = () => {
        const newProp: PropertyDef = {
            id: crypto.randomUUID(),
            name: 'New Property',
            type: 'TEXT',
            width: 200
        };
        setSchema([...schema, newProp]);
    };

    const handleUpdateProperty = (id: string, updates: Partial<PropertyDef>) => {
        setSchema(schema.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const handleDeleteProperty = (id: string) => {
        setSchema(schema.filter(p => p.id !== id));
    };

    const handleSave = () => {
        onUpdateSchema(schema);
        onClose();
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[400px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-900">
                <div className="flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-indigo-500" />
                    <h3 className="font-semibold text-lg">Database Properties</h3>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg transition-colors">
                    <X className="w-5 h-5 text-zinc-500" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="space-y-4">
                    {schema.map((prop) => (
                        <div key={prop.id} className="group p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center gap-3">
                                <GripVertical className="w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    value={prop.name}
                                    onChange={(e) => handleUpdateProperty(prop.id, { name: e.target.value })}
                                    className="flex-1 bg-transparent border-none outline-none font-medium p-0 focus:ring-0"
                                />
                                <button
                                    onClick={() => handleDeleteProperty(prop.id)}
                                    className="p-1.5 text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {PROPERTY_TYPES.map((pt) => {
                                    const Icon = pt.icon;
                                    const isSelected = prop.type === pt.type;
                                    return (
                                        <button
                                            key={pt.type}
                                            onClick={() => handleUpdateProperty(prop.id, { type: pt.type })}
                                            className={cn(
                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border",
                                                isSelected
                                                    ? "bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
                                                    : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300"
                                            )}
                                        >
                                            <Icon className="w-3.5 h-3.5" />
                                            {pt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    variant="outline"
                    className="w-full border-dashed border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 h-12 gap-2 text-zinc-500"
                    onClick={handleAddProperty}
                >
                    <Plus className="w-4 h-4" />
                    Add Property
                </Button>
            </div>

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>Save Changes</Button>
                </div>
            </div>
        </div>
    );
};

export default PropertySchemaEditor;
