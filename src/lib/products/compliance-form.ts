import {
  DOCUMENT_FIELD_CONFIG,
  TEXT_FIELD_CONFIG,
  type ComplianceDocuments,
  type ComplianceTextFields,
} from "@/lib/compliance";
import { isEmptyHtml } from "@/lib/html";
import type {
  ApiDocumentRequirement,
  ApiFieldRequirement,
  ApiProductDetail,
} from "@/lib/products/map-product";

const DOCUMENT_KEY_TO_TYPE: Record<keyof ComplianceDocuments, string> = {
  testReport: "TEST_REPORT",
  declarationOfConformity: "DECLARATION_OF_CONFORMITY",
  manualOrInstructions: "MANUAL_OR_INSTRUCTIONS",
  certificate: "CERTIFICATE",
  productImage: "PRODUCT_IMAGE",
  safetyImage: "SAFETY_IMAGE",
  regulatoryDocument: "REGULATORY_DOCUMENT",
  other: "OTHER",
};

const TEXT_KEY_TO_TYPE: Record<keyof ComplianceTextFields, string> = {
  safetyNoticeText: "SAFETY_NOTICE_TEXT",
  warningText: "WARNING_TEXT",
  ageGrading: "AGE_GRADING",
  materialInformation: "MATERIAL_INFORMATION",
  usageRestrictions: "USAGE_RESTRICTIONS",
  safetyInstructions: "SAFETY_INSTRUCTIONS",
  additionalNotes: "ADDITIONAL_NOTES",
};

export type DocumentFormRow = {
  key: keyof ComplianceDocuments;
  label: string;
  accept: string;
  type: string;
  customKey?: string;
  required: boolean;
  isPublic: boolean;
  prefillFile: File | null;
  existingPrefill?: { fileName: string; fileUrl: string };
};

export type TextFormRow = {
  key: keyof ComplianceTextFields;
  label: string;
  fieldType: string;
  customKey?: string;
  required: boolean;
  isPublic: boolean;
  value: string;
};

const REQUIRED_DOCS = new Set<keyof ComplianceDocuments>([
  "testReport",
  "declarationOfConformity",
]);
const REQUIRED_TEXT = new Set<keyof ComplianceTextFields>([
  "safetyNoticeText",
  "ageGrading",
]);
const PUBLIC_DOCS = new Set<keyof ComplianceDocuments>([
  "productImage",
  "safetyImage",
]);
const PUBLIC_TEXT = new Set<keyof ComplianceTextFields>([
  "safetyNoticeText",
  "warningText",
  "ageGrading",
]);

export function createEmptyDocumentRows(): DocumentFormRow[] {
  return DOCUMENT_FIELD_CONFIG.map(({ key, label, accept }) => {
    const isOther = key === "other";
    return {
      key,
      label,
      accept,
      type: DOCUMENT_KEY_TO_TYPE[key],
      ...(isOther ? { customKey: "other" } : {}),
      required: REQUIRED_DOCS.has(key),
      isPublic: PUBLIC_DOCS.has(key),
      prefillFile: null,
    };
  });
}

export function createEmptyTextRows(): TextFormRow[] {
  return TEXT_FIELD_CONFIG.map(({ key, label }) => {
    const isOther = key === "additionalNotes";
    return {
      key,
      label,
      fieldType: TEXT_KEY_TO_TYPE[key],
      ...(isOther ? { customKey: "notes" } : {}),
      required: REQUIRED_TEXT.has(key),
      isPublic: PUBLIC_TEXT.has(key),
      value: "",
    };
  });
}

function findDocumentRequirement(
  requirements: ApiDocumentRequirement[],
  key: keyof ComplianceDocuments,
  type: string,
) {
  if (key === "other") {
    return requirements.find((row) => row.type === "OTHER");
  }
  return requirements.find((row) => row.type === type);
}

function findFieldRequirement(
  requirements: ApiFieldRequirement[],
  key: keyof ComplianceTextFields,
  fieldType: string,
) {
  if (key === "additionalNotes") {
    return requirements.find((row) => row.fieldType === "OTHER");
  }
  return requirements.find((row) => row.fieldType === fieldType);
}

