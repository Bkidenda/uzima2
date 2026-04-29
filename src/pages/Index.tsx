import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import VerseBanner from "@/components/VerseBanner";
import Featured from "@/components/Featured";
import HowItWorks from "@/components/HowItWorks";
import VisionMission from "@/components/VisionMission";
import Team from "@/components/Team";
import Contact from "@/components/Contact";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Categories />
        <VerseBanner />
        <Featured />
        <VisionMission />
        <HowItWorks />
        <Team />
        <Contact />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
