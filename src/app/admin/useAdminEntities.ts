"use client";

import { useEffect, useState } from "react";
import type { AdminEntity, EntityFormValues, EntityType } from "./types";

const STORAGE_KEY = "scp-admin-entities";

function normalizeEntity(raw: Partial<AdminEntity>): AdminEntity | null {
  if (
    !raw ||
    typeof raw.id !== "string" ||
    typeof raw.name !== "string" ||
    typeof raw.email !== "string" ||
    (raw.type !== "distributor" && raw.type !== "supplier")
  ) {
    return null;
  }

  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    password: typeof raw.password === "string" ? raw.password : "",
    type: raw.type,
    createdAt:
      typeof raw.createdAt === "string" && raw.createdAt
        ? raw.createdAt
        : new Date(0).toISOString(),
  };
}

function readEntities(): AdminEntity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<AdminEntity>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeEntity)
      .filter((entity): entity is AdminEntity => entity !== null);
  } catch {
    return [];
  }
}

function writeEntities(entities: AdminEntity[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entities));
}

export function useAdminEntities() {
  const [entities, setEntities] = useState<AdminEntity[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntities(readEntities());
    setReady(true);
  }, []);

  function persist(next: AdminEntity[]) {
    setEntities(next);
    writeEntities(next);
  }

  function addEntity(type: EntityType, values: EntityFormValues) {
    const entity: AdminEntity = {
      id: crypto.randomUUID(),
      type,
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
      createdAt: new Date().toISOString(),
    };
    persist([entity, ...entities]);
  }

  function updateEntity(id: string, values: EntityFormValues, type: EntityType) {
    persist(
      entities.map((entity) =>
        entity.id === id
          ? {
              ...entity,
              type,
              name: values.name.trim(),
              email: values.email.trim(),
              password: values.password,
            }
          : entity,
      ),
    );
  }

  function deleteEntity(id: string) {
    persist(entities.filter((entity) => entity.id !== id));
  }

  const distributors = entities.filter((entity) => entity.type === "distributor");
  const suppliers = entities.filter((entity) => entity.type === "supplier");
  const recentUsers = [...entities].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return {
    ready,
    entities,
    distributors,
    suppliers,
    recentUsers,
    addEntity,
    updateEntity,
    deleteEntity,
  };
}
