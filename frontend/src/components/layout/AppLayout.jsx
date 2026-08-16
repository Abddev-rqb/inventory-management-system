import { Outlet } from "react-router-dom";

import ApplicationHeader from "./ApplicationHeader.jsx";
import ApplicationSidebar from "./ApplicationSidebar.jsx";

function AppLayout() {
  return (
    <div className="application-layout">
      <ApplicationHeader />

      <div className="application-body">
        <ApplicationSidebar />

        <main className="application-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AppLayout;