"use client";
import Link from "next/link";
import Image from "next/image";
import OrgDropDown from "@/components/OrgDropDown";

type NavbarProps = {
  organizations: {
    org_id: string;
    org_name: string;
    role: string;
    logo_url?: string | null;
  }[];
  currentOrgId: string;
  currentOrgName: string;
  currentUserRole: string;
  basePath: string;
  pageTitle: string;
  logoSrc?: string | null;
  logoAlt?: string;
};


export default function Navbar({
  organizations,
  currentOrgId,
  currentOrgName,
  currentUserRole,
  basePath,
  pageTitle,
  logoSrc,
  logoAlt = "TreasuryHub logo",
}: NavbarProps) {
  const canEditLogo = ["treasurer", "advisor"].includes(
    currentUserRole.toLowerCase()
  );
  return (
    <nav
      className="
        font-[var(--font-geist-sans)]
        w-full
        border-b border-gray-200 dark:border-white/[0.08]
        bg-background text-foreground
        px-5 py-4
        backdrop-blur-md
        relative z-[9999]
      "
    >
      <div className="mx-auto flex w-full max-w-[90rem] px-6 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          {canEditLogo ? (
            <Link
              href={`/organizations/${currentOrgId}/settings`}
              className="group"
              title={`Edit ${currentOrgName} logo`}
            >
              <div
                className="
                  flex h-12 w-12 items-center justify-center overflow-hidden
                  rounded-xl border border-gray-300 dark:border-white/[0.12]
                  bg-white dark:bg-white/[0.03]
                  transition
                  hover:border-gray-400 dark:hover:border-white/[0.25]
                  hover:bg-gray-100 dark:hover:bg-white/[0.06]
                "
              >
                {logoSrc ? (
                  <Image
                    src={logoSrc}
                    alt={logoAlt}
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">TH</span>
                )}
              </div>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() =>
                window.alert("Only treasurers and advisors can change the organization logo.")
              }
              title="You do not have permission to edit the logo"
              className="
                flex h-12 w-12 items-center justify-center overflow-hidden
                rounded-xl border border-gray-300 dark:border-white/[0.12]
                bg-white dark:bg-white/[0.03]
                transition
                hover:border-gray-400 dark:hover:border-white/[0.25]
                hover:bg-gray-100 dark:hover:bg-white/[0.06]
              "
            >
              {logoSrc ? (
                <Image
                  src={logoSrc}
                  alt={logoAlt}
                  width={56}
                  height={56}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-sm font-semibold text-gray-900 dark:text-white">TH</span>
              )}
            </button>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                {currentOrgName}
              </span>

              <span className="text-neutral-400 dark:text-neutral-500">•</span>

              <span className="text-lg font-medium tracking-tight text-gray-600 dark:text-neutral-400">
                {pageTitle}
              </span>
            </div>

            <div className="mt-1">
              <OrgDropDown
                organizations={organizations}
                currentOrgId={currentOrgId}
                basePath={basePath}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/settings"
            className="
              text-sm font-medium text-gray-700 transition
              hover:text-gray-950
              dark:text-neutral-300 dark:hover:text-white
            "
          >
            Account Settings
          </Link>

          <Link
            href={`/organizations/${currentOrgId}/members`}
            className="
              text-sm font-medium text-gray-700 transition
              hover:text-gray-950
              dark:text-neutral-300 dark:hover:text-white
            "
          >
            Organization Settings
          </Link>

          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="
                text-sm font-medium text-gray-700 transition
                hover:text-gray-950
                dark:text-neutral-300 dark:hover:text-white
              "
            >
              Sign Out
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}