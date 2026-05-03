import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export default function PrivacyPage() {
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
              Privacy Policy
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
              Top Viso INC (&quot;Top Viso,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is
              committed to protecting the privacy of our users. This Privacy Policy describes how we
              collect, use, disclose, and safeguard your information when you use our platform,
              website, and related services (collectively, the &quot;Services&quot;). By accessing or
              using our Services, you agree to the collection and use of information in accordance
              with this policy.
            </p>
          </div>

          {/* 1. Information We Collect */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              1. Information We Collect
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We collect information that you provide directly to us, information we obtain
              automatically when you use our Services, and information from third-party sources.
            </p>

            <h3
              className="mb-2 mt-6 font-bold text-ink"
              style={{ fontSize: "17px" }}
            >
              Account Information
            </h3>
            <p
              className="mb-3 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              When you create an account, we collect your name, email address, company name, billing
              address, and payment information. If you sign up using a third-party authentication
              provider (such as Google or GitHub), we receive your name and email address from that
              provider.
            </p>

            <h3
              className="mb-2 mt-6 font-bold text-ink"
              style={{ fontSize: "17px" }}
            >
              Usage Data
            </h3>
            <p
              className="mb-3 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We automatically collect information about how you interact with our Services,
              including pages visited, features used, search queries, session duration, IP address,
              browser type, device identifiers, operating system, and referring URLs. This data helps
              us understand usage patterns and improve the platform.
            </p>

            <h3
              className="mb-2 mt-6 font-bold text-ink"
              style={{ fontSize: "17px" }}
            >
              App Data
            </h3>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              When you connect your App Store or Google Play accounts, we access publicly available
              app metadata, keyword rankings, review data, and performance metrics. We also process
              data related to your app&apos;s visibility across AI platforms such as ChatGPT, Claude,
              Gemini, and Perplexity. This data is used solely to provide and improve our ASO
              analytics services.
            </p>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              2. How We Use Your Information
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We use the information we collect for the following purposes:
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
                <strong className="text-ink">Provide and maintain our Services:</strong> To deliver
                keyword tracking, ranking analytics, review monitoring, AI visibility data, and other
                features you have subscribed to.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Improve our platform:</strong> To analyze usage
                patterns, diagnose technical issues, develop new features, and conduct research to
                enhance the quality and relevance of our Services.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Communicate with you:</strong> To send transactional
                emails, service updates, security alerts, billing notifications, and, with your
                consent, marketing communications about new features and products.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Ensure security:</strong> To detect, prevent, and
                address fraud, abuse, security incidents, and technical issues.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Comply with legal obligations:</strong> To fulfill our
                legal and regulatory requirements, including responding to lawful requests from
                public authorities.
              </li>
            </ul>
          </section>

          {/* 3. Data Sharing */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              3. Data Sharing and Disclosure
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We do not sell, rent, or trade your personal information to third parties. We may share
              your information only in the following limited circumstances:
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
                <strong className="text-ink">Service providers:</strong> We work with trusted
                third-party vendors who assist us in operating our platform, processing payments,
                sending emails, hosting infrastructure, and analyzing usage data. These providers are
                contractually obligated to protect your data and may only use it to perform services
                on our behalf.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Legal requirements:</strong> We may disclose your
                information if required to do so by law, regulation, legal process, or governmental
                request.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Business transfers:</strong> In the event of a merger,
                acquisition, or sale of all or a portion of our assets, your information may be
                transferred as part of that transaction. We will notify you of any such change in
                ownership or control.
              </li>
            </ul>
          </section>

          {/* 4. Data Security */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              4. Data Security
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We take the security of your data seriously and implement industry-standard measures to
              protect it. Our security practices include:
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
                SOC 2 Type II certified infrastructure and operational processes.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Encryption at rest using AES-256 and in transit using TLS 1.3.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Regular penetration testing and vulnerability assessments.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Access controls and audit logging across all production systems.
              </li>
            </ul>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              While we strive to protect your information, no method of electronic storage or
              transmission is 100% secure. We cannot guarantee absolute security, but we continuously
              monitor and update our practices to address emerging threats.
            </p>
          </section>

          {/* 5. Your Rights */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              5. Your Rights
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              Depending on your jurisdiction, you may have the following rights regarding your
              personal data:
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
                <strong className="text-ink">Access:</strong> You may request a copy of the personal
                data we hold about you.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Correction:</strong> You may request that we correct
                inaccurate or incomplete personal data.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Deletion:</strong> You may request that we delete your
                personal data, subject to certain exceptions required by law.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Portability:</strong> You may request a machine-readable
                copy of your data to transfer to another service.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Opt-out:</strong> You may opt out of marketing
                communications at any time by clicking the unsubscribe link in our emails or
                contacting us directly.
              </li>
            </ul>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              To exercise any of these rights, please contact us at{" "}
              <a href="mailto:info@donkeyideas.com" className="text-accent hover:underline">
                info@donkeyideas.com
              </a>
              . We will respond to your request within 30 days.
            </p>
          </section>

          {/* 6. Cookies */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              6. Cookies and Tracking Technologies
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We use cookies and similar tracking technologies to enhance your experience, analyze
              usage, and deliver relevant content. The types of cookies we use include:
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
                <strong className="text-ink">Essential cookies:</strong> Required for the platform to
                function, including authentication and session management.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Analytics cookies:</strong> Help us understand how
                visitors interact with our website and identify areas for improvement.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">Preference cookies:</strong> Remember your settings and
                preferences for future visits.
              </li>
            </ul>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              You can control cookie preferences through your browser settings. Disabling certain
              cookies may limit your ability to use some features of our Services.
            </p>
          </section>

          {/* 7. Data Retention */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              7. Data Retention
            </h2>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We retain your personal data for as long as your account is active or as needed to
              provide you with our Services. When you delete your account, we will delete or
              anonymize your personal data within 30 days, unless we are required to retain it for
              legal, regulatory, or legitimate business purposes. Aggregated, anonymized data that
              cannot be used to identify you may be retained indefinitely for analytics and research.
            </p>
          </section>

          {/* 8. Children's Privacy */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              8. Children&apos;s Privacy
            </h2>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              Our Services are not directed to individuals under the age of 16. We do not knowingly
              collect personal information from children. If we become aware that we have collected
              personal data from a child without parental consent, we will take steps to delete that
              information promptly.
            </p>
          </section>

          {/* 9. Changes */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              9. Changes to This Policy
            </h2>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We may update this Privacy Policy from time to time. When we make material changes, we
              will notify you by updating the &quot;Last updated&quot; date at the top of this page
              and, where appropriate, sending you a notification via email. We encourage you to
              review this policy periodically to stay informed about how we protect your data.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              10. Contact Us
            </h2>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              If you have any questions or concerns about this Privacy Policy or our data practices,
              please contact us at:
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
