import ForgotPassword from './components/ForgotPassword';

// ... diğer importlar ...

function App() {
  return (
    <Router>
      <Routes>
        {/* ... diğer route'lar ... */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
}

export default App; 