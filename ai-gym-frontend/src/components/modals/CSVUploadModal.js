import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useCallback, useRef } from 'react';
import { Upload, Download, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
const CSVUploadModal = ({ isOpen, onClose, communityId, onUploadComplete }) => {
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [csvPreview, setCsvPreview] = useState([]);
    const downloadTemplate = useCallback(() => {
        const csvContent = 'firstName,lastName,email,tags\nJohn,Doe,john.doe@example.com,developer;senior\nJane,Smith,jane.smith@example.com,designer';
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user_upload_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, []);
    const handleFileSelect = useCallback((file) => {
        if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
            alert('Please select a CSV file');
            return;
        }
        setSelectedFile(file);
        // Preview first few rows
        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result;
            const lines = text.split('\n').slice(0, 6); // Preview first 6 lines
            const preview = lines.map(line => line.split(',').map(cell => cell.trim()));
            setCsvPreview(preview);
        };
        reader.readAsText(file);
    }, []);
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);
    const handleFileInput = useCallback((e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);
    const processUpload = async () => {
        if (!selectedFile)
            return;
        setIsUploading(true);
        setUploadResult(null);
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const csvData = e.target?.result;
                const { data, error } = await supabase.functions.invoke('process-csv-upload', {
                    body: {
                        community_id: communityId,
                        csv_data: csvData,
                        file_name: selectedFile.name
                    }
                });
                if (error)
                    throw error;
                setUploadResult(data);
                if (data.successful_rows > 0) {
                    onUploadComplete();
                }
            };
            reader.readAsText(selectedFile);
        }
        catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
        }
        finally {
            setIsUploading(false);
        }
    };
    const downloadResults = useCallback(() => {
        if (!uploadResult || !uploadResult.created_users)
            return;
        const csvContent = [
            'Email,First Name,Last Name,Temporary Password',
            ...uploadResult.created_users.map(user => `${user.email},${user.first_name},${user.last_name},${user.temp_password}`)
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'created_users_with_passwords.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, [uploadResult]);
    const handleClose = () => {
        setSelectedFile(null);
        setCsvPreview([]);
        setUploadResult(null);
        onClose();
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between p-6 border-b", children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Bulk User Upload" }), _jsx("button", { onClick: handleClose, disabled: isUploading, className: "text-gray-400 hover:text-gray-600 transition-colors", children: _jsx(X, { size: 24 }) })] }), _jsx("div", { className: "p-6", children: !uploadResult ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6", children: [_jsx("h3", { className: "text-sm font-medium text-blue-900 mb-2", children: "CSV Format Requirements:" }), _jsxs("ul", { className: "text-sm text-blue-800 space-y-1", children: [_jsxs("li", { children: ["\u2022 Required headers: ", _jsx("code", { className: "bg-blue-100 px-1 rounded", children: "firstName" }), ", ", _jsx("code", { className: "bg-blue-100 px-1 rounded", children: "lastName" }), ", ", _jsx("code", { className: "bg-blue-100 px-1 rounded", children: "email" })] }), _jsxs("li", { children: ["\u2022 Optional header: ", _jsx("code", { className: "bg-blue-100 px-1 rounded", children: "tags" }), " (separate multiple tags with semicolons)"] }), _jsx("li", { children: "\u2022 Maximum 1000 users per upload" }), _jsx("li", { children: "\u2022 Secure passwords will be auto-generated for each user" })] }), _jsxs("button", { onClick: downloadTemplate, className: "mt-3 inline-flex items-center text-sm text-blue-600 hover:text-blue-800", children: [_jsx(Download, { size: 16, className: "mr-1" }), "Download Template CSV"] })] }), _jsxs("div", { onDrop: handleDrop, onDragOver: (e) => { e.preventDefault(); setDragOver(true); }, onDragLeave: () => setDragOver(false), onClick: () => fileInputRef.current?.click(), className: `border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${dragOver
                                    ? 'border-blue-400 bg-blue-50'
                                    : 'border-gray-300 hover:border-blue-400'}`, children: [_jsx(Upload, { size: 48, className: "mx-auto mb-4 text-gray-400" }), _jsx("p", { className: "text-lg text-gray-600 mb-2", children: selectedFile ? selectedFile.name : 'Drop your CSV file here, or click to browse' }), _jsx("p", { className: "text-sm text-gray-500", children: "Supports .csv files up to 10MB" }), _jsx("input", { ref: fileInputRef, type: "file", accept: ".csv,text/csv", onChange: handleFileInput, className: "hidden" })] }), csvPreview.length > 0 && (_jsxs("div", { className: "mt-6", children: [_jsx("h3", { className: "text-sm font-medium text-gray-900 mb-3", children: "File Preview (first 5 rows):" }), _jsx("div", { className: "border border-gray-200 rounded-lg overflow-hidden", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsx("tr", { children: csvPreview[0]?.map((header, index) => (_jsx("th", { className: "px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: header }, index))) }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: csvPreview.slice(1).map((row, rowIndex) => (_jsx("tr", { children: row.map((cell, cellIndex) => (_jsx("td", { className: "px-4 py-2 text-sm text-gray-900", children: cell }, cellIndex))) }, rowIndex))) })] }) }) })] })), _jsxs("div", { className: "flex items-center justify-end space-x-3 mt-6 pt-6 border-t", children: [_jsx("button", { onClick: handleClose, disabled: isUploading, className: "px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors", children: "Cancel" }), _jsxs("button", { onClick: processUpload, disabled: !selectedFile || isUploading, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2", children: [isUploading && (_jsx("div", { className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" })), _jsx("span", { children: isUploading ? 'Processing...' : 'Upload Users' })] })] })] })) : (
                    /* Upload Results */
                    _jsxs("div", { children: [_jsxs("div", { className: "mb-6", children: [_jsx("div", { className: "flex items-center space-x-4 mb-4", children: uploadResult.failed_rows === 0 ? (_jsxs("div", { className: "flex items-center text-green-600", children: [_jsx(CheckCircle, { size: 24, className: "mr-2" }), _jsx("span", { className: "text-lg font-semibold", children: "Upload Completed Successfully!" })] })) : (_jsxs("div", { className: "flex items-center text-amber-600", children: [_jsx(AlertTriangle, { size: 24, className: "mr-2" }), _jsx("span", { className: "text-lg font-semibold", children: "Upload Completed with Some Errors" })] })) }), _jsxs("div", { className: "grid grid-cols-3 gap-4 mb-6", children: [_jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-blue-600", children: uploadResult.total_rows }), _jsx("div", { className: "text-sm text-blue-800", children: "Total Rows" })] }), _jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: uploadResult.successful_rows }), _jsx("div", { className: "text-sm text-green-800", children: "Successful" })] }), _jsxs("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-center", children: [_jsx("div", { className: "text-2xl font-bold text-red-600", children: uploadResult.failed_rows }), _jsx("div", { className: "text-sm text-red-800", children: "Failed" })] })] })] }), uploadResult.successful_rows > 0 && (_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900 mb-3", children: "Created Users" }), _jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: [_jsxs("p", { className: "text-green-800 mb-3", children: ["Successfully created ", uploadResult.successful_rows, " users with temporary passwords."] }), _jsxs("button", { onClick: downloadResults, className: "inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700", children: [_jsx(Download, { size: 16, className: "mr-2" }), "Download User Credentials"] })] })] })), uploadResult.errors && uploadResult.errors.length > 0 && (_jsxs("div", { className: "mb-6", children: [_jsxs("h3", { className: "text-lg font-medium text-gray-900 mb-3", children: ["Errors (", uploadResult.errors.length, ")"] }), _jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 max-h-64 overflow-y-auto", children: uploadResult.errors.map((error, index) => (_jsxs("div", { className: "mb-2 text-sm", children: [_jsxs("span", { className: "font-medium text-red-800", children: ["Row ", error.row, ":"] }), _jsxs("span", { className: "text-red-700 ml-1", children: [error.email, " - ", error.error] })] }, index))) })] })), _jsx("div", { className: "flex justify-end pt-4 border-t", children: _jsx("button", { onClick: handleClose, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700", children: "Close" }) })] })) })] }) }));
};
export default CSVUploadModal;
