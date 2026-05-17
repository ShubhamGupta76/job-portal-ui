import React, { useMemo, useState } from 'react';
import {
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Code2,
  FileQuestion,
  Layers3,
  LockKeyhole,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Timer,
  Trash2,
} from 'lucide-react';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import Input from '../../../components/common/Input';

const defaultQuestion = {
  id: null,
  type: 'MCQ',
  title: '',
  description: '',
  marks: 5,
  difficulty: 'MEDIUM',
  option1: '',
  option2: '',
  option3: '',
  option4: '',
  correctAnswer: 'option1',
  explanation: '',
  codeTemplate: '',
  programmingLanguage: 'PYTHON',
  testCases: '',
  expectedOutput: '',
  sampleTestCases: '',
  hiddenTestCases: '',
  functionSignature: '',
  hiddenWrapperCode: '',
  constraintsText: '',
};

const questionTypes = [
  { key: 'MCQ', label: 'MCQ', icon: FileQuestion },
  { key: 'CODING', label: 'Coding', icon: Code2 },
  { key: 'DESCRIPTIVE', label: 'Descriptive', icon: ClipboardList },
];

const securityControls = [
  { name: 'shuffleQuestions', label: 'Shuffle order' },
  { name: 'allowBackNavigation', label: 'Back navigation' },
  { name: 'enableProctoring', label: 'Proctoring' },
  { name: 'detectCopyPaste', label: 'Copy / paste guard' },
  { name: 'enforceFullScreen', label: 'Fullscreen lock' },
  { name: 'requireWebcam', label: 'Webcam required' },
  { name: 'desktopOnly', label: 'Desktop only' },
  { name: 'sequentialQuestionsOnly', label: 'Sequential flow' },
  { name: 'lockAnsweredQuestions', label: 'Lock answered' },
  { name: 'autoSubmitOnViolationLimit', label: 'Auto-submit policy' },
];

