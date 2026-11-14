import type { ReactNode } from "react";
import { ExplorerBar } from "@/components/explorer-bar";

/**
 * The Explorer: the experiments, the safety topics and the data table are three views of the
 * same archive, so they share one bar: the way between them, and one SI for all three.
 */
export default function ExplorerLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <ExplorerBar />
      {children}
    </>
  );
}
