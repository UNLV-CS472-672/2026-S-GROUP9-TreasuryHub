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

  // Still protect the page itself, same as PR1.
  const currentMembership =
    await requireOrganizationMemberManagementAccess(orgId);

  // Load page data in parallel.
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
      <main className="min-h-screen bg-black p-6 text-white">
        <p>Organization not found.</p>
      </main>
    );
  }

  // Bind orgId once so the forms can just call the actions directly.
  const addMemberForOrganization = addOrganizationMember.bind(null, orgId);
  const updateMemberRoleForOrganization =
    updateOrganizationMemberRole.bind(null, orgId);
  const removeMemberFromOrganization = removeOrganizationMember.bind(null, orgId);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm">Organization Members</p>
            <h1 className="text-2xl font-semibold">
              {organization?.org_name ?? "Organization"}
            </h1>
            <p className="text-sm">
              Only treasurers and admins can manage members.
            </p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Link
              href={`/?orgId=${orgId}`}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
            >
              Dashboard
            </Link>

            <Link
              href="/organizations"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition"
            >
              All Organizations
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-3 text-center">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/5 sm:h-28 sm:w-28 md:h-32 md:w-32">
            {signedLogoUrl ? (
              <Image
                src={signedLogoUrl}
                alt={`${organization.org_name} logo`}
                width={128}
                height={128}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-2xl font-semibold text-white md:text-3xl">
                {organization.org_name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <Link
            href={`/organizations/${organization.org_id}/settings`}
            className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Edit Logo
          </Link>
        </div>


        {success && (
          <div className="rounded border border-green-500/50 bg-green-500/10 p-3 text-sm text-green-200">
            {success}
          </div>
        )}

        {error && (
          <div className="rounded border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="rounded border p-4">
          <div className="mb-4">
            <h2 className="text-lg font-medium">Add Member</h2>
            <p className="text-sm">
              Add an existing TreasuryHub user to this organization by email.
            </p>
          </div>

          <form
            action={addMemberForOrganization}
            className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end"
          >
            <label className="flex flex-col gap-2 text-sm">
              <span>Email</span>
              <input
                name="email"
                type="email"
                required
                placeholder="member@example.com"
                className="rounded border bg-transparent px-3 py-2"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span>Role</span>
              <select
                name="role"
                defaultValue={ORGANIZATION_ROLE.MEMBER}
                className="rounded border bg-transparent px-3 py-2"
              >
                {ORGANIZATION_MEMBER_ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="rounded border px-4 py-2">
              Add Member
            </button>
          </form>
        </section>

        <section className="rounded border p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Current Members</h2>
              <p className="text-sm">
                Update roles or remove members from this organization.
              </p>
            </div>
          </div>

          {members.length === 0 ? (
            <p className="text-sm">No members were found for this organization.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Role</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    const displayName = member.user?.display_name?.trim();
                    const email = member.user?.email?.trim();
                    const isCurrentManager =
                      member.user_id === currentMembership.user_id;

                    return (
                      <tr key={member.user_id} className="border-b last:border-b-0">
                        <td className="px-3 py-2">
                          {displayName || email || "Unknown User"}
                        </td>
                        <td className="px-3 py-2">{email || "Unknown Email"}</td>
                        <td className="px-3 py-2">
                          <form
                            action={updateMemberRoleForOrganization}
                            className="flex min-w-[220px] flex-col gap-2 md:flex-row md:items-center"
                          >
                            <input type="hidden" name="userId" value={member.user_id} />

                            <select
                              name="role"
                              defaultValue={member.role}
                              disabled={isCurrentManager}
                              className="rounded border bg-transparent px-3 py-2"
                            >
                              {ORGANIZATION_MEMBER_ROLE_OPTIONS.map((role) => (
                                <option key={role} value={role}>
                                  {role.replaceAll("_", " ")}
                                </option>
                              ))}
                            </select>

                            <button
                              type="submit"
                              disabled={isCurrentManager}
                              className="rounded border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Update Role
                            </button>
                          </form>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col gap-2">
                            <form action={removeMemberFromOrganization}>
                              <input type="hidden" name="userId" value={member.user_id} />
                              <button
                                type="submit"
                                disabled={isCurrentManager}
                                className="rounded border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Remove Member
                              </button>
                            </form>

                            {isCurrentManager && (
                              <p className="text-xs text-gray-400">
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
    </main>
  );
}