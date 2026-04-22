import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import Timer from '../components/Timer';
import Question from '../components/Question';
import Proctoring from '../components/Proctoring';

const TestInterface = () => {
  const { sessionToken } = useParams();
  const navigate = useNavigate();
  
  const [sessionInfo, setSessionInfo] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [saveError, setSaveError] = useState('');
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const proctoringRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    initializeTest();
  }, [sessionToken]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const initializeTest = async () => {
    try {
      const response = await apiClient.get('/test-sessions/info', {
        params: { sessionToken }
      });

      setSessionInfo(response.data);

      // Fetch assessment details with questions
      const assessmentRes = await apiClient.get(`/assessments/${response.data.assessmentId}`);

      setQuestions(assessmentRes.data.questions || []);
      
      // Initialize answers object
      const initialAnswers = {};
      assessmentRes.data.questions.forEach(q => {
        initialAnswers[q.id] = '';
      });
      setAnswers(initialAnswers);

      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize test:', error);
      setSaveError('Failed to load test. Please refresh or contact support.');
      navigate('/dashboard');
    }
  };

  const submitAnswer = useCallback(async (questionId, answer) => {
    if (!sessionToken || !questionId) return;
    
    try {
      const question = questions.find(q => q.id === questionId);
      await apiClient.post('/submissions', {
        sessionToken,
        questionId,
        answerText: answer,
        codeSubmitted: question?.type === 'CODING' ? answer : null
      });
      
      setSaveStatus('Saved');
      setSaveError('');
    } catch (error) {
      console.error('Failed to save answer:', error);
      setSaveError(`Save failed: ${error.response?.data?.message || error.message}`);
    }
  }, [sessionToken, questions]);

  const debouncedSave = useCallback((questionId, answer) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      submitAnswer(questionId, answer);
    }, 1000);
  }, [submitAnswer]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    debouncedSave(questionId, answer);
  };

  const handleFinishTest = async () => {
    if (!window.confirm('Are you sure? You cannot change answers after submission.')) {
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/test-sessions/submit', {}, {
        params: { sessionToken }
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to submit test:', error);
      setSaveError('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  const logProctoringEvent = async (eventType, severity, metadata = {}) => {
    try {
      await apiClient.post('/proctoring/log-event', {
        sessionToken,
        eventType,
        severityScore: severity,
        metadata: JSON.stringify(metadata)
      });
    } catch (error) {
      console.error('Failed to log proctoring event:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading test...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="fixed inset-0 bg-gray-50 flex flex-col">
      <div className="bg-white border-b sticky top-0 z-10 flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Question {currentQuestionIndex + 1} of {questions.length}</h1>
          <p className="text-sm text-gray-600">Marks: {currentQuestion?.marks || 0}</p>
          {saveStatus === 'Saved' && (
            <p className="text-xs text-green-600 mt-1">✓ Saved</p>
          )}
          {saveError && (
            <p className="text-xs text-red-600 mt-1">⚠️ {saveError}</p>
          )}
        </div>

        <div className="flex items-center gap-8">
          <Timer 
            expiresAt={sessionInfo?.expiresAt} 
            onTimeUp={() => handleFinishTest()}
            onProtoringEvent={logProctoringEvent}
          />

          <button
            onClick={() => document.documentElement.requestFullscreen()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Full Screen
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto">
          {currentQuestion ? (
            <Question
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswerChange={(ans) => handleAnswerChange(currentQuestion.id, ans)}
            />
          ) : (
            <p className="text-gray-500">No questions available</p>
          )}
        </div>

        <div className="w-64 bg-white border-l p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Question Navigator</h3>
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-full text-left p-3 rounded text-sm transition ${
                  idx === currentQuestionIndex
                    ? 'bg-blue-100 border-l-4 border-blue-600 font-medium'
                    : answers[q.id] && answers[q.id].trim()
                    ? 'bg-green-100 border-l-4 border-green-600'
                    : 'bg-gray-100 border-l-4 border-gray-300 hover:bg-gray-200'
                }`}
              >
                Q{idx + 1} ({q.type})
                {answers[q.id] && answers[q.id].trim() && (
                  <span className="ml-2 text-green-600 text-xs">✓</span>
                )}
              </button>
            ))}
          </div>

          <button
            onClick={handleFinishTest}
            disabled={submitting}
            className="w-full mt-8 px-4 py-3 bg-red-600 text-white rounded font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting...' : 'Finish Test'}
          </button>
        </div>
      </div>

      <Proctoring ref={proctoringRef} sessionToken={sessionToken} onEvent={logProctoringEvent} />
    </div>
  );
};

export default TestInterface;
