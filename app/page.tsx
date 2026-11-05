import ControlsPanel from "@/components/ControlPanel";
import StatusPanel from "@/components/StatusPanel";
import { Navbar } from "../components/Navbar";
import RightSidebar from "../components/RightSidebar";
import VisualizationPanel from "../components/VisualizationPanel";
import LeftSidebar from "../components/LeftSidebar";

const App = () => {
  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden bg-black text-white">
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">
        <div className="hidden lg:flex flex-col h-full flex-none w-80 border-r">
          <LeftSidebar />
        </div>

        <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="absolute top-4 left-0 right-0 z-10 flex justify-center pointer-events-none">
            <StatusPanel />
          </div>

          <div className="flex-1 w-full h-full flex items-center justify-center">
            <VisualizationPanel />
          </div>

          <div className="absolute bottom-6 md:bottom-8 left-0 right-0 flex justify-center z-20 px-4 pointer-events-none">
            <div className="pointer-events-auto">
              <ControlsPanel />
            </div>
          </div>
        </main>

        <div className="hidden lg:flex flex-col h-full flex-none w-80 border-l">
          <RightSidebar />
        </div>
      </div>
    </div>
  );
};

export default App;
