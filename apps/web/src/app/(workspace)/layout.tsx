import { Navigation } from "@/components/Navigation";
export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      <div className="app-content">{children}</div>
    </>
  );
}
