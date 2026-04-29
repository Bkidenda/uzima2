import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import VisionMission from "@/components/VisionMission";
import Team from "@/components/Team";

const About = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <PageHeader
          eyebrow="About"
          title="A faith-centered community."
          description="Uzima is a welcoming home for believers who want to nourish body and spirit together — through wholesome food, scripture, and shared encouragement."
        />
        <section className="container py-10 max-w-3xl space-y-6">
          <p className="text-muted-foreground leading-relaxed">
            Uzima — meaning <em>life</em> in Swahili — exists because we believe health and faith were
            never meant to be separate. We come together to share recipes that honor God's design for
            our bodies, devotions that nourish the soul, and friendships that carry us forward.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            This is not a content publication. It is a community — built by its members, for its
            members. Every recipe, every devotion, every encouragement comes from someone in this
            community who chose to share what God has placed on their heart.
          </p>
          <p className="font-serif italic text-primary text-lg">
            "Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth." — 3 John 1:2
          </p>
        </section>
        <VisionMission />
        <Team />
      </main>
      <Footer />
    </div>
  );
};

export default About;
