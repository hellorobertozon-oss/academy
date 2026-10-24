export type AdminActionState = {
  status: "idle" | "success" | "error";
  message: string;
  entityId?: number;
};

export const INITIAL_ADMIN_ACTION_STATE: AdminActionState = {
  status: "idle",
  message: "",
};
