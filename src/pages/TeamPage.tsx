import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import Team from "@/components/Team";

const TeamPage = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1">
      <PageHeader eyebrow="Our team" title="The people behind Uzima" description="A small team that cares deeply about faith, health, and the friendships that grow between them." />
      <Team />
    </main>
    <Footer />
  </div>
);

export default TeamPage;
