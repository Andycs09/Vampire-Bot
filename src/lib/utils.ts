import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export const LAND_UNIT_OPTIONS = [
  { value: 'bigha', label: 'Bigha', regions: 'Rajasthan, UP, Bihar, MP, Assam, West Bengal, Himachal Pradesh, Jharkhand' },
  { value: 'biswa', label: 'Biswa', regions: 'Rajasthan, UP, MP, Delhi, Himachal Pradesh' },
  { value: 'biswansi', label: 'Biswansi', regions: 'Rajasthan, UP' },
  { value: 'kattha', label: 'Kattha (Katha/Cottah)', regions: 'Bihar, Jharkhand, Assam, West Bengal' },
  { value: 'dhur', label: 'Dhur', regions: 'Bihar, Jharkhand' },
  { value: 'kanal', label: 'Kanal', regions: 'Punjab, Haryana, Jammu & Kashmir, Ladakh, Chandigarh' },
  { value: 'marla', label: 'Marla', regions: 'Punjab, Haryana, Jammu & Kashmir' },
  { value: 'guntha', label: 'Guntha / Gunta', regions: 'Maharashtra, Karnataka, Telangana, Gujarat, Goa' },
  { value: 'cent', label: 'Cent', regions: 'Tamil Nadu, Kerala, Andhra Pradesh, Puducherry' },
  { value: 'ground', label: 'Ground', regions: 'Tamil Nadu, Puducherry' },
  { value: 'decimal', label: 'Decimal', regions: 'Odisha, Bihar, Jharkhand, West Bengal' },
  { value: 'nali', label: 'Nali', regions: 'Uttarakhand' },
  { value: 'pari', label: 'Pari', regions: 'Manipur' },
  { value: 'kani', label: 'Kani', regions: 'Tripura' },
  { value: 'lessa', label: 'Lessa', regions: 'Assam' },
  { value: 'are', label: 'Are', regions: 'Kerala' },
  { value: 'thram', label: 'Thram', regions: 'Sikkim' },
  { value: 'acres', label: 'Acre', regions: 'Standard' },
  { value: 'hectares', label: 'Hectare', regions: 'Standard' },
] as const;

export type LandUnit = typeof LAND_UNIT_OPTIONS[number]['value'];

const LAND_UNIT_TO_ACRES: Record<LandUnit, number> = {
  bigha: 0.625,
  biswa: 0.03125,
  biswansi: 0.0015625,
  kattha: 0.03125,
  dhur: 0.0015625,
  kanal: 0.125,
  marla: 0.00625,
  guntha: 0.025,
  cent: 0.01,
  ground: 0.055,
  decimal: 0.01,
  nali: 0.0205,
  pari: 0.0625,
  kani: 1.32,
  lessa: 0.0015625,
  are: 0.0247,
  thram: 0.01,
  acres: 1,
  hectares: 2.471,
}

export function convertLandUnit(size: number, from: string, to: string): number {
  const fromRate = LAND_UNIT_TO_ACRES[from as LandUnit] || 1;
  const toRate = LAND_UNIT_TO_ACRES[to as LandUnit] || 1;

  const acres = size * fromRate;
  return acres / toRate;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getLanguageName(code: string): string {
  const languages: { [key: string]: string } = {
    hindi: 'हिंदी',
    english: 'English',
    kannada: 'ಕನ್ನಡ',
    telugu: 'తెలుగు',
    tamil: 'தமிழ்'
  };
  
  return languages[code] || code;
}