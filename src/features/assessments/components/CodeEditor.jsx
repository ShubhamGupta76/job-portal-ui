import React, { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { CheckCircle2, Code2, Maximize2, Minimize2, Play, Send, Settings2, XCircle } from 'lucide-react';
import { assessmentService } from '../../../services';

const languageOptions = [
  { value: 'PYTHON', piston: 'python', monaco: 'python', label: 'Python' },
  { value: 'JAVA', piston: 'java', monaco: 'java', label: 'Java' },
  { value: 'JAVASCRIPT', piston: 'javascript', monaco: 'javascript', label: 'JavaScript' },
  { value: 'CPP', piston: 'cpp', monaco: 'cpp', label: 'C++' },
  { value: 'C', piston: 'c', monaco: 'c', label: 'C' },
];

const defaultTemplates = {
  PYTHON: 'def solve():\n    # write your solution here\n    pass\n',
  JAVA: 'class Solution {\n    public static void solve() {\n        // write your solution here\n    }\n}\n',
  JAVASCRIPT: 'function solve() {\n  // write your solution here\n}\n',
  CPP: '#include <bits/stdc++.h>\nusing namespace std;\n\nvoid solve() {\n    // write your solution here\n}\n',
  C: '#include <stdio.h>\n\nvoid solve() {\n    // write your solution here\n}\n',
};

const CodeEditor = ({
  questionId,
  sessionToken,
  language,
  template,
  initialCode,
  onChange,
  onSubmitted,
  testCases,
  readOnly = false,
}) => {
  const normalizedLanguage = useMemo(() => String(language || 'PYTHON').toUpperCase(), [language]);
  const initialTemplate = template || defaultTemplates[normalizedLanguage] || '';
  const [code, setCode] = useState(initialCode || initialTemplate);
  const [selectedLanguage, setSelectedLanguage] = useState(normalizedLanguage);
  const [fontSize, setFontSize] = useState(14);
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('cases');

  useEffect(() => {
    setCode(initialCode || template || defaultTemplates[normalizedLanguage] || '');
  }, [initialCode, normalizedLanguage, template]);

  useEffect(() => {
    setSelectedLanguage(normalizedLanguage);
  }, [normalizedLanguage]);

  const selectedConfig = languageOptions.find((item) => item.value === selectedLanguage) || languageOptions[0];

  const handleCodeChange = (value) => {
    const nextCode = value || '';
    setCode(nextCode);
    onChange(nextCode, selectedLanguage);
  };

  const execute = async (hidden = false) => {
    const setBusy = hidden ? setSubmitting : setRunning;
    setBusy(true);
    setActiveTab('results');
    try {
      const response = await assessmentService.executeCode({
        questionId,
        sessionToken,
        language: selectedConfig.piston,
        code,
        input: testCases,
        runHiddenTests: hidden,
      });
      setResult(response.data);

      if (hidden) {
        await assessmentService.submitAnswer({
          sessionToken,
          questionId,
          answerText: '',
          codeSubmitted: code,
          language: selectedConfig.piston,
          evaluate: true,
        });
        onSubmitted?.(response.data);
      }
    } catch (error) {
      setResult({
        success: false,
        output: '',
        error: error.response?.data?.message || error.message,
        testCases: [],
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-lg border border-slate-800 bg-[#0b1020] shadow-2xl shadow-slate-950/30 ${
        expanded ? 'fixed inset-4 z-50' : ''
      }`}
    >
      <div className="flex flex-col gap-3 border-b border-white/10 bg-[#111827] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-cyan-400/10 text-cyan-300">
            <Code2 size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Solution Workspace</p>
            <p className="text-xs text-slate-400">Write only the required function when a hidden wrapper is configured.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedLanguage}
            onChange={(event) => {
              const nextLanguage = event.target.value;
              setSelectedLanguage(nextLanguage);
              if (!code.trim()) {
                handleCodeChange(defaultTemplates[nextLanguage] || '');
              }
            }}
            className="h-9 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-slate-100 outline-none"
          >
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className="flex h-9 items-center gap-2 rounded-md border border-white/10 bg-slate-950 px-2 text-slate-300">
            <Settings2 size={15} />
            <button type="button" onClick={() => setFontSize((size) => Math.max(12, size - 1))} className="px-1 text-sm">-</button>
            <span className="w-6 text-center text-xs">{fontSize}</span>
            <button type="button" onClick={() => setFontSize((size) => Math.min(22, size + 1))} className="px-1 text-sm">+</button>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="flex h-9 items-center gap-2 rounded-md border border-white/10 bg-slate-950 px-3 text-sm text-slate-200 hover:bg-slate-900"
          >
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            {expanded ? 'Exit' : 'Focus'}
          </button>

          <button
            type="button"
            onClick={() => execute(false)}
            disabled={running || submitting}
            className="flex h-9 items-center gap-2 rounded-md bg-cyan-500 px-4 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
          >
            <Play size={15} />
            {running ? 'Running' : 'Run'}
          </button>

          <button
            type="button"
            onClick={() => execute(true)}
            disabled={running || submitting}
            className="flex h-9 items-center gap-2 rounded-md bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
          >
            <Send size={15} />
            {submitting ? 'Submitting' : 'Submit Code'}
          </button>
        </div>
      </div>

      <div className={`grid ${expanded ? 'h-[calc(100vh-140px)]' : 'min-h-[640px]'} grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px]`}>
        <div className="min-h-[420px] border-b border-white/10 xl:border-b-0 xl:border-r">
          <Editor
            height="100%"
            language={selectedConfig.monaco}
            theme="vs-dark"
            value={code}
            loading={<div className="p-6 text-sm text-slate-400">Loading editor...</div>}
            options={{
              readOnly,
              fontSize,
              minimap: { enabled: false },
              lineNumbers: 'on',
              automaticLayout: true,
              tabSize: 2,
              insertSpaces: true,
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              formatOnPaste: true,
              formatOnType: true,
              scrollBeyondLastLine: false,
              padding: { top: 18, bottom: 18 },
            }}
            onChange={handleCodeChange}
          />
        </div>

        <aside className="flex min-h-[360px] flex-col bg-[#0f172a]">
          <div className="flex border-b border-white/10">
            {[
              ['cases', 'Sample Cases'],
              ['results', 'Results'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex-1 px-4 py-3 text-sm font-semibold ${
                  activeTab === key ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {activeTab === 'cases' && (
              <pre className="min-h-[260px] whitespace-pre-wrap rounded-md border border-white/10 bg-slate-950/70 p-4 text-xs leading-6 text-slate-300">
                {testCases || 'No sample cases have been published for this question.'}
              </pre>
            )}

            {activeTab === 'results' && (
              <div className="space-y-3">
                {!result && <p className="text-sm text-slate-400">Run code to see output, runtime, memory, and case status.</p>}
                {result?.error && (
                  <div className="rounded-md border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                    {result.error}
                  </div>
                )}
                {result && (
                  <div className="rounded-md border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">
                        {result.passedCount || 0}/{result.totalCount || 0} passed
                      </p>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        result.success ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'
                      }`}>
                        {Math.round(result.scorePercentage || 0)}%
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <span>Runtime: {result.executionTime || 0} ms</span>
                      <span>Memory: {formatMemory(result.memoryUsed)}</span>
                    </div>
                  </div>
                )}
                {(result?.testCases || []).map((item) => (
                  <div key={item.index} className="rounded-md border border-white/10 bg-slate-950/70 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      {item.passed ? <CheckCircle2 size={16} className="text-emerald-300" /> : <XCircle size={16} className="text-rose-300" />}
                      Case {item.index}
                    </div>
                    <ResultBlock label="Input" value={item.input} />
                    <ResultBlock label="Expected" value={item.expectedOutput} />
                    <ResultBlock label="Output" value={item.actualOutput} />
                    {item.stderr && <ResultBlock label="stderr" value={item.stderr} tone="rose" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </motion.div>
  );
};

const ResultBlock = ({ label, value, tone = 'slate' }) => (
  <div className="mt-3">
    <p className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${tone === 'rose' ? 'text-rose-300' : 'text-slate-500'}`}>{label}</p>
    <pre className="mt-1 whitespace-pre-wrap break-words rounded bg-black/30 p-2 text-xs leading-5 text-slate-200">
      {value || '-'}
    </pre>
  </div>
);

const formatMemory = (bytes) => {
  const value = Number(bytes || 0);
  if (!value) return '0 MB';
  return `${(value / 1024 / 1024).toFixed(2)} MB`;
};

export default CodeEditor;
