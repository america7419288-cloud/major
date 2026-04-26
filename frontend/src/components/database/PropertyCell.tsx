import React from 'react';
import { format } from 'date-fns';
import { PropertyDef, PropertyType } from '@/types';
import { Check, Calendar, Hash, Type, List, CheckSquare, Link, Mail, Phone, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PropertyCellProps {
    property: PropertyDef;
    value: any;
    onChange?: (value: any) => void;
    editable?: boolean;
}

const PropertyCell: React.FC<PropertyCellProps> = ({ property, value, onChange, editable = true }) => {
    const renderIcon = () => {
        switch (property.type) {
            case 'TEXT': return <Type className="w-3 h-3" />;
            case 'NUMBER': return <Hash className="w-3 h-3" />;
            case 'SELECT':
            case 'MULTI_SELECT': return <List className="w-3 h-3" />;
            case 'CHECKBOX': return <CheckSquare className="w-3 h-3" />;
            case 'DATE': return <Calendar className="w-3 h-3" />;
            case 'URL': return <Link className="w-3 h-3" />;
            case 'EMAIL': return <Mail className="w-3 h-3" />;
            case 'PHONE': return <Phone className="w-3 h-3" />;
            case 'PERSON': return <Users className="w-3 h-3" />;
            default: return <Type className="w-3 h-3" />;
        }
    };

    const renderValue = () => {
        if (value === undefined || value === null || value === '') {
            return <span className="text-zinc-400 italic text-xs">Empty</span>;
        }

        switch (property.type) {
            case 'CHECKBOX':
                return (
                    <input
                        type="checkbox"
                        checked={!!value}
                        onChange={(e) => onChange?.(e.target.checked)}
                        disabled={!editable}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                    />
                );
            case 'DATE':
                return <span className="text-sm">{format(new Date(value), 'MMM d, yyyy')}</span>;
            case 'SELECT':
                return (
                    <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
                        {value}
                    </span>
                );
            case 'MULTI_SELECT':
                return (
                    <div className="flex flex-wrap gap-1">
                        {(Array.isArray(value) ? value : []).map((val, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
                                {val}
                            </span>
                        ))}
                    </div>
                );
            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange?.(e.target.value)}
                        disabled={!editable}
                        className="w-full bg-transparent border-none outline-none text-sm p-0 focus:ring-0"
                        placeholder="Click to edit"
                    />
                );
        }
    };

    return (
        <div className="flex items-center gap-2 px-3 py-2 min-h-[40px] group">
            <div className="flex-1 overflow-hidden truncate">
                {renderValue()}
            </div>
        </div>
    );
};

export default PropertyCell;
