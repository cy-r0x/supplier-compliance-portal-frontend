"use client";

import { FormEvent, useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  HiOutlineBuildingOffice2,
  HiOutlineExclamationTriangle,
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineUsers,
  HiOutlineXMark,
} from "react-icons/hi2";
import {
  addOrganizationMember,
  createOrganization,
  getOrganization,
  listOrganizations,
  removeOrganizationMember,
  updateOrganization,
  updateOrganizationMember,
  type OrganizationDetail,
  type OrganizationListItem,
  type OrganizationMemberRole,
} from "@/lib/api/organizations-api";
import { createUser, listUsers, type ApiUser } from "@/lib/api/users-api";
import { SkeletonRows } from "@/components/loading/Skeleton";

const inputClass =
  "h-10 w-full rounded-[9px] border border-border-subtle bg-bg-app px-3 text-[13px] text-text-primary outline-none transition-[border-color,box-shadow] duration-150 focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/25";

const btnSecondary =
  "h-10 cursor-pointer rounded-[9px] border border-border-subtle px-4 text-[13px] font-medium text-text-secondary transition-colors duration-150 hover:bg-bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60";

const btnPrimary =
  "h-10 cursor-pointer rounded-[9px] bg-brand-500 px-4 text-[13px] font-medium text-text-inverse transition-colors duration-150 hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-60";

function RoleBadge({ role }: { role: OrganizationMemberRole }) {
  return (
    <span
      className={`inline-flex rounded-[6px] px-2 py-0.5 text-[11px] font-medium ${
        role === "MANAGER"
          ? "bg-brand-100 text-brand-700"
          : "bg-bg-inset text-text-secondary"
      }`}
    >
      {role === "MANAGER" ? "Manager" : "Member"}
    </span>
  );
}

