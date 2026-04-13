import { z } from "zod"

// Database

export const TransactionsSchema = z.object({
  transaction_id: z.uuid(),
  org_id: z.uuid(),
  date: z.coerce.date<string>().max(new Date(), "Date cannot be in future"),
  description: z.string().nonempty("Please add description"),
  category: z.string().nonempty("Please add category"),
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be greater than $0.00"),
  notes: z.string().nullish(),
  created_by: z.uuid().nullish(),
});

export const OrgMembersSchema = z.object({
  user_id: z.uuid(),
  org_id: z.uuid(),
  role: z.enum(["member", "executive", "advisor", "treasury_team", "treasury_team", "treasurer", "admin"]),
});

export const OrganizationsSchema = z.object({
  org_id: z.uuid(),
  org_name: z.string(),
  description: z.string().nullish(),
  created_at: z.iso.datetime(),
});

// Extra

export const ActionStateSchema = z.object({
  errors: z.record( z.string(), z.array(z.string()) ).optional(),
  message: z.union([z.string(), z.array(z.string()), z.undefined()]).optional(),
}).nullish();

export const OrgOptionsSchema = z.object({
  ...OrganizationsSchema.pick({org_id: true, org_name: true}).shape,
  ...OrgMembersSchema.pick({role: true}).shape,
})

// Database
export type Transactions = z.infer<typeof TransactionsSchema>
export type Organizations = z.infer<typeof OrganizationsSchema>
export type OrgMembers = z.infer<typeof OrgMembersSchema>

// Extra
export type ActionState = z.infer<typeof ActionStateSchema>
export type OrgOptions = z.infer<typeof OrgOptionsSchema>
