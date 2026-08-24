import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiCalendar,
  FiShoppingBag,
  FiRefreshCw,
  FiClock,
  FiBarChart2,
  FiPieChart,
  FiCreditCard,
  FiDroplet,
  FiZap,
  FiPrinter,
  FiDownload,
  FiMenu,
  FiDownloadCloud,
  FiFilter
} from "react-icons/fi";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import "./css/Revenue.css";
import { API_BASE_URL } from "../config/api";

// Type Definitions
interface RevenueFilters {
  year: number | null;
  month: number | null;
  customer_id: number | null;
  date_range: string;
  custom_from?: string;
  custom_to?: string;
}

interface DateRange {
  from: string;
  to: string;
}

interface ServiceIncomeDetails {
  transaction_count: number;
  unique_customers: number;
  total: number;
  average: number;
  min: number;
  max: number;
}

interface ExpensesDetails {
  total: number;
  count: number;
  by_type: {
    petrol: number;
    others: number;
  };
  unique_staff: number;
}

interface SalariesDetails {
  total: number;
  base_salary: number;
  bonus: number;
  deductions: number;
  count: number;
  unique_staff: number;
}

interface ServiceProfitDetails {
  income: ServiceIncomeDetails;
  expenses: ExpensesDetails;
  salaries: SalariesDetails;
  total_costs: number;
  net_profit: number;
  profit_margin: number;
  profit_status: string;
}

interface OverallSummary {
  total_income: number;
  total_expenses: number;
  total_salaries: number;
  total_costs: number;
  net_profit: number;
  profit_margin: number;
  profit_status: string;
  is_profitable: boolean;
  total_transactions: number;
  paid_transactions: number;
  unique_customers: number;
}

interface RevenueSummary {
  period: string;
  date_range: DateRange;
  overall: OverallSummary;
  water_services: ServiceProfitDetails;
  inverter_services: ServiceProfitDetails;
}

interface MonthlyData {
  year: number;
  month: number;
  year_month: string;
  month_name: string;
  water_services: {
    income: ServiceIncomeDetails;
    expenses: ExpensesDetails;
    salaries: SalariesDetails;
    total_costs: number;
    profit: {
      net: number;
      margin: number;
      status: string;
    };
  };
  inverter_services: {
    income: ServiceIncomeDetails;
    expenses: ExpensesDetails;
    salaries: SalariesDetails;
    total_costs: number;
    profit: {
      net: number;
      margin: number;
      status: string;
    };
  };
  combined: {
    total_income: number;
    total_expenses: number;
    total_salaries: number;
    total_costs: number;
    profit: {
      net: number;
      margin: number;
      status: string;
    };
  };
}

interface TopCustomer {
  customer_id: number;
  full_name: string;
  phone: string;
  email: string;
  city: string;
  transaction_count: number;
  total_spent: number;
  average_transaction: number;
  last_service_date: string;
}

interface ProfitAnalysis {
  revenue_vs_costs: {
    income_percentage: number;
    expenses_percentage: number;
    salaries_percentage: number;
    profit_percentage: number;
  };
  break_even_point: {
    needed_income: number;
    current_income: number;
    gap: number;
    is_profitable: boolean;
  };
  service_type_breakdown: {
    water_services: {
      income_percentage: number;
      costs_percentage: number;
      profit_contribution: number;
    };
    inverter_services: {
      income_percentage: number;
      costs_percentage: number;
      profit_contribution: number;
    };
  };
}

interface RevenueResponse {
  success: boolean;
  filters: RevenueFilters;
  summary: RevenueSummary;
  monthly_data: MonthlyData[];
  top_customers: TopCustomer[];
  profit_analysis: ProfitAnalysis;
  message: string;
}

