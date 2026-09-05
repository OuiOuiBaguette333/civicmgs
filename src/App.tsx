import { ErrorBoundary } from "@components/ErrorBoundary";
import { useScenario } from "@hooks/useScenario";
import { DashboardPage } from "@pages/DashboardPage";
import { HomePage } from "@pages/HomePage";
import { useState } from "react";

import "./App.css";

type View = "home" | "dashboard";

function App() {
  const scenario = useScenario();

  // A shared link names a suburb, so it opens on the scenario it was sent for
  // rather than dropping the reader on the front page.
  const [view, setView] = useState<View>(scenario.openedWithLocation ? "dashboard" : "home");

  return (
    <ErrorBoundary>
      {view === "home" ? (
        <HomePage
          onOpenDashboard={() => setView("dashboard")}
          onSelectArea={location => {
            scenario.setLocation(location);
            setView("dashboard");
          }}
        />
      ) : (
        <DashboardPage onBack={() => setView("home")} scenario={scenario} />
      )}
    </ErrorBoundary>
  );
}

export default App;
