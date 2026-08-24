import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  FormHelperText,
  CircularProgress,
  Alert,
  Chip,
  Paper,
  InputAdornment,
  Avatar,
  RadioGroup,
  Radio,
  Fade,
  Zoom,
  Slide,
  useTheme,
  useMediaQuery,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Card,
  CardContent,
  CardHeader,
  alpha,
  LinearProgress
} from '@mui/material';
import { API_BASE_URL } from "../../config/api";
import type { SelectChangeEvent } from '@mui/material';
import {
  Close as CloseIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  Badge as BadgeIcon,
  LocationOn as LocationIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Key as KeyIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  WaterDrop as WaterDropIcon,
  Bolt as BoltIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Description as DescriptionIcon,
  Note as NoteIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Business as BusinessIcon,
  Assignment as AssignmentIcon,
  LocalGasStation as LocalGasStationIcon,
  Restaurant as RestaurantIcon,
  DirectionsCar as DirectionsCarIcon,
  Build as BuildIcon,
  Checkroom as CheckroomIcon,
  Wifi as WifiIcon,
  MoreHoriz as MoreHorizIcon,
  School as SchoolIcon,
  ReceiptLong as ReceiptLongIcon,
  Add as AddIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';

// Types
interface Staff {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  is_active: boolean;
  password?: string;
}

interface SalaryData {
  staff_id: number;
  staff_name: string;
  service_type: 'water' | 'inverter' | 'both';
  salary_month: string;
  amount: string;
  bonus: string;
  deductions: string;
  payment_method: string;
  transaction_id: string;
  funding_source: 'business_income' | 'raj_communication' | 'owner_cash' | 'other_borrowing';
  funding_amount: string;
  funding_notes: string;
  notes: string;
}

interface ExpenseData {
  staff_id: number;
  staff_name: string;
  service_type: 'water' | 'inverter' | 'both';
  expense_type: string;
  amount: string;
  description: string;
  expense_date: string;
  payment_method: string;
  receipt_number: string;
  notes: string;
}

interface StaffFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit' | 'salary' | 'expense';
  data: Staff | null;
  staffList?: Staff[];
  onSuccess: () => void;
  showSnackbar: (message: string, severity: 'success' | 'error') => void;
}

// Responsive Styled Components
const GradientDialogTitle = styled(DialogTitle)<{ mode?: string }>(({ theme, mode }) => ({
  background: mode === 'expense' 
    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    : mode === 'salary'
      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
    borderRadius: '50%'
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 300,
    height: 300,
    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
    borderRadius: '50%'
  }
}));

const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  [theme.breakpoints.up('sm')]: {
    borderRadius: 20,
  },
  boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1)',
  transition: 'all 0.3s ease',
  border: '1px solid rgba(102, 126, 234, 0.1)',
  '&:hover': {
    boxShadow: '0 20px 40px -10px rgba(102,126,234,0.3)',
    transform: 'translateY(-5px)',
    borderColor: alpha('#667eea', 0.3)
  }
}));

const SummaryCard = styled(Paper)<{ mode?: string }>(({ theme, mode }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  background: mode === 'expense' 
    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    : mode === 'salary'
      ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  borderRadius: 12,
  [theme.breakpoints.up('sm')]: {
    borderRadius: 16,
  },
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(3),
  },
  transition: 'all 0.3s ease',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -30,
    right: -30,
    width: 150,
    height: 150,
    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
    borderRadius: '50%'
  }
}));

const NetAmountCard = styled(Paper)<{ positive?: boolean }>(({ theme, positive }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  background: positive 
    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  color: 'white',
  borderRadius: 12,
  [theme.breakpoints.up('sm')]: {
    borderRadius: 16,
  },
  display: 'flex',
  flexDirection: 'column',
  [theme.breakpoints.up('sm')]: {
    flexDirection: 'row',
  },
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  [theme.breakpoints.up('sm')]: {
    alignItems: 'center',
  },
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(3),
  },
  boxShadow: positive 
    ? '0 10px 30px -5px rgba(16,185,129,0.5)'
    : '0 10px 30px -5px rgba(239,68,68,0.5)',
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': { transform: 'scale(1)' },
    '50%': { transform: 'scale(1.02)' },
    '100%': { transform: 'scale(1)' }
  }
}));

const FormSection = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(3),
  },
  background: '#FFFFFF',
  borderRadius: 12,
  [theme.breakpoints.up('sm')]: {
    borderRadius: 16,
  },
  marginBottom: theme.spacing(2),
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(3),
  },
  border: '1px solid rgba(102, 126, 234, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: alpha('#667eea', 0.3),
    boxShadow: '0 10px 30px -10px rgba(102,126,234,0.2)'
  }
}));

const SectionTitle = styled(Typography)<{ color?: string }>(({ theme, color }) => ({
  fontSize: '1rem',
  [theme.breakpoints.up('sm')]: {
    fontSize: '1.1rem',
  },
  fontWeight: 700,
  marginBottom: theme.spacing(1.5),
  [theme.breakpoints.up('sm')]: {
    marginBottom: theme.spacing(2),
  },
  color: color || theme.palette.primary.main,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '& svg': {
    fontSize: '1.2rem',
    [theme.breakpoints.up('sm')]: {
      fontSize: '1.3rem',
    }
  }
}));

const AnimatedAvatar = styled(motion(Avatar))({
  width: 50,
  height: 50,
  fontSize: 20,
  ['@media (min-width:600px)']: {
    width: 70,
    height: 70,
    fontSize: 28,
  },
  fontWeight: 700,
  border: '3px solid rgba(255,255,255,0.3)',
  boxShadow: '0 10px 20px -5px rgba(0,0,0,0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1) rotate(5deg)',
    borderColor: 'white'
  }
});

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
    [theme.breakpoints.up('sm')]: {
      borderRadius: 12,
    },
    transition: 'all 0.2s ease',
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
      }
    },
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderWidth: 2,
        borderColor: theme.palette.primary.main,
      }
    }
  }
}));

const StyledSelect = styled(Select)(({ theme }) => ({
  borderRadius: 10,
  [theme.breakpoints.up('sm')]: {
    borderRadius: 12,
  },
  transition: 'all 0.2s ease',
  '&:hover': {
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    }
  }
}));

const ActionButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'mode'
})<{ mode?: string }>(({ theme, variant, mode }) => ({
  borderRadius: 10,
  [theme.breakpoints.up('sm')]: {
    borderRadius: 12,
  },
  padding: theme.spacing(1, 3),
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(1.2, 4),
  },
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '0.9rem',
  [theme.breakpoints.up('sm')]: {
    fontSize: '1rem',
  },
  transition: 'all 0.3s ease',
  ...(variant === 'contained' && {
    background: mode === 'expense' 
      ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
      : mode === 'salary'
        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    boxShadow: mode === 'expense'
      ? '0 8px 20px -5px rgba(245,158,11,0.5)'
      : mode === 'salary'
        ? '0 8px 20px -5px rgba(16,185,129,0.5)'
        : '0 8px 20px -5px rgba(102,126,234,0.5)',
    '&:hover': {
      transform: 'translateY(-3px)',
      boxShadow: mode === 'expense'
        ? '0 15px 30px -5px rgba(245,158,11,0.7)'
        : mode === 'salary'
          ? '0 15px 30px -5px rgba(16,185,129,0.7)'
          : '0 15px 30px -5px rgba(102,126,234,0.7)',
    }
  }),
  ...(variant === 'outlined' && {
    borderColor: '#E5E7EB',
    color: '#4B5563',
    '&:hover': {
      borderColor: '#9CA3AF',
      background: '#F9FAFB',
      transform: 'translateY(-2px)'
    }
  })
}));

