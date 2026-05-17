import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import AssessmentBuilder from '../components/AssessmentBuilder';
import { assessmentService, jobService } from '../../../services';

const EditAssessmentPage = () => {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    jobId: '',
    durationMinutes: 60,
    totalMarks: 100,
    passingMarksPercentage: '60%',
    shuffleQuestions: false,
    allowBackNavigation: false,
    enableProctoring: true,
    detectCopyPaste: true,
    enforceFullScreen: false,
    requireWebcam: false,
    desktopOnly: true,
    sequentialQuestionsOnly: false,
    lockAnsweredQuestions: false,
    autoSubmitOnViolationLimit: true,
    fullscreenViolationLimit: 3,
    tabSwitchLimit: 3,
    offlineGraceSeconds: 60,
    maxAttempts: 1,
  });
  const [jobs, setJobs] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [questionSaving, setQuestionSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPage();
  }, [assessmentId]);

  const loadPage = async () => {
    setLoading(true);
    setError('');
    try {
      const [assessmentRes, jobsRes] = await Promise.all([
        assessmentService.getAssessment(assessmentId),
        jobService.getMyJobs(),
      ]);

      const assessment = assessmentRes.data;
      setFormData({
        title: assessment.title || '',
        description: assessment.description || '',
        jobId: assessment.jobId || '',
        durationMinutes: assessment.durationMinutes || 60,
        totalMarks: assessment.totalMarks || 100,
        passingMarksPercentage: assessment.passingMarksPercentage || '60%',
        shuffleQuestions: Boolean(assessment.shuffleQuestions),
        allowBackNavigation: Boolean(assessment.allowBackNavigation),
        enableProctoring: Boolean(assessment.enableProctoring),
        detectCopyPaste: Boolean(assessment.detectCopyPaste),
        enforceFullScreen: Boolean(assessment.enforceFullScreen),
        requireWebcam: Boolean(assessment.requireWebcam),
        desktopOnly: assessment.desktopOnly !== false,
        sequentialQuestionsOnly: Boolean(assessment.sequentialQuestionsOnly),
        lockAnsweredQuestions: Boolean(assessment.lockAnsweredQuestions),
        autoSubmitOnViolationLimit: assessment.autoSubmitOnViolationLimit !== false,
        fullscreenViolationLimit: assessment.fullscreenViolationLimit || 3,
        tabSwitchLimit: assessment.tabSwitchLimit || 3,
        offlineGraceSeconds: assessment.offlineGraceSeconds || 60,
        maxAttempts: assessment.maxAttempts || 1,
      });
      setQuestions(assessment.questions || []);
      setJobs(jobsRes.data?.data || jobsRes.data || []);
    } catch (err) {
      console.error('Failed to load assessment editor:', err);
      setError(err.response?.data?.message || 'Failed to load assessment.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveAssessment = async () => {
    setSaving(true);
    setError('');
    try {
      await assessmentService.updateAssessment(assessmentId, toAssessmentPayload(formData));
    } catch (err) {
      console.error('Failed to update assessment:', err);
      setError(err.response?.data?.message || 'Failed to update assessment.');
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

      await assessmentService.updateAssessment(assessmentId, toAssessmentPayload(formData));
      await assessmentService.publishAssessment(assessmentId);
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
      const payload = {
        ...question,
        marks: Number(question.marks),
        sequenceNumber: Number(question.sequenceNumber || questions.length + 1),
        assessment: { id: Number(assessmentId) },
      };

      if (editingQuestionId) {
        const response = await assessmentService.updateQuestion(editingQuestionId, payload);
        setQuestions((prev) => prev.map((item) => (item.id === editingQuestionId ? response.data : item)));
      } else {
        const response = await assessmentService.addQuestion(assessmentId, payload);
        setQuestions((prev) => [...prev, response.data]);
      }
    } catch (err) {
      console.error('Failed to save question:', err);
      setError(err.response?.data?.message || 'Failed to save question.');
      throw err;
    } finally {
      setQuestionSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await assessmentService.deleteQuestion(questionId);
      setQuestions((prev) => prev.filter((item) => item.id !== questionId));
    } catch (err) {
      console.error('Failed to delete question:', err);
      setError(err.response?.data?.message || 'Failed to delete question.');
    }
  };

  if (loading) {
    return <div className="rounded-[28px] bg-white px-6 py-10 text-sm text-slate-500 shadow-sm">Loading assessment builder...</div>;
  }

  return (
    <AssessmentBuilder
      mode="edit"
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

export default EditAssessmentPage;

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
