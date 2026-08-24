// src/components/modals/InverterServiceFormModal.tsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  FiX,
  FiUser,
  FiPhone,
  FiCalendar,
  FiDollarSign,
  FiServer,
  FiAlertCircle,
  FiFileText,
  FiSave,
  FiLoader,
  FiRefreshCw,
  FiSearch,
  FiChevronDown
} from "react-icons/fi";
import { API_BASE_URL } from "../../config/api";

// Interfaces
interface Customer {
  id: number;
  customer_code: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  notes: string;
  created_at: string;
  total_services?: number;
}

interface Inverter {
  id: number;
  inverter_code: string;
  inverter_model: string;
  inverter_serial: string;
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
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  is_active?: boolean;
  last_login?: string;
  created_at?: string;
}

interface InverterServiceForm {
  id?: number | null;
  customer_id: number | null;
  customer_phone: string;
  inverter_id: number | null;
  inverter_ids?: number[];
  service_staff_id: number | null;
  issue_description: string;
  warranty_status: string;
  notes: string;
  status: string;
  payment_status: string;
  final_cost: string;
  estimated_completion_date: string;
}

interface InverterServiceFormModalProps {
  showForm: boolean;
  editMode: boolean;
  formType: string;
  serviceForm: InverterServiceForm;
  customers: Customer[];
  inverters: Inverter[];
  staffUsers: User[];
  loading: {
    services: boolean;
  };
  onClose: () => void;
  onServiceInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onServiceSubmit: (e: React.FormEvent) => void;
  editingServiceId?: number | null;
  onFetchServiceData?: (serviceId: number) => Promise<any>;
}

// Searchable Dropdown Component
interface SearchableDropdownProps {
  id: string;
  name: string;
  value: string | number;
  onChange: (e: any) => void;
  options: any[];
  optionLabel: (option: any) => string;
  optionValue: (option: any) => string | number;
  placeholder: string;
  label: string;
  icon: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  hint?: string;
  isMobile: boolean;
  allowEmpty?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  id,
  name,
  value,
  onChange,
  options,
  optionLabel,
  optionValue,
  placeholder,
  label,
  icon,
  required = false,
  disabled = false,
  loading = false,
  error,
  hint,
  isMobile,
  allowEmpty = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get selected option display text
  const getSelectedDisplayText = () => {
    if (!value || value === "") return placeholder;
    const selected = options.find(opt => optionValue(opt).toString() === value.toString());
    return selected ? optionLabel(selected) : placeholder;
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    optionLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Handle option selection
  const handleSelectOption = (option: any) => {
    const syntheticEvent = {
      target: {
        name: name,
        value: optionValue(option).toString()
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onChange(syntheticEvent);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle clear selection
  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    const syntheticEvent = {
      target: {
        name: name,
        value: ''
      }
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onChange(syntheticEvent);
  };

  return (
    <div className="form-group" ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <label htmlFor={id} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        marginBottom: '8px',
        fontWeight: '600',
        color: '#333',
        fontSize: isMobile ? '14px' : '14px'
      }}>
        {icon} {label} {required && '*'}
      </label>
      
      <div className="dropdown-container" style={{ position: 'relative' }}>
        {/* Dropdown Button */}
        <button
          type="button"
          className="dropdown-button"
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          disabled={disabled || loading}
          style={{
            width: '100%',
            padding: isMobile ? '12px 15px' : '10px 15px',
            paddingRight: value && allowEmpty ? '70px' : '40px',
            borderRadius: '8px',
            border: `1px solid ${error ? '#f56565' : '#ddd'}`,
            fontSize: isMobile ? '14px' : '14px',
            backgroundColor: disabled ? '#f5f5f5' : '#fff',
            textAlign: 'left',
            cursor: disabled ? 'not-allowed' : 'pointer',
            color: value ? '#333' : '#999',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            transition: 'all 0.2s'
          }}
        >
          <span style={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            flex: 1
          }}>
            {getSelectedDisplayText()}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {value && allowEmpty && !disabled && (
              <span
                onClick={handleClearSelection}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: '#f0f0f0',
                  color: '#666',
                  fontSize: '14px',
                  cursor: 'pointer',
                  marginRight: '4px'
                }}
                title="Clear selection"
              >
                ×
              </span>
            )}
            <FiChevronDown 
              style={{ 
                transform: isOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.2s',
                flexShrink: 0
              }} 
            />
          </div>
        </button>

        {/* Loading Indicator */}
        {loading && (
          <div style={{
            position: 'absolute',
            right: '40px',
            top: '50%',
            transform: 'translateY(-50%)'
          }}>
            <FiLoader className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        )}

