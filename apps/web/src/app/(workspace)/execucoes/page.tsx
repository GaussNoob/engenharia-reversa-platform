import { getUser } from "@/lib/server-api";
import { ExecutionHistory } from "@nucleo/features/modules/labs/ExecutionHistory";
export default async function Page() {
  await getUser();
  return <ExecutionHistory />;
}
