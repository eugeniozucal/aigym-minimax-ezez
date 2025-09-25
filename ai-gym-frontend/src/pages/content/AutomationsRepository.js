import { jsx as _jsx } from "react/jsx-runtime";
import { ContentRepository } from '@/components/content/ContentRepository';
import { Zap } from 'lucide-react';
import { CONTENT_TYPES } from '@/lib/constants';
export function AutomationsRepository() {
    return (_jsx(ContentRepository, { contentType: "automation", title: CONTENT_TYPES.automation.label, description: CONTENT_TYPES.automation.description, icon: Zap, color: CONTENT_TYPES.automation.color }));
}
export default AutomationsRepository;
