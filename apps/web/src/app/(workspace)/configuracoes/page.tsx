import { getUser } from "@/lib/server-api";
import { AccountSettings } from "@nucleo/features/modules/auth/AccountSettings";
export default async function Page() {
  await getUser();
  return <AccountSettings />;
}