export function OrganizationsSection() {
  const [organizations, setOrganizations] = useState<OrganizationListItem[]>([]);
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrganizationDetail | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [name, setName] = useState("");
  const [managerIds, setManagerIds] = useState<string[]>([]);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState<OrganizationMemberRole>("MEMBER");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const editNameId = useId();
  const editNameErrorId = useId();
  const createNameId = useId();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orgItems, userResult] = await Promise.all([
        listOrganizations(),
        listUsers({ role: "USER", limit: 100, sort: "name:asc" }),
      ]);
      setOrganizations(orgItems);
      setUsers(userResult.items);
      const nextId = selectedId ?? orgItems[0]?.id ?? null;
      setSelectedId(nextId);
      setDetail(nextId ? await getOrganization(nextId) : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organizations");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!createOpen && !createUserOpen) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || saving) return;
      if (createUserOpen) setCreateUserOpen(false);
      else setCreateOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [createOpen, createUserOpen, saving]);

  async function selectOrganization(id: string) {
    setSelectedId(id);
    setError(null);
    setSuccessMessage(null);
    setEditingName(false);
    setNameError(null);
    try {
      setDetail(await getOrganization(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load organization");
    }
  }

  const unassignedUsers = useMemo(
    () => users.filter((user) => !user.organization),
    [users],
  );

  function toggleSelection(id: string, role: OrganizationMemberRole) {
    const setTarget = role === "MANAGER" ? setManagerIds : setMemberIds;
    const otherTarget = role === "MANAGER" ? setMemberIds : setManagerIds;
    setTarget((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
    otherTarget((current) => current.filter((value) => value !== id));
  }

  function startRename() {
    if (!detail) return;
    setEditName(detail.name);
    setNameError(null);
    setEditingName(true);
    setSuccessMessage(null);
  }

  function cancelRename() {
    setEditingName(false);
    setNameError(null);
    setEditName(detail?.name ?? "");
  }

  async function saveRename(event?: FormEvent) {
    event?.preventDefault();
    if (!selectedId || !detail) return;
    const next = editName.trim();
    if (!next) {
      setNameError("Organization name is required");
      return;
    }
    if (next === detail.name) {
      setEditingName(false);
      return;
    }

    setSaving(true);
    setNameError(null);
    setError(null);
    try {
      const updated = await updateOrganization(selectedId, { name: next });
      setDetail((current) => (current ? { ...current, name: updated.name } : current));
      setOrganizations((current) =>
        current.map((org) =>
          org.id === updated.id ? { ...org, name: updated.name } : org,
        ),
      );
      setEditingName(false);
      setSuccessMessage("Organization name updated");
    } catch (err) {
      setNameError(
        err instanceof Error ? err.message : "Failed to update organization name",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || managerIds.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createOrganization({
        name: name.trim(),
        managerUserIds: managerIds,
        memberUserIds: memberIds,
      });
      setCreateOpen(false);
      setName("");
      setManagerIds([]);
      setMemberIds([]);
      setSelectedId(created.id);
      setSuccessMessage("Organization created");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create organization");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateUser(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await createUser({ ...newUser, role: "USER" });
      setUsers((current) => [created, ...current]);
      setManagerIds((current) => [...current, created.id]);
      setNewUser({ name: "", email: "", password: "" });
      setCreateUserOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setSaving(false);
    }
  }

  async function refreshDetail() {
    if (selectedId) setDetail(await getOrganization(selectedId));
    const [orgItems, userResult] = await Promise.all([
      listOrganizations(),
      listUsers({ role: "USER", limit: 100, sort: "name:asc" }),
    ]);
    setOrganizations(orgItems);
    setUsers(userResult.items);
  }

  async function handleAddMember() {
    if (!selectedId || !addUserId) return;
    setSaving(true);
    setError(null);
    try {
      await addOrganizationMember(selectedId, { userId: addUserId, role: addRole });
      setAddUserId("");
      await refreshDetail();
      setSuccessMessage("Member added");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add member");
    } finally {
      setSaving(false);
    }
  }

  const managerCount =
    detail?.members.filter((member) => member.role === "MANAGER").length ?? 0;
  const memberCount =
    detail?.members.filter((member) => member.role === "MEMBER").length ?? 0;

  async function handleRole(memberId: string, role: OrganizationMemberRole) {
    if (!selectedId || !detail) return;
    const target = detail.members.find((member) => member.id === memberId);
    if (
      target?.role === "MANAGER" &&
      role === "MEMBER" &&
      managerCount === 1
    ) {
      setError("Cannot demote the last manager of an organization");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await updateOrganizationMember(selectedId, memberId, { role });
      await refreshDetail();
      setSuccessMessage("Member role updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(memberId: string, memberName: string) {
    if (!selectedId || !window.confirm(`Remove ${memberName} from this organization?`)) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await removeOrganizationMember(selectedId, memberId);
      await refreshDetail();
      setSuccessMessage("Member removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.02em] text-text-primary">
            Organizations
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            Create organizations, rename them, and manage managers and members.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreateOpen(true);
            setError(null);
          }}
          className={`inline-flex items-center gap-1.5 ${btnPrimary}`}
        >
          <HiOutlinePlus className="h-4 w-4" aria-hidden />
          Create organization
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 flex items-start gap-2.5 rounded-[12px] border border-danger-500/30 bg-danger-50 px-4 py-3"
        >
          <HiOutlineExclamationTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-danger-500"
            aria-hidden
          />
          <p className="text-[13px] font-medium text-danger-500">{error}</p>
        </div>
      ) : null}

      {successMessage ? (
        <p
          role="status"
          className="mb-4 rounded-[9px] border border-brand-100 bg-brand-50 px-4 py-2.5 text-[13px] text-brand-700"
        >
          {successMessage}
        </p>
      ) : null}

      {loading ? (
        <SkeletonRows />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.4fr)]">
          <aside className="rounded-[12px] border border-border-subtle bg-bg-elevated p-2">
            <p className="px-3 py-2 text-[11px] font-semibold tracking-wide text-text-muted uppercase">
              All organizations
            </p>
            {organizations.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <span className="mx-auto flex size-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <HiOutlineBuildingOffice2 className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-3 text-[13px] font-medium text-text-primary">
                  No organizations yet
                </p>
                <p className="mt-1 text-[12px] text-text-muted">
                  Create one to assign managers and members.
                </p>
              </div>
            ) : (
              organizations.map((organization) => {
                const selected = selectedId === organization.id;
                return (
                  <button
                    type="button"
                    key={organization.id}
                    onClick={() => void selectOrganization(organization.id)}
                    aria-current={selected ? "true" : undefined}
                    className={`mb-1 flex w-full items-start gap-3 rounded-[9px] px-3 py-3 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                      selected
                        ? "bg-brand-100 text-brand-700"
                        : "hover:bg-bg-muted"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-[8px] ${
                        selected
                          ? "bg-brand-500 text-text-inverse"
                          : "bg-bg-inset text-text-secondary"
                      }`}
                      aria-hidden
                    >
                      <HiOutlineBuildingOffice2 className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-text-primary">
                        {organization.name}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-text-muted">
                        {organization.memberCount} members ·{" "}
                        {organization.productRequestCount} requests
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </aside>

          <section className="rounded-[12px] border border-border-subtle bg-bg-elevated p-5">
            {detail ? (
              <>
                <div className="flex flex-col gap-4 border-b border-border-subtle pb-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 flex-1">
                    {editingName ? (
                      <form onSubmit={saveRename} className="max-w-md">
                        <label
                          htmlFor={editNameId}
                          className="block text-[12px] font-medium text-text-primary"
                        >
                          Organization name
                        </label>
                        <input
                          id={editNameId}
                          value={editName}
                          autoFocus
                          aria-invalid={Boolean(nameError)}
                          aria-describedby={
                            nameError ? editNameErrorId : undefined
                          }
                          onChange={(event) => {
                            setEditName(event.target.value);
                            setNameError(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              event.preventDefault();
                              cancelRename();
                            }
                          }}
                          className={`${inputClass} mt-1.5`}
                          disabled={saving}
                        />
                        {nameError ? (
                          <p
                            id={editNameErrorId}
                            className="mt-1.5 text-[12px] text-danger-500"
                          >
                            {nameError}
                          </p>
                        ) : null}
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={saving}
                            onClick={cancelRename}
                            className={btnSecondary}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={saving || !editName.trim()}
                            className={btnPrimary}
                          >
                            {saving ? "Saving…" : "Save name"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-text-primary">
                            {detail.name}
                          </h2>
                          <button
                            type="button"
                            onClick={startRename}
                            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-2.5 text-[12px] font-medium text-brand-600 transition-colors duration-150 hover:bg-brand-100/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                          >
                            <HiOutlinePencilSquare
                              className="h-4 w-4"
                              aria-hidden
                            />
                            Edit name
                          </button>
                        </div>
                        <p className="mt-1 text-[12px] text-text-secondary">
                          {managerCount} manager
                          {managerCount === 1 ? "" : "s"} · {memberCount} member
                          {memberCount === 1 ? "" : "s"} ·{" "}
                          {detail.productRequestCount} product request
                          {detail.productRequestCount === 1 ? "" : "s"}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center gap-2">
                    <HiOutlineUsers
                      className="h-4 w-4 text-text-muted"
                      aria-hidden
                    />
                    <h3 className="text-[14px] font-medium text-text-primary">
                      Team
                    </h3>
                  </div>
                  <p className="mt-1 text-[12px] text-text-secondary">
                    Add unassigned users as managers or members.
                  </p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <label className="sr-only" htmlFor="org-add-user">
                      Select user to add
                    </label>
                    <select
                      id="org-add-user"
                      value={addUserId}
                      onChange={(event) => setAddUserId(event.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select user to add</option>
                      {unassignedUsers.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </select>
                    <label className="sr-only" htmlFor="org-add-role">
                      Role
                    </label>
                    <select
                      id="org-add-role"
                      value={addRole}
                      onChange={(event) =>
                        setAddRole(event.target.value as OrganizationMemberRole)
                      }
                      className={`${inputClass} sm:w-36`}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                    <button
                      type="button"
                      disabled={!addUserId || saving}
                      onClick={() => void handleAddMember()}
                      className={`shrink-0 ${btnPrimary}`}
                    >
                      Add
                    </button>
                  </div>
                  {unassignedUsers.length === 0 ? (
                    <p className="mt-2 text-[12px] text-text-muted">
                      No unassigned users available. Create a user first.
                    </p>
                  ) : null}

                  <ul className="mt-4 divide-y divide-border-subtle rounded-[10px] border border-border-subtle">
                    {detail.members.length === 0 ? (
                      <li className="px-4 py-6 text-center text-[13px] text-text-muted">
                        No members yet.
                      </li>
                    ) : (
                      detail.members.map((member) => {
                        const isLastManager =
                          member.role === "MANAGER" && managerCount === 1;
                        return (
                        <li
                          key={member.id}
                          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-[13px] font-medium text-text-primary">
                                {member.user.name}
                              </p>
                              <RoleBadge role={member.role} />
                            </div>
                            <p className="mt-0.5 truncate text-[12px] text-text-muted">
                              {member.user.email}
                            </p>
                            {isLastManager ? (
                              <p className="mt-1 text-[11px] text-text-muted">
                                Last manager — add another before removing or demoting.
                              </p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <label
                              className="sr-only"
                              htmlFor={`role-${member.id}`}
                            >
                              Role for {member.user.name}
                            </label>
                            <select
                              id={`role-${member.id}`}
                              value={member.role}
                              disabled={saving}
                              onChange={(event) =>
                                void handleRole(
                                  member.id,
                                  event.target.value as OrganizationMemberRole,
                                )
                              }
                              className="h-9 rounded-[8px] border border-border-subtle bg-bg-app px-2 text-[12px] outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/25"
                            >
                              <option
                                value="MEMBER"
                                disabled={isLastManager}
                              >
                                Member
                              </option>
                              <option value="MANAGER">Manager</option>
                            </select>
                            <button
                              type="button"
                              disabled={saving || isLastManager}
                              title={
                                isLastManager
                                  ? "Cannot remove the last manager"
                                  : undefined
                              }
                              onClick={() =>
                                void handleRemove(member.id, member.user.name)
                              }
                              className="inline-flex h-9 items-center gap-1 rounded-[8px] px-2.5 text-[12px] font-medium text-danger-500 transition-colors duration-150 hover:bg-danger-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <HiOutlineTrash className="h-4 w-4" aria-hidden />
                              Remove
                            </button>
                          </div>
                        </li>
                        );
                      })
                    )}
                  </ul>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="flex size-11 items-center justify-center rounded-full bg-bg-inset text-text-muted">
                  <HiOutlineBuildingOffice2 className="h-5 w-5" aria-hidden />
                </span>
                <p className="mt-3 text-[13px] font-medium text-text-primary">
                  Select an organization
                </p>
                <p className="mt-1 text-[12px] text-text-muted">
                  Choose one from the list to view and edit details.
                </p>
              </div>
            )}
          </section>
        </div>
      )}

      {createOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setCreateOpen(false);
            }
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-org-title"
            onSubmit={handleCreate}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[12px] border border-border-subtle bg-bg-elevated p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <h2
                id="create-org-title"
                className="text-[18px] font-semibold text-text-primary"
              >
                Create organization
              </h2>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="rounded-[7px] p-1.5 text-text-muted hover:bg-bg-muted hover:text-text-primary"
                aria-label="Close"
              >
                <HiOutlineXMark className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <label
              htmlFor={createNameId}
              className="mt-4 block text-[12px] font-medium text-text-primary"
            >
              Name <span className="text-brand-600">*</span>
            </label>
            <input
              id={createNameId}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`${inputClass} mt-1.5`}
              required
            />

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-[12px] font-medium text-text-primary">
                Users and roles
              </p>
              <button
                type="button"
                onClick={() => setCreateUserOpen(true)}
                className="text-[12px] font-medium text-brand-600 hover:text-brand-700"
              >
                Create new user
              </button>
            </div>
            <div className="mt-2 max-h-64 divide-y divide-border-subtle overflow-y-auto rounded-[9px] border border-border-subtle">
              {unassignedUsers.length === 0 ? (
                <p className="px-3 py-4 text-center text-[12px] text-text-muted">
                  No unassigned users. Create a new user first.
                </p>
              ) : (
                unassignedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] text-text-primary">
                        {user.name}
                      </p>
                      <p className="truncate text-[11px] text-text-muted">
                        {user.email} · Unassigned
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSelection(user.id, "MANAGER")}
                      className={`rounded-[7px] px-2 py-1 text-[11px] font-medium ${
                        managerIds.includes(user.id)
                          ? "bg-brand-100 text-brand-700"
                          : "bg-bg-muted text-text-secondary"
                      }`}
                    >
                      Manager
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSelection(user.id, "MEMBER")}
                      className={`rounded-[7px] px-2 py-1 text-[11px] font-medium ${
                        memberIds.includes(user.id)
                          ? "bg-brand-100 text-brand-700"
                          : "bg-bg-muted text-text-secondary"
                      }`}
                    >
                      Member
                    </button>
                  </div>
                ))
              )}
            </div>
            {managerIds.length === 0 ? (
              <p className="mt-2 text-[11px] text-danger-500">
                Select at least one manager.
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !name.trim() || managerIds.length === 0}
                className={btnPrimary}
              >
                {saving ? "Creating…" : "Create organization"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {createUserOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-text-primary/40 px-4 py-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setCreateUserOpen(false);
            }
          }}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-user-title"
            onSubmit={handleCreateUser}
            className="w-full max-w-sm rounded-[12px] border border-border-subtle bg-bg-elevated p-6 shadow-sm"
          >
            <h2
              id="create-user-title"
              className="text-[18px] font-semibold text-text-primary"
            >
              Create user
            </h2>
            {(["name", "email", "password"] as const).map((field) => (
              <label
                key={field}
                className="mt-4 block text-[12px] font-medium capitalize text-text-primary"
              >
                {field}
                <input
                  type={
                    field === "password"
                      ? "password"
                      : field === "email"
                        ? "email"
                        : "text"
                  }
                  value={newUser[field]}
                  minLength={field === "password" ? 8 : undefined}
                  onChange={(event) =>
                    setNewUser((current) => ({
                      ...current,
                      [field]: event.target.value,
                    }))
                  }
                  className={`${inputClass} mt-1.5`}
                  required
                />
              </label>
            ))}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateUserOpen(false)}
                className={btnSecondary}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={btnPrimary}>
                Create and select
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
