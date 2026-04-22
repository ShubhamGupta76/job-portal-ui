import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { assessmentService } from '../../../services/assessmentService';
import RecruiterLayout from '../../recruiter/components/RecruiterLayout';
import RecruiterNavbar from '../../recruiter/components/RecruiterNavbar';
import { useAuthContext } from '../../../context/useAuthContext';

const EditAssessmentPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAssessment();
  }, [assessmentId]);

  const loadAssessment = async () => {
    try {
      setLoading(true);
      const response = await assessmentService.getAssessment(assessmentId);
      const assessment = response.data;
      setFormData({
        title: assessment.title || '',
        description: assessment.description || '',
        durationMinutes: assessment.durationMinutes || 60,
        totalMarks: assessment.totalMarks || 100,
        passingMarksPercentage: assessment.passingMarksPercentage || '60%',
        shuffleQuestions: assessment.shuffleQuestions || false,
        allowBackNavigation: assessment.allowBackNavigation || false,
        enableProctoring: assessment.enableProctoring || true,
        detectCopyPaste: assessment.detectCopyPaste || true,
        enforceFullScreen: assessment.enforceFullScreen || false,
      });
      setQuestions(assessment.questions || []);
    } catch (err) {
      setError('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      await assessmentService.updateAssessment(assessmentId, formData);
      alert('Assessment updated successfully!');
      navigate('/recruiter/assessments');
    } catch (err) {
      setError('Failed to update assessment');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    try {
      await assessmentService.publishAssessment(assessmentId);
      alert('Assessment published!');
      navigate('/recruiter/assessments');
    } catch (err) {
      setError('Failed to publish');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <RecruiterLayout>
      <RecruiterNavbar title="Edit Assessment" subtitle="Update your coding test" />
      <div className="space-y-6">
        {error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        <div className="bg-white p-8 rounded-lg shadow">
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium mb-2">Title</label>
              <input
                name="title"
                value={formData.title || ''}
                onChange={handleFormChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Duration (min)</label>
              <input
                type="number"
                name="durationMinutes"
                value={formData.durationMinutes || ''}
                onChange={handleFormChange}
                className="w-full p-3 border rounded-lg"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleFormChange}
                rows="3"
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="shuffleQuestions"
                checked={formData.shuffleQuestions || false}
                onChange={handleFormChange}
              />
              <span>Shuffle Questions</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="enableProctoring"
                checked={formData.enableProctoring || false}
                onChange={handleFormChange}
              />
              <span>Proctoring</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="enforceFullScreen"
                checked={formData.enforceFullScreen || false}
                onChange={handleFormChange}
              />
              <span>Full Screen</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleUpdate}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update Assessment'}
            </button>
            <button
              onClick={handlePublish}
              className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700"
            >
              Publish
            </button>
          </div>

          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Questions ({questions.length})</h3>
            <div className="grid gap-4">
              {questions.map((q) => (
                <div key={q.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <div className="font-medium">{q.title}</div>
                    <div className="text-sm text-gray-500">{q.type} - {q.marks} marks</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default EditAssessmentPage;

