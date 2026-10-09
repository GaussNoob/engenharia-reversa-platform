import { AuthPage } from "@nucleo/features/components/AuthPage";
export const metadata = {
  title: "Criar conta",
  robots: { index: false, follow: false },
};
export default function SignUpPage() {
  return <AuthPage signup />;
}
