// src/components/types.ts
// This file should contain ALL shared type definitions

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
  position?: string;
  phone?: string;
  address?: string;
  join_date?: string;
  salary?: number;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  password?: string;
  emergency_contact?: string;
  blood_group?: string;
  date_of_birth?: string;
  joining_date?: string;
  bank_account?: string;
  ifsc_code?: string;
  pan_number?: string;
  aadhar_number?: string;
}

export interface ServiceOrder {
  id: number;
  service_code: string;
  customer_id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_alternate_phone?: string;
  customer_address?: string;
  battery_id: number | null;
  battery_ids?: number[];
  battery_model: string;
  battery_serial: string;
  battery_brand: string;
  battery_capacity: string;
  battery_voltage: string;
  battery_type: string;
  inverter_id?: number | null;
  inverter_ids?: number[];
  inverter_model: string;
  inverter_serial: string;
  inverter_brand?: string;
  inverter_power_rating?: string;
  inverter_capacity?: string;
  inverter_type?: string;
  inverter_wave_type?: string;
  inverter_input_voltage?: string;
  inverter_output_voltage?: string;
  inverter_efficiency?: string;
  inverter_battery_voltage?: string;
  inverter_specifications?: string;
  inverter_warranty_period?: string;
  inverter_price?: string;
  inverter_status?: string;
  inverter_purchase_date?: string;
  inverter_installation_date?: string;
  inverter_condition?: string;
  power_rating?: string;
  type?: string;
  wave_type?: string;
  input_voltage?: string;
  output_voltage?: string;
  efficiency?: string;
  specifications?: string;
  warranty_period?: string;
  price?: string;
  condition?: string;
  issue_description: string;
  status: string;
  priority: string;
  payment_status: string;
  estimated_cost?: string;
  final_cost?: string;
  deposit_amount?: string;
  warranty_status: string;
  amc_status: string;
  battery_claim?: string;
  estimated_completion_date?: string;
  notes: string;
  created_at: string;
  updated_at: string;
  service_staff_id?: number;
  service_staff_name?: string;
  service_staff_email?: string;
  service_staff_phone?: string;
  service_staff_role?: string;
  staff_name?: string;
  staff_email?: string;
  staff_phone?: string;
  staff_role?: string;
  assigned_staff?: string;
  technician?: string;
  staff?: {
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
  };
  battery_code?: string;
  inverter_code?: string;
  replacement_battery_model?: string;
  replacement_battery_serial?: string;
  service_type?: string;
  purchase_date?: string;
  installation_date?: string;
  battery_warranty?: string;
  batteries?: Array<{
    id: number;
    battery_model?: string;
    battery_serial?: string;
    brand?: string;
    capacity?: string;
    voltage?: string;
    battery_type?: string;
  }>;
  inverters?: Array<{
    id: number;
    inverter_model?: string;
    inverter_serial?: string;
    inverter_brand?: string;
    power_rating?: string;
    wave_type?: string;
    battery_voltage?: string;
  }>;
}

export interface InverterService {
  id: number;
  service_code: string;
  customer_id: number;
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  customer_address?: string;
  customer_city?: string;
  customer_state?: string;
  customer_zip?: string;
  inverter_id: number;
  inverter_ids?: number[];
  inverter_model: string;
  inverter_serial: string;
  inverter_brand: string;
  inverter_power_rating: string;
  inverter_type: string;
  inverter_wave_type: string;
  issue_description: string;
  diagnostic_results?: string;
  repair_description?: string;
  replacement_parts?: string;
  status: string;
  priority: string;
  payment_status: string;
  estimated_cost?: string;
  final_cost: string;
  deposit_amount?: string;
  warranty_status: string;
  amc_status: string;
  inverter_claim?: string;
  estimated_completion_date?: string;
  notes: string;
  created_at: string;
  updated_at: string;
  service_staff_id?: number;
  service_staff_name?: string;
  staff_name?: string;
  staff_email?: string;
  service_type: string;
  inverters?: Array<{
    id: number;
    inverter_model?: string;
    inverter_serial?: string;
    inverter_brand?: string;
    power_rating?: string;
    wave_type?: string;
    battery_voltage?: string;
  }>;
}

