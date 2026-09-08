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

const SAMPLE_PDF_URL =
  "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

const SAMPLE_IMAGE_URL =
  "https://images.unsplash.com/photo-1584483766114-1ccaedb1924e?w=800&h=600&fit=crop";

/** Demo products for `/p/demo-req-*` when no approved submission exists in storage */
const MOCK_PUBLIC_PRODUCTS: Record<string, PublicProduct> = {
  "demo-req-1": {
    id: "demo-req-1",
    productName: "Premium Kitchen Knife Set",
    productImage:
      "https://images.unsplash.com/photo-1593618998168-e34014e67546?w=400&h=400&fit=crop",
    supplierName: "Nordic Cutlery Co.",
    approvedAt: "2025-08-12T10:30:00.000Z",
    documents: [
      {
        key: "testReport",
        label: "Test Report",
        fileName: "knife-set-test-report-2025.pdf",
        downloadUrl: SAMPLE_PDF_URL,
      },
      {
        key: "declarationOfConformity",
        label: "Declaration of Conformity",
        fileName: "doc-ce-declaration.pdf",
        downloadUrl: SAMPLE_PDF_URL,
      },
      {
        key: "manualOrInstructions",
        label: "Manual or Instructions",
        fileName: "knife-set-user-manual.pdf",
        downloadUrl: SAMPLE_PDF_URL,
      },
      {
        key: "certificate",
        label: "Certificate",
        fileName: "iso-9001-certificate.pdf",
        downloadUrl: SAMPLE_PDF_URL,
      },
      {
        key: "safetyImage",
        label: "Safety Image",
        fileName: "safety-label.jpg",
        downloadUrl: SAMPLE_IMAGE_URL,
      },
    ],
    textFields: [
      {
        key: "safetyNoticeText",
        label: "Safety notice text",
        value:
          "<p>Keep knives out of reach of children. Always use a stable cutting surface.</p>",
      },
      {
        key: "warningText",
        label: "Warning text",
        value:
          "<p><strong>Sharp blades.</strong> Handle with care and store in the provided block when not in use.</p>",
      },
      {
        key: "ageGrading",
        label: "Age grading",
        value: "<p>Not suitable for children under 14 years.</p>",
      },
      {
        key: "materialInformation",
        label: "Material information",
        value:
          "<p>Blade: high-carbon stainless steel. Handle: pakka wood. Block: acacia wood.</p>",
      },
    ],
  },
  "demo-req-2": {
    id: "demo-req-2",
    productName: "Organic Cotton Baby Onesie",
    productImage:
      "https://images.unsplash.com/photo-1522771930-56648cfc4938?w=400&h=400&fit=crop",
    supplierName: "GreenThreads Ltd.",
    approvedAt: "2025-08-18T14:00:00.000Z",
    documents: [
      {
        key: "testReport",
        label: "Test Report",
        fileName: "onesie-flammability-test.pdf",
        downloadUrl: SAMPLE_PDF_URL,
      },
      {
        key: "regulatoryDocument",
        label: "Regulatory Document",
        fileName: "reach-compliance-statement.pdf",
        downloadUrl: SAMPLE_PDF_URL,
      },
    ],
    textFields: [
      {
        key: "materialInformation",
        label: "Material information",
        value: "<p>100% GOTS-certified organic cotton. Nickel-free snaps.</p>",
      },
      {
        key: "usageRestrictions",
        label: "Usage restrictions",
        value: "<p>Machine wash cold. Do not bleach. Tumble dry low.</p>",
      },
    ],
  },
};

async function getApprovedProductFromStorage(
  id: string,
): Promise<PublicProduct | null> {
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

/**
 * Build the public product view from browser storage.
 * Visible only after the distributor approves the submitted request.
 * Shows fields marked Public or Required that have content.
 * Falls back to demo data for known `demo-req-*` ids when storage is empty.
 */
export async function getPublicProductFromStorage(
  id: string,
): Promise<PublicProduct | null> {
  if (typeof window === "undefined") return null;

  const fromStorage = await getApprovedProductFromStorage(id);
  if (fromStorage) return fromStorage;

  return MOCK_PUBLIC_PRODUCTS[id] ?? null;
}

export function revokePublicProductUrls(product: PublicProduct) {
  for (const document of product.documents) {
    if (document.downloadUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(document.downloadUrl);
    }
  }
}
