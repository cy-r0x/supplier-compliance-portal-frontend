const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  TEST_REPORT: "Test report",
  DECLARATION_OF_CONFORMITY: "Declaration of conformity",
  MANUAL_OR_INSTRUCTIONS: "Manual & instructions",
  CERTIFICATE: "Certificate",
  PRODUCT_IMAGE: "Product image",
  SAFETY_IMAGE: "Safety label",
  REGULATORY_DOCUMENT: "Regulatory document",
  OTHER: "Additional document",
};

const FIELD_TYPE_LABELS: Record<string, string> = {
  SAFETY_NOTICE_TEXT: "Safety notice",
  WARNING_TEXT: "Warnings",
  AGE_GRADING: "Recommended age",
  MATERIAL_INFORMATION: "Materials",
  USAGE_RESTRICTIONS: "Usage restrictions",
  SAFETY_INSTRUCTIONS: "Safety instructions",
  ADDITIONAL_NOTES: "Additional information",
  OTHER: "Product information",
};

const DOCUMENT_DISPLAY_ORDER = [
  "CERTIFICATE",
  "TEST_REPORT",
  "DECLARATION_OF_CONFORMITY",
  "MANUAL_OR_INSTRUCTIONS",
  "SAFETY_IMAGE",
  "REGULATORY_DOCUMENT",
  "OTHER",
  "PRODUCT_IMAGE",
];

const FIELD_DISPLAY_ORDER = [
  "SAFETY_NOTICE_TEXT",
  "WARNING_TEXT",
  "AGE_GRADING",
  "SAFETY_INSTRUCTIONS",
  "USAGE_RESTRICTIONS",
  "MATERIAL_INFORMATION",
  "ADDITIONAL_NOTES",
  "OTHER",
];

function formatEnumLabel(value: string): string {
  return value
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}

export function publicDocumentLabel(
  type: string,
  customLabel: string | null | undefined,
): string {
  const trimmed = customLabel?.trim();
  if (trimmed) return trimmed;
  return DOCUMENT_TYPE_LABELS[type] ?? formatEnumLabel(type);
}

export function publicFieldLabel(
  fieldType: string,
  customLabel: string | null | undefined,
): string {
  const trimmed = customLabel?.trim();
  if (trimmed) return trimmed;
  return FIELD_TYPE_LABELS[fieldType] ?? formatEnumLabel(fieldType);
}

export function documentDisplayRank(type: string): number {
  const index = DOCUMENT_DISPLAY_ORDER.indexOf(type);
  return index === -1 ? DOCUMENT_DISPLAY_ORDER.length : index;
}

export function fieldDisplayRank(fieldType: string): number {
  const index = FIELD_DISPLAY_ORDER.indexOf(fieldType);
  return index === -1 ? FIELD_DISPLAY_ORDER.length : index;
}

export function isProductImageDocument(type: string): boolean {
  return type === "PRODUCT_IMAGE";
}
