import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export const metadata = {
  title: "Delete Account — Top Viso by Donkey Ideas",
  description:
    "Request deletion of your Top Viso account and associated data. Top Viso is developed by Donkey Ideas LLC.",
};

export default function DeleteAccountPage() {
  return (
    <>
      <Nav />
      <main className="bg-paper" style={{ padding: "80px 24px 120px" }}>
        <div className="mx-auto" style={{ maxWidth: "800px" }}>
          {/* Header */}
          <div className="mb-12">
            <h1
              className="font-display text-ink"
              style={{ fontSize: "40px", letterSpacing: "-0.025em", lineHeight: "1.1" }}
            >
              Delete Your Account
            </h1>
            <p
              className="mt-4 font-mono uppercase text-ink-3"
              style={{ fontSize: "12px", letterSpacing: "0.1em" }}
            >
              Account &amp; Data Removal
            </p>
          </div>

          {/* App identification */}
          <div
            className="mb-10"
            style={{
              padding: "16px 20px",
              backgroundColor: "rgba(0,0,0,0.03)",
              borderRadius: "8px",
              border: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <p className="text-ink-2" style={{ fontSize: "14px", lineHeight: "1.7" }}>
              <strong>Company:</strong> Top Viso
              <br />
              <strong>Developer:</strong> Donkey Ideas (DONKEY IDEAS LLC)
              <br />
              <strong>Package:</strong> com.topviso.mobile
              <br />
              <strong>Contact:</strong>{" "}
              <a href="mailto:info@donkeyideas.com" className="text-accent underline">info@donkeyideas.com</a>
              <br />
              <strong>Available on:</strong> Google Play Store &amp; Apple App Store
            </p>
          </div>

          {/* Instructions */}
          <div className="mb-10">
            <p className="text-ink-2" style={{ fontSize: "15px", lineHeight: "1.75" }}>
              If you would like to permanently delete your Top Viso account, published by Donkey Ideas LLC,
              you can do so by following the steps below. Please note that this action is irreversible
              and all your data will be permanently removed from our systems.
            </p>
          </div>

          {/* Steps */}
          <section className="mb-10">
            <h2
              className="font-display text-ink mb-4"
              style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
            >
              How to delete your account
            </h2>
            <ol
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75", paddingLeft: "20px", listStyleType: "decimal" }}
            >
              <li className="mb-3">
                Sign in to your account at{" "}
                <a href="https://www.topviso.com/settings" className="text-accent underline">
                  topviso.com/settings
                </a>
              </li>
              <li className="mb-3">
                Navigate to <strong>Settings</strong> &rarr; <strong>Profile</strong>
              </li>
              <li className="mb-3">
                Scroll to the bottom and click <strong>&quot;Delete Account&quot;</strong>
              </li>
              <li className="mb-3">
                Confirm the deletion by entering your email address
              </li>
            </ol>
          </section>

          {/* What gets deleted */}
          <section className="mb-10">
            <h2
              className="font-display text-ink mb-4"
              style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
            >
              What data is deleted
            </h2>
            <ul
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75", paddingLeft: "20px", listStyleType: "disc" }}
            >
              <li className="mb-2">Your account credentials and profile information</li>
              <li className="mb-2">All tracked apps, keywords, and analysis results</li>
              <li className="mb-2">Competitor data and historical reports</li>
              <li className="mb-2">Review sentiment data and alerts</li>
              <li className="mb-2">API keys and webhook configurations</li>
              <li className="mb-2">Billing and subscription information</li>
            </ul>
          </section>

          {/* Timeline */}
          <section className="mb-10">
            <h2
              className="font-display text-ink mb-4"
              style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
            >
              Deletion timeline
            </h2>
            <p className="text-ink-2" style={{ fontSize: "15px", lineHeight: "1.75" }}>
              Once you confirm deletion, your account will be immediately deactivated. All personal
              data will be permanently removed from our systems within 30 days. During this period,
              you will not be able to recover your account or data.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-10">
            <h2
              className="font-display text-ink mb-4"
              style={{ fontSize: "22px", letterSpacing: "-0.02em" }}
            >
              Need help?
            </h2>
            <p className="text-ink-2" style={{ fontSize: "15px", lineHeight: "1.75" }}>
              If you are unable to access your account or need assistance with deletion, contact
              Donkey Ideas LLC (the developer of Top Viso) at{" "}
              <a href="mailto:info@donkeyideas.com" className="text-accent underline">
                info@donkeyideas.com
              </a>{" "}
              with the subject line &quot;Account Deletion Request&quot; and we will process your
              request within 5 business days.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
