import "./style.css";

import "./tailwind.css";
import React from "react";

export default function LayoutDefault({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex max-w-2xl m-auto">
      <Content>{children}</Content>
    </div>
  );
}

function Content({ children }: { children: React.ReactNode }) {
  return (
    <div id="page-content" className="p-5 pb-12 min-h-screen w-full">
      {children}
    </div>
  );
}
