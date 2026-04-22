import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const proctoringRef = useRef(null);

  useEffect(() => {
    initializeTest();
  }, [sessionToken]);

  const initializeTest = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/v1/test-sessions/info', {
        params: { sessionToken },
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });

      setSessionInfo(response.data);

      // Fetch assessment details with questions
      const assessmentRes = await axios.get(
        `http://localhost:8080/api/v1/assessments/${response.data.assessmentId}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }
      );

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
      navigate('/dashboard');
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));

    // Auto-save answer
    submitAnswer(questionId, answer);
  };

  const submitAnswer = async (questionId, answer) => {
    console.log({
      sessionToken,
      questionId,
      answerText: answer
    });
    try {
      const question = questions.find(q => q.id === questionId);
      await axios.post('http://localhost:8080/api/v1/submissions', {
        sessionToken,
        questionId,
        answerText: answer,
        codeSubmitted: question.type === 'CODING' ? answer : null
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      });
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  const handleFinishTest = async () => {
    if (!window.confirm('Are you sure? You cannot change answers after submission.')) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(
        'http://localhost:8080/api/v1/test-sessions/submit',
        {},
        {
          params: { sessionToken },
          headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
        }
      );

      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to submit test:', error);
      alert('Failed to submit test. Please try again.');
      setSubmitting(false);
    }
  };

  const handleFullscreenChange = () => {
    const fullscreenElement = document.fullscreenElement;
    setIsFullscreen(!!fullscreenElement);

    if (!fullscreenElement && sessionInfo?.assessment?.enforceFullScreen) {
      logProctoringEvent('FULLSCREEN_EXITED', 70);
      setShowFullscreenWarning(true);
    }
  };

  const logProctoringEvent = async (eventType, severity, metadata = {}) => {
    try {
      await axios.post('http://localhost:8080/api/v1/proctoring/log-event', {
        sessionToken,
        eventType,
        severityScore: severity,
        metadata: JSON.stringify(metadata)
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
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
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 flex justify-between items-center px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold">Question {currentQuestionIndex + 1} of {questions.length}</h1>
          <p className="text-sm text-gray-600">Marks: {currentQuestion.marks}</p>
        </div>

        <div className="flex items-center gap-8">
          <Timer 
            expiresAt={sessionInfo.expiresAt} 
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
        {/* Main Question Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          {currentQuestion && (
            <Question
              question={currentQuestion}
              answer={answers[currentQuestion.id]}
              onAnswerChange={(ans) => handleAnswerChange(currentQuestion.id, ans)}
            />
          )}
        </div>

        {/* Right Sidebar - Question Navigator */}
        <div className="w-64 bg-white border-l p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Question Navigator</h3>
          <div className="space-y-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-full text-left p-3 rounded text-sm transition ${
                  idx === currentQuestionIndex
                    ? 'bg-blue-100 border-l-4 border-blue-600'
                    : answers[q.id]
                    ? 'bg-green-100 border-l-4 border-green-600'
                    : 'bg-gray-100 border-l-4 border-gray-300 hover:bg-gray-200'
                }`}
              >
                Q{idx + 1}
                {answers[q.id] && <span className="ml-2 text-green-600">✓</span>}
              </button>
            ))}
          </div>

          <button
            onClick={handleFinishTest}
            disabled={submitting}
            className="w-full mt-8 px-4 py-3 bg-red-600 text-white rounded font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Finish Test'}
          </button>
        </div>
      </div>

      {/* Proctoring Component */}
      <Proctoring ref={proctoringRef} sessionToken={sessionToken} onEvent={logProctoringEvent} />
    </div>
  );
};

export default TestInterface;