interface RevenueTabProps {
  revenueStats?: any;
  services?: any[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

// Date range options
type DateRangeOption = 'all' | 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

const RevenueTab: React.FC<RevenueTabProps> = ({
  loading = false,
  error = null,
  onRefresh
}) => {
  // State
  const [revenueData, setRevenueData] = useState<RevenueResponse | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeOption>('all');
  const [customFromDate, setCustomFromDate] = useState<string>('');
  const [customToDate, setCustomToDate] = useState<string>('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'summary' | 'comparison' | 'profit'>('summary');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Last refreshed state
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  
  // Mobile menu state for export options
  const [showExportOptions, setShowExportOptions] = useState<boolean>(false);
  const [showWaterExportOptions, setShowWaterExportOptions] = useState<boolean>(false);
  const [showInverterExportOptions, setShowInverterExportOptions] = useState<boolean>(false);
  const [showDateFilter, setShowDateFilter] = useState<boolean>(false);
  
  // Window width state for responsive design
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  
  // Track if initial load has been done
  const initialLoadDone = useRef(false);
  const isLoadingRef = useRef(false);

  // API Base URL
  // Available years
  const availableYears = [2026];

  // Month names
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Date range options for dropdown
  const dateRangeOptions = [
    { value: 'all', label: 'None' },
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check device type based on window width
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  // Update last refreshed when data changes
  useEffect(() => {
    if (revenueData) {
      setLastRefreshed(new Date());
    }
  }, [revenueData]);

  // Helper function to get date range based on selected option
  const getDateRangeFromOption = useCallback(() => {
    const today = new Date();
    let fromDate = '';
    let toDate = '';

    switch (dateRange) {
      case 'today':
        fromDate = today.toISOString().split('T')[0];
        toDate = today.toISOString().split('T')[0];
        break;

      case 'this_week': {
        const firstDay = new Date(today);
        firstDay.setDate(today.getDate() - today.getDay()); // Sunday
        const lastDay = new Date(today);
        lastDay.setDate(today.getDate() + (6 - today.getDay())); // Saturday
        fromDate = firstDay.toISOString().split('T')[0];
        toDate = lastDay.toISOString().split('T')[0];
        break;
      }

      case 'this_month': {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        fromDate = firstDay.toISOString().split('T')[0];
        toDate = lastDay.toISOString().split('T')[0];
        break;
      }

      case 'this_year': {
        const firstDay = new Date(today.getFullYear(), 0, 1);
        const lastDay = new Date(today.getFullYear(), 11, 31);
        fromDate = firstDay.toISOString().split('T')[0];
        toDate = lastDay.toISOString().split('T')[0];
        break;
      }

      case 'custom':
        if (customFromDate && customToDate) {
          fromDate = customFromDate;
          toDate = customToDate;
        }
        break;

      case 'all':
      default:
        break;
    }

    return { fromDate, toDate };
  }, [dateRange, customFromDate, customToDate]);

  // Get date range parameters based on selected option
  const getDateRangeParams = useCallback(() => {
    const params: any = {};
    
    // Always include year for month-wise filtering
    params.year = selectedYear || 2026;
    
    // Include month if selected
    if (selectedMonth) {
      params.month = selectedMonth;
    }

    // Set date_range parameter
    params.date_range = dateRange;

    // Get actual dates for the selected range
    const { fromDate, toDate } = getDateRangeFromOption();

    // Add from_date and to_date for custom ranges or specific date ranges
    if (fromDate && toDate) {
      params.from_date = fromDate;
      params.to_date = toDate;
    }

    return params;
  }, [selectedYear, selectedMonth, dateRange, getDateRangeFromOption]);

  // Load revenue data
  const loadRevenueData = useCallback(async (_force = false) => {
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current) return;
    
    // Set loading states
    isLoadingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      const dateParams = getDateRangeParams();
      
      // Add all parameters
      Object.entries(dateParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      console.log('Fetching with params:', params.toString()); // Debug log

      const response = await fetch(`${API_BASE_URL}/revenue.php?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: RevenueResponse = await response.json();

      if (data.success) {
        setRevenueData(data);
        console.log('Data loaded successfully:', data); // Debug log
      } else {
        throw new Error(data.message || 'Failed to load revenue data');
      }

    } catch (error: any) {
      console.error('Error loading revenue data:', error);
      setErrorMessage(error.message || 'Failed to load revenue data');
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [getDateRangeParams]);

  // Initial load - only once when component mounts
  useEffect(() => {
    // Set default custom dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setCustomFromDate(firstDay.toISOString().split('T')[0]);
    setCustomToDate(today.toISOString().split('T')[0]);
    
    if (!initialLoadDone.current) {
      loadRevenueData(true);
      initialLoadDone.current = true;
    }
  }, []); // Empty dependency array - only runs once on mount

  // Load data when filters change
  useEffect(() => {
    // Skip if this is the initial load (already handled by mount effect)
    if (initialLoadDone.current) {
      loadRevenueData();
    }
  }, [selectedYear, selectedMonth, dateRange, customFromDate, customToDate]);

  // Handle manual refresh - can be called from UI
  const handleManualRefresh = useCallback(() => {
    loadRevenueData(true);
    if (onRefresh) {
      onRefresh();
    }
  }, [loadRevenueData, onRefresh]);

  // Handle year change
  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const raw = e.target.value;
    const newYear = parseInt(raw, 10);
    setSelectedYear(Number.isNaN(newYear) ? 2026 : newYear);
  };

  // Handle month change
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value ? parseInt(e.target.value) : null;
    setSelectedMonth(newMonth);
  };

  // Handle date range change
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value as DateRangeOption;
    setDateRange(newRange);
    
    // Show custom date picker if custom is selected
    if (newRange === 'custom') {
      setShowCustomDatePicker(true);
      
      // Set default custom dates if not set
      if (!customFromDate || !customToDate) {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        setCustomFromDate(firstDay.toISOString().split('T')[0]);
        setCustomToDate(today.toISOString().split('T')[0]);
      }
    } else {
      setShowCustomDatePicker(false);
    }
    
    // Close mobile filter if open
    if (isMobile) {
      setShowDateFilter(false);
    }
  };

  // Handle custom from date change
  const handleCustomFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomFromDate(e.target.value);
  };

  // Handle custom to date change
  const handleCustomToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomToDate(e.target.value);
  };

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format number
  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Format percentage
  const formatPercentage = (num: number): string => {
    return `${num.toFixed(2)}%`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format date for filename
  const formatDateForFilename = (): string => {
    const date = new Date();
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  };

  // Get profit status color
  const getProfitStatusColor = (status: string): string => {
    switch(status) {
      case 'profit': return '#10B981';
      case 'loss': return '#EF4444';
      default: return '#6B7280';
    }
  };

  // Get profit status icon
  const getProfitStatusIcon = (status: string) => {
    switch(status) {
      case 'profit': return <FiTrendingUp />;
      case 'loss': return <FiTrendingDown />;
      default: return <FiDollarSign />;
    }
  };

  // Get date range display text
  const getDateRangeDisplay = (): string => {
    const option = dateRangeOptions.find(opt => opt.value === dateRange);
    if (dateRange === 'custom' && customFromDate && customToDate) {
      return `${formatDate(customFromDate)} - ${formatDate(customToDate)}`;
    }
    return option?.label || 'All Dates';
  };

  // Print function for Water Services
  const handleWaterPrint = () => {
    if (!revenueData) {
      alert('No data to print');
      return;
    }
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }
    
    // Generate print content for Water Services
    const content = generateWaterServicePrintContent(revenueData);
    
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Close export options on mobile
    if (isMobile) {
      setShowWaterExportOptions(false);
    }
  };

  // Print function for Inverter Services
  const handleInverterPrint = () => {
    if (!revenueData) {
      alert('No data to print');
      return;
    }
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }
    
    // Generate print content for Inverter Services
    const content = generateInverterServicePrintContent(revenueData);
    
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Close export options on mobile
    if (isMobile) {
      setShowInverterExportOptions(false);
    }
  };

  // Generate Water Services print content
  const generateWaterServicePrintContent = (data: RevenueResponse): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Water Services Report</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            margin: 0;
            padding: 20px;
            background: #f9fafb;
          }
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 24px;
          }
          h1 { 
            color: #1e293b; 
            font-size: clamp(20px, 5vw, 28px);
            margin: 0 0 8px 0;
          }
          h2 { 
            color: #10B981; 
            font-size: clamp(18px, 4vw, 24px); 
            margin: 24px 0 16px 0;
            border-bottom: 2px solid #10B981;
            padding-bottom: 8px;
          }
          h3 {
            color: #334155;
            font-size: clamp(14px, 3.5vw, 16px);
            margin: 16px 0 12px 0;
          }
          .header { 
            margin-bottom: 24px; 
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            padding: 20px;
            border-radius: 8px;
            color: white;
          }
          .header h1 {
            color: white;
            margin: 0 0 10px 0;
          }
          .header h2 {
            color: white;
            border-bottom: 1px solid rgba(255,255,255,0.2);
            margin: 0 0 15px 0;
          }
          .metadata { 
            color: rgba(255,255,255,0.9); 
            font-size: clamp(12px, 3vw, 14px); 
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
          }
          .filter-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
          }
          .filter-info p {
            margin: 5px 0;
            font-size: clamp(12px, 3vw, 14px);
            color: #334155;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 20px 0;
          }
          .stat-card {
            background: linear-gradient(135deg, #10B981 0%, #059669 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(16,185,129,0.3);
          }
          .stat-card h3 {
            color: white;
            margin: 0 0 8px 0;
            font-size: clamp(14px, 3.5vw, 16px);
          }
          .stat-card p {
            margin: 0;
            font-size: clamp(20px, 5vw, 28px);
            font-weight: bold;
          }
          .details-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            margin: 16px 0;
          }
          .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
          }
          .detail-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .detail-label {
            font-size: clamp(11px, 2.5vw, 12px);
            color: #64748b;
            margin-bottom: 4px;
          }
          .detail-value {
            font-size: clamp(14px, 3.5vw, 16px);
            font-weight: bold;
            color: #1e293b;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 16px 0;
            font-size: clamp(11px, 2.5vw, 13px);
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          th { 
            background-color: #10B981; 
            color: white; 
            padding: 12px 8px; 
            text-align: left;
            font-weight: 600;
          }
          td { 
            padding: 10px 8px; 
            border-bottom: 1px solid #e2e8f0;
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .positive { color: #10B981; }
          .negative { color: #EF4444; }
          .footer { 
            margin-top: 30px; 
            font-size: clamp(10px, 2.5vw, 12px); 
            color: #94a3b8; 
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .no-print {
            margin-top: 20px;
            text-align: center;
          }
          .no-print button {
            padding: 10px 24px;
            margin: 0 8px;
            border: none;
            border-radius: 6px;
            font-size: clamp(12px, 3vw, 14px);
            cursor: pointer;
            transition: all 0.2s;
          }
          .no-print button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          @media print {
            body { background: white; padding: 0; }
            .report-container { box-shadow: none; padding: 0; }
            .no-print { display: none; }
            .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .stat-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @media (max-width: 640px) {
            body { padding: 10px; }
            .report-container { padding: 15px; }
            .stats-grid { grid-template-columns: 1fr; }
            .details-grid { grid-template-columns: 1fr; }
            table { display: block; overflow-x: auto; white-space: nowrap; }
            .metadata { flex-direction: column; gap: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <h1>Sun Water Service</h1>
            <h2>Water Services Report</h2>
            <div class="metadata">
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Period:</strong> ${data.summary.period}</p>
              <p><strong>Date Range:</strong> ${formatDate(data.summary.date_range.from)} to ${formatDate(data.summary.date_range.to)}</p>
            </div>
          </div>

          <div class="filter-info">
            <p><strong>Filter Applied:</strong> ${getDateRangeDisplay()}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>Total Revenue</h3>
              <p>${formatCurrency(data.summary.water_services.income.total)}</p>
            </div>
            <div class="stat-card">
              <h3>Net Profit</h3>
              <p class="${data.summary.water_services.net_profit >= 0 ? 'positive' : 'negative'}">${formatCurrency(data.summary.water_services.net_profit)}</p>
            </div>
          </div>

          <h2>Revenue Details</h2>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Transactions</div>
              <div class="detail-value">${formatNumber(data.summary.water_services.income.transaction_count)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Unique Customers</div>
              <div class="detail-value">${formatNumber(data.summary.water_services.income.unique_customers)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Average Transaction</div>
              <div class="detail-value">${formatCurrency(data.summary.water_services.income.average)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Minimum Transaction</div>
              <div class="detail-value">${formatCurrency(data.summary.water_services.income.min)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Maximum Transaction</div>
              <div class="detail-value">${formatCurrency(data.summary.water_services.income.max)}</div>
            </div>
          </div>

          <h2>Expenses Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Expense Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Petrol</td>
                <td class="negative">${formatCurrency(data.summary.water_services.expenses.by_type.petrol)}</td>
              </tr>
              <tr>
                <td>Others</td>
                <td class="negative">${formatCurrency(data.summary.water_services.expenses.by_type.others)}</td>
              </tr>
              <tr>
                <td><strong>Total Expenses</strong></td>
                <td class="negative"><strong>${formatCurrency(data.summary.water_services.expenses.total)}</strong></td>
              </tr>
            </tbody>
          </table>

          <h2>Salaries Details</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Base Salary</td>
                <td class="negative">${formatCurrency(data.summary.water_services.salaries.base_salary)}</td>
              </tr>
              <tr>
                <td>Bonus</td>
                <td class="negative">${formatCurrency(data.summary.water_services.salaries.bonus)}</td>
              </tr>
              <tr>
                <td>Deductions</td>
                <td class="negative">${formatCurrency(data.summary.water_services.salaries.deductions)}</td>
              </tr>
              <tr>
                <td><strong>Total Salaries</strong></td>
                <td class="negative"><strong>${formatCurrency(data.summary.water_services.salaries.total)}</strong></td>
              </tr>
              <tr>
                <td>Staff Count</td>
                <td>${formatNumber(data.summary.water_services.salaries.unique_staff)}</td>
              </tr>
            </tbody>
          </table>

          <h2>Profit Summary</h2>
          <div class="details-card">
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Total Income</div>
                <div class="detail-value positive">${formatCurrency(data.summary.water_services.income.total)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Total Expenses</div>
                <div class="detail-value negative">${formatCurrency(data.summary.water_services.expenses.total)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Total Salaries</div>
                <div class="detail-value negative">${formatCurrency(data.summary.water_services.salaries.total)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Total Costs</div>
                <div class="detail-value negative">${formatCurrency(data.summary.water_services.total_costs)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Net Profit</div>
                <div class="detail-value ${data.summary.water_services.net_profit >= 0 ? 'positive' : 'negative'}">
                  ${formatCurrency(data.summary.water_services.net_profit)}
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Profit Margin</div>
                <div class="detail-value ${data.summary.water_services.net_profit >= 0 ? 'positive' : 'negative'}">
                  ${formatPercentage(data.summary.water_services.profit_margin)}
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value ${data.summary.water_services.profit_status === 'profit' ? 'positive' : 'negative'}">
                  ${data.summary.water_services.profit_status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Report generated from Sun Water Service System</p>
          </div>
          
          <div class="no-print">
            <button onclick="window.print()" style="background-color: #10B981; color: white;">Print</button>
            <button onclick="window.close()" style="background-color: #6B7280; color: white;">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Generate Inverter Services print content
  const generateInverterServicePrintContent = (data: RevenueResponse): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Inverter Services Report</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            margin: 0;
            padding: 20px;
            background: #f9fafb;
          }
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 24px;
          }
          h1 { 
            color: #1e293b; 
            font-size: clamp(20px, 5vw, 28px);
            margin: 0 0 8px 0;
          }
          h2 { 
            color: #F59E0B; 
            font-size: clamp(18px, 4vw, 24px); 
            margin: 24px 0 16px 0;
            border-bottom: 2px solid #F59E0B;
            padding-bottom: 8px;
          }
          h3 {
            color: #334155;
            font-size: clamp(14px, 3.5vw, 16px);
            margin: 16px 0 12px 0;
          }
          .header { 
            margin-bottom: 24px; 
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            padding: 20px;
            border-radius: 8px;
            color: white;
          }
          .header h1 {
            color: white;
            margin: 0 0 10px 0;
          }
          .header h2 {
            color: white;
            border-bottom: 1px solid rgba(255,255,255,0.2);
            margin: 0 0 15px 0;
          }
          .metadata { 
            color: rgba(255,255,255,0.9); 
            font-size: clamp(12px, 3vw, 14px); 
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
          }
          .filter-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
          }
          .filter-info p {
            margin: 5px 0;
            font-size: clamp(12px, 3vw, 14px);
            color: #334155;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 20px 0;
          }
          .stat-card {
            background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(245,158,11,0.3);
          }
          .stat-card h3 {
            color: white;
            margin: 0 0 8px 0;
            font-size: clamp(14px, 3.5vw, 16px);
          }
          .stat-card p {
            margin: 0;
            font-size: clamp(20px, 5vw, 28px);
            font-weight: bold;
          }
          .details-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            margin: 16px 0;
          }
          .details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
          }
          .detail-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .detail-label {
            font-size: clamp(11px, 2.5vw, 12px);
            color: #64748b;
            margin-bottom: 4px;
          }
          .detail-value {
            font-size: clamp(14px, 3.5vw, 16px);
            font-weight: bold;
            color: #1e293b;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 16px 0;
            font-size: clamp(11px, 2.5vw, 13px);
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          th { 
            background-color: #F59E0B; 
            color: white; 
            padding: 12px 8px; 
            text-align: left;
            font-weight: 600;
          }
          td { 
            padding: 10px 8px; 
            border-bottom: 1px solid #e2e8f0;
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .positive { color: #10B981; }
          .negative { color: #EF4444; }
          .footer { 
            margin-top: 30px; 
            font-size: clamp(10px, 2.5vw, 12px); 
            color: #94a3b8; 
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .no-print {
            margin-top: 20px;
            text-align: center;
          }
          .no-print button {
            padding: 10px 24px;
            margin: 0 8px;
            border: none;
            border-radius: 6px;
            font-size: clamp(12px, 3vw, 14px);
            cursor: pointer;
            transition: all 0.2s;
          }
          .no-print button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          @media print {
            body { background: white; padding: 0; }
            .report-container { box-shadow: none; padding: 0; }
            .no-print { display: none; }
            .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .stat-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @media (max-width: 640px) {
            body { padding: 10px; }
            .report-container { padding: 15px; }
            .stats-grid { grid-template-columns: 1fr; }
            .details-grid { grid-template-columns: 1fr; }
            table { display: block; overflow-x: auto; white-space: nowrap; }
            .metadata { flex-direction: column; gap: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <h1>Sun Water Service</h1>
            <h2>Inverter Services Report</h2>
            <div class="metadata">
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Period:</strong> ${data.summary.period}</p>
              <p><strong>Date Range:</strong> ${formatDate(data.summary.date_range.from)} to ${formatDate(data.summary.date_range.to)}</p>
            </div>
          </div>

          <div class="filter-info">
            <p><strong>Filter Applied:</strong> ${getDateRangeDisplay()}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <h3>Total Revenue</h3>
              <p>${formatCurrency(data.summary.inverter_services.income.total)}</p>
            </div>
            <div class="stat-card">
              <h3>Net Profit</h3>
              <p class="${data.summary.inverter_services.net_profit >= 0 ? 'positive' : 'negative'}">${formatCurrency(data.summary.inverter_services.net_profit)}</p>
            </div>
          </div>

          <h2>Revenue Details</h2>
          <div class="details-grid">
            <div class="detail-item">
              <div class="detail-label">Transactions</div>
              <div class="detail-value">${formatNumber(data.summary.inverter_services.income.transaction_count)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Unique Customers</div>
              <div class="detail-value">${formatNumber(data.summary.inverter_services.income.unique_customers)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Average Transaction</div>
              <div class="detail-value">${formatCurrency(data.summary.inverter_services.income.average)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Minimum Transaction</div>
              <div class="detail-value">${formatCurrency(data.summary.inverter_services.income.min)}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Maximum Transaction</div>
              <div class="detail-value">${formatCurrency(data.summary.inverter_services.income.max)}</div>
            </div>
          </div>

          <h2>Expenses Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Expense Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Petrol</td>
                <td class="negative">${formatCurrency(data.summary.inverter_services.expenses.by_type.petrol)}</td>
              </tr>
              <tr>
                <td>Others</td>
                <td class="negative">${formatCurrency(data.summary.inverter_services.expenses.by_type.others)}</td>
              </tr>
              <tr>
                <td><strong>Total Expenses</strong></td>
                <td class="negative"><strong>${formatCurrency(data.summary.inverter_services.expenses.total)}</strong></td>
              </tr>
            </tbody>
          </table>

          <h2>Salaries Details</h2>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Base Salary</td>
                <td class="negative">${formatCurrency(data.summary.inverter_services.salaries.base_salary)}</td>
              </tr>
              <tr>
                <td>Bonus</td>
                <td class="negative">${formatCurrency(data.summary.inverter_services.salaries.bonus)}</td>
              </tr>
              <tr>
                <td>Deductions</td>
                <td class="negative">${formatCurrency(data.summary.inverter_services.salaries.deductions)}</td>
              </tr>
              <tr>
                <td><strong>Total Salaries</strong></td>
                <td class="negative"><strong>${formatCurrency(data.summary.inverter_services.salaries.total)}</strong></td>
              </tr>
              <tr>
                <td>Staff Count</td>
                <td>${formatNumber(data.summary.inverter_services.salaries.unique_staff)}</td>
              </tr>
            </tbody>
          </table>

          <h2>Profit Summary</h2>
          <div class="details-card">
            <div class="details-grid">
              <div class="detail-item">
                <div class="detail-label">Total Income</div>
                <div class="detail-value positive">${formatCurrency(data.summary.inverter_services.income.total)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Total Expenses</div>
                <div class="detail-value negative">${formatCurrency(data.summary.inverter_services.expenses.total)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Total Salaries</div>
                <div class="detail-value negative">${formatCurrency(data.summary.inverter_services.salaries.total)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Total Costs</div>
                <div class="detail-value negative">${formatCurrency(data.summary.inverter_services.total_costs)}</div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Net Profit</div>
                <div class="detail-value ${data.summary.inverter_services.net_profit >= 0 ? 'positive' : 'negative'}">
                  ${formatCurrency(data.summary.inverter_services.net_profit)}
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Profit Margin</div>
                <div class="detail-value ${data.summary.inverter_services.net_profit >= 0 ? 'positive' : 'negative'}">
                  ${formatPercentage(data.summary.inverter_services.profit_margin)}
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-label">Status</div>
                <div class="detail-value ${data.summary.inverter_services.profit_status === 'profit' ? 'positive' : 'negative'}">
                  ${data.summary.inverter_services.profit_status.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div class="footer">
            <p>Report generated from Sun Water Service System</p>
          </div>
          
          <div class="no-print">
            <button onclick="window.print()" style="background-color: #F59E0B; color: white;">Print</button>
            <button onclick="window.close()" style="background-color: #6B7280; color: white;">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Export Water Services to CSV
  const exportWaterToCSV = () => {
    if (!revenueData) {
      alert('No data to export');
      return;
    }

    const fileName = `water_services_${formatDateForFilename()}.csv`;
    
    const headers = [
      'Metric',
      'Value'
    ];

    const rows = [
      ['Date Filter', getDateRangeDisplay()],
      ['Period', revenueData.summary.period],
      ['Date From', revenueData.summary.date_range.from],
      ['Date To', revenueData.summary.date_range.to],
      ['Total Revenue', revenueData.summary.water_services.income.total],
      ['Transactions', revenueData.summary.water_services.income.transaction_count],
      ['Unique Customers', revenueData.summary.water_services.income.unique_customers],
      ['Average Transaction', revenueData.summary.water_services.income.average],
      ['Minimum Transaction', revenueData.summary.water_services.income.min],
      ['Maximum Transaction', revenueData.summary.water_services.income.max],
      ['Petrol Expenses', revenueData.summary.water_services.expenses.by_type.petrol],
      ['Other Expenses', revenueData.summary.water_services.expenses.by_type.others],
      ['Total Expenses', revenueData.summary.water_services.expenses.total],
      ['Base Salary', revenueData.summary.water_services.salaries.base_salary],
      ['Bonus', revenueData.summary.water_services.salaries.bonus],
      ['Deductions', revenueData.summary.water_services.salaries.deductions],
      ['Total Salaries', revenueData.summary.water_services.salaries.total],
      ['Staff Count', revenueData.summary.water_services.salaries.unique_staff],
      ['Total Costs', revenueData.summary.water_services.total_costs],
      ['Net Profit', revenueData.summary.water_services.net_profit],
      ['Profit Margin', revenueData.summary.water_services.profit_margin],
      ['Profit Status', revenueData.summary.water_services.profit_status]
    ];

    generateCSV(headers, rows, fileName);
    
    // Close export options on mobile
    if (isMobile) {
      setShowWaterExportOptions(false);
    }
  };

  // Export Inverter Services to CSV
  const exportInverterToCSV = () => {
    if (!revenueData) {
      alert('No data to export');
      return;
    }

    const fileName = `inverter_services_${formatDateForFilename()}.csv`;
    
    const headers = [
      'Metric',
      'Value'
    ];

    const rows = [
      ['Date Filter', getDateRangeDisplay()],
      ['Period', revenueData.summary.period],
      ['Date From', revenueData.summary.date_range.from],
      ['Date To', revenueData.summary.date_range.to],
      ['Total Revenue', revenueData.summary.inverter_services.income.total],
      ['Transactions', revenueData.summary.inverter_services.income.transaction_count],
      ['Unique Customers', revenueData.summary.inverter_services.income.unique_customers],
      ['Average Transaction', revenueData.summary.inverter_services.income.average],
      ['Minimum Transaction', revenueData.summary.inverter_services.income.min],
      ['Maximum Transaction', revenueData.summary.inverter_services.income.max],
      ['Petrol Expenses', revenueData.summary.inverter_services.expenses.by_type.petrol],
      ['Other Expenses', revenueData.summary.inverter_services.expenses.by_type.others],
      ['Total Expenses', revenueData.summary.inverter_services.expenses.total],
      ['Base Salary', revenueData.summary.inverter_services.salaries.base_salary],
      ['Bonus', revenueData.summary.inverter_services.salaries.bonus],
      ['Deductions', revenueData.summary.inverter_services.salaries.deductions],
      ['Total Salaries', revenueData.summary.inverter_services.salaries.total],
      ['Staff Count', revenueData.summary.inverter_services.salaries.unique_staff],
      ['Total Costs', revenueData.summary.inverter_services.total_costs],
      ['Net Profit', revenueData.summary.inverter_services.net_profit],
      ['Profit Margin', revenueData.summary.inverter_services.profit_margin],
      ['Profit Status', revenueData.summary.inverter_services.profit_status]
    ];

    generateCSV(headers, rows, fileName);
    
    // Close export options on mobile
    if (isMobile) {
      setShowInverterExportOptions(false);
    }
  };

  // Export Water Services to PDF
  const exportWaterToPDF = () => {
    if (!revenueData) {
      alert('No data to export');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add decorative header
      doc.setFillColor(16, 185, 129); // Green
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SUN OFFICE', 14, 13);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Water Services Report', 14, 18);

      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Water Services - Detailed Report', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
      
      // Add metadata
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 40;
      
      doc.text(`Filter: ${getDateRangeDisplay()}`, 14, yPos);
      yPos += 6;
      doc.text(`Period: ${revenueData.summary.period}`, 14, yPos);
      yPos += 6;
      doc.text(`Date Range: ${formatDate(revenueData.summary.date_range.from)} to ${formatDate(revenueData.summary.date_range.to)}`, 14, yPos);
      yPos += 6;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
      yPos += 15;

      // Revenue Overview
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Revenue Overview', 14, yPos);
      yPos += 8;

      const revenueData2 = [
        ['Total Revenue', formatCurrency(revenueData.summary.water_services.income.total)],
        ['Transactions', formatNumber(revenueData.summary.water_services.income.transaction_count)],
        ['Unique Customers', formatNumber(revenueData.summary.water_services.income.unique_customers)],
        ['Average Transaction', formatCurrency(revenueData.summary.water_services.income.average)],
        ['Minimum Transaction', formatCurrency(revenueData.summary.water_services.income.min)],
        ['Maximum Transaction', formatCurrency(revenueData.summary.water_services.income.max)]
      ];

      autoTable(doc, {
        body: revenueData2,
        startY: yPos,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 60, halign: 'right' }
        },
        margin: { left: 14 }
      });

      yPos = (doc as any).lastAutoTable?.finalY + 15;

      // Expenses Breakdown
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Expenses Breakdown', 14, yPos);
      yPos += 8;

      const expenseData = [
        ['Petrol', formatCurrency(revenueData.summary.water_services.expenses.by_type.petrol)],
        ['Others', formatCurrency(revenueData.summary.water_services.expenses.by_type.others)],
        ['Total Expenses', formatCurrency(revenueData.summary.water_services.expenses.total)]
      ];

      autoTable(doc, {
        body: expenseData,
        startY: yPos,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 60, halign: 'right' }
        },
        margin: { left: 14 }
      });

      yPos = (doc as any).lastAutoTable?.finalY + 15;

      // Salaries Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Salaries Details', 14, yPos);
      yPos += 8;

      const salaryData = [
        ['Base Salary', formatCurrency(revenueData.summary.water_services.salaries.base_salary)],
        ['Bonus', formatCurrency(revenueData.summary.water_services.salaries.bonus)],
        ['Deductions', formatCurrency(revenueData.summary.water_services.salaries.deductions)],
        ['Total Salaries', formatCurrency(revenueData.summary.water_services.salaries.total)],
        ['Staff Count', formatNumber(revenueData.summary.water_services.salaries.unique_staff)]
      ];

      autoTable(doc, {
        body: salaryData,
        startY: yPos,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 60, halign: 'right' }
        },
        margin: { left: 14 }
      });

      yPos = (doc as any).lastAutoTable?.finalY + 15;

      // Profit Summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Profit Summary', 14, yPos);
      yPos += 8;

      const profitData = [
        ['Total Income', formatCurrency(revenueData.summary.water_services.income.total)],
        ['Total Expenses', formatCurrency(revenueData.summary.water_services.expenses.total)],
        ['Total Salaries', formatCurrency(revenueData.summary.water_services.salaries.total)],
        ['Total Costs', formatCurrency(revenueData.summary.water_services.total_costs)],
        ['Net Profit', formatCurrency(revenueData.summary.water_services.net_profit)],
        ['Profit Margin', formatPercentage(revenueData.summary.water_services.profit_margin)],
        ['Status', revenueData.summary.water_services.profit_status.toUpperCase()]
      ];

      autoTable(doc, {
        body: profitData,
        startY: yPos,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 60, halign: 'right' }
        },
        margin: { left: 14 }
      });

      // Add footer
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'This is a computer generated document - valid without signature',
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );

      // Save PDF
      const fileName = `water_services_${formatDateForFilename()}.pdf`;
      doc.save(fileName);
      
      if (isMobile) {
        setShowWaterExportOptions(false);
      }
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to export PDF. Please check if jspdf and jspdf-autotable are installed.');
    }
  };

  // Export Inverter Services to PDF
  const exportInverterToPDF = () => {
    if (!revenueData) {
      alert('No data to export');
      return;
    }

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add decorative header
      doc.setFillColor(245, 158, 11); // Orange
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('SUN OFFICE', 14, 13);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Inverter Services Report', 14, 18);

      // Reset text color
      doc.setTextColor(0, 0, 0);
      
      // Add title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Inverter Services - Detailed Report', doc.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
      
      // Add metadata
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      let yPos = 40;
      
      doc.text(`Filter: ${getDateRangeDisplay()}`, 14, yPos);
      yPos += 6;
      doc.text(`Period: ${revenueData.summary.period}`, 14, yPos);
      yPos += 6;
      doc.text(`Date Range: ${formatDate(revenueData.summary.date_range.from)} to ${formatDate(revenueData.summary.date_range.to)}`, 14, yPos);
      yPos += 6;
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
      yPos += 15;

      // Revenue Overview
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Revenue Overview', 14, yPos);
      yPos += 8;

      const revenueData2 = [
        ['Total Revenue', formatCurrency(revenueData.summary.inverter_services.income.total)],
        ['Transactions', formatNumber(revenueData.summary.inverter_services.income.transaction_count)],
        ['Unique Customers', formatNumber(revenueData.summary.inverter_services.income.unique_customers)],
        ['Average Transaction', formatCurrency(revenueData.summary.inverter_services.income.average)],
        ['Minimum Transaction', formatCurrency(revenueData.summary.inverter_services.income.min)],
        ['Maximum Transaction', formatCurrency(revenueData.summary.inverter_services.income.max)]
      ];

      autoTable(doc, {
        body: revenueData2,
        startY: yPos,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 60, halign: 'right' }
        },
        margin: { left: 14 }
      });

      yPos = (doc as any).lastAutoTable?.finalY + 15;

      // Expenses Breakdown
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Expenses Breakdown', 14, yPos);
      yPos += 8;

      const expenseData = [
        ['Petrol', formatCurrency(revenueData.summary.inverter_services.expenses.by_type.petrol)],
        ['Others', formatCurrency(revenueData.summary.inverter_services.expenses.by_type.others)],
        ['Total Expenses', formatCurrency(revenueData.summary.inverter_services.expenses.total)]
      ];

      autoTable(doc, {
        body: expenseData,
        startY: yPos,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 60, halign: 'right' }
        },
        margin: { left: 14 }
      });

      yPos = (doc as any).lastAutoTable?.finalY + 15;

      // Salaries Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Salaries Details', 14, yPos);
      yPos += 8;

      const salaryData = [
        ['Base Salary', formatCurrency(revenueData.summary.inverter_services.salaries.base_salary)],
        ['Bonus', formatCurrency(revenueData.summary.inverter_services.salaries.bonus)],
        ['Deductions', formatCurrency(revenueData.summary.inverter_services.salaries.deductions)],
        ['Total Salaries', formatCurrency(revenueData.summary.inverter_services.salaries.total)],
        ['Staff Count', formatNumber(revenueData.summary.inverter_services.salaries.unique_staff)]
      ];

      autoTable(doc, {
        body: salaryData,
        startY: yPos,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 60, halign: 'right' }
        },
        margin: { left: 14 }
      });

      yPos = (doc as any).lastAutoTable?.finalY + 15;

      // Profit Summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Profit Summary', 14, yPos);
      yPos += 8;

      const profitData = [
        ['Total Income', formatCurrency(revenueData.summary.inverter_services.income.total)],
        ['Total Expenses', formatCurrency(revenueData.summary.inverter_services.expenses.total)],
        ['Total Salaries', formatCurrency(revenueData.summary.inverter_services.salaries.total)],
        ['Total Costs', formatCurrency(revenueData.summary.inverter_services.total_costs)],
        ['Net Profit', formatCurrency(revenueData.summary.inverter_services.net_profit)],
        ['Profit Margin', formatPercentage(revenueData.summary.inverter_services.profit_margin)],
        ['Status', revenueData.summary.inverter_services.profit_status.toUpperCase()]
      ];

      autoTable(doc, {
        body: profitData,
        startY: yPos,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 70 },
          1: { cellWidth: 60, halign: 'right' }
        },
        margin: { left: 14 }
      });

      // Add footer
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'This is a computer generated document - valid without signature',
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );

      // Save PDF
      const fileName = `inverter_services_${formatDateForFilename()}.pdf`;
      doc.save(fileName);
      
      if (isMobile) {
        setShowInverterExportOptions(false);
      }
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to export PDF. Please check if jspdf and jspdf-autotable are installed.');
    }
  };

  // Print function
  const handlePrint = () => {
    if (!revenueData) {
      alert('No data to print');
      return;
    }
    
    // Create print window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to print');
      return;
    }
    
    // Generate print content based on current view mode
    let content = '';
    
    if (viewMode === 'summary') {
      content = generateSummaryPrintContent(revenueData);
    } else if (viewMode === 'comparison') {
      content = generateComparisonPrintContent(revenueData);
    } else if (viewMode === 'profit') {
      content = generateProfitPrintContent(revenueData);
    }
    
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Close export options on mobile
    if (isMobile) {
      setShowExportOptions(false);
    }
  };

  // Generate summary print content
  const generateSummaryPrintContent = (data: RevenueResponse): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Revenue Summary Report</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            margin: 0;
            padding: 20px;
            background: #f9fafb;
          }
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 24px;
          }
          h1 { 
            color: #1e293b; 
            font-size: clamp(20px, 5vw, 28px);
            margin: 0 0 8px 0;
          }
          h2 { 
            color: #667eea; 
            font-size: clamp(16px, 4vw, 20px); 
            margin: 24px 0 16px 0;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
          }
          h3 {
            color: #334155;
            font-size: clamp(14px, 3.5vw, 16px);
            margin: 16px 0 12px 0;
          }
          .header { 
            margin-bottom: 24px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 8px;
            color: white;
          }
          .header h1 {
            color: white;
            margin: 0 0 10px 0;
          }
          .metadata { 
            color: rgba(255,255,255,0.9); 
            font-size: clamp(12px, 3vw, 14px); 
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
          }
          .filter-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
          }
          .filter-info p {
            margin: 5px 0;
            font-size: clamp(12px, 3vw, 14px);
            color: #334155;
          }
          .cards-container { 
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
            margin: 24px 0;
          }
          .card { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(102,126,234,0.3);
          }
          .card h3 {
            color: white;
            margin: 0 0 8px 0;
            font-size: clamp(14px, 3.5vw, 16px);
          }
          .card p {
            margin: 0;
            font-size: clamp(20px, 5vw, 28px);
            font-weight: bold;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            margin: 16px 0;
          }
          .stat-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .stat-label {
            font-size: clamp(11px, 2.5vw, 12px);
            color: #64748b;
            margin-bottom: 4px;
          }
          .stat-value {
            font-size: clamp(14px, 3.5vw, 16px);
            font-weight: bold;
            color: #1e293b;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 16px 0;
            font-size: clamp(11px, 2.5vw, 13px);
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          th { 
            background-color: #667eea; 
            color: white; 
            padding: 12px 8px; 
            text-align: left;
            font-weight: 600;
          }
          td { 
            padding: 10px 8px; 
            border-bottom: 1px solid #e2e8f0;
          }
          tr:last-child td {
            border-bottom: none;
          }
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .service-card {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 20px;
            margin: 16px 0;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .profit { color: #10B981; font-weight: bold; }
          .loss { color: #EF4444; font-weight: bold; }
          .footer { 
            margin-top: 30px; 
            font-size: clamp(10px, 2.5vw, 12px); 
            color: #94a3b8; 
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .no-print {
            margin-top: 20px;
            text-align: center;
          }
          .no-print button {
            padding: 10px 24px;
            margin: 0 8px;
            border: none;
            border-radius: 6px;
            font-size: clamp(12px, 3vw, 14px);
            cursor: pointer;
            transition: all 0.2s;
          }
          @media print {
            body { background: white; padding: 0; }
            .report-container { box-shadow: none; padding: 0; }
            .no-print { display: none; }
            .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @media (max-width: 640px) {
            body { padding: 10px; }
            .report-container { padding: 15px; }
            .cards-container { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: 1fr; }
            table { display: block; overflow-x: auto; white-space: nowrap; }
            .metadata { flex-direction: column; gap: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <h1>Sun Water Service - Revenue Summary Report</h1>
            <div class="metadata">
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Period:</strong> ${data.summary.period}</p>
              <p><strong>Date Range:</strong> ${formatDate(data.summary.date_range.from)} to ${formatDate(data.summary.date_range.to)}</p>
            </div>
          </div>

          <div class="filter-info">
            <p><strong>Filter Applied:</strong> ${getDateRangeDisplay()}</p>
          </div>

          <div class="cards-container">
            <div class="card">
              <h3>Total Revenue</h3>
              <p>${formatCurrency(data.summary.overall.total_income)}</p>
            </div>
            <div class="card">
              <h3>Total Expenses</h3>
              <p>${formatCurrency(data.summary.overall.total_expenses)}</p>
            </div>
            <div class="card">
              <h3>Net Profit</h3>
              <p class="${data.summary.overall.is_profitable ? 'profit' : 'loss'}">${formatCurrency(data.summary.overall.net_profit)}</p>
            </div>
          </div>

          <h2>Revenue Overview</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Total Transactions</div>
              <div class="stat-value">${formatNumber(data.summary.overall.total_transactions)}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Paid Transactions</div>
              <div class="stat-value">${formatNumber(data.summary.overall.paid_transactions)}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Unique Customers</div>
              <div class="stat-value">${formatNumber(data.summary.overall.unique_customers)}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Water Services</div>
              <div class="stat-value">${formatNumber(data.summary.water_services.income.transaction_count)}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Inverter Services</div>
              <div class="stat-value">${formatNumber(data.summary.inverter_services.income.transaction_count)}</div>
            </div>
          </div>

          <h2>Expenses Breakdown</h2>
          <div style="overflow-x: auto;">
            <table>
              <thead>
                <tr>
                  <th>Expense Type</th>
                  <th>Water Services</th>
                  <th>Inverter Services</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Petrol</strong></td>
                  <td>${formatCurrency(data.summary.water_services.expenses.by_type.petrol)}</td>
                  <td>${formatCurrency(data.summary.inverter_services.expenses.by_type.petrol)}</td>
                  <td>${formatCurrency(data.summary.water_services.expenses.by_type.petrol + data.summary.inverter_services.expenses.by_type.petrol)}</td>
                </tr>
                <tr>
                  <td><strong>Others</strong></td>
                  <td>${formatCurrency(data.summary.water_services.expenses.by_type.others)}</td>
                  <td>${formatCurrency(data.summary.inverter_services.expenses.by_type.others)}</td>
                  <td>${formatCurrency(data.summary.water_services.expenses.by_type.others + data.summary.inverter_services.expenses.by_type.others)}</td>
                </tr>
                <tr>
                  <td><strong>Total Expenses</strong></td>
                  <td><strong>${formatCurrency(data.summary.water_services.expenses.total)}</strong></td>
                  <td><strong>${formatCurrency(data.summary.inverter_services.expenses.total)}</strong></td>
                  <td><strong>${formatCurrency(data.summary.overall.total_expenses)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Service Details</h2>
          
          <div class="service-card">
            <h3>Water Services</h3>
            <p><strong>Revenue:</strong> ${formatCurrency(data.summary.water_services.income.total)}</p>
            <p><strong>Transactions:</strong> ${formatNumber(data.summary.water_services.income.transaction_count)}</p>
            <p><strong>Customers:</strong> ${formatNumber(data.summary.water_services.income.unique_customers)}</p>
            <p><strong>Expenses:</strong> ${formatCurrency(data.summary.water_services.expenses.total)}</p>
            <p><strong>Salaries:</strong> ${formatCurrency(data.summary.water_services.salaries.total)}</p>
            <p><strong>Net Profit:</strong> <span class="${data.summary.water_services.profit_status === 'profit' ? 'profit' : 'loss'}">${formatCurrency(data.summary.water_services.net_profit)}</span></p>
            <p><strong>Profit Margin:</strong> ${formatPercentage(data.summary.water_services.profit_margin)}</p>
          </div>

          <div class="service-card">
            <h3>Inverter Services</h3>
            <p><strong>Revenue:</strong> ${formatCurrency(data.summary.inverter_services.income.total)}</p>
            <p><strong>Transactions:</strong> ${formatNumber(data.summary.inverter_services.income.transaction_count)}</p>
            <p><strong>Customers:</strong> ${formatNumber(data.summary.inverter_services.income.unique_customers)}</p>
            <p><strong>Expenses:</strong> ${formatCurrency(data.summary.inverter_services.expenses.total)}</p>
            <p><strong>Salaries:</strong> ${formatCurrency(data.summary.inverter_services.salaries.total)}</p>
            <p><strong>Net Profit:</strong> <span class="${data.summary.inverter_services.profit_status === 'profit' ? 'profit' : 'loss'}">${formatCurrency(data.summary.inverter_services.net_profit)}</span></p>
            <p><strong>Profit Margin:</strong> ${formatPercentage(data.summary.inverter_services.profit_margin)}</p>
          </div>

          <div class="footer">
            <p>Report generated from Sun Water Service System</p>
          </div>
          
          <div class="no-print">
            <button onclick="window.print()" style="background-color: #667eea; color: white;">Print</button>
            <button onclick="window.close()" style="background-color: #6B7280; color: white;">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Generate comparison print content
  const generateComparisonPrintContent = (data: RevenueResponse): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Service Comparison Report</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            margin: 0;
            padding: 20px;
            background: #f9fafb;
          }
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 24px;
          }
          h1 { 
            color: #1e293b; 
            font-size: clamp(20px, 5vw, 28px);
            margin: 0 0 8px 0;
          }
          h2 { 
            color: #667eea; 
            font-size: clamp(16px, 4vw, 20px); 
            margin: 24px 0 16px 0;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
          }
          h3 {
            color: #334155;
            font-size: clamp(14px, 3.5vw, 16px);
            margin: 16px 0 12px 0;
          }
          .header { 
            margin-bottom: 24px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 8px;
            color: white;
          }
          .header h1 {
            color: white;
            margin: 0 0 10px 0;
          }
          .metadata { 
            color: rgba(255,255,255,0.9); 
            font-size: clamp(12px, 3vw, 14px); 
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
          }
          .filter-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
          }
          .filter-info p {
            margin: 5px 0;
            font-size: clamp(12px, 3vw, 14px);
            color: #334155;
          }
          .comparison-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: clamp(11px, 2.5vw, 13px);
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .comparison-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
          }
          .comparison-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .comparison-table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .profit { color: #10B981; font-weight: bold; }
          .loss { color: #EF4444; font-weight: bold; }
          .breakdown-section {
            margin: 20px 0;
            padding: 20px;
            background: #f8fafc;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
          }
          .progress-bar-container {
            width: 100%;
            height: 20px;
            background-color: #e2e8f0;
            border-radius: 10px;
            margin: 8px 0;
            overflow: hidden;
          }
          .progress-bar {
            height: 20px;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
          }
          .distribution-item {
            margin: 15px 0;
          }
          .distribution-item span {
            font-size: clamp(12px, 3vw, 14px);
            font-weight: 500;
            color: #334155;
          }
          .footer { 
            margin-top: 30px; 
            font-size: clamp(10px, 2.5vw, 12px); 
            color: #94a3b8; 
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .no-print {
            margin-top: 20px;
            text-align: center;
          }
          .no-print button {
            padding: 10px 24px;
            margin: 0 8px;
            border: none;
            border-radius: 6px;
            font-size: clamp(12px, 3vw, 14px);
            cursor: pointer;
            transition: all 0.2s;
          }
          @media print {
            body { background: white; padding: 0; }
            .report-container { box-shadow: none; padding: 0; }
            .no-print { display: none; }
            .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @media (max-width: 640px) {
            body { padding: 10px; }
            .report-container { padding: 15px; }
            .comparison-table { display: block; overflow-x: auto; white-space: nowrap; }
            .metadata { flex-direction: column; gap: 5px; }
            .breakdown-section { padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <h1>Sun Water Service - Service Comparison Report</h1>
            <div class="metadata">
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Period:</strong> ${data.summary.period}</p>
              <p><strong>Date Range:</strong> ${formatDate(data.summary.date_range.from)} to ${formatDate(data.summary.date_range.to)}</p>
            </div>
          </div>

          <div class="filter-info">
            <p><strong>Filter Applied:</strong> ${getDateRangeDisplay()}</p>
          </div>

          <h2>Service Comparison</h2>
          <div style="overflow-x: auto;">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Water Services</th>
                  <th>Inverter Services</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Revenue</strong></td>
                  <td>${formatCurrency(data.summary.water_services.income.total)}</td>
                  <td>${formatCurrency(data.summary.inverter_services.income.total)}</td>
                  <td>${formatCurrency(data.summary.overall.total_income)}</td>
                </tr>
                <tr>
                  <td>Transactions</td>
                  <td>${formatNumber(data.summary.water_services.income.transaction_count)}</td>
                  <td>${formatNumber(data.summary.inverter_services.income.transaction_count)}</td>
                  <td>${formatNumber(data.summary.overall.total_transactions)}</td>
                </tr>
                <tr>
                  <td>Customers</td>
                  <td>${formatNumber(data.summary.water_services.income.unique_customers)}</td>
                  <td>${formatNumber(data.summary.inverter_services.income.unique_customers)}</td>
                  <td>${formatNumber(data.summary.overall.unique_customers)}</td>
                </tr>
                <tr>
                  <td>Average Transaction</td>
                  <td>${formatCurrency(data.summary.water_services.income.average)}</td>
                  <td>${formatCurrency(data.summary.inverter_services.income.average)}</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td><strong>Expenses</strong></td>
                  <td>${formatCurrency(data.summary.water_services.expenses.total)}</td>
                  <td>${formatCurrency(data.summary.inverter_services.expenses.total)}</td>
                  <td>${formatCurrency(data.summary.overall.total_expenses)}</td>
                </tr>
                <tr>
                  <td><strong>Salaries</strong></td>
                  <td>${formatCurrency(data.summary.water_services.salaries.total)}</td>
                  <td>${formatCurrency(data.summary.inverter_services.salaries.total)}</td>
                  <td>${formatCurrency(data.summary.overall.total_salaries)}</td>
                </tr>
                <tr>
                  <td><strong>Total Costs</strong></td>
                  <td>${formatCurrency(data.summary.water_services.total_costs)}</td>
                  <td>${formatCurrency(data.summary.inverter_services.total_costs)}</td>
                  <td>${formatCurrency(data.summary.overall.total_costs)}</td>
                </tr>
                <tr>
                  <td><strong>Net Profit</strong></td>
                  <td class="${data.summary.water_services.profit_status === 'profit' ? 'profit' : 'loss'}">${formatCurrency(data.summary.water_services.net_profit)}</td>
                  <td class="${data.summary.inverter_services.profit_status === 'profit' ? 'profit' : 'loss'}">${formatCurrency(data.summary.inverter_services.net_profit)}</td>
                  <td class="${data.summary.overall.is_profitable ? 'profit' : 'loss'}">${formatCurrency(data.summary.overall.net_profit)}</td>
                </tr>
                <tr>
                  <td><strong>Profit Margin</strong></td>
                  <td>${formatPercentage(data.summary.water_services.profit_margin)}</td>
                  <td>${formatPercentage(data.summary.inverter_services.profit_margin)}</td>
                  <td>${formatPercentage(data.summary.overall.profit_margin)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Revenue Distribution</h2>
          <div class="breakdown-section">
            <div class="distribution-item">
              <span>Water Services: ${formatPercentage(data.profit_analysis.service_type_breakdown.water_services.income_percentage)}</span>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${data.profit_analysis.service_type_breakdown.water_services.income_percentage}%"></div>
              </div>
            </div>
            <div class="distribution-item">
              <span>Inverter Services: ${formatPercentage(data.profit_analysis.service_type_breakdown.inverter_services.income_percentage)}</span>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${data.profit_analysis.service_type_breakdown.inverter_services.income_percentage}%"></div>
              </div>
            </div>
          </div>

          <h2>Cost Distribution</h2>
          <div class="breakdown-section">
            <div class="distribution-item">
              <span>Water Services: ${formatPercentage(data.profit_analysis.service_type_breakdown.water_services.costs_percentage)}</span>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${data.profit_analysis.service_type_breakdown.water_services.costs_percentage}%"></div>
              </div>
            </div>
            <div class="distribution-item">
              <span>Inverter Services: ${formatPercentage(data.profit_analysis.service_type_breakdown.inverter_services.costs_percentage)}</span>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: ${data.profit_analysis.service_type_breakdown.inverter_services.costs_percentage}%"></div>
              </div>
            </div>
          </div>

          <h2>Profit Contribution</h2>
          <div style="overflow-x: auto;">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Net Profit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Water Services</td>
                  <td class="${data.summary.water_services.profit_status === 'profit' ? 'profit' : 'loss'}">${formatCurrency(data.summary.water_services.net_profit)}</td>
                  <td>${data.summary.water_services.profit_status.toUpperCase()}</td>
                </tr>
                <tr>
                  <td>Inverter Services</td>
                  <td class="${data.summary.inverter_services.profit_status === 'profit' ? 'profit' : 'loss'}">${formatCurrency(data.summary.inverter_services.net_profit)}</td>
                  <td>${data.summary.inverter_services.profit_status.toUpperCase()}</td>
                </tr>
                <tr>
                  <td><strong>Total</strong></td>
                  <td class="${data.summary.overall.is_profitable ? 'profit' : 'loss'}"><strong>${formatCurrency(data.summary.overall.net_profit)}</strong></td>
                  <td>${data.summary.overall.profit_status.toUpperCase()}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Report generated from Sun Water Service System</p>
          </div>
          
          <div class="no-print">
            <button onclick="window.print()" style="background-color: #667eea; color: white;">Print</button>
            <button onclick="window.close()" style="background-color: #6B7280; color: white;">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Generate profit analysis print content
  const generateProfitPrintContent = (data: RevenueResponse): string => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Profit Analysis Report</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            margin: 0;
            padding: 20px;
            background: #f9fafb;
          }
          .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            padding: 24px;
          }
          h1 { 
            color: #1e293b; 
            font-size: clamp(20px, 5vw, 28px);
            margin: 0 0 8px 0;
          }
          h2 { 
            color: #667eea; 
            font-size: clamp(16px, 4vw, 20px); 
            margin: 24px 0 16px 0;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
          }
          h3 {
            color: #334155;
            font-size: clamp(14px, 3.5vw, 16px);
            margin: 16px 0 12px 0;
          }
          .header { 
            margin-bottom: 24px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            border-radius: 8px;
            color: white;
          }
          .header h1 {
            color: white;
            margin: 0 0 10px 0;
          }
          .metadata { 
            color: rgba(255,255,255,0.9); 
            font-size: clamp(12px, 3vw, 14px); 
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
          }
          .filter-info {
            background: #f8fafc;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #e2e8f0;
          }
          .filter-info p {
            margin: 5px 0;
            font-size: clamp(12px, 3vw, 14px);
            color: #334155;
          }
          .profit-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 10px;
            margin: 24px 0;
            box-shadow: 0 4px 6px rgba(102,126,234,0.3);
          }
          .profit-card h2 {
            color: white;
            border-bottom: 1px solid rgba(255,255,255,0.2);
            padding-bottom: 10px;
            margin-top: 0;
          }
          .profit-card p {
            margin: 10px 0;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin: 20px 0;
          }
          .stat-box {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }
          .stat-label {
            font-size: clamp(11px, 2.5vw, 12px);
            color: #64748b;
            margin-bottom: 8px;
          }
          .stat-value {
            font-size: clamp(16px, 4vw, 20px);
            font-weight: bold;
            color: #1e293b;
          }
          .breakdown-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: clamp(11px, 2.5vw, 13px);
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .breakdown-table th {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 8px;
            text-align: left;
          }
          .breakdown-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          .breakdown-table tr:nth-child(even) {
            background-color: #f8fafc;
          }
          .positive { color: #10B981; }
          .negative { color: #EF4444; }
          .footer { 
            margin-top: 30px; 
            font-size: clamp(10px, 2.5vw, 12px); 
            color: #94a3b8; 
            text-align: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
          }
          .no-print {
            margin-top: 20px;
            text-align: center;
          }
          .no-print button {
            padding: 10px 24px;
            margin: 0 8px;
            border: none;
            border-radius: 6px;
            font-size: clamp(12px, 3vw, 14px);
            cursor: pointer;
            transition: all 0.2s;
          }
          @media print {
            body { background: white; padding: 0; }
            .report-container { box-shadow: none; padding: 0; }
            .no-print { display: none; }
            .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .profit-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          @media (max-width: 640px) {
            body { padding: 10px; }
            .report-container { padding: 15px; }
            .stats-grid { grid-template-columns: 1fr; }
            .breakdown-table { display: block; overflow-x: auto; white-space: nowrap; }
            .metadata { flex-direction: column; gap: 5px; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <div class="header">
            <h1>Sun Water Service - Profit Analysis Report</h1>
            <div class="metadata">
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Period:</strong> ${data.summary.period}</p>
              <p><strong>Date Range:</strong> ${formatDate(data.summary.date_range.from)} to ${formatDate(data.summary.date_range.to)}</p>
            </div>
          </div>

          <div class="filter-info">
            <p><strong>Filter Applied:</strong> ${getDateRangeDisplay()}</p>
          </div>

          <div class="profit-card">
            <h2>Overall Profit Status</h2>
            <p style="font-size: clamp(24px, 6vw, 36px); margin: 10px 0; font-weight: bold;">${formatCurrency(data.summary.overall.net_profit)}</p>
            <p style="font-size: clamp(14px, 3.5vw, 16px;">Margin: ${formatPercentage(data.summary.overall.profit_margin)}</p>
            <p style="font-size: clamp(14px, 3.5vw, 16px;">Status: ${data.summary.overall.profit_status.toUpperCase()}</p>
          </div>

          <h2>Revenue vs Costs Analysis</h2>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="stat-label">Revenue %</div>
              <div class="stat-value">${formatPercentage(data.profit_analysis.revenue_vs_costs.income_percentage)}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Expenses %</div>
              <div class="stat-value">${formatPercentage(data.profit_analysis.revenue_vs_costs.expenses_percentage)}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Salaries %</div>
              <div class="stat-value">${formatPercentage(data.profit_analysis.revenue_vs_costs.salaries_percentage)}</div>
            </div>
            <div class="stat-box">
              <div class="stat-label">Profit %</div>
              <div class="stat-value ${data.summary.overall.is_profitable ? 'positive' : 'negative'}">${formatPercentage(data.profit_analysis.revenue_vs_costs.profit_percentage)}</div>
            </div>
          </div>

          <h2>Break-even Analysis</h2>
          <div style="overflow-x: auto;">
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Current Revenue</strong></td>
                  <td>${formatCurrency(data.profit_analysis.break_even_point.current_income)}</td>
                </tr>
                <tr>
                  <td><strong>Needed Revenue</strong></td>
                  <td>${formatCurrency(data.profit_analysis.break_even_point.needed_income)}</td>
                </tr>
                <tr>
                  <td><strong>Gap</strong></td>
                  <td class="${data.profit_analysis.break_even_point.gap <= 0 ? 'positive' : 'negative'}">
                    ${formatCurrency(Math.abs(data.profit_analysis.break_even_point.gap))}
                    (${data.profit_analysis.break_even_point.gap <= 0 ? 'Surplus' : 'Deficit'})
                  </td>
                </tr>
                <tr>
                  <td><strong>Status</strong></td>
                  <td class="${data.profit_analysis.break_even_point.is_profitable ? 'positive' : 'negative'}">
                    ${data.profit_analysis.break_even_point.is_profitable ? 'Profitable' : 'Not Profitable'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Cost Breakdown</h2>
          <div style="overflow-x: auto;">
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Revenue</strong></td>
                  <td class="positive">${formatCurrency(data.summary.overall.total_income)}</td>
                </tr>
                <tr>
                  <td><strong>Expenses</strong></td>
                  <td class="negative">- ${formatCurrency(data.summary.overall.total_expenses)}</td>
                </tr>
                <tr>
                  <td><strong>Salaries</strong></td>
                  <td class="negative">- ${formatCurrency(data.summary.overall.total_salaries)}</td>
                </tr>
                <tr>
                  <td><strong>Total Costs</strong></td>
                  <td class="negative"><strong>- ${formatCurrency(data.summary.overall.total_costs)}</strong></td>
                </tr>
                <tr>
                  <td><strong>Net Profit/Loss</strong></td>
                  <td class="${data.summary.overall.is_profitable ? 'positive' : 'negative'}">
                    <strong>${data.summary.overall.is_profitable ? '' : '-'}${formatCurrency(Math.abs(data.summary.overall.net_profit))}</strong>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>Report generated from Sun Water Service System</p>
          </div>
          
          <div class="no-print">
            <button onclick="window.print()" style="background-color: #667eea; color: white;">Print</button>
            <button onclick="window.close()" style="background-color: #6B7280; color: white;">Close</button>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!revenueData) {
      alert('No data to export');
      return;
    }

    let headers: string[] = [];
    let rows: any[][] = [];
    let fileName = '';

    if (viewMode === 'summary') {
      fileName = `revenue_summary_${formatDateForFilename()}.csv`;
      
      // Summary CSV
      headers = [
        'Filter',
        'Period',
        'Date From',
        'Date To',
        'Total Income',
        'Total Expenses',
        'Total Salaries',
        'Total Costs',
        'Net Profit',
        'Profit Margin',
        'Profit Status',
        'Total Transactions',
        'Paid Transactions',
        'Unique Customers',
        'Water Revenue',
        'Water Transactions',
        'Water Customers',
        'Water Expenses',
        'Water Salaries',
        'Water Net Profit',
        'Water Profit Margin',
        'Inverter Revenue',
        'Inverter Transactions',
        'Inverter Customers',
        'Inverter Expenses',
        'Inverter Salaries',
        'Inverter Net Profit',
        'Inverter Profit Margin'
      ];

      rows = [[
        getDateRangeDisplay(),
        revenueData.summary.period,
        revenueData.summary.date_range.from,
        revenueData.summary.date_range.to,
        revenueData.summary.overall.total_income,
        revenueData.summary.overall.total_expenses,
        revenueData.summary.overall.total_salaries,
        revenueData.summary.overall.total_costs,
        revenueData.summary.overall.net_profit,
        revenueData.summary.overall.profit_margin,
        revenueData.summary.overall.profit_status,
        revenueData.summary.overall.total_transactions,
        revenueData.summary.overall.paid_transactions,
        revenueData.summary.overall.unique_customers,
        revenueData.summary.water_services.income.total,
        revenueData.summary.water_services.income.transaction_count,
        revenueData.summary.water_services.income.unique_customers,
        revenueData.summary.water_services.expenses.total,
        revenueData.summary.water_services.salaries.total,
        revenueData.summary.water_services.net_profit,
        revenueData.summary.water_services.profit_margin,
        revenueData.summary.inverter_services.income.total,
        revenueData.summary.inverter_services.income.transaction_count,
        revenueData.summary.inverter_services.income.unique_customers,
        revenueData.summary.inverter_services.expenses.total,
        revenueData.summary.inverter_services.salaries.total,
        revenueData.summary.inverter_services.net_profit,
        revenueData.summary.inverter_services.profit_margin
      ]];
    } else if (viewMode === 'comparison') {
      fileName = `service_comparison_${formatDateForFilename()}.csv`;
      
      // Comparison CSV
      headers = [
        'Metric',
        'Water Services',
        'Inverter Services',
        'Total'
      ];

      rows = [
        ['Filter', getDateRangeDisplay(), '', ''],
        ['Period', revenueData.summary.period, '', ''],
        ['Date From', revenueData.summary.date_range.from, '', ''],
        ['Date To', revenueData.summary.date_range.to, '', ''],
        ['Revenue', 
         revenueData.summary.water_services.income.total,
         revenueData.summary.inverter_services.income.total,
         revenueData.summary.overall.total_income],
        ['Transactions',
         revenueData.summary.water_services.income.transaction_count,
         revenueData.summary.inverter_services.income.transaction_count,
         revenueData.summary.overall.total_transactions],
        ['Customers',
         revenueData.summary.water_services.income.unique_customers,
         revenueData.summary.inverter_services.income.unique_customers,
         revenueData.summary.overall.unique_customers],
        ['Average Transaction',
         revenueData.summary.water_services.income.average,
         revenueData.summary.inverter_services.income.average,
         ''],
        ['Expenses',
         revenueData.summary.water_services.expenses.total,
         revenueData.summary.inverter_services.expenses.total,
         revenueData.summary.overall.total_expenses],
        ['Salaries',
         revenueData.summary.water_services.salaries.total,
         revenueData.summary.inverter_services.salaries.total,
         revenueData.summary.overall.total_salaries],
        ['Total Costs',
         revenueData.summary.water_services.total_costs,
         revenueData.summary.inverter_services.total_costs,
         revenueData.summary.overall.total_costs],
        ['Net Profit',
         revenueData.summary.water_services.net_profit,
         revenueData.summary.inverter_services.net_profit,
         revenueData.summary.overall.net_profit],
        ['Profit Margin',
         revenueData.summary.water_services.profit_margin,
         revenueData.summary.inverter_services.profit_margin,
         revenueData.summary.overall.profit_margin]
      ];
    } else if (viewMode === 'profit') {
      fileName = `profit_analysis_${formatDateForFilename()}.csv`;
      
      // Profit Analysis CSV
      headers = [
        'Metric',
        'Value'
      ];

      rows = [
        ['Filter', getDateRangeDisplay()],
        ['Period', revenueData.summary.period],
        ['Date From', revenueData.summary.date_range.from],
        ['Date To', revenueData.summary.date_range.to],
        ['Total Income', revenueData.summary.overall.total_income],
        ['Total Expenses', revenueData.summary.overall.total_expenses],
        ['Total Salaries', revenueData.summary.overall.total_salaries],
        ['Total Costs', revenueData.summary.overall.total_costs],
        ['Net Profit', revenueData.summary.overall.net_profit],
        ['Profit Margin', revenueData.summary.overall.profit_margin],
        ['Profit Status', revenueData.summary.overall.profit_status],
        ['Income %', revenueData.profit_analysis.revenue_vs_costs.income_percentage],
        ['Expenses %', revenueData.profit_analysis.revenue_vs_costs.expenses_percentage],
        ['Salaries %', revenueData.profit_analysis.revenue_vs_costs.salaries_percentage],
        ['Profit %', revenueData.profit_analysis.revenue_vs_costs.profit_percentage],
        ['Break-even Needed', revenueData.profit_analysis.break_even_point.needed_income],
        ['Break-even Gap', revenueData.profit_analysis.break_even_point.gap],
        ['Break-even Profitable', revenueData.profit_analysis.break_even_point.is_profitable ? 'Yes' : 'No']
      ];
    }

    generateCSV(headers, rows, fileName);
    
    // Close export options on mobile
    if (isMobile) {
      setShowExportOptions(false);
    }
  };

  // Generate CSV helper
  const generateCSV = (headers: string[], rows: any[][], fileName: string) => {
    try {
      let csvContent = headers.join(',') + '\n';
      
      rows.forEach(row => {
        const escapedRow = row.map(cell => {
          if (typeof cell === 'string') {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        });
        csvContent += escapedRow.join(',') + '\n';
      });

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('CSV Export Error:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  // Export to PDF with enhanced design
  const exportToPDF = () => {
    if (!revenueData) {
      alert('No data to export');
      return;
    }

    try {
      // Set orientation based on device
      const orientation = isMobile ? 'portrait' : (isTablet ? 'portrait' : 'landscape');
      
      const doc = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      // Add decorative header with gradient effect
      doc.setFillColor(44, 62, 80); // Dark blue-gray
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 25, 'F');
      
      // Add company logo placeholder
      doc.setFillColor(102, 126, 234); // Purple
      doc.circle(20, 12.5, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(isMobile ? 8 : 10);
      doc.setFont('helvetica', 'bold');
      doc.text('SO', 17, 14);
      
      // Company name and report title
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(isMobile ? 10 : 14);
      doc.setFont('helvetica', 'bold');
      doc.text('SUN OFFICE', 35, 15);
      
      let title = '';
      if (viewMode === 'summary') {
        title = 'Revenue Summary Report';
      } else if (viewMode === 'comparison') {
        title = 'Service Comparison Report';
      } else if (viewMode === 'profit') {
        title = 'Profit Analysis Report';
      }
      
      doc.setFontSize(isMobile ? 7 : 10);
      doc.setFont('helvetica', 'normal');
      doc.text(title, 35, 20);

      // Add date on the right
      const currentDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.setFontSize(isMobile ? 6 : 8);
      doc.text(`Generated: ${currentDate}`, doc.internal.pageSize.getWidth() - (isMobile ? 30 : 40), 15);
      doc.text(`Time: ${new Date().toLocaleTimeString()}`, doc.internal.pageSize.getWidth() - (isMobile ? 30 : 40), 20);

      // Add metadata section with border
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(10, 30, doc.internal.pageSize.getWidth() - 20, isMobile ? 40 : 25, 3, 3, 'FD');
      
      doc.setTextColor(44, 62, 80);
      doc.setFontSize(isMobile ? 7 : 9);
      doc.setFont('helvetica', 'bold');
      
      if (isMobile) {
        // Stacked layout for mobile
        doc.text('Filter:', 15, 38);
        doc.setFont('helvetica', 'normal');
        doc.text(getDateRangeDisplay(), 15, 44);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Period:', 15, 50);
        doc.setFont('helvetica', 'normal');
        doc.text(revenueData.summary.period, 15, 56);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Date Range:', 15, 62);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formatDate(revenueData.summary.date_range.from)} to ${formatDate(revenueData.summary.date_range.to)}`, 15, 68);
      } else {
        // Horizontal layout for larger screens
        doc.text('Filter:', 15, 40);
        doc.setFont('helvetica', 'normal');
        doc.text(getDateRangeDisplay(), 35, 40);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Period:', 120, 40);
        doc.setFont('helvetica', 'normal');
        doc.text(revenueData.summary.period, 140, 40);
        
        doc.setFont('helvetica', 'bold');
        doc.text('Date Range:', 15, 48);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formatDate(revenueData.summary.date_range.from)} to ${formatDate(revenueData.summary.date_range.to)}`, 35, 48);
      }

      let yPos = isMobile ? 80 : 60;

      if (viewMode === 'summary') {
        yPos = generateEnhancedSummaryPDF(doc, yPos, isMobile);
      } else if (viewMode === 'comparison') {
        yPos = generateEnhancedComparisonPDF(doc, yPos, isMobile);
      } else if (viewMode === 'profit') {
        yPos = generateEnhancedProfitPDF(doc, yPos, isMobile);
      }

      // Add footer on all pages
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Footer line
        doc.setDrawColor(200, 200, 200);
        doc.line(10, doc.internal.pageSize.getHeight() - 15, doc.internal.pageSize.getWidth() - 10, doc.internal.pageSize.getHeight() - 15);
        
        doc.setFontSize(isMobile ? 5 : 7);
        doc.setTextColor(150, 150, 150);
        doc.text(
          'This is a computer generated document - valid without signature',
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
        
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() - 20,
          doc.internal.pageSize.getHeight() - 10
        );
        
        doc.text(
          'Sun Water Service System',
          20,
          doc.internal.pageSize.getHeight() - 10
        );
      }

      // Save PDF
      const fileName = `${viewMode}_report_${formatDateForFilename()}.pdf`;
      doc.save(fileName);
      
      // Close export options on mobile
      if (isMobile) {
        setShowExportOptions(false);
      }
      
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to export PDF. Please check if jspdf and jspdf-autotable are installed.');
    }
  };

  // Generate enhanced summary PDF with responsive layout
  const generateEnhancedSummaryPDF = (doc: jsPDF, startY: number, isMobile: boolean): number => {
    if (!revenueData) return startY;

    // Key Metrics Cards - Responsive layout
    const metrics = [
      { label: 'Total Revenue', value: revenueData.summary.overall.total_income, color: [16, 185, 129] as [number, number, number] },
      { label: 'Total Expenses', value: revenueData.summary.overall.total_expenses, color: [239, 68, 68] as [number, number, number] },
      { label: 'Net Profit', value: revenueData.summary.overall.net_profit, color: revenueData.summary.overall.is_profitable ? [16, 185, 129] as [number, number, number] : [239, 68, 68] as [number, number, number] }
    ];

    if (isMobile) {
      // Stacked cards for mobile
      let yOffset = startY;
      metrics.forEach((metric) => {
        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(10, yOffset, doc.internal.pageSize.getWidth() - 20, 20, 3, 3, 'FD');
        
        doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
        doc.rect(10, yOffset, 3, 20, 'F');
        
        doc.setTextColor(44, 62, 80);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.label, 18, yOffset + 7);
        
        doc.setFontSize(9);
        doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
        doc.text(formatCurrency(metric.value), doc.internal.pageSize.getWidth() - 50, yOffset + 7);
        
        yOffset += 25;
      });
      startY = yOffset;
    } else {
      // Horizontal cards for larger screens
      const cardWidth = (doc.internal.pageSize.getWidth() - 40) / 3;
      
      metrics.forEach((metric, index) => {
        const x = 10 + (index * (cardWidth + 10));
        
        doc.setFillColor(249, 250, 251);
        doc.setDrawColor(229, 231, 235);
        doc.roundedRect(x, startY, cardWidth, 25, 3, 3, 'FD');
        
        doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
        doc.rect(x, startY, 3, 25, 'F');
        
        doc.setTextColor(44, 62, 80);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text(metric.label, x + 8, startY + 8);
        
        doc.setFontSize(10);
        doc.setTextColor(metric.color[0], metric.color[1], metric.color[2]);
        doc.text(formatCurrency(metric.value), x + 8, startY + 18);
      });
      startY += 35;
    }

    // Revenue Overview Section
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(10, startY, doc.internal.pageSize.getWidth() - 10, startY);
    
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(isMobile ? 10 : 12);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue Overview', 10, startY + 8);
    
    startY += 15;

    const overviewData = [
      ['Total Transactions', formatNumber(revenueData.summary.overall.total_transactions)],
      ['Paid Transactions', formatNumber(revenueData.summary.overall.paid_transactions)],
      ['Unique Customers', formatNumber(revenueData.summary.overall.unique_customers)],
      ['Water Services', formatNumber(revenueData.summary.water_services.income.transaction_count)],
      ['Inverter Services', formatNumber(revenueData.summary.inverter_services.income.transaction_count)]
    ];

    autoTable(doc, {
      body: overviewData,
      startY: startY,
      theme: 'plain',
      styles: {
        fontSize: isMobile ? 7 : 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: isMobile ? 50 : 80, textColor: [44, 62, 80] },
        1: { cellWidth: isMobile ? 40 : 60, halign: 'right' }
      },
      margin: { left: 10 }
    });

    startY = (doc as any).lastAutoTable?.finalY + 15 || startY + 50;

    // Expenses Breakdown
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(10, startY, doc.internal.pageSize.getWidth() - 10, startY);
    
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(isMobile ? 10 : 12);
    doc.setFont('helvetica', 'bold');
    doc.text('Expenses Breakdown', 10, startY + 8);
    
    startY += 15;

    const expenseData = [
      ['Petrol (Water)', formatCurrency(revenueData.summary.water_services.expenses.by_type.petrol)],
      ['Petrol (Inverter)', formatCurrency(revenueData.summary.inverter_services.expenses.by_type.petrol)],
      ['Others (Water)', formatCurrency(revenueData.summary.water_services.expenses.by_type.others)],
      ['Others (Inverter)', formatCurrency(revenueData.summary.inverter_services.expenses.by_type.others)],
      ['Total Expenses', formatCurrency(revenueData.summary.overall.total_expenses)]
    ];

    autoTable(doc, {
      body: expenseData,
      startY: startY,
      theme: 'plain',
      styles: {
        fontSize: isMobile ? 7 : 8,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: isMobile ? 50 : 80, textColor: [44, 62, 80] },
        1: { cellWidth: isMobile ? 40 : 60, halign: 'right' }
      },
      margin: { left: 10 }
    });

    startY = (doc as any).lastAutoTable?.finalY + 20 || startY + 50;

    // Service Comparison
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(10, startY, doc.internal.pageSize.getWidth() - 10, startY);
    
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(isMobile ? 10 : 12);
    doc.setFont('helvetica', 'bold');
    doc.text('Service Comparison', 10, startY + 8);
    
    startY += 15;

    const waterProfitColor: [number, number, number] = revenueData.summary.water_services.net_profit >= 0 ? [16, 185, 129] : [239, 68, 68];
    const inverterProfitColor: [number, number, number] = revenueData.summary.inverter_services.net_profit >= 0 ? [16, 185, 129] : [239, 68, 68];

    const serviceData = [
      ['Service', 'Revenue', 'Expenses', 'Salaries', 'Net Profit', 'Margin'],
      [
        { content: 'Water', styles: { fontStyle: 'bold' as const } },
        formatCurrency(revenueData.summary.water_services.income.total),
        formatCurrency(revenueData.summary.water_services.expenses.total),
        formatCurrency(revenueData.summary.water_services.salaries.total),
        { content: formatCurrency(revenueData.summary.water_services.net_profit), styles: { textColor: waterProfitColor } },
        formatPercentage(revenueData.summary.water_services.profit_margin)
      ],
      [
        { content: 'Inverter', styles: { fontStyle: 'bold' as const } },
        formatCurrency(revenueData.summary.inverter_services.income.total),
        formatCurrency(revenueData.summary.inverter_services.expenses.total),
        formatCurrency(revenueData.summary.inverter_services.salaries.total),
        { content: formatCurrency(revenueData.summary.inverter_services.net_profit), styles: { textColor: inverterProfitColor } },
        formatPercentage(revenueData.summary.inverter_services.profit_margin)
      ]
    ];

    autoTable(doc, {
      head: [serviceData[0]],
      body: serviceData.slice(1),
      startY: startY,
      theme: 'grid',
      styles: {
        fontSize: isMobile ? 6 : 7,
        cellPadding: isMobile ? 2 : 3,
      },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: [255, 255, 255],
        fontSize: isMobile ? 6 : 7,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: isMobile ? 20 : 25 },
        1: { cellWidth: isMobile ? 25 : 30, halign: 'right' },
        2: { cellWidth: isMobile ? 25 : 30, halign: 'right' },
        3: { cellWidth: isMobile ? 25 : 30, halign: 'right' },
        4: { cellWidth: isMobile ? 30 : 35, halign: 'right' },
        5: { cellWidth: isMobile ? 20 : 25, halign: 'right' }
      },
      margin: { left: 10 }
    });

    return (doc as any).lastAutoTable?.finalY + 15 || startY + 50;
  };

  // Generate enhanced comparison PDF with responsive layout
  const generateEnhancedComparisonPDF = (doc: jsPDF, startY: number, isMobile: boolean): number => {
    if (!revenueData) return startY;

    const waterProfitColor: [number, number, number] = revenueData.summary.water_services.net_profit >= 0 ? [16, 185, 129] : [239, 68, 68];
    const inverterProfitColor: [number, number, number] = revenueData.summary.inverter_services.net_profit >= 0 ? [16, 185, 129] : [239, 68, 68];
    const totalProfitColor: [number, number, number] = revenueData.summary.overall.net_profit >= 0 ? [16, 185, 129] : [239, 68, 68];

    // Service Comparison Table
    const comparisonData = [
      ['Metric', 'Water', 'Inverter', 'Total'],
      ['Revenue', 
       formatCurrency(revenueData.summary.water_services.income.total),
       formatCurrency(revenueData.summary.inverter_services.income.total),
       formatCurrency(revenueData.summary.overall.total_income)],
      ['Transactions',
       revenueData.summary.water_services.income.transaction_count.toString(),
       revenueData.summary.inverter_services.income.transaction_count.toString(),
       revenueData.summary.overall.total_transactions.toString()],
      ['Customers',
       revenueData.summary.water_services.income.unique_customers.toString(),
       revenueData.summary.inverter_services.income.unique_customers.toString(),
       revenueData.summary.overall.unique_customers.toString()],
      ['Avg Trans',
       formatCurrency(revenueData.summary.water_services.income.average),
       formatCurrency(revenueData.summary.inverter_services.income.average),
       '-'],
      ['Expenses',
       formatCurrency(revenueData.summary.water_services.expenses.total),
       formatCurrency(revenueData.summary.inverter_services.expenses.total),
       formatCurrency(revenueData.summary.overall.total_expenses)],
      ['Salaries',
       formatCurrency(revenueData.summary.water_services.salaries.total),
       formatCurrency(revenueData.summary.inverter_services.salaries.total),
       formatCurrency(revenueData.summary.overall.total_salaries)],
      ['Total Costs',
       formatCurrency(revenueData.summary.water_services.total_costs),
       formatCurrency(revenueData.summary.inverter_services.total_costs),
       formatCurrency(revenueData.summary.overall.total_costs)],
      ['Net Profit',
       { content: formatCurrency(revenueData.summary.water_services.net_profit), styles: { textColor: waterProfitColor } },
       { content: formatCurrency(revenueData.summary.inverter_services.net_profit), styles: { textColor: inverterProfitColor } },
       { content: formatCurrency(revenueData.summary.overall.net_profit), styles: { textColor: totalProfitColor } }],
      ['Margin',
       formatPercentage(revenueData.summary.water_services.profit_margin),
       formatPercentage(revenueData.summary.inverter_services.profit_margin),
       formatPercentage(revenueData.summary.overall.profit_margin)]
    ];

    autoTable(doc, {
      head: [comparisonData[0]],
      body: comparisonData.slice(1),
      startY: startY,
      theme: 'grid',
      styles: {
        fontSize: isMobile ? 6 : 8,
        cellPadding: isMobile ? 2 : 4,
      },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: [255, 255, 255],
        fontSize: isMobile ? 6 : 8,
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: isMobile ? 25 : 35 },
        1: { cellWidth: isMobile ? 30 : 40, halign: 'right' },
        2: { cellWidth: isMobile ? 30 : 40, halign: 'right' },
        3: { cellWidth: isMobile ? 30 : 40, halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 10 }
    });

    return (doc as any).lastAutoTable?.finalY + 15 || startY + 100;
  };

  // Generate enhanced profit PDF with responsive layout
  const generateEnhancedProfitPDF = (doc: jsPDF, startY: number, isMobile: boolean): number => {
    if (!revenueData) return startY;

    const profitColor: [number, number, number] = revenueData.summary.overall.is_profitable ? [16, 185, 129] : [239, 68, 68];

    // Profit Status Card
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(229, 231, 235);
    doc.roundedRect(10, startY, doc.internal.pageSize.getWidth() - 20, isMobile ? 35 : 40, 3, 3, 'FD');
    
    doc.setFillColor(profitColor[0], profitColor[1], profitColor[2]);
    doc.rect(10, startY, 5, isMobile ? 35 : 40, 'F');
    
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(isMobile ? 8 : 10);
    doc.setFont('helvetica', 'bold');
    doc.text('Overall Profit Status', 20, startY + (isMobile ? 8 : 10));
    
    doc.setFontSize(isMobile ? 12 : 16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(profitColor[0], profitColor[1], profitColor[2]);
    doc.text(formatCurrency(revenueData.summary.overall.net_profit), 20, startY + (isMobile ? 18 : 22));
    
    doc.setFontSize(isMobile ? 6 : 8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(44, 62, 80);
    
    if (isMobile) {
      doc.text(`Margin: ${formatPercentage(revenueData.summary.overall.profit_margin)}`, 20, startY + 28);
      doc.text(`Status: ${revenueData.summary.overall.profit_status.toUpperCase()}`, 20, startY + 33);
    } else {
      doc.text(`Margin: ${formatPercentage(revenueData.summary.overall.profit_margin)}`, 80, startY + 15);
      doc.text(`Status: ${revenueData.summary.overall.profit_status.toUpperCase()}`, 130, startY + 15);
    }

    let yPos = startY + (isMobile ? 45 : 50);

    // Revenue vs Costs Analysis
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(10, yPos, doc.internal.pageSize.getWidth() - 10, yPos);
    
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(isMobile ? 10 : 12);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue vs Costs Analysis', 10, yPos + 8);
    
    yPos += 15;

    const profitPercentageColor: [number, number, number] = revenueData.summary.overall.is_profitable ? [16, 185, 129] : [239, 68, 68];

    const vsData = [
      ['Revenue %', formatPercentage(revenueData.profit_analysis.revenue_vs_costs.income_percentage)],
      ['Expenses %', formatPercentage(revenueData.profit_analysis.revenue_vs_costs.expenses_percentage)],
      ['Salaries %', formatPercentage(revenueData.profit_analysis.revenue_vs_costs.salaries_percentage)],
      ['Profit %', { content: formatPercentage(revenueData.profit_analysis.revenue_vs_costs.profit_percentage), styles: { textColor: profitPercentageColor } }]
    ];

    autoTable(doc, {
      body: vsData,
      startY: yPos,
      theme: 'plain',
      styles: {
        fontSize: isMobile ? 7 : 8,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: isMobile ? 50 : 70, textColor: [44, 62, 80] },
        1: { cellWidth: isMobile ? 40 : 60, halign: 'right' }
      },
      margin: { left: 10 }
    });

    yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 40;

    // Break-even Analysis
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(10, yPos, doc.internal.pageSize.getWidth() - 10, yPos);
    
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(isMobile ? 10 : 12);
    doc.setFont('helvetica', 'bold');
    doc.text('Break-even Analysis', 10, yPos + 8);
    
    yPos += 15;

    const gapColor: [number, number, number] = revenueData.profit_analysis.break_even_point.gap <= 0 ? [16, 185, 129] : [239, 68, 68];
    const statusColor: [number, number, number] = revenueData.profit_analysis.break_even_point.is_profitable ? [16, 185, 129] : [239, 68, 68];

    const breakEvenData = [
      ['Current Revenue', formatCurrency(revenueData.profit_analysis.break_even_point.current_income)],
      ['Needed Revenue', formatCurrency(revenueData.profit_analysis.break_even_point.needed_income)],
      ['Gap', { 
        content: `${formatCurrency(Math.abs(revenueData.profit_analysis.break_even_point.gap))} (${revenueData.profit_analysis.break_even_point.gap <= 0 ? 'Surplus' : 'Deficit'})`,
        styles: { textColor: gapColor }
      }],
      ['Status', { 
        content: revenueData.profit_analysis.break_even_point.is_profitable ? 'Profitable' : 'Not Profitable',
        styles: { textColor: statusColor }
      }]
    ];

    autoTable(doc, {
      body: breakEvenData,
      startY: yPos,
      theme: 'plain',
      styles: {
        fontSize: isMobile ? 7 : 8,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: isMobile ? 50 : 70, textColor: [44, 62, 80] },
        1: { cellWidth: isMobile ? 50 : 70, halign: 'right' }
      },
      margin: { left: 10 }
    });

    yPos = (doc as any).lastAutoTable?.finalY + 15 || yPos + 40;

    // Cost Breakdown
    doc.setDrawColor(102, 126, 234);
    doc.setLineWidth(0.5);
    doc.line(10, yPos, doc.internal.pageSize.getWidth() - 10, yPos);
    
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(isMobile ? 10 : 12);
    doc.setFont('helvetica', 'bold');
    doc.text('Cost Breakdown', 10, yPos + 8);
    
    yPos += 15;

    const revenueColor: [number, number, number] = [16, 185, 129];
    const expenseColor: [number, number, number] = [239, 68, 68];
    const salariesColor: [number, number, number] = [239, 68, 68];
    const totalCostsColor: [number, number, number] = [239, 68, 68];
    const netProfitColor: [number, number, number] = revenueData.summary.overall.is_profitable ? [16, 185, 129] : [239, 68, 68];

    const costData = [
      ['Revenue', { content: formatCurrency(revenueData.summary.overall.total_income), styles: { textColor: revenueColor } }],
      ['Expenses', { content: `- ${formatCurrency(revenueData.summary.overall.total_expenses)}`, styles: { textColor: expenseColor } }],
      ['Salaries', { content: `- ${formatCurrency(revenueData.summary.overall.total_salaries)}`, styles: { textColor: salariesColor } }],
      ['Total Costs', { content: `- ${formatCurrency(revenueData.summary.overall.total_costs)}`, styles: { fontStyle: 'bold' as const, textColor: totalCostsColor } }],
      ['Net Profit/Loss', { 
        content: revenueData.summary.overall.is_profitable ? formatCurrency(revenueData.summary.overall.net_profit) : `- ${formatCurrency(Math.abs(revenueData.summary.overall.net_profit))}`,
        styles: { fontStyle: 'bold' as const, textColor: netProfitColor }
      }]
    ];

    autoTable(doc, {
      body: costData,
      startY: yPos,
      theme: 'plain',
      styles: {
        fontSize: isMobile ? 7 : 8,
        cellPadding: 4,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: isMobile ? 50 : 70, textColor: [44, 62, 80] },
        1: { cellWidth: isMobile ? 50 : 70, halign: 'right' }
      },
      margin: { left: 10 }
    });

    return (doc as any).lastAutoTable?.finalY + 15 || yPos + 50;
  };

  // Loading state
  if (isLoading || loading) {
    return (
      <div className="revenue-tab">
        <div className="loading-state" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px'
        }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading revenue data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (errorMessage || error) {
    return (
      <div className="revenue-tab">
        <div className="error-alert" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 24px',
          background: '#fee2e2',
          borderRadius: '8px',
          color: '#ef4444',
          margin: '24px'
        }}>
          <FiTrendingDown size={24} />
          <span style={{ flex: 1 }}>{errorMessage || error}</span>
          <button 
            onClick={handleManualRefresh}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#ef4444',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!revenueData) {
    return (
      <div className="revenue-tab">
        <div className="empty-state" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px'
        }}>
          <FiDollarSign size={48} color="#9ca3af" />
          <h3 style={{ color: '#1e293b', margin: 0 }}>No Revenue Data</h3>
          <p style={{ color: '#6b7280', margin: 0 }}>No revenue data available for the selected period</p>
          <button 
            className="btn primary" 
            onClick={handleManualRefresh}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: '#667eea',
              color: 'white',
              cursor: 'pointer',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const { summary, profit_analysis } = revenueData;

  // Determine grid columns based on device
  const getSummaryCardsGrid = () => {
    if (isMobile) return '1fr';
    if (isTablet) return 'repeat(2, 1fr)';
    return 'repeat(4, 1fr)';
  };

  const getServiceCardsGrid = () => {
    if (isMobile) return '1fr';
    if (isTablet) return 'repeat(2, 1fr)';
    return 'repeat(2, 1fr)';
  };

  return (
    <div className="revenue-tab">
      {/* Header with Filters and Export Actions - Responsive */}
      <div className="revenue-header" style={{
        padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        gap: isMobile ? '12px' : '20px'
      }}>
        <div className="revenue-title">
          <h2 style={{
            fontSize: isMobile ? '20px' : isTablet ? '24px' : '28px',
            margin: '0 0 4px 0',
            color: '#1e293b'
          }}>Income and Expenses</h2>
          <p className="revenue-period" style={{
            fontSize: isMobile ? '12px' : '14px',
            color: '#64748b',
            margin: 0
          }}>{summary.period}</p>
        </div>
        
        <div className="revenue-filters" style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '10px' : '16px',
          alignItems: isMobile ? 'stretch' : 'center',
          width: isMobile ? '100%' : 'auto'
        }}>
          {/* Date Range Filter - FIXED */}
          <div className="filter-group" style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px',
            position: 'relative'
          }}>
            {!isMobile && <FiFilter size={16} color="#667eea" />}
            <label style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '500',
              color: '#4b5563',
              minWidth: isMobile ? '40px' : 'auto'
            }}>Date:</label>
            <select 
              value={dateRange} 
              onChange={handleDateRangeChange}
              className="filter-select"
              style={{
                padding: isMobile ? '8px 12px' : '8px 16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: isMobile ? '13px' : '14px',
                flex: isMobile ? 1 : 'auto',
                minWidth: isMobile ? '120px' : '140px'
              }}
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            {/* Mobile Filter Toggle */}
            {isMobile && (
              <motion.button 
                className="btn filter-btn"
                onClick={() => setShowDateFilter(!showDateFilter)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: showDateFilter ? '#667eea' : 'white',
                  color: showDateFilter ? 'white' : '#667eea',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <FiFilter size={14} />
              </motion.button>
            )}
          </div>

          {/* Year Filter */}
          <div className="filter-group" style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px'
          }}>
            <label style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '500',
              color: '#4b5563',
              minWidth: isMobile ? '40px' : 'auto'
            }}>Year:</label>
            <select 
              value={selectedYear ?? ''} 
              onChange={handleYearChange}
              className="filter-select"
              style={{
                padding: isMobile ? '8px 12px' : '8px 16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: isMobile ? '13px' : '14px',
                flex: isMobile ? 1 : 'auto'
              }}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          {/* Month Filter */}
          <div className="filter-group" style={{
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '8px' : '12px'
          }}>
            <label style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '500',
              color: '#4b5563',
              minWidth: isMobile ? '45px' : 'auto'
            }}>Month:</label>
            <select 
              value={selectedMonth || ''} 
              onChange={handleMonthChange}
              className="filter-select"
              style={{
                padding: isMobile ? '8px 12px' : '8px 16px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: isMobile ? '13px' : '14px',
                flex: isMobile ? 1 : 'auto'
              }}
            >
              <option value="">All Months</option>
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>

          {/* Custom Date Range Picker - shown when custom is selected */}
          {showCustomDatePicker && (
            <div className="custom-date-range" style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '8px' : '12px',
              marginTop: isMobile ? '8px' : '0',
              padding: isMobile ? '12px' : '0',
              background: isMobile ? '#f9fafb' : 'transparent',
              borderRadius: isMobile ? '8px' : '0'
            }}>
              <div className="date-input" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <label style={{
                  fontSize: '12px',
                  color: '#64748b',
                  minWidth: '35px'
                }}>From:</label>
                <input
                  type="date"
                  value={customFromDate}
                  onChange={handleCustomFromChange}
                  style={{
                    padding: isMobile ? '8px' : '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '12px',
                    flex: 1
                  }}
                />
              </div>
              <div className="date-input" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <label style={{
                  fontSize: '12px',
                  color: '#64748b',
                  minWidth: '35px'
                }}>To:</label>
                <input
                  type="date"
                  value={customToDate}
                  onChange={handleCustomToChange}
                  style={{
                    padding: isMobile ? '8px' : '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '12px',
                    flex: 1
                  }}
                />
              </div>
            </div>
          )}

          {/* Export Actions */}
          <div className="export-actions" style={{
            display: 'flex',
            gap: isMobile ? '8px' : '10px',
            marginLeft: isMobile ? '0' : 'auto',
            marginTop: isMobile ? '8px' : '0',
            justifyContent: isMobile ? 'space-between' : 'flex-end'
          }}>
            {/* Mobile Menu Toggle */}
            {isMobile && (
              <motion.button 
                className="btn mobile-menu-btn"
                onClick={() => setShowExportOptions(!showExportOptions)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#667eea',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flex: 1
                }}
              >
                <FiMenu size={16} />
                <span>Export</span>
              </motion.button>
            )}

            {/* Export Buttons */}
            {(!isMobile || showExportOptions) && (
              <>
                <motion.button 
                  className="btn csv-btn"
                  onClick={exportToCSV}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Export to CSV"
                  style={{
                    padding: isMobile ? '8px 12px' : '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#10b981',
                    cursor: 'pointer',
                    fontSize: isMobile ? '12px' : '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: isMobile ? 1 : 'auto'
                  }}
                >
                  <FiDownload size={14} />
                  <span>CSV</span>
                </motion.button>

                <motion.button 
                  className="btn pdf-btn"
                  onClick={exportToPDF}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Export to PDF"
                  style={{
                    padding: isMobile ? '8px 12px' : '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#ef4444',
                    cursor: 'pointer',
                    fontSize: isMobile ? '12px' : '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: isMobile ? 1 : 'auto'
                  }}
                >
                  <FiDownload size={14} />
                  <span>PDF</span>
                </motion.button>

                <motion.button 
                  className="btn print-btn"
                  onClick={handlePrint}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Print Report"
                  style={{
                    padding: isMobile ? '8px 12px' : '8px 16px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    background: 'white',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    fontSize: isMobile ? '12px' : '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flex: isMobile ? 1 : 'auto'
                  }}
                >
                  <FiPrinter size={14} />
                  <span>Print</span>
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Date Filter Dropdown */}
      {isMobile && showDateFilter && (
        <div style={{
          padding: '12px 16px',
          background: '#f9fafb',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <div className="filter-group" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <label style={{
              fontSize: '13px',
              fontWeight: '500',
              color: '#4b5563',
              minWidth: '40px'
            }}>Date:</label>
            <select 
              value={dateRange} 
              onChange={handleDateRangeChange}
              className="filter-select"
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #d1d5db',
                fontSize: '13px',
                flex: 1
              }}
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {showCustomDatePicker && (
            <div className="custom-date-range" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginTop: '8px',
              padding: '12px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div className="date-input" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <label style={{
                  fontSize: '12px',
                  color: '#64748b',
                  minWidth: '35px'
                }}>From:</label>
                <input
                  type="date"
                  value={customFromDate}
                  onChange={handleCustomFromChange}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '12px',
                    flex: 1
                  }}
                />
              </div>
              <div className="date-input" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <label style={{
                  fontSize: '12px',
                  color: '#64748b',
                  minWidth: '35px'
                }}>To:</label>
                <input
                  type="date"
                  value={customToDate}
                  onChange={handleCustomToChange}
                  style={{
                    padding: '8px',
                    borderRadius: '6px',
                    border: '1px solid #d1d5db',
                    fontSize: '12px',
                    flex: 1
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Last Updated Info */}
      <div className="last-updated" style={{
        padding: isMobile ? '8px 16px' : '8px 24px',
        background: '#f9fafb',
        borderBottom: '1px solid #e5e7eb',
        fontSize: isMobile ? '11px' : '12px',
        color: '#6b7280',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <FiClock size={isMobile ? 12 : 14} />
        <span>Last updated: {lastRefreshed.toLocaleTimeString()}</span>
        <span style={{ marginLeft: 'auto', color: '#667eea' }}>
          Filter: {getDateRangeDisplay()}
        </span>
      </div>

      {/* View Mode Tabs - Responsive */}
      <div className="view-mode-tabs" style={{
        display: 'flex',
        gap: isMobile ? '8px' : '12px',
        padding: isMobile ? '12px 16px' : '16px 24px',
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        overflowX: isMobile ? 'auto' : 'visible',
        whiteSpace: isMobile ? 'nowrap' : 'normal'
      }}>
        <motion.button
          className={`view-mode-btn ${viewMode === 'summary' ? 'active' : ''}`}
          onClick={() => setViewMode('summary')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            borderRadius: '8px',
            border: viewMode === 'summary' ? '2px solid #667eea' : '1px solid #e5e7eb',
            background: viewMode === 'summary' ? '#667eea' : 'white',
            color: viewMode === 'summary' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
        >
          <FiBarChart2 size={isMobile ? 14 : 16} />
          <span>Summary</span>
        </motion.button>
        
        <motion.button
          className={`view-mode-btn ${viewMode === 'comparison' ? 'active' : ''}`}
          onClick={() => setViewMode('comparison')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            borderRadius: '8px',
            border: viewMode === 'comparison' ? '2px solid #667eea' : '1px solid #e5e7eb',
            background: viewMode === 'comparison' ? '#667eea' : 'white',
            color: viewMode === 'comparison' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FiPieChart size={isMobile ? 14 : 16} />
          <span>Comparison</span>
        </motion.button>
        
        <motion.button
          className={`view-mode-btn ${viewMode === 'profit' ? 'active' : ''}`}
          onClick={() => setViewMode('profit')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: isMobile ? '8px 16px' : '10px 20px',
            borderRadius: '8px',
            border: viewMode === 'profit' ? '2px solid #667eea' : '1px solid #e5e7eb',
            background: viewMode === 'profit' ? '#667eea' : 'white',
            color: viewMode === 'profit' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontSize: isMobile ? '13px' : '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <FiTrendingUp size={isMobile ? 14 : 16} />
          <span>Profit</span>
        </motion.button>
      </div>

      {/* Summary Cards - Always Visible */}
      <div className="summary-cards" style={{
        display: 'grid',
        gridTemplateColumns: getSummaryCardsGrid(),
        gap: isMobile ? '12px' : isTablet ? '16px' : '20px',
        padding: isMobile ? '16px' : '24px'
      }}>
        <motion.div 
          className="summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px'
          }}
        >
          <div className="card-icon" style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: isMobile ? '18px' : '20px'
          }}>
            <FiDollarSign />
          </div>
          <div className="card-content">
            <h3 style={{
              fontSize: isMobile ? '12px' : '14px',
              color: '#6b7280',
              margin: '0 0 4px 0',
              fontWeight: '500'
            }}>Total Revenue</h3>
            <p className="card-value" style={{
              fontSize: isMobile ? '18px' : '24px',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: '0 0 2px 0'
            }}>{formatCurrency(summary.overall.total_income)}</p>
            <p className="card-subtitle" style={{
              fontSize: isMobile ? '10px' : '11px',
              color: '#9ca3af',
              margin: 0
            }}>
              From {formatNumber(summary.overall.total_transactions)} transactions
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px'
          }}
        >
          <div className="card-icon" style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: isMobile ? '18px' : '20px'
          }}>
            <FiShoppingBag />
          </div>
          <div className="card-content">
            <h3 style={{
              fontSize: isMobile ? '12px' : '14px',
              color: '#6b7280',
              margin: '0 0 4px 0',
              fontWeight: '500'
            }}>Total Expenses</h3>
            <p className="card-value" style={{
              fontSize: isMobile ? '18px' : '24px',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: '0 0 2px 0'
            }}>{formatCurrency(summary.overall.total_expenses)}</p>
            <p className="card-subtitle" style={{
              fontSize: isMobile ? '10px' : '11px',
              color: '#9ca3af',
              margin: 0
            }}>
              {formatNumber(summary.overall.total_expenses)} total costs
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px'
          }}
        >
          <div className="card-icon" style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: isMobile ? '18px' : '20px'
          }}>
            <FiCreditCard />
          </div>
          <div className="card-content">
            <h3 style={{
              fontSize: isMobile ? '12px' : '14px',
              color: '#6b7280',
              margin: '0 0 4px 0',
              fontWeight: '500'
            }}>Salaries</h3>
            <p className="card-value" style={{
              fontSize: isMobile ? '18px' : '24px',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: '0 0 2px 0'
            }}>{formatCurrency(summary.overall.total_salaries)}</p>
            <p className="card-subtitle" style={{
              fontSize: isMobile ? '10px' : '11px',
              color: '#9ca3af',
              margin: 0
            }}>
              {formatNumber(summary.overall.unique_customers)} unique customers
            </p>
          </div>
        </motion.div>

        <motion.div 
          className="summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            border: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: isMobile ? '12px' : '16px'
          }}
        >
          <div className="card-icon" style={{
            background: `linear-gradient(135deg, ${getProfitStatusColor(summary.overall.profit_status)} 0%, ${getProfitStatusColor(summary.overall.profit_status)}DD 100%)`,
            width: isMobile ? '40px' : '48px',
            height: isMobile ? '40px' : '48px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: isMobile ? '18px' : '20px'
          }}>
            {getProfitStatusIcon(summary.overall.profit_status)}
          </div>
          <div className="card-content">
            <h3 style={{
              fontSize: isMobile ? '12px' : '14px',
              color: '#6b7280',
              margin: '0 0 4px 0',
              fontWeight: '500'
            }}>Net Profit</h3>
            <p className="card-value" style={{
              fontSize: isMobile ? '18px' : '24px',
              fontWeight: 'bold',
              color: getProfitStatusColor(summary.overall.profit_status),
              margin: '0 0 2px 0'
            }}>{formatCurrency(summary.overall.net_profit)}</p>
            <p className="card-subtitle" style={{
              fontSize: isMobile ? '10px' : '11px',
              color: '#9ca3af',
              margin: 0
            }}>
              Margin: {formatPercentage(summary.overall.profit_margin)}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Service Comparison View */}
      {viewMode === 'comparison' && (
        <motion.div 
          className="comparison-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            padding: isMobile ? '16px' : '24px'
          }}
        >
          <h3 style={{
            fontSize: isMobile ? '18px' : '22px',
            margin: '0 0 20px 0',
            color: '#1e293b'
          }}>Service Type Comparison</h3>
          
          <div className="service-cards" style={{
            display: 'grid',
            gridTemplateColumns: getServiceCardsGrid(),
            gap: isMobile ? '16px' : '24px'
          }}>
            {/* Water Services Card */}
            <motion.div 
              className="service-card water"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                border: '1px solid #e5e7eb',
                position: 'relative'
              }}
            >
              {/* Water Services Export Options */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                display: 'flex',
                gap: '4px',
                zIndex: 10
              }}>
                {isMobile ? (
                  <motion.button 
                    onClick={() => setShowWaterExportOptions(!showWaterExportOptions)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      color: '#10B981',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FiDownloadCloud size={14} />
                  </motion.button>
                ) : (
                  <>
                    <motion.button 
                      onClick={exportWaterToCSV}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Export Water Services to CSV"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        color: '#10B981',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FiDownload size={14} />
                    </motion.button>
                    <motion.button 
                      onClick={exportWaterToPDF}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Export Water Services to PDF"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FiDownload size={14} />
                    </motion.button>
                    <motion.button 
                      onClick={handleWaterPrint}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Print Water Services Report"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FiPrinter size={14} />
                    </motion.button>
                  </>
                )}
              </div>

              {/* Mobile Water Export Options Dropdown */}
              {isMobile && showWaterExportOptions && (
                <div style={{
                  position: 'absolute',
                  top: '45px',
                  right: '12px',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '1px solid #e5e7eb',
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  padding: '4px'
                }}>
                  <button
                    onClick={exportWaterToCSV}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      background: 'none',
                      color: '#10B981',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FiDownload size={12} /> CSV
                  </button>
                  <button
                    onClick={exportWaterToPDF}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      background: 'none',
                      color: '#ef4444',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FiDownload size={12} /> PDF
                  </button>
                  <button
                    onClick={handleWaterPrint}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      background: 'none',
                      color: '#3b82f6',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FiPrinter size={12} /> Print
                  </button>
                </div>
              )}

              <div className="service-header" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div className="service-icon" style={{
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  width: isMobile ? '40px' : '48px',
                  height: isMobile ? '40px' : '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: isMobile ? '18px' : '20px'
                }}>
                  <FiDroplet />
                </div>
                <h4 style={{
                  fontSize: isMobile ? '16px' : '18px',
                  margin: 0,
                  color: '#1e293b'
                }}>Water Services</h4>
              </div>
              
              <div className="service-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div className="service-stat">
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '11px' : '12px',
                    color: '#6b7280',
                    display: 'block',
                    marginBottom: '4px'
                  }}>Revenue</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>{formatCurrency(summary.water_services.income.total)}</span>
                </div>
                <div className="service-stat">
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '11px' : '12px',
                    color: '#6b7280',
                    display: 'block',
                    marginBottom: '4px'
                  }}>Transactions</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>{formatNumber(summary.water_services.income.transaction_count)}</span>
                </div>
                <div className="service-stat">
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '11px' : '12px',
                    color: '#6b7280',
                    display: 'block',
                    marginBottom: '4px'
                  }}>Customers</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>{formatNumber(summary.water_services.income.unique_customers)}</span>
                </div>
                <div className="service-stat">
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '11px' : '12px',
                    color: '#6b7280',
                    display: 'block',
                    marginBottom: '4px'
                  }}>Avg Transaction</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>{formatCurrency(summary.water_services.income.average)}</span>
                </div>
              </div>

              <div className="service-costs" style={{
                borderTop: '1px solid #e5e7eb',
                paddingTop: '16px',
                marginBottom: '16px'
              }}>
                <h5 style={{
                  fontSize: isMobile ? '12px' : '14px',
                  margin: '0 0 12px 0',
                  color: '#4b5563'
                }}>Costs</h5>
                <div className="cost-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: isMobile ? '12px' : '13px'
                }}>
                  <span>Expenses</span>
                  <span className="negative" style={{ color: '#ef4444' }}>{formatCurrency(summary.water_services.expenses.total)}</span>
                </div>
                <div className="cost-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: isMobile ? '12px' : '13px'
                }}>
                  <span>Salaries</span>
                  <span className="negative" style={{ color: '#ef4444' }}>{formatCurrency(summary.water_services.salaries.total)}</span>
                </div>
                <div className="cost-item total" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: 'bold',
                  borderTop: '1px dashed #e5e7eb',
                  paddingTop: '8px',
                  marginTop: '8px'
                }}>
                  <span>Total Costs</span>
                  <span className="negative" style={{ color: '#ef4444' }}>{formatCurrency(summary.water_services.total_costs)}</span>
                </div>
              </div>

              <div className="service-profit" style={{
                background: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h5 style={{
                  fontSize: isMobile ? '12px' : '14px',
                  margin: '0 0 8px 0',
                  color: '#4b5563'
                }}>Profit/Loss</h5>
                <div className={`profit-value ${summary.water_services.profit_status}`} style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 'bold',
                  color: summary.water_services.profit_status === 'profit' ? '#10b981' : '#ef4444',
                  marginBottom: '4px'
                }}>
                  {formatCurrency(summary.water_services.net_profit)}
                </div>
                <div className="profit-margin" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: summary.water_services.profit_status === 'profit' ? '#10b981' : '#ef4444',
                  marginBottom: '8px'
                }}>
                  Margin: {formatPercentage(summary.water_services.profit_margin)}
                </div>
                <div className={`profit-badge ${summary.water_services.profit_status}`} style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: isMobile ? '10px' : '11px',
                  fontWeight: '500',
                  background: summary.water_services.profit_status === 'profit' ? '#10b98120' : '#ef444420',
                  color: summary.water_services.profit_status === 'profit' ? '#10b981' : '#ef4444'
                }}>
                  {summary.water_services.profit_status.toUpperCase()}
                </div>
              </div>
            </motion.div>

            {/* Inverter Services Card */}
            <motion.div 
              className="service-card inverter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: isMobile ? '16px' : '20px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                border: '1px solid #e5e7eb',
                position: 'relative'
              }}
            >
              {/* Inverter Services Export Options */}
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                display: 'flex',
                gap: '4px',
                zIndex: 10
              }}>
                {isMobile ? (
                  <motion.button 
                    onClick={() => setShowInverterExportOptions(!showInverterExportOptions)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '6px',
                      border: '1px solid #e5e7eb',
                      background: 'white',
                      color: '#F59E0B',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <FiDownloadCloud size={14} />
                  </motion.button>
                ) : (
                  <>
                    <motion.button 
                      onClick={exportInverterToCSV}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Export Inverter Services to CSV"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        color: '#F59E0B',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FiDownload size={14} />
                    </motion.button>
                    <motion.button 
                      onClick={exportInverterToPDF}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Export Inverter Services to PDF"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FiDownload size={14} />
                    </motion.button>
                    <motion.button 
                      onClick={handleInverterPrint}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title="Print Inverter Services Report"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '6px',
                        border: '1px solid #e5e7eb',
                        background: 'white',
                        color: '#3b82f6',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <FiPrinter size={14} />
                    </motion.button>
                  </>
                )}
              </div>

              {/* Mobile Inverter Export Options Dropdown */}
              {isMobile && showInverterExportOptions && (
                <div style={{
                  position: 'absolute',
                  top: '45px',
                  right: '12px',
                  background: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  border: '1px solid #e5e7eb',
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                  padding: '4px'
                }}>
                  <button
                    onClick={exportInverterToCSV}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      background: 'none',
                      color: '#F59E0B',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FiDownload size={12} /> CSV
                  </button>
                  <button
                    onClick={exportInverterToPDF}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      background: 'none',
                      color: '#ef4444',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FiDownload size={12} /> PDF
                  </button>
                  <button
                    onClick={handleInverterPrint}
                    style={{
                      padding: '8px 16px',
                      border: 'none',
                      background: 'none',
                      color: '#3b82f6',
                      fontSize: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                  >
                    <FiPrinter size={12} /> Print
                  </button>
                </div>
              )}

              <div className="service-header" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div className="service-icon" style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  width: isMobile ? '40px' : '48px',
                  height: isMobile ? '40px' : '48px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: isMobile ? '18px' : '20px'
                }}>
                  <FiZap />
                </div>
                <h4 style={{
                  fontSize: isMobile ? '16px' : '18px',
                  margin: 0,
                  color: '#1e293b'
                }}>Inverter Services</h4>
              </div>
              
              <div className="service-stats" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div className="service-stat">
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '11px' : '12px',
                    color: '#6b7280',
                    display: 'block',
                    marginBottom: '4px'
                  }}>Revenue</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>{formatCurrency(summary.inverter_services.income.total)}</span>
                </div>
                <div className="service-stat">
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '11px' : '12px',
                    color: '#6b7280',
                    display: 'block',
                    marginBottom: '4px'
                  }}>Transactions</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>{formatNumber(summary.inverter_services.income.transaction_count)}</span>
                </div>
                <div className="service-stat">
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '11px' : '12px',
                    color: '#6b7280',
                    display: 'block',
                    marginBottom: '4px'
                  }}>Customers</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>{formatNumber(summary.inverter_services.income.unique_customers)}</span>
                </div>
                <div className="service-stat">
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '11px' : '12px',
                    color: '#6b7280',
                    display: 'block',
                    marginBottom: '4px'
                  }}>Avg Transaction</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '14px' : '16px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>{formatCurrency(summary.inverter_services.income.average)}</span>
                </div>
              </div>

              <div className="service-costs" style={{
                borderTop: '1px solid #e5e7eb',
                paddingTop: '16px',
                marginBottom: '16px'
              }}>
                <h5 style={{
                  fontSize: isMobile ? '12px' : '14px',
                  margin: '0 0 12px 0',
                  color: '#4b5563'
                }}>Costs</h5>
                <div className="cost-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: isMobile ? '12px' : '13px'
                }}>
                  <span>Expenses</span>
                  <span className="negative" style={{ color: '#ef4444' }}>{formatCurrency(summary.inverter_services.expenses.total)}</span>
                </div>
                <div className="cost-item" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: isMobile ? '12px' : '13px'
                }}>
                  <span>Salaries</span>
                  <span className="negative" style={{ color: '#ef4444' }}>{formatCurrency(summary.inverter_services.salaries.total)}</span>
                </div>
                <div className="cost-item total" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '8px',
                  fontSize: isMobile ? '12px' : '13px',
                  fontWeight: 'bold',
                  borderTop: '1px dashed #e5e7eb',
                  paddingTop: '8px',
                  marginTop: '8px'
                }}>
                  <span>Total Costs</span>
                  <span className="negative" style={{ color: '#ef4444' }}>{formatCurrency(summary.inverter_services.total_costs)}</span>
                </div>
              </div>

              <div className="service-profit" style={{
                background: '#f9fafb',
                padding: '16px',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h5 style={{
                  fontSize: isMobile ? '12px' : '14px',
                  margin: '0 0 8px 0',
                  color: '#4b5563'
                }}>Profit/Loss</h5>
                <div className={`profit-value ${summary.inverter_services.profit_status}`} style={{
                  fontSize: isMobile ? '18px' : '20px',
                  fontWeight: 'bold',
                  color: summary.inverter_services.profit_status === 'profit' ? '#10b981' : '#ef4444',
                  marginBottom: '4px'
                }}>
                  {formatCurrency(summary.inverter_services.net_profit)}
                </div>
                <div className="profit-margin" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: summary.inverter_services.profit_status === 'profit' ? '#10b981' : '#ef4444',
                  marginBottom: '8px'
                }}>
                  Margin: {formatPercentage(summary.inverter_services.profit_margin)}
                </div>
                <div className={`profit-badge ${summary.inverter_services.profit_status}`} style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: isMobile ? '10px' : '11px',
                  fontWeight: '500',
                  background: summary.inverter_services.profit_status === 'profit' ? '#10b98120' : '#ef444420',
                  color: summary.inverter_services.profit_status === 'profit' ? '#10b981' : '#ef4444'
                }}>
                  {summary.inverter_services.profit_status.toUpperCase()}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Service Type Breakdown Chart */}
          <div className="breakdown-chart" style={{
            marginTop: '24px',
            background: 'white',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{
              fontSize: isMobile ? '16px' : '18px',
              margin: '0 0 16px 0',
              color: '#1e293b'
            }}>Revenue Distribution</h4>
            <div className="distribution-bars">
              <div className="distribution-item" style={{
                marginBottom: '16px'
              }}>
                <span className="distribution-label" style={{
                  fontSize: isMobile ? '12px' : '13px',
                  display: 'block',
                  marginBottom: '4px',
                  color: '#4b5563'
                }}>Water Services</span>
                <div className="progress-bar-container" style={{
                  width: '100%',
                  height: isMobile ? '16px' : '20px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginBottom: '4px'
                }}>
                  <div 
                    className="progress-bar water" 
                    style={{
                      width: `${profit_analysis.service_type_breakdown.water_services.income_percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #10B981 0%, #059669 100%)',
                      borderRadius: '10px'
                    }}
                  ></div>
                </div>
                <span className="distribution-value" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: '500',
                  color: '#10b981'
                }}>
                  {formatPercentage(profit_analysis.service_type_breakdown.water_services.income_percentage)}
                </span>
              </div>
              <div className="distribution-item" style={{
                marginBottom: '16px'
              }}>
                <span className="distribution-label" style={{
                  fontSize: isMobile ? '12px' : '13px',
                  display: 'block',
                  marginBottom: '4px',
                  color: '#4b5563'
                }}>Inverter Services</span>
                <div className="progress-bar-container" style={{
                  width: '100%',
                  height: isMobile ? '16px' : '20px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginBottom: '4px'
                }}>
                  <div 
                    className="progress-bar inverter" 
                    style={{
                      width: `${profit_analysis.service_type_breakdown.inverter_services.income_percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                      borderRadius: '10px'
                    }}
                  ></div>
                </div>
                <span className="distribution-value" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: '500',
                  color: '#f59e0b'
                }}>
                  {formatPercentage(profit_analysis.service_type_breakdown.inverter_services.income_percentage)}
                </span>
              </div>
            </div>

            <h4 style={{
              fontSize: isMobile ? '16px' : '18px',
              margin: '24px 0 16px 0',
              color: '#1e293b'
            }}>Cost Distribution</h4>
            <div className="distribution-bars">
              <div className="distribution-item" style={{
                marginBottom: '16px'
              }}>
                <span className="distribution-label" style={{
                  fontSize: isMobile ? '12px' : '13px',
                  display: 'block',
                  marginBottom: '4px',
                  color: '#4b5563'
                }}>Water Services</span>
                <div className="progress-bar-container" style={{
                  width: '100%',
                  height: isMobile ? '16px' : '20px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginBottom: '4px'
                }}>
                  <div 
                    className="progress-bar water-cost" 
                    style={{
                      width: `${profit_analysis.service_type_breakdown.water_services.costs_percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                      borderRadius: '10px'
                    }}
                  ></div>
                </div>
                <span className="distribution-value" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: '500',
                  color: '#ef4444'
                }}>
                  {formatPercentage(profit_analysis.service_type_breakdown.water_services.costs_percentage)}
                </span>
              </div>
              <div className="distribution-item" style={{
                marginBottom: '16px'
              }}>
                <span className="distribution-label" style={{
                  fontSize: isMobile ? '12px' : '13px',
                  display: 'block',
                  marginBottom: '4px',
                  color: '#4b5563'
                }}>Inverter Services</span>
                <div className="progress-bar-container" style={{
                  width: '100%',
                  height: isMobile ? '16px' : '20px',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  marginBottom: '4px'
                }}>
                  <div 
                    className="progress-bar inverter-cost" 
                    style={{
                      width: `${profit_analysis.service_type_breakdown.inverter_services.costs_percentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
                      borderRadius: '10px'
                    }}
                  ></div>
                </div>
                <span className="distribution-value" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  fontWeight: '500',
                  color: '#f59e0b'
                }}>
                  {formatPercentage(profit_analysis.service_type_breakdown.inverter_services.costs_percentage)}
                </span>
              </div>
            </div>

            <h4 style={{
              fontSize: isMobile ? '16px' : '18px',
              margin: '24px 0 16px 0',
              color: '#1e293b'
            }}>Profit Contribution</h4>
            <div className="profit-contribution">
              <div className="contribution-item water" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '8px'
              }}>
                <span className="contribution-label" style={{
                  fontSize: isMobile ? '13px' : '14px',
                  color: '#4b5563'
                }}>Water Services</span>
                <span className={`contribution-value ${summary.water_services.net_profit >= 0 ? 'positive' : 'negative'}`} style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 'bold',
                  color: summary.water_services.net_profit >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {formatCurrency(summary.water_services.net_profit)}
                </span>
              </div>
              <div className="contribution-item inverter" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px',
                background: '#f9fafb',
                borderRadius: '8px',
                marginBottom: '8px'
              }}>
                <span className="contribution-label" style={{
                  fontSize: isMobile ? '13px' : '14px',
                  color: '#4b5563'
                }}>Inverter Services</span>
                <span className={`contribution-value ${summary.inverter_services.net_profit >= 0 ? 'positive' : 'negative'}`} style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 'bold',
                  color: summary.inverter_services.net_profit >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {formatCurrency(summary.inverter_services.net_profit)}
                </span>
              </div>
              <div className="contribution-item total" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px',
                background: '#667eea20',
                borderRadius: '8px',
                border: '1px solid #667eea40'
              }}>
                <span className="contribution-label" style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>Total Profit</span>
                <span className={`contribution-value ${summary.overall.net_profit >= 0 ? 'positive' : 'negative'}`} style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 'bold',
                  color: summary.overall.net_profit >= 0 ? '#10b981' : '#ef4444'
                }}>
                  {formatCurrency(summary.overall.net_profit)}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Profit Analysis View */}
      {viewMode === 'profit' && (
        <motion.div 
          className="profit-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            padding: isMobile ? '16px' : '24px'
          }}
        >
          <h3 style={{
            fontSize: isMobile ? '18px' : '22px',
            margin: '0 0 20px 0',
            color: '#1e293b'
          }}>Profit Analysis</h3>
          
          <div className="profit-cards" style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
            gap: isMobile ? '16px' : '20px',
            marginBottom: '24px'
          }}>
            <div className="profit-card" style={{
              background: 'white',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{
                fontSize: isMobile ? '15px' : '16px',
                margin: '0 0 16px 0',
                color: '#1e293b',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '8px'
              }}>Revenue vs Costs</h4>
              <div className="profit-stats">
                <div className="profit-stat" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px dashed #e5e7eb'
                }}>
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: '#6b7280'
                  }}>Revenue %</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 'bold',
                    color: '#10b981'
                  }}>{formatPercentage(profit_analysis.revenue_vs_costs.income_percentage)}</span>
                </div>
                <div className="profit-stat" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px dashed #e5e7eb'
                }}>
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: '#6b7280'
                  }}>Expenses %</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 'bold',
                    color: '#ef4444'
                  }}>{formatPercentage(profit_analysis.revenue_vs_costs.expenses_percentage)}</span>
                </div>
                <div className="profit-stat" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px dashed #e5e7eb'
                }}>
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: '#6b7280'
                  }}>Salaries %</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 'bold',
                    color: '#3b82f6'
                  }}>{formatPercentage(profit_analysis.revenue_vs_costs.salaries_percentage)}</span>
                </div>
                <div className="profit-stat" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0'
                }}>
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: '#6b7280'
                  }}>Profit %</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 'bold',
                    color: summary.overall.is_profitable ? '#10b981' : '#ef4444'
                  }}>
                    {formatPercentage(profit_analysis.revenue_vs_costs.profit_percentage)}
                  </span>
                </div>
              </div>
            </div>

            <div className="profit-card" style={{
              background: 'white',
              borderRadius: '12px',
              padding: isMobile ? '16px' : '20px',
              border: '1px solid #e5e7eb'
            }}>
              <h4 style={{
                fontSize: isMobile ? '15px' : '16px',
                margin: '0 0 16px 0',
                color: '#1e293b',
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '8px'
              }}>Break-even Analysis</h4>
              <div className="profit-stats">
                <div className="profit-stat" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px dashed #e5e7eb'
                }}>
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: '#6b7280'
                  }}>Current Revenue</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>{formatCurrency(profit_analysis.break_even_point.current_income)}</span>
                </div>
                <div className="profit-stat" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px dashed #e5e7eb'
                }}>
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: '#6b7280'
                  }}>Needed Revenue</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 'bold',
                    color: '#1e293b'
                  }}>{formatCurrency(profit_analysis.break_even_point.needed_income)}</span>
                </div>
                <div className="profit-stat" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px dashed #e5e7eb'
                }}>
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: '#6b7280'
                  }}>Gap</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 'bold',
                    color: profit_analysis.break_even_point.gap <= 0 ? '#10b981' : '#ef4444'
                  }}>
                    {formatCurrency(Math.abs(profit_analysis.break_even_point.gap))}
                    {profit_analysis.break_even_point.gap <= 0 ? ' (Surplus)' : ' (Deficit)'}
                  </span>
                </div>
                <div className="profit-stat" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0'
                }}>
                  <span className="stat-label" style={{
                    fontSize: isMobile ? '12px' : '13px',
                    color: '#6b7280'
                  }}>Status</span>
                  <span className="stat-value" style={{
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: 'bold',
                    color: profit_analysis.break_even_point.is_profitable ? '#10b981' : '#ef4444'
                  }}>
                    {profit_analysis.break_even_point.is_profitable ? 'Profitable' : 'Not Profitable'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="cost-breakdown" style={{
            background: 'white',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            border: '1px solid #e5e7eb'
          }}>
            <h4 style={{
              fontSize: isMobile ? '16px' : '18px',
              margin: '0 0 16px 0',
              color: '#1e293b',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '8px'
            }}>Cost Breakdown</h4>
            <div className="cost-items">
              <div className="cost-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px dashed #e5e7eb'
              }}>
                <span className="cost-label" style={{
                  fontSize: isMobile ? '13px' : '14px',
                  color: '#4b5563'
                }}>Revenue</span>
                <span className="cost-value positive" style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 'bold',
                  color: '#10b981'
                }}>{formatCurrency(summary.overall.total_income)}</span>
              </div>
              <div className="cost-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px dashed #e5e7eb'
              }}>
                <span className="cost-label" style={{
                  fontSize: isMobile ? '13px' : '14px',
                  color: '#4b5563'
                }}>Expenses</span>
                <span className="cost-value negative" style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 'bold',
                  color: '#ef4444'
                }}>- {formatCurrency(summary.overall.total_expenses)}</span>
              </div>
              <div className="cost-item" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '1px dashed #e5e7eb'
              }}>
                <span className="cost-label" style={{
                  fontSize: isMobile ? '13px' : '14px',
                  color: '#4b5563'
                }}>Salaries</span>
                <span className="cost-value negative" style={{
                  fontSize: isMobile ? '13px' : '14px',
                  fontWeight: 'bold',
                  color: '#ef4444'
                }}>- {formatCurrency(summary.overall.total_salaries)}</span>
              </div>
              <div className="cost-item total" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderBottom: '2px solid #e5e7eb',
                marginTop: '8px'
              }}>
                <span className="cost-label" style={{
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>Total Costs</span>
                <span className="cost-value negative" style={{
                  fontSize: isMobile ? '14px' : '15px',
                  fontWeight: 'bold',
                  color: '#ef4444'
                }}>- {formatCurrency(summary.overall.total_costs)}</span>
              </div>
              <div className="cost-item net" style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                background: '#f9fafb',
                borderRadius: '8px',
                marginTop: '12px',
              }}>
                <span className="cost-label" style={{
                  fontSize: isMobile ? '15px' : '16px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>Net Profit/Loss</span>
                <span className="cost-value" style={{
                  fontSize: isMobile ? '15px' : '16px',
                  fontWeight: 'bold',
                  color: summary.overall.is_profitable ? '#10b981' : '#ef4444'
                }}>
                  {summary.overall.is_profitable ? '' : '-'}{formatCurrency(Math.abs(summary.overall.net_profit))}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Summary View - Additional Stats */}
      {viewMode === 'summary' && (
        <motion.div 
          className="summary-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            padding: isMobile ? '16px' : '24px'
          }}
        >
          <div className="stats-panel" style={{
            background: 'white',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            border: '1px solid #e5e7eb',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: isMobile ? '16px' : '18px',
              margin: '0 0 16px 0',
              color: '#1e293b',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '8px'
            }}>Revenue Overview</h3>
            <div className="stats-grid" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
              gap: isMobile ? '12px' : '16px'
            }}>
              <div className="stat-item" style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <span className="stat-label" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px'
                }}>Total Transactions</span>
                <span className="stat-value" style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{formatNumber(summary.overall.total_transactions)}</span>
              </div>
              <div className="stat-item" style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <span className="stat-label" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px'
                }}>Paid Transactions</span>
                <span className="stat-value" style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{formatNumber(summary.overall.paid_transactions)}</span>
              </div>
              <div className="stat-item" style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <span className="stat-label" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px'
                }}>Unique Customers</span>
                <span className="stat-value" style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{formatNumber(summary.overall.unique_customers)}</span>
              </div>
              <div className="stat-item" style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <span className="stat-label" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px'
                }}>Water Services</span>
                <span className="stat-value" style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{formatNumber(summary.water_services.income.transaction_count)}</span>
              </div>
              <div className="stat-item" style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <span className="stat-label" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px'
                }}>Inverter Services</span>
                <span className="stat-value" style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{formatNumber(summary.inverter_services.income.transaction_count)}</span>
              </div>
            </div>
          </div>

          <div className="expenses-panel" style={{
            background: 'white',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            border: '1px solid #e5e7eb',
            marginBottom: '20px'
          }}>
            <h3 style={{
              fontSize: isMobile ? '16px' : '18px',
              margin: '0 0 16px 0',
              color: '#1e293b',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '8px'
            }}>Expenses Breakdown</h3>
            <div className="expenses-grid" style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
              gap: isMobile ? '12px' : '16px'
            }}>
              <div className="expense-item" style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <span className="expense-label" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px'
                }}>Petrol (Water)</span>
                <span className="expense-value" style={{
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{formatCurrency(summary.water_services.expenses.by_type.petrol)}</span>
              </div>
              <div className="expense-item" style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <span className="expense-label" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px'
                }}>Petrol (Inverter)</span>
                <span className="expense-value" style={{
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{formatCurrency(summary.inverter_services.expenses.by_type.petrol)}</span>
              </div>
              <div className="expense-item" style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <span className="expense-label" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px'
                }}>Others (Water)</span>
                <span className="expense-value" style={{
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{formatCurrency(summary.water_services.expenses.by_type.others)}</span>
              </div>
              <div className="expense-item" style={{
                background: '#f9fafb',
                padding: '12px',
                borderRadius: '8px'
              }}>
                <span className="expense-label" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px'
                }}>Others (Inverter)</span>
                <span className="expense-value" style={{
                  fontSize: isMobile ? '14px' : '16px',
                  fontWeight: 'bold',
                  color: '#1e293b'
                }}>{formatCurrency(summary.inverter_services.expenses.by_type.others)}</span>
              </div>
              <div className="expense-item total" style={{
                background: '#667eea20',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #667eea40'
              }}>
                <span className="expense-label" style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: '#6b7280',
                  display: 'block',
                  marginBottom: '4px'
                }}>Total Expenses</span>
                <span className="expense-value" style={{
                  fontSize: isMobile ? '16px' : '18px',
                  fontWeight: 'bold',
                  color: '#ef4444'
                }}>{formatCurrency(summary.overall.total_expenses)}</span>
              </div>
            </div>
          </div>

          <div className="date-range-info" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '12px',
            padding: isMobile ? '16px' : '20px',
            color: 'white'
          }}>
            <h3 style={{
              fontSize: isMobile ? '16px' : '18px',
              margin: '0 0 12px 0',
              color: 'white'
            }}>Period Information</h3>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '8px' : '24px'
            }}>
              <p style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <FiCalendar size={isMobile ? 14 : 16} />
                <span>Filter: {getDateRangeDisplay()}</span>
              </p>
              <p style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <FiCalendar size={isMobile ? 14 : 16} />
                <span>From: {formatDate(summary.date_range.from)}</span>
              </p>
              <p style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: 0,
                fontSize: isMobile ? '13px' : '14px'
              }}>
                <FiCalendar size={isMobile ? 14 : 16} />
                <span>To: {formatDate(summary.date_range.to)}</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .filter-select:hover,
        .btn:hover,
        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .filter-select:focus,
        input:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102,126,234,0.1);
        }

        .btn.csv-btn:hover {
          background-color: #10b981 !important;
          color: white !important;
        }

        .btn.pdf-btn:hover {
          background-color: #ef4444 !important;
          color: white !important;
        }

        .btn.print-btn:hover {
          background-color: #3b82f6 !important;
          color: white !important;
        }

        .btn.filter-btn:hover {
          background-color: #667eea !important;
          color: white !important;
        }

        /* Print styles */
        @media print {
          .revenue-header,
          .last-updated,
          .view-mode-tabs,
          .export-actions,
          .btn {
            display: none !important;
          }
        }

        /* Responsive styles for all devices */
        @media (max-width: 639px) {
          .revenue-tab {
            font-size: 12px;
          }
          
          .summary-card {
            padding: 12px !important;
          }
          
          .service-card {
            padding: 12px !important;
          }
        }

        @media (min-width: 640px) and (max-width: 1023px) {
          .summary-card {
            padding: 16px !important;
          }
        }

        @media (min-width: 1024px) and (max-width: 1439px) {
          .summary-card {
            padding: 18px !important;
          }
        }

        @media (min-width: 1440px) {
          .revenue-tab {
            max-width: 1400px;
            margin: 0 auto;
          }
        }

        /* Ensure proper scrolling on mobile */
        .view-mode-tabs::-webkit-scrollbar {
          display: none;
        }

        .view-mode-tabs {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default RevenueTab;
