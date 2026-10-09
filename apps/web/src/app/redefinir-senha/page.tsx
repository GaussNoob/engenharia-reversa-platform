import { PasswordRecovery } from "@nucleo/features/modules/auth/PasswordRecovery";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return <PasswordRecovery token={token} />;
}