export interface Customer {
  id: number;
  customer_code: string;
  full_name: string;
  email: string;
  phone: string;
  alternate_phone?: string;
  whatsapp_no?: string;
  address: string;
  landmark?: string;
  area?: string;
  city: string;
  state: string;
  zip_code: string;
  gst_no?: string;
  customer_type?: string;
  status?: string;
  notes: string;
  created_at: string;
  updated_at: string;
  total_services: number;
  service_count: number;
  last_service_date?: string;
}

export interface Battery {
  id: number;
  battery_code: string;
  battery_model: string;
  battery_serial: string;
  brand: string;
  capacity: string;
  voltage: string;
  battery_type: string;
  category: string;
  price: string;
  warranty_period: string;
  amc_period: string;
  inverter_model: string;
  battery_condition: string;
  is_spare: any;
  spare_status?: string;
  created_at: string;
  total_services?: number;
  specifications: string;
  purchase_date: string;
  installation_date: string;
  last_service_date?: string;
  stock_quantity?: string;
  claim_type?: string;
  status: string;
  shop_stock_quantity?: string;
  company_stock_quantity?: string;
  tracking_status?: string;
  warranty_expiry_date?: string;
  warranty_remarks?: string;
}

export interface Inverter {
  id: number;
  inverter_code: string;
  inverter_model: string;
  inverter_brand: string;
  power_rating: string;
  type: string;
  wave_type: string;
  input_voltage: string;
  output_voltage: string;
  efficiency: string;
  battery_voltage: string;
  specifications: string;
  warranty_period: string;
  price: string;
  status: string;
  purchase_date: string;
  installation_date: string;
  inverter_condition: string;
  created_at: string;
  updated_at: string;
  total_services?: number;
  inverter_serial: string;
}

export interface Staff {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
  phone?: string;
  address?: string;
  department?: string;
  position?: string;
  password?: string;
  emergency_contact?: string;
  blood_group?: string;
  date_of_birth?: string;
  joining_date?: string;
  salary?: number;
  bank_account?: string;
  ifsc_code?: string;
  pan_number?: string;
  aadhar_number?: string;
}

export interface DashboardStats {
  total_customers: number;
  total_batteries: number;
  total_inverters: number;
  active_batteries: number;
  active_inverters: number;
  total_services: number;
  pending_services: number;
  total_staff: number;
  monthly_revenue: number;
  monthly_expenses: number;
  monthly_salary: number;
  monthly_profit: number;
  battery_conditions: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    dead: number;
  };
  inverter_conditions: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
    dead: number;
  };
  warranty_status: {
    "": number;
    in_warranty: number;
    extended_warranty: number;
    out_of_warranty: number;
    no_warranty: number;
  };
}

export interface RevenueStats {
  total_revenue: number;
  today_revenue: number;
  week_revenue: number;
  month_revenue: number;
  year_revenue: number;
  pending_payments: number;
  completed_payments: number;
  average_order_value: number;
  revenue_by_payment_method: {
    cash: number;
    card: number;
    online: number;
  };
  revenue_by_service_type: {
    battery_service: number;
    inverter_service: number;
    hybrid_service: number;
  };
  recent_transactions: ServiceOrder[];
}

export interface Activity {
  activity: string;
  timestamp: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  services?: ServiceOrder[];
  customers?: any[];
  batteries?: any[];
  inverters?: any[];
  users?: any[];
  data?: any;
  stats?: any;
  recent_services?: any[];
  count?: number;
  warranty_status?: string;
  amc_status?: string;
}

export interface DashboardProps {
  onLogout: () => void;
  user?: User | null;
}

export interface NavItem {
  icon: React.ReactNode;
  label: string;
  id: string;
}
