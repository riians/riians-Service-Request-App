import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  User, 
  Mail, 
  Phone, 
  Send, 
  LayoutDashboard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ChevronRight,
  Shield,
  Briefcase,
  Search,
  Menu,
  X,
  ArrowRight,
  MapPin,
  Edit2,
  Eye,
  Settings,
  Lock,
  LogOut,
  Save,
  Camera
} from 'lucide-react';

type RequestStatus = 'pending' | 'in-progress' | 'completed' | 'rejected';

interface ServiceRequest {
  id: number;
  name: string;
  email: string;
  phone: string;
  service_type: string;
  description: string;
  status: RequestStatus;
  created_at: string;
}

interface AdminProfile {
  id: number;
  username: string;
  full_name: string;
  email: string;
  profile_picture?: string;
}

const SERVICES = [
  { id: 'pan', name: 'PAN Card Services', description: 'New PAN, Correction, or Reprint', documents_required: 'Aadhaar Card, Passport-sized photographs, Signature' },
  { id: 'voter', name: 'Voter ID Services', description: 'New Registration, Correction', documents_required: 'Age Proof (Birth Certificate/Aadhaar), Address Proof, Passport-sized photograph' },
  { id: 'passport', name: 'Passport Services', description: 'Fresh Passport, Re-issue', documents_required: 'Aadhaar Card, PAN Card, Voter ID, 10th Marksheet (for Non-ECR)' },
  { id: 'aadhaar', name: 'Aadhaar Updates', description: 'Demographic or Biometric updates', documents_required: 'Valid Proof of Identity (POI) and Proof of Address (POA)' },
  { id: 'aadhaar-pvc', name: 'Aadhar PVC Card', description: 'Order high-quality PVC Aadhaar', documents_required: 'Aadhaar Number or Enrollment ID, Registered Mobile Number' },
  { id: 'aadhaar-demo', name: 'Aadhar Demographic Updates', description: 'Name, DOB, Gender, Address', documents_required: 'Valid Proof of Identity (POI), Proof of Address (POA), or Proof of DOB' },
  { id: 'ration-new', name: 'New Ration Card', description: 'Apply for fresh Ration Card', documents_required: 'Aadhaar Cards of all members, Income Certificate, Address Proof, Passport-sized photograph of head of family' },
  { id: 'ration-ekyc', name: 'Ration Card E-KYC', description: 'Complete mandatory E-KYC', documents_required: 'Ration Card, Aadhaar Card, Registered Mobile Number' },
  { id: 'banking', name: 'Banking Services', description: 'Account opening & related help', documents_required: 'Aadhaar Card, PAN Card, Passport-sized photographs' },
  { id: 'aeps', name: 'AEPS Services', description: 'Aadhaar Enabled Payment System', documents_required: 'Aadhaar Number linked to Bank Account, Biometric authentication' },
  { id: 'pf-withdrawal', name: 'PF Withdrawal', description: 'EPFO Withdrawal Services', documents_required: 'UAN, Aadhaar linked to UAN, Bank Account details, Cancelled Cheque' },
  { id: 'pf-migration', name: 'PF Migration', description: 'EPFO Account Transfer/Migration', documents_required: 'UAN, Previous Member ID, Current Member ID' },
  { id: 'uan-activation', name: 'UAN Activation', description: 'Activate your EPFO UAN', documents_required: 'UAN, Aadhaar Number, PAN Number, Registered Mobile Number' },
  { id: 'epfo-other', name: 'Other EPFO Services', description: 'All other EPFO related help', documents_required: 'UAN and relevant supporting documents based on the specific request' },
  { id: 'license', name: 'Driving License', description: 'Learning, Permanent, or Renewal', documents_required: 'Age Proof, Address Proof, Passport-sized photographs, Medical Certificate (if applicable)' },
  { id: 'income', name: 'Income Certificate', description: 'State/Central Income Proof', documents_required: 'Aadhaar Card, Ration Card, Salary Slip/Income Proof, Address Proof' },
];

const SERVICE_CATEGORIES = [
  {
    title: 'Identity & Citizenship',
    icon: <User className="w-6 h-6" />,
    services: ['pan', 'voter', 'passport', 'aadhaar', 'aadhaar-pvc', 'aadhaar-demo']
  },
  {
    title: 'Social Welfare',
    icon: <Shield className="w-6 h-6" />,
    services: ['ration-new', 'ration-ekyc', 'income']
  },
  {
    title: 'Financial Services',
    icon: <Briefcase className="w-6 h-6" />,
    services: ['banking', 'aeps']
  },
  {
    title: 'Employment & PF',
    icon: <FileText className="w-6 h-6" />,
    services: ['pf-withdrawal', 'pf-migration', 'uan-activation', 'epfo-other']
  },
  {
    title: 'Transport',
    icon: <ArrowRight className="w-6 h-6" />,
    services: ['license']
  }
];

