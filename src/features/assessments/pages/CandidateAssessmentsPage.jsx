import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { assessmentService } from '../../../services';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';

const CandidateAssessmentsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionStarting, setSessionStarting] = useState(null);

  const jobId = searchParams.get('jobId');
  const assessmentId = searchParams.get('assessmentId');

  useEffect(() => {
    const fetchAvailableAssessments = async () => {
      if (!jobId) {
        setLoading(false);
        return;
      }

      try {
        const response = await assessmentService.getAssessmentsForJob(jobId);
        setAssessments(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Failed to fetch assessments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableAssessments();
  }, [jobId]);

  const visibleAssessments = useMemo(() => {
    if (!assessmentId) {
      return assessments;
    }

    return assessments.filter((assessment) => String(assessment.id) === String(assessmentId));
  }, [assessmentId, assessments]);

  const startAssessment = async (selectedAssessmentId) => {
    setSessionStarting(selectedAssessmentId);
    try {
      const response = await assessmentService.startAssessment(selectedAssessmentId);
      navigate(`/test/${response.data.sessionToken}`);
    } catch (error) {
      console.error('Failed to start assessment:', error);
      setSessionStarting(null);
    }
  };

  if (loading) {
    return <div className="py-12 text-center">Loading assessments...</div>;
  }

  if (!jobId || visibleAssessments.length === 0) {
    return (
      <div className="py-12 text-center text-gray-600">
        <p>No assessments available for this application yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Assigned Assessments</h1>

      <div className="space-y-4">
        {visibleAssessments.map((assessment) => (
          <Card key={assessment.id} className="p-6">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{assessment.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{assessment.description}</p>
              </div>
              <Button
                onClick={() => startAssessment(assessment.id)}
                loading={sessionStarting === assessment.id}
                disabled={sessionStarting === assessment.id}
              >
                {sessionStarting === assessment.id ? 'Starting...' : 'Start Assessment'}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <p className="text-gray-500">Duration</p>
                <p className="font-semibold">{assessment.durationMinutes} min</p>
              </div>
              <div>
                <p className="text-gray-500">Total Marks</p>
                <p className="font-semibold">{assessment.totalMarks}</p>
              </div>
              <div>
                <p className="text-gray-500">Passing</p>
                <p className="font-semibold">{assessment.passingMarksPercentage}</p>
              </div>
              <div>
                <p className="text-gray-500">Questions</p>
                <p className="font-semibold">{assessment.questions?.length || 0}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CandidateAssessmentsPage;
