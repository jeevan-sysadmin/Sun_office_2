import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  FiShoppingBag,
  FiActivity,
  FiUsers,
  FiBattery,
  FiTrendingUp,
  FiCalendar,
  FiClock,
  FiDollarSign,
  FiCreditCard,
  FiBarChart2
} from "react-icons/fi";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import "./css/DashboardTab.css";

// Define interfaces based on your database structure
interface BatteryConditions {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  dead: number;
}

interface WarrantyStatus {
  in_warranty: number;
  extended_warranty: number;
  out_of_warranty: number;
  no_warranty: number;
}

interface DashboardStats {
  total_customers: number;
  total_batteries: number;
  active_batteries?: number;
  total_services: number;
  pending_services?: number;
  total_staff: number;
  monthly_revenue: number;
  monthly_expenses: number;
  monthly_salary: number;
  monthly_profit: number;
  battery_conditions: BatteryConditions;
  warranty_status: WarrantyStatus;
}

interface DashboardTabProps {
  dashboardStats: DashboardStats;
  selectedFinancialMonth?: string;
  onFinancialMonthChange?: (month: string) => void;
  onOpenDashboardOverview?: () => void;
  onOpenFinancialOverview?: () => void;
  onOpenCustomersPage?: () => void;
  onOpenServicesPage?: () => void;
  onOpenProductsPage?: () => void;
  onOpenStaffPage?: () => void;
  recentServices?: any[];
  activities?: any[];
  getStatusColor?: (status: string) => string;
  getPriorityColor?: (priority: string) => string;
  getPaymentStatusColor?: (status: string) => string;
  getServiceTypeColor?: (type: string) => string;
  onViewService?: (service: any) => void;
  onEditService?: (service: any) => void;
  onViewAllServices?: () => void;
  loading: boolean;
}

