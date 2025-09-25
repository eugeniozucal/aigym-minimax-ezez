import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ContentEditor } from '@/components/content/ContentEditor';
import { supabase } from '@/lib/supabase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { FileText, Upload, Eye, File, Info, AlertTriangle, FileType } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
export function PDFEditor() {
    const { id } = useParams();
    const isEdit = !!id;
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    const [pdf, setPdf] = useState(null);
    const [loading, setLoading] = useState(isEdit);
    const [uploading, setUploading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState('');
    const [metadata, setMetadata] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    useEffect(() => {
        if (isEdit && id) {
            fetchPDF();
        }
    }, [isEdit, id]);
    const fetchPDF = async () => {
        if (!id)
            return;
        try {
            const { data, error } = await supabase
                .from('pdfs')
                .select('*')
                .eq('content_item_id', id)
                .maybeSingle();
            if (error)
                throw error;
            if (data) {
                setPdf(data);
                setPdfUrl(data.pdf_url || '');
                if (data.file_size && data.page_count) {
                    setMetadata({
                        fileSize: data.file_size,
                        pageCount: data.page_count,
                        fileName: data.pdf_url?.split('/').pop() || 'unknown.pdf',
                        thumbnailUrl: data.thumbnail_url
                    });
                }
            }
        }
        catch (error) {
            console.error('Error fetching PDF:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleFileSelect = useCallback((event) => {
        const file = event.target.files?.[0];
        if (file) {
            handlePDFUpload(file);
        }
    }, []);
    const handleDrop = useCallback((event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file && file.type === 'application/pdf') {
            handlePDFUpload(file);
        }
    }, []);
    const handleDragOver = useCallback((event) => {
        event.preventDefault();
    }, []);
    const handlePDFUpload = async (file) => {
        if (!user) {
            setUploadError('Authentication required');
            return;
        }
        // Validate file type
        if (file.type !== 'application/pdf') {
            setUploadError(`Only PDF files are supported. Received: ${file.type}`);
            return;
        }
        // Validate file size (50MB)
        if (file.size > 52428800) {
            setUploadError('File size exceeds 50MB limit');
            return;
        }
        try {
            setUploading(true);
            setUploadError(null);
            // Convert file to base64
            const reader = new FileReader();
            const base64Promise = new Promise((resolve, reject) => {
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
            const base64Data = await base64Promise;
            // Upload via edge function
            const { data, error } = await supabase.functions.invoke('pdf-upload', {
                body: {
                    fileData: base64Data,
                    fileName: file.name
                }
            });
            if (error)
                throw error;
            if (data?.data) {
                const uploadData = data.data;
                setPdfUrl(uploadData.pdfUrl);
                setMetadata({
                    fileSize: uploadData.fileSize,
                    pageCount: uploadData.pageCount,
                    fileName: uploadData.fileName,
                    thumbnailUrl: uploadData.thumbnailUrl
                });
            }
        }
        catch (error) {
            console.error('Error uploading PDF:', error);
            setUploadError(error instanceof Error ? error.message : 'Failed to upload PDF');
        }
        finally {
            setUploading(false);
        }
    };
    const savePDFData = async (contentItemId) => {
        try {
            if (!pdfUrl) {
                throw new Error('No PDF uploaded');
            }
            const pdfData = {
                content_item_id: contentItemId,
                pdf_url: pdfUrl,
                file_size: metadata?.fileSize,
                page_count: metadata?.pageCount,
                thumbnail_url: metadata?.thumbnailUrl
            };
            if (pdf) {
                const { error } = await supabase
                    .from('pdfs')
                    .update({ ...pdfData, updated_at: new Date().toISOString() })
                    .eq('id', pdf.id);
                if (error)
                    throw error;
            }
            else {
                const { error } = await supabase
                    .from('pdfs')
                    .insert([pdfData]);
                if (error)
                    throw error;
            }
        }
        catch (error) {
            console.error('Error saving PDF data:', error);
            throw error;
        }
    };
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx(LoadingSpinner, { size: "lg" }), _jsx("p", { className: "text-sm text-gray-500 mt-3", children: "Loading PDF..." })] }) }));
    }
    return (_jsx(ContentEditor, { contentType: "pdf", isEdit: isEdit, onSaveContent: savePDFData, title: "PDFs", description: "PDF documents and resources", color: "#DC2626", icon: FileText, children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 flex items-center", children: [_jsx(Upload, { className: "h-5 w-5 mr-2 text-red-500" }), "PDF Upload"] }), pdfUrl && (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("button", { onClick: () => setPreviewMode(false), className: `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!previewMode
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [_jsx(Upload, { className: "h-4 w-4 mr-1 inline" }), "Upload"] }), _jsxs("button", { onClick: () => setPreviewMode(true), className: `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${previewMode
                                                ? 'bg-red-100 text-red-700'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`, children: [_jsx(Eye, { className: "h-4 w-4 mr-1 inline" }), "Preview"] })] }))] }), previewMode && pdfUrl ? (
                        /* Preview Mode */
                        _jsxs("div", { className: "border border-gray-200 rounded-lg overflow-hidden", children: [_jsx("div", { className: "p-4 bg-gray-50 border-b border-gray-200", children: _jsx("p", { className: "text-sm text-gray-600", children: "PDF Preview" }) }), _jsx("div", { className: "p-6", children: _jsxs("div", { className: "bg-white border border-gray-300 rounded-lg p-6 text-center", children: [_jsx("div", { className: "mx-auto h-16 w-16 bg-red-100 rounded-lg flex items-center justify-center mb-4", children: _jsx(FileText, { className: "h-8 w-8 text-red-600" }) }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: metadata?.fileName || 'PDF Document' }), _jsxs("p", { className: "text-sm text-gray-500 mb-4", children: [metadata?.pageCount, " page", metadata?.pageCount !== 1 ? 's' : '', " \u2022 ", metadata ? formatFileSize(metadata.fileSize) : ''] }), _jsxs("div", { className: "flex items-center justify-center space-x-3", children: [_jsxs("a", { href: pdfUrl, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors", children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), "View PDF"] }), _jsxs("a", { href: pdfUrl, download: true, className: "inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors", children: [_jsx(FileText, { className: "h-4 w-4 mr-2" }), "Download"] })] })] }) })] })) : (
                        /* Upload Mode */
                        _jsxs("div", { className: "space-y-4", children: [uploadError && (_jsx("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg", children: _jsxs("div", { className: "flex items-start space-x-2", children: [_jsx(AlertTriangle, { className: "h-4 w-4 text-red-600 mt-0.5" }), _jsxs("div", { className: "text-sm text-red-700", children: [_jsx("p", { className: "font-medium mb-1", children: "Upload Error" }), _jsx("p", { children: uploadError })] })] }) })), _jsx("div", { className: `border-2 border-dashed rounded-lg p-8 text-center transition-colors ${uploading ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-red-400'}`, onDrop: handleDrop, onDragOver: handleDragOver, children: uploading ? (_jsxs("div", { className: "space-y-3", children: [_jsx(LoadingSpinner, { size: "md", className: "mx-auto" }), _jsx("p", { className: "text-sm text-gray-600", children: "Uploading PDF..." })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "mx-auto h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center", children: _jsx(FileText, { className: "h-6 w-6 text-gray-400" }) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: pdfUrl ? 'Change PDF' : 'Upload a PDF' }), _jsx("p", { className: "text-sm text-gray-500 mt-1", children: "Drag and drop or click to select" })] }), _jsx("div", { className: "text-xs text-gray-400", children: "Supports: PDF files only \u2022 Max size: 50MB" }), _jsx("button", { onClick: () => fileInputRef.current?.click(), className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors", children: "Select File" })] })) }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".pdf,application/pdf", onChange: handleFileSelect, className: "hidden" })] }))] }), metadata && (_jsxs("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [_jsxs("h2", { className: "text-lg font-semibold text-gray-900 mb-4 flex items-center", children: [_jsx(Info, { className: "h-5 w-5 mr-2 text-red-500" }), "Document Information"] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "text-center p-3 bg-blue-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: metadata.pageCount }), _jsxs("div", { className: "text-xs text-blue-600 uppercase tracking-wide font-medium", children: ["Page", metadata.pageCount !== 1 ? 's' : ''] })] }), _jsxs("div", { className: "text-center p-3 bg-green-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: formatFileSize(metadata.fileSize) }), _jsx("div", { className: "text-xs text-green-600 uppercase tracking-wide font-medium", children: "File Size" })] }), _jsxs("div", { className: "text-center p-3 bg-purple-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: "PDF" }), _jsx("div", { className: "text-xs text-purple-600 uppercase tracking-wide font-medium", children: "Format" })] })] }), _jsx("div", { className: "mt-4", children: _jsxs("div", { className: "flex items-center space-x-3 p-3 bg-gray-50 rounded-lg", children: [_jsx(File, { className: "h-5 w-5 text-gray-500" }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: "Filename" }), _jsx("p", { className: "text-sm text-gray-500", children: metadata.fileName })] })] }) }), _jsx("div", { className: "mt-4 p-4 bg-red-50 rounded-lg", children: _jsxs("div", { className: "flex items-start space-x-2", children: [_jsx(FileType, { className: "h-4 w-4 text-red-600 mt-0.5" }), _jsxs("div", { className: "text-sm text-red-700", children: [_jsx("p", { className: "font-medium mb-1", children: "PDF Successfully Uploaded" }), _jsx("p", { className: "text-xs leading-relaxed", children: "Your PDF has been uploaded to secure storage and is ready to be accessed. Users will be able to view and download this document when you publish the content." })] })] }) })] }))] }) }));
}
export default PDFEditor;
