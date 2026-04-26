//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// getDiff
// Compares before and after objects and
// returns only the fields that have changed
//
// Responsibilities:
// - field: property name
// - oldValue: value from the before object (or "-" if undefined)
// - newValue: value from the after object (or "-" if undefined) 

export function getDiff(before: any, after: any) {
    const beforeObj = before ?? {};
    const afterObj = after ?? {};

  const fields = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]);
  const changes = [];

  for (const field of fields) {
    const beforeValue = beforeObj[field];
    const afterValue = afterObj[field];

    if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
      changes.push({
        field,
        oldValue: beforeObj[field] ?? "-",
        newValue: afterObj[field] ?? "-",
      });
    }
  }

  return changes;
}
