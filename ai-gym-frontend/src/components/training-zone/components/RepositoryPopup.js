import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X, Search, Grid, List, Filter } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supabase } from '@/lib/supabase';
export function RepositoryPopup({ contentType, onContentSelect, onClose }) {
    const [content, setContent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [showPublishedOnly, setShowPublishedOnly] = useState(false);
    useEffect(() => {
        loadContent();
    }, [contentType, showPublishedOnly]);
    // Add video thumbnail generation utility
    const generateVideoThumbnail = (video) => {
        if (!video)
            return null;
        // Generate thumbnail URL based on video platform
        if (video.video_platform === 'youtube' && video.video_id) {
            return `https://img.youtube.com/vi/${video.video_id}/maxresdefault.jpg`;
        }
        if (video.video_platform === 'vimeo' && video.video_id) {
            // For Vimeo, we'll use a placeholder since getting thumbnails requires API call
            return `https://vumbnail.com/${video.video_id}.jpg`;
        }
        // Default video placeholder
        return null;
    };
    // Format duration in seconds to MM:SS or HH:MM:SS
    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };
    const loadContent = async () => {
        setLoading(true);
        setError(null);
        try {
            let transformedContent = [];
            if (contentType === 'video') {
                // Fetch videos with content_items data
                let query = supabase
                    .from('content_items')
                    .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            videos (
              id,
              video_url,
              video_platform,
              video_id,
              duration_seconds,
              transcription,
              auto_title,
              auto_description
            )
          `)
                    .eq('content_type', 'video')
                    .order('updated_at', { ascending: false })
                    .limit(50);
                // Conditionally add published filter
                if (showPublishedOnly) {
                    query = query.eq('status', 'published');
                }
                const { data, error } = await query;
                if (error) {
                    console.error('Error fetching videos:', error);
                    throw new Error('Failed to load videos from database');
                }
                // Transform the data and generate thumbnails
                transformedContent = (data || []).map(item => {
                    const videoData = Array.isArray(item.videos) ? item.videos[0] : item.videos;
                    const thumbnailUrl = item.thumbnail_url || generateVideoThumbnail(videoData);
                    return {
                        ...item,
                        video: videoData,
                        thumbnail_url: thumbnailUrl,
                        description: item.description || videoData?.auto_description || 'No description available'
                    };
                });
            }
            else if (contentType === 'document') {
                // Fetch documents with content_items data
                let query = supabase
                    .from('content_items')
                    .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            documents (
              id,
              content_html,
              content_json,
              word_count,
              reading_time_minutes
            )
          `)
                    .eq('content_type', 'document')
                    .order('updated_at', { ascending: false })
                    .limit(50);
                // Conditionally add published filter
                if (showPublishedOnly) {
                    query = query.eq('status', 'published');
                }
                const { data, error } = await query;
                if (error) {
                    console.error('Error fetching documents:', error);
                    throw new Error('Failed to load documents from database');
                }
                // Transform the data
                transformedContent = (data || []).map(item => {
                    const documentData = Array.isArray(item.documents) ? item.documents[0] : item.documents;
                    return {
                        ...item,
                        document: documentData,
                        description: item.description || `${documentData?.word_count || 0} words, ${documentData?.reading_time_minutes || 0} min read` || 'No description available'
                    };
                });
            }
            else if (contentType === 'prompt') {
                // Fetch prompts with content_items data
                let query = supabase
                    .from('content_items')
                    .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            prompts (
              id,
              prompt_text,
              prompt_category,
              usage_count,
              last_copied_at
            )
          `)
                    .eq('content_type', 'prompt')
                    .order('updated_at', { ascending: false })
                    .limit(50);
                // Conditionally add published filter
                if (showPublishedOnly) {
                    query = query.eq('status', 'published');
                }
                const { data, error } = await query;
                if (error) {
                    console.error('Error fetching prompts:', error);
                    throw new Error('Failed to load prompts from database');
                }
                // Transform the data
                transformedContent = (data || []).map(item => {
                    const promptData = Array.isArray(item.prompts) ? item.prompts[0] : item.prompts;
                    return {
                        ...item,
                        prompt: promptData,
                        description: item.description || `${promptData?.prompt_category || 'General'} prompt (used ${promptData?.usage_count || 0} times)` || 'No description available'
                    };
                });
            }
            else if (contentType === 'automation') {
                // Fetch automations with content_items data
                let query = supabase
                    .from('content_items')
                    .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            automations (
              id,
              automation_url,
              required_tools,
              tool_description,
              setup_instructions
            )
          `)
                    .eq('content_type', 'automation')
                    .order('updated_at', { ascending: false })
                    .limit(50);
                // Conditionally add published filter
                if (showPublishedOnly) {
                    query = query.eq('status', 'published');
                }
                const { data, error } = await query;
                if (error) {
                    console.error('Error fetching automations:', error);
                    throw new Error('Failed to load automations from database');
                }
                // Transform the data
                transformedContent = (data || []).map(item => {
                    const automationData = Array.isArray(item.automations) ? item.automations[0] : item.automations;
                    return {
                        ...item,
                        automation: automationData,
                        description: item.description || automationData?.tool_description || 'No description available'
                    };
                });
            }
            else if (contentType === 'ai-agent') {
                // Fetch AI agents with content_items data
                let query = supabase
                    .from('content_items')
                    .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            ai_agents (
              id,
              agent_name,
              short_description,
              system_prompt
            )
          `)
                    .eq('content_type', 'ai_agent')
                    .order('updated_at', { ascending: false })
                    .limit(50);
                // Conditionally add published filter
                if (showPublishedOnly) {
                    query = query.eq('status', 'published');
                }
                const { data, error } = await query;
                if (error) {
                    console.error('Error fetching AI agents:', error);
                    throw new Error('Failed to load AI agents from database');
                }
                // Transform the data
                transformedContent = (data || []).map(item => {
                    const agentData = Array.isArray(item.ai_agents) ? item.ai_agents[0] : item.ai_agents;
                    return {
                        ...item,
                        ai_agent: agentData,
                        description: item.description || agentData?.short_description || 'No description available'
                    };
                });
            }
            else if (contentType === 'image') {
                // Fetch images with content_items data
                let query = supabase
                    .from('content_items')
                    .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            images (
              id,
              image_url,
              alt_text,
              width,
              height,
              file_size
            )
          `)
                    .eq('content_type', 'image')
                    .order('updated_at', { ascending: false })
                    .limit(50);
                // Conditionally add published filter
                if (showPublishedOnly) {
                    query = query.eq('status', 'published');
                }
                const { data, error } = await query;
                if (error) {
                    console.error('Error fetching images:', error);
                    throw new Error('Failed to load images from database');
                }
                // Transform the data
                transformedContent = (data || []).map(item => {
                    const imageData = Array.isArray(item.images) ? item.images[0] : item.images;
                    return {
                        ...item,
                        image: imageData,
                        thumbnail_url: item.thumbnail_url || imageData?.image_url,
                        description: item.description || `Image - ${imageData?.width && imageData?.height ? `${imageData.width}x${imageData.height}` : 'Unknown size'}` || 'No description available'
                    };
                });
            }
            else if (contentType === 'pdf') {
                // Fetch PDFs with content_items data
                let query = supabase
                    .from('content_items')
                    .select(`
            id,
            title,
            description,
            thumbnail_url,
            content_type,
            status,
            created_by,
            created_at,
            updated_at,
            pdfs (
              id,
              pdf_url,
              file_size,
              page_count,
              thumbnail_url
            )
          `)
                    .eq('content_type', 'pdf')
                    .order('updated_at', { ascending: false })
                    .limit(50);
                // Conditionally add published filter
                if (showPublishedOnly) {
                    query = query.eq('status', 'published');
                }
                const { data, error } = await query;
                if (error) {
                    console.error('Error fetching PDFs:', error);
                    throw new Error('Failed to load PDFs from database');
                }
                // Transform the data
                transformedContent = (data || []).map(item => {
                    const pdfData = Array.isArray(item.pdfs) ? item.pdfs[0] : item.pdfs;
                    return {
                        ...item,
                        pdf: pdfData,
                        thumbnail_url: item.thumbnail_url || pdfData?.thumbnail_url,
                        description: item.description || `PDF - ${pdfData?.page_count ? `${pdfData.page_count} pages` : 'Unknown pages'}${pdfData?.file_size ? `, ${Math.round(pdfData.file_size / 1024)} KB` : ''}` || 'No description available'
                    };
                });
            }
            else if (contentType === 'WODs' || contentType === 'wods') {
                // WORKING PATTERN: Copy from EnhancedWodsRepository.tsx - direct wods table query
                let query = supabase
                    .from('wods')
                    .select('*');
                // Apply status filter (matching working pattern)
                if (showPublishedOnly) {
                    query = query.eq('status', 'published');
                }
                // Apply ordering (matching working pattern)
                query = query.order('updated_at', { ascending: false });
                query = query.limit(50);
                const { data, error } = await query;
                if (error) {
                    console.error('Error fetching WODs (working pattern):', error);
                    throw new Error('Failed to load WODs from database');
                }
                // Transform the data to match RepositoryPopup interface
                transformedContent = (data || []).map(wod => ({
                    id: wod.id,
                    title: wod.title,
                    description: wod.description || `${wod.estimated_duration_minutes || 0} min • ${wod.difficulty_level || 'Unknown'} difficulty`,
                    thumbnail_url: wod.thumbnail_url,
                    content_type: 'wod',
                    status: wod.status,
                    created_by: wod.created_by,
                    created_at: wod.created_at,
                    updated_at: wod.updated_at,
                    wod: {
                        id: wod.id,
                        duration_minutes: wod.estimated_duration_minutes,
                        difficulty_level: wod.difficulty_level,
                        target_muscle_groups: wod.tags || [],
                        equipment_needed: [],
                        instructions: wod.description,
                        notes: ''
                    }
                }));
            }
            else if (contentType === 'BLOCKS' || contentType === 'blocks') {
                // FIXED: Query workout_blocks table where real blocks are stored
                let query = supabase
                    .from('workout_blocks')
                    .select('*');
                // Apply status filter
                if (showPublishedOnly) {
                    query = query.eq('status', 'published');
                }
                // Apply ordering
                query = query.order('updated_at', { ascending: false });
                query = query.limit(50);
                const { data, error } = await query;
                if (error) {
                    console.error('Error fetching BLOCKS from workout_blocks table:', error);
                    throw new Error('Failed to load BLOCKS from database');
                }
                // Transform the data to match RepositoryPopup interface
                transformedContent = (data || []).map(block => ({
                    id: block.id,
                    title: block.title,
                    description: block.description || `${block.estimated_duration_minutes || 0} min • ${block.difficulty_level || 'Unknown'} difficulty`,
                    thumbnail_url: block.thumbnail_url,
                    content_type: 'block',
                    status: block.status,
                    created_by: block.created_by,
                    created_at: block.created_at,
                    updated_at: block.updated_at,
                    block: {
                        id: block.id,
                        block_type: 'Training',
                        duration_minutes: block.estimated_duration_minutes,
                        intensity_level: block.difficulty_level,
                        target_area: '',
                        instructions: block.description,
                        rest_periods: 0,
                        repetitions: 0
                    }
                }));
            }
            else {
                // For other content types, fall back to the edge function
                const { data, error } = await supabase.functions.invoke('content-repository-manager', {
                    body: {
                        action: 'list',
                        contentType: contentType + 's', // pluralize for API
                        searchQuery: '',
                        filters: showPublishedOnly ? { status: 'published' } : {},
                        sortBy: 'updated_at',
                        sortOrder: 'desc',
                        limit: 50,
                        offset: 0
                    }
                });
                if (error) {
                    console.error('Error fetching content:', error);
                    throw new Error('Failed to load content from repository');
                }
                transformedContent = data?.data?.items || [];
            }
            setContent(transformedContent);
        }
        catch (error) {
            console.error('Failed to load content:', error);
            setError(error instanceof Error ? error.message : 'Failed to load content');
            setContent([]);
        }
        finally {
            setLoading(false);
        }
    };
    const filteredContent = content.filter(item => {
        if (!searchTerm)
            return true;
        const searchLower = searchTerm.toLowerCase();
        // Search in title and description
        const matchesBasic = item.title.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower);
        // For videos, also search in video-specific fields
        if (contentType === 'video' && item.video) {
            const matchesVideo = item.video.auto_title?.toLowerCase().includes(searchLower) ||
                item.video.auto_description?.toLowerCase().includes(searchLower) ||
                item.video.transcription?.toLowerCase().includes(searchLower);
            return matchesBasic || matchesVideo;
        }
        // For documents, also search in document-specific fields
        if (contentType === 'document' && item.document) {
            const matchesDocument = item.document.content_html?.toLowerCase().includes(searchLower);
            return matchesBasic || matchesDocument;
        }
        // For prompts, also search in prompt-specific fields
        if (contentType === 'prompt' && item.prompt) {
            const matchesPrompt = item.prompt.prompt_text?.toLowerCase().includes(searchLower) ||
                item.prompt.prompt_category?.toLowerCase().includes(searchLower);
            return matchesBasic || matchesPrompt;
        }
        // For automations, also search in automation-specific fields
        if (contentType === 'automation' && item.automation) {
            const matchesAutomation = item.automation.tool_description?.toLowerCase().includes(searchLower) ||
                item.automation.setup_instructions?.toLowerCase().includes(searchLower) ||
                item.automation.required_tools?.some(tool => tool.toLowerCase().includes(searchLower));
            return matchesBasic || matchesAutomation;
        }
        // For AI agents, also search in agent-specific fields
        if (contentType === 'ai-agent' && item.ai_agent) {
            const matchesAgent = item.ai_agent.agent_name?.toLowerCase().includes(searchLower) ||
                item.ai_agent.short_description?.toLowerCase().includes(searchLower) ||
                item.ai_agent.system_prompt?.toLowerCase().includes(searchLower);
            return matchesBasic || matchesAgent;
        }
        // For images, also search in image-specific fields
        if (contentType === 'image' && item.image) {
            const dimensions = item.image.width && item.image.height ? `${item.image.width}x${item.image.height}` : '';
            const matchesImage = item.image.alt_text?.toLowerCase().includes(searchLower) ||
                dimensions.toLowerCase().includes(searchLower);
            return matchesBasic || matchesImage;
        }
        // For PDFs, also search in PDF-specific fields
        if (contentType === 'pdf' && item.pdf) {
            const pageInfo = item.pdf.page_count ? `${item.pdf.page_count} pages` : '';
            const sizeInfo = item.pdf.file_size ? `${Math.round(item.pdf.file_size / 1024)} KB` : '';
            const matchesPdf = pageInfo.toLowerCase().includes(searchLower) ||
                sizeInfo.toLowerCase().includes(searchLower);
            return matchesBasic || matchesPdf;
        }
        // For WODs, also search in WOD-specific fields
        if ((contentType === 'WODs' || contentType === 'wods') && item.wod) {
            const matchesWod = item.wod.difficulty_level?.toLowerCase().includes(searchLower) ||
                item.wod.target_muscle_groups?.some(group => group.toLowerCase().includes(searchLower)) ||
                item.wod.equipment_needed?.some(equipment => equipment.toLowerCase().includes(searchLower)) ||
                item.wod.instructions?.toLowerCase().includes(searchLower) ||
                item.wod.notes?.toLowerCase().includes(searchLower);
            return matchesBasic || matchesWod;
        }
        // For BLOCKS, also search in BLOCK-specific fields
        if ((contentType === 'BLOCKS' || contentType === 'blocks') && item.block) {
            const matchesBlock = item.block.block_type?.toLowerCase().includes(searchLower) ||
                item.block.intensity_level?.toLowerCase().includes(searchLower) ||
                item.block.target_area?.toLowerCase().includes(searchLower) ||
                item.block.instructions?.toLowerCase().includes(searchLower);
            return matchesBasic || matchesBlock;
        }
        return matchesBasic;
    });
    const getContentIcon = (type) => {
        switch (type) {
            case 'video': return '🎥';
            case 'ai-agent': return '🤖';
            case 'document': return '📚';
            case 'prompt': return '💭';
            case 'prompts': return '💭';
            case 'automation': return '⚡';
            case 'image': return '🖼️';
            case 'pdf': return '📄';
            case 'WODs':
            case 'wods': return '💪';
            case 'BLOCKS':
            case 'blocks': return '🏗️';
            default: return '📁';
        }
    };
    const getContentTypeLabel = (type) => {
        switch (type) {
            case 'ai-agent': return 'AI Agents';
            case 'prompt': return 'Prompts';
            case 'WODs':
            case 'wods': return 'WODs';
            case 'BLOCKS':
            case 'blocks': return 'BLOCKS';
            default: return type.charAt(0).toUpperCase() + type.slice(1) + 's';
        }
    };
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b border-gray-200", children: [_jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("div", { className: "text-2xl", children: getContentIcon(contentType) }), _jsxs("div", { children: [_jsxs("h2", { className: "text-xl font-semibold text-gray-900", children: ["Select ", getContentTypeLabel(contentType)] }), _jsx("p", { className: "text-sm text-gray-600", children: "Choose content from your repository to add to the WOD" })] })] }), _jsx("button", { onClick: onClose, className: "p-2 text-gray-400 hover:text-gray-600 rounded-lg", children: _jsx(X, { className: "h-5 w-5" }) })] }), _jsxs("div", { className: "flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" }), _jsx("input", { type: "text", placeholder: `Search ${contentType}s...`, value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Filter, { className: "h-4 w-4 text-gray-500" }), _jsxs("label", { className: "flex items-center space-x-2 text-sm", children: [_jsx("input", { type: "checkbox", checked: showPublishedOnly, onChange: (e) => setShowPublishedOnly(e.target.checked), className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-gray-700", children: "Published only" })] })] })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("button", { onClick: () => setViewMode('grid'), className: `p-2 rounded-lg ${viewMode === 'grid'
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'text-gray-400 hover:text-gray-600'}`, children: _jsx(Grid, { className: "h-4 w-4" }) }), _jsx("button", { onClick: () => setViewMode('list'), className: `p-2 rounded-lg ${viewMode === 'list'
                                        ? 'bg-blue-100 text-blue-600'
                                        : 'text-gray-400 hover:text-gray-600'}`, children: _jsx(List, { className: "h-4 w-4" }) })] })] }), _jsx("div", { className: "flex-1 overflow-y-auto p-6", children: loading ? (_jsx("div", { className: "flex items-center justify-center py-20", children: _jsx(LoadingSpinner, { size: "lg" }) })) : error ? (_jsxs("div", { className: "text-center py-20", children: [_jsx("div", { className: "text-4xl text-red-400 mb-4", children: "\u26A0\uFE0F" }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "Failed to load content" }), _jsx("p", { className: "text-gray-600 mb-4", children: error }), _jsx("button", { onClick: loadContent, className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: "Try Again" })] })) : filteredContent.length === 0 ? (_jsxs("div", { className: "text-center py-20", children: [_jsx("div", { className: "text-4xl text-gray-400 mb-4", children: getContentIcon(contentType) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: searchTerm ? `No ${contentType}s found` : `No ${contentType}s available` }), _jsx("p", { className: "text-gray-600", children: searchTerm
                                    ? 'Try adjusting your search terms or filters.'
                                    : `No ${contentType}s have been added to your repository yet.` })] })) : (_jsxs("div", { className: `
              ${viewMode === 'grid'
                            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                            : 'space-y-2'}
            `, children: [filteredContent.map((item) => (_jsx("div", { className: `
                    border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all cursor-pointer
                    ${viewMode === 'grid' ? 'p-4' : 'p-3 flex items-center space-x-3'}
                  `, onClick: () => onContentSelect(item), children: viewMode === 'grid' ? (_jsxs("div", { children: [_jsxs("div", { className: "aspect-video bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden", children: [item.thumbnail_url ? (_jsx("img", { src: item.thumbnail_url, alt: item.title, className: "w-full h-full object-cover", onError: (e) => {
                                                        // Fallback to icon if thumbnail fails to load
                                                        e.currentTarget.style.display = 'none';
                                                        const nextElement = e.currentTarget.nextElementSibling;
                                                        if (nextElement) {
                                                            nextElement.style.display = 'flex';
                                                        }
                                                    } })) : null, _jsx("div", { className: "text-2xl", style: { display: item.thumbnail_url ? 'none' : 'flex' }, children: getContentIcon(contentType) }), contentType === 'video' && item.video?.duration_seconds && (_jsx("div", { className: "absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded", children: formatDuration(item.video.duration_seconds) })), contentType === 'document' && item.document?.reading_time_minutes && (_jsxs("div", { className: "absolute bottom-2 right-2 bg-blue-600 bg-opacity-75 text-white text-xs px-2 py-1 rounded", children: [item.document.reading_time_minutes, " min read"] })), contentType === 'prompt' && item.prompt?.usage_count !== undefined && (_jsxs("div", { className: "absolute bottom-2 right-2 bg-green-600 bg-opacity-75 text-white text-xs px-2 py-1 rounded", children: ["Used ", item.prompt.usage_count, "x"] })), contentType === 'automation' && item.automation?.required_tools && item.automation.required_tools.length > 0 && (_jsxs("div", { className: "absolute bottom-2 right-2 bg-purple-600 bg-opacity-75 text-white text-xs px-2 py-1 rounded", children: [item.automation.required_tools.length, " tools"] }))] }), _jsx("h3", { className: "font-medium text-gray-900 mb-1", children: item.title }), _jsx("p", { className: "text-sm text-gray-600 line-clamp-2", children: item.description }), _jsxs("div", { className: "flex items-center justify-between mt-2", children: [_jsx("p", { className: "text-xs text-gray-500", children: new Date(item.updated_at || item.created_at).toLocaleDateString() }), item.status && (_jsx("span", { className: `text-xs px-2 py-1 rounded-full ${item.status === 'published'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-yellow-100 text-yellow-800'}`, children: item.status }))] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex-shrink-0 relative", children: [_jsxs("div", { className: "w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden", children: [item.thumbnail_url ? (_jsx("img", { src: item.thumbnail_url, alt: item.title, className: "w-full h-full object-cover", onError: (e) => {
                                                                e.currentTarget.style.display = 'none';
                                                                const nextElement = e.currentTarget.nextElementSibling;
                                                                if (nextElement) {
                                                                    nextElement.style.display = 'flex';
                                                                }
                                                            } })) : null, _jsx("div", { className: "text-lg", style: { display: item.thumbnail_url ? 'none' : 'flex' }, children: getContentIcon(contentType) })] }), contentType === 'video' && item.video?.duration_seconds && (_jsx("div", { className: "absolute bottom-0 right-0 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded", children: formatDuration(item.video.duration_seconds) })), contentType === 'document' && item.document?.reading_time_minutes && (_jsxs("div", { className: "absolute bottom-0 right-0 bg-blue-600 bg-opacity-75 text-white text-xs px-1 py-0.5 rounded", children: [item.document.reading_time_minutes, "m"] })), contentType === 'prompt' && item.prompt?.usage_count !== undefined && (_jsxs("div", { className: "absolute bottom-0 right-0 bg-green-600 bg-opacity-75 text-white text-xs px-1 py-0.5 rounded", children: [item.prompt.usage_count, "x"] })), contentType === 'automation' && item.automation?.required_tools && item.automation.required_tools.length > 0 && (_jsx("div", { className: "absolute bottom-0 right-0 bg-purple-600 bg-opacity-75 text-white text-xs px-1 py-0.5 rounded", children: item.automation.required_tools.length }))] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "font-medium text-gray-900 truncate", children: item.title }), item.status && (_jsx("span", { className: `text-xs px-2 py-1 rounded-full ml-2 ${item.status === 'published'
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-yellow-100 text-yellow-800'}`, children: item.status }))] }), _jsx("p", { className: "text-sm text-gray-600 truncate", children: item.description }), _jsx("p", { className: "text-xs text-gray-500", children: new Date(item.updated_at || item.created_at).toLocaleDateString() })] })] })) }, item.id))), "\""] })) }), _jsxs("div", { className: "flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsx("p", { className: "text-sm text-gray-600", children: loading ? 'Loading...' : error ? 'Error loading content' : `${filteredContent.length} ${contentType}${filteredContent.length !== 1 ? 's' : ''} ${searchTerm ? 'found' : 'available'}` }), showPublishedOnly && !error && (_jsx("span", { className: "text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded", children: "Published only" }))] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors", children: "Cancel" }), _jsx("button", { disabled: filteredContent.length === 0 || loading || !!error, className: `px-4 py-2 rounded-lg transition-colors ${filteredContent.length === 0 || loading || !!error
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'}`, children: "Select Content" })] })] })] }) }));
}
