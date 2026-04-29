import Link from "next/link";
import { ORGANIZATION_ROLE } from "@/lib/roles";
import BackButton from "@/components/BackButton";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

import {
  getOrganizationById,
  getOrganizationMembers,
  ORGANIZATION_MEMBER_ROLE_OPTIONS,
} from "@/lib/organizations";
import {
  addOrganizationMember,
  removeOrganizationMember,
  requireOrganizationMemberManagementAccess,
  updateOrganizationMemberRole,
} from "./actions";

type MembersPageProps = {
  params: Promise<{
    orgId: string;
  }>;
  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

export const metadata = { title: "Members" };

export default async function OrganizationMembersPage({
  params,
  searchParams,
}: MembersPageProps) {
  const { orgId } = await params;
  const { error, success } = await searchParams;
  const supabase = await createClient();

  const currentMembership =
    await requireOrganizationMemberManagementAccess(orgId);

  const [organization, members] = await Promise.all([
    getOrganizationById(orgId),
    getOrganizationMembers(orgId),
  ]);

  let signedLogoUrl: string | null = null;

  if (organization?.logo_path) {
    const { data } = await supabase.storage
      .from("organization-logos")
      .createSignedUrl(organization.logo_path, 60 * 60);
    signedLogoUrl = data?.signedUrl ?? null;
  }

  if (!organization) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <p className="text-sm text-gray-500 dark:text-neutral-400">Organization not found.</p>
        </div>
      </main>
    );
  }

  const addMemberForOrganization = addOrganizationMember.bind(null, orgId);
  const updateMemberRoleForOrganization = updateOrganizationMemberRole.bind(null, orgId);
  const removeMemberFromOrganization = removeOrganizationMember.bind(null, orgId);

  const inputClass =
    "rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  const btnClass =
    "rounded-lg border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.05] px-3 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400">
              Organization Members
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {organization.org_name}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
              Only treasurers and admins can manage members.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/?orgId=${orgId}`}
              className="rounded-xl border border-gray-200 dark:border-white/[0.2] bg-white dark:bg-white/[0.05] px-4 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/[0.08]"
            >
              Dashboard
            </Link>
            <Link
              href="/organizations"
              className="rounded-xl border border-gray-200 dark:border-white/[0.2] bg-white dark:bg-white/[0.05] px-4 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/[0.08]"
            >
              All Organizations
            </Link>
            <BackButton />
          </div>
        </div>

        {/* Org Logo */}
        <div className="flex flex-col items-center justify-center gap-3 text-center mb-8">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-gray-200 dark:border-white/[0.12] bg-gray-50 dark:bg-white/[0.03] sm:h-28 sm:w-28 md:h-32 md:w-32">
            {signedLogoUrl ? (
              <Image
                src={signedLogoUrl}
                alt={`${organization.org_name} logo`}
                width={128}
                height={128}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-gray-900 dark:text-white md:text-3xl">
                {organization.org_name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <Link
            href={`/organizations/${organization.org_id}/settings`}
            className="rounded-lg border border-gray-200 dark:border-white/[0.2] bg-white dark:bg-white/[0.05] px-4 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/[0.08]"
          >
            Edit Logo
          </Link>
        </div>

        {/* Flash messages */}
        {success && (
          <div className="mb-6 rounded-xl border border-green-300 dark:border-green-500/40 bg-green-50 dark:bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-300">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {/* Add Member */}
          <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Add Member</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                Add an existing TreasuryHub user to this organization by email.
              </p>
            </div>

            <form
              action={addMemberForOrganization}
              className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end"
            >
              <label className="flex flex-col gap-2 text-sm text-gray-700 dark:text-neutral-300">
                <span>Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="member@example.com"
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-2 text-sm text-gray-700 dark:text-neutral-300">
                <span>Role</span>
                <select
                  name="role"
                  defaultValue={ORGANIZATION_ROLE.MEMBER}
                  className={inputClass}
                >
                  {ORGANIZATION_MEMBER_ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </label>

              <button type="submit" className={btnClass}>
                Add Member
              </button>
            </form>
          </section>

          {/* Current Members */}
          <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)]">
            <div className="mb-4">
              <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Current Members</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                Update roles or remove members from this organization.
              </p>
            </div>

            {members.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/[0.12] px-4 py-8 text-center text-sm text-gray-500 dark:text-neutral-400">
                No members were found for this organization.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/[0.12]">
                      <th className="py-3 pr-6 text-left text-xs uppercase tracking-[0.16em] font-medium text-gray-500 dark:text-neutral-400">Name</th>
                      <th className="py-3 pr-6 text-left text-xs uppercase tracking-[0.16em] font-medium text-gray-500 dark:text-neutral-400">Email</th>
                      <th className="py-3 pr-6 text-left text-xs uppercase tracking-[0.16em] font-medium text-gray-500 dark:text-neutral-400">Role</th>
                      <th className="py-3 text-left text-xs uppercase tracking-[0.16em] font-medium text-gray-500 dark:text-neutral-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => {
                      const displayName = member.user?.display_name?.trim();
                      const email = member.user?.email?.trim();
                      const isCurrentManager = member.user_id === currentMembership.user_id;

                      return (
                        <tr key={member.user_id} className="border-b border-gray-100 dark:border-white/[0.06] last:border-b-0 transition hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                          <td className="py-4 pr-6 text-gray-900 dark:text-white">
                            {displayName || email || "Unknown User"}
                          </td>
                          <td className="py-4 pr-6 text-gray-500 dark:text-neutral-400">
                            {email || "Unknown Email"}
                          </td>
                          <td className="py-4 pr-6">
                            <form
                              action={updateMemberRoleForOrganization}
                              className="flex min-w-[220px] flex-col gap-2 md:flex-row md:items-center"
                            >
                              <input type="hidden" name="userId" value={member.user_id} />
                              <select
                                name="role"
                                defaultValue={member.role}
                                disabled={isCurrentManager}
                                className={inputClass}
                              >
                                {ORGANIZATION_MEMBER_ROLE_OPTIONS.map((role) => (
                                  <option key={role} value={role}>
                                    {role.replaceAll("_", " ")}
                                  </option>
                                ))}
                              </select>
                              <button type="submit" disabled={isCurrentManager} className={btnClass}>
                                Update
                              </button>
                            </form>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-col gap-2">
                              <form action={removeMemberFromOrganization}>
                                <input type="hidden" name="userId" value={member.user_id} />
                                <button
                                  type="submit"
                                  disabled={isCurrentManager}
                                  className="rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition hover:bg-red-100 dark:hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Remove
                                </button>
                              </form>
                              {isCurrentManager && (
                                <p className="text-xs text-gray-400 dark:text-neutral-500">
                                  Your own role/removal is disabled here.
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
