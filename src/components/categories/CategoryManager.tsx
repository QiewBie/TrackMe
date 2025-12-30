import * as React from 'react';
import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import ConfirmationModal from '../shared/ConfirmationModal';
import { Category } from '../../types';
import { useClickOutside } from '../../hooks/useClickOutside';

import { CATEGORY_COLORS as COLORS } from '../../constants/colors';

interface CategoryManagerProps {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const CategoryManager: React.FC<CategoryManagerProps> = ({ isOpen, onClose, categories, setCategories }) => {
    const { t } = useTranslation();
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(COLORS[9]);
    const [isColorPickerOpen, setIsColorPickerOpen] = useState<boolean | string | number>(false);
    const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
    const pickerRef = useRef<HTMLDivElement>(null);

    useClickOutside(pickerRef, () => {
        if (isColorPickerOpen) setIsColorPickerOpen(false);
    });

    // Edit state
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    const openPicker = (e: React.MouseEvent, id: string | number | boolean) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pickerHeight = 160; // Approximate height of the picker
        const spaceBelow = window.innerHeight - rect.bottom;

        let top = rect.bottom + 8;
        if (spaceBelow < pickerHeight) {
            // If not enough space below, show above
            top = rect.top - pickerHeight - 8;
        }

        // Adjust horizontal position if it goes off screen
        let left = rect.left;
        if (left + 180 > window.innerWidth) {
            left = window.innerWidth - 190;
        }

        setPickerPos({ top, left });
        setIsColorPickerOpen(isColorPickerOpen === id ? false : id);
    };

    const handleAdd = () => {
        if (newName.trim()) {
            setCategories((prev: Category[]) => [...prev, { id: Date.now().toString(), name: newName, color: newColor, isDefault: false }]);
            setNewName('');
            setNewColor(COLORS[9]);
            setIsColorPickerOpen(false);
        }
    };

    const startEdit = (cat: Category) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditColor(cat.color);
    };

    const saveEdit = (id: string | number) => {
        if (editName.trim()) {
            setCategories((prev: Category[]) => prev.map((c: Category) => c.id === id ? { ...c, name: editName, color: editColor } : c));
            setEditingId(null);
        }
    };

    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    const deleteCategory = (cat: Category) => {
        setCategoryToDelete(cat);
    };

    const confirmDelete = () => {
        if (categoryToDelete) {
            setCategories((prev: Category[]) => prev.filter((c: Category) => c.id !== categoryToDelete.id));
            setCategoryToDelete(null);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('categories.title')}
            className="max-w-md"
        >
            <div className="p-4 space-y-6">
                <div className="space-y-3 max-h-[400px] overflow-y-auto px-1 custom-scrollbar">
                    {categories.map((cat: Category) => (
                        <div key={cat.id} className="flex items-center gap-3 p-3 bg-bg-surface border border-border rounded-xl group hover:border-brand-primary transition-all shadow-sm">
                            {editingId === cat.id ? (
                                <div className="flex-1 flex gap-1.5 items-center min-w-0">
                                    <div className="relative shrink-0">
                                        <button
                                            onClick={(e) => openPicker(e, cat.id)}
                                            className={`w-9 h-9 rounded-xl ${editColor} flex items-center justify-center transition-transform active:scale-95 ring-2 ring-offset-2 ring-offset-bg-surface ring-border-subtle`}
                                        >
                                            <div className="w-2.5 h-2.5 bg-white/50 rounded-full" />
                                        </button>
                                    </div>
                                    <Input
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        className="bg-bg-main border-transparent focus:border-brand-primary/50 h-9"
                                        containerClassName="flex-1"
                                        autoFocus
                                    />
                                    <div className="flex justify-end gap-1 shrink-0">
                                        <Button
                                            variant="icon"
                                            onClick={() => setEditingId(null)}
                                            className="w-9 h-9 text-text-secondary hover:bg-bg-main"
                                            icon={X}
                                        />
                                        <Button
                                            variant="primary"
                                            onClick={() => saveEdit(cat.id)}
                                            className="w-9 h-9 p-0 shadow-sm shadow-brand/30"
                                        >
                                            <Check size={18} />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className={`w-3 h-3 rounded-full ${cat.color} ml-1`} />
                                    <span className="font-medium text-text-primary">{cat.name}</span>
                                    {cat.isDefault && <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-subtle text-brand-primary px-2 py-0.5 rounded-full">{t('categories.is_default')}</span>}

                                    <div className="ml-auto flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => startEdit(cat)}
                                            className="w-8 h-8 p-0 text-text-secondary hover:text-brand-primary"
                                        >
                                            <Edit2 size={16} />
                                        </Button>
                                        {!cat.isDefault && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteCategory(cat)}
                                                className="w-8 h-8 p-0 text-text-secondary hover:text-status-error"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                    }
                </div>

                <div className="flex gap-2 items-center bg-bg-main/50 p-2 px-3 rounded-2xl border border-border">
                    <div className="relative">
                        <button
                            onClick={(e) => openPicker(e, 'new')}
                            className={`w-10 h-10 rounded-xl ${newColor} flex items-center justify-center transition-transform active:scale-95 ring-2 ring-offset-2 ring-offset-bg-surface ring-transparent hover:ring-border-subtle`}
                        >
                            <div className="w-3 h-3 bg-white/50 rounded-full" />
                        </button>
                    </div>

                    <Input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder={t('categories.new_project')}
                        className="bg-bg-surface h-10 border-border focus:ring-2 focus:ring-brand-primary/20"
                        containerClassName="flex-1"
                        variant="default"
                    />

                    <Button
                        onClick={handleAdd}
                        variant="primary"
                        size="icon"
                        className="w-10 h-10 p-0 shadow-lg shadow-brand/30 shrink-0"
                    >
                        <Plus size={24} strokeWidth={2.5} />
                    </Button>
                </div>
            </div>

            {/* Global Color Picker Portal */}
            {isColorPickerOpen && createPortal(
                <div
                    ref={pickerRef}
                    className="fixed p-3 bg-bg-surface rounded-2xl shadow-xl border border-border grid grid-cols-4 gap-2 w-[180px] animate-pop-in z-[9999]"
                    style={{ top: pickerPos.top, left: pickerPos.left }}
                >
                    {COLORS.map(c => (
                        <button
                            key={c}
                            onClick={() => {
                                if (isColorPickerOpen === 'new') setNewColor(c);
                                else setEditColor(c);
                                setIsColorPickerOpen(false);
                            }}
                            className={`w-8 h-8 rounded-lg ${c} hover:scale-110 transition-transform ${(isColorPickerOpen === 'new' ? newColor : editColor) === c ? 'ring-2 ring-offset-2 ring-brand-primary' : ''}`}
                        />
                    ))}
                </div>,
                document.body
            )}

            <ConfirmationModal
                isOpen={!!categoryToDelete}
                onClose={() => setCategoryToDelete(null)}
                onConfirm={confirmDelete}
                title={t('common.confirmDelete')}
                message={t('categories.delete_msg', { name: categoryToDelete?.name })}
                confirmLabel={t('common.delete')}
                confirmVariant="danger"
            />
        </Modal>
    );
};

export default CategoryManager;
