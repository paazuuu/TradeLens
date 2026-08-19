import { PageHeader } from "../_components/page-header";
import { SettingsForm } from "./_components/settings-form";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="settings" />
      <SettingsForm />
    </div>
  );
}
