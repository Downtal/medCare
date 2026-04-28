export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  children?: Category[];
  createdAt?: string;
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  author: string;
  category: string;
  image: string;
  date: string;
  readTime: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  categoryId: number;
  categoryName?: string;
  categorySlug?: string;
  parentCategoryId?: number;
  parentCategoryName?: string;
  parentCategorySlug?: string;
  sourceSku?: string;
  registrationNumber?: string;
  requiresPrescription: boolean;
  packingUnit?: string;
  status: boolean;
  price: number;
  originalPrice?: number;
  stockQuantity?: number;

  brand?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  dosageForm?: string;
  expiryDate?: string;
  activeIngredients?: string;
  description?: string;
  indications?: string;
  usageInstruction?: string;
  contraindications?: string;
  sideEffects?: string;
  precautions?: string;
  storageConditions?: string;

  primaryImageUrl?: string;
  imageUrls?: string[];
  images?: { imageUrl: string; publicId: string; isPrimary: boolean }[];
  createdAt?: string;
}

export interface UserProfileDto {
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO string
  gender: string;
  createdAt?: string;
}

export interface AddressDto {
  id: number;
  userId: number;
  receiverName: string;
  receiverPhone: string;
  fullAddress: string;
  city: string;
  district: string;
  isDefault: boolean;
}

export type PrescriptionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PrescriptionResponse {
  id: number;
  userId: number;
  imageUrl: string;
  status: PrescriptionStatus;
  hospitalName?: string;
  clinicName?: string;
  doctorName?: string;
  expiryDate?: string;
  isUsed: boolean;
  pharmacistNote?: string;
  extractedData?: string; // JSON string
  createdAt: string;
  updatedAt: string;
}
