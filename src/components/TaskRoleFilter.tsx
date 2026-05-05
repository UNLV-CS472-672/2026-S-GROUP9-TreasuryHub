"use client";

type TaskRoleFilterProps = {
  orgId: string;
  roleOptions: string[];
  selectedRole: string;
};

export default function TaskRoleFilter({
  orgId,
  roleOptions,
  selectedRole,
}: TaskRoleFilterProps) {
  return (
    <form method="GET">
      <input type="hidden" name="orgId" value={orgId} />

      <select
        name="taskRole"
        defaultValue={selectedRole}
        onChange={(e) => e.currentTarget.form?.submit()}
        className="
          rounded-xl
          border border-gray-200 dark:border-white/[0.2]
          bg-white dark:bg-neutral-900
          px-4 py-2
          text-sm font-medium
          text-gray-900 dark:text-white
          transition
          hover:border-gray-300 dark:hover:border-white/[0.35]
          hover:bg-gray-50 dark:hover:bg-white/[0.08]
        "
        style={{ colorScheme: "light dark" }}
      >
        <option value="all" className="bg-white text-gray-900 dark:bg-neutral-900 dark:text-white">
          All roles
        </option>

        {roleOptions.map((role) => (
          <option
            key={role}
            value={role}
            className="bg-white text-gray-900 dark:bg-neutral-900 dark:text-white"
          >
            {role}
          </option>
        ))}
      </select>
    </form>
  );
}