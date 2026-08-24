import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  alpha,
  useTheme,
  useMediaQuery,
  Fade
} from '@mui/material';
import {
  Close as CloseIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorIcon,
  Info as InfoIcon,
  Dangerous as DangerousIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';

// Styled Components
const StyledDialog = styled(Dialog)({
  '& .MuiDialog-paper': {
    borderRadius: 24,
    padding: 8,
    background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden',
    maxWidth: 450,
    width: '100%'
  }
});

const GradientIcon = styled(Box)({
  width: 80,
  height: 80,
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  color: 'white',
  boxShadow: '0 10px 30px -5px rgba(239, 68, 68, 0.4)',
  animation: 'pulse 2s infinite',
  '@keyframes pulse': {
    '0%': {
      boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)'
    },
    '70%': {
      boxShadow: '0 0 0 15px rgba(239, 68, 68, 0)'
    },
    '100%': {
      boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)'
    }
  }
});

const WarningText = styled(Typography)({
  color: '#ef4444',
  fontWeight: 600,
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: 12,
  backgroundColor: alpha('#ef4444', 0.1),
  borderRadius: 12,
  border: `1px solid ${alpha('#ef4444', 0.2)}`,
  marginTop: 16
});

const ItemInfo = styled(Box)({
  backgroundColor: alpha('#667eea', 0.05),
  borderRadius: 16,
  padding: 16,
  marginBottom: 16,
  border: `1px solid ${alpha('#667eea', 0.1)}`
});

const StyledButton = styled(Button)({
  borderRadius: 12,
  padding: '10px 24px',
  fontWeight: 600,
  textTransform: 'none',
  fontSize: '1rem',
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'translateY(-2px)'
  }
});

// Custom Transition Component using Fade
const Transition = React.forwardRef(function Transition(props: any, ref) {
  return <Fade ref={ref} {...props} timeout={400} />;
});

