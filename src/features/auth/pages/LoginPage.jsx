import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { authService } from '../../../services/authService';
import { useAuthContext } from '../../../context/useAuthContext';

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
    const email = formData.email.trim();
    const password = formData.password.trim();

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.toLowerCase() === email.toLowerCase()) {
      newErrors.password = 'Enter your account password, not your email address';
    } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(password)) {
      newErrors.password = 'This looks like an email address. Please enter your password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const email = formData.email.trim();
      const response = await authService.sendOtpForLogin(email, formData.password);
      if (response.data.success) {
        navigate('/otp-verify', { state: { email, isLogin: true } });
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
    <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto grid max-w-[1350px] gap-8 lg:grid-cols-[minmax(0,1.1fr)_520px]">
        <div className="rounded-[36px] bg-slate-950 px-8 py-10 text-white shadow-[0_40px_90px_rgba(15,23,42,0.22)] sm:px-12 sm:py-14">
          <p className="text-sm uppercase tracking-[0.24em] text-blue-200">Welcome back</p>
          <h1 className="mt-5 max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Sign in to continue your hiring workflow without changing the backend flow.
          </h1>
          <p className="mt-5 max-w-xl text-slate-300">
            Candidates can track opportunities and recruiters can return to their hiring workspace. Your current OTP-based backend process remains unchanged.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ['Live jobs', 'Search active openings quickly.'],
              ['Assessments', 'Move from shortlist to test interface.'],
              ['Dashboards', 'Keep applications and pipeline visible.'],
            ].map(([title, body]) => (
              <div key={title} className="rounded-[24px] border border-white/10 bg-white/6 p-4">
                <p className="text-lg font-semibold text-white">{title}</p>
                <p className="mt-2 text-sm text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </div>

        <Card className="p-8 sm:p-10">
          <div className="mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-lg font-bold text-white shadow-[0_18px_35px_rgba(14,165,233,0.26)]">
              JP
            </div>
            <h2 className="mt-6 text-3xl font-semibold text-slate-950">Login to JobPortal</h2>
            <p className="mt-2 text-sm text-slate-500">Use your registered email and password to receive the OTP verification code.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errors.general && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
              autoComplete="username"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              autoComplete="current-password"
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-500">
                <input type="checkbox" className="h-4 w-4 rounded accent-blue-600" />
                <span>Remember me</span>
              </label>
              <span className="font-medium text-blue-700">OTP-secured login</span>
            </div>

            <Button type="submit" loading={loading} className="w-full">
              Continue to OTP
            </Button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="font-semibold text-blue-700 hover:text-blue-800">
                Sign up here
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
