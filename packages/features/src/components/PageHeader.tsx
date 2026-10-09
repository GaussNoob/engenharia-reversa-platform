import { Link } from "@nucleo/platform";
import { Search } from "lucide-react";
export function PageHeader({
  section,
  detail,
  children,
}: {
  section: string;
  detail?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div className="breadcrumb">
        <Link href="/dashboard">Workspace</Link>
        <span className="crumb-separator">/</span>
        <strong>{section}</strong>
        {detail && (
          <>
            <span className="crumb-separator">/</span>
            <span>{detail}</span>
          </>
        )}
      </div>
      <div className="header-actions">{children}</div>
    </header>
  );
}
