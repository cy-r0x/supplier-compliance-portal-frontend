"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createUser, listUsers, type ApiUserRole } from "@/lib/api/users-api";
import {
  apiUserToAdminEntity,
  entityTypeToApiRole,
} from "@/lib/users/map-user";
import type { AdminEntity, EntityFormValues, EntityType } from "./types";

type UseAdminEntitiesOptions = {
  roleFilter?: ApiUserRole;
};

export function useAdminEntities(options?: UseAdminEntitiesOptions) {
  const [entities, setEntities] = useState<AdminEntity[]>([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listUsers({
        role: options?.roleFilter,
        limit: 100,
        sort: "createdAt:desc",
      });
      setEntities(result.items.map(apiUserToAdminEntity));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setReady(true);
      setLoading(false);
    }
  }, [options?.roleFilter]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const addEntity = useCallback(
    async (type: EntityType, values: EntityFormValues) => {
      await createUser({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: entityTypeToApiRole(type),
      });
      await fetchUsers();
    },
    [fetchUsers],
  );

  const updateEntity = useCallback(
    async (_id: string, _values: EntityFormValues, _type: EntityType) => {
      throw new Error("User update is not available yet");
    },
    [],
  );

  const deleteEntity = useCallback(async (_id: string) => {
    throw new Error("User delete is not available yet");
  }, []);

  const distributors = useMemo(
    () => entities.filter((entity) => entity.type === "distributor"),
    [entities],
  );
  const suppliers = useMemo(
    () => entities.filter((entity) => entity.type === "supplier"),
    [entities],
  );
  const recentUsers = useMemo(
    () =>
      [...entities].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [entities],
  );

  return {
    ready,
    loading,
    error,
    refetch: fetchUsers,
    entities,
    distributors,
    suppliers,
    recentUsers,
    addEntity,
    updateEntity,
    deleteEntity,
  };
}
