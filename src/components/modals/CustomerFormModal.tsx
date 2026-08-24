import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiX, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiFileText, 
  FiSave, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiHome,
  FiGlobe,
  FiArrowRight,
  FiCheck,
  FiInfo
} from "react-icons/fi";
import { API_BASE_URL } from "../../config/api";

interface Customer {
  id: number;
  customer_code: string;
  full_name: string;
  email: string | null;
  phone: string;
  alternate_phone?: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  total_services?: number;
  service_count?: number;
  last_service_date?: string | null;
}

interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  data: Customer | null;
  customers?: Customer[];
  onSuccess?: () => void;
  showSnackbar?: (message: string, severity: 'success' | 'error') => void;
}

const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  open,
  onClose,
  mode,
  data,
  customers = [],
  onSuccess,
  showSnackbar
}) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    alternate_phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    notes: ""
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [activeStep, setActiveStep] = useState<'basic' | 'address' | 'notes'>('basic');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const getCleanContactNumber = (value: string) => value.replace(/\D/g, '');
  const uniqueCities = useMemo(
    () =>
      Array.from(
        new Set(
          customers
            .map((customer) => (customer.city || "").trim())
            .filter((city) => city.length > 0)
        )
      ),
    [customers]
  );
  const citySuggestions = useMemo(() => {
    const query = formData.city.trim().toLowerCase();
    if (!query) return [];
    return uniqueCities
      .filter((city) => city.toLowerCase().includes(query))
      .slice(0, 8);
  }, [formData.city, uniqueCities]);

  // Reset form when modal opens/closes or mode/data changes
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && data) {
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          alternate_phone: data.alternate_phone || "",
          address: data.address || "",
          city: data.city || "",
          state: data.state || "",
          zip_code: data.zip_code || "",
          notes: data.notes || ""
        });
      } else {
        setFormData({
          full_name: "",
          email: "",
          phone: "",
          alternate_phone: "",
          address: "",
          city: "",
          state: "",
          zip_code: "",
          notes: ""
        });
      }
      
      setErrors({});
      setTouched({});
      setApiError(null);
      setSubmitSuccess(false);
      setSuccessMessage("");
      setActiveStep('basic');
    }
  }, [open, mode, data]);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'full_name':
        if (!value.trim()) return "Full name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        return "";
      
      case 'phone':
        if (!value.trim()) return "Phone number is required";
        const cleanedPhone = getCleanContactNumber(value);
        if (cleanedPhone.length < 6 || cleanedPhone.length > 12) return "Enter a valid phone or landline number (6-12 digits)";
        return "";
      
      case 'email':
        if (value && value.trim() && !/\S+@\S+\.\S+/.test(value)) {
          return "Enter a valid email address";
        }
        return "";

      case 'alternate_phone':
        if (value && value.trim()) {
          const cleanedAltPhone = getCleanContactNumber(value);
          if (cleanedAltPhone.length < 6 || cleanedAltPhone.length > 12) return "Enter a valid alternate phone number (6-12 digits)";
        }
        return "";
      
      case 'zip_code':
        if (value && value.trim()) {
          const cleanedZip = value.replace(/\D/g, '');
          if (cleanedZip.length !== 6) return "Enter a valid 6-digit PIN code";
        }
        return "";
      
      default:
        return "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    
    // Required fields
    const fullNameError = validateField('full_name', formData.full_name);
    if (fullNameError) {
      newErrors.full_name = fullNameError;
      isValid = false;
    }
    
    const phoneError = validateField('phone', formData.phone);
    if (phoneError) {
      newErrors.phone = phoneError;
      isValid = false;
    }
    
    const emailError = validateField('email', formData.email);
    if (emailError) newErrors.email = emailError;

    const alternatePhoneError = validateField('alternate_phone', formData.alternate_phone);
    if (alternatePhoneError) newErrors.alternate_phone = alternatePhoneError;
    
    const zipError = validateField('zip_code', formData.zip_code);
    if (zipError) newErrors.zip_code = zipError;
    
    setErrors(newErrors);
    return isValid && Object.keys(newErrors).length === 0;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    // Clear API error when user makes changes
    if (apiError) setApiError(null);
  };
  
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector('.error-message');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setLoading(true);
    setApiError(null);
    
    try {
      const cleanedPhone = formData.phone.replace(/\D/g, '');
      const cleanedAlternatePhone = formData.alternate_phone.replace(/\D/g, '');
      
      const customerData: any = {
        full_name: formData.full_name.trim(),
        phone: cleanedPhone,
        alternate_phone: cleanedAlternatePhone ? cleanedAlternatePhone : null,
        email: formData.email && formData.email.trim() ? formData.email.trim() : null,
        address: formData.address && formData.address.trim() ? formData.address.trim() : null,
        city: formData.city && formData.city.trim() ? formData.city.trim() : null,
        state: formData.state && formData.state.trim() ? formData.state.trim() : null,
        zip_code: formData.zip_code && formData.zip_code.trim() ? formData.zip_code.trim() : null,
        notes: formData.notes && formData.notes.trim() ? formData.notes.trim() : null
      };
      
      if (mode === 'edit' && data) {
        customerData.id = data.id;
      }
      
      const response = await fetch(`${API_BASE_URL}/customers.php`, {
        method: mode === 'edit' ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(customerData)
      });
      
      if (!response.ok) {
        await response.text();
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const successMsg = mode === 'edit' 
          ? 'Customer updated successfully!' 
          : 'Customer created successfully!';
        
        setSuccessMessage(successMsg);
        setSubmitSuccess(true);
        
        if (showSnackbar) {
          showSnackbar(successMsg, 'success');
        }
        
        if (onSuccess) {
          onSuccess();
        }
        
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setApiError(result.message || 'Failed to save customer');
        if (showSnackbar) {
          showSnackbar(result.message || 'Failed to save customer', 'error');
        }
        setSubmitSuccess(false);
      }
    } catch (error: any) {
      console.error('Error saving customer:', error);
      setApiError(error.message || 'Network error. Please try again.');
      if (showSnackbar) {
        showSnackbar(error.message || 'Network error. Please try again.', 'error');
      }
      setSubmitSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (activeStep === 'basic') {
      const basicFields = ['full_name', 'phone'];
      let hasError = false;
      basicFields.forEach(field => {
        const error = validateField(field, formData[field as keyof typeof formData]);
        if (error) {
          setErrors(prev => ({ ...prev, [field]: error }));
          setTouched(prev => ({ ...prev, [field]: true }));
          hasError = true;
        }
      });
      if (!hasError) setActiveStep('address');
    } else if (activeStep === 'address') {
      setActiveStep('notes');
    }
  };

  const handlePrevious = () => {
    if (activeStep === 'address') setActiveStep('basic');
    else if (activeStep === 'notes') setActiveStep('address');
  };

  const handleCloseClick = () => {
    if (!loading && !submitSuccess) {
      onClose();
    }
  };

  if (!open) return null;

  const getStepStatus = (step: string) => {
    if (step === activeStep) return 'active';
    if (activeStep === 'address' && step === 'basic') return 'completed';
    if (activeStep === 'notes' && (step === 'basic' || step === 'address')) return 'completed';
    return 'pending';
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000
          }}
          onClick={handleCloseClick}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "650px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "hidden",
              backgroundColor: "white",
              borderRadius: "28px",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
            }}
          >
            {/* Header with Gradient */}
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              padding: '28px 32px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                pointerEvents: 'none'
              }} />
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                position: 'relative',
                zIndex: 1
              }}>
                <div>
                  <h2 style={{
                    margin: 0,
                    fontSize: "26px",
                    fontWeight: "700",
                    color: "white",
                    letterSpacing: '-0.5px'
                  }}>
                    {mode === 'edit' ? "Edit Account" : "Create New Account"}
                  </h2>
                  <p style={{
                    margin: "8px 0 0",
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.9)"
                  }}>
                    {mode === 'edit' ? "Update customer information" : "Add a new customer to the system"}
                  </p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCloseClick}
                  disabled={loading || submitSuccess}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    border: "none",
                    cursor: (loading || submitSuccess) ? "not-allowed" : "pointer",
                    padding: "10px",
                    borderRadius: "12px",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: (loading || submitSuccess) ? 0.5 : 1
                  }}
                >
                  <FiX size={20} />
                </motion.button>
              </div>
            </div>

            {/* Step Indicator */}
            <div style={{
              padding: '20px 32px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px'
              }}>
                {['basic', 'address', 'notes'].map((step, index) => {
                  const status = getStepStatus(step);
                  const stepLabels = { basic: 'Basic Info', address: 'Address', notes: 'Notes' };
                  
                  return (
                    <React.Fragment key={step}>
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: status === 'completed' ? '#10b981' : status === 'active' ? '#667eea' : '#cbd5e1',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {status === 'completed' ? <FiCheck size={16} /> : index + 1}
                        </div>
                        <span style={{
                          fontSize: '13px',
                          fontWeight: status === 'active' ? '600' : '500',
                          color: status === 'active' ? '#667eea' : '#64748b',
                          display: window.innerWidth >= 640 ? 'block' : 'none'
                        }}>
                          {stepLabels[step as keyof typeof stepLabels]}
                        </span>
                      </div>
                      {index < 2 && (
                        <FiArrowRight style={{ color: '#cbd5e1', fontSize: '14px' }} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Content */}
            <div style={{
              padding: '32px',
              maxHeight: 'calc(90vh - 240px)',
              overflowY: 'auto',
              scrollbarWidth: 'thin'
            }}>
              {/* Success Message */}
              {submitSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  style={{
                    backgroundColor: "#d1fae5",
                    borderRadius: "16px",
                    padding: "24px",
                    marginBottom: "20px",
                    textAlign: "center",
                    border: "2px solid #a7f3d0"
                  }}
                >
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    backgroundColor: "#10b981",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px"
                  }}>
                    <FiCheckCircle size={28} color="white" />
                  </div>
                  <h3 style={{ margin: "0 0 8px", fontSize: "20px", fontWeight: "600", color: "#065f46" }}>
                    Success!
                  </h3>
                  <p style={{ margin: 0, fontSize: "14px", color: "#047857" }}>{successMessage}</p>
                  <div style={{
                    width: "100%",
                    height: "4px",
                    backgroundColor: "#a7f3d0",
                    borderRadius: "2px",
                    marginTop: "20px",
                    overflow: "hidden"
                  }}>
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: 2, ease: "linear" }}
                      style={{ height: "100%", backgroundColor: "#10b981" }}
                    />
                  </div>
                </motion.div>
              )}
              
              {/* Error Message */}
              {apiError && !submitSuccess && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    border: "1px solid #fecaca"
                  }}
                >
                  <FiAlertCircle size={18} />
                  <span style={{ fontSize: "13px", flex: 1 }}>{apiError}</span>
                </motion.div>
              )}
              
              {/* Form */}
              {!submitSuccess && (
                <form onSubmit={handleSubmit}>
                  {/* Basic Info Step */}
                  {activeStep === 'basic' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <div style={{ marginBottom: "24px" }}>
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1e293b"
                        }}>
                          <FiUser size={16} />
                          Full Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          placeholder="Enter customer full name"
                          disabled={loading}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: `2px solid ${errors.full_name && touched.full_name ? '#ef4444' : '#e2e8f0'}`,
                            borderRadius: "12px",
                            fontSize: "14px",
                            transition: "all 0.2s",
                            outline: "none",
                            backgroundColor: loading ? "#f8fafc" : "white"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#667eea"}
                          onBlur={(e) => {
                            e.target.style.borderColor = errors.full_name && touched.full_name ? '#ef4444' : '#e2e8f0';
                            handleBlur('full_name');
                          }}
                        />
                        {errors.full_name && touched.full_name && (
                          <div className="error-message" style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>
                            {errors.full_name}
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: "24px" }}>
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1e293b"
                        }}>
                          <FiPhone size={16} />
                          Phone Number <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="Enter mobile or landline number"
                          disabled={loading}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: `2px solid ${errors.phone && touched.phone ? '#ef4444' : '#e2e8f0'}`,
                            borderRadius: "12px",
                            fontSize: "14px",
                            transition: "all 0.2s",
                            outline: "none",
                            backgroundColor: loading ? "#f8fafc" : "white"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#667eea"}
                          onBlur={(e) => {
                            e.target.style.borderColor = errors.phone && touched.phone ? '#ef4444' : '#e2e8f0';
                            handleBlur('phone');
                          }}
                        />
                        {errors.phone && touched.phone && (
                          <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>
                            {errors.phone}
                          </div>
                        )}
                      </div>

                      <div style={{ marginBottom: "24px" }}>
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1e293b"
                        }}>
                          <FiPhone size={16} />
                          Alternate Phone
                        </label>
                        <input
                          type="tel"
                          name="alternate_phone"
                          value={formData.alternate_phone}
                          onChange={handleInputChange}
                          placeholder="Enter alternate phone number"
                          disabled={loading}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: `2px solid ${errors.alternate_phone && touched.alternate_phone ? '#ef4444' : '#e2e8f0'}`,
                            borderRadius: "12px",
                            fontSize: "14px",
                            transition: "all 0.2s",
                            outline: "none",
                            backgroundColor: loading ? "#f8fafc" : "white"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#667eea"}
                          onBlur={(e) => {
                            e.target.style.borderColor = errors.alternate_phone && touched.alternate_phone ? '#ef4444' : '#e2e8f0';
                            handleBlur('alternate_phone');
                          }}
                        />
                        {errors.alternate_phone && touched.alternate_phone && (
                          <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>
                            {errors.alternate_phone}
                          </div>
                        )}
                      </div>

                      <div>
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1e293b"
                        }}>
                          <FiMail size={16} />
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="Enter email address"
                          disabled={loading}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: `2px solid ${errors.email && touched.email ? '#ef4444' : '#e2e8f0'}`,
                            borderRadius: "12px",
                            fontSize: "14px",
                            transition: "all 0.2s",
                            outline: "none",
                            backgroundColor: loading ? "#f8fafc" : "white"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#667eea"}
                          onBlur={(e) => {
                            e.target.style.borderColor = errors.email && touched.email ? '#ef4444' : '#e2e8f0';
                            handleBlur('email');
                          }}
                        />
                        {errors.email && touched.email && (
                          <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>
                            {errors.email}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Address Step */}
                  {activeStep === 'address' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <div style={{ marginBottom: "20px" }}>
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1e293b"
                        }}>
                          <FiHome size={16} />
                          Address
                        </label>
                        <textarea
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          placeholder="Enter full address"
                          rows={3}
                          disabled={loading}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "2px solid #e2e8f0",
                            borderRadius: "12px",
                            fontSize: "14px",
                            resize: "vertical",
                            fontFamily: "inherit",
                            transition: "all 0.2s",
                            outline: "none",
                            backgroundColor: loading ? "#f8fafc" : "white"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#667eea"}
                          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                        />
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                        <div style={{ position: "relative" }}>
                          <label style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "13px",
                            fontWeight: "500",
                            color: "#475569"
                          }}>
                            City
                          </label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            placeholder="Enter city"
                            disabled={loading}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              border: "2px solid #e2e8f0",
                              borderRadius: "12px",
                              fontSize: "14px",
                              transition: "all 0.2s",
                              outline: "none",
                              backgroundColor: loading ? "#f8fafc" : "white"
                            }}
                            onFocus={(e) => {
                              e.target.style.borderColor = "#667eea";
                              setShowCitySuggestions(true);
                            }}
                            onBlur={(e) => {
                              e.target.style.borderColor = "#e2e8f0";
                              setTimeout(() => setShowCitySuggestions(false), 150);
                            }}
                          />
                          {showCitySuggestions && citySuggestions.length > 0 && (
                            <div style={{
                              position: "absolute",
                              top: "calc(100% + 6px)",
                              left: 0,
                              right: 0,
                              border: "1px solid #e2e8f0",
                              borderRadius: "10px",
                              backgroundColor: "#ffffff",
                              boxShadow: "0 10px 20px rgba(0,0,0,0.08)",
                              zIndex: 10,
                              maxHeight: "180px",
                              overflowY: "auto"
                            }}>
                              {citySuggestions.map((cityName) => (
                                <button
                                  key={cityName}
                                  type="button"
                                  onMouseDown={(event) => event.preventDefault()}
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, city: cityName }));
                                    setShowCitySuggestions(false);
                                  }}
                                  style={{
                                    width: "100%",
                                    textAlign: "left",
                                    padding: "10px 12px",
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    fontSize: "13px",
                                    color: "#1e293b"
                                  }}
                                >
                                  {cityName}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{
                            display: "block",
                            marginBottom: "8px",
                            fontSize: "13px",
                            fontWeight: "500",
                            color: "#475569"
                          }}>
                            State
                          </label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            placeholder="Enter state"
                            disabled={loading}
                            style={{
                              width: "100%",
                              padding: "10px 14px",
                              border: "2px solid #e2e8f0",
                              borderRadius: "12px",
                              fontSize: "14px",
                              transition: "all 0.2s",
                              outline: "none",
                              backgroundColor: loading ? "#f8fafc" : "white"
                            }}
                            onFocus={(e) => e.target.style.borderColor = "#667eea"}
                            onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1e293b"
                        }}>
                          <FiGlobe size={16} />
                          PIN Code
                        </label>
                        <input
                          type="text"
                          name="zip_code"
                          value={formData.zip_code}
                          onChange={handleInputChange}
                          placeholder="Enter 6-digit PIN code"
                          disabled={loading}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: `2px solid ${errors.zip_code && touched.zip_code ? '#ef4444' : '#e2e8f0'}`,
                            borderRadius: "12px",
                            fontSize: "14px",
                            transition: "all 0.2s",
                            outline: "none",
                            backgroundColor: loading ? "#f8fafc" : "white"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#667eea"}
                          onBlur={(e) => {
                            e.target.style.borderColor = errors.zip_code && touched.zip_code ? '#ef4444' : '#e2e8f0';
                            handleBlur('zip_code');
                          }}
                        />
                        {errors.zip_code && touched.zip_code && (
                          <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "6px" }}>
                            {errors.zip_code}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Notes Step */}
                  {activeStep === 'notes' && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <div>
                        <label style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginBottom: "8px",
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#1e293b"
                        }}>
                          <FiFileText size={16} />
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                          placeholder="Add any notes about the customer..."
                          rows={6}
                          disabled={loading}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "2px solid #e2e8f0",
                            borderRadius: "12px",
                            fontSize: "14px",
                            resize: "vertical",
                            fontFamily: "inherit",
                            transition: "all 0.2s",
                            outline: "none",
                            backgroundColor: loading ? "#f8fafc" : "white"
                          }}
                          onFocus={(e) => e.target.style.borderColor = "#667eea"}
                          onBlur={(e) => e.target.style.borderColor = "#e2e8f0"}
                        />
                        <div style={{
                          marginTop: "8px",
                          fontSize: "12px",
                          color: "#94a3b8",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}>
                          <FiInfo size={12} />
                          Optional - Add any special instructions or notes
                        </div>
                      </div>
                    </motion.div>
                  )}
                </form>
              )}
            </div>

            {/* Footer */}
            {!submitSuccess && (
              <div style={{
                padding: "20px 32px",
                borderTop: "1px solid #e2e8f0",
                background: "#f8fafc",
                display: "flex",
                justifyContent: "space-between",
                gap: "12px"
              }}>
                <div>
                  {activeStep !== 'basic' && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handlePrevious}
                      disabled={loading}
                      style={{
                        padding: "12px 24px",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        background: "white",
                        color: "#475569",
                        fontSize: "14px",
                        fontWeight: "500",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.5 : 1
                      }}
                    >
                      Previous
                    </motion.button>
                  )}
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleCloseClick}
                    disabled={loading}
                    style={{
                      padding: "12px 24px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      background: "white",
                      color: "#475569",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.5 : 1
                    }}
                  >
                    Cancel
                  </motion.button>
                  
                  {activeStep !== 'notes' ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleNext}
                      style={{
                        padding: "12px 28px",
                        borderRadius: "12px",
                        border: "none",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      Next
                      <FiArrowRight size={16} />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      onClick={handleSubmit}
                      disabled={loading}
                      style={{
                        padding: "12px 32px",
                        borderRadius: "12px",
                        border: "none",
                        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: loading ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        opacity: loading ? 0.7 : 1
                      }}
                    >
                      <FiSave size={16} />
                      {loading ? 'Saving...' : (mode === 'edit' ? 'Update Customer' : 'Create Customer')}
                    </motion.button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CustomerFormModal;
