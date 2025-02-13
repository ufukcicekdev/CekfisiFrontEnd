import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [step, setStep] = useState('email'); // 'email' veya 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/forgot-password/', { email });
      setSuccess('Doğrulama kodu email adresinize gönderildi');
      setStep('otp');
    } catch (error) {
      setError(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/verify-otp/', {
        email,
        otp,
        new_password: newPassword,
      });
      setSuccess('Şifreniz başarıyla güncellendi');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.error || 'Bir hata oluştu');
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {step === 'email' ? (
        <Box component="form" onSubmit={handleEmailSubmit}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Şifremi Unuttum
          </Typography>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            sx={{ mb: 2 }}
          >
            Doğrulama Kodu Gönder
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => navigate('/login')}
          >
            Giriş Sayfasına Dön
          </Button>
        </Box>
      ) : (
        <Box component="form" onSubmit={handleOTPSubmit}>
          <Typography variant="h5" sx={{ mb: 3 }}>
            Şifre Sıfırlama
          </Typography>
          <TextField
            fullWidth
            label="Doğrulama Kodu"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Yeni Şifre"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            sx={{ mb: 2 }}
          >
            Şifreyi Güncelle
          </Button>
          <Button
            fullWidth
            variant="text"
            onClick={() => setStep('email')}
          >
            Geri Dön
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ForgotPassword; 