        {/* Dropdown Menu */}
        {isOpen && !disabled && !loading && (
          <div
            className="dropdown-menu"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
              zIndex: 1000,
              maxHeight: '300px',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Search Input */}
            <div style={{
              padding: '8px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FiSearch style={{ color: '#999', flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  fontSize: isMobile ? '14px' : '14px',
                  padding: '4px 0'
                }}
              />
            </div>

            {/* Options List */}
            <div style={{
              overflowY: 'auto',
              maxHeight: '200px'
            }}>
              {/* Empty option */}
              {allowEmpty && (
                <div
                  className="dropdown-option"
                  onClick={() => {
                    const syntheticEvent = {
                      target: {
                        name: name,
                        value: ''
                      }
                    } as React.ChangeEvent<HTMLSelectElement>;
                    onChange(syntheticEvent);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  style={{
                    padding: isMobile ? '12px 15px' : '10px 15px',
                    cursor: 'pointer',
                    backgroundColor: !value ? '#ebf4ff' : 'transparent',
                    borderBottom: '1px solid #f0f0f0',
                    fontSize: isMobile ? '14px' : '14px',
                    transition: 'background-color 0.2s',
                    color: '#999',
                    fontStyle: 'italic'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f7fafc';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = !value ? '#ebf4ff' : 'transparent';
                  }}
                >
                  -- None --
                </div>
              )}
              
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const optionVal = optionValue(option).toString();
                  const isSelected = value && value.toString() === optionVal;
                  
                  return (
                    <div
                      key={index}
                      className="dropdown-option"
                      onClick={() => handleSelectOption(option)}
                      style={{
                        padding: isMobile ? '12px 15px' : '10px 15px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#ebf4ff' : 'transparent',
                        borderBottom: index < filteredOptions.length - 1 ? '1px solid #f0f0f0' : 'none',
                        fontSize: isMobile ? '14px' : '14px',
                        transition: 'background-color 0.2s',
                        wordBreak: 'break-word'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '#f7fafc';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {optionLabel(option)}
                    </div>
                  );
                })
              ) : (
                <div style={{
                  padding: isMobile ? '12px 15px' : '10px 15px',
                  color: '#999',
                  textAlign: 'center',
                  fontSize: isMobile ? '14px' : '14px'
                }}>
                  No results found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <small style={{
          display: 'block',
          marginTop: '6px',
          color: '#f56565',
          fontSize: isMobile ? '12px' : '12px'
        }}>
          {error}
        </small>
      )}

      {/* Hint */}
      {hint && !error && (
        <small className="form-hint" style={{
          display: 'block',
          marginTop: '6px',
          color: '#666',
          fontSize: isMobile ? '12px' : '12px'
        }}>
          {hint}
        </small>
      )}
    </div>
  );
};

