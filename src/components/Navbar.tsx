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
  basePath: string;
  pageTitle: string;
  logoSrc?: string  | null;
  logoAlt?: string;
};

export default function Navbar({
  organizations,
  currentOrgId,
  currentOrgName,
  basePath,
  pageTitle,
  logoSrc,
  logoAlt = "TreasuryHub logo",
}: NavbarProps) {
  return (
    <nav
      className="
        font-[var(--font-geist-sans)]
        border-b border-white/[0.08]
        bg-black/80
        px-5 py-4
        backdrop-blur-md
      "
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href={`/organizations/${currentOrgId}/settings`}
            className="group"
            title={`Edit ${currentOrgName} logo`}
          >
            <div
              className="
                flex h-12 w-12 items-center justify-center overflow-hidden
                rounded-xl border border-white/[0.12]
                bg-white/[0.03] transition
                hover:border-white/[0.25] hover:bg-white/[0.06]
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
                <span className="text-sm font-semibold text-white">TH</span>
              )}
            </div>
          </Link>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold tracking-tight text-white">
                {currentOrgName}
              </span>

              <span className="text-neutral-500">•</span>

              <span className="text-lg font-medium tracking-tight text-neutral-400">
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
            <p className="mt-2 text-xs text-neutral-500">
              Click the logo to edit this organization’s logo.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/organizations/${currentOrgId}/members`}
            className="
              text-sm font-medium text-neutral-300 transition
              hover:text-white
            "
          >
            Organization Settings
          </Link>

          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="
                text-sm font-medium text-neutral-300 transition
                hover:text-white
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