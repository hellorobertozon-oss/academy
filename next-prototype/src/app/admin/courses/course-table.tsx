"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@/components/base/table/table";
import { Badge } from "@/components/base/badges/badge";
import { ButtonLink } from "@/components/base/buttons/button";
import { Switch } from "@/components/base/switch/switch";
import { setCourseVisibilityAction } from "@/app/admin/courses/actions";

export type AdminCourseListRow = {
  id: number;
  slug: string;
  title: string;
  languageCode: string;
  versionLabel: string;
  isPublished: boolean;
  isActive: boolean;
};

function CourseVisibilityControl({ course }: { course: AdminCourseListRow }) {
  const router = useRouter();
  const [isActive, setIsActive] = useState(course.isActive);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const visible = course.isPublished && isActive;

  function handleChange(nextValue: boolean) {
    if (!course.isPublished || isPending) return;
    const previousValue = isActive;
    setIsActive(nextValue);
    setMessage("");
    startTransition(async () => {
      const result = await setCourseVisibilityAction(course.id, nextValue);
      if (result.status === "error") {
        setIsActive(previousValue);
        setMessage(result.message);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Switch
        isSelected={visible}
        isDisabled={!course.isPublished || isPending}
        onChange={handleChange}
        aria-label={`Widoczność szkolenia: ${course.title}`}
      >
        {isPending ? "Zapisywanie…" : visible ? "Aktywne" : "Nieaktywne"}
      </Switch>
      {!course.isPublished ? <span className="text-caption-1-regular text-text-tertiary">Opublikuj, aby włączyć</span> : null}
      {message ? <span role="alert" className="text-caption-1-regular text-text-error-primary">{message}</span> : null}
    </div>
  );
}

export function CourseTable({ courses }: { courses: AdminCourseListRow[] }) {
  return (
    <Table aria-label="Szkolenia" size="md">
      <TableHeader>
        <TableColumn id="title" isRowHeader>Szkolenie</TableColumn>
        <TableColumn id="language">Język</TableColumn>
        <TableColumn id="status">Wersja</TableColumn>
        <TableColumn id="visibility">Widoczność</TableColumn>
        <TableColumn id="publication">Publikacja</TableColumn>
        <TableColumn id="edit">Edytuj</TableColumn>
      </TableHeader>
      <TableBody>
        {courses.map((course) => (
          <TableRow key={course.id} id={String(course.id)}>
            <TableCell>
              <span className="flex flex-col">
                <span className="text-body-medium text-text-primary">{course.title}</span>
                <span className="text-caption-1-regular text-text-tertiary">/{course.slug}</span>
              </span>
            </TableCell>
            <TableCell><Badge color="neutral">{course.languageCode.toUpperCase()}</Badge></TableCell>
            <TableCell><Badge color={course.versionLabel.startsWith("Opublikowane") ? "primary" : "neutral"}>{course.versionLabel}</Badge></TableCell>
            <TableCell><CourseVisibilityControl course={course} /></TableCell>
            <TableCell><Badge color={course.isPublished ? "primary" : "neutral"}>{course.isPublished ? "Opublikowane" : "Nieopublikowane"}</Badge></TableCell>
            <TableCell>
              <ButtonLink href={`/admin/courses/${course.id}`} size="small" variant="secondary">Otwórz edytor</ButtonLink>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
