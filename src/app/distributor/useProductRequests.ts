"use client";

import { useEffect, useState } from "react";
import type { ComplianceSubmission } from "../../lib/compliance";
import { addComplianceNotification } from "../../lib/useNotifications";
import type {
  ProductRequest,
  ProductRequestFormValues,
  ProductRequestStatus,
} from "./types";

const STORAGE_KEY = "scp-product-requests";
const COMPLIANCE_STORAGE_KEY = "scp-compliance-submissions";

const DUMMY_REQUESTS: ProductRequest[] = [
  {
    id: "demo-req-1",
    productName: "Organic Olive Oil 1L",
    productImage:
      "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=160&h=160&fit=crop",
    progress: 72,
    supplierId: "demo-supplier-1",
    supplierName: "Green Valley Foods",
    distributorName: "Prantor",
    requestedAt: "2026-08-28T10:15:00.000Z",
    status: "pending",
    submitted: false,
  },
  {
    id: "demo-req-2",
    productName: "Basmati Rice 5kg",
    productImage:
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=160&h=160&fit=crop",
    progress: 100,
    supplierId: "demo-supplier-2",
    supplierName: "Sunrise Grains Co.",
    distributorName: "Harbor Supply Group",
    requestedAt: "2026-08-12T14:40:00.000Z",
    status: "approved",
    submitted: true,
    submittedAt: "2026-08-20T11:00:00.000Z",
  },
  {
    id: "demo-req-3",
    productName: "Cold Brew Coffee Concentrate",
    productImage:
      "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=160&h=160&fit=crop",
    progress: 35,
    supplierId: "demo-supplier-3",
    supplierName: "Bean & Barrel",
    distributorName: "Prantor",
    requestedAt: "2026-09-01T09:05:00.000Z",
    status: "pending",
    submitted: false,
  },
  {
    id: "demo-req-4",
    productName: "Honey Almond Granola",
    productImage:
      "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=160&h=160&fit=crop",
    progress: 18,
    supplierId: "demo-supplier-1",
    supplierName: "Green Valley Foods",
    distributorName: "Summit Retail Partners",
    requestedAt: "2026-09-03T16:20:00.000Z",
    status: "rejected",
    submitted: false,
  },
];

function normalizeRequest(
  raw: Partial<ProductRequest>,
): ProductRequest | null {
  if (
    !raw ||
    typeof raw.id !== "string" ||
    typeof raw.productName !== "string" ||
    typeof raw.supplierId !== "string" ||
    typeof raw.supplierName !== "string"
  ) {
    return null;
  }

  const status: ProductRequestStatus =
    raw.status === "approved" || raw.status === "rejected"
      ? raw.status
      : "pending";

  const progress =
    typeof raw.progress === "number" && Number.isFinite(raw.progress)
      ? Math.min(100, Math.max(0, Math.round(raw.progress)))
      : 0;

  return {
    id: raw.id,
    productName: raw.productName,
    productImage:
      typeof raw.productImage === "string" && raw.productImage
        ? raw.productImage
        : "/Images/avatar.jpg",
    progress,
    supplierId: raw.supplierId,
    supplierName: raw.supplierName,
    distributorName:
      typeof raw.distributorName === "string" && raw.distributorName.trim()
        ? raw.distributorName.trim()
        : "Unknown distributor",
    requestedAt:
      typeof raw.requestedAt === "string" && raw.requestedAt
        ? raw.requestedAt
        : new Date(0).toISOString(),
    status,
    submitted: raw.submitted === true,
    submittedAt:
      typeof raw.submittedAt === "string" ? raw.submittedAt : undefined,
  };
}

function readRequests(): ProductRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      writeRequests(DUMMY_REQUESTS);
      return DUMMY_REQUESTS;
    }
    const parsed = JSON.parse(raw) as Partial<ProductRequest>[];
    if (!Array.isArray(parsed)) return [];
    const requests = parsed
      .map(normalizeRequest)
      .filter((request): request is ProductRequest => request !== null);
    if (requests.length === 0) {
      writeRequests(DUMMY_REQUESTS);
      return DUMMY_REQUESTS;
    }
    return requests;
  } catch {
    return DUMMY_REQUESTS;
  }
}

function writeRequests(requests: ProductRequest[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
}

function readComplianceSubmissions(): Record<string, ComplianceSubmission> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COMPLIANCE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ComplianceSubmission>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeComplianceSubmissions(data: Record<string, ComplianceSubmission>) {
  window.localStorage.setItem(COMPLIANCE_STORAGE_KEY, JSON.stringify(data));
}

export function useProductRequests() {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRequests(readRequests());
    setReady(true);
  }, []);

  function persist(next: ProductRequest[]) {
    setRequests(next);
    writeRequests(next);
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

  function submitCompliance(
    id: string,
    submission: ComplianceSubmission,
    supplierName: string,
  ) {
    const request = requests.find((item) => item.id === id);
    if (!request) return;

    const submissions = readComplianceSubmissions();
    submissions[id] = submission;
    writeComplianceSubmissions(submissions);

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

    addComplianceNotification({
      productRequestId: id,
      productName: request.productName,
      supplierName,
      distributorName: request.distributorName,
    });
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
