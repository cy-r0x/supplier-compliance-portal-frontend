import type { PublicProductData, PublicProductStatus } from "./api/public-product-api";
import { isPublicProductStatus } from "./api/public-product-api";
import {
  documentDisplayRank,
  fieldDisplayRank,
  isProductImageDocument,
  publicDocumentLabel,
  publicFieldLabel,
} from "./public-product-labels";

export type PublicProductDocument = {
  key: string;
  label: string;
  fileName: string;
  downloadUrl?: string;
  type: string;
};

export type PublicProductTextField = {
  key: string;
  label: string;
  value: string;
  fieldType: string;
};

export type PublicProduct = {
  id: string;
  productName: string;
  supplierName: string;
  status: PublicProductStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  documents: PublicProductDocument[];
  textFields: PublicProductTextField[];
};

export function mapApiPublicProduct(
  publicSlug: string,
  data: PublicProductData,
): PublicProduct | null {
  const status = resolvePublicStatus(data);
  if (!status) return null;

  const documents = data.documents
    .filter((doc) => !isProductImageDocument(doc.type))
    .map((doc, index) => ({
      key: doc.customKey || doc.type || String(index),
      type: doc.type,
      label: publicDocumentLabel(doc.type, doc.label),
      fileName: doc.fileName || "document",
      downloadUrl: doc.fileUrl,
    }))
    .sort(
      (a, b) =>
        documentDisplayRank(a.type) - documentDisplayRank(b.type) ||
        a.label.localeCompare(b.label),
    );

  const textFields = data.textFields
    .map((field, index) => ({
      key: field.customKey || field.fieldType || String(index),
      fieldType: field.fieldType,
      label: publicFieldLabel(field.fieldType, field.label),
      value: field.value,
    }))
    .sort(
      (a, b) =>
        fieldDisplayRank(a.fieldType) - fieldDisplayRank(b.fieldType) ||
        a.label.localeCompare(b.label),
    );

  return {
    id: publicSlug,
    productName: data.name,
    supplierName: data.supplierName,
    status,
    submittedAt: data.submittedAt ?? null,
    reviewedAt: data.reviewedAt ?? data.approvedAt ?? null,
    rejectionReason: data.rejectionReason ?? null,
    documents,
    textFields,
  };
}

function resolvePublicStatus(
  data: PublicProductData,
): PublicProductStatus | null {
  if (isPublicProductStatus(data.status)) {
    return data.status;
  }

  // Legacy responses only exposed approved products without a status field.
  if (data.approvedAt || data.reviewedAt) {
    return "APPROVED";
  }

  return null;
}

export function revokePublicProductUrls(product: PublicProduct) {
  for (const document of product.documents) {
    if (document.downloadUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(document.downloadUrl);
    }
  }
}
