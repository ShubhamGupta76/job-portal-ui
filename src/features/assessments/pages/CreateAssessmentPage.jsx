import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AssessmentBuilder from '../components/AssessmentBuilder';
import { assessmentService, jobService } from '../../../services';

const initialFormData = {
  title: '',
  description: '',
  jobId: '',
  durationMinutes: 60,
  totalMarks: 100,
  passingMarksPercentage: '60%',
  shuffleQuestions: true,
  allowBackNavigation: false,
  enableProctoring: true,
  detectCopyPaste: true,
  enforceFullScreen: true,
  requireWebcam: false,
  desktopOnly: true,
  sequentialQuestionsOnly: false,
  lockAnsweredQuestions: false,
  autoSubmitOnViolationLimit: true,
  fullscreenViolationLimit: 3,
  tabSwitchLimit: 3,
  offlineGraceSeconds: 60,
  maxAttempts: 1,
};

const CreateAssessmentPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(initialFormData);
  const [jobs, setJobs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [assessmentId, setAssessmentId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [questionSaving, setQuestionSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobService.getMyJobs();
      setJobs(response.data?.data || response.data || []);
    } catch (err) {
      console.error('Failed to fetch recruiter jobs:', err);
      setError('Unable to load recruiter jobs.');
    }
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const ensureAssessment = async () => {
    if (assessmentId) {
      return assessmentId;
    }

    const response = await assessmentService.createAssessment(toAssessmentPayload(formData));

    const createdId = response.data?.id || response.data?.data?.id;
    if (!createdId) {
      throw new Error('No assessment id returned');
    }
    setAssessmentId(createdId);
    return createdId;
  };

  const handleSaveAssessment = async () => {
    setSaving(true);
    setError('');
    try {
      if (!formData.title.trim() || !formData.jobId) {
        throw new Error('Assessment title and linked job are required.');
      }

      const id = await ensureAssessment();
      await assessmentService.updateAssessment(id, toAssessmentPayload(formData));
    } catch (err) {
      console.error('Failed to save assessment draft:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save assessment.');
    } finally {
      setSaving(false);
    }
  };

  const handlePublishAssessment = async () => {
    setPublishing(true);
    setError('');
    try {
      if (questions.length === 0) {
        throw new Error('Add at least one question before publishing.');
      }

      const id = await ensureAssessment();
      await assessmentService.updateAssessment(id, toAssessmentPayload(formData));
      await assessmentService.publishAssessment(id);
      navigate('/recruiter/assessments');
    } catch (err) {
      console.error('Failed to publish assessment:', err);
      setError(err.response?.data?.message || err.message || 'Failed to publish assessment.');
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveQuestion = async (question, editingQuestionId) => {
    setQuestionSaving(true);
    setError('');
    try {
      if (!question.title.trim()) {
        throw new Error('Question title is required.');
      }

      const id = await ensureAssessment();

      const payload = {
        ...question,
        marks: Number(question.marks),
        sequenceNumber: Number(question.sequenceNumber || questions.length + 1),
      };

      if (editingQuestionId) {
        const response = await assessmentService.updateQuestion(editingQuestionId, payload);
        setQuestions((prev) => prev.map((item) => (item.id === editingQuestionId ? response.data : item)));
      } else {
        const response = await assessmentService.addQuestion(id, payload);
        setQuestions((prev) => [...prev, response.data]);
      }
    } catch (err) {
      console.error('Failed to save question:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save question.');
      throw err;
    } finally {
      setQuestionSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await assessmentService.deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((question) => question.id !== questionId));
    } catch (err) {
      console.error('Failed to delete question:', err);
      setError(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  return (
    <AssessmentBuilder
      mode="create"
      formData={formData}
      onFormChange={handleFormChange}
      jobs={jobs}
      questions={questions}
      onSaveAssessment={handleSaveAssessment}
      onPublishAssessment={handlePublishAssessment}
      onDeleteQuestion={handleDeleteQuestion}
      onSaveQuestion={handleSaveQuestion}
      saving={saving}
      publishing={publishing}
      questionSaving={questionSaving}
      error={error}
    />
  );
};

export default CreateAssessmentPage;

const toAssessmentPayload = (formData) => ({
  ...formData,
  jobId: Number(formData.jobId),
  durationMinutes: Number(formData.durationMinutes),
  totalMarks: Number(formData.totalMarks),
  fullscreenViolationLimit: Number(formData.fullscreenViolationLimit || 3),
  tabSwitchLimit: Number(formData.tabSwitchLimit || 3),
  offlineGraceSeconds: Number(formData.offlineGraceSeconds || 60),
  maxAttempts: Number(formData.maxAttempts || 1),
});
