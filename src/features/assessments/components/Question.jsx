import React, { useEffect, useState } from 'react';
import CodeEditor from './CodeEditor';

const Question = ({ question, answer, onAnswerChange, sessionToken, onCodeSubmitted, showResponseArea = true }) => {
  const [selectedOption, setSelectedOption] = useState(answer);

  useEffect(() => {
    setSelectedOption(answer);
  }, [answer, question?.id]);

  const handleMCQChange = (option) => {
    setSelectedOption(option);
    onAnswerChange(option);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <QuestionPill tone="blue" label={`${question.marks || 0} Marks`} />
          {question.difficulty && <QuestionPill tone={difficultyTone(question.difficulty)} label={question.difficulty} />}
          <QuestionPill tone="slate" label={question.type} />
        </div>

        <h2 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900">{question.title}</h2>
        <div className="mt-4 whitespace-pre-wrap text-base leading-8 text-slate-600">
          {question.description || 'No question description provided.'}
        </div>
      </div>

      {showResponseArea && question.type === 'MCQ' && (
        <div className="grid grid-cols-1 gap-4">
          {['option1', 'option2', 'option3', 'option4'].map((optionKey, index) => (
            question[optionKey] && (
              <button
                key={optionKey}
                type="button"
                onClick={() => handleMCQChange(optionKey)}
                className={`rounded-[24px] border px-5 py-5 text-left transition ${
                  selectedOption === optionKey
                    ? 'border-blue-500 bg-blue-50 shadow-[0_12px_24px_rgba(37,99,235,0.14)]'
                    : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold ${
                    selectedOption === optionKey ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <div className="pt-1 text-base text-slate-700">{question[optionKey]}</div>
                </div>
              </button>
            )
          ))}
        </div>
      )}

      {showResponseArea && question.type === 'CODING' && (
        <CodeEditor
          questionId={question.id}
          sessionToken={sessionToken}
          language={question.programmingLanguage || 'python'}
          template={question.codeTemplate || ''}
          initialCode={answer}
          onChange={(code) => onAnswerChange(code)}
          onSubmitted={onCodeSubmitted}
          testCases={question.sampleTestCases || question.testCases}
        />
      )}

      {showResponseArea && question.type === 'DESCRIPTIVE' && (
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-4">
            <p className="text-sm font-medium text-slate-500">Written Response</p>
          </div>
          <textarea
            value={answer}
            onChange={(event) => onAnswerChange(event.target.value)}
            placeholder="Write your answer here..."
            className="h-[360px] w-full resize-none px-6 py-5 text-base leading-8 text-slate-700 outline-none"
          />
        </div>
      )}
    </div>
  );
};

const QuestionPill = ({ label, tone }) => {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    yellow: 'bg-amber-50 text-amber-700',
    red: 'bg-rose-50 text-rose-700',
    slate: 'bg-slate-100 text-slate-600',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${tones[tone] || tones.slate}`}>
      {label}
    </span>
  );
};

const difficultyTone = (difficulty) => {
  switch (String(difficulty).toUpperCase()) {
    case 'EASY':
      return 'green';
    case 'MEDIUM':
      return 'yellow';
    case 'HARD':
      return 'red';
    default:
      return 'slate';
  }
};

export default Question;