const AssessmentBuilder = ({
  mode,
  formData,
  onFormChange,
  jobs,
  questions,
  onSaveAssessment,
  onPublishAssessment,
  onDeleteQuestion,
  onSaveQuestion,
  saving,
  publishing,
  questionSaving,
  error,
}) => {
  const [draftQuestion, setDraftQuestion] = useState(defaultQuestion);
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  const stats = useMemo(() => {
    const totalMarks = questions.reduce((sum, question) => sum + Number(question.marks || 0), 0);
    return {
      totalQuestions: questions.length,
      coding: questions.filter((question) => question.type === 'CODING').length,
      mcq: questions.filter((question) => question.type === 'MCQ').length,
      descriptive: questions.filter((question) => question.type === 'DESCRIPTIVE').length,
      totalMarks,
    };
  }, [questions]);

  const selectedJob = useMemo(
    () => jobs.find((job) => String(job.id) === String(formData.jobId)),
    [jobs, formData.jobId]
  );

  const completionScore = useMemo(() => {
    const checks = [
      Boolean(formData.title?.trim()),
      Boolean(formData.jobId),
      Boolean(formData.durationMinutes),
      Boolean(formData.totalMarks),
      questions.length > 0,
      stats.totalMarks > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [formData, questions.length, stats.totalMarks]);

  const startEditQuestion = (question) => {
    setDraftQuestion({
      ...defaultQuestion,
      ...question,
      programmingLanguage: question.programmingLanguage || 'PYTHON',
    });
    setEditingQuestionId(question.id || null);
  };

  const resetDraftQuestion = () => {
    setDraftQuestion(defaultQuestion);
    setEditingQuestionId(null);
  };

  const handleDraftChange = (event) => {
    const { name, value } = event.target;
    setDraftQuestion((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleQuestionSubmit = async () => {
    const payload = {
      ...draftQuestion,
      marks: Number(draftQuestion.marks || 0),
      sequenceNumber: editingQuestionId
        ? (draftQuestion.sequenceNumber || questions.find((item) => item.id === editingQuestionId)?.sequenceNumber || 1)
        : questions.length + 1,
    };

    await onSaveQuestion(payload, editingQuestionId);
    resetDraftQuestion();
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-950">
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-4 md:px-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
                <Layers3 size={20} />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Assessment Studio</p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                  {mode === 'edit' ? 'Refine assessment' : 'Build a hiring round'}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="bg-white" onClick={onSaveAssessment} loading={saving}>
              <Save size={16} />
              {mode === 'edit' ? 'Save Changes' : 'Save Draft'}
            </Button>
            <Button onClick={onPublishAssessment} loading={publishing}>
              <Send size={16} />
              {mode === 'edit' ? 'Publish Updates' : 'Create & Publish'}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] gap-6 px-4 py-6 md:px-6 xl:grid-cols-[260px_minmax(0,1fr)_330px]">
        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-4">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Flow</p>
              <div className="mt-5 space-y-3">
                <StepItem active icon={BriefcaseBusiness} label="Round setup" value={formData.title || 'Untitled'} />
                <StepItem icon={ShieldCheck} label="Security" value={`${securityControls.filter((item) => formData[item.name]).length}/10 enabled`} />
                <StepItem icon={FileQuestion} label="Questions" value={`${stats.totalQuestions} added`} />
                <StepItem icon={CheckCircle2} label="Publish readiness" value={`${completionScore}% complete`} />
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-sm text-slate-300">Candidate round preview</p>
              <h2 className="mt-3 text-2xl font-semibold">{formData.title || 'Untitled assessment'}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{selectedJob?.title || 'No job linked yet'}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniStat label="Time" value={`${formData.durationMinutes || 0}m`} />
                <MiniStat label="Marks" value={formData.totalMarks || 0} />
              </div>
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          {error && (
            <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="p-6 md:p-8">
                <Badge variant="primary">Blueprint</Badge>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">Round identity</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-slate-500">
                  Create the assessment shell first, then add questions and publish when the round is ready.
                </p>

                <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
                  <InputField label="Assessment title">
                    <Input name="title" value={formData.title || ''} onChange={onFormChange} placeholder="Frontend Systems Screening" />
                  </InputField>

                  <InputField label="Linked job">
                    <select
                      name="jobId"
                      value={formData.jobId || ''}
                      onChange={onFormChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                    >
                      <option value="">Select a job</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title}
                        </option>
                      ))}
                    </select>
                  </InputField>

                  <div className="lg:col-span-2">
                    <InputField label="Description">
                      <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={onFormChange}
                        rows={4}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                        placeholder="Describe what this assessment evaluates and how candidates should approach it."
                      />
                    </InputField>
                  </div>

                  <InputField label="Duration">
                    <div className="relative">
                      <Timer className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <Input className="pl-11" type="number" name="durationMinutes" value={formData.durationMinutes || ''} onChange={onFormChange} min="5" />
                    </div>
                  </InputField>

                  <InputField label="Total marks">
                    <Input type="number" name="totalMarks" value={formData.totalMarks || ''} onChange={onFormChange} min="1" />
                  </InputField>

                  <InputField label="Passing threshold">
                    <Input name="passingMarksPercentage" value={formData.passingMarksPercentage || ''} onChange={onFormChange} placeholder="60%" />
                  </InputField>
                </div>
              </div>

              <div className="border-t border-slate-200 bg-[#f9fbff] p-6 lg:border-l lg:border-t-0">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Readiness</p>
                <div className="mt-6">
                  <div className="flex items-end justify-between">
                    <span className="text-5xl font-semibold text-slate-950">{completionScore}%</span>
                    <span className="text-sm text-slate-500">complete</span>
                  </div>
                  <div className="mt-5 h-3 rounded-full bg-slate-200">
                    <div className="h-3 rounded-full bg-emerald-500" style={{ width: `${completionScore}%` }} />
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <ReadinessRow done={Boolean(formData.title?.trim())} label="Title added" />
                  <ReadinessRow done={Boolean(formData.jobId)} label="Job linked" />
                  <ReadinessRow done={questions.length > 0} label="Question set ready" />
                  <ReadinessRow done={stats.totalMarks > 0} label="Marks configured" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <Badge>Composer</Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Question workshop</h2>
              </div>
              <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
                {questionTypes.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDraftQuestion((prev) => ({ ...prev, type: key }))}
                    className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      draftQuestion.type === key
                        ? 'bg-white text-slate-950 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
              <InputField label="Question title">
                <Input name="title" value={draftQuestion.title} onChange={handleDraftChange} placeholder="Implement LRU Cache" />
              </InputField>

              <InputField label="Marks">
                <Input type="number" name="marks" value={draftQuestion.marks} onChange={handleDraftChange} min="1" />
              </InputField>

              <InputField label="Difficulty">
                <select
                  name="difficulty"
                  value={draftQuestion.difficulty}
                  onChange={handleDraftChange}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                >
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </InputField>

              <div className="lg:col-span-2">
                <InputField label="Prompt / description">
                  <textarea
                    name="description"
                    value={draftQuestion.description}
                    onChange={handleDraftChange}
                    rows={5}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                    placeholder="Describe the problem, instructions, and expected constraints."
                  />
                </InputField>
              </div>

              {draftQuestion.type === 'MCQ' && (
                <>
                  {['option1', 'option2', 'option3', 'option4'].map((optionKey, index) => (
                    <InputField key={optionKey} label={`Option ${index + 1}`}>
                      <Input
                        name={optionKey}
                        value={draftQuestion[optionKey]}
                        onChange={handleDraftChange}
                        placeholder={`Option ${index + 1}`}
                      />
                    </InputField>
                  ))}
                  <InputField label="Correct answer">
                    <select
                      name="correctAnswer"
                      value={draftQuestion.correctAnswer}
                      onChange={handleDraftChange}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                    >
                      <option value="option1">Option 1</option>
                      <option value="option2">Option 2</option>
                      <option value="option3">Option 3</option>
                      <option value="option4">Option 4</option>
                    </select>
                  </InputField>
                  <div className="lg:col-span-2">
                    <InputField label="Explanation">
                      <textarea
                        name="explanation"
                        value={draftQuestion.explanation}
                        onChange={handleDraftChange}
                        rows={3}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
                        placeholder="Explain why the correct answer is right."
                      />
                    </InputField>
                  </div>
                </>
              )}

              {draftQuestion.type === 'CODING' && (
                <CodingQuestionFields draftQuestion={draftQuestion} onChange={handleDraftChange} />
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" onClick={handleQuestionSubmit} loading={questionSaving}>
                <Plus size={16} />
                {editingQuestionId ? 'Update Question' : 'Add Question'}
              </Button>
              {editingQuestionId && (
                <Button type="button" variant="outline" className="bg-white" onClick={resetDraftQuestion}>
                  Cancel Edit
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Badge variant="success">Question Set</Badge>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Round inventory</h2>
              </div>
              <Badge>{stats.totalQuestions} Questions</Badge>
            </div>

            <div className="mt-6 space-y-4">
              {questions.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                  No questions added yet.
                </div>
              ) : (
                questions
                  .slice()
                  .sort((first, second) => Number(first.sequenceNumber || 0) - Number(second.sequenceNumber || 0))
                  .map((question) => (
                    <div key={question.id || `${question.sequenceNumber}-${question.title}`} className="rounded-[26px] border border-slate-200 bg-[#fbfcff] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="primary">Q{question.sequenceNumber}</Badge>
                            <Badge>{formatLabel(question.type)}</Badge>
                            <Badge variant="success">{formatLabel(question.difficulty)}</Badge>
                            <span className="text-sm font-semibold text-slate-500">{question.marks} marks</span>
                          </div>
                          <h3 className="mt-4 text-xl font-semibold text-slate-950">{question.title}</h3>
                          <p className="mt-2 text-sm leading-7 text-slate-500">{question.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <Button type="button" variant="outline" className="bg-white" onClick={() => startEditQuestion(question)}>
                            Edit
                          </Button>
                          {question.id && (
                            <Button type="button" variant="outline" className="bg-white text-rose-600 hover:text-rose-700" onClick={() => onDeleteQuestion(question.id)}>
                              <Trash2 size={16} />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>
        </main>

        <aside className="space-y-6">
          <section className="sticky top-6 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm xl:max-h-[calc(100vh-48px)] xl:overflow-y-auto">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldCheck size={21} />
              </span>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Control tower</h2>
                <p className="text-sm text-slate-500">Security and scoring</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <MetricTile label="Questions" value={stats.totalQuestions} />
              <MetricTile label="Marks" value={stats.totalMarks} />
              <MetricTile label="Coding" value={stats.coding} />
              <MetricTile label="MCQ" value={stats.mcq} />
            </div>

            <div className="mt-6 space-y-3">
              {securityControls.map(({ name, label }) => (
                <label key={name} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <span className="text-sm text-slate-700">{label}</span>
                  <input
                    type="checkbox"
                    name={name}
                    checked={Boolean(formData[name])}
                    onChange={onFormChange}
                    className="h-4 w-4 accent-slate-950"
                  />
                </label>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              <SecurityNumberInput label="Fullscreen exits allowed" name="fullscreenViolationLimit" value={formData.fullscreenViolationLimit ?? 3} onChange={onFormChange} />
              <SecurityNumberInput label="Tab switches allowed" name="tabSwitchLimit" value={formData.tabSwitchLimit ?? 3} onChange={onFormChange} />
              <SecurityNumberInput label="Offline grace seconds" name="offlineGraceSeconds" value={formData.offlineGraceSeconds ?? 60} onChange={onFormChange} />
              <SecurityNumberInput label="Max attempts" name="maxAttempts" value={formData.maxAttempts ?? 1} onChange={onFormChange} />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

const CodingQuestionFields = ({ draftQuestion, onChange }) => (
  <>
    <InputField label="Language">
      <select
        name="programmingLanguage"
        value={draftQuestion.programmingLanguage}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
      >
        {['PYTHON', 'JAVA', 'JAVASCRIPT', 'CPP', 'C'].map((language) => (
          <option key={language} value={language}>
            {formatLabel(language)}
          </option>
        ))}
      </select>
    </InputField>
    <div className="lg:col-span-2">
      <InputField label="Function signature / candidate contract">
        <Input
          name="functionSignature"
          value={draftQuestion.functionSignature}
          onChange={onChange}
          placeholder="Example: def two_sum(nums, target):"
        />
      </InputField>
    </div>
    <div className="lg:col-span-2">
      <InputField label="Constraints">
        <textarea
          name="constraintsText"
          value={draftQuestion.constraintsText}
          onChange={onChange}
          rows={3}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400"
          placeholder="1 <= n <= 10^5&#10;Time limit: 2 seconds"
        />
      </InputField>
    </div>
    <div className="lg:col-span-2">
      <InputField label="Starter template">
        <textarea
          name="codeTemplate"
          value={draftQuestion.codeTemplate}
          onChange={onChange}
          rows={7}
          className="w-full rounded-2xl border border-slate-900 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none"
          placeholder="function solve() { }"
        />
      </InputField>
    </div>
    <div className="lg:col-span-2">
      <InputField label="Sample test cases">
        <textarea
          name="sampleTestCases"
          value={draftQuestion.sampleTestCases || draftQuestion.testCases}
          onChange={onChange}
          rows={4}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-700 outline-none transition focus:border-slate-400"
          placeholder={'Input: 2 3\nExpected: 5\n---\nInput: 4 8\nExpected: 12'}
        />
      </InputField>
    </div>
    <div className="lg:col-span-2">
      <InputField label="Hidden test cases">
        <textarea
          name="hiddenTestCases"
          value={draftQuestion.hiddenTestCases}
          onChange={onChange}
          rows={5}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-700 outline-none transition focus:border-slate-400"
          placeholder={'Input: 100 200\nExpected: 300\n---\nInput: -1 9\nExpected: 8'}
        />
      </InputField>
    </div>
    <div className="lg:col-span-2">
      <InputField label="Hidden wrapper code">
        <textarea
          name="hiddenWrapperCode"
          value={draftQuestion.hiddenWrapperCode}
          onChange={onChange}
          rows={8}
          className="w-full rounded-2xl border border-slate-900 bg-slate-950 px-4 py-3 font-mono text-sm text-slate-100 outline-none"
          placeholder={'{{USER_CODE}}\n\n# read stdin, call candidate function, print result'}
        />
      </InputField>
    </div>
    <InputField label="Legacy expected output">
      <Input
        name="expectedOutput"
        value={draftQuestion.expectedOutput}
        onChange={onChange}
        placeholder="Optional fallback for old single-case questions"
      />
    </InputField>
  </>
);

const InputField = ({ label, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-slate-600">{label}</span>
    {children}
  </label>
);

const StepItem = ({ icon: Icon, label, value, active = false }) => (
  <div className={`rounded-2xl border px-4 py-3 ${active ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white text-slate-950'}`}>
    <div className="flex items-center gap-3">
      <Icon size={18} />
      <div className="min-w-0">
        <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-slate-800'}`}>{label}</p>
        <p className={`truncate text-xs ${active ? 'text-slate-300' : 'text-slate-500'}`}>{value}</p>
      </div>
    </div>
  </div>
);

const MiniStat = ({ label, value }) => (
  <div className="rounded-2xl bg-white/10 px-3 py-3">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="mt-1 text-lg font-semibold text-white">{value}</p>
  </div>
);

const MetricTile = ({ label, value }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-4">
    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
  </div>
);

const ReadinessRow = ({ done, label }) => (
  <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3">
    <span className="text-sm text-slate-600">{label}</span>
    {done ? <CheckCircle2 size={18} className="text-emerald-600" /> : <LockKeyhole size={17} className="text-slate-300" />}
  </div>
);

const SecurityNumberInput = ({ label, name, value, onChange }) => (
  <label className="block rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <span className="text-sm font-semibold text-slate-700">{label}</span>
    <input
      type="number"
      name={name}
      value={value}
      min="1"
      onChange={onChange}
      className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-slate-400"
    />
  </label>
);

const formatLabel = (value) => {
  if (!value) return '';
  return String(value).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

export default AssessmentBuilder;
