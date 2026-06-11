import { PageProps } from "$fresh/server.ts";
import ComponentDetail from "../../islands/ComponentDetail.tsx";
import OfflineQueueBanner from "../../islands/OfflineQueueBanner.tsx";

export default function ComponentPage(props: PageProps) {
  const id = props.params.id;

  return (
    <div>
      <ComponentDetail componentId={id} />
      <OfflineQueueBanner />
    </div>
  );
}
