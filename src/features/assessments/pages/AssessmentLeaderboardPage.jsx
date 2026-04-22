import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import RecruiterLayout from '../../recruiter/components/RecruiterLayout';
import RecruiterNavbar from '../../recruiter/components/RecruiterNavbar';

const AssessmentLeaderboardPage = () => {
  const { assessmentId } = useParams();
  const [leaderboard, setLeaderboard] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);
  const [showProctoringReport, setShowProctoringReport] = useState(false);
  const [proctoringData, setProctoringData] = useState(null);

  useEffect(() => {
    fetchLeaderboard();
    fetchAssessment();
  }, [assessmentId]);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/v1/results/assessment/${assessmentId}/leaderboard`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setLeaderboard(response.data || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssessment = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/v1/assessments/${assessmentId}`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setAssessment(response.data);
    } catch (error) {
      console.error('Failed to fetch assessment:', error);
    }
  };

  const fetchProctoringReport = async (sessionId) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/v1/proctoring/${sessionId}/summary`,
        { headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } }
      );
      setProctoringData(response.data);
      setShowProctoringReport(true);
    } catch (error) {
      console.error('Failed to fetch proctoring report:', error);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading leaderboard...</div>;
  }

  return (
    <RecruiterLayout>
      <div className="space-y-6">
        <RecruiterNavbar
          title="Assessment Leaderboard"
          subtitle={assessment?.title || 'Results Overview'}
        />

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm">Total Attempts</p>
            <p className="text-3xl font-bold text-blue-600">{leaderboard.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm">Passed</p>
            <p className="text-3xl font-bold text-green-600">
              {leaderboard.filter(r => r.passed).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm">Average Score</p>
            <p className="text-3xl font-bold text-purple-600">
              {leaderboard.length > 0
                ? (leaderboard.reduce((sum, r) => sum + r.percentageScore, 0) / leaderboard.length).toFixed(1)
                : 0}%
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-600 text-sm">Highest Score</p>
            <p className="text-3xl font-bold text-orange-600">
              {leaderboard.length > 0 ? Math.max(...leaderboard.map(r => r.score)).toFixed(1) : 0}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Candidate</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Score</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Percentage</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Completed</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaderboard.map((result, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                      {result.rank}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{result.candidateName}</td>
                  <td className="px-6 py-4 font-semibold">{result.score.toFixed(1)}/{assessment?.totalMarks}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className={`h-2 rounded-full ${
                            result.percentageScore >= (parseInt(assessment?.passingMarksPercentage) || 60)
                              ? 'bg-green-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${result.percentageScore}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{result.percentageScore.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      result.passed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {result.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{result.completedAt.split('T')[0]}</td>
                  <td className="px-6 py-4 space-x-2">
                    <button
                      onClick={() => setSelectedResult(result)}
                      className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      View
                    </button>
                    <button
                      onClick={() => fetchProctoringReport(result.sessionId)}
                      className="px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600"
                    >
                      Proctoring
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Proctoring Report Modal */}
        {showProctoringReport && proctoringData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Proctoring Report</h3>
                  <button
                    onClick={() => setShowProctoringReport(false)}
                    className="text-gray-500 hover:text-gray-700 text-xl"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded">
                    <span className="text-gray-700 font-medium">Risk Score</span>
                    <span className={`text-2xl font-bold ${
                      proctoringData.riskScore > 70 ? 'text-red-600' :
                      proctoringData.riskScore > 40 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {proctoringData.riskScore}/100
                    </span>
                  </div>

                  <div>
                    <p className="font-semibold mb-2">Suspicious Activities</p>
                    {Object.entries(proctoringData.activities || {}).map(([activity, count]) => (
                      <div key={activity} className="flex justify-between p-2 text-sm hover:bg-gray-50">
                        <span>{activity}</span>
                        <span className="font-medium">{count}x</span>
                      </div>
                    ))}
                  </div>

                  <div className={`p-4 rounded ${
                    proctoringData.shouldReviewByRecruiter ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
                  }`}>
                    <p className={`font-semibold ${
                      proctoringData.shouldReviewByRecruiter ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {proctoringData.shouldReviewByRecruiter
                        ? 'FLAG FOR REVIEW: High risk of cheating detected'
                        : 'OK: No significant concerns detected'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </RecruiterLayout>
  );
};

export default AssessmentLeaderboardPage;
