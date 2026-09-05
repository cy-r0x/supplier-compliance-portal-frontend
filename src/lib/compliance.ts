export type ComplianceFieldMeta = {
  required: boolean;
  isPublic: boolean;
};

export type ComplianceDocumentField = ComplianceFieldMeta & {
  fileName: string;
};

export type ComplianceTextField = ComplianceFieldMeta & {
  value: string;
};

export type ComplianceDocuments = {
  testReport: ComplianceDocumentField;
  declarationOfConformity: ComplianceDocumentField;
  manualOrInstructions: ComplianceDocumentField;
  certificate: ComplianceDocumentField;
  productImage: ComplianceDocumentField;
  safetyImage: ComplianceDocumentField;
  regulatoryDocument: ComplianceDocumentField;
  other: ComplianceDocumentField;
};

export type ComplianceTextFields = {
  safetyNoticeText: ComplianceTextField;
  warningText: ComplianceTextField;
  ageGrading: ComplianceTextField;
  materialInformation: ComplianceTextField;
  usageRestrictions: ComplianceTextField;
  safetyInstructions: ComplianceTextField;
  additionalNotes: ComplianceTextField;
};

export type ComplianceSubmission = ComplianceDocuments & ComplianceTextFields;

export const DOCUMENT_FIELD_CONFIG: {
  key: keyof ComplianceDocuments;
  label: string;
  accept: string;
}[] = [
  { key: "testReport", label: "Test Report", accept: ".pdf,application/pdf" },
  {
    key: "declarationOfConformity",
    label: "Declaration of Conformity",
    accept: ".pdf,application/pdf",
  },
  {
    key: "manualOrInstructions",
    label: "Manual or Instructions",
    accept: ".pdf,application/pdf",
  },
  { key: "certificate", label: "Certificate", accept: ".pdf,application/pdf" },
  {
    key: "productImage",
    label: "Product Image",
    accept: "image/*",
  },
  { key: "safetyImage", label: "Safety Image", accept: "image/*" },
  {
    key: "regulatoryDocument",
    label: "Regulatory Document",
    accept: ".pdf,application/pdf",
  },
  { key: "other", label: "Other", accept: ".pdf,application/pdf" },
];

export const TEXT_FIELD_CONFIG: {
  key: keyof ComplianceTextFields;
  label: string;
}[] = [
  { key: "safetyNoticeText", label: "Safety notice text" },
  { key: "warningText", label: "Warning text" },
  { key: "ageGrading", label: "Age grading" },
  { key: "materialInformation", label: "Material information" },
  { key: "usageRestrictions", label: "Usage restrictions" },
  { key: "safetyInstructions", label: "Safety instructions" },
  { key: "additionalNotes", label: "Additional notes" },
];

function emptyDocumentField(): ComplianceDocumentField {
  return { fileName: "", required: false, isPublic: false };
}

function emptyTextField(): ComplianceTextField {
  return { value: "", required: true, isPublic: false };
}

export function emptyComplianceSubmission(): ComplianceSubmission {
  return {
    testReport: emptyDocumentField(),
    declarationOfConformity: emptyDocumentField(),
    manualOrInstructions: emptyDocumentField(),
    certificate: emptyDocumentField(),
    productImage: emptyDocumentField(),
    safetyImage: emptyDocumentField(),
    regulatoryDocument: emptyDocumentField(),
    other: emptyDocumentField(),
    safetyNoticeText: emptyTextField(),
    warningText: emptyTextField(),
    ageGrading: emptyTextField(),
    materialInformation: emptyTextField(),
    usageRestrictions: emptyTextField(),
    safetyInstructions: emptyTextField(),
    additionalNotes: emptyTextField(),
  };
}

function normalizeDocumentField(value: unknown): ComplianceDocumentField {
  if (typeof value === "string") {
    return { fileName: value, required: false, isPublic: false };
  }
  if (value && typeof value === "object") {
    const raw = value as Partial<ComplianceDocumentField> & {
      fileName?: string;
      public?: boolean;
    };
    return {
      fileName: typeof raw.fileName === "string" ? raw.fileName : "",
      required: raw.required === true,
      isPublic: raw.isPublic === true || raw.public === true,
    };
  }
  return emptyDocumentField();
}

function normalizeTextField(value: unknown): ComplianceTextField {
  if (typeof value === "string") {
    return { value, required: true, isPublic: false };
  }
  if (value && typeof value === "object") {
    const raw = value as Partial<ComplianceTextField> & { public?: boolean };
    return {
      value: typeof raw.value === "string" ? raw.value : "",
      required: raw.required !== false,
      isPublic: raw.isPublic === true || raw.public === true,
    };
  }
  return emptyTextField();
}

export function normalizeComplianceSubmission(
  raw: Partial<ComplianceSubmission> | null | undefined,
): ComplianceSubmission {
  const empty = emptyComplianceSubmission();
  if (!raw) return empty;

  const documents = {} as ComplianceDocuments;
  for (const { key } of DOCUMENT_FIELD_CONFIG) {
    documents[key] = normalizeDocumentField(raw[key]);
  }

  const text = {} as ComplianceTextFields;
  for (const { key } of TEXT_FIELD_CONFIG) {
    text[key] = normalizeTextField(raw[key]);
  }

  return { ...documents, ...text };
}