interface DeleteConfirmationModalProps {
  itemType: string;
  itemId: string | number;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
  additionalInfo?: string;
  dangerLevel?: 'low' | 'medium' | 'high';
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ 
  itemType, 
  itemId,
  itemName,
  onClose, 
  onConfirm,
  loading = false,
  additionalInfo,
  dangerLevel = 'high'
}) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const getItemDisplayName = () => {
    if (itemName) return itemName;
    
    const typeMap: Record<string, string> = {
      customer: 'Customer',
      service: 'Service Order',
      battery: 'Battery',
      delivery: 'Delivery',
      replacement: 'Replacement Battery',
      spare: 'Spare Battery',
      shop_claim: 'Shop Claim',
      sun_to_comp: 'Sun to Company Battery',
      comptosun: 'Company to Sun Battery',
      company_claim: 'Company Claim',
      user: 'User',
      staff: 'Staff Member',
      expense: 'Expense',
      salary: 'Salary Record',
      invoice: 'Invoice',
      payment: 'Payment',
      product: 'Product',
      inverter: 'Inverter'
    };
    
    return typeMap[itemType] || 'Item';
  };

  const getDangerColor = () => {
    switch(dangerLevel) {
      case 'low': return '#f59e0b';
      case 'medium': return '#f97316';
      case 'high': return '#ef4444';
      default: return '#ef4444';
    }
  };

  const getDangerIcon = () => {
    switch(dangerLevel) {
      case 'low': return <InfoIcon sx={{ fontSize: 40 }} />;
      case 'medium': return <WarningIcon sx={{ fontSize: 40 }} />;
      case 'high': return <DangerousIcon sx={{ fontSize: 40 }} />;
      default: return <ErrorIcon sx={{ fontSize: 40 }} />;
    }
  };

  const getWarningMessage = () => {
    switch(dangerLevel) {
      case 'low':
        return 'This action can be undone, but some data might be temporarily affected.';
      case 'medium':
        return 'This action will remove the item from the system, but related records may remain.';
      case 'high':
        return 'This action cannot be undone. All associated data will be permanently deleted.';
      default:
        return 'This action cannot be undone. All data associated with this item will be permanently deleted.';
    }
  };

  const itemDisplayName = getItemDisplayName();
  const dangerColor = getDangerColor();

  return (
    <StyledDialog
      open={true}
      onClose={loading ? undefined : onClose}
      fullScreen={fullScreen}
      TransitionComponent={Transition}
      PaperProps={{
        component: motion.div,
        initial: { opacity: 0, y: 50, scale: 0.9 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 50, scale: 0.9 },
        transition: { type: 'spring', damping: 25, stiffness: 300 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        pb: 1
      }}>
        <Typography variant="h6" fontWeight="700" color="#ef4444">
          Confirm Deletion
        </Typography>
        <IconButton 
          onClick={onClose} 
          disabled={loading}
          size="small"
          sx={{
            bgcolor: alpha('#000', 0.05),
            '&:hover': { bgcolor: alpha('#000', 0.1) }
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GradientIcon sx={{ background: `linear-gradient(135deg, ${dangerColor} 0%, ${dangerColor}dd 100%)` }}>
              {getDangerIcon()}
            </GradientIcon>

            <ItemInfo>
              <Typography 
                variant="body2" 
                color="textSecondary" 
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <span style={{ fontWeight: 600, color: '#64748b' }}>Item Type:</span>
                <span style={{ fontWeight: 500 }}>{itemDisplayName}</span>
              </Typography>
              
              <Typography 
                variant="body2" 
                color="textSecondary"
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
              >
                <span style={{ fontWeight: 600, color: '#64748b' }}>ID:</span>
                <span style={{ 
                  fontFamily: 'monospace', 
                  fontWeight: 500,
                  backgroundColor: alpha('#667eea', 0.1),
                  padding: '2px 8px',
                  borderRadius: 12
                }}>
                  {itemId}
                </span>
              </Typography>
            </ItemInfo>

            <Typography 
              variant="h6" 
              align="center" 
              fontWeight="600"
              sx={{ mb: 2 }}
            >
              Are you sure you want to delete this {itemDisplayName.toLowerCase()}?
            </Typography>

            <WarningText sx={{ backgroundColor: alpha(dangerColor, 0.1), color: dangerColor }}>
              <ErrorIcon fontSize="small" />
              {getWarningMessage()}
            </WarningText>

            {additionalInfo && (
              <Typography 
                variant="body2" 
                color="textSecondary" 
                align="center"
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: alpha('#000', 0.02), 
                  borderRadius: 2,
                  fontSize: '0.875rem'
                }}
              >
                {additionalInfo}
              </Typography>
            )}

            {loading && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 2,
                mt: 2,
                p: 2,
                bgcolor: alpha('#667eea', 0.05),
                borderRadius: 2
              }}>
                <CircularProgress size={20} sx={{ color: '#667eea' }} />
                <Typography variant="body2" color="textSecondary">
                  Deleting item...
                </Typography>
              </Box>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        pt: 0, 
        gap: 2,
        flexDirection: { xs: 'column-reverse', sm: 'row' },
        justifyContent: 'center'
      }}>
        <StyledButton
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          fullWidth={fullScreen}
          sx={{
            borderColor: '#e5e7eb',
            color: '#64748b',
            '&:hover': {
              borderColor: '#cbd5e1',
              bgcolor: '#f8fafc'
            }
          }}
        >
          <CloseIcon sx={{ mr: 1, fontSize: 18 }} />
          Cancel
        </StyledButton>
        
        <StyledButton
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          fullWidth={fullScreen}
          sx={{
            background: `linear-gradient(135deg, ${dangerColor} 0%, ${dangerColor}dd 100%)`,
            color: 'white',
            boxShadow: `0 4px 15px -5px ${dangerColor}`,
            '&:hover': {
              background: `linear-gradient(135deg, ${dangerColor}dd 0%, ${dangerColor} 100%)`,
              boxShadow: `0 6px 20px -5px ${dangerColor}`
            }
          }}
        >
          {loading ? (
            <>
              <CircularProgress size={18} sx={{ color: 'white', mr: 1 }} />
              Deleting...
            </>
          ) : (
            <>
              <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
              Delete {itemDisplayName}
            </>
          )}
        </StyledButton>
      </DialogActions>
    </StyledDialog>
  );
};

export default DeleteConfirmationModal;