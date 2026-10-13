"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/base/table/table";
import { Select, SelectItem } from "@/components/base/select/select";
import { StatCards, type Stat } from "@/components/application/dashboard/stat-cards";
import { type AdminProgressRow } from "@/lib/admin/progress-report";
import { RiBookOpenLine, RiGroupLine, RiQuestionnaireLine } from "@remixicon/react";

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

export function ProgressReport({ rows }: { rows: AdminProgressRow[] }) {
  const [storeFilter, setStoreFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [moduleFilter, setModuleFilter] = useState("all");

  const storeOptions = useMemo(() => {
    const unique = new Map<number, string>();
    rows.forEach((row) => unique.set(row.storeId, `${row.storeName} · ${row.storeCity}`));
    return [...unique].map(([id, label]) => ({ id: String(id), label }));
  }, [rows]);

  const employeeOptions = useMemo(() => {
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
    && (employeeFilter === "all" || row.employeeEmail === employeeFilter)
    && (moduleFilter === "all" || String(row.moduleId) === moduleFilter),
  ), [employeeFilter, moduleFilter, rows, storeFilter]);

  const employeeCount = new Set(filteredRows.map((row) => row.employeeEmail)).size;
  const lessonsCompleted = filteredRows.reduce((total, row) => total + row.completedLessonCount, 0);
  const lessonsAvailable = filteredRows.reduce((total, row) => total + row.lessonCount, 0);
  const quizAttempts = filteredRows.reduce((total, row) => total + row.quizAttemptCount, 0);
  const stats: Stat[] = [
    { icon: RiGroupLine, label: "Pracownicy w widoku", value: String(employeeCount), deltaColor: "neutral" },
    { icon: RiBookOpenLine, label: "Ukończone lekcje", value: `${lessonsCompleted} / ${lessonsAvailable}`, deltaColor: "neutral" },
    { icon: RiQuestionnaireLine, label: "Podejścia do testów", value: String(quizAttempts), deltaColor: "neutral" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section aria-label="Podsumowanie">
        <StatCards stats={stats} count={3} columns={1} className="sm:grid-cols-3" />
      </section>

      <section className="flex flex-col gap-4 rounded-3xl border border-border-button-default bg-background-primary-default p-6">
        <header className="flex flex-col gap-1">
          <h2 className="text-title-3-semibold text-text-primary">Wyniki według modułu</h2>
          <p className="text-body-2-regular text-text-secondary">Filtruj dane według sklepu, pracownika lub modułu.</p>
        </header>

        <div className="flex flex-wrap gap-3">
          <FilterSelect label="Filtruj po sklepie" selectedKey={storeFilter} onSelectionChange={setStoreFilter} options={storeOptions} />
          <FilterSelect label="Filtruj po pracowniku" selectedKey={employeeFilter} onSelectionChange={setEmployeeFilter} options={employeeOptions} />
          <FilterSelect label="Filtruj po module" selectedKey={moduleFilter} onSelectionChange={setModuleFilter} options={moduleOptions} />
        </div>

        {filteredRows.length ? (
          <Table aria-label="Postępy pracowników według modułu" size="sm">
            <TableHeader>
              <TableColumn id="employee" isRowHeader>Pracownik</TableColumn>
              <TableColumn id="store">Sklep</TableColumn>
              <TableColumn id="module">Szkolenie i moduł</TableColumn>
              <TableColumn id="lessons">Lekcje</TableColumn>
              <TableColumn id="quizzes">Testy</TableColumn>
              <TableColumn id="activity">Ostatnia aktywność</TableColumn>
            </TableHeader>
            <TableBody>
              {filteredRows.map((row) => (
                <TableRow key={`${row.employeeEmail}-${row.moduleId}`} id={`${row.employeeEmail}-${row.moduleId}`}>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-body-medium text-text-primary">{row.employeeName}</span>
                      <span className="text-caption-1-regular text-text-secondary">{row.employeeEmail}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-body-2-medium text-text-primary">{row.storeName}</span>
                      <span className="text-caption-1-regular text-text-secondary">{row.storeCity}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-body-2-medium text-text-primary">{row.courseTitle}</span>
                      <span className="text-body-2-regular text-text-secondary">{row.moduleTitle}</span>
                    </div>
                  </TableCell>
                  <TableCell>{row.completedLessonCount} / {row.lessonCount}</TableCell>
                  <TableCell>
                    {row.passedQuizCount} zal. · {row.quizAttemptCount} prób
                    <span className="block text-caption-1-regular text-text-secondary">
                      Ostatni wynik: {row.latestQuizScore === null ? "—" : `${row.latestQuizScore}%`}
                    </span>
                  </TableCell>
                  <TableCell>{formatLastActivity(row.lastActivityAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="rounded-2xl border border-separator-border p-6 text-body-regular text-text-secondary">
            {rows.length ? "Brak wyników dla wybranych filtrów." : "Nie ma jeszcze przypisanych szkoleń do wyświetlenia."}
          </p>
        )}
      </section>
    </div>
  );
}
