import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BackButton from "@/components/BackButton";

export const metadata = { title: "Organizations" };

type OrgMembershipRow = {
  org_id: string;
  role: string;
};

type OrganizationRow = {
  org_id: string;
  org_name: string;
  logo_path: string | null;
};

type OrganizationListItem = {
  org_id: string;
  org_name: string;
  role: string;
  logo_path: string | null;
  logo_url: string | null;
};

type OrganizationsPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function Organizations({
  searchParams,
}: OrganizationsPageProps) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const whoIsUser = await supabase.auth.getUser();
  const user = whoIsUser.data.user;

  let organizations: OrganizationListItem[] = [];
  let loadError = "";

  if (user != null) {
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

        const organizationResult = await supabase
          .from("organizations")
          .select("org_id, org_name")
          .in("org_id", orgIds);

        if (organizationResult.error) {
          loadError = organizationResult.error.message;
        } else {
          const orgRows = (organizationResult.data ?? []) as OrganizationRow[];
          const orgMap = new Map(
            orgRows.map((organization) => [organization.org_id, organization])
          );

          organizations = memberships
            .map((membership) => {
              const organization = orgMap.get(membership.org_id);
              if (!organization) return null;
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400">
              TreasuryHub
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              Your Organizations
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
              Pick an organization to open its members page.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/organizations/new"
              className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"
            >
              New Organization
            </Link>
            <BackButton />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {loadError && (
          <div className="mb-6 rounded-xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-400">
            Failed to load organizations: {loadError}
          </div>
        )}

        {!loadError && organizations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/[0.12] px-4 py-10 text-center text-sm text-gray-500 dark:text-neutral-400">
            You are not in any organizations yet.
          </div>
        )}

        {organizations.length > 0 && (
          <div className="flex flex-col gap-3">
            {organizations.map((organization) => (
              <Link
                key={organization.org_id}
                href={`/organizations/${organization.org_id}/members`}
                className="group rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-5 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)] transition hover:border-gray-300 dark:hover:border-white/[0.25] hover:bg-gray-50 dark:hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                      {organization.org_name}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
                      Role: {organization.role.replaceAll("_", " ")}
                    </p>
                  </div>
                  <span className="text-sm text-gray-400 dark:text-neutral-500 group-hover:text-gray-600 dark:group-hover:text-white transition">
                    Open →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
