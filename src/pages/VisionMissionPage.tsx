import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import VisionMission from "@/components/VisionMission";

const VisionMissionPage = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1">
      <PageHeader eyebrow="Our heart" title="Vision & Mission" description="Why Uzima exists, and where we are headed together." />
      <VisionMission />
    </main>
    <Footer />
  </div>
);

export default VisionMissionPage;
