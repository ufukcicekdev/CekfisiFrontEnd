'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';

export default function ForgotPassword() {
  const [step, setStep] = useState('email'); // 'email' veya 'otp'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userType, setUserType] = useState('accountant');
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL'den userType parametresini al
  useEffect(() => {
    const type = searchParams?.get('type');
    setUserType(type || 'accountant');
  }, [searchParams]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/forgot-password/`, { 
        email,
        user_type: userType  // URL'den aldığımız type parametresini gönderiyoruz
      });
      setSuccess('Doğrulama kodu email adresinize gönderildi');
      setStep('otp');
    } catch (error: any) {
      // Hata mesajını göster
      if (error.response?.data?.error) {
        setError(error.response.data.error);
        // Eğer yanlış kullanıcı tipi hatası ise, 3 saniye sonra doğru sayfaya yönlendir
        if (error.response.data.error.includes('mali müşavir') || 
            error.response.data.error.includes('mükellef')) {
          setTimeout(() => {
            router.push(error.response.data.error.includes('mali müşavir') 
              ? '/auth/login/accountant' 
              : '/auth/login/client'
            );
          }, 3000);
        }
      } else {
        setError('Bir hata oluştu');
      }
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/verify-otp/`, {
        email,
        otp,
        new_password: newPassword,
      });
      setSuccess('Şifreniz başarıyla güncellendi');
      setTimeout(() => {
        router.push(userType === 'client' ? '/auth/login/client' : '/auth/login/accountant');
      }, 2000);
    } catch (error: any) {
      if (error.response?.data?.error) {
        if (Array.isArray(error.response.data.error)) {
          setError(error.response.data.error.join('\n'));
        } else {
          setError(error.response.data.error);
        }
      } else {
        setError('Bir hata oluştu');
      }
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
          {step === 'email' ? 'Şifremi Unuttum' : 'Şifre Sıfırlama'}
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && (
          <div className="mb-4 p-4 text-sm text-red-700 bg-red-100 rounded-lg">
            {error.split('\n').map((line, index) => (
              <div key={index} className="mb-1">
                • {line}
              </div>
            ))}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 text-sm text-green-700 bg-green-100 rounded-lg">
            {success}
          </div>
        )}

        {step === 'email' ? (
          <form className="space-y-6" onSubmit={handleEmailSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Email adresi
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Doğrulama Kodu Gönder
              </button>
            </div>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={handleOTPSubmit}>
            <div>
              <label htmlFor="otp" className="block text-sm font-medium leading-6 text-gray-900">
                Doğrulama Kodu
              </label>
              <div className="mt-2">
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <label htmlFor="new-password" className="block text-sm font-medium leading-6 text-gray-900">
                Yeni Şifre
              </label>
              <div className="mt-2">
                <input
                  id="new-password"
                  name="new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Şifreyi Güncelle
              </button>
            </div>
          </form>
        )}

        <p className="mt-10 text-center text-sm text-gray-500">
          <button
            onClick={() => router.push(userType === 'client' ? '/auth/login/client' : '/auth/login/accountant')}
            className="font-semibold leading-6 text-indigo-600 hover:text-indigo-500"
          >
            Giriş Sayfasına Dön
          </button>
        </p>
      </div>
    </div>
  );
} 