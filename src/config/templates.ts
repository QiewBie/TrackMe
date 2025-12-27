import { Sunrise, Zap, Clock } from 'lucide-react';
import { TAG_COLORS } from '../utils/theme';

export const DEFAULT_TEMPLATES = [
    {
        id: 'morning',
        title: 'Morning Routine',
        // Note: Icons are components so we might need a mapping strategy if this file becomes pure JSON.
        // For now, keeping it TS allows importing Lucide icons directly.
        icon: Sunrise,
        color: TAG_COLORS.orange.text,
        keywords: ['morning', 'routine'],
        defaultTasks: ['Drink Water', 'Stretch / Yoga', 'Review Goals']
    },
    {
        id: 'quick',
        title: 'Quick Wins',
        icon: Zap,
        color: TAG_COLORS.blue.text,
        keywords: [],
        defaultTasks: ['Email Inbox Zero', 'Slack Check', 'Plan Tomorrow']
    },
    {
        id: 'deep',
        title: 'Deep Work',
        icon: Clock,
        color: TAG_COLORS.indigo.text,
        keywords: ['work', 'focus'],
        defaultTasks: ['Code Review', 'Feature Implementation']
    }
];
