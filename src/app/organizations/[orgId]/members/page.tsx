import Link from "next/link";
import {
  getOrganizationById,
  getOrganizationMembers,
  ORGANIZATION_MEMBER_ROLE_OPTIONS,
} from "@/lib/organizations";
import {
  addOrganizationMember,
  requireOrganizationMemberManagementAccess,
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

export default async function OrganizationMembersPage({
  params,
  searchParams,
}: MembersPageProps) {
  const { orgId } = await params;
  const { error, success } = await searchParams;

  // Still protect the page itself, same as PR1.
  await requireOrganizationMemberManagementAccess(orgId);

  // Load page data in parallel.
  const [organization, members] = await Promise.all([
    getOrganizationById(orgId),
    getOrganizationMembers(orgId),
  ]);

  // Bind orgId once so the form can just call the action directly.
  const addMemberForOrganization = addOrganizationMember.bind(null, orgId);

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

        {/* Simple success/error feedback after redirects from the server action */}
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
                defaultValue="member"
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
                Members already in this organization and the role they currently
                hold.
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
                    // Prefer display name, then email, then fallback text.
                    const displayName = member.user?.display_name?.trim();
                    const email = member.user?.email?.trim();

                    return (
                      <tr key={member.user_id} className="border-b last:border-b-0">
                        <td className="px-3 py-2">
                          {displayName || email || "Unknown User"}
                        </td>
                        <td className="px-3 py-2">{email || "Unknown Email"}</td>
                        <td className="px-3 py-2 capitalize">
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