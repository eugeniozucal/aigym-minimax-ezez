import { jsx as _jsx } from "react/jsx-runtime";
import { ContentRepository } from '@/components/content/ContentRepository';
import { FileText } from 'lucide-react';
import { CONTENT_TYPES } from '@/lib/constants';
export function DocumentsRepository() {
    return (_jsx(ContentRepository, { contentType: "document", title: CONTENT_TYPES.document.label, description: CONTENT_TYPES.document.description, icon: FileText, color: CONTENT_TYPES.document.color }));
}
export default DocumentsRepository;
