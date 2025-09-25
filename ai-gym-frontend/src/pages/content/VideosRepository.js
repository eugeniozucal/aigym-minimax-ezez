import { jsx as _jsx } from "react/jsx-runtime";
import { ContentRepository } from '@/components/content/ContentRepository';
import { Play } from 'lucide-react';
import { CONTENT_TYPES } from '@/lib/constants';
export function VideosRepository() {
    return (_jsx(ContentRepository, { contentType: "video", title: CONTENT_TYPES.video.label, description: CONTENT_TYPES.video.description, icon: Play, color: CONTENT_TYPES.video.color }));
}
export default VideosRepository;
