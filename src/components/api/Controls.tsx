import { Button } from "@/components/ui/button";
import { ApiError, type Pagination as PageInfo } from "@/lib/api";
export const fieldClass =
  "mt-2 block w-full min-w-0 rounded-md border border-input bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
export function ErrorMessage({ error }: { error: unknown }) {
  return error ? (
    <p
      role="alert"
      className="my-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
    >
      {error instanceof Error
        ? error.message
        : "Unable to complete the request."}
    </p>
  ) : null;
}
export function FieldErrors({ error, name }: { error: unknown; name: string }) {
  return error instanceof ApiError ? (
    <>
      {error.details
        .filter(
          (detail) =>
            detail.path === name ||
            detail.path.startsWith(name + ".") ||
            detail.path === "body." + name,
        )
        .map((detail, index) => (
          <p key={index} className="mt-1 text-sm text-red-700">
            {detail.message}
          </p>
        ))}
    </>
  ) : null;
}
export function Pagination({
  pagination,
  page,
  onPage,
}: {
  pagination?: PageInfo;
  page: number;
  onPage: (page: number) => void;
}) {
  return pagination ? (
    <nav
      aria-label="Pagination"
      className="mt-6 flex flex-wrap items-center justify-center gap-4"
    >
      <Button
        type="button"
        variant="outline"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        Previous
      </Button>
      <span className="text-sm">
        Page {page} of {Math.max(1, pagination.pages)} · {pagination.total}{" "}
        items
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={page >= pagination.pages}
        onClick={() => onPage(page + 1)}
      >
        Next
      </Button>
    </nav>
  ) : null;
}
