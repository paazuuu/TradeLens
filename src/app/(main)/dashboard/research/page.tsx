import { PageHeader } from "../_components/page-header";
import { ResearchWorkspace } from "./_components/research-workspace";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <PageHeader section="research" />
      <ResearchWorkspace />
    </div>
  );
}
