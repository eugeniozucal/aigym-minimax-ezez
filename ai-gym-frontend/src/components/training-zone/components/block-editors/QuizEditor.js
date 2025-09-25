import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Plus, Trash2 } from 'lucide-react';
export function QuizEditor({ block, onUpdate }) {
    const handleChange = (field, value) => {
        onUpdate({
            ...block,
            data: {
                ...block.data,
                [field]: value
            }
        });
    };
    const addQuestion = () => {
        const questions = block.data.questions || [];
        const newQuestion = {
            id: `q${Date.now()}`,
            text: 'New question',
            type: 'multiple-choice',
            options: ['Option 1', 'Option 2'],
            correctAnswer: 0
        };
        handleChange('questions', [...questions, newQuestion]);
    };
    const removeQuestion = (index) => {
        const questions = block.data.questions || [];
        handleChange('questions', questions.filter((_, i) => i !== index));
    };
    const updateQuestion = (index, field, value) => {
        const questions = [...(block.data.questions || [])];
        questions[index] = { ...questions[index], [field]: value };
        handleChange('questions', questions);
    };
    return (_jsxs("div", { className: "p-6 space-y-4", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-4", children: "Quiz Settings" }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Quiz Title" }), _jsx("input", { type: "text", value: block.data.title || '', onChange: (e) => handleChange('title', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Enter quiz title..." })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Description" }), _jsx("textarea", { rows: 3, value: block.data.description || '', onChange: (e) => handleChange('description', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", placeholder: "Quiz description..." })] }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Questions" }), _jsxs("button", { onClick: addQuestion, className: "flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200", children: [_jsx(Plus, { className: "h-3 w-3" }), _jsx("span", { children: "Add Question" })] })] }), _jsx("div", { className: "space-y-4", children: (block.data.questions || []).map((question, index) => (_jsxs("div", { className: "border border-gray-200 rounded-lg p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("span", { className: "text-sm font-medium text-gray-700", children: ["Question ", index + 1] }), _jsx("button", { onClick: () => removeQuestion(index), className: "text-red-600 hover:text-red-800", children: _jsx(Trash2, { className: "h-4 w-4" }) })] }), _jsx("input", { type: "text", value: question.text || '', onChange: (e) => updateQuestion(index, 'text', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2", placeholder: "Question text..." }), _jsx("div", { className: "space-y-1", children: (question.options || []).map((option, optionIndex) => (_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "radio", name: `question-${index}`, checked: question.correctAnswer === optionIndex, onChange: () => updateQuestion(index, 'correctAnswer', optionIndex), className: "text-blue-600 focus:ring-blue-500" }), _jsx("input", { type: "text", value: option, onChange: (e) => {
                                                    const newOptions = [...question.options];
                                                    newOptions[optionIndex] = e.target.value;
                                                    updateQuestion(index, 'options', newOptions);
                                                }, className: "flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500", placeholder: `Option ${optionIndex + 1}...` })] }, optionIndex))) })] }, question.id || index))) })] }), _jsxs("div", { className: "border-t border-gray-200 pt-4", children: [_jsx("h4", { className: "text-sm font-medium text-gray-700 mb-3", children: "Quiz Settings" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: block.data.showCorrectAnswers || false, onChange: (e) => handleChange('showCorrectAnswers', e.target.checked), className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700", children: "Show Correct Answers" })] }), _jsxs("label", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", checked: block.data.allowRetakes || false, onChange: (e) => handleChange('allowRetakes', e.target.checked), className: "rounded border-gray-300 text-blue-600 focus:ring-blue-500" }), _jsx("span", { className: "text-sm text-gray-700", children: "Allow Retakes" })] })] })] })] }));
}
