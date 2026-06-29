const IMMUTABLE_STATUSES = new Set(["issued", "submitted", "certified"]);

export function assertNotImmutable(record: {
  is_immutable?: boolean;
  issued_at?: string | null;
  status?: string;
}): void {
  const lockedByStatus =
    record.status !== undefined && IMMUTABLE_STATUSES.has(record.status);

  if (record.is_immutable === true || lockedByStatus) {
    const dateStr = record.issued_at
      ? new Date(record.issued_at).toLocaleDateString("en-GB")
      : "unknown";
    throw new Error(
      `This record is immutable and cannot be modified. Issue date: ${dateStr}`
    );
  }
}
