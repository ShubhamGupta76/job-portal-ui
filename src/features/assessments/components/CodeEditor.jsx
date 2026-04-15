import React, { useState, useRef } from 'react';
import axios from 'axios';

const CodeEditor = ({ language, template, initialCode, onChange, testCases }) => {
  const [code, setCode] = useState(initialCode || template || '');
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [language_selected, setLanguage] = useState(language || 'python');
  const editorRef = useRef(null);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    onChange(newCode);
  };

  const runCode = async () => {
    setRunning(true);
    try {
      const response = await axios.post(
        'http://localhost:8080/api/v1/submissions/execute-code',
        {
          language: language_selected,
          code: code,
          input: testCases || ''
        },
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setOutput(response.data.output || 'No output');
    } catch (error) {
      setOutput(`Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <select
          value={language_selected}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="javascript">JavaScript</option>
          <option value="cpp">C++</option>
        </select>

        <button
          onClick={runCode}
          disabled={running}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {running ? 'Running...' : 'Run Code'}
        </button>
      </div>

      <textarea
        ref={editorRef}
        value={code}
        onChange={handleCodeChange}
        className="w-full h-80 p-4 bg-gray-900 text-green-400 font-mono border-2 border-gray-300 rounded focus:outline-none focus:border-green-500 resize-none"
        spellCheck="false"
      />

      {output && (
        <div className="bg-gray-900 text-white p-4 rounded font-mono text-sm max-h-40 overflow-y-auto">
          <p className="text-gray-400 mb-2">Output:</p>
          <pre>{output}</pre>
        </div>
      )}

      {testCases && (
        <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-500">
          <p className="text-sm font-semibold text-gray-700">Test Cases:</p>
          <pre className="text-xs text-gray-600 mt-2 overflow-x-auto">{testCases}</pre>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
