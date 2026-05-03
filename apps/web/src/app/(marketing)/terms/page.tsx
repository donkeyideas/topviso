import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export default function TermsPage() {
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
              Terms of Service
            </h1>
            <p
              className="mt-4 font-mono uppercase text-ink-3"
              style={{ fontSize: "12px", letterSpacing: "0.1em" }}
            >
              Last updated: April 23, 2026
            </p>
          </div>

          {/* Introduction */}
          <div className="mb-10">
            <p className="text-ink-2" style={{ fontSize: "15px", lineHeight: "1.75" }}>
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of the
              services, website, and platform (collectively, the &quot;Services&quot;) provided by
              Top Viso INC (&quot;Top Viso,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). Please
              read these Terms carefully before using our Services. By accessing or using our
              Services, you agree to be bound by these Terms.
            </p>
          </div>

          {/* 1. Acceptance of Terms */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              1. Acceptance of Terms
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              By creating an account, accessing, or using our Services, you acknowledge that you have
              read, understood, and agree to be bound by these Terms and our{" "}
              <a href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </a>
              . If you are using the Services on behalf of an organization, you represent and warrant
              that you have the authority to bind that organization to these Terms, and
              &quot;you&quot; refers to both you individually and the organization.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              If you do not agree to these Terms, you must not access or use our Services. We reserve
              the right to modify these Terms at any time. We will notify you of material changes by
              posting the updated Terms on our website and updating the &quot;Last updated&quot;
              date. Your continued use of the Services after such changes constitutes your acceptance
              of the revised Terms.
            </p>
          </section>

          {/* 2. Account Registration */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              2. Account Registration
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              To access certain features of our Services, you must create an account. When
              registering, you agree to:
            </p>
            <ul
              className="list-none text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Provide accurate, current, and complete information during registration.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Maintain and promptly update your account information to keep it accurate.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Maintain the confidentiality of your login credentials and restrict access to your
                account.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Accept responsibility for all activities that occur under your account.
              </li>
            </ul>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              You must be at least 16 years of age to create an account. We reserve the right to
              suspend or terminate accounts that violate these Terms or that we reasonably believe to
              be fraudulent.
            </p>
          </section>

          {/* 3. Acceptable Use */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              3. Acceptable Use
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              You agree to use our Services only for lawful purposes and in accordance with these
              Terms. You must not:
            </p>
            <ul
              className="list-none text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Use the Services to violate any applicable law, regulation, or third-party rights.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Attempt to gain unauthorized access to any part of the Services, other accounts, or
                computer systems connected to the Services.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Use automated scripts, bots, or scraping tools to access or extract data from the
                Services without our prior written consent.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Interfere with or disrupt the integrity, performance, or availability of the
                Services.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Reverse-engineer, decompile, or disassemble any aspect of the Services.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Resell, sublicense, or redistribute the Services or any data obtained through the
                Services without our written authorization.
              </li>
            </ul>
          </section>

          {/* 4. Intellectual Property */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              4. Intellectual Property
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              All content, features, and functionality of the Services -- including but not limited
              to text, graphics, logos, icons, data compilations, software, and design elements --
              are the exclusive property of Top Viso INC or its licensors and are protected by
              intellectual property laws.
            </p>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We grant you a limited, non-exclusive, non-transferable, and revocable license to
              access and use the Services for your internal business purposes, subject to these
              Terms. This license does not include the right to modify, reproduce, distribute, or
              create derivative works based on the Services.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              You retain ownership of all data and content that you submit to the Services. By
              submitting content, you grant us a limited license to use, process, and display it
              solely for the purpose of providing and improving our Services.
            </p>
          </section>

          {/* 5. Payment Terms */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              5. Payment Terms
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              Certain features of our Services require a paid subscription. By subscribing to a paid
              plan, you agree to the following:
            </p>
            <ul
              className="list-none text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Free trial:</strong> New accounts are eligible for a
                14-day free trial with full access to all features. No credit card is required to
                start a trial. At the end of the trial period, you must subscribe to a paid plan to
                continue using the Services.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Billing:</strong> Subscriptions are available on monthly
                or annual billing cycles. Annual plans are billed upfront for the full year at a
                discounted rate. Monthly plans are billed at the beginning of each billing cycle.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Cancellation:</strong> You may cancel your subscription
                at any time from your account settings. Cancellation takes effect at the end of your
                current billing period. We do not provide prorated refunds for unused time within a
                billing cycle.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Price changes:</strong> We may adjust pricing from time
                to time. We will provide at least 30 days&apos; notice before any price increase
                takes effect. Continued use of the Services after the price change constitutes your
                acceptance of the new pricing.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Taxes:</strong> All fees are exclusive of applicable
                taxes. You are responsible for any sales tax, VAT, or other taxes imposed by your
                jurisdiction.
              </li>
            </ul>
          </section>

          {/* 6. Limitation of Liability */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              6. Limitation of Liability
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              To the maximum extent permitted by applicable law, Top Viso INC and its officers, directors,
              employees, and agents shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, including but not limited to loss of profits, data,
              use, or goodwill, arising out of or related to your use of or inability to use the
              Services.
            </p>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              Our total cumulative liability for any claims arising out of or related to these Terms
              or the Services shall not exceed the greater of (a) the amounts you have paid to us in
              the twelve (12) months preceding the claim, or (b) one hundred US dollars ($100).
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              The Services are provided on an &quot;as is&quot; and &quot;as available&quot; basis
              without warranties of any kind, whether express, implied, or statutory, including but
              not limited to implied warranties of merchantability, fitness for a particular purpose,
              and non-infringement.
            </p>
          </section>

          {/* 7. Termination */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              7. Termination
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              You may terminate your account at any time by contacting us or using the account
              deletion feature in your account settings. Upon termination, your right to access and
              use the Services will immediately cease.
            </p>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We may suspend or terminate your account and access to the Services at any time,
              without prior notice, if we reasonably believe that you have violated these Terms,
              engaged in fraudulent activity, or if required by law. We may also discontinue the
              Services or any part thereof at our sole discretion with reasonable notice.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              Sections of these Terms that by their nature should survive termination -- including
              Intellectual Property, Limitation of Liability, and Governing Law -- will remain in
              effect after termination of your account.
            </p>
          </section>

          {/* 8. Governing Law */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              8. Governing Law
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              These Terms shall be governed by and construed in accordance with the laws of the State
              of Delaware, United States, without regard to its conflict of law provisions. Any
              disputes arising out of or relating to these Terms or the Services shall be resolved
              exclusively in the state or federal courts located in Delaware.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              If any provision of these Terms is held to be invalid, illegal, or unenforceable, the
              remaining provisions shall continue in full force and effect. Our failure to enforce
              any right or provision of these Terms shall not constitute a waiver of that right or
              provision.
            </p>
          </section>

          {/* 9. Contact */}
          <section>
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              9. Contact Us
            </h2>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              If you have any questions about these Terms, please contact us at:
            </p>
            <div
              className="mt-4 rounded-lg border border-line bg-paper"
              style={{ padding: "24px" }}
            >
              <p className="font-bold text-ink" style={{ fontSize: "15px" }}>
                Top Viso INC
              </p>
              <p className="mt-1 text-ink-2" style={{ fontSize: "15px" }}>
                Email:{" "}
                <a href="mailto:info@donkeyideas.com" className="text-accent hover:underline">
                  info@donkeyideas.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
