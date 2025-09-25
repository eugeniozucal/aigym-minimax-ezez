import { jsx as _jsx } from "react/jsx-runtime";
import { ContentRepository } from '@/components/content/ContentRepository';
import { Image } from 'lucide-react';
import { CONTENT_TYPES } from '@/lib/constants';
export function ImagesRepository() {
    return (_jsx(ContentRepository, { contentType: "image", title: CONTENT_TYPES.image.label, description: CONTENT_TYPES.image.description, icon: Image, color: CONTENT_TYPES.image.color }));
}
export default ImagesRepository;
