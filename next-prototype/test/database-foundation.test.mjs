import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const migrationPath = new URL("../supabase/migrations/20261012090000_academy_foundation.sql", import.meta.url);
const adminId = "00000000-0000-4000-8000-000000000001";
const employeeId = "00000000-0000-4000-8000-000000000002";
const secondEmployeeId = "00000000-0000-4000-8000-000000000003";

describe("Academy foundation migration", { concurrency: false }, () => {
  let db;
  let storeId;
  let secondStoreId;

  before(async () => {
    db = new PGlite();
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role supabase_auth_admin nologin;
      create schema auth;
      create table auth.users (
        id uuid primary key,
        email text,
        raw_user_meta_data jsonb not null default '{}'::jsonb
      );
      create function auth.uid()
      returns uuid
      language sql
      stable
      as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
      $$;
    `);

    await db.exec(await readFile(migrationPath, "utf8"));

    const firstStore = await db.query(
      `insert into public.stores (name, street_address, city, postal_code, country_code)
       values ('Xzone Warszawa', 'Marszałkowska 1', 'Warszawa', '00-001', 'PL')
       returning id`,
    );
    const secondStore = await db.query(
      `insert into public.stores (name, street_address, city, postal_code, country_code)
       values ('Xzone Gdańsk', 'Długa 1', 'Gdańsk', '80-001', 'PL')
       returning id`,
    );
    storeId = firstStore.rows[0].id;
    secondStoreId = secondStore.rows[0].id;

    await db.query(
      "insert into public.user_invites (email, role) values ($1, 'admin')",
      ["admin@academy.test"],
    );
    await db.query(
      "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)",
      [adminId, "admin@academy.test", JSON.stringify({ first_name: "Anna", last_name: "Admin" })],
    );

    await db.query(
      "insert into public.user_invites (email, role, store_id, created_by) values ($1, 'employee', $2, $3)",
      ["employee@academy.test", storeId, adminId],
    );
    await db.query(
      "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)",
      [
        employeeId,
        "employee@academy.test",
        JSON.stringify({
          first_name: "Emilia",
          last_name: "Employee",
          role: "admin",
          store_id: Number(secondStoreId),
          preferred_language: "de",
        }),
      ],
    );

    await db.query(
      "insert into public.user_invites (email, role, store_id, created_by) values ($1, 'employee', $2, $3)",
      ["other@academy.test", secondStoreId, adminId],
    );
    await db.query(
      "insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3::jsonb)",
      [secondEmployeeId, "other@academy.test", JSON.stringify({ first_name: "Olek" })],
    );
  });

  after(async () => {
    await db?.close();
  });

  async function asUser(userId, callback) {
    await db.exec("begin");
    try {
      await db.exec("set local role authenticated");
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [userId]);
      return await callback();
    } finally {
      await db.exec("rollback");
    }
  }

  it("rejects Auth users without an active Academy invitation", async () => {
    await assert.rejects(
      db.query(
        "insert into auth.users (id, email) values ($1, $2)",
        ["00000000-0000-4000-8000-000000000004", "unknown@academy.test"],
      ),
      /active Academy invitation/,
    );
  });

  it("takes role and store from the invitation, not editable Auth metadata", async () => {
    const result = await db.query(
      "select role, store_id, preferred_language from public.profiles where id = $1",
      [employeeId],
    );

    assert.deepEqual(result.rows, [
      { role: "employee", store_id: storeId, preferred_language: "de" },
    ]);

    const invite = await db.query(
      "select accepted_at is not null as accepted from public.user_invites where email = $1",
      ["employee@academy.test"],
    );
    assert.equal(invite.rows[0].accepted, true);
  });

  it("limits employees to their own profile and assigned store", async () => {
    await asUser(employeeId, async () => {
      const profiles = await db.query("select email from public.profiles order by email");
      const stores = await db.query("select name from public.stores order by name");
      const invites = await db.query("select id from public.user_invites");

      assert.deepEqual(profiles.rows, [{ email: "employee@academy.test" }]);
      assert.deepEqual(stores.rows, [{ name: "Xzone Warszawa" }]);
      assert.deepEqual(invites.rows, []);
    });
  });

  it("prevents employees from creating invites or changing their role", async () => {
    await asUser(employeeId, async () => {
      await assert.rejects(
        db.query(
          "insert into public.user_invites (email, role, store_id) values ($1, 'employee', $2)",
          ["intruder@academy.test", storeId],
        ),
        /row-level security policy/,
      );
    });

    await asUser(employeeId, async () => {
      await assert.rejects(
        db.query("update public.profiles set role = 'admin' where id = $1", [employeeId]),
        /permission denied/,
      );
    });
  });

  it("allows admins to manage stores and see employee records", async () => {
    await asUser(adminId, async () => {
      const profiles = await db.query("select email from public.profiles order by email");
      const stores = await db.query("select name from public.stores order by name");

      assert.equal(profiles.rows.length, 3);
      assert.equal(stores.rows.length, 2);

      const created = await db.query(
        `insert into public.stores (name, street_address, city, postal_code)
         values ('Xzone Kraków', 'Rynek 1', 'Kraków', '30-001')
         returning name`,
      );
      assert.equal(created.rows[0].name, "Xzone Kraków");
    });
  });

  it("rejects invalid store coordinates and employees without a store", async () => {
    await assert.rejects(
      db.query(
        `insert into public.stores (name, street_address, city, postal_code, latitude)
         values ('Invalid', 'Test 1', 'Warszawa', '00-001', 51.1)`,
      ),
      /check constraint/,
    );
    await assert.rejects(
      db.query(
        "insert into public.user_invites (email, role) values ($1, 'employee')",
        ["nostore@academy.test"],
      ),
      /check constraint/,
    );
  });
});

