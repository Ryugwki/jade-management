export type JewelryType =
  | "Bracelet"
  | "Beadedbracelet"
  | "Pendant"
  | "Earrings"
  | "Rings";

export type GemstoneType =
  | "Nuo"
  | "Nuo transformation"
  | "Nuo ice"
  | "Ice"
  | "High ice"
  | "Glass"
  | "";

export interface Product {
  id: string;
  description: string;
  image?: string;
  images?: string[];
  gemstoneType: GemstoneType;
  jewelryType: JewelryType | "";
  colorType: string;
  dimensions: {
    innerDiameterMm?: number;
    widthMm?: number;
    thicknessMm?: number;
    shape?: "round" | "oval" | "";
    bangleProfile?: "round" | "flat" | "";
    beadDiameterMm?: number;
    maxBeadDiameterMm?: number;
    minBeadDiameterMm?: number;
    beadCount?: number;
    lengthMm?: number;
    ringSize?: number;
    ringSizeUS?: number;
    earringType?: "stud" | "drop" | "hoop" | "dangle" | "";
  };
  buyingPrice: string;
  sellingPrice: string;
  certificateId: string;
  certificateAuthority?: string;
  certificateStatus: CertificateStatus;
  certificateLink?: string;
  createdAt?: string; // hoặc Date nếu muốn
  updatedAt?: string;
}

export type CertificateStatus =
  | "Unverified"
  | "Pending"
  | "Verified"
  | "unverified"
  | "pending"
  | "verified";
