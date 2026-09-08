"use client";

import { useCallback, useEffect, useState } from "react";
import {
  approveProduct,
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  rejectProduct,
  submitProduct,
  updateProduct,
  type ListProductsParams,
} from "@/lib/api/products-api";
import type { ApiProductDetail } from "@/lib/products/map-product";
import {
  apiDetailToProductRequest,
  apiProductToProductRequest,
  mapUiStatusToApi,
} from "@/lib/products/map-product";
import type {
  ProductRequest,
  ProductRequestFormValues,
} from "./types";

export function useProductRequests(initialParams?: ListProductsParams) {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<ListProductsParams>(
    initialParams ?? { limit: 50, sort: "createdAt:desc" },
  );

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listProducts(params);
      setRequests(result.items.map(apiProductToProductRequest));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setReady(true);
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    void fetchRequests();
  }, [fetchRequests]);

  const addRequest = useCallback(
    async (
      values: ProductRequestFormValues,
      _supplierName: string,
      _distributorName: string,
    ) => {
      await createProduct({
        name: values.productName.trim(),
        supplierId: values.supplierId,
        sku: values.sku?.trim(),
        price: values.price,
        photo: values.photoFile,
      });
      await fetchRequests();
    },
    [fetchRequests],
  );

  const updateRequest = useCallback(
    async (
      id: string,
      values: ProductRequestFormValues,
      _supplierName: string,
    ) => {
      await updateProduct(id, {
        name: values.productName.trim(),
        sku: values.sku?.trim(),
        price: values.price,
        photo: values.photoFile,
      });
      await fetchRequests();
    },
    [fetchRequests],
  );

  const deleteRequest = useCallback(
    async (id: string) => {
      await deleteProduct(id);
      await fetchRequests();
    },
    [fetchRequests],
  );

  const approveRequest = useCallback(
    async (id: string) => {
      await approveProduct(id);
      await fetchRequests();
    },
    [fetchRequests],
  );

  const rejectRequest = useCallback(
    async (id: string, rejectionReason: string) => {
      await rejectProduct(id, rejectionReason);
      await fetchRequests();
    },
    [fetchRequests],
  );

  const getProductDetail = useCallback(
    async (id: string): Promise<ApiProductDetail> => getProduct(id),
    [],
  );

  const submitCompliance = useCallback(
    async (
      id: string,
      fieldValues: Array<{ requirementId: string; value: string }>,
      files: Array<{ requirementId: string; file: File }>,
    ) => {
      await submitProduct(id, { fieldValues, files });
      await fetchRequests();
    },
    [fetchRequests],
  );

  function setStatusFilter(status: ProductRequest["status"] | "all") {
    const apiStatus = status === "all" ? undefined : mapUiStatusToApi(status);
    setParams((prev) => ({ ...prev, status: apiStatus, page: 1 }));
  }

  function setSearch(search: string) {
    setParams((prev) => ({ ...prev, search: search || undefined, page: 1 }));
  }

  return {
    ready,
    loading,
    error,
    refetch: fetchRequests,
    requests,
    addRequest,
    updateRequest,
    deleteRequest,
    approveRequest,
    rejectRequest,
    getProductDetail,
    submitCompliance,
    setStatusFilter,
    setSearch,
  };
}

export function mapDetailToRequest(product: ApiProductDetail): ProductRequest {
  return apiDetailToProductRequest(product);
}
