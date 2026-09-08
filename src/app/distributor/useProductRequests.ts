"use client";

import { useEffect, useState } from "react";
import type { ComplianceDocuments, ComplianceSubmission } from "../../lib/compliance";
import { saveComplianceFiles } from "../../lib/compliance-files";
import {
  readComplianceSubmissions,
  readProductRequests,
  writeComplianceSubmissions,
  writeProductRequests,
} from "../../lib/product-request-store";
import type {
  ProductRequest,
  ProductRequestFormValues,
} from "./types";

export function useProductRequests() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRequests(readProductRequests());
    setReady(true);
  }, []);

  function persist(next: ProductRequest[]) {
    setRequests(next);
    writeProductRequests(next);
  }

  function addRequest(
    values: ProductRequestFormValues,
    supplierName: string,
    distributorName: string,
  ) {
    const request: ProductRequest = {
      id: crypto.randomUUID(),
      productName: values.productName.trim(),
      productImage: values.productImage.trim() || "/Images/avatar.jpg",
      progress: values.progress,
      supplierId: values.supplierId,
      supplierName,
      distributorName: distributorName.trim() || "Unknown distributor",
      requestedAt: new Date().toISOString(),
      status: values.status,
      submitted: false,
    };
    persist([request, ...requests]);
  }

  function updateRequest(
    id: string,
    values: ProductRequestFormValues,
    supplierName: string,
  ) {
    persist(
      requests.map((request) =>
        request.id === id
          ? {
              ...request,
              productName: values.productName.trim(),
              productImage: values.productImage.trim() || request.productImage,
              progress: values.progress,
              supplierId: values.supplierId,
              supplierName,
              status: values.status,
            }
          : request,
      ),
    );
  }

  function deleteRequest(id: string) {
    persist(requests.filter((request) => request.id !== id));
  }

  function approveRequest(id: string) {
    persist(
      requests.map((request) =>
        request.id === id
          ? { ...request, status: "approved" as const }
          : request,
      ),
    );
  }

  async function submitCompliance(
    id: string,
    submission: ComplianceSubmission,
    files?: Partial<Record<keyof ComplianceDocuments, File>>,
  ) {
    const request = requests.find((item) => item.id === id);
    if (!request) return;

    const submissions = readComplianceSubmissions();
    submissions[id] = submission;
    writeComplianceSubmissions(submissions);

    if (files && Object.keys(files).length > 0) {
      await saveComplianceFiles(id, files);
    }

    const now = new Date().toISOString();
    persist(
      requests.map((item) =>
        item.id === id
          ? {
              ...item,
              progress: 100,
              submitted: true,
              submittedAt: now,
            }
          : item,
      ),
    );
  }

  function getComplianceSubmission(id: string): ComplianceSubmission | null {
    return readComplianceSubmissions()[id] ?? null;
  }

  return {
    ready,
    requests,
    addRequest,
    updateRequest,
    deleteRequest,
    approveRequest,
    submitCompliance,
    getComplianceSubmission,
  };
}
