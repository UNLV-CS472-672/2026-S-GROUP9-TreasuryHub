import Link from "next/link";
import {
  getOrganizationById,
  getOrganizationMembers,
} from "@/lib/organizations";
import { requireOrganizationMemberManagementAccess } from "./actions";

type MembersPageProps = {
  params: Promise<{
    orgId: string;
  }>;
};

export default async function OrganizationMembersPage({
  params,
}: MembersPageProps) {
  // Grab the dynamic org id from the route.
  // This page is meant to live under one specific organization.
  const { orgId } = await params;

  // Before we show anything, make sure this user is actually allowed
  // to manage members for this org. If not, the helper will redirect.
  await requireOrganizationMemberManagementAccess(orgId);

  // Load the org info and its members at the same time since the page
  // needs both anyway.
  const [organization, members] = await Promise.all([
    getOrganizationById(orgId),
    getOrganizationMembers(orgId),
  ]);

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

          <Link href="/organizations" className="underline">
            Back to Organizations
          </Link>
        </div>

        <section className="rounded border p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium">Current Members</h2>
              <p className="text-sm">
                This PR is intentionally read-only for now. The actual add/update/remove
                actions should go in PR 2.
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
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => {
                    // If display_name is blank/null, fall back to something reasonable
                    // so the table still looks clean.
                    const displayName = member.users?.display_name?.trim();
                    const email = member.users?.email ?? "Unknown email";

                    return (
                      <tr key={member.user_id} className="border-b last:border-b-0">
                        <td className="px-3 py-2">{displayName || "Unnamed User"}</td>
                        <td className="px-3 py-2">{email}</td>
                        <td className="px-3 py-2 capitalize">
                          {/* Convert values like treasury_team into treasury team
                              so the UI reads more naturally. */}
                          {member.role.replaceAll("_", " ")}
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