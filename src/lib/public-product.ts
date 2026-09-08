import type { PublicProductData } from "./api/public-product-api";

export type PublicProductDocument = {
  key: string;
  label: string;
  fileName: string;
  downloadUrl?: string;
};

export type PublicProductTextField = {
  key: string;
  label: string;
  value: string;
};

export type PublicProduct = {
  id: string;
  productName: string;
  productImage: string;
  supplierName: string;
  approvedAt: string;
  documents: PublicProductDocument[];
  textFields: PublicProductTextField[];
};

const FALLBACK_IMAGE = "/Images/avatar.jpg";

export function mapApiPublicProduct(
  publicSlug: string,
  data: PublicProductData,
): PublicProduct {
  return {
    id: publicSlug,
    productName: data.name,
    productImage: data.photo || FALLBACK_IMAGE,
    supplierName: data.supplierName,
    approvedAt: data.approvedAt ?? new Date().toISOString(),
    documents: data.documents.map((doc, index) => ({
      key: doc.customKey || doc.type || String(index),
      label: doc.label || doc.type,
      fileName: doc.fileName || "document",
      downloadUrl: doc.fileUrl,
    })),
    textFields: data.textFields.map((field, index) => ({
      key: field.customKey || field.fieldType || String(index),
      label: field.label || field.fieldType,
      value: field.value,
    })),
  };
}

export function revokePublicProductUrls(product: PublicProduct) {
  for (const document of product.documents) {
    if (document.downloadUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(document.downloadUrl);
    }
  }
}
