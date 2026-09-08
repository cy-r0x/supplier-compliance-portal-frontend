import {
  DOCUMENT_FIELD_CONFIG,
  TEXT_FIELD_CONFIG,
  normalizeComplianceSubmission,
  type ComplianceDocuments,
  type ComplianceSubmission,
} from "./compliance";
import { readComplianceFileUrls, type ComplianceFileRef } from "./compliance-files";
import { isEmptyHtml } from "./html";
import {
  getComplianceSubmissionById,
  getProductRequestById,
} from "./product-request-store";

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

/** Fields visible on the public product page */
function isVisibleOnPublicPage(field: {
  isPublic: boolean;
  required: boolean;
}) {
  return field.isPublic || field.required;
}

/** Extract public-facing fields from a compliance submission */
export function extractPublicFields(
  submission: ComplianceSubmission,
  fileRefs: Partial<Record<keyof ComplianceDocuments, ComplianceFileRef>>,
): Pick<PublicProduct, "documents" | "textFields"> {
  const documents: PublicProductDocument[] = [];

  for (const { key, label } of DOCUMENT_FIELD_CONFIG) {
    const field = submission[key];
    const stored = fileRefs[key];
    const fileName = field.fileName.trim() || stored?.fileName || "";
    if (!fileName) continue;
    if (!isVisibleOnPublicPage(field) && !stored) continue;

    documents.push({
      key,
      label,
      fileName,
      downloadUrl: stored?.url,
    });
  }

  const textFields: PublicProductTextField[] = [];

  for (const { key, label } of TEXT_FIELD_CONFIG) {
    const field = submission[key];
    if (!isVisibleOnPublicPage(field) || isEmptyHtml(field.value)) continue;
    textFields.push({ key, label, value: field.value });
  }

  return { documents, textFields };
}

/**
 * Build the public product view from browser storage.
 * Visible only after the distributor approves the submitted request.
 * Shows fields marked Public or Required that have content.
 */
export async function getPublicProductFromStorage(
  id: string,
): Promise<PublicProduct | null> {
  if (typeof window === "undefined") return null;

  const request = getProductRequestById(id);
  if (!request || !request.submitted || request.status !== "approved") {
    return null;
  }

  const rawSubmission = getComplianceSubmissionById(id);
  if (!rawSubmission) return null;

  const submission = normalizeComplianceSubmission(rawSubmission);

  const fileRefs = await readComplianceFileUrls(id);
  const { documents, textFields } = extractPublicFields(submission, fileRefs);

  return {
    id: request.id,
    productName: request.productName,
    productImage: request.productImage,
    supplierName: request.supplierName,
    approvedAt: request.submittedAt ?? request.requestedAt,
    documents,
    textFields,
  };
}

export function revokePublicProductUrls(product: PublicProduct) {
  for (const document of product.documents) {
    if (document.downloadUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(document.downloadUrl);
    }
  }
}
