'use client'

import OrgDropDown from "@/components/OrgDropDown"
import { usePathname } from "next/navigation"
import { type OrgOptions } from "@/app/transaction/lib/schemas"

export default function OrgDropDownWrapper({ organizations, orgId }: {
  organizations: OrgOptions[],
  orgId: string
}) {
  const basePath = usePathname();

  if (!orgId) return null;

  return (
    <OrgDropDown
      organizations={organizations}
      currentOrgId={orgId}
      basePath={basePath}
    />
  );
}
