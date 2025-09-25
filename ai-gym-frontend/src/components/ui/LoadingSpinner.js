import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export function LoadingSpinner({ size = 'md', className }) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };
    return (_jsx("div", { className: cn('animate-spin rounded-full border-2 border-gray-300 border-t-blue-600', sizeClasses[size], className) }));
}
