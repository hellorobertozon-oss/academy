"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { Dialog, Modal, ModalOverlay } from "react-aria-components";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { LinkButton } from "@/components/base/buttons/link-button";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem } from "@/components/base/select/select";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/lib/admin/action-state";
import type { AdminRole, InviteLanguage } from "@/lib/admin/validation";
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

function StoreFormFields({ onSuccess }: { onSuccess: () => void }) {
  const [state, action, isPending] = useActionState(
    createStoreAction,
    INITIAL_ADMIN_ACTION_STATE,
  );
  useEffect(() => {
    if (state.status === "success") onSuccess();
  }, [onSuccess, state.status]);

  return (
    <form action={action} className="grid min-w-0 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input name="name" label="Nazwa sklepu" autoComplete="organization" isRequired />
      </div>
      <div className="sm:col-span-2">
        <Input name="street_address" label="Ulica i numer" autoComplete="street-address" isRequired />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
        <Input name="city" label="Miasto" autoComplete="address-level2" isRequired />
        <Input name="postal_code" label="Kod pocztowy" autoComplete="postal-code" isRequired />
      </div>
      <div className="sm:col-span-2">
        <Input name="country_code" label="Kod państwa" defaultValue="PL" maxLength={2} isRequired />
      </div>
      <p className="rounded-xl border border-separator-border bg-background-secondary-default p-3 text-body-2-regular text-text-secondary sm:col-span-2">
        Po zapisaniu adres zostanie wyszukany i sklep pojawi się na mapie automatycznie.
      </p>
      <div className="sm:col-span-2"><ActionMessage state={state} /></div>
      <Button type="submit" disabled={isPending} className="self-start sm:col-span-2">
        {isPending ? "Wyszukiwanie adresu i zapisywanie…" : "Dodaj lokalizację"}
      </Button>
    </form>
  );
}

export function StoreForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setFormKey((current) => current + 1);
  }, []);
  const handleOpenChange = useCallback((open: boolean) => {
    if (open) setIsOpen(true);
    else closeModal();
  }, [closeModal]);

  return (
    <>
      <Button type="button" onClick={() => setIsOpen(true)}>Dodaj lokalizację</Button>
      <ModalOverlay
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        isDismissable
        className="admin-theme fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      >
        <Modal className="w-full max-w-2xl outline-none">
          <Dialog aria-label="Dodaj lokalizację" className="outline-none">
            <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default shadow-2xl">
              <header className="flex items-start justify-between gap-4 border-b border-separator-border p-5 sm:p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">Nowy sklep</p>
                  <h2 className="text-title-2-semibold text-text-primary">Dodaj lokalizację</h2>
                  <p className="max-w-lg text-body-2-regular text-text-secondary">
                    Podaj adres sklepu. Jego położenie na mapie ustalimy automatycznie.
                  </p>
                </div>
                <CloseButton aria-label="Zamknij" size="md" onClick={closeModal} />
              </header>
              <div className="overflow-y-auto p-5 sm:p-6">
                <StoreFormFields key={formKey} onSuccess={closeModal} />
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}

function InviteFormFields({
  stores,
  defaultLanguage,
  onSuccess,
}: {
  stores: StoreOption[];
  defaultLanguage: InviteLanguage;
  onSuccess: () => void;
}) {
  const [state, action, isPending] = useActionState(
    createUserInviteAction,
    INITIAL_ADMIN_ACTION_STATE,
  );
  useEffect(() => {
    if (state.status === "success") onSuccess();
  }, [onSuccess, state.status]);
  const [role, setRole] = useState<AdminRole>("employee");
  const [preferredLanguage, setPreferredLanguage] =
    useState<InviteLanguage>(defaultLanguage);
  const [storeId, setStoreId] = useState<string>(
    stores.length ? String(stores[0].id) : "",
  );

  return (
    <form action={action} className="grid min-w-0 gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Input name="email" type="email" label="Adres e-mail" autoComplete="email" isRequired />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label className="text-body-medium text-text-primary" id="invite-language-label">
          Język zaproszenia
        </label>
        <Select
          name="preferred_language"
          aria-labelledby="invite-language-label"
          selectedKey={preferredLanguage}
          onSelectionChange={(key) => setPreferredLanguage(String(key) as InviteLanguage)}
          triggerClassName="min-h-12"
        >
          <SelectItem id="pl">Polski</SelectItem>
          <SelectItem id="en">English</SelectItem>
          <SelectItem id="de">Deutsch</SelectItem>
          <SelectItem id="cs">Čeština</SelectItem>
          <SelectItem id="fr">Français</SelectItem>
          <SelectItem id="it">Italiano</SelectItem>
        </Select>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
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
          <SelectItem id="employee">Użytkownik</SelectItem>
          <SelectItem id="admin">Administrator</SelectItem>
        </Select>
      </div>
      {role === "employee" ? (
        <div className="flex min-w-0 flex-col gap-1 sm:col-span-2">
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
            <div className="flex flex-col items-start gap-2 rounded-xl bg-background-secondary-default p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body-2-regular text-text-secondary">Dodaj sklep przed zaproszeniem użytkowników.</p>
              <LinkButton href="/admin/stores#new-store" size="small" variant="secondary">Dodaj sklep</LinkButton>
            </div>
          ) : null}
        </div>
      ) : null}
      <p className="text-body-2-regular text-text-secondary sm:col-span-2">
        Wiadomość i język konta będą zgodne z wybraną wersją językową.
      </p>
      <div className="sm:col-span-2"><ActionMessage state={state} /></div>
      <Button
        type="submit"
        disabled={isPending || (role === "employee" && stores.length === 0)}
        className="self-start sm:col-span-2"
      >
        {isPending ? "Wysyłanie…" : "Wyślij zaproszenie"}
      </Button>
    </form>
  );
}

export function InviteForm({
  stores,
  defaultLanguage,
}: {
  stores: StoreOption[];
  defaultLanguage: InviteLanguage;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setFormKey((current) => current + 1);
  }, []);
  const handleOpenChange = useCallback((open: boolean) => {
    if (open) setIsOpen(true);
    else closeModal();
  }, [closeModal]);

  return (
    <>
      <div id="invite-user" className="scroll-mt-6">
        <Button type="button" onClick={() => setIsOpen(true)}>Zaproś użytkownika</Button>
      </div>
      <ModalOverlay
        isOpen={isOpen}
        onOpenChange={handleOpenChange}
        isDismissable
        className="admin-theme fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      >
        <Modal className="w-full max-w-2xl outline-none">
          <Dialog aria-label="Zaproś użytkownika" className="outline-none">
            <div className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default shadow-2xl">
              <header className="flex items-start justify-between gap-4 border-b border-separator-border p-5 sm:p-6">
                <div className="flex flex-col gap-1">
                  <p className="text-caption-1-semibold uppercase tracking-wide text-text-tertiary">Nowe zaproszenie</p>
                  <h2 className="text-title-2-semibold text-text-primary">Zaproś użytkownika</h2>
                  <p className="max-w-lg text-body-2-regular text-text-secondary">
                    Wyślij link rejestracyjny i przypisz konto do sklepu.
                  </p>
                </div>
                <CloseButton aria-label="Zamknij" size="md" onClick={closeModal} />
              </header>
              <div className="overflow-y-auto p-5 sm:p-6">
                <InviteFormFields
                  key={formKey}
                  stores={stores}
                  defaultLanguage={defaultLanguage}
                  onSuccess={closeModal}
                />
              </div>
            </div>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}
