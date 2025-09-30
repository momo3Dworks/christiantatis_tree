import GlbSceneViewer from "@/components/glb-scene-viewer";
import React from "react";

const Home = React.memo(function Home() {
  return (
    <div className="relative w-full h-screen overflow-hidden">
      <GlbSceneViewer />
    </div>
  );
});

export default Home;
