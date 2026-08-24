import React from "react";
import { motion } from "framer-motion";
import { 
  FiHome,
  FiShoppingBag,
  FiUsers,
  FiBox,
  FiCreditCard,
  FiLogOut,
  FiChevronLeft,
  FiPhoneCall,
  FiClock
} from "react-icons/fi";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface NavItem {
  icon: React.ReactNode;
  label: string;
  id: string;
}

interface SidebarProps {
  user: User;
  activeTab: string;
  onNavItemClick: (id: string) => void;
  onLogout: () => void;
  onClose: () => void;
  pendingCallsCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  user, 
  activeTab, 
  onNavItemClick, 
  onLogout,
  onClose,
  pendingCallsCount = 0
}) => {
  const [navItems] = React.useState<NavItem[]>([
    { icon: <FiHome />, label: 'Dashboard', id: 'dashboard' },
    { icon: <FiShoppingBag />, label: 'Service Orders', id: 'services' },
    { icon: <FiUsers />, label: 'Clients Management', id: 'customers' },
    { icon: <FiBox />, label: 'Products Management', id: 'batteries' },
    { icon: <FiCreditCard />, label: 'Card Entry', id: 'card_entry' },
    { icon: <FiPhoneCall />, label: 'Pending Calls', id: 'pending_calls' }
  ]);

  // Removed the extra closing brace and semicolon that was here

  return (
    <motion.aside 
      className="sidebar"
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        width: '280px',
        height: '100vh',
        background: 'linear-gradient(180deg, #1F2937 0%, #111827 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 1000,
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="sidebar-header" style={{
        padding: '24px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="brand">
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="logo-circle" style={{ 
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: '700',
              color: '#fff',
              boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)'
            }}>
              <span>SO</span>
            </div>
            <div className="brand-info">
              <h2 className="sidebar-brand-text" style={{
                margin: '0',
                fontSize: '20px',
                fontWeight: '700',
                color: '#fff',
                letterSpacing: '-0.5px'
              }}>Sun Water Service</h2>
              <p className="sidebar-subtext" style={{
                margin: '4px 0 0',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)'
              }}>Inverter & Battery Service</p>
            </div>
          </div>
        </div>
        <button 
          className="sidebar-toggle close"
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: '#fff',
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <FiChevronLeft className="sidebar-icon" size={20} />
        </button>
      </div>

      <div className="sidebar-content" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        padding: '24px 0'
      }}>
        <div className="user-profile" style={{
          padding: '0 20px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px'
        }}>
          <div className="user-info">
            <h3 style={{
              margin: '0 0 4px',
              fontSize: '16px',
              fontWeight: '600',
              color: '#fff'
            }}>{user.name}</h3>
            <p style={{
              margin: '0 0 8px',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>{user.role}</p>
            <span className="user-email" style={{
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.5)',
              display: 'block',
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              maxWidth: 'fit-content'
            }}>{user.email}</span>
          </div>
        </div>

        <nav className="sidebar-nav" style={{
          flex: 1,
          padding: '0 12px'
        }}>
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => onNavItemClick(item.id)}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              style={{
                width: '100%',
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === item.id 
                  ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                  : 'transparent',
                color: activeTab === item.id ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '14px',
                fontWeight: activeTab === item.id ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }
              }}
            >
              <span className="nav-icon" style={{
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center'
              }}>{item.icon}</span>
              <span className="nav-label" style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              
              {/* Pending Calls Badge with Animation */}
              {item.id === 'pending_calls' && pendingCallsCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: '#EF4444',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: '600',
                    boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                      transition: {
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }
                    }}
                  >
                    <FiClock size={12} />
                  </motion.div>
                  {pendingCallsCount}
                </motion.span>
              )}
            </motion.button>
          ))}
        </nav>

        <div className="sidebar-footer" style={{
          padding: '20px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          marginTop: 'auto'
        }}>
          <motion.button 
            className="logout-btn"
            onClick={onLogout}
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
            whileTap={{ scale: 0.98 }}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              background: 'transparent',
              color: '#F87171',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <FiLogOut className="logout-icon" size={18} />
            <span className="logout-text" style={{ flex: 1, textAlign: 'left' }}>Logout</span>
          </motion.button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
