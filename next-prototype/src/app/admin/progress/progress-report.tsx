"use client";

import { useMemo, useState } from "react";
import { Avatar } from "@/components/base/avatar/avatar";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/buttons/button";
import { Select, SelectItem } from "@/components/base/select/select";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/base/table/table";
import { AdminStats } from "@/app/admin/admin-stats";
import { type AdminProgressRow } from "@/lib/admin/progress-report";

type FilterOption = { id: string; label: string };

function FilterSelect({
  label,
  selectedKey,
  onSelectionChange,
  options,
}: {
  label: string;
  selectedKey: string;
  onSelectionChange: (key: string) => void;
  options: FilterOption[];
}) {
  return (
    <Select
      aria-label={label}
      selectedKey={selectedKey}
      onSelectionChange={(key) => onSelectionChange(key === null ? "all" : String(key))}
      className="min-w-52"
    >
      <SelectItem id="all">Wszystkie</SelectItem>
      {options.map((option) => (
        <SelectItem key={option.id} id={option.id}>{option.label}</SelectItem>
      ))}
    </Select>
  );
}

function formatLastActivity(value: string | null) {
  if (!value) return "Brak aktywności";
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
}

export function ProgressReport({ rows }: { rows: AdminProgressRow[] }) {
  const [storeFilter, setStoreFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");

  const storeOptions = useMemo(() => {
    const unique = new Map<number, string>();
    rows.forEach((row) => unique.set(row.storeId, `${row.storeName} · ${row.storeCity}`));
    return [...unique].map(([id, label]) => ({ id: String(id), label }));
  }, [rows]);

  const userOptions = useMemo(() => {
    const unique = new Map<string, string>();
    rows.forEach((row) => unique.set(row.employeeEmail, `${row.employeeName} · ${row.employeeEmail}`));
    return [...unique].map(([id, label]) => ({ id, label }));
  }, [rows]);

  const moduleOptions = useMemo(() => {
    const unique = new Map<number, string>();
    rows.forEach((row) => unique.set(row.moduleId, `${row.courseTitle} · ${row.moduleTitle}`));
    return [...unique].map(([id, label]) => ({ id: String(id), label }));
  }, [rows]);

  const filteredRows = useMemo(() => rows.filter((row) =>
    (storeFilter === "all" || String(row.storeId) === storeFilter)
    && (userFilter === "all" || row.employeeEmail === userFilter)
    && (moduleFilter === "all" || String(row.moduleId) === moduleFilter),
  ), [moduleFilter, rows, storeFilter, userFilter]);

  const userCount = new Set(filteredRows.map((row) => row.employeeEmail)).size;
  const lessonsCompleted = filteredRows.reduce((total, row) => total + row.completedLessonCount, 0);
  const lessonsAvailable = filteredRows.reduce((total, row) => total + row.lessonCount, 0);
  const quizAttempts = filteredRows.reduce((total, row) => total + row.quizAttemptCount, 0);
  const resetFilters = () => {
    setStoreFilter("all");
    setUserFilter("all");
    setModuleFilter("all");
  };

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <AdminStats metrics={[
        { icon: "users", label: "Użytkownicy w widoku", value: String(userCount), caption: "Po uwzględnieniu filtrów" },
        { icon: "lessons", label: "Ukończone lekcje", value: `${lessonsCompleted} / ${lessonsAvailable}`, caption: "W wybranych szkoleniach" },
        { icon: "quizzes", label: "Podejścia do testów", value: String(quizAttempts), caption: "Łącznie w tym widoku" },
      ]} />

      {rows.length ? (
        <section className="flex min-w-0 flex-col gap-5 rounded-3xl border border-border-button-default bg-background-primary-default p-5 sm:p-6" aria-labelledby="progress-table-title">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-1">
              <h2 id="progress-table-title" className="text-title-2-medium text-text-primary">Wyniki według modułu</h2>
              <p className="text-body-2-regular text-text-secondary">Porównuj ukończone lekcje i testy w poszczególnych sklepach.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterSelect label="Filtruj po sklepie" selectedKey={storeFilter} onSelectionChange={setStoreFilter} options={storeOptions} />
              <FilterSelect label="Filtruj po użytkowniku" selectedKey={userFilter} onSelectionChange={setUserFilter} options={userOptions} />
              <FilterSelect label="Filtruj po module" selectedKey={moduleFilter} onSelectionChange={setModuleFilter} options={moduleOptions} />
            </div>
          </div>

          {filteredRows.length ? (
            <Table aria-label="Postępy użytkowników według modułu" size="md">
              <TableHeader>
                <TableColumn id="user" isRowHeader>Użytkownik</TableColumn>
                <TableColumn id="store">Sklep</TableColumn>
                <TableColumn id="module">Szkolenie i moduł</TableColumn>
                <TableColumn id="lessons">Lekcje</TableColumn>
                <TableColumn id="quizzes">Testy</TableColumn>
                <TableColumn id="activity">Ostatnia aktywność</TableColumn>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => {
                  const lessonProgress = row.lessonCount ? Math.round((row.completedLessonCount / row.lessonCount) * 100) : 0;
                  return (
                    <TableRow key={`${row.employeeEmail}-${row.moduleId}`} id={`${row.employeeEmail}-${row.moduleId}`}>
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar size="sm" initials={initialsFor(row.employeeName)} />
                          <div className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate text-body-medium text-text-primary">{row.employeeName}</span>
                            <span className="truncate text-caption-1-regular text-text-tertiary">{row.employeeEmail}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-body-2-medium text-text-primary">{row.storeName}</span>
                          <span className="text-caption-1-regular text-text-secondary">{row.storeCity}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="text-body-2-medium text-text-primary">{row.courseTitle}</span>
                          <span className="text-body-2-regular text-text-secondary">{row.moduleTitle}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex min-w-24 flex-col gap-2">
                          <span className="text-body-2-medium text-text-primary">{row.completedLessonCount} / {row.lessonCount}</span>
                          <span className="h-1.5 overflow-hidden rounded-full bg-background-secondary-default">
                            <span className="block h-full rounded-full bg-accent-500" style={{ width: `${lessonProgress}%` }} />
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1.5">
                          <Badge color={row.passedQuizCount ? "primary" : "neutral"}>{row.passedQuizCount} zaliczone</Badge>
                          <span className="text-caption-1-regular text-text-secondary">{row.quizAttemptCount} podejść · {row.latestQuizScore === null ? "brak wyniku" : `${row.latestQuizScore}%`}</span>
                        </div>
                      </TableCell>
                      <TableCell><span className="whitespace-nowrap text-body-2-regular text-text-secondary">{formatLastActivity(row.lastActivityAt)}</span></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-button-default bg-background-secondary-default px-6 py-10 text-center">
              <p className="text-body-medium text-text-primary">Brak wyników dla wybranych filtrów</p>
              <p className="text-body-2-regular text-text-secondary">Wyczyść filtry, aby wrócić do pełnego raportu.</p>
              <Button type="button" variant="secondary" onClick={resetFilters}>Wyczyść filtry</Button>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
