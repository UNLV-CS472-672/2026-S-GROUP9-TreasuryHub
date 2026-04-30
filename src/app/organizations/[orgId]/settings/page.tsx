import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateOrganizationLogo } from "./actions";

type OrgSettingsPageProps = {
  params: Promise<{
    orgId: string;
  }>;
};

export const metadata = { title: "Settings" };

export default async function OrgSettingsPage({
  params,
}: OrgSettingsPageProps) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <p className="text-sm text-gray-500 dark:text-neutral-400">You must be signed in.</p>
        </div>
      </main>
    );
  }

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", orgId)
    .eq("user_id", user.id)
    .single();

  const allowedRoles = ["treasurer", "advisor", "executive", "admin"];

  if (!membership || !allowedRoles.includes(membership.role.toLowerCase())) {
    redirect(`/?orgId=${orgId}`);
  }

  const { data: organization, error } = await supabase
    .from("organizations")
    .select("org_id, org_name, logo_path")
    .eq("org_id", orgId)
    .single();

  if (error || !organization) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
          <p className="text-sm text-gray-500 dark:text-neutral-400">Organization not found.</p>
        </div>
      </main>
    );
  }

  let signedLogoUrl: string | null = null;

  if (organization.logo_path) {
    const { data: signedUrlData } = await supabase.storage
      .from("organization-logos")
      .createSignedUrl(organization.logo_path, 60 * 60);
    signedLogoUrl = signedUrlData?.signedUrl ?? null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-8 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-500 dark:text-neutral-400">
              Organization Settings
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
              {organization.org_name}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-neutral-400">
              Upload a logo for this organization.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-xl border border-gray-200 dark:border-white/[0.2] bg-white dark:bg-white/[0.05] px-4 py-2 text-sm font-medium text-gray-700 dark:text-white transition hover:bg-gray-100 dark:hover:bg-white/[0.08]"
          >
            Back to Dashboard
          </Link>
        </div>

        <section className="rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 dark:text-neutral-300">Current Logo</p>
            <div className="mt-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 dark:border-white/[0.12] bg-gray-50 dark:bg-black/40">
              {signedLogoUrl ? (
                <Image
                  src={signedLogoUrl}
                  alt={`${organization.org_name} logo`}
                  width={112}
                  height={112}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {organization.org_name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <form
            action={updateOrganizationLogo.bind(null, { orgId })}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm text-gray-600 dark:text-neutral-300">
                Upload new logo
              </label>
              <input
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                required
                className="block w-full rounded-xl border border-gray-200 dark:border-white/[0.12] bg-white dark:bg-white/[0.03] px-4 py-3 text-sm text-gray-900 dark:text-white file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 dark:file:bg-white/[0.08] file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 dark:file:text-white"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm font-medium text-blue-700 dark:text-blue-300 transition hover:bg-blue-500/20"
            >
              Save Logo
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