export function rowsFromApiProduct(product: ApiProductDetail): {
  documents: DocumentFormRow[];
  textFields: TextFormRow[];
} {
  const documents = DOCUMENT_FIELD_CONFIG.map(({ key, label, accept }) => {
    const isOther = key === "other";
    const type = DOCUMENT_KEY_TO_TYPE[key];
    const req = findDocumentRequirement(product.documentRequirements, key, type);
    const defaults = createEmptyDocumentRows().find((row) => row.key === key)!;
    return {
      ...defaults,
      key,
      label,
      accept,
      type,
      required: req ? req.level === "REQUIRED" : defaults.required,
      isPublic: req ? req.visibility === "PUBLIC" : defaults.isPublic,
      prefillFile: null,
      ...(req?.document?.fileUrl && req.document.fileName
        ? {
            existingPrefill: {
              fileName: req.document.fileName,
              fileUrl: req.document.fileUrl,
            },
          }
        : {}),
      ...(isOther ? { customKey: "other" } : {}),
    };
  });

  const textFields = TEXT_FIELD_CONFIG.map(({ key, label }) => {
    const isOther = key === "additionalNotes";
    const fieldType = TEXT_KEY_TO_TYPE[key];
    const req = findFieldRequirement(product.fieldRequirements, key, fieldType);
    const defaults = createEmptyTextRows().find((row) => row.key === key)!;
    return {
      ...defaults,
      key,
      label,
      fieldType,
      required: req ? req.level === "REQUIRED" : defaults.required,
      isPublic: req ? req.visibility === "PUBLIC" : defaults.isPublic,
      value: req?.fieldValue?.value ?? "",
      ...(isOther ? { customKey: "notes" } : {}),
    };
  });

  return { documents, textFields };
}

export function parseOptionalPrice(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || num < 0) {
    return Number.NaN;
  }
  return num;
}

function documentPrefillFieldName(type: string, customKey?: string): string {
  if (type === "OTHER") {
    return `docPrefill__OTHER__${customKey ?? ""}`;
  }
  return `docPrefill__${type}`;
}

export type CreateProductComplianceInput = {
  name: string;
  supplierId: string;
  sku?: string;
  price?: number;
  photo?: File | null;
  documents: DocumentFormRow[];
  textFields: TextFormRow[];
};

export function buildCreateProductFormData(
  input: CreateProductComplianceInput,
): FormData {
  const form = new FormData();
  form.append("name", input.name.trim());
  form.append("supplierId", input.supplierId);
  if (input.sku?.trim()) form.append("sku", input.sku.trim());
  if (input.price !== undefined && input.price !== null) {
    form.append("price", String(input.price));
  }
  if (input.photo) form.append("photo", input.photo);

  const documentRequirements = input.documents.map((row) => ({
    type: row.type,
    ...(row.type === "OTHER"
      ? { customKey: row.customKey ?? "other", label: row.label }
      : {}),
    level: row.required ? "REQUIRED" : "OPTIONAL",
    visibility: row.isPublic ? "PUBLIC" : "PRIVATE",
  }));

  const fieldRequirements = input.textFields.map((row) => {
    const base = {
      fieldType: row.fieldType,
      ...(row.fieldType === "OTHER" || row.customKey
        ? { customKey: row.customKey ?? "notes", label: row.label }
        : {}),
      level: row.required ? "REQUIRED" : "OPTIONAL",
      visibility: row.isPublic ? "PUBLIC" : "PRIVATE",
    };
    if (!isEmptyHtml(row.value)) {
      return { ...base, prefill: { value: row.value } };
    }
    return base;
  });

  form.append("documentRequirements", JSON.stringify(documentRequirements));
  form.append("fieldRequirements", JSON.stringify(fieldRequirements));

  for (const row of input.documents) {
    if (!row.prefillFile) continue;
    form.append(
      documentPrefillFieldName(row.type, row.customKey),
      row.prefillFile,
    );
  }

  return form;
}

export type UpdateProductComplianceInput = {
  name: string;
  sku?: string;
  price?: number;
  photo?: File | null;
  documents: DocumentFormRow[];
  textFields: TextFormRow[];
};

export function buildUpdateProductFormData(
  input: UpdateProductComplianceInput,
): FormData {
  const form = new FormData();
  form.append("name", input.name.trim());
  if (input.sku !== undefined) form.append("sku", input.sku.trim());
  if (input.price !== undefined && input.price !== null) {
    form.append("price", String(input.price));
  }
  if (input.photo) form.append("photo", input.photo);

  const documentRequirements = input.documents.map((row) => ({
    type: row.type,
    ...(row.type === "OTHER"
      ? { customKey: row.customKey ?? "other", label: row.label }
      : {}),
    level: row.required ? "REQUIRED" : "OPTIONAL",
    visibility: row.isPublic ? "PUBLIC" : "PRIVATE",
  }));

  const fieldRequirements = input.textFields.map((row) => {
    const base = {
      fieldType: row.fieldType,
      ...(row.fieldType === "OTHER" || row.customKey
        ? { customKey: row.customKey ?? "notes", label: row.label }
        : {}),
      level: row.required ? "REQUIRED" : "OPTIONAL",
      visibility: row.isPublic ? "PUBLIC" : "PRIVATE",
    };
    if (!isEmptyHtml(row.value)) {
      return { ...base, prefill: { value: row.value } };
    }
    return base;
  });

  form.append("documentRequirements", JSON.stringify(documentRequirements));
  form.append("fieldRequirements", JSON.stringify(fieldRequirements));

  for (const row of input.documents) {
    if (!row.prefillFile) continue;
    form.append(
      documentPrefillFieldName(row.type, row.customKey),
      row.prefillFile,
    );
  }

  return form;
}
