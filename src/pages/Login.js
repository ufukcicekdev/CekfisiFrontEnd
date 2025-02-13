import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 3 }}>
      {/* ... mevcut form elemanları ... */}
      
      {/* Şifre alanından sonra, Submit butonundan önce ekleyin */}
      <Box sx={{ mt: 1, mb: 2, textAlign: 'right' }}>
        <Link 
          to="/forgot-password" 
          style={{ 
            textDecoration: 'none', 
            color: theme.palette.primary.main 
          }}
        >
          Şifremi Unuttum
        </Link>
      </Box>
      
      {/* ... diğer elemanlar ... */}
    </Box>
  );
};

export default Login; 