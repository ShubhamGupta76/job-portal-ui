import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CandidateAssessmentsPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionStarting, setSessionStarting] = useState(null);

  useEffect(() => {
    fetchAvailableAssessments();
  }, []);

  const fetchAvailableAssessments = async () => {
    try {
      // Get current job from job details page context
      // For now, using a hardcoded jobId - in real app, get from route params
      const jobId = new URLSearchParams(window.location.search).get('jobId') || '1';
      
      const response = await axios.get(
        `http://localhost:8080/api/v1/assessments/job/${jobId}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
      );
      
      setAssessments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch assessments:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAssessment = async (assessmentId) => {
    setSessionStarting(assessmentId);
    try {
      const response = await axios.post(
        'http://localhost:8080/api/v1/test-sessions/start',
        { assessmentId },
        { headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'User-Agent': navigator.userAgent,
          'X-Forwarded-For': '0.0.0.0' // Will be set by backend
        }}
      );

      // Redirect to test interface with session token
      window.location.href = `/test/${response.data.sessionToken}`;
    } catch (error) {
      console.error('Failed to start assessment:', error);
      alert('Failed to start assessment. Please try again.');
      setSessionStarting(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading assessments...</div>;
  }

  if (assessments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p>No assessments available for this job yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Online Assessments</h1>

      <div className="space-y-4">
        {assessments.map(assessment => (
          <div key={assessment.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                <p className="text-gray-600 text-sm mt-1">{assessment.description}</p>
              </div>
              <button
                onClick={() => startAssessment(assessment.id)}
                disabled={sessionStarting === assessment.id}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
              >
                {sessionStarting === assessment.id ? 'Starting...' : 'Start Test'}
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="font-semibold">{assessment.durationMinutes} min</p>
              </div>
              <div>
                <p className="text-gray-600">Total Marks</p>
                <p className="font-semibold">{assessment.totalMarks}</p>
              </div>
              <div>
                <p className="text-gray-600">Passing Percentage</p>
                <p className="font-semibold">{assessment.passingMarksPercentage}</p>
              </div>
              <div>
                <p className="text-gray-600">Questions</p>
                <p className="font-semibold">{assessment.questions?.length || 0}</p>
              </div>
            </div>

            {assessment.enableProctoring && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                This assessment is proctored. Your screen activity will be monitored.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CandidateAssessmentsPage;
