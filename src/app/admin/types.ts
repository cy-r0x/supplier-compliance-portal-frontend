export type EntityType = "distributor" | "supplier";

export type AdminEntity = {
  id: string;
  name: string;
  email: string;
  password: string;
  type: EntityType;
};

export type EntityFormValues = {
  name: string;
  email: string;
  password: string;
};
