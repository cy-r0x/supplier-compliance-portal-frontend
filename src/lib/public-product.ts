import {
  DOCUMENT_FIELD_CONFIG,
  TEXT_FIELD_CONFIG,
  type ComplianceSubmission,
} from "./compliance";

export type PublicProductDocument = {
  key: string;
  label: string;
  fileName: string;
  /** Populated when the API is wired up */
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

/** Extract only fields marked public from a compliance submission */
export function extractPublicFields(
  submission: ComplianceSubmission,
): Pick<PublicProduct, "documents" | "textFields"> {
  const documents: PublicProductDocument[] = [];

  for (const { key, label } of DOCUMENT_FIELD_CONFIG) {
    const field = submission[key];
    if (field.isPublic && field.fileName.trim()) {
      documents.push({ key, label, fileName: field.fileName });
    }
  }

  const textFields: PublicProductTextField[] = [];

  for (const { key, label } of TEXT_FIELD_CONFIG) {
    const field = submission[key];
    if (field.isPublic && field.value.trim()) {
      textFields.push({ key, label, value: field.value });
    }
  }

  return { documents, textFields };
}

// ---------------------------------------------------------------------------
// Mock data — replace getPublicProduct() with an API call later
// ---------------------------------------------------------------------------

const MOCK_PRODUCTS: Record<string, PublicProduct> = {
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
      },
      {
        key: "declarationOfConformity",
        label: "Declaration of Conformity",
        fileName: "doc-ce-declaration.pdf",
      },
      {
        key: "manualOrInstructions",
        label: "Manual or Instructions",
        fileName: "knife-set-user-manual.pdf",
      },
      {
        key: "certificate",
        label: "Certificate",
        fileName: "iso-9001-certificate.pdf",
      },
      {
        key: "safetyImage",
        label: "Safety Image",
        fileName: "safety-label.jpg",
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
      },
      {
        key: "regulatoryDocument",
        label: "Regulatory Document",
        fileName: "reach-compliance-statement.pdf",
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

/**
 * Fetch public product details by id.
 * TODO: replace with `apiGet<PublicProduct>(`/public/products/${id}`)`
 */
export async function getPublicProduct(id: string): Promise<PublicProduct | null> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_PRODUCTS[id] ?? null;
}
