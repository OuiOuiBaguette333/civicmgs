import { ErrorBoundary } from "@components/ErrorBoundary";
import { useScenario } from "@hooks/useScenario";
import { useView } from "@hooks/useView";
import { DashboardPage } from "@pages/DashboardPage";
import { HomePage } from "@pages/HomePage";

import "./App.css";

/**
 * Everything that can throw lives under the boundary, including the scenario
 * hook — a failed history write from inside App itself would otherwise take
 * the whole page down with nothing left to draw the message.
 */
function Pages() {
  const scenario = useScenario();

  // A shared link names a suburb, so it opens on the scenario it was sent for
  // rather than dropping the reader on the front page.
  const [view, setView] = useView(scenario.openedWithLocation ? "dashboard" : "home");

  return view === "home" ? (
    <HomePage
      onOpenDashboard={() => setView("dashboard")}
      onSelectArea={location => {
        scenario.setLocation(location);
        setView("dashboard");
      }}
    />
  ) : (
    <DashboardPage onBack={() => setView("home")} scenario={scenario} />
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Pages />
    </ErrorBoundary>
  );
}

export default App;
