import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { authService } from '../../../services/authService';
import { normalizeUserRole } from '../../../utils';
import { useAuthContext } from '../../../context/useAuthContext';

/**
 * Signup Page
 */
const SignupPage = () => {
  const [userType, setUserType] = useState('candidate'); // 'candidate' or 'recruiter'
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
  const { login } = useAuthContext();

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
        role: userType === 'recruiter' ? 'RECRUITER' : 'USER'
      };

      const response = await authService.signup(signupData);
      if (response.data.success) {
        navigate('/otp-verify', { state: { email: formData.email, isLogin: false } });
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">JP</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Join JobPortal</h1>
          <p className="text-gray-600 mt-2">Create your account to get started</p>
        </div>

        <Card className="p-8">
          {/* User Type Selection */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => {
                setUserType('candidate');
                setFormData((prev) => ({ ...prev, company: '' }));
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                userType === 'candidate'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🧑‍💼 I'm a Candidate
            </button>
            <button
              onClick={() => setUserType('recruiter')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                userType === 'recruiter'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              🏢 I'm a Recruiter
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.general}
              </div>
            )}

            {/* Name */}
            <Input
              label="Full Name"
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
              leftIcon="👤"
            />

            {/* Email */}
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              leftIcon="✉️"
            />

            {/* Company (only for recruiters) */}
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
                leftIcon="🏢"
              />
            )}

            {/* Password */}
            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              leftIcon="🔐"
              autoComplete="new-password"
            />

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Re-enter your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              required
              leftIcon="🔐"
              autoComplete="new-password"
            />

            {/* Terms */}
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                required
                className="w-4 h-4 rounded accent-purple-600 mt-1"
              />
              <span className="text-sm text-gray-600">
                I agree to the{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">
                  Privacy Policy
                </a>
              </span>
            </label>

            <Button type="submit" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-600 hover:text-purple-700 font-semibold">
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
