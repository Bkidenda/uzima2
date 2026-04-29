import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

const Privacy = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1">
      <PageHeader
        eyebrow="Legal"
        title="Privacy Policy"
        description="How we collect, use, and protect your information at Uzima."
      />
      <section className="container max-w-3xl py-10 lg:py-14 prose prose-sm prose-neutral">
        <article className="space-y-6 text-sm leading-relaxed text-foreground">
          <p className="text-muted-foreground">Last updated: April 2026</p>

          <div>
            <h2 className="font-serif text-xl text-primary">1. What we collect</h2>
            <p className="mt-2 text-muted-foreground">
              When you create an account we collect your email, a username (you choose it
              or we generate one for you), and any profile details you add (display name,
              bio, avatar). We also store the content you post — recipes, devotions,
              articles, comments, messages — so the community can see and interact with it.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-primary">2. How we use it</h2>
            <p className="mt-2 text-muted-foreground">
              We use your information to operate the platform: showing your posts to other
              members, delivering messages, securing your account, and improving the
              experience. We do not sell your personal data.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-primary">3. What others can see</h2>
            <p className="mt-2 text-muted-foreground">
              Your username, profile, and posts are visible to the community. Direct
              messages are only visible to the people in that conversation. Community
              chatroom messages are visible to members of that community.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-primary">4. Your choices</h2>
            <p className="mt-2 text-muted-foreground">
              You can edit your profile, delete your posts and comments, leave communities,
              or sign out at any time. To delete your account or request a copy of your
              data, email us at <a className="text-primary underline" href="mailto:info@uzimacommunity.com">info@uzimacommunity.com</a>.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-primary">5. Security</h2>
            <p className="mt-2 text-muted-foreground">
              We use industry-standard authentication and row-level security to protect
              your account and content. No system is perfect — please use a strong,
              unique password.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-primary">6. Contact</h2>
            <p className="mt-2 text-muted-foreground">
              Questions? Reach us at <a className="text-primary underline" href="mailto:info@uzimacommunity.com">info@uzimacommunity.com</a>
              {" "}or +254 742 205 755.
            </p>
          </div>
        </article>
      </section>
    </main>
    <Footer />
  </div>
);

export default Privacy;
