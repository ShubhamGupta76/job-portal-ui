import React from 'react';
import Editor from '@monaco-editor/react';

const LiveCodePanel = ({ code, onChange }) => (
  <section className="min-h-[360px] overflow-hidden rounded-lg border border-white/10 bg-slate-950">
    <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
      <div>
        <h2 className="text-sm font-bold text-white">Live Coding</h2>
        <p className="text-xs text-slate-400">Shared workspace structure. Execution sandbox can plug in here.</p>
      </div>
      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">Synced</span>
    </div>
    <Editor
      height="360px"
      language="java"
      theme="vs-dark"
      value={code}
      onChange={(value) => onChange(value || '')}
      options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true, scrollBeyondLastLine: false }}
    />
  </section>
);

export default LiveCodePanel;
