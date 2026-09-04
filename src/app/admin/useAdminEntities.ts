"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "scp-admin-entities";

type EntityType = "distributor" | "supplier";

type AdminEntity = {
  id: string;
  name: string;
  email: string;
  password: string;
  type: EntityType;
};

type EntityFormValues = {
  name: string;
  email: string;
  password: string;
};


function readEntities(): AdminEntity[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AdminEntity[];
    return Array.isArray(parsed) ? parsed : [];
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

  return {
    ready,
    entities,
    distributors,
    suppliers,
    addEntity,
    updateEntity,
    deleteEntity,
  };
}
