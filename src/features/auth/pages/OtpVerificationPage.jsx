import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../../context/useAuthContext';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Badge from '../../../components/common/Badge';
import { authService } from '../../../services/authService';
import { normalizeUserRole } from '../../../utils';

const OtpVerificationPage = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [resendLoading, setResendLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuthContext();

  const email = location.state?.email || '';
  const isLogin = location.state?.isLogin || false;

  const handleOtpChange = useCallback((value, index) => {
    if (/[0-9]/.test(value) || value === '') {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto focus next
      if (value && index < 5) {
        document.getElementById(`otp-${index + 1}`)?.focus();
      }
    }
  }, [otp]);

  const handleKeyDown = useCallback((e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    } else if (e.key === 'Enter') {
      handleVerify();
    }
  }, [otp]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\s/g, '').slice(0, 6);
    const newOtp = pastedData.split('').map((char, i) => char || '');
    setOtp(newOtp);
  }, []);

  const handleVerify = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter full 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authService.verifyOtp(email, otpCode);
      const userData = response.data.data;
      const normalizedRole = normalizeUserRole(userData.role);
      login(userData, userData.token, normalizedRole);
      navigate(normalizedRole === 'recruiter' ? '/recruiter/dashboard' : '/jobs');
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await authService.resendOtp(email);
      setTimer(300);
      setError('');
    } catch (error) {
      setError('Cannot resend OTP. Try again later.');
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    if (!email) {
      navigate('/login');
      return;
    }
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fullOtp = otp.join('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">OTP</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h2>
          <p className="text-gray-600 mb-4">Enter the 6-digit code sent to <strong>{email}</strong></p>
          {timer > 0 ? (
            <Badge variant="warning">
              Time remaining: {formatTime(timer)}
            </Badge>
          ) : (
            <Badge variant="danger">
              OTP expired
            </Badge>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div 
          className="grid grid-cols-6 gap-3 mb-6"
          onPaste={handlePaste}
        >
          {otp.map((digit, index) => (
            <Input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(e.target.value, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className="text-center text-lg font-bold h-14"
              error={false}
              autoFocus={index === 0}
            />
          ))}
        </div>

        <Button 
          onClick={handleVerify}
          loading={loading}
          disabled={fullOtp.length !== 6 || timer === 0}
          className="w-full mb-6"
        >
          Verify OTP
        </Button>

        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Didn't receive the code?
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            loading={resendLoading}
            disabled={timer > 0}
            className="w-full"
          >
            {timer > 0 ? `Resend in ${formatTime(timer)}` : 'Resend OTP'}
          </Button>
          <p className="text-xs text-gray-500 mt-2">
            This will send a new code to your email
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <button 
            onClick={() => navigate(-1)}
            className="text-sm text-purple-600 hover:text-purple-700 font-semibold"
          >
            ← Back to login
          </button>
        </div>
      </Card>
    </div>
  );
};

export default OtpVerificationPage;
