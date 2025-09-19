import React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Block } from '../../WODBuilder'

interface QuizEditorProps {
  block: Block
  onUpdate: (block: Block) => void
}

export function QuizEditor({ block, onUpdate }: QuizEditorProps) {
  const handleChange = (field: string, value: any) => {
    onUpdate({
      ...block,
      data: {
        ...block.data,
        [field]: value
      }
    })
  }
  
  const addQuestion = () => {
    const questions = block.data.questions || []
    const newQuestion = {
      id: `q${Date.now()}`,
      text: 'New question',
      type: 'multiple-choice',
      options: ['Option 1', 'Option 2'],
      correctAnswer: 0
    }
    handleChange('questions', [...questions, newQuestion])
  }
  
  const removeQuestion = (index: number) => {
    const questions = block.data.questions || []
    handleChange('questions', questions.filter((_: any, i: number) => i !== index))
  }
  
  const updateQuestion = (index: number, field: string, value: any) => {
    const questions = [...(block.data.questions || [])]
    questions[index] = { ...questions[index], [field]: value }
    handleChange('questions', questions)
  }

  return (
    <div className="p-6 space-y-4">
      <h3 className="font-medium text-gray-900 mb-4">Quiz Settings</h3>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quiz Title
        </label>
        <input
          type="text"
          value={block.data.title || ''}
          onChange={(e) => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter quiz title..."
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          rows={3}
          value={block.data.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Quiz description..."
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Questions
          </label>
          <button
            onClick={addQuestion}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            <Plus className="h-3 w-3" />
            <span>Add Question</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {(block.data.questions || []).map((question: any, index: number) => (
            <div key={question.id || index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Question {index + 1}</span>
                <button
                  onClick={() => removeQuestion(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              <input
                type="text"
                value={question.text || ''}
                onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
                placeholder="Question text..."
              />
              
              <div className="space-y-1">
                {(question.options || []).map((option: string, optionIndex: number) => (
                  <div key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`question-${index}`}
                      checked={question.correctAnswer === optionIndex}
                      onChange={() => updateQuestion(index, 'correctAnswer', optionIndex)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...question.options]
                        newOptions[optionIndex] = e.target.value
                        updateQuestion(index, 'options', newOptions)
                      }}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={`Option ${optionIndex + 1}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Quiz Settings</h4>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={block.data.showCorrectAnswers || false}
              onChange={(e) => handleChange('showCorrectAnswers', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Show Correct Answers</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={block.data.allowRetakes || false}
              onChange={(e) => handleChange('allowRetakes', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Allow Retakes</span>
          </label>
        </div>
      </div>
    </div>
  )
}