const StaffChip = styled(Chip, {
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active?: boolean }>(({ theme, active }) => ({
  borderRadius: 8,
  [theme.breakpoints.up('sm')]: {
    borderRadius: 10,
  },
  fontWeight: 600,
  fontSize: '0.75rem',
  [theme.breakpoints.up('sm')]: {
    fontSize: '0.8125rem',
  },
  background: active 
    ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
    : 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
  color: 'white',
  '& .MuiChip-icon': {
    color: 'white'
  }
}));

const StepIcon = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'active'
})<{ active?: boolean }>(({ theme, active }) => ({
  width: 28,
  height: 28,
  [theme.breakpoints.up('sm')]: {
    width: 36,
    height: 36,
  },
  background: active 
    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    : '#E5E7EB',
  color: active ? 'white' : '#9CA3AF',
  transition: 'all 0.3s ease'
}));

const StaffFormModal: React.FC<StaffFormModalProps> = ({
  open,
  onClose,
  mode,
  data,
  staffList = [],
  onSuccess,
  showSnackbar
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<number>(data?.id || 0);
  const [activeStep, setActiveStep] = useState(0);
  
  // Staff form state
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'staff',
    phone: '',
    address: '',
    department: '',
    position: '',
    is_active: true
  });

  // Helper function to get current month in YYYY-MM format
  const getCurrentMonth = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    return `${year}-${month}`;
  };

  // Helper function to get current date in YYYY-MM-DD format
  const getCurrentDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  // Salary form state - initialize with current month
  const [salaryForm, setSalaryForm] = useState<SalaryData>({
    staff_id: data?.id || 0,
    staff_name: data?.name || '',
    service_type: 'water',
    salary_month: getCurrentMonth(), // This will always be current month
    amount: '',
    bonus: '0',
    deductions: '0',
    payment_method: 'bank_transfer',
    transaction_id: '',
    funding_source: 'raj_communication',
    funding_amount: '0',
    funding_notes: '',
    notes: ''
  });

  // Expense form state
  const [expenseForm, setExpenseForm] = useState<ExpenseData>({
    staff_id: data?.id || 0,
    staff_name: data?.name || '',
    service_type: 'water',
    expense_type: 'petrol',
    amount: '',
    description: '',
    expense_date: getCurrentDate(),
    payment_method: 'cash',
    receipt_number: '',
    notes: ''
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form touched state
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      const currentMonth = getCurrentMonth();
      const currentDate = getCurrentDate();
      
      if (mode === 'salary') {
        // Always set to current month when opening salary modal
        setSalaryForm({
          staff_id: data?.id || 0,
          staff_name: data?.name || '',
          service_type: 'water',
          salary_month: currentMonth, // Force current month
          amount: '',
          bonus: '0',
          deductions: '0',
          payment_method: 'bank_transfer',
          transaction_id: `TXN${Date.now()}`,
          funding_source: 'raj_communication',
          funding_amount: '0',
          funding_notes: '',
          notes: ''
        });
        
        if (data) {
          setSelectedStaffId(data.id);
        }
      } else if (mode === 'expense') {
        setExpenseForm({
          staff_id: data?.id || 0,
          staff_name: data?.name || '',
          service_type: 'water',
          expense_type: 'petrol',
          amount: '',
          description: '',
          expense_date: currentDate,
          payment_method: 'cash',
          receipt_number: '',
          notes: ''
        });
        
        if (data) {
          setSelectedStaffId(data.id);
        }
      } else if (mode === 'edit' && data) {
        setStaffForm({
          name: data.name || '',
          email: data.email || '',
          password: '',
          confirmPassword: '',
          role: data.role || 'staff',
          phone: data.phone || '',
          address: data.address || '',
          department: data.department || '',
          position: data.position || '',
          is_active: data.is_active
        });
      } else if (mode === 'add') {
        setStaffForm({
          name: '',
          email: '',
          password: '',
          confirmPassword: '',
          role: 'staff',
          phone: '',
          address: '',
          department: '',
          position: '',
          is_active: true
        });
      }
      
      setError(null);
      setErrors({});
      setTouched({});
      setActiveStep(0);
    }
  }, [open, mode, data]);

  const handleStaffChange = (staffId: number) => {
    setSelectedStaffId(staffId);
    const selectedStaff = staffList.find(s => s.id === staffId);
    if (selectedStaff) {
      if (mode === 'salary') {
        setSalaryForm({
          ...salaryForm,
          staff_id: selectedStaff.id,
          staff_name: selectedStaff.name,
          salary_month: getCurrentMonth(), // Reset to current month when staff changes
          transaction_id: `TXN${Date.now()}`
        });
      } else if (mode === 'expense') {
        setExpenseForm({
          ...expenseForm,
          staff_id: selectedStaff.id,
          staff_name: selectedStaff.name,
          expense_date: getCurrentDate() // Reset to current date when staff changes
        });
      }
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
  };

  const validateStaffForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!staffForm.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!staffForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(staffForm.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (mode === 'add') {
      if (!staffForm.password) {
        newErrors.password = 'Password is required';
      } else if (staffForm.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (staffForm.password !== staffForm.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (mode === 'edit' && staffForm.password) {
      if (staffForm.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (staffForm.password !== staffForm.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (staffForm.phone && !/^[0-9+\-\s]{10,15}$/.test(staffForm.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSalaryForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!salaryForm.staff_id) {
      newErrors.staff_id = 'Staff is required';
    }
    
    if (!salaryForm.salary_month) {
      newErrors.salary_month = 'Month is required';
    } else if (!/^\d{4}-\d{2}$/.test(salaryForm.salary_month)) {
      newErrors.salary_month = 'Month must be in YYYY-MM format';
    }
    
    if (!salaryForm.amount || parseFloat(salaryForm.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    if (salaryForm.bonus && parseFloat(salaryForm.bonus) < 0) {
      newErrors.bonus = 'Bonus cannot be negative';
    }
    
    if (salaryForm.deductions && parseFloat(salaryForm.deductions) < 0) {
      newErrors.deductions = 'Deductions cannot be negative';
    }

    const netAmount = parseFloat(calculateNetSalary()) || 0;
    const fundingAmount = parseFloat(salaryForm.funding_amount || '0') || 0;

    if (salaryForm.funding_source !== 'business_income') {
      if (fundingAmount <= 0) {
        newErrors.funding_amount = 'Enter borrowed amount used for this salary';
      } else if (fundingAmount > netAmount) {
        newErrors.funding_amount = 'Borrowed amount cannot be more than net salary';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateExpenseForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!expenseForm.staff_id) {
      newErrors.staff_id = 'Staff is required';
    }
    
    if (!expenseForm.expense_date) {
      newErrors.expense_date = 'Date is required';
    }
    
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      newErrors.amount = 'Valid amount is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStaffForm()) {
      setActiveStep(1);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const url = `${API_BASE_URL}/users.php`;
      const method = mode === 'add' ? 'POST' : 'PUT';
      
      const formData: any = {
        name: staffForm.name,
        email: staffForm.email,
        role: staffForm.role,
        phone: staffForm.phone || null,
        address: staffForm.address || null,
        department: staffForm.department || null,
        position: staffForm.position || null,
        is_active: staffForm.is_active
      };
      
      if (staffForm.password) {
        formData.password = staffForm.password;
      }
      
      if (mode === 'edit' && data) {
        formData.id = data.id;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        showSnackbar(
          mode === 'add' ? '✨ Staff added successfully!' : '✨ Staff updated successfully!',
          'success'
        );
        onSuccess();
        onClose();
      } else {
        throw new Error(responseData.message || `Failed to ${mode} staff`);
      }
      
    } catch (error: any) {
      console.error(`Error ${mode}ing staff:`, error);
      setError(error.message || `Failed to ${mode} staff`);
    } finally {
      setLoading(false);
    }
  };

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateSalaryForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const url = `${API_BASE_URL}/salary.php`;
      
      const amount = parseFloat(salaryForm.amount);
      const bonus = parseFloat(salaryForm.bonus || '0');
      const deductions = parseFloat(salaryForm.deductions || '0');
      const netAmount = amount + bonus - deductions;
      
      // Use the 28th of the month as default salary date
      const salaryDate = salaryForm.salary_month + '-28';
      
      const formData = {
        staff_id: salaryForm.staff_id,
        staff_name: salaryForm.staff_name,
        service_type: salaryForm.service_type,
        amount: amount,
        salary_date: salaryDate,
        salary_month: salaryForm.salary_month,
        payment_method: salaryForm.payment_method,
        transaction_id: salaryForm.transaction_id || `TXN${Date.now()}`,
        bonus: bonus,
        deductions: deductions,
        net_amount: netAmount,
        funding_source: salaryForm.funding_source,
        funding_amount: salaryForm.funding_source === 'business_income' ? 0 : parseFloat(salaryForm.funding_amount || '0'),
        funding_notes: salaryForm.funding_notes,
        notes: salaryForm.notes,
        paid_by: 1 // Current user ID
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        showSnackbar('💰 Salary added successfully!', 'success');
        onSuccess();
        onClose();
      } else {
        throw new Error(responseData.message || 'Failed to add salary');
      }
      
    } catch (error: any) {
      console.error('Error adding salary:', error);
      setError(error.message || 'Failed to add salary');
    } finally {
      setLoading(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateExpenseForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const url = `${API_BASE_URL}/expenses.php`;
      
      const formData = {
        staff_id: expenseForm.staff_id,
        staff_name: expenseForm.staff_name,
        service_type: expenseForm.service_type,
        expense_type: expenseForm.expense_type,
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description,
        expense_date: expenseForm.expense_date,
        payment_method: expenseForm.payment_method,
        receipt_number: expenseForm.receipt_number || null,
        notes: expenseForm.notes,
        created_by: 1 // Current user ID
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      const responseData = await response.json();
      
      if (responseData.success) {
        showSnackbar('📝 Expense added successfully!', 'success');
        onSuccess();
        onClose();
      } else {
        throw new Error(responseData.message || 'Failed to add expense');
      }
      
    } catch (error: any) {
      console.error('Error adding expense:', error);
      setError(error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch(mode) {
      case 'add': return isMobile ? 'Add Staff' : 'Add New Staff Member';
      case 'edit': return isMobile ? 'Edit Staff' : 'Edit Staff Information';
      case 'salary': return isMobile ? 'Add Salary' : 'Record Salary Payment';
      case 'expense': return isMobile ? 'Add Expense' : 'Record Staff Expense';
      default: return 'Staff Form';
    }
  };

  const getSubtitle = () => {
    if (isMobile) return '';
    
    switch(mode) {
      case 'add': return 'Create a new staff account with access permissions';
      case 'edit': return 'Update staff details and account settings';
      case 'salary': return 'Process monthly salary for staff member';
      case 'expense': return 'Add expense incurred by staff';
      default: return '';
    }
  };

  const getIcon = () => {
    switch(mode) {
      case 'add': return <AddIcon sx={{ fontSize: isMobile ? 20 : 24 }} />;
      case 'edit': return <EditIcon sx={{ fontSize: isMobile ? 20 : 24 }} />;
      case 'salary': return <AttachMoneyIcon sx={{ fontSize: isMobile ? 20 : 24 }} />;
      case 'expense': return <ReceiptIcon sx={{ fontSize: isMobile ? 20 : 24 }} />;
      default: return <PersonIcon sx={{ fontSize: isMobile ? 20 : 24 }} />;
    }
  };

  const getGradientColor = () => {
    switch(mode) {
      case 'expense': return '#F59E0B';
      case 'salary': return '#10B981';
      default: return '#667eea';
    }
  };

  const calculateNetSalary = () => {
    const amount = parseFloat(salaryForm.amount) || 0;
    const bonus = parseFloat(salaryForm.bonus) || 0;
    const deductions = parseFloat(salaryForm.deductions) || 0;
    return (amount + bonus - deductions).toFixed(2);
  };

  const isNetPositive = () => {
    return parseFloat(calculateNetSalary()) >= 0;
  };

  // Helper functions to handle select changes with proper typing
  const handleStaffRoleChange = (event: SelectChangeEvent<unknown>) => {
    setStaffForm({...staffForm, role: event.target.value as string});
  };

  const handleSalaryPaymentMethodChange = (event: SelectChangeEvent<unknown>) => {
    setSalaryForm({...salaryForm, payment_method: event.target.value as string});
  };

  const handleSalaryFundingSourceChange = (event: SelectChangeEvent<unknown>) => {
    const nextSource = event.target.value as SalaryData['funding_source'];
    setSalaryForm({
      ...salaryForm,
      funding_source: nextSource,
      funding_amount: nextSource === 'business_income' ? '0' : salaryForm.funding_amount,
      funding_notes: nextSource === 'business_income' ? '' : salaryForm.funding_notes
    });
  };

  const handleExpenseTypeChange = (event: SelectChangeEvent<unknown>) => {
    setExpenseForm({...expenseForm, expense_type: event.target.value as string});
  };

  const handleExpensePaymentMethodChange = (event: SelectChangeEvent<unknown>) => {
    setExpenseForm({...expenseForm, payment_method: event.target.value as string});
  };

  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (mode === 'salary') {
      setSalaryForm({...salaryForm, service_type: e.target.value as 'water' | 'inverter' | 'both'});
    } else {
      setExpenseForm({...expenseForm, service_type: e.target.value as 'water' | 'inverter' | 'both'});
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth={isMobile ? 'sm' : 'md'} 
      fullWidth
      fullScreen={isMobile}
      TransitionComponent={Slide}
      transitionDuration={400}
      PaperProps={{
        sx: { 
          borderRadius: isMobile ? 0 : 16,
          [theme.breakpoints.up('sm')]: {
            borderRadius: 24,
          },
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          margin: isMobile ? 0 : 2,
          height: isMobile ? '100%' : 'auto',
          maxHeight: isMobile ? '100%' : '90vh'
        }
      }}
    >
      <GradientDialogTitle mode={mode}>
        <Box display="flex" alignItems="center" gap={isMobile ? 1 : 2}>
          <Zoom in={true} timeout={500}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: isMobile ? 40 : 50, 
                height: isMobile ? 40 : 50,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'rotate(360deg) scale(1.1)',
                  bgcolor: 'rgba(255,255,255,0.3)'
                }
              }}
            >
              {getIcon()}
            </Avatar>
          </Zoom>
          <Box>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              component="div" 
              fontWeight="700" 
              letterSpacing="-0.02em"
            >
              {getTitle()}
            </Typography>
            {!isMobile && (
              <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                {getSubtitle()}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton 
          onClick={onClose} 
          size="small" 
          sx={{ 
            color: 'white',
            bgcolor: 'rgba(255,255,255,0.1)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.2)',
              transform: 'rotate(90deg)'
            },
            transition: 'all 0.3s ease',
            width: isMobile ? 32 : 36,
            height: isMobile ? 32 : 36
          }}
        >
          <CloseIcon fontSize={isMobile ? "small" : "medium"} />
        </IconButton>
      </GradientDialogTitle>

      {loading && (
        <LinearProgress 
          sx={{ 
            height: isMobile ? 3 : 4,
            '& .MuiLinearProgress-bar': {
              background: `linear-gradient(90deg, ${getGradientColor()} 0%, ${getGradientColor()}80 100%)`
            }
          }} 
        />
      )}

      <form onSubmit={
        mode === 'salary' 
          ? handleSalarySubmit 
          : mode === 'expense' 
            ? handleExpenseSubmit 
            : handleStaffSubmit
      }>
        <DialogContent sx={{ 
          py: isMobile ? 2 : 3, 
          px: isMobile ? 2 : 3, 
          bgcolor: '#F9FAFB',
          overflowY: 'auto',
          maxHeight: isMobile ? 'calc(100vh - 130px)' : 'calc(90vh - 140px)'
        }}>
          <Fade in={true} timeout={500}>
            <Box>
              {error && (
                <Zoom in={true}>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: isMobile ? 2 : 3, 
                      borderRadius: 2,
                      fontSize: isMobile ? '0.85rem' : '0.9rem',
                      animation: 'shake 0.5s ease-in-out',
                      '@keyframes shake': {
                        '0%, 100%': { transform: 'translateX(0)' },
                        '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
                        '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' }
                      }
                    }}
                    onClose={() => setError(null)}
                    icon={<ErrorIcon fontSize={isMobile ? "small" : "medium"} />}
                  >
                    {error}
                  </Alert>
                </Zoom>
              )}

              {/* Staff Selection for Salary/Expense when no staff pre-selected */}
              {(mode === 'salary' || mode === 'expense') && !data && staffList.length > 0 && (
                <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                  <StyledCard sx={{ mb: isMobile ? 2 : 3 }}>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: getGradientColor(), width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }}>
                          <PersonIcon fontSize={isMobile ? "small" : "medium"} />
                        </Avatar>
                      }
                      title={
                        <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={700}>
                          Select Staff Member
                        </Typography>
                      }
                      subheader={!isMobile && "Choose the staff member for this transaction"}
                      titleTypographyProps={{ fontWeight: 700 }}
                    />
                    <CardContent sx={{ pt: 0 }}>
                      <FormControl fullWidth error={!!errors.staff_id}>
                        <InputLabel>Staff Member</InputLabel>
                        <StyledSelect
                          value={selectedStaffId}
                          onChange={(e) => handleStaffChange(Number(e.target.value))}
                          label="Staff Member"
                          required
                        >
                          <MenuItem value={0}>
                            <em>Select a staff member</em>
                          </MenuItem>
                          {staffList.map((staff) => (
                            <MenuItem key={staff.id} value={staff.id}>
                              <Box display="flex" alignItems="center" gap={1.5} width="100%" flexWrap={isMobile ? "wrap" : "nowrap"}>
                                <Avatar 
                                  sx={{ 
                                    width: isMobile ? 28 : 32, 
                                    height: isMobile ? 28 : 32, 
                                    fontSize: isMobile ? 12 : 14, 
                                    bgcolor: getRoleColor(staff.role),
                                    border: '2px solid rgba(102,126,234,0.2)'
                                  }}
                                >
                                  {staff.name.charAt(0)}
                                </Avatar>
                                <Typography flex={1} fontWeight={500} fontSize={isMobile ? '0.9rem' : '1rem'}>
                                  {staff.name}
                                </Typography>
                                <StaffChip 
                                  label={staff.role} 
                                  size="small"
                                  active={staff.is_active}
                                  icon={staff.is_active ? <CheckCircleIcon fontSize="small" /> : <LockIcon fontSize="small" />}
                                />
                              </Box>
                            </MenuItem>
                          ))}
                        </StyledSelect>
                        {errors.staff_id && <FormHelperText error>{errors.staff_id}</FormHelperText>}
                      </FormControl>
                    </CardContent>
                  </StyledCard>
                </Zoom>
              )}

              {/* Staff Form with Stepper - for Add and Edit modes */}
              {(mode === 'add' || mode === 'edit') && (
                <Box>
                  <Stepper 
                    activeStep={activeStep} 
                    orientation="vertical"
                    sx={{ 
                      '& .MuiStepLabel-label': { 
                        fontWeight: 600,
                        color: '#1F2937',
                        fontSize: isMobile ? '0.9rem' : '1rem'
                      }
                    }}
                  >
                    {/* Step 1: Personal Information */}
                    <Step>
                      <StepLabel
                        StepIconComponent={() => (
                          <StepIcon active={activeStep >= 0}>
                            <PersonIcon fontSize="small" />
                          </StepIcon>
                        )}
                      >
                        Personal Information
                      </StepLabel>
                      <StepContent>
                        <FormSection>
                          <Grid container spacing={isMobile ? 1.5 : 2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <StyledTextField
                                fullWidth
                                label="Full Name *"
                                value={staffForm.name}
                                onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                                onBlur={() => handleBlur('name')}
                                error={touched.name && !!errors.name}
                                helperText={touched.name && errors.name}
                                required
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <PersonIcon sx={{ color: getGradientColor(), fontSize: isMobile ? 18 : 20 }} />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                            
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <StyledTextField
                                fullWidth
                                label="Email Address *"
                                type="email"
                                value={staffForm.email}
                                onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                                onBlur={() => handleBlur('email')}
                                error={touched.email && !!errors.email}
                                helperText={touched.email && errors.email}
                                required
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <EmailIcon sx={{ color: getGradientColor(), fontSize: isMobile ? 18 : 20 }} />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                            
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <StyledTextField
                                fullWidth
                                label="Phone Number"
                                value={staffForm.phone}
                                onChange={(e) => setStaffForm({...staffForm, phone: e.target.value})}
                                onBlur={() => handleBlur('phone')}
                                error={touched.phone && !!errors.phone}
                                helperText={touched.phone && errors.phone}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <PhoneIcon sx={{ color: getGradientColor(), fontSize: isMobile ? 18 : 20 }} />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                            
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <FormControl fullWidth>
                                <InputLabel>Role</InputLabel>
                                <StyledSelect
                                  value={staffForm.role}
                                  onChange={handleStaffRoleChange}
                                  label="Role"
                                >
                                  <MenuItem value="admin">Admin</MenuItem>
                                  <MenuItem value="staff">Staff</MenuItem>
                                </StyledSelect>
                              </FormControl>
                            </Grid>
                          </Grid>
                          <Box sx={{ mt: isMobile ? 1.5 : 2, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button 
                              onClick={() => setActiveStep(1)}
                              variant="contained"
                              sx={{ 
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${getGradientColor()} 0%, ${getGradientColor()}80 100%)`
                              }}
                            >
                              Next
                            </Button>
                          </Box>
                        </FormSection>
                      </StepContent>
                    </Step>

                    {/* Step 2: Work Information */}
                    <Step>
                      <StepLabel
                        StepIconComponent={() => (
                          <StepIcon active={activeStep >= 1}>
                            <WorkIcon fontSize="small" />
                          </StepIcon>
                        )}
                      >
                        Work Information
                      </StepLabel>
                      <StepContent>
                        <FormSection>
                          <Grid container spacing={isMobile ? 1.5 : 2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <StyledTextField
                                fullWidth
                                label="Department"
                                value={staffForm.department}
                                onChange={(e) => setStaffForm({...staffForm, department: e.target.value})}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <BusinessIcon sx={{ color: getGradientColor(), fontSize: isMobile ? 18 : 20 }} />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                            
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <StyledTextField
                                fullWidth
                                label="Position"
                                value={staffForm.position}
                                onChange={(e) => setStaffForm({...staffForm, position: e.target.value})}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <AssignmentIcon sx={{ color: getGradientColor(), fontSize: isMobile ? 18 : 20 }} />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                            
                            <Grid size={{ xs: 12 }}>
                              <StyledTextField
                                fullWidth
                                label="Address"
                                multiline
                                rows={isMobile ? 2 : 3}
                                value={staffForm.address}
                                onChange={(e) => setStaffForm({...staffForm, address: e.target.value})}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: isMobile ? 0.5 : 1 }}>
                                      <LocationIcon sx={{ color: getGradientColor(), fontSize: isMobile ? 18 : 20 }} />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                          </Grid>
                          <Box sx={{ mt: isMobile ? 1.5 : 2, display: 'flex', justifyContent: 'space-between' }}>
                            <Button 
                              onClick={() => setActiveStep(0)}
                            >
                              Back
                            </Button>
                            <Button 
                              onClick={() => setActiveStep(2)}
                              variant="contained"
                              sx={{ 
                                borderRadius: 2,
                                background: `linear-gradient(135deg, ${getGradientColor()} 0%, ${getGradientColor()}80 100%)`
                              }}
                            >
                              Next
                            </Button>
                          </Box>
                        </FormSection>
                      </StepContent>
                    </Step>

                    {/* Step 3: Security Settings */}
                    <Step>
                      <StepLabel
                        StepIconComponent={() => (
                          <StepIcon active={activeStep >= 2}>
                            <LockIcon fontSize="small" />
                          </StepIcon>
                        )}
                      >
                        Security Settings
                      </StepLabel>
                      <StepContent>
                        <FormSection>
                          <Grid container spacing={isMobile ? 1.5 : 2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <StyledTextField
                                fullWidth
                                label={mode === 'edit' ? "New Password (leave blank to keep current)" : "Password *"}
                                type={showPassword ? 'text' : 'password'}
                                value={staffForm.password}
                                onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
                                onBlur={() => handleBlur('password')}
                                error={touched.password && !!errors.password}
                                helperText={touched.password && errors.password}
                                required={mode === 'add'}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <KeyIcon sx={{ color: getGradientColor(), fontSize: isMobile ? 18 : 20 }} />
                                    </InputAdornment>
                                  ),
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        size="small"
                                        sx={{ color: getGradientColor() }}
                                      >
                                        {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                                      </IconButton>
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                            
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <StyledTextField
                                fullWidth
                                label={mode === 'edit' ? "Confirm New Password" : "Confirm Password *"}
                                type={showPassword ? 'text' : 'password'}
                                value={staffForm.confirmPassword}
                                onChange={(e) => setStaffForm({...staffForm, confirmPassword: e.target.value})}
                                onBlur={() => handleBlur('confirmPassword')}
                                error={touched.confirmPassword && !!errors.confirmPassword}
                                helperText={touched.confirmPassword && errors.confirmPassword}
                                required={mode === 'add'}
                                InputProps={{
                                  startAdornment: (
                                    <InputAdornment position="start">
                                      <LockIcon sx={{ color: getGradientColor(), fontSize: isMobile ? 18 : 20 }} />
                                    </InputAdornment>
                                  )
                                }}
                              />
                            </Grid>
                            
                            <Grid size={{ xs: 12 }}>
                              <Paper sx={{ p: isMobile ? 1.5 : 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={staffForm.is_active}
                                      onChange={(e) => setStaffForm({...staffForm, is_active: e.target.checked})}
                                      color="success"
                                    />
                                  }
                                  label={
                                    <Box display="flex" alignItems="center" gap={1}>
                                      {staffForm.is_active ? (
                                        <LockOpenIcon color="success" fontSize={isMobile ? "small" : "medium"} />
                                      ) : (
                                        <LockIcon color="error" fontSize={isMobile ? "small" : "medium"} />
                                      )}
                                      <Typography variant="body2" fontWeight={500}>
                                        {staffForm.is_active ? 'Active Staff Member - Can access system' : 'Inactive Staff Member - Cannot access system'}
                                      </Typography>
                                    </Box>
                                  }
                                />
                              </Paper>
                            </Grid>
                          </Grid>
                          <Box sx={{ mt: isMobile ? 1.5 : 2, display: 'flex', justifyContent: 'space-between' }}>
                            <Button 
                              onClick={() => setActiveStep(1)}
                            >
                              Back
                            </Button>
                          </Box>
                        </FormSection>
                      </StepContent>
                    </Step>
                  </Stepper>
                </Box>
              )}

              {/* Salary Form */}
              {mode === 'salary' && (
                <Box>
                  {/* Staff Summary */}
                  {(data || selectedStaffId > 0) && (
                    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                      <SummaryCard mode="salary">
                        <Box display="flex" alignItems="center" gap={isMobile ? 2 : 3} flexWrap={isMobile ? "wrap" : "nowrap"}>
                          <AnimatedAvatar
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            sx={{ 
                              bgcolor: 'white', 
                              color: '#10B981',
                              width: isMobile ? 50 : 70,
                              height: isMobile ? 50 : 70,
                              fontSize: isMobile ? 20 : 28
                            }}
                          >
                            {salaryForm.staff_name.charAt(0)}
                          </AnimatedAvatar>
                          <Box flex={1}>
                            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="700" color="white">
                              {salaryForm.staff_name}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
                              <Chip
                                icon={<BadgeIcon fontSize="small" />}
                                label={`ID: ${salaryForm.staff_id}`}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                              />
                              {staffList.find(s => s.id === salaryForm.staff_id)?.role && (
                                <Chip
                                  label={staffList.find(s => s.id === salaryForm.staff_id)?.role}
                                  size="small"
                                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                          <AttachMoneyIcon sx={{ fontSize: isMobile ? 40 : 60, opacity: 0.3 }} />
                        </Box>
                      </SummaryCard>
                    </Zoom>
                  )}

                  {/* Service Type Selection */}
                  <Zoom in={true} style={{ transitionDelay: '150ms' }}>
                    <FormSection>
                      <SectionTitle color="#10B981">
                        <WorkIcon sx={{ fontSize: isMobile ? 20 : 24 }} /> Service Type
                      </SectionTitle>
                      <RadioGroup
                        row={!isMobile}
                        value={salaryForm.service_type}
                        onChange={handleServiceTypeChange}
                        sx={{ flexDirection: isMobile ? 'column' : 'row' }}
                      >
                        <FormControlLabel 
                          value="water" 
                          control={<Radio size={isMobile ? "small" : "medium"} sx={{ color: '#3B82F6' }} />} 
                          label={
                            <Box display="flex" alignItems="center" gap={1}>
                              <WaterDropIcon sx={{ color: '#3B82F6', fontSize: isMobile ? 18 : 24 }} />
                              <Typography variant="body2">Water Services</Typography>
                            </Box>
                          } 
                        />
                        <FormControlLabel 
                          value="inverter" 
                          control={<Radio size={isMobile ? "small" : "medium"} sx={{ color: '#F59E0B' }} />} 
                          label={
                            <Box display="flex" alignItems="center" gap={1}>
                              <BoltIcon sx={{ color: '#F59E0B', fontSize: isMobile ? 18 : 24 }} />
                              <Typography variant="body2">Inverter Services</Typography>
                            </Box>
                          } 
                        />
                        <FormControlLabel 
                          value="both" 
                          control={<Radio size={isMobile ? "small" : "medium"} sx={{ color: '#10B981' }} />} 
                          label={
                            <Box display="flex" alignItems="center" gap={1}>
                              <WaterDropIcon sx={{ color: '#3B82F6', fontSize: isMobile ? 18 : 24 }} />
                              <BoltIcon sx={{ color: '#F59E0B', fontSize: isMobile ? 18 : 24 }} />
                              <Typography variant="body2">Both Services</Typography>
                            </Box>
                          } 
                        />
                      </RadioGroup>
                    </FormSection>
                  </Zoom>

                  {/* Salary Details */}
                  <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                    <FormSection>
                      <SectionTitle color="#10B981">
                        <AttachMoneyIcon sx={{ fontSize: isMobile ? 20 : 24 }} /> Salary Details
                      </SectionTitle>
                      <Grid container spacing={isMobile ? 1.5 : 2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <StyledTextField
                            fullWidth
                            label="Salary Month"
                            type="month"
                            value={salaryForm.salary_month}
                            onChange={(e) => setSalaryForm({...salaryForm, salary_month: e.target.value})}
                            onBlur={() => handleBlur('salary_month')}
                            error={touched.salary_month && !!errors.salary_month}
                            helperText={touched.salary_month && errors.salary_month}
                            required
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CalendarIcon sx={{ color: '#10B981', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <StyledTextField
                            fullWidth
                            label="Transaction ID"
                            value={salaryForm.transaction_id}
                            onChange={(e) => setSalaryForm({...salaryForm, transaction_id: e.target.value})}
                            placeholder="Auto-generated if empty"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <ReceiptLongIcon sx={{ color: '#10B981', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <StyledTextField
                            fullWidth
                            label="Base Amount"
                            type="number"
                            value={salaryForm.amount}
                            onChange={(e) => setSalaryForm({...salaryForm, amount: e.target.value})}
                            onBlur={() => handleBlur('amount')}
                            error={touched.amount && !!errors.amount}
                            helperText={touched.amount && errors.amount}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AttachMoneyIcon sx={{ color: '#10B981', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <StyledTextField
                            fullWidth
                            label="Bonus"
                            type="number"
                            value={salaryForm.bonus}
                            onChange={(e) => setSalaryForm({...salaryForm, bonus: e.target.value})}
                            onBlur={() => handleBlur('bonus')}
                            error={touched.bonus && !!errors.bonus}
                            helperText={touched.bonus && errors.bonus}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <TrendingUpIcon sx={{ color: '#10B981', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <StyledTextField
                            fullWidth
                            label="Deductions"
                            type="number"
                            value={salaryForm.deductions}
                            onChange={(e) => setSalaryForm({...salaryForm, deductions: e.target.value})}
                            onBlur={() => handleBlur('deductions')}
                            error={touched.deductions && !!errors.deductions}
                            helperText={touched.deductions && errors.deductions}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <TrendingDownIcon sx={{ color: '#EF4444', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                      </Grid>
                    </FormSection>
                  </Zoom>

                  {/* Net Amount */}
                  <Zoom in={true} style={{ transitionDelay: '250ms' }}>
                    <NetAmountCard positive={isNetPositive()}>
                      <Box>
                        <Typography variant="body2" fontWeight="500" sx={{ opacity: 0.9, fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
                          Net Salary Amount
                        </Typography>
                        <Typography variant={isMobile ? "h5" : "h3"} fontWeight="800">
                          ₹{calculateNetSalary()}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: isMobile ? 50 : 60, height: isMobile ? 50 : 60 }}>
                        <AttachMoneyIcon sx={{ fontSize: isMobile ? 30 : 40 }} />
                      </Avatar>
                    </NetAmountCard>
                  </Zoom>

                  {/* Salary Funding */}
                  <Zoom in={true} style={{ transitionDelay: '275ms' }}>
                    <FormSection>
                      <SectionTitle color="#10B981">
                        <BusinessIcon sx={{ fontSize: isMobile ? 20 : 24 }} /> Salary Funding
                      </SectionTitle>
                      <Grid container spacing={isMobile ? 1.5 : 2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth>
                            <InputLabel>Amount Source</InputLabel>
                            <StyledSelect
                              value={salaryForm.funding_source}
                              onChange={handleSalaryFundingSourceChange}
                              label="Amount Source"
                            >
                              <MenuItem value="raj_communication">Raj Electricals</MenuItem>
                              <MenuItem value="business_income">Sun Water Service</MenuItem>
                              <MenuItem value="owner_cash">Owner Cash</MenuItem>
                              <MenuItem value="other_borrowing">Other Borrowing</MenuItem>
                            </StyledSelect>
                          </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <StyledTextField
                            fullWidth
                            label="Borrowed / Support Amount"
                            type="number"
                            value={salaryForm.funding_amount}
                            onChange={(e) => setSalaryForm({...salaryForm, funding_amount: e.target.value})}
                            onBlur={() => handleBlur('funding_amount')}
                            error={touched.funding_amount && !!errors.funding_amount}
                            helperText={
                              touched.funding_amount && errors.funding_amount
                                ? errors.funding_amount
                                : salaryForm.funding_source === 'business_income'
                                  ? 'Using Sun Water Service amount only'
                                  : 'Enter how much came from the selected source'
                            }
                            disabled={salaryForm.funding_source === 'business_income'}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AttachMoneyIcon sx={{ color: '#10B981', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                          <StyledTextField
                            fullWidth
                            label="Funding Notes"
                            value={salaryForm.funding_notes}
                            onChange={(e) => setSalaryForm({...salaryForm, funding_notes: e.target.value})}
                            placeholder="Example: Took Rs.5000 from Raj Electricals to complete this month's salary"
                            disabled={salaryForm.funding_source === 'business_income'}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <BusinessIcon sx={{ color: '#10B981', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                      </Grid>
                    </FormSection>
                  </Zoom>

                  {/* Payment Method & Notes */}
                  <Zoom in={true} style={{ transitionDelay: '300ms' }}>
                    <FormSection>
                      <Grid container spacing={isMobile ? 1.5 : 2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth>
                            <InputLabel>Payment Method</InputLabel>
                            <StyledSelect
                              value={salaryForm.payment_method}
                              onChange={handleSalaryPaymentMethodChange}
                              label="Payment Method"
                            >
                              <MenuItem value="cash">💵 Cash</MenuItem>
                              <MenuItem value="bank_transfer">🏦 Bank Transfer</MenuItem>
                              <MenuItem value="check">📝 Check</MenuItem>
                              <MenuItem value="online">💳 Online Payment</MenuItem>
                            </StyledSelect>
                          </FormControl>
                        </Grid>
                        
                        <Grid size={{ xs: 12 }}>
                          <StyledTextField
                            fullWidth
                            label="Notes"
                            multiline
                            rows={isMobile ? 2 : 3}
                            value={salaryForm.notes}
                            onChange={(e) => setSalaryForm({...salaryForm, notes: e.target.value})}
                            placeholder="Add any additional notes about this salary payment"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: isMobile ? 0.5 : 1 }}>
                                  <NoteIcon sx={{ color: '#10B981', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                      </Grid>
                    </FormSection>
                  </Zoom>
                </Box>
              )}

              {/* Expense Form */}
              {mode === 'expense' && (
                <Box>
                  {/* Staff Summary */}
                  {(data || selectedStaffId > 0) && (
                    <Zoom in={true} style={{ transitionDelay: '100ms' }}>
                      <SummaryCard mode="expense">
                        <Box display="flex" alignItems="center" gap={isMobile ? 2 : 3} flexWrap={isMobile ? "wrap" : "nowrap"}>
                          <AnimatedAvatar
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            sx={{ 
                              bgcolor: 'white', 
                              color: '#F59E0B',
                              width: isMobile ? 50 : 70,
                              height: isMobile ? 50 : 70,
                              fontSize: isMobile ? 20 : 28
                            }}
                          >
                            {expenseForm.staff_name.charAt(0)}
                          </AnimatedAvatar>
                          <Box flex={1}>
                            <Typography variant={isMobile ? "h6" : "h5"} fontWeight="700" color="white">
                              {expenseForm.staff_name}
                            </Typography>
                            <Box display="flex" alignItems="center" gap={1} mt={0.5} flexWrap="wrap">
                              <Chip
                                icon={<BadgeIcon fontSize="small" />}
                                label={`ID: ${expenseForm.staff_id}`}
                                size="small"
                                sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                              />
                              {staffList.find(s => s.id === expenseForm.staff_id)?.role && (
                                <Chip
                                  label={staffList.find(s => s.id === expenseForm.staff_id)?.role}
                                  size="small"
                                  sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white', fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                                />
                              )}
                            </Box>
                          </Box>
                          <ReceiptIcon sx={{ fontSize: isMobile ? 40 : 60, opacity: 0.3 }} />
                        </Box>
                      </SummaryCard>
                    </Zoom>
                  )}

                  {/* Service Type Selection */}
                  <Zoom in={true} style={{ transitionDelay: '150ms' }}>
                    <FormSection>
                      <SectionTitle color="#F59E0B">
                        <WorkIcon sx={{ fontSize: isMobile ? 20 : 24 }} /> Service Type
                      </SectionTitle>
                      <RadioGroup
                        row={!isMobile}
                        value={expenseForm.service_type}
                        onChange={handleServiceTypeChange}
                        sx={{ flexDirection: isMobile ? 'column' : 'row' }}
                      >
                        <FormControlLabel 
                          value="water" 
                          control={<Radio size={isMobile ? "small" : "medium"} sx={{ color: '#3B82F6' }} />} 
                          label={
                            <Box display="flex" alignItems="center" gap={1}>
                              <WaterDropIcon sx={{ color: '#3B82F6', fontSize: isMobile ? 18 : 24 }} />
                              <Typography variant="body2">Water Services</Typography>
                            </Box>
                          } 
                        />
                        <FormControlLabel 
                          value="inverter" 
                          control={<Radio size={isMobile ? "small" : "medium"} sx={{ color: '#F59E0B' }} />} 
                          label={
                            <Box display="flex" alignItems="center" gap={1}>
                              <BoltIcon sx={{ color: '#F59E0B', fontSize: isMobile ? 18 : 24 }} />
                              <Typography variant="body2">Inverter Services</Typography>
                            </Box>
                          } 
                        />
                        <FormControlLabel 
                          value="both" 
                          control={<Radio size={isMobile ? "small" : "medium"} sx={{ color: '#10B981' }} />} 
                          label={
                            <Box display="flex" alignItems="center" gap={1}>
                              <WaterDropIcon sx={{ color: '#3B82F6', fontSize: isMobile ? 18 : 24 }} />
                              <BoltIcon sx={{ color: '#F59E0B', fontSize: isMobile ? 18 : 24 }} />
                              <Typography variant="body2">Both Services</Typography>
                            </Box>
                          } 
                        />
                      </RadioGroup>
                    </FormSection>
                  </Zoom>

                  {/* Expense Details */}
                  <Zoom in={true} style={{ transitionDelay: '200ms' }}>
                    <FormSection>
                      <SectionTitle color="#F59E0B">
                        <ReceiptIcon sx={{ fontSize: isMobile ? 20 : 24 }} /> Expense Details
                      </SectionTitle>
                      <Grid container spacing={isMobile ? 1.5 : 2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <StyledTextField
                            fullWidth
                            label="Expense Date"
                            type="date"
                            value={expenseForm.expense_date}
                            onChange={(e) => setExpenseForm({...expenseForm, expense_date: e.target.value})}
                            onBlur={() => handleBlur('expense_date')}
                            error={touched.expense_date && !!errors.expense_date}
                            helperText={touched.expense_date && errors.expense_date}
                            required
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CalendarIcon sx={{ color: '#F59E0B', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth>
                            <InputLabel>Expense Type</InputLabel>
                            <StyledSelect
                              value={expenseForm.expense_type}
                              onChange={handleExpenseTypeChange}
                              label="Expense Type"
                            >
                              <MenuItem value="petrol">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <LocalGasStationIcon sx={{ color: '#10B981', fontSize: isMobile ? 18 : 20 }} /> Petrol / Fuel
                                </Box>
                              </MenuItem>
                              <MenuItem value="food">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <RestaurantIcon sx={{ color: '#F59E0B', fontSize: isMobile ? 18 : 20 }} /> Food / Refreshments
                                </Box>
                              </MenuItem>
                              <MenuItem value="travel">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <DirectionsCarIcon sx={{ color: '#3B82F6', fontSize: isMobile ? 18 : 20 }} /> Travel / Transport
                                </Box>
                              </MenuItem>
                              <MenuItem value="tools">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <BuildIcon sx={{ color: '#8B5CF6', fontSize: isMobile ? 18 : 20 }} /> Tools / Equipment
                                </Box>
                              </MenuItem>
                              <MenuItem value="maintenance">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <BuildIcon sx={{ color: '#EF4444', fontSize: isMobile ? 18 : 20 }} /> Maintenance
                                </Box>
                              </MenuItem>
                              <MenuItem value="stationery">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <DescriptionIcon sx={{ color: '#6B7280', fontSize: isMobile ? 18 : 20 }} /> Stationery
                                </Box>
                              </MenuItem>
                              <MenuItem value="communication">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <WifiIcon sx={{ color: '#3B82F6', fontSize: isMobile ? 18 : 20 }} /> Communication
                                </Box>
                              </MenuItem>
                              <MenuItem value="uniform">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <CheckroomIcon sx={{ color: '#8B5CF6', fontSize: isMobile ? 18 : 20 }} /> Uniform
                                </Box>
                              </MenuItem>
                              <MenuItem value="training">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <SchoolIcon sx={{ color: '#10B981', fontSize: isMobile ? 18 : 20 }} /> Training
                                </Box>
                              </MenuItem>
                              <MenuItem value="others">
                                <Box display="flex" alignItems="center" gap={1}>
                                  <MoreHorizIcon sx={{ color: '#6B7280', fontSize: isMobile ? 18 : 20 }} /> Others
                                </Box>
                              </MenuItem>
                            </StyledSelect>
                          </FormControl>
                        </Grid>
                        
                        <Grid size={{ xs: 12 }}>
                          <StyledTextField
                            fullWidth
                            label="Description"
                            value={expenseForm.description}
                            onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                            required
                            placeholder="Brief description of the expense"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <DescriptionIcon sx={{ color: '#F59E0B', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <StyledTextField
                            fullWidth
                            label="Amount"
                            type="number"
                            value={expenseForm.amount}
                            onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                            onBlur={() => handleBlur('amount')}
                            error={touched.amount && !!errors.amount}
                            helperText={touched.amount && errors.amount}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <AttachMoneyIcon sx={{ color: '#F59E0B', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth>
                            <InputLabel>Payment Method</InputLabel>
                            <StyledSelect
                              value={expenseForm.payment_method}
                              onChange={handleExpensePaymentMethodChange}
                              label="Payment Method"
                            >
                              <MenuItem value="cash">💵 Cash</MenuItem>
                              <MenuItem value="card">💳 Card</MenuItem>
                              <MenuItem value="online">🌐 Online Payment</MenuItem>
                              <MenuItem value="company_card">🏢 Company Card</MenuItem>
                              <MenuItem value="reimbursement">🔄 Reimbursement</MenuItem>
                            </StyledSelect>
                          </FormControl>
                        </Grid>
                        
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <StyledTextField
                            fullWidth
                            label="Receipt Number"
                            value={expenseForm.receipt_number}
                            onChange={(e) => setExpenseForm({...expenseForm, receipt_number: e.target.value})}
                            placeholder="Optional"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <ReceiptLongIcon sx={{ color: '#F59E0B', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12 }}>
                          <StyledTextField
                            fullWidth
                            label="Notes"
                            multiline
                            rows={isMobile ? 2 : 3}
                            value={expenseForm.notes}
                            onChange={(e) => setExpenseForm({...expenseForm, notes: e.target.value})}
                            placeholder="Add any additional notes about this expense"
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: isMobile ? 0.5 : 1 }}>
                                  <NoteIcon sx={{ color: '#F59E0B', fontSize: isMobile ? 18 : 20 }} />
                                </InputAdornment>
                              )
                            }}
                          />
                        </Grid>
                      </Grid>
                    </FormSection>
                  </Zoom>
                </Box>
              )}
            </Box>
          </Fade>
        </DialogContent>

        <DialogActions sx={{ 
          p: isMobile ? 2 : 3, 
          pt: isMobile ? 1 : 0, 
          gap: 1, 
          bgcolor: '#F9FAFB',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'stretch'
        }}>
          <ActionButton 
            onClick={onClose}
            variant="outlined"
            disabled={loading}
            fullWidth={isMobile}
          >
            Cancel
          </ActionButton>
          <ActionButton 
            type="submit"
            variant="contained"
            mode={mode}
            startIcon={loading ? <CircularProgress size={isMobile ? 16 : 20} color="inherit" /> : <SaveIcon fontSize={isMobile ? "small" : "medium"} />}
            disabled={loading}
            fullWidth={isMobile}
          >
            {loading ? 'Processing...' : mode === 'add' ? 'Add Staff' : mode === 'edit' ? 'Update Staff' : mode === 'salary' ? 'Record Salary' : 'Record Expense'}
          </ActionButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// Helper function to get role color
const getRoleColor = (role: string): string => {
  switch(role?.toLowerCase()) {
    case 'admin': return '#EF4444';
    case 'manager': return '#F59E0B';
    case 'technician': return '#3B82F6';
    case 'sales': return '#10B981';
    default: return '#8B5CF6';
  }
};

export default StaffFormModal;
