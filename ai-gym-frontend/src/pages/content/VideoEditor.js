import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ContentEditor } from '@/components/content/ContentEditor';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Play, Globe, Clock, FileText, AlertCircle, ExternalLink, CheckCircle } from 'lucide-react';
export function VideoEditor() {
    const { id } = useParams();
    const isEdit = !!id;
    const [video, setVideo] = useState(null);
    const [videoUrl, setVideoUrl] = useState('');
    const [transcription, setTranscription] = useState('');
    const [autoTitle, setAutoTitle] = useState('');
    const [autoDescription, setAutoDescription] = useState('');
    const [loading, setLoading] = useState(isEdit);
    const [urlProcessing, setUrlProcessing] = useState(false);
    const [urlError, setUrlError] = useState(null);
    const [metadata, setMetadata] = useState(null);
    useEffect(() => {
        if (isEdit && id) {
            fetchVideo();
        }
    }, [isEdit, id]);
    useEffect(() => {
        if (videoUrl.trim()) {
            processVideoUrl(videoUrl.trim());
        }
    }, [videoUrl]);
    const fetchVideo = async () => {
        if (!id)
            return;
        try {
            const { data, error } = await supabase
                .from('videos')
                .select('*')
                .eq('content_item_id', id)
                .maybeSingle();
            if (error)
                throw error;
            if (data) {
                setVideo(data);
                setVideoUrl(data.video_url);
                setTranscription(data.transcription || '');
                setAutoTitle(data.auto_title || '');
                setAutoDescription(data.auto_description || '');
                if (data.video_platform && data.video_id) {
                    setMetadata({
                        platform: data.video_platform,
                        videoId: data.video_id,
                        duration: data.duration_seconds || undefined
                    });
                }
            }
        }
        catch (error) {
            console.error('Error fetching video:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const processVideoUrl = async (url) => {
        setUrlProcessing(true);
        setUrlError(null);
        try {
            const videoMetadata = parseVideoUrl(url);
            setMetadata(videoMetadata);
            // Auto-populate title if available
            if (videoMetadata.title) {
                setAutoTitle(videoMetadata.title);
            }
            if (videoMetadata.description) {
                setAutoDescription(videoMetadata.description);
            }
        }
        catch (error) {
            setUrlError(error.message || 'Failed to process video URL');
            setMetadata(null);
        }
        finally {
            setUrlProcessing(false);
        }
    };
    const parseVideoUrl = (url) => {
        // YouTube URL patterns
        const youtubePatterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
            /youtube\.com\/embed\/([\w-]+)/,
            /youtube\.com\/v\/([\w-]+)/
        ];
        // Vimeo URL patterns
        const vimeoPatterns = [
            /vimeo\.com\/(\d+)/,
            /player\.vimeo\.com\/video\/(\d+)/
        ];
        // Check YouTube
        for (const pattern of youtubePatterns) {
            const match = url.match(pattern);
            if (match) {
                return {
                    platform: 'youtube',
                    videoId: match[1],
                    title: `YouTube Video ${match[1]}`,
                    description: 'Video imported from YouTube'
                };
            }
        }
        // Check Vimeo
        for (const pattern of vimeoPatterns) {
            const match = url.match(pattern);
            if (match) {
                return {
                    platform: 'vimeo',
                    videoId: match[1],
                    title: `Vimeo Video ${match[1]}`,
                    description: 'Video imported from Vimeo'
                };
            }
        }
        // Generic video URL
        if (url.match(/\.(mp4|webm|ogg|mov|avi|mkv)$/i)) {
            return {
                platform: 'other',
                title: url.split('/').pop()?.split('.')[0] || 'Video File',
                description: 'Direct video file'
            };
        }
        throw new Error('Unsupported video URL format. Please use YouTube, Vimeo, or direct video file URLs.');
    };
    const getEmbedUrl = (metadata) => {
        if (metadata.platform === 'youtube' && metadata.videoId) {
            return `https://www.youtube.com/embed/${metadata.videoId}?rel=0&modestbranding=1`;
        }
        if (metadata.platform === 'vimeo' && metadata.videoId) {
            return `https://player.vimeo.com/video/${metadata.videoId}?title=0&byline=0&portrait=0`;
        }
        return videoUrl;
    };
    const calculateReadingTime = (text) => {
        // Average reading speed: 200 words per minute
        const wordCount = text.trim().split(/\s+/).length;
        return Math.ceil(wordCount / 200);
    };
    const saveVideoData = async (contentItemId) => {
        try {
            const videoData = {
                content_item_id: contentItemId,
                video_url: videoUrl.trim(),
                video_platform: metadata?.platform || null,
                video_id: metadata?.videoId || null,
                duration_seconds: metadata?.duration || null,
                transcription: transcription.trim() || null,
                auto_title: autoTitle.trim() || null,
                auto_description: autoDescription.trim() || null
            };
            if (video) {
                const { error } = await supabase
                    .from('videos')
                    .update({ ...videoData, updated_at: new Date().toISOString() })
                    .eq('id', video.id);
                if (error)
                    throw error;
            }
            else {
                const { error } = await supabase
                    .from('videos')
                    .insert([videoData]);
                if (error)
                    throw error;
            }
        }
        catch (error) {
            console.error('Error saving video data:', error);
            throw error;
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading video..." })] }) }));
    }
    return (_jsx(ContentEditor, { contentType: "video", isEdit: isEdit, onSaveContent: saveVideoData, title: "Videos", description: "Educational videos with transcriptions", color: "#EF4444", icon: Play, children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Globe, { className: "h-5 w-5 mr-2 text-red-500" }), "Video Source"] }), _jsx("div", { className: "space-y-4", children: _jsxs("div", { children: [_jsx("label", { htmlFor: "videoUrl", className: "block text-sm font-medium text-gray-700 mb-2", children: "Video URL *" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "url", id: "videoUrl", value: videoUrl, onChange: (e) => setVideoUrl(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500", placeholder: "https://www.youtube.com/watch?v=... or https://vimeo.com/...", required: true }), urlProcessing && (_jsx("div", { className: "absolute right-3 top-1/2 transform -translate-y-1/2", children: _jsx(LoadingSpinner, { size: "sm" }) }))] }), urlError && (_jsx("div", { className: "mt-2 p-3 bg-red-50 border border-red-200 rounded-lg", children: _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(AlertCircle, { className: "h-4 w-4 text-red-600" }), _jsx("p", { className: "text-sm text-red-700", children: urlError })] }) })), metadata && !urlError && (_jsxs("div", { className: "mt-2 p-3 bg-green-50 border border-green-200 rounded-lg", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-2", children: [_jsx(CheckCircle, { className: "h-4 w-4 text-green-600" }), _jsxs("p", { className: "text-sm text-green-700 font-medium", children: [metadata.platform.charAt(0).toUpperCase() + metadata.platform.slice(1), " video detected"] })] }), _jsxs("div", { className: "text-xs text-gray-600 space-y-1", children: [_jsxs("p", { children: ["Platform: ", _jsx("span", { className: "font-mono bg-gray-100 px-2 py-1 rounded", children: metadata.platform })] }), metadata.videoId && (_jsxs("p", { children: ["Video ID: ", _jsx("span", { className: "font-mono bg-gray-100 px-2 py-1 rounded", children: metadata.videoId })] })), metadata.duration && (_jsxs("p", { children: ["Duration: ", _jsxs("span", { className: "font-mono bg-gray-100 px-2 py-1 rounded", children: [Math.floor(metadata.duration / 60), ":", (metadata.duration % 60).toString().padStart(2, '0')] })] }))] })] })), _jsx("p", { className: "text-xs text-gray-500 mt-2", children: "Supported: YouTube, Vimeo, and direct video file URLs (.mp4, .webm, .ogg, etc.)" })] }) })] }), metadata && videoUrl && !urlError && (_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Play, { className: "h-5 w-5 mr-2 text-red-500" }), "Video Preview"] }), _jsx("div", { className: "aspect-video bg-gray-100 rounded-lg overflow-hidden", children: metadata.platform === 'youtube' || metadata.platform === 'vimeo' ? (_jsx("iframe", { src: getEmbedUrl(metadata), title: "Video Preview", className: "w-full h-full", frameBorder: "0", allowFullScreen: true })) : (_jsx("video", { src: videoUrl, controls: true, className: "w-full h-full object-cover", preload: "metadata" })) }), _jsxs("div", { className: "mt-4 flex items-center justify-between text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [metadata.platform && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Globe, { className: "h-4 w-4" }), _jsx("span", { className: "capitalize", children: metadata.platform })] })), metadata.duration && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Clock, { className: "h-4 w-4" }), _jsxs("span", { children: [Math.floor(metadata.duration / 60), ":", (metadata.duration % 60).toString().padStart(2, '0')] })] }))] }), _jsxs("a", { href: videoUrl, target: "_blank", rel: "noopener noreferrer", className: "flex items-center space-x-1 text-red-600 hover:text-red-800", children: [_jsx(ExternalLink, { className: "h-4 w-4" }), _jsx("span", { children: "Open Original" })] })] })] })), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2 text-blue-500" }), "Video Metadata"] }), _jsxs("div", { className: "grid grid-cols-1 gap-4", children: [_jsxs("div", { children: [_jsx("label", { htmlFor: "autoTitle", className: "block text-sm font-medium text-gray-700 mb-2", children: "Auto-detected Title" }), _jsx("input", { type: "text", id: "autoTitle", value: autoTitle, onChange: (e) => setAutoTitle(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Title will be auto-detected from video platform" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "This can be used as a fallback title if main title is empty" })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "autoDescription", className: "block text-sm font-medium text-gray-700 mb-2", children: "Auto-detected Description" }), _jsx("textarea", { id: "autoDescription", rows: 3, value: autoDescription, onChange: (e) => setAutoDescription(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Description will be auto-detected from video platform" }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Auto-populated from the video platform's metadata" })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(FileText, { className: "h-5 w-5 mr-2 text-purple-500" }), "Video Transcription"] }), _jsx("div", { className: "flex items-center space-x-4 text-sm text-gray-600", children: transcription.trim() && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(FileText, { className: "h-4 w-4" }), _jsxs("span", { children: [transcription.trim().split(/\s+/).length, " words"] })] }), _jsxs("div", { className: "flex items-center space-x-1", children: [_jsx(Clock, { className: "h-4 w-4" }), _jsxs("span", { children: [calculateReadingTime(transcription), " min read"] })] })] })) })] }), _jsxs("div", { children: [_jsx("textarea", { value: transcription, onChange: (e) => setTranscription(e.target.value), rows: 12, className: "w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500", placeholder: "Enter the video transcription here...\\n\\nThis text will be searchable and can be used for generating subtitles or providing accessible content for users." }), _jsx("div", { className: "mt-3 p-3 bg-purple-50 rounded-lg", children: _jsxs("p", { className: "text-xs text-purple-700", children: [_jsx("strong", { children: "Accessibility Tip:" }), " Adding transcriptions makes your video content accessible to hearing-impaired users and improves SEO by making video content searchable."] }) })] })] }), metadata && (_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Technical Information" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("label", { className: "font-medium text-gray-700", children: "Platform" }), _jsx("p", { className: "text-gray-900 capitalize", children: metadata.platform })] }), metadata.videoId && (_jsxs("div", { children: [_jsx("label", { className: "font-medium text-gray-700", children: "Video ID" }), _jsx("p", { className: "text-gray-900 font-mono text-xs", children: metadata.videoId })] })), metadata.duration && (_jsxs("div", { children: [_jsx("label", { className: "font-medium text-gray-700", children: "Duration" }), _jsxs("p", { className: "text-gray-900", children: [Math.floor(metadata.duration / 3600), "h ", Math.floor((metadata.duration % 3600) / 60), "m ", metadata.duration % 60, "s"] })] })), _jsxs("div", { children: [_jsx("label", { className: "font-medium text-gray-700", children: "URL" }), _jsx("p", { className: "text-gray-900 truncate", title: videoUrl, children: videoUrl })] })] })] }))] }) }));
}
export default VideoEditor;
