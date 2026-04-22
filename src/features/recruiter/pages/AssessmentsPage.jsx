import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Badge from '../../../components/common/Badge';
import RecruiterLayout from '../components/RecruiterLayout';
import RecruiterNavbar from '../components/RecruiterNavbar';
import { assessmentService } from '../../../services';

const AssessmentsPage = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setLoading(true);
        const response = await assessmentService.getMyAssessments();
        console.log('Assessments response:', response);
        setAssessments(Array.isArray(response.data) ? response.data : response.data?.data || []);

      } catch (err) {
        setError('Failed to load assessments. ' + (err.response?.data?.message || err.message));
        console.error('Assessments load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
  }, []);

  return (
    <RecruiterLayout>
      <RecruiterNavbar
        title="Assessments"
        subtitle="Manage coding tests and assessments for your job openings"
        action={
          <Link to="/recruiter/assessments/create">
            <Button>New Assessment</Button>
          </Link>
        }
      />

      {error && (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map((i) => (
            <Card key={i} className="p-6">
              <div className="h-32 animate-pulse bg-gray-200 rounded" />
            </Card>
          ))}
        </div>
      ) : !Array.isArray(assessments) || assessments.length === 0 ? (
        <Card className="p-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-gray-100 p-4">
            <svg className="h-8 w-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No assessments</h3>
          <p className="mt-2 text-sm text-gray-500">
            Create your first coding assessment or MCQ test to start evaluating candidates.
          </p>
          <Link to="/recruiter/assessments/create" className="mt-6 inline-block">
            <Button>Create Assessment</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {assessments.map((assessment) => (
            <Card key={assessment.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                  <p className="mt-1 text-sm text-gray-500">{assessment.description?.substring(0, 100)}...</p>
                </div>
                <Badge variant="default">{assessment.status || 'Draft'}</Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Duration</span>
                  <p className="font-medium">{assessment.durationMinutes} min</p>
                </div>
                <div>
                  <span className="text-gray-500">Total Marks</span>
                  <p className="font-medium">{assessment.totalMarks}</p>
                </div>
                <div>
                  <span className="text-gray-500">Questions</span>
                  <p className="font-medium">{assessment.questionCount || 0}</p>
                </div>
                <div>
                  <span className="text-gray-500">Job</span>
                  <p className="font-medium">{assessment.jobTitle}</p>
                </div>
              </div>
              <div className="mt-6 flex gap-2">
                <Link 
                  to={`/recruiter/assessments/${assessment.id}/leaderboard`}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm">Leaderboard</Button>
                </Link>
                <Link 
                  to={`/recruiter/assessments/${assessment.id}/edit`}
                  className="flex-1"
                >
                  <Button size="sm">Edit</Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </RecruiterLayout>
  );
};

export default AssessmentsPage;

