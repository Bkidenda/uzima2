import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";

const Terms = () => (
  <div className="min-h-screen bg-background flex flex-col">
    <Navbar />
    <main className="flex-1">
      <PageHeader
        eyebrow="Legal"
        title="Terms & Conditions"
        description="The simple agreement between you and Uzima as a member of the community."
      />
      <section className="container max-w-3xl py-10 lg:py-14">
        <article className="space-y-6 text-sm leading-relaxed text-foreground">
          <p className="text-muted-foreground">Last updated: April 2026</p>

          <div>
            <h2 className="font-serif text-xl text-primary">1. Who can join</h2>
            <p className="mt-2 text-muted-foreground">
              Uzima is open to anyone who wants to nurture wholeness through faith, food,
              and community. By creating an account you confirm the information you
              provide is accurate and that you'll keep your password safe.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-primary">2. Community standards</h2>
            <p className="mt-2 text-muted-foreground">
              Be kind, honest, and edifying. Share recipes, devotions, articles, and
              comments that uplift others. Do not post content that is hateful, deceptive,
              sexually explicit, infringes copyright, or promotes harm.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-primary">3. Your content</h2>
            <p className="mt-2 text-muted-foreground">
              You own what you post. By sharing it on Uzima you grant us a non-exclusive
              license to display, distribute, and store it so other members can engage
              with it. You can delete your content at any time.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-primary">4. Health information</h2>
            <p className="mt-2 text-muted-foreground">
              Recipes, devotions, and articles on Uzima are for encouragement and general
              information. They are not medical advice. Always consult a qualified
              professional for health decisions.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-primary">5. Account suspension</h2>
            <p className="mt-2 text-muted-foreground">
              We may remove content or suspend accounts that violate these standards.
              You can also close your account at any time by emailing us.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-primary">6. Changes</h2>
            <p className="mt-2 text-muted-foreground">
              We may update these terms as Uzima grows. We'll let you know about important
              changes through the app or by email.
            </p>
          </div>

          <div>
            <h2 className="font-serif text-xl text-primary">7. Contact</h2>
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

export default Terms;
