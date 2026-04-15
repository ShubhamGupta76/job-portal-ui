import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { authService } from '../../../services/authService';
import { normalizeUserRole } from '../../../utils';
import { useAuthContext } from '../../../context/useAuthContext';

/**
 * Login Page
 */
const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/ .test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authService.sendOtpForLogin(formData.email, formData.password);
      if (response.data.success) {
        navigate('/otp-verify', { state: { email: formData.email, isLogin: true } });
      } else {
        setErrors({ general: response.data.message || 'Login failed. Please check credentials.' });
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: error.response?.data?.message || 'Invalid credentials. Please check email and password.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 flex items-center justify-center px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full items-center">
        {/* Left side - Features */}
        <div className="hidden md:block text-white">
          <h1 className="text-4xl font-bold mb-6">Welcome Back!</h1>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="text-2xl">🎯</div>
              <div>
                <h3 className="font-bold text-lg">Find Your Dream Job</h3>
                <p className="text-purple-100">Browse thousands of opportunities</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">🚀</div>
              <div>
                <h3 className="font-bold text-lg">Grow Your Career</h3>
                <p className="text-purple-100">Work with leading companies</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="text-2xl">💼</div>
              <div>
                <h3 className="font-bold text-lg">Build Your Skills</h3>
                <p className="text-purple-100">Learn from industry experts</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <Card className="p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">JP</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Login to JobPortal</h2>
            <p className="text-gray-600 text-sm mt-2">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errors.general && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errors.general}
              </div>
            )}

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

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
              leftIcon="🔐"
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-purple-600" />
                <span className="text-gray-600">Remember me</span>
              </label>
              <a href="#" className="text-purple-600 hover:text-purple-700 font-semibold">
                Forgot password?
              </a>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Don't have an account?{' '}
              <Link to="/signup" className="text-purple-600 hover:text-purple-700 font-semibold">
                Sign up here
              </Link>
            </p>
          </div>

          {/* Login as Recruiter */}
          <div className="mt-4">
            <Link to="/signup" className="block text-center text-sm text-gray-600 hover:text-purple-600 font-semibold">
              Need a recruiter account? Create one here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
