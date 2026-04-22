import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { assessmentService } from '../../../services/assessmentService';
import { jobService } from '../../../services/jobService';
import RecruiterLayout from '../../recruiter/components/RecruiterLayout';
import RecruiterNavbar from '../../recruiter/components/RecruiterNavbar';

const CreateAssessmentPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
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
    enforceFullScreen: true
  });

  const [jobs, setJobs] = useState([]);
  const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({
      type: 'MCQ',
      title: '',
      description: '',
      marks: 5,
      difficulty: 'MEDIUM',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correctAnswer: 'option1',
      explanation: '',
      codeTemplate: '',
      programmingLanguage: 'PYTHON',
      testCases: ''
    });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobService.getMyJobs();
      setJobs(response.data.data || response.data || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setNewQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addQuestion = () => {
    if (!newQuestion.title.trim()) {
      alert('Please enter question title');
      return;
    }

    const questionWithSequence = {
      ...newQuestion,
      sequenceNumber: questions.length + 1
    };

    setQuestions([...questions, questionWithSequence]);
    setNewQuestion({
      type: 'MCQ',
      title: '',
      description: '',
      marks: 5,
      difficulty: 'MEDIUM',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correctAnswer: 'option1',
      explanation: '',
      codeTemplate: '',
      programmingLanguage: 'PYTHON',
      testCases: ''
    });
  };

  const removeQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter assessment title');
      return;
    }

    if (!formData.jobId) {
      alert('Please select a job');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    setLoading(true);
    try {
      // Create assessment
      const assessmentResponse = await assessmentService.createAssessment(formData);
      console.log('Assessment created:', assessmentResponse.data);
      const assessmentId = assessmentResponse.data.id || assessmentResponse.data.data?.id;
      if (!assessmentId) {
        throw new Error('No assessment ID returned');
      }

      // Add questions
      for (const question of questions) {
        await assessmentService.addQuestion(assessmentId, question);
      }

      // Publish assessment
      await assessmentService.publishAssessment(assessmentId);

      alert('Assessment created and published successfully!');
      navigate('/recruiter/assessments');
    } catch (error) {
      console.error('Failed to create assessment:', error);
      alert('Failed to create assessment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <RecruiterLayout>
      <div className="space-y-6">
        <RecruiterNavbar
          title="Create Assessment"
          subtitle="Build a new coding test or MCQ assessment"
        />

        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Assessment Details Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Assessment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Python Advanced Test"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Link to Job</label>
                  <select
                    name="jobId"
                    value={formData.jobId}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select a job to link</option>
                    {jobs.map(job => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="Describe the assessment..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    name="durationMinutes"
                    value={formData.durationMinutes}
                    onChange={handleFormChange}
                    min="5"
                    max="480"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
                  <input
                    type="number"
                    name="totalMarks"
                    value={formData.totalMarks}
                    onChange={handleFormChange}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passing Percentage</label>
                  <input
                    type="text"
                    name="passingMarksPercentage"
                    value={formData.passingMarksPercentage}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="e.g., 60%"
                  />
                </div>
              </div>
            </div>

            {/* Security & Rules Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Security & Rules</h3>
              <div className="space-y-3">
                {[
                  { name: 'shuffleQuestions', label: 'Shuffle questions for each candidate' },
                  { name: 'allowBackNavigation', label: 'Allow candidates to go back and change answers' },
                  { name: 'enableProctoring', label: 'Enable proctoring (monitor for suspicious activity)' },
                  { name: 'detectCopyPaste', label: 'Detect and block copy-paste operations' },
                  { name: 'enforceFullScreen', label: 'Enforce full-screen mode during test' }
                ].map(({ name, label }) => (
                  <label key={name} className="flex items-center">
                    <input
                      type="checkbox"
                      name={name}
                      checked={formData[name]}
                      onChange={handleFormChange}
                      className="mr-3 h-4 w-4"
                    />
                    <span className="text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Questions Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Questions ({questions.length})</h3>

              {/* Add Question Form */}
              <div className="bg-gray-50 p-6 rounded-lg mb-6 border-2 border-dashed border-gray-300">
                <h4 className="font-semibold mb-4">Add New Question</h4>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                    <select
                      name="type"
                      value={newQuestion.type}
                      onChange={handleQuestionChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                    >
                      <option value="MCQ">MCQ (Multiple Choice)</option>
                      <option value="CODING">Coding Problem</option>
                      <option value="DESCRIPTIVE">Descriptive (Essay)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
                    <input
                      type="number"
                      name="marks"
                      value={newQuestion.marks}
                      onChange={handleQuestionChange}
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <select
                      name="difficulty"
                      value={newQuestion.difficulty}
                      onChange={handleQuestionChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={newQuestion.title}
                      onChange={handleQuestionChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                      placeholder="Question title"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={newQuestion.description}
                      onChange={handleQuestionChange}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                      placeholder="Full question description"
                    />
                  </div>
                </div>

                {/* MCQ Specific Fields */}
                {newQuestion.type === 'MCQ' && (
                  <div className="space-y-3 mb-4">
                    {['option1', 'option2', 'option3', 'option4'].map((opt) => (
                      <input
                        key={opt}
                        type="text"
                        name={opt}
                        value={newQuestion[opt]}
                        onChange={handleQuestionChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded"
                        placeholder={`Option ${opt.slice(-1)}`}
                      />
                    ))}
                    <select
                      name="correctAnswer"
                      value={newQuestion.correctAnswer}
                      onChange={handleQuestionChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded bg-blue-50"
                    >
                      <option value="option1">Correct Answer: Option 1</option>
                      <option value="option2">Correct Answer: Option 2</option>
                      <option value="option3">Correct Answer: Option 3</option>
                      <option value="option4">Correct Answer: Option 4</option>
                    </select>
                    <textarea
                      name="explanation"
                      value={newQuestion.explanation}
                      onChange={handleQuestionChange}
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                      placeholder="Explanation (shown after test)"
                    />
                  </div>
                )}

                {/* Coding Specific Fields */}
                {newQuestion.type === 'CODING' && (
                  <div className="space-y-3 mb-4">
                    <select
                      name="programmingLanguage"
                      value={newQuestion.programmingLanguage}
                      onChange={handleQuestionChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                    >
                      <option value="PYTHON">Python</option>
                      <option value="JAVA">Java</option>
                      <option value="JAVASCRIPT">JavaScript</option>
                      <option value="CPP">C++</option>
                    </select>
                    <textarea
                      name="codeTemplate"
                      value={newQuestion.codeTemplate}
                      onChange={handleQuestionChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded font-mono text-sm bg-gray-900 text-green-400"
                      placeholder="Code template (optional)"
                    />
                    <textarea
                      name="testCases"
                      value={newQuestion.testCases}
                      onChange={handleQuestionChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded"
                      placeholder="Test cases (format: input => expected_output)"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                >
                  Add Question
                </button>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-100 rounded">
                    <div>
                      <p className="font-medium">Q{idx + 1}: {q.title}</p>
                      <p className="text-sm text-gray-600">{q.type} - {q.marks} marks - {q.difficulty}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQuestion(idx)}
                      className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating Assessment...' : 'Create and Publish Assessment'}
            </button>
          </form>
        </div>
      </div>
    </RecruiterLayout>
  );
};

export default CreateAssessmentPage;
