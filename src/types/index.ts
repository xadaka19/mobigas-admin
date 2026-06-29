export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  selfieUrl?: string;
  estate: string;
  county: string;
  bankApprovalStatus: string;
  bankApprovedLimit?: number;
  bankCreditUsed?: number;
  partnerBankName?: string;
  guarantors?: { name: string; phone: string }[];
  createdAt: any;
  fcmToken?: string;
}

export interface Vendor {
  id: string;
  businessName: string;
  ownerName: string;
  phone: string;
  businessType: string;
  nationalId?: string;
  businessRegNumber?: string;
  address: string;
  county: string;
  brands: string[];
  listings: Listing[];
  isVerified: boolean;
  isOnline: boolean;
  rating: number;
  totalReviews: number;
  certificateUrl?: string;
  photoUrl?: string;
  paymentMethod: string;
  tillNumber?: string;
  paybillNumber?: string;
  deliveryTime: string;
  createdAt: any;
  fcmToken?: string;
}

export interface Listing {
  size: string;
  kg: number;
  price: number;
  available: boolean;
  productType: string;
}

export interface Order {
  id: string;
  orderId: string;
  customerId: string;
  vendorId: string;
  customerName: string;
  vendorName: string;
  customerArea: string;
  gasSize: string;
  gasPrice: number;
  bankDisbursementAmount: number;
  originationFeeToMobigas: number;
  status: string;
  pin: string;
  createdAt: any;
  deliveredAt?: any;
  partnerBankName: string;
  customerRating?: number;
  vendorFcmToken?: string;
  customerFcmToken?: string;
}

export interface CreditApplication {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  nationalId: string;
  selfieUrl?: string;
  guarantors: { name: string; phone: string }[];
  status: string;
  bankName?: string;
  approvedLimit?: number;
  createdAt: any;
  submittedToBankAt?: any;
  bankDecisionAt?: any;
}

export interface StockLoan {
  id: string;
  vendorId: string;
  vendorName: string;
  ownerName: string;
  phone: string;
  requestedAmount: number;
  approvedAmount: number;
  purpose: string;
  status: string;
  monthsOnPlatform: number;
  totalDeliveries: number;
  averageMonthlyRevenue: number;
  certificateUrl?: string;
  appliedAt: any;
  bankDecisionAt?: any;
}

export interface BankPartner {
  id: string;
  name: string;
  commissionRate: number;
  apiEndpoint?: string;
  isActive: boolean;
  totalDisbursed: number;
  createdAt: any;
}
