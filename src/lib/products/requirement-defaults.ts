import {
  DOCUMENT_FIELD_CONFIG,
  TEXT_FIELD_CONFIG,
} from "@/lib/compliance";

export type DocumentRequirementInput = {
  type: string;
  customKey?: string;
  label?: string;
  level: "REQUIRED" | "OPTIONAL";
  visibility: "PUBLIC" | "PRIVATE";
};

export type FieldRequirementInput = {
  fieldType: string;
  customKey?: string;
  label?: string;
  level: "REQUIRED" | "OPTIONAL";
  visibility: "PUBLIC" | "PRIVATE";
};

const DOCUMENT_KEY_TO_TYPE: Record<string, string> = {
  testReport: "TEST_REPORT",
  declarationOfConformity: "DECLARATION_OF_CONFORMITY",
  manualOrInstructions: "MANUAL_OR_INSTRUCTIONS",
  certificate: "CERTIFICATE",
  productImage: "PRODUCT_IMAGE",
  safetyImage: "SAFETY_IMAGE",
  regulatoryDocument: "REGULATORY_DOCUMENT",
  other: "OTHER",
};

const TEXT_KEY_TO_TYPE: Record<string, string> = {
  safetyNoticeText: "SAFETY_NOTICE_TEXT",
  warningText: "WARNING_TEXT",
  ageGrading: "AGE_GRADING",
  materialInformation: "MATERIAL_INFORMATION",
  usageRestrictions: "USAGE_RESTRICTIONS",
  safetyInstructions: "SAFETY_INSTRUCTIONS",
  additionalNotes: "ADDITIONAL_NOTES",
};

const REQUIRED_DOCS = new Set(["testReport", "declarationOfConformity"]);
const REQUIRED_TEXT = new Set(["safetyNoticeText", "ageGrading"]);
const PUBLIC_DOCS = new Set(["productImage", "safetyImage"]);
const PUBLIC_TEXT = new Set(["safetyNoticeText", "warningText", "ageGrading"]);

export function buildDefaultDocumentRequirements(): DocumentRequirementInput[] {
  return DOCUMENT_FIELD_CONFIG.map(({ key, label }) => {
    const type = DOCUMENT_KEY_TO_TYPE[key];
    const isOther = key === "other";
    return {
      type,
      ...(isOther ? { customKey: "other", label: "Other document" } : {}),
      level: REQUIRED_DOCS.has(key) ? "REQUIRED" : "OPTIONAL",
      visibility: PUBLIC_DOCS.has(key) ? "PUBLIC" : "PRIVATE",
    };
  });
}

export function buildDefaultFieldRequirements(): FieldRequirementInput[] {
  return TEXT_FIELD_CONFIG.map(({ key, label }) => {
    const fieldType = TEXT_KEY_TO_TYPE[key];
    const isOther = key === "additionalNotes";
    return {
      fieldType,
      ...(isOther ? { customKey: "notes", label } : {}),
      level: REQUIRED_TEXT.has(key) ? "REQUIRED" : "OPTIONAL",
      visibility: PUBLIC_TEXT.has(key) ? "PUBLIC" : "PRIVATE",
    };
  });
}

export type CreateProductInput = {
  name: string;
  supplierId: string;
  sku?: string;
  price?: number;
  photo?: File | null;
};

export function buildCreateProductFormData(input: CreateProductInput): FormData {
  const form = new FormData();
  form.append("name", input.name.trim());
  form.append("supplierId", input.supplierId);
  if (input.sku?.trim()) {
    form.append("sku", input.sku.trim());
  }
  if (input.price !== undefined && input.price !== null) {
    form.append("price", String(input.price));
  }
  if (input.photo) {
    form.append("photo", input.photo);
  }
  form.append(
    "documentRequirements",
    JSON.stringify(buildDefaultDocumentRequirements()),
  );
  form.append(
    "fieldRequirements",
    JSON.stringify(buildDefaultFieldRequirements()),
  );
  return form;
}
