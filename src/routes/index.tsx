import { useEffect, useState, type ComponentType } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Background } from "@/components/chrome";
import { applyTheme, savedTheme } from "@/lib/bank-constants";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [App, setApp] = useState<ComponentType | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    applyTheme(savedTheme());
    let live = true;
    void import("@/components/bank-app")
      .then((mod) => {
        if (live) setApp(() => mod.BankApp);
      })
      .catch(() => {
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, []);

  if (!App) {
    return (
      <>
        <Background />
        <main className="shell">
          <h1>بنك تيته امال الدولي</h1>
          <p className="sub">بنك العيلة · الحد الأقصى 10 حسابات</p>
          <div className="glass">{failed ? "تعذر فتح البنك" : "جاري التحميل..."}</div>
        </main>
      </>
    );
  }

  return <App />;
}
