import { ErrorBoundary } from "@components/ErrorBoundary";
import { DashboardPage } from "@pages/DashboardPage";

import "./App.css";

function App() {
  return (
    <ErrorBoundary>
      <DashboardPage />
    </ErrorBoundary>
  );
}

export default App;
