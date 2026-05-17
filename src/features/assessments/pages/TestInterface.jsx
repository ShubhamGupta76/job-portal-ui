import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../../../components/common/Button';
import Question from '../components/Question';
import Proctoring from '../components/Proctoring';
import { assessmentService } from '../../../services';
import { ASSESSMENT_LIFECYCLE, useAssessmentLifecycle } from '../hooks/useAssessmentLifecycle';

const TestInterface = () => {
  const { sessionToken } = useParams();
  const navigate = useNavigate();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState('');
  const [elapsed, setElapsed] = useState(Date.now());
  const [violations, setViolations] = useState(0);
  const [securityCounts, setSecurityCounts] = useState({ fullscreen: 0, tab: 0 });
  const [warning, setWarning] = useState(null);
  const [offlineSince, setOfflineSince] = useState(null);
  const [startupError, setStartupError] = useState('');
  const proctoringRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const submittedRef = useRef(false);
  const securityCountsRef = useRef(securityCounts);
  const initializeRunRef = useRef(null);
  const {
    lifecycleState,
    transitionTo,
    isInitializing,
    assessmentReady,
    securityEnabled,
  } = useAssessmentLifecycle();

  const secureModeRequired = useMemo(() => requiresSecureMode(sessionInfo), [sessionInfo]);

  useEffect(() => {
    securityCountsRef.current = securityCounts;
  }, [securityCounts]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const initializeTest = useCallback(async () => {
    if (!sessionToken || initializeRunRef.current === sessionToken) return;
    initializeRunRef.current = sessionToken;

    transitionTo(ASSESSMENT_LIFECYCLE.VERIFYING, { sessionToken });
    setLoading(true);
    setStartupError('');
    setSaveError('');

    try {
      const response = await assessmentService.getSessionInfo(sessionToken);
      const data = response.data || {};
      const loadedQuestions = Array.isArray(data.questions) ? data.questions : [];

      transitionTo(ASSESSMENT_LIFECYCLE.INITIALIZING, {
        sessionStatus: data.status,
        questionCount: loadedQuestions.length,
        expiresAt: data.expiresAt,
      });

      setSessionInfo(data);
      setQuestions(loadedQuestions);
      setAnswers(data.answers || {});
      setCurrentQuestionIndex(0);
      setViolations(0);
      setSecurityCounts({ fullscreen: 0, tab: 0 });
      setWarning(null);
      setOfflineSince(null);
      setElapsed(Date.now());

      if (requiresSecureMode(data)) {
        transitionTo(ASSESSMENT_LIFECYCLE.IDLE, { reason: 'Awaiting candidate secure-mode gesture' });
      } else {
        transitionTo(ASSESSMENT_LIFECYCLE.ACTIVE, { reason: 'No secure-mode permissions required' });
      }
    } catch (error) {
      console.error('Failed to initialize test:', error);
      initializeRunRef.current = null;
      setSaveError('Failed to load test. Please refresh or contact support.');
      navigate('/candidate/assessments', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [navigate, sessionToken, transitionTo]);

  useEffect(() => {
    initializeTest();
  }, [initializeTest]);

  const handleFinishTest = useCallback(async (options = {}) => {
    if (submittedRef.current) return;

    if (options.force && !securityEnabled) {
      console.debug('[AssessmentLifecycle] Suppressed forced submit before ACTIVE', {
        reason: options.reason,
        lifecycleState,
        securityEnabled,
      });
      return;
    }

    if (!options.force && !assessmentReady) {
      setSaveError('Assessment is still starting. Please enter secure mode before submitting.');
      return;
    }

    if (!options.force && !window.confirm('Submit your assessment now? You will not be able to change answers afterward.')) {
      return;
    }

    submittedRef.current = true;
    setSubmitting(true);
    transitionTo(ASSESSMENT_LIFECYCLE.SUBMITTING, { reason: options.reason || 'Candidate submitted' });

    try {
      await assessmentService.submitTestSession(sessionToken);
      transitionTo(ASSESSMENT_LIFECYCLE.COMPLETED, { reason: 'Submit API completed' });
      navigate('/candidate/assessments', { replace: true });
    } catch (error) {
      console.error('Failed to submit test:', error);
      setSaveError(error.response?.data?.message || 'Failed to submit test. Please try again.');
      submittedRef.current = false;
      setSubmitting(false);
      transitionTo(ASSESSMENT_LIFECYCLE.ACTIVE, { reason: 'Submit failed; returning to active test' });
    }
  }, [assessmentReady, lifecycleState, navigate, securityEnabled, sessionToken, transitionTo]);

  const logProctoringEvent = useCallback(async (eventType, severityScore = 60, metadata = {}) => {
    if (!securityEnabled) {
      console.debug('[AssessmentSecurity] Ignored startup event before ACTIVE', {
        eventType,
        severityScore,
        lifecycleState,
      });
      return;
    }

    const nextCounts = { ...securityCountsRef.current };
    if (eventType === 'FULLSCREEN_EXIT') nextCounts.fullscreen += 1;
    if (['TAB_SWITCH', 'WINDOW_BLUR'].includes(eventType)) nextCounts.tab += 1;
    securityCountsRef.current = nextCounts;
    setSecurityCounts(nextCounts);

    if (severityScore >= 70) {
      setViolations((value) => value + 1);
    }

    setWarning({
      eventType,
      message: warningMessage(eventType),
      severityScore,
      createdAt: new Date().toISOString(),
    });

    const fullscreenLimit = Number(sessionInfo?.fullscreenViolationLimit || 3);
    const tabLimit = Number(sessionInfo?.tabSwitchLimit || 3);
    const shouldAutoSubmit =
      sessionInfo?.autoSubmitOnViolationLimit !== false &&
      ((eventType === 'FULLSCREEN_EXIT' && nextCounts.fullscreen >= fullscreenLimit) ||
        (['TAB_SWITCH', 'WINDOW_BLUR'].includes(eventType) && nextCounts.tab >= tabLimit) ||
        eventType === 'DEVTOOLS_ATTEMPT');

    try {
      await assessmentService.logProctoringEvent({
        sessionToken,
        eventType,
        description: warningMessage(eventType),
        severityScore,
        metadata: JSON.stringify({
          ...metadata,
          lifecycleState,
          path: window.location.pathname,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('Proctoring event could not be recorded', error);
    }

    if (shouldAutoSubmit) {
      handleFinishTest({ force: true, reason: `Auto submitted after ${eventType}` });
    }
  }, [handleFinishTest, lifecycleState, securityEnabled, sessionInfo, sessionToken]);

  useEffect(() => {
    if (!securityEnabled) return undefined;

    const goOffline = () => {
      setOfflineSince(Date.now());
      logProctoringEvent('INTERNET_DISCONNECT', 85, { online: false });
    };
    const goOnline = () => setOfflineSince(null);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);

    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, [logProctoringEvent, securityEnabled]);

  useEffect(() => {
    if (!securityEnabled || !offlineSince || !sessionInfo?.offlineGraceSeconds) return undefined;

    const timer = setInterval(() => {
      const secondsOffline = Math.floor((Date.now() - offlineSince) / 1000);
      if (secondsOffline >= Number(sessionInfo.offlineGraceSeconds)) {
        handleFinishTest({ force: true, reason: 'Offline too long' });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [handleFinishTest, offlineSince, securityEnabled, sessionInfo]);

  const handleEnterSecureMode = async () => {
    if (!sessionInfo) return;

    setStartupError('');
    transitionTo(ASSESSMENT_LIFECYCLE.REQUESTING_PERMISSIONS, {
      requireWebcam: sessionInfo.requireWebcam,
      enableProctoring: sessionInfo.enableProctoring,
    });

    try {
      const needsCamera = Boolean(sessionInfo.enableProctoring || sessionInfo.requireWebcam);
      const cameraPromise = needsCamera
        ? proctoringRef.current?.startProctoring?.()
        : Promise.resolve(true);

      transitionTo(ASSESSMENT_LIFECYCLE.ENTERING_FULLSCREEN, {
        enforceFullScreen: sessionInfo.enforceFullScreen,
      });

      if (sessionInfo.enforceFullScreen && document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }

      const cameraStarted = await cameraPromise;
      if (needsCamera && !cameraStarted) {
        throw new Error('Camera or microphone permission is required before this assessment can begin.');
      }

      transitionTo(ASSESSMENT_LIFECYCLE.INITIALIZING, {
        questionCount: questions.length,
        fullscreen: Boolean(document.fullscreenElement),
      });

      setElapsed(Date.now());
      setViolations(0);
      setSecurityCounts({ fullscreen: 0, tab: 0 });
      setWarning(null);
      setOfflineSince(null);
      transitionTo(ASSESSMENT_LIFECYCLE.ACTIVE, { reason: 'Secure startup completed' });
    } catch (error) {
      console.warn('Secure mode startup failed:', error);
      setStartupError(error?.message || 'Unable to enter secure mode. Please allow fullscreen/camera access and try again.');
      transitionTo(ASSESSMENT_LIFECYCLE.IDLE, { reason: 'Secure startup failed' });
    }
  };

  const submitAnswer = useCallback(async (questionId, answer) => {
    if (!sessionToken || !questionId || !assessmentReady) return;

    try {
      const question = questions.find((item) => item.id === questionId);
      await assessmentService.submitAnswer({
        sessionToken,
        questionId,
        answerText: question?.type === 'CODING' ? '' : answer,
        codeSubmitted: question?.type === 'CODING' ? answer : null,
        language: question?.programmingLanguage,
        evaluate: false,
      });
      setSaveStatus('saved');
      setSaveError('');
    } catch (error) {
      console.error('Failed to save answer:', error);
      setSaveStatus('error');
      setSaveError(error.response?.data?.message || 'Answer save failed.');
    }
  }, [assessmentReady, questions, sessionToken]);

  const debouncedSave = useCallback((questionId, answer) => {
    if (!assessmentReady) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => {
      submitAnswer(questionId, answer);
    }, 700);
  }, [assessmentReady, submitAnswer]);

  const handleAnswerChange = (questionId, answer) => {
    if (!assessmentReady) return;

    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    debouncedSave(questionId, answer);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = useMemo(() => {
    return questions.filter((question) => String(answers[question.id] || '').trim()).length;
  }, [answers, questions]);

  const progressPercentage = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0;
  const expiresAt = useMemo(() => {
    if (!sessionInfo?.expiresAt) return null;
    const value = new Date(sessionInfo.expiresAt).getTime();
    return Number.isFinite(value) ? value : null;
  }, [sessionInfo]);
  const remainingMs = expiresAt ? expiresAt - elapsed : null;
  const displayRemainingMs = Math.max(0, remainingMs ?? 0);

  useEffect(() => {
    console.debug('[AssessmentDebug]', {
      lifecycleState,
      timerMs: remainingMs,
      displayTimerMs: displayRemainingMs,
      violationCount: violations,
      sessionStatus: sessionInfo?.status,
      fullscreenActive: Boolean(document.fullscreenElement),
      securityEnabled,
      assessmentReady,
      questionCount: questions.length,
    });
  }, [assessmentReady, displayRemainingMs, lifecycleState, questions.length, remainingMs, securityEnabled, sessionInfo, violations]);

  useEffect(() => {
    if (!securityEnabled || !expiresAt || remainingMs == null || submittedRef.current) return;
    if (remainingMs <= 0) {
      handleFinishTest({ force: true, reason: 'Timer ended' });
    }
  }, [expiresAt, handleFinishTest, remainingMs, securityEnabled]);

  useEffect(() => {
    if (!securityEnabled || submittedRef.current) return;
    if (violations >= 3) {
      handleFinishTest({ force: true, reason: 'Security violation limit reached' });
    }
  }, [handleFinishTest, securityEnabled, violations]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] text-sm text-slate-500">
        Loading assessment workspace...
      </div>
    );
  }

  if (sessionInfo?.desktopOnly && isLikelyMobileDevice()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white">
        <div className="max-w-md rounded-lg border border-white/10 bg-white/10 p-8">
          <h1 className="text-2xl font-semibold">Desktop Required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            This assessment is configured for secure desktop mode. Please reopen it on a laptop or desktop browser.
          </p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f8fb] text-sm text-slate-500">
        No questions available for this session.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-slate-900">
      {secureModeRequired && !assessmentReady && (
        <SecureStartupOverlay
          lifecycleState={lifecycleState}
          sessionInfo={sessionInfo}
          startupError={startupError}
          isInitializing={isInitializing}
          onEnterSecureMode={handleEnterSecureMode}
        />
      )}

      <div className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="outline" className="bg-white" onClick={() => navigate('/candidate/assessments')}>
              Quit Test
            </Button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Progress</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progressPercentage}%` }} />
                </div>
                <span className="text-sm text-slate-600">{answeredCount} / {questions.length}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Time Left</p>
              <p className="mt-1 text-2xl font-semibold text-blue-600">{formatDuration(displayRemainingMs)}</p>
            </div>
            <Button onClick={handleFinishTest} loading={submitting} disabled={submitting || !assessmentReady}>
              Submit Solution
            </Button>
          </div>
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white/80 px-6 py-3">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-5 text-sm text-slate-500">
          <span>{securityEnabled ? 'Security Active' : `Security ${lifecycleState.toLowerCase()}`}</span>
          <span>{sessionInfo?.enableProctoring ? 'Camera Required' : 'Standard Monitoring'}</span>
          <span>{sessionInfo?.enforceFullScreen ? 'Full Screen Required' : 'Flexible View'}</span>
          <span>{sessionInfo?.detectCopyPaste ? 'Copy / Paste Guard' : 'Clipboard Allowed'}</span>
          <span>{saveStatus === 'saved' ? 'Auto-saved' : saveStatus === 'saving' ? 'Saving...' : 'Ready'}</span>
          <span>Warnings {violations}</span>
        </div>
      </div>

      {warning && (
        <div className="fixed right-5 top-5 z-[70] max-w-sm rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-semibold">Security warning</p>
              <p className="mt-1">{warning.message}</p>
              <p className="mt-2 text-xs text-amber-700">
                Fullscreen exits: {securityCounts.fullscreen}/{sessionInfo?.fullscreenViolationLimit || 3} - Tab events: {securityCounts.tab}/{sessionInfo?.tabSwitchLimit || 3}
              </p>
            </div>
            <button type="button" onClick={() => setWarning(null)} className="text-lg leading-none">x</button>
          </div>
        </div>
      )}

      <div className="mx-auto grid min-h-[calc(100vh-129px)] max-w-[1600px] grid-cols-1 xl:grid-cols-[520px_minmax(0,1fr)]">
        <section className="border-r border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-6 py-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                {currentQuestion.difficulty || 'MEDIUM'}
              </span>
              <span className="text-sm text-slate-500">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">
              {sessionInfo?.assessmentTitle || 'Assessment'}
            </h1>
            <p className="mt-2 text-base text-slate-500">
              {sessionInfo?.jobTitle || 'Assigned round'}
            </p>
          </div>

          <div className="space-y-6 px-6 py-6">
            <Question
              question={currentQuestion}
              answer={answers[currentQuestion.id] || ''}
              onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
              sessionToken={sessionToken}
              showResponseArea={false}
            />
          </div>
        </section>

        <section className="flex min-h-[calc(100vh-129px)] flex-col bg-[#f7f9fc]">
          <div className="border-b border-slate-200 bg-white px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Assessment Flow</p>
                <p className="mt-2 text-lg text-slate-600">
                  Move through each section and submit when you are done.
                </p>
              </div>
              {saveError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </div>
              )}
            </div>
          </div>

          <div className="grid flex-1 grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)]">
            <div className="border-r border-slate-200 bg-white px-5 py-5">
              <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">Navigator</h3>
              <div className="mt-5 space-y-3">
                {questions.map((question, index) => {
                  const answered = String(answers[question.id] || '').trim().length > 0;
                  const active = index === currentQuestionIndex;
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(index)}
                      className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${
                        active
                          ? 'border-blue-500 bg-blue-50 shadow-[0_12px_24px_rgba(37,99,235,0.14)]'
                          : answered
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-slate-200 bg-slate-50 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Q{index + 1}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">{question.type}</p>
                        </div>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          answered ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {answered ? 'Saved' : 'Open'}
                        </span>
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{question.title}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col">
              <div className="border-b border-slate-200 bg-white px-6 py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Current Section</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{currentQuestion.title}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="bg-white"
                      onClick={() => setCurrentQuestionIndex((value) => Math.max(0, value - 1))}
                      disabled={currentQuestionIndex === 0 || sessionInfo?.sequentialQuestionsOnly || sessionInfo?.allowBackNavigation === false}
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentQuestionIndex((value) => Math.min(questions.length - 1, value + 1))}
                      disabled={currentQuestionIndex === questions.length - 1}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-auto px-6 py-6">
                <Question
                  question={currentQuestion}
                  answer={answers[currentQuestion.id] || ''}
                  onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
                  sessionToken={sessionToken}
                  onCodeSubmitted={() => setSaveStatus('saved')}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      <Proctoring enabled={securityEnabled} ref={proctoringRef} sessionToken={sessionToken} onEvent={logProctoringEvent} />
    </div>
  );
};

const SecureStartupOverlay = ({ lifecycleState, sessionInfo, startupError, isInitializing, onEnterSecureMode }) => (
  <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/85 px-5 text-white backdrop-blur-sm">
    <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/10 p-7 shadow-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-200">Secure Assessment</p>
      <h1 className="mt-4 text-3xl font-semibold">Enter secure mode to begin</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        The assessment is loaded. Security monitoring starts only after fullscreen, permissions, questions, and timer are ready.
      </p>
      <div className="mt-5 rounded-2xl bg-white/8 px-4 py-3 text-sm text-slate-200">
        Current lifecycle: <span className="font-semibold text-white">{lifecycleState}</span>
      </div>
      <div className="mt-6 grid gap-3 text-sm text-slate-200">
        <SecureRule label="Fullscreen" enabled={sessionInfo?.enforceFullScreen} />
        <SecureRule label="Camera / proctoring" enabled={sessionInfo?.enableProctoring || sessionInfo?.requireWebcam} />
        <SecureRule label="Clipboard guard" enabled={sessionInfo?.detectCopyPaste} />
      </div>
      {startupError && (
        <div className="mt-5 rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
          {startupError}
        </div>
      )}
      <Button onClick={onEnterSecureMode} loading={isInitializing} disabled={isInitializing} className="mt-6 w-full">
        {isInitializing ? 'Preparing...' : 'Enter Secure Mode'}
      </Button>
    </div>
  </div>
);

const SecureRule = ({ label, enabled }) => (
  <div className="flex items-center justify-between rounded-2xl bg-white/8 px-4 py-3">
    <span>{label}</span>
    <span className={enabled ? 'text-emerald-200' : 'text-slate-400'}>{enabled ? 'Required' : 'Off'}</span>
  </div>
);

const requiresSecureMode = (sessionInfo) => Boolean(
  sessionInfo?.enforceFullScreen ||
  sessionInfo?.enableProctoring ||
  sessionInfo?.requireWebcam ||
  sessionInfo?.detectCopyPaste
);

const formatDuration = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const warningMessage = (eventType) => {
  const messages = {
    FULLSCREEN_EXIT: 'You exited fullscreen mode. Please return to fullscreen immediately.',
    TAB_SWITCH: 'Tab switching is not allowed during this assessment.',
    WINDOW_BLUR: 'The assessment window lost focus.',
    COPY_PASTE_DETECTED: 'Clipboard and restricted keyboard shortcuts are blocked.',
    DEVTOOLS_ATTEMPT: 'Developer tools are not allowed during assessments.',
    INTERNET_DISCONNECT: 'Internet connection was lost. Reconnect before the grace period ends.',
    RIGHT_CLICK: 'Right click is disabled in secure assessment mode.',
    CAMERA_DETECTED_MISSING: 'Camera or microphone permission is required for this assessment.',
  };
  return messages[eventType] || 'A security event was detected.';
};

const isLikelyMobileDevice = () => {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent) || window.innerWidth < 900;
};

export default TestInterface;