const DashboardTab: React.FC<DashboardTabProps> = ({
  dashboardStats,
  selectedFinancialMonth = '',
  onFinancialMonthChange,
  onOpenDashboardOverview,
  onOpenFinancialOverview,
  onOpenCustomersPage,
  onOpenServicesPage,
  onOpenProductsPage,
  onOpenStaffPage,
  loading
}) => {
  const handleCardKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    onOpen?: () => void
  ) => {
    if (!onOpen) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  // State for current date and time
  const [currentDateTime, setCurrentDateTime] = useState({
    date: "",
    time: "",
    day: "",
    month: "",
    year: "",
    hour: "",
    minute: "",
    second: "",
    ampm: ""
  });

  // Update current date and time every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      
      const day = now.toLocaleDateString('en-IN', { weekday: 'long' });
      const date = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const hour12 = hours % 12 || 12;
      
      setCurrentDateTime({
        date,
        time: now.toLocaleTimeString('en-IN', {
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        day,
        month: now.toLocaleDateString('en-IN', { month: 'long' }),
        year: now.getFullYear().toString(),
        hour: hour12.toString().padStart(2, '0'),
        minute: minutes.toString().padStart(2, '0'),
        second: seconds.toString().padStart(2, '0'),
        ampm
      });
    };
    
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Main stats data (only essential ones)
  const mainStatsData = [
    {
      id: 1,
      title: "Total Customers",
      value: dashboardStats.total_customers?.toString() || "0",
      icon: <FiUsers />,
      color: "#3B82F6",
      onClick: onOpenCustomersPage
    },
    {
      id: 2,
      title: "Total Services",
      value: dashboardStats.total_services?.toString() || "0",
      icon: <FiShoppingBag />,
      color: "#10B981",
      onClick: onOpenServicesPage
    },
    {
      id: 3,
      title: "Total Batteries",
      value: dashboardStats.total_batteries?.toString() || "0",
      icon: <FiBattery />,
      color: "#F59E0B",
      onClick: onOpenProductsPage
    },
    {
      id: 4,
      title: "Total Staff",
      value: dashboardStats.total_staff?.toString() || "0",
      icon: <FiUsers />,
      color: "#8B5CF6",
      onClick: onOpenStaffPage
    }
  ];

  // Financial stats data
  const financialStatsData = [
    {
      id: 1,
      title: "Monthly Revenue",
      value: `₹${(dashboardStats.monthly_revenue || 0).toLocaleString()}`,
      icon: <FiDollarSign />,
      color: "#10B981",
      onClick: onOpenFinancialOverview
    },
    {
      id: 2,
      title: "Monthly Expenses",
      value: `₹${(dashboardStats.monthly_expenses || 0).toLocaleString()}`,
      icon: <FiCreditCard />,
      color: "#F59E0B",
      onClick: onOpenFinancialOverview
    },
    {
      id: 3,
      title: "Monthly Salary",
      value: `₹${(dashboardStats.monthly_salary || 0).toLocaleString()}`,
      icon: <FiUsers />,
      color: "#3B82F6",
      onClick: onOpenFinancialOverview
    },
    {
      id: 4,
      title: "Monthly Profit",
      value: `₹${(dashboardStats.monthly_profit || 0).toLocaleString()}`,
      icon: <FiTrendingUp />,
      color: (dashboardStats.monthly_profit || 0) >= 0 ? "#10B981" : "#DC2626",
      onClick: onOpenFinancialOverview
    }
  ];

  // Battery conditions data for pie chart
  const batteryConditionsData = [
    { name: 'Excellent', value: dashboardStats.battery_conditions?.excellent || 0, color: '#10B981' },
    { name: 'Good', value: dashboardStats.battery_conditions?.good || 0, color: '#3B82F6' },
    { name: 'Fair', value: dashboardStats.battery_conditions?.fair || 0, color: '#F59E0B' },
    { name: 'Poor', value: dashboardStats.battery_conditions?.poor || 0, color: '#F97316' },
    { name: 'Dead', value: dashboardStats.battery_conditions?.dead || 0, color: '#DC2626' }
  ].filter(item => item.value > 0);

  // Warranty status data for pie chart
  const warrantyStatusData = [
    { name: 'In Warranty', value: dashboardStats.warranty_status?.in_warranty || 0, color: '#10B981' },
    { name: 'Extended', value: dashboardStats.warranty_status?.extended_warranty || 0, color: '#3B82F6' },
    { name: 'Out of Warranty', value: dashboardStats.warranty_status?.out_of_warranty || 0, color: '#F59E0B' },
    { name: 'No Warranty', value: dashboardStats.warranty_status?.no_warranty || 0, color: '#6B7280' }
  ].filter(item => item.value > 0);

  // Custom label render function for pie charts
  const renderCustomLabel = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    if (percent < 0.05) return null;
    
    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={11}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-tab">
      {/* Big Date & Time Display Card */}
      <motion.div 
        className="big-datetime-card"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="datetime-content">
          <div className="date-section">
            <div className="day-name">{currentDateTime.day}</div>
            <div className="full-date">
              <span className="date-number">
                {new Date().getDate().toString().padStart(2, '0')}
              </span>
              <span className="date-month-year">
                <span className="month">{currentDateTime.month}</span>
                <span className="year">{currentDateTime.year}</span>
              </span>
            </div>
          </div>
          
          <div className="time-section">
            <div className="time-display">
              <div className="time-digits">
                <motion.span 
                  key={currentDateTime.hour}
                  className="time-hour"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentDateTime.hour}
                </motion.span>
                <span className="time-colon">:</span>
                <motion.span 
                  key={currentDateTime.minute}
                  className="time-minute"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  {currentDateTime.minute}
                </motion.span>
                <span className="time-colon">:</span>
                <motion.span 
                  key={currentDateTime.second}
                  className="time-second"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  {currentDateTime.second}
                </motion.span>
              </div>
              <div className="time-ampm">{currentDateTime.ampm}</div>
            </div>
          </div>
          
          <div className="datetime-icons">
            <div className="icon-item">
              <FiCalendar className="icon" />
              <span>Date</span>
            </div>
            <div className="icon-item">
              <FiClock className="icon" />
              <span>Time</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Stats Grid - Only Essential Stats */}
      <div
        className={`section-header ${onOpenDashboardOverview ? "clickable-section" : ""}`}
        onClick={onOpenDashboardOverview}
        onKeyDown={(event) => handleCardKeyDown(event, onOpenDashboardOverview)}
        role={onOpenDashboardOverview ? "button" : undefined}
        tabIndex={onOpenDashboardOverview ? 0 : undefined}
      >
        <div className="section-title">
          <h2>Dashboard Overview</h2>
          <p>Key business metrics</p>
        </div>
        {onOpenDashboardOverview && <span className="section-link-hint">Open page</span>}
      </div>
      
      <div className="stats-grid">
        {mainStatsData.map((stat, index) => (
          <motion.div
            key={stat.id}
            className={`stat-card ${stat.onClick ? "clickable-card" : ""}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
            onClick={stat.onClick}
            onKeyDown={(event) => handleCardKeyDown(event, stat.onClick)}
            role={stat.onClick ? "button" : undefined}
            tabIndex={stat.onClick ? 0 : undefined}
          >
            <div 
              className="stat-icon-container"
              style={{ backgroundColor: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="stat-content">
              <p className="stat-title">{stat.title}</p>
              <h3 className="stat-value">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Financial Stats Grid */}
      <div
        className={`section-header ${onOpenFinancialOverview ? "clickable-section" : ""}`}
        onClick={onOpenFinancialOverview}
        onKeyDown={(event) => handleCardKeyDown(event, onOpenFinancialOverview)}
        role={onOpenFinancialOverview ? "button" : undefined}
        tabIndex={onOpenFinancialOverview ? 0 : undefined}
      >
        <div className="section-title">
          <h2>Financial Overview</h2>
          <p>Monthly financial statistics</p>
        </div>
        <div>
          <input
            type="month"
            value={selectedFinancialMonth}
            onChange={(e) => onFinancialMonthChange?.(e.target.value)}
            style={{
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '14px',
              backgroundColor: '#fff'
            }}
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
          />
        </div>
      </div>
      
      <div className="stats-grid">
        {financialStatsData.map((stat, index) => (
          <motion.div
            key={stat.id}
            className={`stat-card ${stat.onClick ? "clickable-card" : ""}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            onClick={stat.onClick}
            onKeyDown={(event) => handleCardKeyDown(event, stat.onClick)}
            role={stat.onClick ? "button" : undefined}
            tabIndex={stat.onClick ? 0 : undefined}
          >
            <div 
              className="stat-icon-container"
              style={{ backgroundColor: stat.color }}
            >
              {stat.icon}
            </div>
            <div className="stat-content">
              <p className="stat-title">{stat.title}</p>
              <h3 className={`stat-value ${(stat.title === "Monthly Profit" && (dashboardStats.monthly_profit || 0) < 0) ? 'negative' : ''}`}>
                {stat.value}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Battery Conditions Pie Chart */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="chart-header">
            <h3>Battery Conditions</h3>
            <p>Current status of all batteries</p>
          </div>
          <div className="chart-container">
            {batteryConditionsData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={batteryConditionsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {batteryConditionsData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} batteries`, 'Count']}
                    labelFormatter={(label: any) => `Condition: ${label}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-chart">
                <FiBattery className="empty-icon" />
                <p>No battery condition data available</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Warranty Status Pie Chart */}
        <motion.div 
          className="chart-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="chart-header">
            <h3>Warranty Status</h3>
            <p>Service orders by warranty type</p>
          </div>
          <div className="chart-container">
            {warrantyStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={warrantyStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={renderCustomLabel}
                    labelLine={false}
                  >
                    {warrantyStatusData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} services`, 'Count']}
                    labelFormatter={(label: any) => `Warranty: ${label}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data-chart">
                <FiActivity className="empty-icon" />
                <p>No warranty data available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Simple Summary Line */}
      <motion.div 
        className="summary-line"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <div className="summary-line-content">
          <FiBarChart2 className="summary-line-icon" />
          <span>Last updated: {new Date().toLocaleString()}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default DashboardTab;