const InverterServiceFormModal: React.FC<InverterServiceFormModalProps> = ({
  showForm,
  editMode,
  formType,
  serviceForm,
  customers,
  inverters,
  staffUsers,
  loading,
  onClose,
  onServiceInputChange,
  onServiceSubmit,
  editingServiceId = null,
  onFetchServiceData
}) => {
  // Window width state for responsive design
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check device type
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);
  const [localInverters, setLocalInverters] = useState<Inverter[]>(inverters);
  const [localStaff, setLocalStaff] = useState<User[]>(staffUsers);
  const [loadingData, setLoadingData] = useState({
    customers: false,
    inverters: false,
    staff: false,
    service: false
  });
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoadingData(prev => ({ ...prev, customers: true }));
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/customers.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.customers && Array.isArray(data.customers)) {
        const formattedCustomers: Customer[] = data.customers.map((customer: any) => ({
          id: parseInt(customer.id) || customer.id,
          customer_code: customer.customer_code || `CUST${String(customer.id).padStart(3, '0')}`,
          full_name: customer.full_name || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          state: customer.state || '',
          zip_code: customer.zip_code || '',
          notes: customer.notes || '',
          created_at: customer.created_at || new Date().toISOString(),
          total_services: parseInt(customer.total_services || '0')
        }));
        setLocalCustomers(formattedCustomers);
      } else {
        throw new Error(data.message || 'Invalid customers data format');
      }
    } catch (error: any) {
      console.error('Error fetching customers:', error);
      setError(`Failed to load customers: ${error.message}`);
      if (customers && customers.length > 0) {
        setLocalCustomers(customers);
      }
    } finally {
      setLoadingData(prev => ({ ...prev, customers: false }));
    }
  };

  // Fetch inverters from API - FIXED to handle all response formats
  const fetchInverters = async () => {
    try {
      setLoadingData(prev => ({ ...prev, inverters: true }));
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/inverters.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inverters: ${response.status}`);
      }
      
      const data = await response.json();
      
      let invertersData: any[] = [];
      
      // Handle different response formats
      if (data.success && data.data && Array.isArray(data.data)) {
        invertersData = data.data;
      } else if (data.success && Array.isArray(data.data)) {
        invertersData = data.data;
      } else if (data.success && data.inverters && Array.isArray(data.inverters)) {
        invertersData = data.inverters;
      } else if (Array.isArray(data)) {
        invertersData = data;
      } else {
        throw new Error(data.message || 'Invalid inverters data format');
      }
      
      if (Array.isArray(invertersData)) {
        const formattedInverters: Inverter[] = invertersData.map((inverter: any) => ({
          id: parseInt(inverter.id) || inverter.id,
          inverter_code: inverter.inverter_code || `INV${String(inverter.id).padStart(3, '0')}`,
          inverter_model: inverter.inverter_model || '',
          inverter_serial: inverter.inverter_serial || '',
          inverter_brand: inverter.inverter_brand || '',
          power_rating: inverter.power_rating || '',
          type: inverter.type || 'inverter',
          wave_type: inverter.wave_type || 'modified_sine',
          input_voltage: inverter.input_voltage || '230V',
          output_voltage: inverter.output_voltage || '230V',
          efficiency: inverter.efficiency || '',
          battery_voltage: inverter.battery_voltage || '12V',
          specifications: inverter.specifications || '',
          warranty_period: inverter.warranty_period || '1 year',
          price: inverter.price || '0',
          status: inverter.status || 'active',
          purchase_date: inverter.purchase_date || '',
          installation_date: inverter.installation_date || '',
          inverter_condition: inverter.inverter_condition || 'good',
          created_at: inverter.created_at || '',
          updated_at: inverter.updated_at || '',
          total_services: parseInt(inverter.total_services || '0')
        }));
        setLocalInverters(formattedInverters);
        console.log("Formatted inverters:", formattedInverters); // Debug log
      } else {
        throw new Error('Inverters data is not an array');
      }
    } catch (error: any) {
      console.error('Error fetching inverters:', error);
      setError(`Failed to load inverters: ${error.message}`);
      if (inverters && inverters.length > 0) {
        setLocalInverters(inverters);
      }
    } finally {
      setLoadingData(prev => ({ ...prev, inverters: false }));
    }
  };

  // Fetch staff/users from API
  const fetchStaff = async () => {
    try {
      setLoadingData(prev => ({ ...prev, staff: true }));
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/users.php`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch staff: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.users && Array.isArray(data.users)) {
        const formattedStaff = data.users.map((user: any) => ({
          id: parseInt(user.id) || user.id,
          name: user.name || '',
          email: user.email || '',
          role: user.role || 'user',
          phone: user.phone || '',
          is_active: user.is_active === 1 || user.is_active === true || true,
          last_login: user.last_login || '',
          created_at: user.created_at || new Date().toISOString()
        }));
        setLocalStaff(formattedStaff);
      } else {
        throw new Error(data.message || 'Invalid staff data format');
      }
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      setError(`Failed to load staff: ${error.message}`);
      if (staffUsers && staffUsers.length > 0) {
        setLocalStaff(staffUsers);
      }
    } finally {
      setLoadingData(prev => ({ ...prev, staff: false }));
    }
  };

  // Handle customer selection change
  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value ? parseInt(e.target.value) : null;
    
    // Create a synthetic event for customer_id
    const customerIdEvent = {
      target: {
        name: 'customer_id',
        value: customerId ? customerId.toString() : ''
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    onServiceInputChange(customerIdEvent);
    
    if (customerId && !isNaN(customerId)) {
      const selectedCustomer = localCustomers.find(c => c.id === customerId);
      if (selectedCustomer) {
        const normalizedPhone = String(selectedCustomer.phone || '').replace(/\D/g, '').slice(0, 10);
        const phoneEvent = {
          target: {
            name: 'customer_phone',
            value: normalizedPhone
          }
        } as React.ChangeEvent<HTMLInputElement>;
        
        onServiceInputChange(phoneEvent);
      }
    } else {
      const phoneEvent = {
        target: {
          name: 'customer_phone',
          value: ''
        }
      } as React.ChangeEvent<HTMLInputElement>;

      onServiceInputChange(phoneEvent);
    }
  };

  // Handle inverter selection change - FIXED to handle empty values
  const handleInverterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const inverterId = e.target.value ? parseInt(e.target.value) : null;

    const currentIds = Array.isArray(serviceForm.inverter_ids)
      ? serviceForm.inverter_ids.map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0)
      : (serviceForm.inverter_id ? [Number(serviceForm.inverter_id)] : []);

    const nextIds = inverterId && !currentIds.includes(inverterId)
      ? [...currentIds, inverterId]
      : currentIds;

    const inverterIdsEvent = {
      target: {
        name: 'inverter_ids',
        value: JSON.stringify(nextIds)
      }
    } as React.ChangeEvent<HTMLInputElement>;

    onServiceInputChange(inverterIdsEvent);

    if (inverterId && !isNaN(inverterId) && !editMode) {
      const selectedInverter = localInverters.find(i => i.id === inverterId);
      if (selectedInverter) {
        if (selectedInverter.purchase_date && selectedInverter.warranty_period) {
          const warrantyMatch = selectedInverter.warranty_period.match(/(\d+)/);
          if (warrantyMatch) {
            const warrantyYears = parseInt(warrantyMatch[1]);
            const purchaseDate = new Date(selectedInverter.purchase_date);
            const warrantyEndDate = new Date(purchaseDate);
            warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + warrantyYears);
            
            const today = new Date();
            let warrantyStatus = 'out_of_warranty';
            
            if (today <= warrantyEndDate) {
              warrantyStatus = 'in_warranty';
            }
            
            const warrantyEvent = {
              target: {
                name: 'warranty_status',
                value: warrantyStatus
              }
            } as React.ChangeEvent<HTMLSelectElement>;
            
            onServiceInputChange(warrantyEvent);
          }
        }
      }
    }
  };

  // Fetch service data when editing
  const fetchServiceData = async (serviceId: number) => {
    try {
      setLoadingData(prev => ({ ...prev, service: true }));
      setError(null);
      
      if (onFetchServiceData) {
        return await onFetchServiceData(serviceId);
      }
      
      const response = await fetch(`${API_BASE_URL}/inverter_services.php?id=${serviceId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch service: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        const serviceData = data.data;
        
        // Update form fields one by one
        const updateField = (name: string, value: any) => {
          const event = {
            target: {
              name,
              value: value !== null && value !== undefined ? value.toString() : ''
            }
          } as React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
          
          onServiceInputChange(event);
        };
        
        // Set the ID in the form state
        updateField('id', serviceData.id);
        updateField('customer_id', serviceData.customer_id);
        updateField('customer_phone', serviceData.customer_phone || '');
        updateField('inverter_id', serviceData.inverter_id || '');
        updateField('service_staff_id', serviceData.service_staff_id || '');
        updateField('issue_description', serviceData.issue_description || '');
        updateField('warranty_status', serviceData.warranty_status || 'out_of_warranty');
        updateField('notes', serviceData.notes || '');
        updateField('status', serviceData.status || 'pending');
        updateField('payment_status', serviceData.payment_status || 'pending');
        updateField('final_cost', serviceData.final_cost || '0');
        updateField('estimated_completion_date', serviceData.estimated_completion_date || '');
        
        return serviceData;
      } else {
        throw new Error('Service data not found');
      }
    } catch (error: any) {
      console.error('Error fetching service data:', error);
      setError(`Failed to load service data: ${error.message}`);
      throw error;
    } finally {
      setLoadingData(prev => ({ ...prev, service: false }));
    }
  };

  // Initialize form when modal opens or edit mode changes
  useEffect(() => {
    if (showForm && !isInitialized) {
      const initializeForm = async () => {
        try {
          // Fetch all data
          await Promise.all([
            fetchCustomers(),
            fetchInverters(),
            fetchStaff()
          ]);
          
          // If editing and we have a service ID, fetch the service data
          if (editMode && editingServiceId) {
            await fetchServiceData(editingServiceId);
          }
          
          setIsInitialized(true);
        } catch (error: any) {
          console.error('Error initializing form:', error);
          setError(`Failed to load form data: ${error.message}`);
        }
      };
      
      initializeForm();
    }
    
    // Reset initialization when modal closes
    if (!showForm) {
      setIsInitialized(false);
      setError(null);
    }
  }, [showForm, editMode, editingServiceId]);

  // Update local data when props change
  useEffect(() => {
    if (customers && customers.length > 0) {
      setLocalCustomers(customers);
    }
  }, [customers]);

  useEffect(() => {
    if (inverters && inverters.length > 0) {
      setLocalInverters(inverters);
    }
  }, [inverters]);

  useEffect(() => {
    if (staffUsers && staffUsers.length > 0) {
      setLocalStaff(staffUsers);
    }
  }, [staffUsers]);

  const getFormTitle = (): string => {
    return editMode ? 'Edit Inverter Service' : 'New Inverter Service';
  };

  const getFormDescription = (): string => {
    return editMode ? 'Update inverter service order details' : 'Create a new inverter service order';
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For edit mode, ensure the ID is included in the form data
    if (editMode && editingServiceId && !serviceForm.id) {
      // Create a synthetic event to update the ID field if not already set
      const idEvent = {
        target: {
          name: 'id',
          value: editingServiceId.toString()
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onServiceInputChange(idEvent);
    }
    
    onServiceSubmit(e);
  };

  // Handle refresh
  const handleRefresh = () => {
    setIsInitialized(false);
    setError(null);
    fetchCustomers();
    fetchInverters();
    fetchStaff();
  };

  // FIXED: Inverter option label function to handle empty values
  const getInverterLabel = (inverter: Inverter): string => {
    const brand = inverter.inverter_brand && inverter.inverter_brand.trim() !== '' 
      ? inverter.inverter_brand 
      : 'Unknown Brand';
    
    const model = inverter.inverter_model && inverter.inverter_model.trim() !== '' 
      ? inverter.inverter_model 
      : 'Unknown Model';
    
    const serial = inverter.inverter_serial && inverter.inverter_serial.trim() !== '' 
      ? ` (${inverter.inverter_serial})` 
      : '';
    
    const code = inverter.inverter_code ? ` [${inverter.inverter_code}]` : '';
    
    return `${brand} ${model}${serial}${code}`;
  };

  const selectedInverterCard = localInverters.find((inverter) => {
    if (!serviceForm.inverter_id) return false;
    return inverter.id === Number(serviceForm.inverter_id);
  });
  const selectedInverterIds = Array.isArray(serviceForm.inverter_ids)
    ? serviceForm.inverter_ids.map((id) => Number(id)).filter((id) => !isNaN(id) && id > 0)
    : (serviceForm.inverter_id ? [Number(serviceForm.inverter_id)] : []);
  const selectedInverterCards = localInverters.filter((inverter) => selectedInverterIds.includes(inverter.id));
  const removeSelectedInverter = (inverterId: number) => {
    const nextIds = selectedInverterIds.filter((id) => id !== inverterId);
    const inverterIdsEvent = {
      target: {
        name: 'inverter_ids',
        value: JSON.stringify(nextIds)
      }
    } as React.ChangeEvent<HTMLInputElement>;
    onServiceInputChange(inverterIdsEvent);
  };
  void selectedInverterCard;

  const renderServiceForm = () => (
    <form onSubmit={handleFormSubmit} className="service-form">
      {error && (
        <div className="error-alert" style={{
          backgroundColor: '#fee',
          color: '#c33',
          padding: isMobile ? '12px' : '10px 15px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          <FiLoader className="spinning" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          <span style={{ flex: 1, fontSize: isMobile ? '14px' : '14px' }}>{error}</span>
          <button 
            type="button"
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#c33',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '0 5px',
              flexShrink: 0
            }}
          >
            ×
          </button>
        </div>
      )}

      {loadingData.service && (
        <div className="loading-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255,255,255,0.9)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          borderRadius: '12px'
        }}>
          <FiLoader className="spinning" style={{ 
            animation: 'spin 1s linear infinite',
            fontSize: '32px',
            marginBottom: '15px',
            color: '#10b981'
          }} />
          <span style={{ fontSize: isMobile ? '14px' : '16px', color: '#333' }}>Loading service data...</span>
        </div>
      )}

      {/* Hidden ID field for edit mode */}
      {editMode && (
        <input
          type="hidden"
          name="id"
          value={serviceForm.id || editingServiceId || ''}
        />
      )}

      <div className="form-grid" style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(2, 1fr)',
        gap: isMobile ? '16px' : '20px',
        marginBottom: '30px'
      }}>
        {/* Customer Selection - Searchable Dropdown - Required */}
        <SearchableDropdown
          id="customer_id"
          name="customer_id"
          value={serviceForm.customer_id || ""}
          onChange={handleCustomerChange}
          options={localCustomers}
          optionLabel={(customer) => `${customer.full_name} (${customer.phone}) - ${customer.customer_code}`}
          optionValue={(customer) => customer.id}
          placeholder="Select a client"
          label="Select Client"
          icon={<FiUser />}
          required={true}
          disabled={loadingData.service}
          loading={loadingData.customers}
          hint="Mobile number will be auto-filled when client is selected"
          isMobile={isMobile}
        />

        {/* Customer Phone - Required */}
        <div className="form-group" style={{ gridColumn: isMobile ? 'auto' : 'span 1' }}>
          <label htmlFor="customer_phone" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333',
            fontSize: isMobile ? '14px' : '14px'
          }}>
            <FiPhone /> Mobile Number *
          </label>
          <input
            type="text"
            id="customer_phone"
            name="customer_phone"
            value={serviceForm.customer_phone}
            onChange={onServiceInputChange}
            placeholder="Mobile number"
            required
            readOnly={!!serviceForm.customer_id && !editMode}
            disabled={loadingData.service}
            style={{
              width: '100%',
              padding: isMobile ? '12px 15px' : '10px 15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: isMobile ? '14px' : '14px',
              backgroundColor: (serviceForm.customer_id && !editMode) ? '#f5f5f5' : '#fff',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        {/* Inverter Selection - Searchable Dropdown - NOW OPTIONAL with proper label function */}
        <SearchableDropdown
          id="inverter_id"
          name="inverter_picker"
          value=""
          onChange={handleInverterChange}
          options={localInverters}
          optionLabel={getInverterLabel}
          optionValue={(inverter) => inverter.id}
          placeholder="Select inverter (optional)"
          label="Select Inverter"
          icon={<FiServer />}
          required={false}
          disabled={loadingData.service}
          loading={loadingData.inverters}
          hint="Optional: Select an inverter if this service is for a specific unit"
          isMobile={isMobile}
          allowEmpty={true}
        />
        {selectedInverterCards.length > 0 && (
          <div style={{
            marginTop: '-8px',
            marginBottom: '18px',
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '10px'
          }}>
            {selectedInverterCards.map((card) => (
              <div
                key={card.id}
                style={{
                  border: '2px solid #10b981',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
                  padding: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontWeight: 600, color: '#064e3b', fontSize: '13px' }}>
                    {card.inverter_model || 'Unknown Model'}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelectedInverter(card.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#047857',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title="Remove"
                  >
                    <FiX size={15} />
                  </button>
                </div>
                <div style={{ fontSize: '12px', color: '#065f46' }}>
                  Serial: {card.inverter_serial || 'N/A'}
                </div>
                <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px' }}>
                  Code: {card.inverter_code || `INV${card.id}`}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Service Staff Selection - Searchable Dropdown - Optional */}
        <SearchableDropdown
          id="service_staff_id"
          name="service_staff_id"
          value={serviceForm.service_staff_id || ""}
          onChange={onServiceInputChange}
          options={localStaff}
          optionLabel={(staff) => `${staff.name} (${staff.role})`}
          optionValue={(staff) => staff.id}
          placeholder="Assign staff (optional)"
          label="Service Staff"
          icon={<FiUser />}
          required={false}
          disabled={loadingData.service}
          loading={loadingData.staff}
          hint="Optional: Assign a service technician"
          isMobile={isMobile}
          allowEmpty={true}
        />

        {/* Issue Description - Full Width - OPTIONAL */}
        <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="issue_description" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333',
            fontSize: isMobile ? '14px' : '14px'
          }}>
            <FiAlertCircle /> Issue Description
          </label>
          <textarea
            id="issue_description"
            name="issue_description"
            value={serviceForm.issue_description}
            onChange={onServiceInputChange}
            placeholder="Describe the issue (optional)"
            rows={isMobile ? 3 : 2}
            disabled={loadingData.service}
            style={{
              width: '100%',
              padding: isMobile ? '12px 15px' : '10px 15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: isMobile ? '14px' : '14px',
              backgroundColor: '#fff',
              resize: 'vertical',
              minHeight: isMobile ? '80px' : '60px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        {/* Status - Required */}
        <div className="form-group" style={{ gridColumn: isMobile ? 'auto' : 'span 1' }}>
          <label htmlFor="status" style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333',
            fontSize: isMobile ? '14px' : '14px'
          }}>
            Status *
          </label>
          <select
            id="status"
            name="status"
            value={serviceForm.status}
            onChange={onServiceInputChange}
            required
            disabled={loadingData.service}
            style={{
              width: '100%',
              padding: isMobile ? '12px 15px' : '10px 15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: isMobile ? '14px' : '14px',
              backgroundColor: '#fff',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '16px',
              cursor: 'pointer'
            }}
          >
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="diagnostic">Diagnostic</option>
            <option value="repairing">Repairing</option>
            <option value="testing">Testing</option>
            <option value="completed">Completed</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Payment Status - Required */}
        <div className="form-group" style={{ gridColumn: isMobile ? 'auto' : 'span 1' }}>
          <label htmlFor="payment_status" style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333',
            fontSize: isMobile ? '14px' : '14px'
          }}>
            Payment Status *
          </label>
          <select
            id="payment_status"
            name="payment_status"
            value={serviceForm.payment_status}
            onChange={onServiceInputChange}
            required
            disabled={loadingData.service}
            style={{
              width: '100%',
              padding: isMobile ? '12px 15px' : '10px 15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: isMobile ? '14px' : '14px',
              backgroundColor: '#fff',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '16px',
              cursor: 'pointer'
            }}
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {/* Final Cost - Optional */}
        <div className="form-group" style={{ gridColumn: isMobile ? 'auto' : 'span 1' }}>
          <label htmlFor="final_cost" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333',
            fontSize: isMobile ? '14px' : '14px'
          }}>
            <FiDollarSign /> Final Cost (₹)
          </label>
          <input
            type="number"
            id="final_cost"
            name="final_cost"
            value={serviceForm.final_cost}
            onChange={onServiceInputChange}
            placeholder="0.00 (optional)"
            step="0.01"
            min="0"
            disabled={loadingData.service}
            style={{
              width: '100%',
              padding: isMobile ? '12px 15px' : '10px 15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: isMobile ? '14px' : '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        {/* Estimated Completion Date - Optional */}
        <div className="form-group" style={{ gridColumn: isMobile ? 'auto' : 'span 1' }}>
          <label htmlFor="estimated_completion_date" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333',
            fontSize: isMobile ? '14px' : '14px'
          }}>
            <FiCalendar /> Estimated Completion
          </label>
          <input
            type="date"
            id="estimated_completion_date"
            name="estimated_completion_date"
            value={serviceForm.estimated_completion_date}
            onChange={onServiceInputChange}
            disabled={loadingData.service}
            style={{
              width: '100%',
              padding: isMobile ? '12px 15px' : '10px 15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: isMobile ? '14px' : '14px',
              outline: 'none',
              transition: 'border-color 0.2s',
              color: !serviceForm.estimated_completion_date ? '#999' : '#333'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>

        {/* Warranty Status - Required */}
        <div className="form-group" style={{ gridColumn: isMobile ? 'auto' : 'span 1' }}>
          <label htmlFor="warranty_status" style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333',
            fontSize: isMobile ? '14px' : '14px'
          }}>
            Warranty Status *
          </label>
          <select
            id="warranty_status"
            name="warranty_status"
            value={serviceForm.warranty_status}
            onChange={onServiceInputChange}
            required
            disabled={loadingData.service}
            style={{
              width: '100%',
              padding: isMobile ? '12px 15px' : '10px 15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: isMobile ? '14px' : '14px',
              backgroundColor: '#fff',
              appearance: 'none',
              backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 10px center',
              backgroundSize: '16px',
              cursor: 'pointer'
            }}
          >
            <option value="in_warranty">In Warranty</option>
            <option value="extended_warranty">Extended Warranty</option>
            <option value="out_of_warranty">Out of Warranty</option>
          </select>
        </div>

        {/* Notes - Optional */}
        <div className="form-group full-width" style={{ gridColumn: '1 / -1' }}>
          <label htmlFor="notes" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '8px',
            fontWeight: '600',
            color: '#333',
            fontSize: isMobile ? '14px' : '14px'
          }}>
            <FiFileText /> Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={serviceForm.notes}
            onChange={onServiceInputChange}
            placeholder="Additional notes (optional)"
            rows={isMobile ? 3 : 2}
            disabled={loadingData.service}
            style={{
              width: '100%',
              padding: isMobile ? '12px 15px' : '10px 15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: isMobile ? '14px' : '14px',
              backgroundColor: '#fff',
              resize: 'vertical',
              minHeight: isMobile ? '80px' : '60px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10b981'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
        </div>
      </div>

      {/* Refresh Button for Mobile */}
      {isMobile && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <motion.button
            type="button"
            onClick={handleRefresh}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid #10b981',
              backgroundColor: 'transparent',
              color: '#10b981',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FiRefreshCw /> Refresh Data
          </motion.button>
        </div>
      )}

      <div className="form-actions" style={{
        display: 'flex',
        flexDirection: isMobile ? 'column-reverse' : 'row',
        justifyContent: 'flex-end',
        gap: isMobile ? '12px' : '10px',
        paddingTop: '20px',
        borderTop: '1px solid #eee'
      }}>
        <motion.button
          type="button"
          className="btn outline"
          onClick={onClose}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading.services || loadingData.service}
          style={{
            padding: isMobile ? '14px 20px' : '10px 20px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            backgroundColor: '#fff',
            color: '#4b5563',
            cursor: 'pointer',
            fontSize: isMobile ? '16px' : '14px',
            fontWeight: '600',
            width: isMobile ? '100%' : 'auto',
            opacity: (loading.services || loadingData.service) ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          Cancel
        </motion.button>
        <motion.button
          type="submit"
          className="btn primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading.services || loadingData.service}
          style={{
            padding: isMobile ? '14px 20px' : '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#10b981',
            color: '#fff',
            cursor: 'pointer',
            fontSize: isMobile ? '16px' : '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: isMobile ? '100%' : 'auto',
            opacity: (loading.services || loadingData.service) ? 0.5 : 1,
            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          <FiSave size={isMobile ? 18 : 16} />
          {editMode ? 'Update Service' : 'Create Service'}
          {loading.services && '...'}
        </motion.button>
      </div>
    </form>
  );

  const renderFormContent = () => {
    switch(formType) {
      case 'inverter_service':
        return renderServiceForm();
      default:
        return null;
    }
  };

  if (!showForm) return null;

  return (
    <motion.div 
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: isMobile ? '0' : '20px'
      }}
    >
      <motion.div 
        className="modal-content"
        initial={{ 
          opacity: 0, 
          scale: isMobile ? 1 : 0.9, 
          y: isMobile ? 50 : 0 
        }}
        animate={{ 
          opacity: 1, 
          scale: 1, 
          y: 0 
        }}
        exit={{ 
          opacity: 0, 
          scale: isMobile ? 1 : 0.9, 
          y: isMobile ? 50 : 0 
        }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: isMobile ? '100%' : isTablet ? '800px' : '900px',
          width: '100%',
          maxHeight: isMobile ? '90vh' : '90vh',
          overflowY: 'auto',
          backgroundColor: '#fff',
          borderRadius: isMobile ? '20px 20px 0 0' : '16px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          position: 'relative'
        }}
      >
        <div className="modal-header" style={{
          padding: isMobile ? '16px 20px' : '20px 24px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          borderRadius: isMobile ? '20px 20px 0 0' : '16px 16px 0 0',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: isMobile ? '20px' : '22px', 
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FiServer style={{ fontSize: isMobile ? '20px' : '22px' }} />
              {getFormTitle()}
            </h2>
            <p style={{ 
              margin: '5px 0 0 0', 
              fontSize: isMobile ? '13px' : '14px', 
              opacity: '0.9',
              color: 'rgba(255,255,255,0.9)'
            }}>{getFormDescription()}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* Refresh Button for Desktop */}
            {!isMobile && (
              <motion.button
                onClick={handleRefresh}
                whileHover={{ rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                disabled={loadingData.service}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  width: '36px',
                  height: '36px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: loadingData.service ? 0.5 : 1
                }}
                title="Refresh data"
              >
                <FiRefreshCw />
              </motion.button>
            )}
            <motion.button 
              onClick={onClose}
              whileHover={{ rotate: 90, scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={loadingData.service}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                width: isMobile ? '36px' : '36px',
                height: isMobile ? '36px' : '36px',
                fontSize: isMobile ? '20px' : '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loadingData.service ? 0.5 : 1
              }}
            >
              <FiX />
            </motion.button>
          </div>
        </div>
        
        <div style={{ 
          padding: isMobile ? '20px' : '24px', 
          position: 'relative',
          backgroundColor: '#f9fafb'
        }}>
          {renderFormContent()}
        </div>
      </motion.div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .spinning {
          animation: spin 1s linear infinite;
        }
        
        select, input, textarea, .dropdown-button {
          transition: all 0.2s ease;
        }
        
        select:focus, input:focus, textarea:focus, .dropdown-button:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1) !important;
          outline: none;
        }
        
        select:hover:not(:disabled), input:hover:not(:disabled), textarea:hover:not(:disabled), .dropdown-button:hover:not(:disabled) {
          border-color: #a0aec0;
        }
        
        .dropdown-option:hover {
          background-color: #f7fafc !important;
        }
        
        .modal-content {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Custom scrollbar */
        .modal-content::-webkit-scrollbar,
        .dropdown-menu::-webkit-scrollbar {
          width: 8px;
        }
        
        .modal-content::-webkit-scrollbar-track,
        .dropdown-menu::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .modal-content::-webkit-scrollbar-thumb,
        .dropdown-menu::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        
        .modal-content::-webkit-scrollbar-thumb:hover,
        .dropdown-menu::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        /* Better touch targets for mobile */
        @media (max-width: 640px) {
          select, input, textarea, button, .dropdown-button {
            min-height: 44px;
          }
          
          .form-group {
            margin-bottom: 0;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default InverterServiceFormModal;
