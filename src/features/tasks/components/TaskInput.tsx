import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { Category, FilterType } from '../../../types';
import { getCategoryClass } from '../../../utils/theme';

interface TaskInputProps {
    categories: Category[];
    onAdd: (title: string, catId: string | number) => void;
    currentFilter: FilterType;
}

const TaskInput: React.FC<TaskInputProps> = ({ categories, onAdd, currentFilter }) => {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');

    // Default category logic: "No Category" (0) by default if All Tasks view
    const defaultCatId = currentFilter !== 'all' ? currentFilter : 0;
    const [selectedCatId, setSelectedCatId] = useState<number | string>(defaultCatId);

    // Sync category with filter
    React.useEffect(() => {
        if (currentFilter !== 'all') {
            setSelectedCatId(currentFilter);
        }
    }, [currentFilter]);

    const submit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (title.trim()) {
            onAdd(title, String(selectedCatId));
            setTitle('');
        }
    };

    return (
        <form onSubmit={submit} className="bg-bg-surface p-2 rounded-2xl shadow-card border border-border flex flex-col md:flex-row items-center gap-2 md:gap-4 transition-all duration-300 hover:shadow-xl">
            <div className="flex-1 w-full md:w-auto">
                <Input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder={t('tasks.input_placeholder')}
                    variant="ghost"
                    className="text-sm h-11 py-2.5 pl-4 md:pl-6"
                    // autoFocus removed for mobile/UX safety
                    containerClassName="w-full"
                />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                {/* Custom Category Select */}
                <div className="flex-1 min-w-[50px] md:min-w-[200px]">
                    <Select
                        options={[
                            { value: 0, label: t('common.no_category'), color: '' },
                            ...categories.map(c => ({ value: c.id, label: c.name, color: c.color }))
                        ]}
                        value={selectedCatId}
                        onChange={(val) => setSelectedCatId(val)}
                        className="w-full h-11"
                        renderValue={(opt) => (
                            <div className="flex items-center gap-2">
                                {opt?.value !== 0 && opt?.color ? (
                                    <div className={`w-2 h-2 rounded-full ${getCategoryClass(opt.color, 'bg')}`} />
                                ) : (
                                    <div className="w-2 h-2 rounded-full border border-border-subtle" />
                                )}
                                <span className="truncate max-w-[100px]">{opt?.label}</span>
                            </div>
                        )}
                        renderOption={(opt) => (
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${opt.color ? getCategoryClass(opt.color, 'bg') : 'border border-border-subtle'}`}></span>
                                <span className="truncate">{opt.label}</span>
                            </div>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    className="h-11 w-11 p-0 rounded-xl shrink-0 shadow-lg shadow-brand/30 flex items-center justify-center"
                    disabled={!title.trim()}
                    aria-label={t('tasks.add_button')}
                >
                    <Plus size={24} />
                </Button>
            </div>
        </form >
    );
};

export default TaskInput;
