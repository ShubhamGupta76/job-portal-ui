import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { authService } from '../../../services/authService';

const SignupPage = () => {
  const [userType, setUserType] = useState('candidate');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name] || errors.general) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
        general: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (userType === 'recruiter' && !formData.company) {
      newErrors.company = 'Company name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const signupData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone || '',
        role: userType === 'recruiter' ? 'RECRUITER' : 'USER',
      };

      const response = await authService.signup(signupData);
      if (response.data.success) {
        navigate('/otp-verify', { state: { email: formData.email } });
      } else {
        setErrors({ general: response.data.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Signup error:', error);
      const responseData = error.response?.data;
      const validationErrors = responseData?.data;

      if (validationErrors && typeof validationErrors === 'object' && !Array.isArray(validationErrors)) {
        setErrors({
          ...validationErrors,
          general: responseData?.message || 'Registration failed. Please check the form.',
        });
      } else {
        setErrors({ general: responseData?.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1380px] gap-8 lg:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="overflow-hidden p-0">
          <div className="bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-400 px-8 py-10 text-white">
            <p className="text-sm uppercase tracking-[0.22em] text-blue-100">Create account</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Join as a candidate or recruiter.</h1>
            <p className="mt-4 text-sm leading-7 text-blue-50">
              This screen still submits to your current signup backend. The redesign only improves layout, hierarchy, and role selection.
            </p>
          </div>
          <div className="grid gap-4 p-8">
            <div className="rounded-[22px] bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Candidate account</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Browse jobs, save roles, upload resume, and take tests.</p>
            </div>
            <div className="rounded-[22px] bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Recruiter account</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">Post jobs, review applicants, and manage assessments.</p>
            </div>
          </div>
        </Card>

        <Card className="p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-slate-950">Account setup</h2>
            <p className="mt-2 text-sm text-slate-500">Choose your role and complete the details below.</p>
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setUserType('candidate');
                setFormData((prev) => ({ ...prev, company: '' }));
              }}
              className={`rounded-[22px] border px-4 py-4 text-left transition ${
                userType === 'candidate'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-[0_14px_32px_rgba(37,99,235,0.12)]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
              }`}
            >
              <p className="font-semibold">Candidate</p>
              <p className="mt-1 text-sm">Apply, track, and grow.</p>
            </button>
            <button
              type="button"
              onClick={() => setUserType('recruiter')}
              className={`rounded-[22px] border px-4 py-4 text-left transition ${
                userType === 'recruiter'
                  ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-[0_14px_32px_rgba(37,99,235,0.12)]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200'
              }`}
            >
              <p className="font-semibold">Recruiter</p>
              <p className="mt-1 text-sm">Hire, filter, and assess.</p>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            {userType === 'recruiter' && (
              <Input
                label="Company Name"
                type="text"
                name="company"
                placeholder="Your company name"
                value={formData.company}
                onChange={handleChange}
                error={errors.company}
                required
              />
            )}

            <div className="grid gap-5 md:grid-cols-2">
              <Input
                label="Password"
                type="password"
                name="password"
                placeholder="Create a strong password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
                autoComplete="new-password"
              />

              <Input
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
              <input
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded accent-blue-600"
              />
              <span className="text-sm text-slate-600">
                I agree to the platform terms and privacy policy.
              </span>
            </label>

            <Button type="submit" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">
                Sign in here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SignupPage;
