import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type OrgMembershipRow = {
  org_id: string;
  role: string;
};

type OrganizationRow = {
  org_id: string;
  org_name: string;
};

type OrganizationListItem = {
  org_id: string;
  org_name: string;
  role: string;
};

export default async function Organizations() {
  // This page is just the org selector for now.
  // Each organization links straight to that org's members page.
  const supabase = await createClient();

  const whoIsUser = await supabase.auth.getUser();
  const user = whoIsUser.data.user;

  let organizations: OrganizationListItem[] = [];
  let loadError = "";

  if (user != null) {
    // First get the current user's memberships.
    // We only need org_id and role here.
    const membershipResult = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id);

    if (membershipResult.error) {
      loadError = membershipResult.error.message;
    } else {
      const memberships = (membershipResult.data ?? []) as OrgMembershipRow[];

      if (memberships.length > 0) {
        const orgIds = memberships.map((membership) => membership.org_id);

        // Then load the matching organizations in a second query.
        // This avoids the nested relation typing issue that broke the build.
        const organizationResult = await supabase
          .from("organizations")
          .select("org_id, org_name")
          .in("org_id", orgIds);

        if (organizationResult.error) {
          loadError = organizationResult.error.message;
        } else {
          const orgRows = (organizationResult.data ?? []) as OrganizationRow[];

          // Build a small lookup map so we can pair each membership
          // with the matching organization name.
          const orgMap = new Map(
            orgRows.map((organization) => [organization.org_id, organization])
          );

          organizations = memberships
            .map((membership) => {
              const organization = orgMap.get(membership.org_id);

              if (!organization) {
                return null;
              }

              return {
                org_id: membership.org_id,
                org_name: organization.org_name,
                role: membership.role,
              };
            })
            .filter((item): item is OrganizationListItem => item !== null);
        }
      }
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Your Organizations</h1>
            <p className="text-sm text-gray-300">
              Pick an organization to open its members page.
            </p>
          </div>

          <Link href="/organizations/new">
            <button className="rounded border border-white p-2 text-white">
              Create New Organization
            </button>
          </Link>
        </div>

        {loadError && (
          <p className="text-red-500">
            Failed to load organizations: {loadError}
          </p>
        )}

        {!loadError && organizations.length === 0 && (
          <div className="rounded border border-white p-4">
            <p className="text-white">You are not in any organizations yet.</p>
          </div>
        )}

        {organizations.length > 0 && (
          <div className="flex flex-col gap-3">
            {organizations.map((organization) => (
              <Link
                key={organization.org_id}
                href={`/organizations/${organization.org_id}/members`}
                className="rounded border border-white p-4 hover:bg-white/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium">
                      {organization.org_name}
                    </h2>
                    <p className="text-sm text-gray-300">
                      Role: {organization.role.replaceAll("_", " ")}
                    </p>
                  </div>

                  <p className="text-sm underline">Open</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
