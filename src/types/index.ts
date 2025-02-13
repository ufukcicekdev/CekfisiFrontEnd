interface User {
  id: number;
  email: string;
  userType: 'accountant' | 'client' | 'staff';
  // ...
}

interface Document {
  id: number;
  documentType: 'invoice' | 'receipt' | 'other';
  file: string;
  date: string;
  amount: number;
  vatRate: number;
  status: 'pending' | 'processed' | 'rejected';
  // ...
} 