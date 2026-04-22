import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import { authService } from '../../../services/authService';
import { useAuthContext } from '../../../context/useAuthContext';
import { normalizeUserRole } from '../../../utils';

const OTP_LENGTH = 6;

const OtpVerificationPage = () => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const inputRefs = useRef([]);

  const email = location.state?.email || '';
  const otpValue = otp.join('');

  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  const focusInput = (index) => {
    inputRefs.current[index]?.focus();
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) {
      return;
    }

    const nextOtp = [...otp];
    const sanitizedValue = value.slice(-1);
    nextOtp[index] = sanitizedValue;
    setOtp(nextOtp);

    if (sanitizedValue && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }

    if (error) {
      setError('');
    }

    if (success) {
      setSuccess('');
    }
  };

  const handleKeyDown = (event, index) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      focusInput(index - 1);
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      focusInput(index - 1);
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      focusInput(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pastedOtp = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);

    if (!pastedOtp) {
      return;
    }

    const nextOtp = Array(OTP_LENGTH).fill('');
    pastedOtp.split('').forEach((digit, index) => {
      nextOtp[index] = digit;
    });

    setOtp(nextOtp);
    focusInput(Math.min(pastedOtp.length, OTP_LENGTH) - 1);
    setError('');
    setSuccess('');
  };

  const handleVerify = async (event) => {
    event.preventDefault();

    if (!email) {
      setError('We could not find the email for this verification request.');
      return;
    }

    if (otpValue.length !== OTP_LENGTH) {
      setError('Please enter the complete 6-digit OTP.');
      setSuccess('');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.verifyOtp(email, otpValue);
      const authData = response.data?.data || {};
      const token = authData.token;
      const normalizedRole = normalizeUserRole(authData.role);

      if (!token) {
        throw new Error('Verification succeeded but no token was returned.');
      }

      localStorage.setItem('authToken', token);

      if (normalizedRole) {
        localStorage.setItem('userRole', normalizedRole);
        login(authData, token, normalizedRole);
      }

      setSuccess(response.data?.message || 'OTP verified successfully.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError('We could not find the email for this verification request.');
      return;
    }

    setResendLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await authService.resendOtp(email);
      setSuccess(response.data?.message || 'A new OTP has been sent to your email.');
      setOtp(Array(OTP_LENGTH).fill(''));
      focusInput(0);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend OTP right now. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-purple-100 px-4 py-12">
      <Card className="w-full max-w-md border border-white/70 p-8 shadow-2xl shadow-purple-100/60">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-lg font-bold text-white shadow-lg shadow-purple-200">
            JP
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Verify OTP</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter the 6-digit code sent to your email address.
          </p>
          <p className="mt-3 rounded-full bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700">
            {email || 'No email found'}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div onPaste={handlePaste}>
            <label className="mb-3 block text-sm font-semibold text-gray-700">
              One-Time Password
            </label>
            <div className="grid grid-cols-6 gap-3">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(element) => {
                    inputRefs.current[index] = element;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(event) => handleOtpChange(event.target.value, index)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  className="h-14 px-0 text-center text-xl font-semibold tracking-[0.2em]"
                  aria-label={`OTP digit ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            disabled={loading || otpValue.length !== OTP_LENGTH}
            className="w-full"
          >
            Verify OTP
          </Button>

          <Button
            type="button"
            variant="outline"
            loading={resendLoading}
            disabled={resendLoading}
            onClick={handleResendOtp}
            className="w-full"
          >
            Resend OTP
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default OtpVerificationPage;
