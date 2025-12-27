import React, { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Category, FilterType } from '../../types';

interface TaskInputProps {
    categories: Category[];
    onAdd: (title: string, catId: string | number) => void;
    currentFilter: FilterType;
}

const TaskInput: React.FC<TaskInputProps> = ({ categories, onAdd, currentFilter }) => {
    const { t } = useTranslation();
    const [title, setTitle] = useState('');

    // Default category logic
    const defaultCatId = currentFilter !== 'all' ? currentFilter : (categories.find(c => c.isDefault)?.id || categories[0]?.id || 0);
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
                    className="text-lg h-auto py-2 pl-4 md:pl-6"
                    // autoFocus removed for mobile/UX safety
                    containerClassName="w-full"
                />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
                {/* Custom Category Select */}
                <div className="w-full md:w-auto min-w-[200px]">
                    <Select
                        options={[
                            { value: 0, label: t('common.no_category'), color: '' },
                            ...categories.map(c => ({ value: c.id, label: c.name, color: c.color }))
                        ]}
                        value={selectedCatId}
                        onChange={(val) => setSelectedCatId(val)}
                        renderValue={(opt) => (
                            <div className="flex items-center gap-2">
                                {opt?.value !== 0 && opt?.color ? (
                                    <div className={`w-2 h-2 rounded-full ${opt.color}`} />
                                ) : (
                                    <div className="w-2 h-2 rounded-full border border-slate-300 dark:border-slate-600" />
                                )}
                                <span className="truncate max-w-[100px]">{opt?.label}</span>
                            </div>
                        )}
                        renderOption={(opt) => (
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${opt.color || 'border border-slate-300 dark:border-slate-600'}`}></span>
                                <span className="truncate">{opt.label}</span>
                            </div>
                        )}
                    />
                </div>

                <Button
                    type="submit"
                    variant="primary"
                    icon={Plus}
                    className="flex-1 md:flex-none w-full md:w-auto py-2 px-6 rounded-xl h-11"
                    disabled={!title.trim()}
                >
                    {t('tasks.add_button')}
                </Button>
            </div>
        </form >
    );
};

export default TaskInput;
