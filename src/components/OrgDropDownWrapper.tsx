'use client'

import OrgDropDown from "@/components/OrgDropDown"
import { useSearchParams } from "next/navigation";
import { usePathname } from "next/navigation"
import { type OrgOptions } from "@/app/transaction/lib/schemas"

// Returns single orgId from URL
// Default: Returns first orgId if no orgId found in URL
export function fetchCurrentOrgFromURL(organizations : { org_id: string }[]) {
  const searchParams = useSearchParams();
  const orgIdFromURL = searchParams.get("orgId");
  return orgIdFromURL ?? organizations[0].org_id;
}

export default function OrgDropDownWrapper( { organizations } : {organizations : OrgOptions[]}) {
  const currentOrgId = fetchCurrentOrgFromURL(organizations);
  const basePath = usePathname();

  if (!currentOrgId) return null;

  return (
    <OrgDropDown
      organizations={organizations}
      currentOrgId={currentOrgId}
      basePath={basePath}
    />
  );
}
