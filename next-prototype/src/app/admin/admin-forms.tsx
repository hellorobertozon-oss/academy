"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/lib/admin/action-state";
import type { AdminRole } from "@/lib/admin/validation";
import { createStoreAction, createUserInviteAction } from "@/app/admin/actions";

type StoreOption = {
  id: number;
  name: string;
  city: string;
};

function ActionMessage({ state }: { state: AdminActionState }) {
  if (state.status === "idle" || !state.message) return null;

  return (
    <p
      className={state.status === "error" ? "text-body-2-medium text-text-error-primary" : "text-body-2-medium text-text-secondary"}
      role={state.status === "error" ? "alert" : "status"}
      aria-live="polite"
    >
      {state.message}
    </p>
  );
}

export function StoreForm() {
  const [state, action, isPending] = useActionState(
    createStoreAction,
    INITIAL_ADMIN_ACTION_STATE,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input name="name" label="Nazwa sklepu" autoComplete="organization" isRequired />
      <Input name="street_address" label="Ulica i numer" autoComplete="street-address" isRequired />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="city" label="Miasto" autoComplete="address-level2" isRequired />
        <Input name="postal_code" label="Kod pocztowy" autoComplete="postal-code" isRequired />
      </div>
      <Input name="country_code" label="Kod państwa" defaultValue="PL" maxLength={2} isRequired />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="latitude" type="number" label="Szerokość geograficzna" />
        <Input name="longitude" type="number" label="Długość geograficzna" />
      </div>
      <p className="text-body-2-regular text-text-secondary">
        Współrzędne są opcjonalne. Podaj obie, aby umieścić sklep na mapie.
      </p>
      <ActionMessage state={state} />
      <Button type="submit" disabled={isPending} className="self-start">
        {isPending ? "Zapisywanie…" : "Dodaj sklep"}
      </Button>
    </form>
  );
}

export function InviteForm({ stores }: { stores: StoreOption[] }) {
  const [state, action, isPending] = useActionState(
    createUserInviteAction,
    INITIAL_ADMIN_ACTION_STATE,
  );
  const [role, setRole] = useState<AdminRole>("employee");
  const [storeId, setStoreId] = useState<string>(
    stores.length ? String(stores[0].id) : "",
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input name="email" type="email" label="Adres e-mail" autoComplete="email" isRequired />
      <div className="flex flex-col gap-1">
        <label className="text-body-medium text-text-primary" id="invite-role-label">
          Rola
        </label>
        <Select
          name="role"
          aria-labelledby="invite-role-label"
          selectedKey={role}
          onSelectionChange={(key) => setRole(String(key) as AdminRole)}
          triggerClassName="min-h-12"
        >
          <SelectItem id="employee">Pracownik</SelectItem>
          <SelectItem id="admin">Administrator</SelectItem>
        </Select>
      </div>
      {role === "employee" ? (
        <div className="flex flex-col gap-1">
          <label className="text-body-medium text-text-primary" id="invite-store-label">
            Sklep
          </label>
          <Select
            name="store_id"
            aria-labelledby="invite-store-label"
            selectedKey={storeId || null}
            onSelectionChange={(key) => setStoreId(String(key))}
            isRequired
            isDisabled={stores.length === 0}
            triggerClassName="min-h-12"
          >
            {stores.map((store) => (
              <SelectItem key={store.id} id={String(store.id)}>
                {store.name} · {store.city}
              </SelectItem>
            ))}
          </Select>
          {stores.length === 0 ? (
            <p className="text-body-2-regular text-text-secondary">
              Najpierw dodaj sklep, aby zaprosić pracownika.
            </p>
          ) : null}
        </div>
      ) : null}
      <p className="text-body-2-regular text-text-secondary">
        Osoba otrzyma wiadomość z linkiem do potwierdzenia adresu i ustawienia hasła.
      </p>
      <ActionMessage state={state} />
      <Button
        type="submit"
        disabled={isPending || (role === "employee" && stores.length === 0)}
        className="self-start"
      >
        {isPending ? "Wysyłanie…" : "Wyślij zaproszenie"}
      </Button>
    </form>
  );
}
