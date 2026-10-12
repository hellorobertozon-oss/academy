export type ProfileActionMessage =
  | "profileSaveSuccess"
  | "profileAuthError"
  | "profileNameRequired"
  | "profileNameTooLong"
  | "profileNameInvalid"
  | "profileSaveError";

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message: ProfileActionMessage | null;
};

export const INITIAL_PROFILE_ACTION_STATE: ProfileActionState = {
  status: "idle",
  message: null,
};
