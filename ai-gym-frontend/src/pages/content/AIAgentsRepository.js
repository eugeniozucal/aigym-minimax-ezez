import { jsx as _jsx } from "react/jsx-runtime";
import { ContentRepository } from '@/components/content/ContentRepository';
import { Bot } from 'lucide-react';
import { CONTENT_TYPES } from '@/lib/constants';
export function AIAgentsRepository() {
    return (_jsx(ContentRepository, { contentType: "ai_agent", title: CONTENT_TYPES.ai_agent.label, description: CONTENT_TYPES.ai_agent.description, icon: Bot, color: CONTENT_TYPES.ai_agent.color }));
}
export default AIAgentsRepository;
