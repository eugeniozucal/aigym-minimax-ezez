import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { ContentEditor } from '@/components/content/ContentEditor';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FileText, Type, Eye, Code, BarChart3 } from 'lucide-react';
export function DocumentEditor() {
    const { id } = useParams();
    const isEdit = !!id;
    const quillRef = useRef(null);
    const [document, setDocument] = useState(null);
    const [contentHtml, setContentHtml] = useState('');
    const [contentJson, setContentJson] = useState(null);
    const [loading, setLoading] = useState(isEdit);
    const [previewMode, setPreviewMode] = useState(false);
    const [stats, setStats] = useState({
        wordCount: 0,
        characterCount: 0,
        readingTime: 0,
        paragraphs: 0
    });
    useEffect(() => {
        if (isEdit && id) {
            fetchDocument();
        }
    }, [isEdit, id]);
    useEffect(() => {
        calculateStats(contentHtml);
    }, [contentHtml]);
    const fetchDocument = async () => {
        if (!id)
            return;
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('content_item_id', id)
                .maybeSingle();
            if (error)
                throw error;
            if (data) {
                setDocument(data);
                setContentHtml(data.content_html || '');
                setContentJson(data.content_json);
            }
        }
        catch (error) {
            console.error('Error fetching document:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const calculateStats = (html) => {
        // Remove HTML tags and calculate stats
        const textContent = html.replace(/<[^>]*>/g, '').trim();
        const words = textContent ? textContent.split(/\s+/).length : 0;
        const characters = textContent.length;
        const readingTime = Math.ceil(words / 200); // Average 200 words per minute
        const paragraphs = html.split(/<\/p>/gi).length - 1 || (textContent ? 1 : 0);
        setStats({
            wordCount: words,
            characterCount: characters,
            readingTime: Math.max(1, readingTime),
            paragraphs
        });
    };
    const saveDocumentData = async (contentItemId) => {
        try {
            const documentData = {
                content_item_id: contentItemId,
                content_html: contentHtml,
                content_json: contentJson,
                word_count: stats.wordCount,
                reading_time_minutes: stats.readingTime
            };
            if (document) {
                const { error } = await supabase
                    .from('documents')
                    .update({ ...documentData, updated_at: new Date().toISOString() })
                    .eq('id', document.id);
                if (error)
                    throw error;
            }
            else {
                const { error } = await supabase
                    .from('documents')
                    .insert([documentData]);
                if (error)
                    throw error;
            }
        }
        catch (error) {
            console.error('Error saving document data:', error);
            throw error;
        }
    };
    const handleContentChange = (content, delta, source, editor) => {
        setContentHtml(content);
        setContentJson(editor.getContents());
    };
    // Custom toolbar configuration for professional editing
    const modules = {
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                [{ 'font': [] }, { 'size': [] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'script': 'sub' }, { 'script': 'super' }],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
                [{ 'align': [] }],
                ['blockquote', 'code-block'],
                ['link', 'image', 'video'],
                ['clean']
            ]
        },
        clipboard: {
            matchVisual: false
        }
    };
    const formats = [
        'header', 'font', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'list', 'bullet', 'indent',
        'align',
        'blockquote', 'code-block',
        'link', 'image', 'video'
    ];
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading document..." })] }) }));
    }
    return (_jsx(ContentEditor, { contentType: "document", isEdit: isEdit, onSaveContent: saveDocumentData, title: "Documents", description: "Rich text documents and guides", color: "#10B981", icon: FileText, children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(BarChart3, { className: "h-5 w-5 mr-2 text-green-500" }), "Document Statistics"] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "text-center p-3 bg-blue-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: stats.wordCount.toLocaleString() }), _jsx("div", { className: "text-xs text-blue-600 uppercase tracking-wide font-medium", children: "Words" })] }), _jsxs("div", { className: "text-center p-3 bg-green-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: stats.characterCount.toLocaleString() }), _jsx("div", { className: "text-xs text-green-600 uppercase tracking-wide font-medium", children: "Characters" })] }), _jsxs("div", { className: "text-center p-3 bg-purple-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: stats.readingTime }), _jsx("div", { className: "text-xs text-purple-600 uppercase tracking-wide font-medium", children: "Min Read" })] }), _jsxs("div", { className: "text-center p-3 bg-orange-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-orange-600", children: stats.paragraphs }), _jsx("div", { className: "text-xs text-orange-600 uppercase tracking-wide font-medium", children: "Paragraphs" })] })] })] }), _jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(Type, { className: "h-5 w-5 mr-2 text-green-500" }), "Document Content"] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("button", { onClick: () => setPreviewMode(false), className: `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!previewMode
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [_jsx(Code, { className: "h-4 w-4 mr-1 inline" }), "Edit"] }), _jsxs("button", { onClick: () => setPreviewMode(true), className: `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${previewMode
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [_jsx(Eye, { className: "h-4 w-4 mr-1 inline" }), "Preview"] })] })] }), previewMode ? (
                        /* Preview Mode */
                        _jsx("div", { className: "prose max-w-none", children: _jsx("div", { className: "min-h-96 p-6 border border-gray-200 rounded-lg bg-gray-50", children: contentHtml ? (_jsx("div", { className: "prose max-w-none", dangerouslySetInnerHTML: { __html: contentHtml } })) : (_jsxs("div", { className: "text-center py-12 text-gray-500", children: [_jsx(FileText, { className: "h-12 w-12 mx-auto mb-3 text-gray-300" }), _jsx("p", { children: "No content to preview" }), _jsx("p", { className: "text-sm mt-1", children: "Switch to Edit mode to start writing" })] })) }) })) : (
                        /* Edit Mode */
                        _jsx("div", { className: "border border-gray-200 rounded-lg overflow-hidden", children: _jsx(ReactQuill, { ref: quillRef, theme: "snow", value: contentHtml, onChange: handleContentChange, modules: modules, formats: formats, placeholder: "Start writing your document content here...\\n\\nYou can use the toolbar above to format text, add images, create lists, and more. This editor supports rich text formatting similar to Google Docs or Microsoft Word.", style: {
                                    minHeight: '400px',
                                    fontSize: '16px',
                                    lineHeight: '1.6'
                                } }) })), _jsx("div", { className: "mt-4 p-4 bg-green-50 rounded-lg", children: _jsxs("div", { className: "flex items-start space-x-2", children: [_jsx(FileText, { className: "h-4 w-4 text-green-600 mt-0.5" }), _jsxs("div", { className: "text-sm text-green-700", children: [_jsx("p", { className: "font-medium mb-1", children: "Professional Document Editor" }), _jsx("p", { className: "text-xs leading-relaxed", children: "This rich-text editor supports all standard formatting options including headers, lists, links, images, and code blocks. Content is automatically saved and can be exported or shared with clients." })] })] }) })] }), document && (_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsx("h2", { className: "text-lg font-semibold text-gray-900 mb-4", children: "Document Metadata" }), _jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [_jsxs("div", { children: [_jsx("label", { className: "font-medium text-gray-700", children: "Word Count" }), _jsxs("p", { className: "text-gray-900", children: [stats.wordCount.toLocaleString(), " words"] })] }), _jsxs("div", { children: [_jsx("label", { className: "font-medium text-gray-700", children: "Reading Time" }), _jsxs("p", { className: "text-gray-900", children: [stats.readingTime, " minute", stats.readingTime !== 1 ? 's' : ''] })] }), _jsxs("div", { children: [_jsx("label", { className: "font-medium text-gray-700", children: "Last Updated" }), _jsx("p", { className: "text-gray-900", children: new Date(document.updated_at).toLocaleString() })] }), _jsxs("div", { children: [_jsx("label", { className: "font-medium text-gray-700", children: "Document ID" }), _jsx("p", { className: "text-gray-900 font-mono text-xs", children: document.id })] })] })] }))] }) }));
}
export default DocumentEditor;
