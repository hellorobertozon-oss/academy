"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { Select, SelectItem } from "@/components/base/select/select";
import { INITIAL_ADMIN_ACTION_STATE, type AdminActionState } from "@/lib/admin/action-state";
import {
  assignCourseToEmployeeAction,
  assignCourseToStoreAction,
  removeCourseAssignmentAction,
} from "@/app/admin/courses/assignment-actions";

export type AssignmentStore = {
  id: number;
  name: string;
  city: string;
  is_active: boolean;
};

export type AssignmentEmployee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  store_id: number;
};

export type CourseAssignment = {
  id: number;
  store_id: number | null;
  profile_id: string | null;
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

function RemoveAssignmentForm({ courseId, assignmentId }: { courseId: number; assignmentId: number }) {
  const [state, action, isPending] = useActionState(removeCourseAssignmentAction, INITIAL_ADMIN_ACTION_STATE);

  return (
    <div className="flex flex-col items-start gap-2">
      <form action={action}>
        <input type="hidden" name="course_id" value={courseId} />
        <input type="hidden" name="assignment_id" value={assignmentId} />
        <Button type="submit" variant="secondary" size="small" disabled={isPending}>
          {isPending ? "Usuwanie..." : "Usu\u0144 dost\u0119p"}
        </Button>
      </form>
      <ActionMessage state={state} />
    </div>
  );
}

export function CourseAssignmentManager({
  courseId,
  stores,
  employees,
  assignments,
}: {
  courseId: number;
  stores: AssignmentStore[];
  employees: AssignmentEmployee[];
  assignments: CourseAssignment[];
}) {
  const activeStores = stores.filter((store) => store.is_active);
  const assignedStoreIds = new Set(assignments.flatMap((assignment) => assignment.store_id === null ? [] : [assignment.store_id]));
  const assignedEmployeeIds = new Set(assignments.flatMap((assignment) => assignment.profile_id === null ? [] : [assignment.profile_id]));
  const availableStores = activeStores.filter((store) => !assignedStoreIds.has(store.id));
  const availableEmployees = employees.filter((employee) => !assignedEmployeeIds.has(employee.id));
  const [storeId, setStoreId] = useState(String(activeStores[0]?.id ?? ""));
  const [profileId, setProfileId] = useState(employees[0]?.id ?? "");
  const [storeState, storeAction, isStorePending] = useActionState(assignCourseToStoreAction, INITIAL_ADMIN_ACTION_STATE);
  const [employeeState, employeeAction, isEmployeePending] = useActionState(assignCourseToEmployeeAction, INITIAL_ADMIN_ACTION_STATE);
  const storesById = new Map(stores.map((store) => [store.id, store]));
  const employeesById = new Map(employees.map((employee) => [employee.id, employee]));
  const selectedStoreId = availableStores.some((store) => String(store.id) === storeId)
    ? storeId
    : String(availableStores[0]?.id ?? "");
  const selectedProfileId = availableEmployees.some((employee) => employee.id === profileId)
    ? profileId
    : availableEmployees[0]?.id ?? "";

  function assignmentName(assignment: CourseAssignment) {
    if (assignment.store_id !== null) {
      const store = storesById.get(assignment.store_id);
      return store ? `${store.name} · ${store.city}` : `Sklep ${assignment.store_id}`;
    }

    if (assignment.profile_id !== null) {
      const employee = employeesById.get(assignment.profile_id);
      if (!employee) return "Pracownik niedost\u0119pny";
      const fullName = [employee.first_name, employee.last_name].filter(Boolean).join(" ");
      const store = storesById.get(employee.store_id);
      return [fullName || employee.email, store ? `${store.name} · ${store.city}` : employee.email]
        .filter((value, index, values) => values.indexOf(value) === index)
        .join(" · ");
    }

    return "Nieznane przypisanie";
  }

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-title-3-semibold text-text-primary">Przypisania szkolenia</h2>
        <p className="text-body-2-regular text-text-secondary">
          Wybierz sklepy i osoby, kt&oacute;re maj&#261; mie&#263; dost&#281;p do tego szkolenia.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <form action={storeAction} className="flex flex-col items-start gap-3 rounded-2xl border border-separator-border p-4">
          <input type="hidden" name="course_id" value={courseId} />
          <label className="text-body-medium text-text-primary" id="assignment-store-label">
            Przypisz do sklepu
          </label>
          {availableStores.length ? (
            <Select
              name="store_id"
              aria-labelledby="assignment-store-label"
              selectedKey={selectedStoreId || null}
              onSelectionChange={(key) => setStoreId(String(key))}
              isRequired
              triggerClassName="min-h-12 w-full"
            >
              {availableStores.map((store) => (
                <SelectItem key={store.id} id={String(store.id)}>
                  {store.name} · {store.city}
                </SelectItem>
              ))}
            </Select>
          ) : (
            <p className="text-body-2-regular text-text-secondary">
              {activeStores.length ? "Wszystkie aktywne sklepy s\u0105 ju\u017C przypisane." : "Brak aktywnych sklep\u00F3w."}
            </p>
          )}
          <ActionMessage state={storeState} />
          <Button type="submit" disabled={isStorePending || availableStores.length === 0}>
            {isStorePending ? "Przypisywanie..." : "Przypisz sklep"}
          </Button>
        </form>

        <form action={employeeAction} className="flex flex-col items-start gap-3 rounded-2xl border border-separator-border p-4">
          <input type="hidden" name="course_id" value={courseId} />
          <label className="text-body-medium text-text-primary" id="assignment-employee-label">
            Przypisz pracownika
          </label>
          {availableEmployees.length ? (
            <Select
              name="profile_id"
              aria-labelledby="assignment-employee-label"
              selectedKey={selectedProfileId || null}
              onSelectionChange={(key) => setProfileId(String(key))}
              isRequired
              triggerClassName="min-h-12 w-full"
            >
              {availableEmployees.map((employee) => {
                const name = [employee.first_name, employee.last_name].filter(Boolean).join(" ") || employee.email;
                const store = storesById.get(employee.store_id);
                return (
                  <SelectItem key={employee.id} id={employee.id}>
                    {name} · {store ? `${store.name} · ${store.city}` : employee.email}
                  </SelectItem>
                );
              })}
            </Select>
          ) : (
            <p className="text-body-2-regular text-text-secondary">
              {employees.length ? "Wszyscy pracownicy maj\u0105 ju\u017C indywidualne przypisanie." : "Brak pracownik\u00F3w do przypisania."}
            </p>
          )}
          <ActionMessage state={employeeState} />
          <Button type="submit" disabled={isEmployeePending || availableEmployees.length === 0}>
            {isEmployeePending ? "Przypisywanie..." : "Przypisz pracownika"}
          </Button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-headline-medium text-text-primary">{"Osoby i sklepy z dost\u0119pem"}</h3>
        {assignments.length ? (
          <ul className="flex flex-col gap-3">
            {assignments.map((assignment) => (
              <li key={assignment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-separator-border p-4">
                <span className="text-body-medium text-text-primary">{assignmentName(assignment)}</span>
                <RemoveAssignmentForm courseId={courseId} assignmentId={assignment.id} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-body-2-regular text-text-secondary">To szkolenie nie ma jeszcze przypisa&#324;.</p>
        )}
      </div>
    </section>
  );
}