export default function App() {
  const [view, setView] = useState<'customer' | 'admin' | 'contact' | 'about'>('customer');
  const [adminView, setAdminView] = useState<'requests' | 'profile'>('requests');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    service_type: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [confirmModal, setConfirmModal] = useState<{ 
    isOpen: boolean; 
    requestId: number | null; 
    currentStatus: RequestStatus | null;
    newStatus: RequestStatus | null 
  }>({
    isOpen: false,
    requestId: null,
    currentStatus: null,
    newStatus: null,
  });
  const [editModal, setEditModal] = useState<{ 
    isOpen: boolean; 
    request: ServiceRequest | null;
  }>({
    isOpen: false,
    request: null,
  });
  const [viewModal, setViewModal] = useState<{
    isOpen: boolean;
    request: ServiceRequest | null;
  }>({
    isOpen: false,
    request: null,
  });
  const [serviceDetailsModal, setServiceDetailsModal] = useState<{
    isOpen: boolean;
    service: typeof SERVICES[0] | null;
  }>({
    isOpen: false,
    service: null,
  });
  const [contactFormData, setContactFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isContactSubmitting, setIsContactSubmitting] = useState(false);
  const [contactSubmitStatus, setContactSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Search States
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Profile Update State
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    email: '',
    newUsername: '',
    profile_picture: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [profileUpdateStatus, setProfileUpdateStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    if (view === 'admin' && isAuthenticated && adminView === 'requests') {
      fetchRequests(currentPage);
    }
  }, [view, currentPage, isAuthenticated, adminView]);

  useEffect(() => {
    if (isAuthenticated && adminProfile) {
      setProfileFormData(prev => ({
        ...prev,
        full_name: adminProfile.full_name || '',
        email: adminProfile.email || '',
        profile_picture: adminProfile.profile_picture || '',
      }));
    }
  }, [isAuthenticated, adminProfile]);

  const handleContactInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setContactFormData({ ...contactFormData, [e.target.name]: e.target.value });
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsContactSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactFormData),
      });
      if (res.ok) {
        setContactSubmitStatus('success');
        setContactFormData({ name: '', email: '', subject: '', message: '' });
        setTimeout(() => setContactSubmitStatus('idle'), 5000);
      } else {
        setContactSubmitStatus('error');
      }
    } catch (err) {
      setContactSubmitStatus('error');
    } finally {
      setIsContactSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        setAdminProfile(data.admin);
        setLoginError('');
      } else {
        setLoginError(data.error || 'Invalid admin credentials. Please try again.');
      }
    } catch (err) {
      setLoginError('Connection error. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminProfile(null);
    setLoginData({ username: '', password: '' });
    setView('customer');
    setAdminView('requests');
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileUpdateStatus('idle');

    if (profileFormData.newPassword && profileFormData.newPassword !== profileFormData.confirmPassword) {
      setProfileError('New passwords do not match');
      return;
    }

    setIsProfileUpdating(true);
    try {
      const res = await fetch('/api/admin/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: adminProfile?.username,
          full_name: profileFormData.full_name,
          email: profileFormData.email,
          newUsername: profileFormData.newUsername || undefined,
          profile_picture: profileFormData.profile_picture || undefined,
          password: profileFormData.currentPassword,
          newPassword: profileFormData.newPassword || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminProfile(data.admin);
        setProfileUpdateStatus('success');
        setProfileFormData(prev => ({
          ...prev,
          newUsername: '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        }));
        setTimeout(() => setProfileUpdateStatus('idle'), 5000);
      } else {
        setProfileError(data.error || 'Failed to update profile');
        setProfileUpdateStatus('error');
      }
    } catch (err) {
      setProfileError('Connection error. Please try again.');
      setProfileUpdateStatus('error');
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const fetchRequests = async (page: number = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/requests?page=${page}&limit=10`);
      const data = await res.json();
      setRequests(data.requests);
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (err) {
      console.error('Failed to fetch requests', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', service_type: '', description: '' });
        setTimeout(() => setSubmitStatus('idle'), 5000);
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateStatus = async (id: number, status: RequestStatus) => {
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchRequests(currentPage);
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleStatusChangeRequest = (id: number, currentStatus: RequestStatus, newStatus: RequestStatus) => {
    if (currentStatus === newStatus) return;
    setConfirmModal({
      isOpen: true,
      requestId: id,
      currentStatus: currentStatus,
      newStatus: newStatus,
    });
  };

  const confirmStatusUpdate = async () => {
    if (confirmModal.requestId !== null && confirmModal.newStatus) {
      await updateStatus(confirmModal.requestId, confirmModal.newStatus);
    }
    setConfirmModal({ isOpen: false, requestId: null, currentStatus: null, newStatus: null });
  };

  const handleEditRequest = (req: ServiceRequest) => {
    setEditModal({
      isOpen: true,
      request: { ...req },
    });
  };

  const handleViewRequest = (req: ServiceRequest) => {
    setViewModal({
      isOpen: true,
      request: req,
    });
  };

  const confirmEditUpdate = async () => {
    if (editModal.request) {
      try {
        const res = await fetch(`/api/requests/${editModal.request.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editModal.request),
        });
        if (res.ok) {
          fetchRequests(currentPage);
          setEditModal({ isOpen: false, request: null });
        }
      } catch (err) {
        console.error('Failed to update request', err);
      }
    }
  };

  const filteredRequests = requests.filter(req => 
    req.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
    req.service_type.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
    req.description.toLowerCase().includes(adminSearchQuery.toLowerCase())
  );

  const filteredServices = SERVICES.filter(service => 
    service.name.toLowerCase().includes(customerSearchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(customerSearchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Rajveer <span className="text-indigo-600">Innovations</span>
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => setView('customer')}
                className={`text-sm font-medium transition-colors ${view === 'customer' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-500'}`}
              >
                Services
              </button>
              <button 
                onClick={() => setView('about')}
                className={`text-sm font-medium transition-colors ${view === 'about' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-500'}`}
              >
                About Us
              </button>
              <button 
                onClick={() => setView('contact')}
                className={`text-sm font-medium transition-colors ${view === 'contact' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-500'}`}
              >
                Contact Us
              </button>
              <button 
                onClick={() => setView('admin')}
                className={`text-sm font-medium transition-colors ${view === 'admin' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-500'}`}
              >
                Admin Dashboard
              </button>
              <button 
                onClick={() => setView('customer')}
                className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-indigo-700 transition-all shadow-sm"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                <button 
                  onClick={() => { setView('customer'); setIsMenuOpen(false); }}
                  className="block w-full text-left px-3 py-4 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Services
                </button>
                <button 
                  onClick={() => { setView('about'); setIsMenuOpen(false); }}
                  className="block w-full text-left px-3 py-4 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  About Us
                </button>
                <button 
                  onClick={() => { setView('contact'); setIsMenuOpen(false); }}
                  className="block w-full text-left px-3 py-4 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Contact Us
                </button>
                <button 
                  onClick={() => { setView('admin'); setIsMenuOpen(false); }}
                  className="block w-full text-left px-3 py-4 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                >
                  Admin Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {view === 'customer' ? (
          <div className="space-y-20">
            {/* Hero Section */}
            <section className="text-center space-y-6 max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider"
              >
                <Clock className="w-3 h-3" />
                Fast & Secure Processing
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]"
              >
                E-Governance Services <br />
                <span className="text-indigo-600">Simplified for You.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-slate-600 leading-relaxed"
              >
                Request official documents, update your records, and manage your government services from the comfort of your home.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap justify-center gap-4 pt-4"
              >
                <a href="#request-form" className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2">
                  Request a Service <ArrowRight className="w-4 h-4" />
                </a>
                <button 
                  onClick={() => setView('about')}
                  className="bg-white border border-slate-200 text-slate-700 px-8 py-4 rounded-xl font-semibold hover:bg-slate-50 transition-all"
                >
                  Learn About Us
                </button>
              </motion.div>
            </section>

            {/* Customer Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search for a service (e.g., PAN Card, Aadhaar)..."
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-4 py-4 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg shadow-sm"
                />
              </div>
            </div>

            {customerSearchQuery ? (
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-900">Search Results</h2>
                {filteredServices.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredServices.map(service => (
                      <div key={service.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
                        <div className="flex-grow">
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
                          <p className="text-slate-600 mb-4">{service.description}</p>
                        </div>
                        <button 
                          onClick={() => {
                            setServiceDetailsModal({ isOpen: true, service });
                          }}
                          className="w-full bg-indigo-50 text-indigo-600 py-2 rounded-lg font-semibold hover:bg-indigo-100 transition-colors mt-auto"
                        >
                          View Details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-lg font-medium text-slate-900">No services found</p>
                    <p className="text-slate-500">Try adjusting your search terms.</p>
                  </div>
                )}
              </section>
            ) : (
              <>
                {/* Services Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {SERVICES.map((service, idx) => (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white p-8 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-50 transition-all group cursor-pointer"
                      onClick={() => {
                        setServiceDetailsModal({ isOpen: true, service });
                      }}
                    >
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 transition-colors">
                        <FileText className="w-6 h-6 text-indigo-600 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
                      <p className="text-slate-600 mb-6">{service.description}</p>
                      <div className="flex items-center text-indigo-600 font-semibold text-sm">
                        Apply Now <ChevronRight className="w-4 h-4 ml-1" />
                      </div>
                    </motion.div>
                  ))}
                </section>

                {/* New Service Directory Section */}
                <section className="bg-white rounded-[3rem] border border-slate-100 p-12 md:p-20 shadow-sm">
                  <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Service Directory</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto">Explore our full range of E-Governance solutions categorized for your convenience.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {SERVICE_CATEGORIES.map((cat, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                            {cat.icon}
                          </div>
                          <h3 className="text-xl font-bold text-slate-900">{cat.title}</h3>
                        </div>
                        <ul className="space-y-3">
                          {cat.services.map(sId => {
                            const s = SERVICES.find(service => service.id === sId);
                            return s ? (
                              <li key={sId} className="flex items-start gap-2 group">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                                <div className="space-y-0.5">
                                  <p 
                                    className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors cursor-pointer"
                                    onClick={() => {
                                      setServiceDetailsModal({ isOpen: true, service: s });
                                    }}
                                  >
                                    {s.name}
                                  </p>
                                  <p className="text-xs text-slate-500">{s.description}</p>
                                </div>
                              </li>
                            ) : null;
                          })}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </section>
              </>
            )}


            {/* Request Form */}
            <section id="request-form" className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-5">
                <div className="lg:col-span-2 bg-indigo-600 p-10 text-white flex flex-col justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-4">Submit Your Request</h2>
                    <p className="text-indigo-100 mb-8">Fill out the form and our experts will get back to you within 24 hours.</p>
                    
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Secure Data</p>
                          <p className="text-indigo-200 text-sm">Your info is encrypted</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold">Quick Turnaround</p>
                          <p className="text-indigo-200 text-sm">24/7 Support available</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-10 border-t border-indigo-500">
                    <p className="text-sm text-indigo-200 italic">"Empowering citizens through digital governance."</p>
                  </div>
                </div>

                <div className="lg:col-span-3 p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" /> Full Name
                        </label>
                        <input
                          required
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" /> Email Address
                        </label>
                        <input
                          required
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          placeholder="john@example.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Phone className="w-4 h-4 text-slate-400" /> Phone Number
                        </label>
                        <input
                          required
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-slate-400" /> Service Type
                        </label>
                        <select
                          required
                          name="service_type"
                          value={formData.service_type}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none"
                        >
                          <option value="">Select a service</option>
                          {SERVICES.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Additional Details</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Tell us more about your requirement..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : (
                        <>Submit Request <Send className="w-5 h-5" /></>
                      )}
                    </button>

                    {submitStatus === 'success' && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-emerald-50 text-emerald-700 rounded-2xl flex flex-col items-center text-center gap-3 border border-emerald-100 shadow-sm"
                      >
                        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-bold text-lg">Request Submitted Successfully!</p>
                          <p className="text-sm text-emerald-600/80">We've sent a confirmation to your email and phone. Our team will review your request shortly.</p>
                        </div>
                      </motion.div>
                    )}
                    {submitStatus === 'error' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-rose-50 text-rose-700 rounded-xl flex items-center gap-3 border border-rose-100"
                      >
                        <AlertCircle className="w-5 h-5" />
                        Something went wrong. Please try again.
                      </motion.div>
                    )}
                  </form>
                </div>
              </div>
            </section>
          </div>
        ) : view === 'about' ? (
          <div className="space-y-20">
            {/* About Hero */}
            <section className="text-center space-y-6 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold uppercase tracking-wider"
              >
                <Shield className="w-3 h-3" />
                Trusted by Thousands
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight"
              >
                Empowering Citizens Through <br />
                <span className="text-indigo-600">Digital Innovation.</span>
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-slate-600 leading-relaxed"
              >
                Rajveer Innovations is a leading provider of E-Governance services, dedicated to making government processes accessible, transparent, and efficient for every citizen.
              </motion.p>
            </section>

            {/* Company Details */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-bold text-slate-900">Rajveer E-Governance Services</h2>
                <p className="text-slate-600 leading-relaxed">
                  As a core division of RV Groups, Rajveer E-Governance Services focuses on bridging the gap between complex government procedures and the common citizen. We provide a comprehensive suite of services including PAN card applications, Aadhaar updates, Passport assistance, and more.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Mission Driven</h4>
                      <p className="text-sm text-slate-500">To digitize every citizen's interaction with the government for a smoother experience.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">Secure & Reliable</h4>
                      <p className="text-sm text-slate-500">Your data privacy and security are our top priorities in every transaction.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl">
                  <img 
                    src="https://picsum.photos/seed/office/800/600" 
                    alt="Our Office" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hidden sm:block">
                  <p className="text-3xl font-bold text-indigo-600">10k+</p>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Happy Citizens</p>
                </div>
              </motion.div>
            </section>

            {/* Innovations Section */}
            <section className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full -mr-48 -mt-48"></div>
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                    Rajveer Innovations
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                    Innovating for a <br />
                    <span className="text-indigo-400">Better Tomorrow.</span>
                  </h2>
                  <p className="text-slate-400 text-lg leading-relaxed">
                    Rajveer Innovations is the technology arm of RV Groups, dedicated to developing cutting-edge software solutions that simplify complex administrative tasks. From automated document processing to secure cloud storage, we are at the forefront of digital transformation.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold">99.9%</h4>
                      <p className="text-sm text-slate-500 uppercase font-bold tracking-widest">Uptime</p>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-2xl font-bold">24/7</h4>
                      <p className="text-sm text-slate-500 uppercase font-bold tracking-widest">Support</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="h-48 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 flex flex-col justify-end">
                      <Briefcase className="w-8 h-8 text-indigo-400 mb-4" />
                      <h4 className="font-bold">Business Solutions</h4>
                    </div>
                    <div className="h-64 rounded-2xl bg-indigo-600 p-6 flex flex-col justify-end">
                      <LayoutDashboard className="w-8 h-8 text-white mb-4" />
                      <h4 className="font-bold">Smart Dashboards</h4>
                    </div>
                  </div>
                  <div className="space-y-4 pt-8">
                    <div className="h-64 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-6 flex flex-col justify-end">
                      <Lock className="w-8 h-8 text-indigo-400 mb-4" />
                      <h4 className="font-bold">Data Security</h4>
                    </div>
                    <div className="h-48 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 flex flex-col justify-end">
                      <Search className="w-8 h-8 text-indigo-400 mb-4" />
                      <h4 className="font-bold">AI Search</h4>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Powered by RV Groups */}
            <section className="text-center space-y-12">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">Powered by RV Groups</h2>
                <p className="text-slate-500 max-w-2xl mx-auto">
                  RV Groups is a diversified conglomerate with interests in technology, governance, and social welfare. We are committed to excellence and innovation in everything we do.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <div className="flex items-center gap-2">
                  <Shield className="w-8 h-8" />
                  <span className="text-xl font-bold">RV Tech</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-8 h-8" />
                  <span className="text-xl font-bold">RV Finance</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-8 h-8" />
                  <span className="text-xl font-bold">RV Social</span>
                </div>
                <div className="flex items-center gap-2">
                  <Settings className="w-8 h-8" />
                  <span className="text-xl font-bold">RV Labs</span>
                </div>
              </div>
            </section>
          </div>
        ) : view === 'contact' ? (
          <div className="space-y-16">
            <section className="text-center space-y-4 max-w-2xl mx-auto">
              <h1 className="text-4xl font-bold text-slate-900">Contact Us</h1>
              <p className="text-slate-600">Have questions? We're here to help. Send us a message and we'll respond as soon as possible.</p>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Contact Info & Map */}
              <div className="space-y-8">
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                  <h2 className="text-2xl font-bold text-slate-900">Get in Touch</h2>
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Mail className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Email Us</p>
                        <a href="mailto:support@riians.in" className="text-slate-600 hover:text-indigo-600 transition-colors">support@riians.in</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Phone className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Call Us</p>
                        <a href="tel:+919472641134" className="text-slate-600 hover:text-indigo-600 transition-colors">+91-9472641134</a>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <MapPin className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">Our Office</p>
                        <p className="text-slate-600">Rajveer Innovations, Badlapur, Mumbai</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm h-[400px]">
                  <iframe 
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.752349547432!2d73.2285!3d19.1585!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7936666666667%3A0x6666666666666666!2sBadlapur%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin" 
                    width="100%" 
                    height="100%" 
                    style={{ border: 0 }} 
                    allowFullScreen={true} 
                    loading="lazy" 
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>

              {/* Contact Form */}
              <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-xl">
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Full Name</label>
                    <input
                      required
                      name="name"
                      value={contactFormData.name}
                      onChange={handleContactInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Email Address</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={contactFormData.email}
                      onChange={handleContactInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Subject</label>
                    <input
                      required
                      name="subject"
                      value={contactFormData.subject}
                      onChange={handleContactInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-700">Message</label>
                    <textarea
                      required
                      name="message"
                      value={contactFormData.message}
                      onChange={handleContactInputChange}
                      rows={5}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                      placeholder="Write your message here..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isContactSubmitting}
                    className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isContactSubmitting ? 'Sending...' : (
                      <>Send Message <Send className="w-5 h-5" /></>
                    )}
                  </button>

                  {contactSubmitStatus === 'success' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-3 border border-emerald-100"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Message sent successfully! We'll get back to you soon.
                    </motion.div>
                  )}
                  {contactSubmitStatus === 'error' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-rose-50 text-rose-700 rounded-xl flex items-center gap-3 border border-rose-100"
                    >
                      <AlertCircle className="w-5 h-5" />
                      Failed to send message. Please try again.
                    </motion.div>
                  )}
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            {!isAuthenticated ? (
              <div className="max-w-md mx-auto py-12">
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-8"
                >
                  <div className="text-center space-y-2">
                    <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-100">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900">Admin Login</h2>
                    <p className="text-slate-500">Enter your credentials to access the dashboard</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Username</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={loginData.username}
                          onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          placeholder="Admin username"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="password"
                          required
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    {loginError && (
                      <p className="text-sm text-rose-600 font-medium text-center">{loginError}</p>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                      Login to Dashboard
                    </button>
                  </form>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {adminProfile?.profile_picture ? (
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-lg">
                        <img 
                          src={adminProfile.profile_picture} 
                          alt="Admin" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center border-2 border-white shadow-lg">
                        <User className="w-8 h-8 text-indigo-600" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
                      <p className="text-slate-500">Welcome back, {adminProfile?.full_name || 'Admin'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setAdminView('requests')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        adminView === 'requests' 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <LayoutDashboard className="w-4 h-4" /> Requests
                    </button>
                    <button 
                      onClick={() => setAdminView('profile')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        adminView === 'profile' 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Settings className="w-4 h-4" /> Profile
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white text-rose-600 border border-rose-100 hover:bg-rose-50 transition-all"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>

                {adminView === 'requests' ? (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h2 className="text-xl font-bold text-slate-900">Service Requests</h2>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search requests..."
                            value={adminSearchQuery}
                            onChange={(e) => setAdminSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm w-full sm:w-64"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="w-4 h-4" />
                          Last updated: {new Date().toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                          <tr>
                            <th className="px-6 py-4">Citizen</th>
                            <th className="px-6 py-4">Service</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {isLoading ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                  Loading requests...
                                </div>
                              </td>
                            </tr>
                          ) : filteredRequests.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                No requests found.
                              </td>
                            </tr>
                          ) : (
                            filteredRequests.map((req) => (
                              <motion.tr 
                                key={req.id} 
                                whileHover={{ backgroundColor: "rgba(248, 250, 252, 1)" }}
                                className="transition-colors border-b border-slate-50 last:border-0"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{req.name}</span>
                                    <span className="text-xs text-slate-500">{req.email}</span>
                                    <span className="text-xs text-slate-500">{req.phone}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-700">{req.service_type}</span>
                                    <span className="text-xs text-slate-500 truncate max-w-[200px]">{req.description}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500">
                                  {new Date(req.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    req.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                    req.status === 'rejected' ? 'bg-rose-100 text-rose-800' :
                                    req.status === 'in-progress' ? 'bg-amber-100 text-amber-800' :
                                    'bg-indigo-100 text-indigo-800'
                                  }`}>
                                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <select 
                                      value={req.status}
                                      onChange={(e) => handleStatusChangeRequest(req.id, req.status, e.target.value as RequestStatus)}
                                      className="text-xs border border-slate-200 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                      <option value="pending">Pending</option>
                                      <option value="in-progress">In Progress</option>
                                      <option value="completed">Completed (Approve)</option>
                                      <option value="rejected">Rejected</option>
                                    </select>
                                    <button 
                                      onClick={() => handleViewRequest(req)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                      title="View Details"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => handleEditRequest(req)}
                                      className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                      title="Edit Request"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-1 text-slate-400 hover:text-indigo-600 transition-colors">
                                      <Mail className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </motion.tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                          Page <span className="font-medium text-slate-900">{currentPage}</span> of <span className="font-medium text-slate-900">{totalPages}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <div className="hidden sm:flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                              <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                                  currentPage === i + 1
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                {i + 1}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
                    >
                      <div className="p-8 border-b border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-900">Admin Profile Settings</h2>
                        <p className="text-slate-500 mt-1">Manage your account details and security</p>
                      </div>

                      <form onSubmit={handleProfileUpdate} className="p-8 space-y-8">
                        <div className="space-y-6">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <User className="w-5 h-5 text-indigo-600" /> Personal Information
                          </h3>

                          {/* Profile Picture Upload */}
                          <div className="flex flex-col items-center gap-4 pb-4">
                            <div className="relative group">
                              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center">
                                {profileFormData.profile_picture ? (
                                  <img 
                                    src={profileFormData.profile_picture} 
                                    alt="Profile" 
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <User className="w-16 h-16 text-slate-300" />
                                )}
                              </div>
                              <label className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full text-white cursor-pointer shadow-lg hover:bg-indigo-700 transition-all">
                                <Camera className="w-5 h-5" />
                                <input 
                                  type="file" 
                                  className="hidden" 
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        setProfileFormData({ ...profileFormData, profile_picture: reader.result as string });
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Click camera to upload photo</p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-slate-700">Full Name</label>
                              <input
                                type="text"
                                value={profileFormData.full_name}
                                onChange={(e) => setProfileFormData({ ...profileFormData, full_name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Admin Name"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-slate-700">Email Address</label>
                              <input
                                type="email"
                                value={profileFormData.email}
                                onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="admin@example.com"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-slate-700">New Username (Optional)</label>
                              <input
                                type="text"
                                value={profileFormData.newUsername}
                                onChange={(e) => setProfileFormData({ ...profileFormData, newUsername: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Enter new username"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-6 pt-8 border-t border-slate-100">
                          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-indigo-600" /> Security & Password
                          </h3>
                          <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-slate-700">Current Password <span className="text-rose-500">*</span></label>
                              <input
                                type="password"
                                required
                                value={profileFormData.currentPassword}
                                onChange={(e) => setProfileFormData({ ...profileFormData, currentPassword: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                placeholder="Enter current password to save changes"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">New Password (Optional)</label>
                                <input
                                  type="password"
                                  value={profileFormData.newPassword}
                                  onChange={(e) => setProfileFormData({ ...profileFormData, newPassword: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                  placeholder="Leave blank to keep current"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Confirm New Password</label>
                                <input
                                  type="password"
                                  value={profileFormData.confirmPassword}
                                  onChange={(e) => setProfileFormData({ ...profileFormData, confirmPassword: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                  placeholder="Confirm new password"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {profileError && (
                          <p className="text-sm text-rose-600 font-medium">{profileError}</p>
                        )}

                        {profileUpdateStatus === 'success' && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-emerald-50 text-emerald-700 rounded-xl flex items-center gap-3 border border-emerald-100"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Profile updated successfully!
                          </motion.div>
                        )}

                        <div className="pt-4">
                          <button
                            type="submit"
                            disabled={isProfileUpdating}
                            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isProfileUpdating ? 'Updating...' : (
                              <>Save Changes <Save className="w-5 h-5" /></>
                            )}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 overflow-hidden"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Confirm Status Change</h3>
                  <p className="text-slate-500 text-sm">Are you sure you want to update this request?</p>
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 rounded-2xl mb-8 border border-slate-100 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-bold text-slate-700 uppercase">{confirmModal.currentStatus}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">New Status:</span>
                  <span className="font-bold text-indigo-600 uppercase">{confirmModal.newStatus}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusUpdate}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Confirm Update
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Request Details Modal */}
      <AnimatePresence>
        {viewModal.isOpen && viewModal.request && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewModal({ ...viewModal, isOpen: false })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Request Details</h3>
                  <p className="text-sm text-slate-500 mt-1">Reference ID: #{viewModal.request.id}</p>
                </div>
                <button 
                  onClick={() => setViewModal({ ...viewModal, isOpen: false })}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Citizen Information</label>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center gap-3 text-slate-700">
                          <User className="w-4 h-4 text-indigo-500" />
                          <span className="font-medium">{viewModal.request.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                          <Mail className="w-4 h-4 text-indigo-500" />
                          <span>{viewModal.request.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700">
                          <Phone className="w-4 h-4 text-indigo-500" />
                          <span>{viewModal.request.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Submission Date</label>
                      <div className="mt-2 flex items-center gap-3 text-slate-700">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span>{new Date(viewModal.request.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Service Details</label>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center gap-3 text-slate-700">
                          <Briefcase className="w-4 h-4 text-indigo-500" />
                          <span className="font-semibold text-indigo-600">{viewModal.request.service_type}</span>
                        </div>
                        <div className="flex items-start gap-3 text-slate-700">
                          <div className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            viewModal.request.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            viewModal.request.status === 'in-progress' ? 'bg-amber-100 text-amber-800' :
                            'bg-indigo-100 text-indigo-800'
                          }`}>
                            {viewModal.request.status.toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Request Description</label>
                  <p className="mt-3 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {viewModal.request.description || "No additional details provided."}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 mt-10">
                <button
                  onClick={() => {
                    const req = viewModal.request;
                    setViewModal({ ...viewModal, isOpen: false });
                    if (req) handleEditRequest(req);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" /> Edit Details
                </button>
                <button
                  onClick={() => setViewModal({ ...viewModal, isOpen: false })}
                  className="flex-1 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Request Modal */}
      <AnimatePresence>
        {editModal.isOpen && editModal.request && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditModal({ ...editModal, isOpen: false })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900">Edit Request Details</h3>
                <button 
                  onClick={() => setEditModal({ ...editModal, isOpen: false })}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              
              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Citizen Name</label>
                    <input 
                      value={editModal.request.name}
                      onChange={(e) => setEditModal({ ...editModal, request: { ...editModal.request!, name: e.target.value } })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                    <input 
                      value={editModal.request.email}
                      onChange={(e) => setEditModal({ ...editModal, request: { ...editModal.request!, email: e.target.value } })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label>
                    <input 
                      value={editModal.request.phone}
                      onChange={(e) => setEditModal({ ...editModal, request: { ...editModal.request!, phone: e.target.value } })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Service Type</label>
                    <select 
                      value={editModal.request.service_type}
                      onChange={(e) => setEditModal({ ...editModal, request: { ...editModal.request!, service_type: e.target.value } })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {SERVICES.map(s => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Description / Details</label>
                  <textarea 
                    value={editModal.request.description}
                    onChange={(e) => setEditModal({ ...editModal, request: { ...editModal.request!, description: e.target.value } })}
                    rows={4}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
                  <select 
                    value={editModal.request.status}
                    onChange={(e) => setEditModal({ ...editModal, request: { ...editModal.request!, status: e.target.value as RequestStatus } })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setEditModal({ ...editModal, isOpen: false })}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmEditUpdate}
                  className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Service Details Modal */}
      <AnimatePresence>
        {serviceDetailsModal.isOpen && serviceDetailsModal.service && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setServiceDetailsModal({ isOpen: false, service: null })}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{serviceDetailsModal.service.name}</h3>
                    <p className="text-sm text-slate-500">{serviceDetailsModal.service.description}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setServiceDetailsModal({ isOpen: false, service: null })}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-bold text-slate-900">Documents Required</h4>
                </div>
                <ul className="space-y-2">
                  {serviceDetailsModal.service.documents_required?.split(',').map((doc, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                      <span>{doc.trim()}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setFormData({ ...formData, service_type: serviceDetailsModal.service!.name });
                    setServiceDetailsModal({ isOpen: false, service: null });
                    document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
                >
                  Apply Now <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setServiceDetailsModal({ isOpen: false, service: null })}
                  className="px-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-600" />
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Rajveer <span className="text-indigo-600">Innovations</span>
                </span>
              </div>
              <p className="text-slate-500 max-w-sm">
                Providing reliable and efficient E-Governance services to citizens. We bridge the gap between government and technology.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Quick Links</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><button onClick={() => setView('customer')} className="hover:text-indigo-600">Home</button></li>
                <li><button onClick={() => setView('about')} className="hover:text-indigo-600">About Us</button></li>
                <li><button onClick={() => setView('customer')} className="hover:text-indigo-600">Services</button></li>
                <li><button onClick={() => setView('contact')} className="hover:text-indigo-600">Contact Us</button></li>
                <li><button onClick={() => setView('admin')} className="hover:text-indigo-600">Admin Login</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-6">Contact Us</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-600" /> 
                  <a href="mailto:support@riians.in" className="hover:text-indigo-600 transition-colors">support@riians.in</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-600" /> 
                  <a href="tel:+919472641134" className="hover:text-indigo-600 transition-colors">+91-9472641134</a>
                </li>
                <li className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600 mt-1 shrink-0" /> 
                  <span>Rajveer Innovations, Badlapur, Mumbai</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" /> 
                  <span>Mon - Sat: 9AM - 6PM</span>
                </li>
              </ul>
              <div className="mt-6 rounded-xl overflow-hidden border border-slate-100 h-32">
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3769.752349547432!2d73.2285!3d19.1585!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7936666666667%3A0x6666666666666666!2sBadlapur%2C%20Maharashtra!5e0!3m2!1sen!2sin!4v1710000000000!5m2!1sen!2sin" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen={true} 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-100 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-xs">© 2026 Rajveer Innovations. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-slate-400">
              <a href="#" className="hover:text-indigo-600">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-600">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
