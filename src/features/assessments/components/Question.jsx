import React, { useState } from 'react';
import CodeEditor from './CodeEditor';

const Question = ({ question, answer, onAnswerChange }) => {
  const [selectedOption, setSelectedOption] = useState(answer);

  const handleMCQChange = (option) => {
    setSelectedOption(option);
    onAnswerChange(option);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">{question.title}</h2>
        <p className="text-gray-600 mb-4">{question.description}</p>
        
        <div className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded mb-4">
          Marks: {question.marks}
        </div>
        
        {question.difficulty && (
          <div className={`inline-block ml-2 px-3 py-1 text-sm rounded ${
            question.difficulty === 'EASY' ? 'bg-green-100 text-green-700' :
            question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {question.difficulty}
          </div>
        )}
      </div>

      {question.type === 'MCQ' && (
        <div className="space-y-3">
          {['option1', 'option2', 'option3', 'option4'].map((optionKey, idx) => (
            question[optionKey] && (
              <label key={idx} className="flex items-center p-3 border-2 border-gray-300 rounded hover:bg-blue-50 cursor-pointer transition">
                <input
                  type="radio"
                  name="mcq"
                  value={optionKey}
                  checked={selectedOption === optionKey}
                  onChange={() => handleMCQChange(optionKey)}
                  className="mr-3"
                />
                <span>{question[optionKey]}</span>
              </label>
            )
          ))}
        </div>
      )}

      {question.type === 'CODING' && (
        <CodeEditor
          language={question.programmingLanguage || 'python'}
          template={question.codeTemplate || ''}
          initialCode={answer}
          onChange={onAnswerChange}
          testCases={question.testCases}
        />
      )}

      {question.type === 'DESCRIPTIVE' && (
        <textarea
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Write your answer here..."
          className="w-full h-64 p-4 border-2 border-gray-300 rounded focus:outline-none focus:border-blue-500 font-mono"
        />
      )}
    </div>
  );
};

export default Question;
