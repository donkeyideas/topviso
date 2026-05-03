import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export default function SecurityPage() {
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
              Security
            </h1>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "17px", lineHeight: "1.6" }}
            >
              At Top Viso, security is foundational -- not an afterthought. We protect your data with
              enterprise-grade infrastructure, rigorous processes, and continuous monitoring.
            </p>
          </div>

          {/* Compliance badges */}
          <div
            className="mb-14 grid gap-4"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            <div
              className="rounded-lg border border-line"
              style={{ padding: "28px 24px", textAlign: "center" }}
            >
              <p
                className="font-mono font-bold text-ink"
                style={{ fontSize: "14px", letterSpacing: "0.02em" }}
              >
                SOC 2 Type II
              </p>
              <p
                className="mt-1 text-ink-3"
                style={{ fontSize: "13px" }}
              >
                Audited annually
              </p>
            </div>
            <div
              className="rounded-lg border border-line"
              style={{ padding: "28px 24px", textAlign: "center" }}
            >
              <p
                className="font-mono font-bold text-ink"
                style={{ fontSize: "14px", letterSpacing: "0.02em" }}
              >
                GDPR
              </p>
              <p
                className="mt-1 text-ink-3"
                style={{ fontSize: "13px" }}
              >
                Fully compliant
              </p>
            </div>
            <div
              className="rounded-lg border border-line"
              style={{ padding: "28px 24px", textAlign: "center" }}
            >
              <p
                className="font-mono font-bold text-ink"
                style={{ fontSize: "14px", letterSpacing: "0.02em" }}
              >
                CCPA
              </p>
              <p
                className="mt-1 text-ink-3"
                style={{ fontSize: "13px" }}
              >
                Fully compliant
              </p>
            </div>
          </div>

          {/* Encryption */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              Encryption
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              All data is encrypted both at rest and in transit. We use industry-standard encryption
              protocols to ensure your information remains protected at every stage.
            </p>
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: "1fr 1fr" }}
            >
              <div
                className="rounded-lg border border-line"
                style={{ padding: "24px" }}
              >
                <p
                  className="font-mono font-bold text-ink"
                  style={{ fontSize: "13px", letterSpacing: "0.02em" }}
                >
                  At Rest
                </p>
                <p
                  className="mt-2 text-ink-2"
                  style={{ fontSize: "14px", lineHeight: "1.6" }}
                >
                  AES-256 encryption for all stored data, including databases, backups, and file
                  storage. Encryption keys are managed through a dedicated key management service
                  with automatic rotation.
                </p>
              </div>
              <div
                className="rounded-lg border border-line"
                style={{ padding: "24px" }}
              >
                <p
                  className="font-mono font-bold text-ink"
                  style={{ fontSize: "13px", letterSpacing: "0.02em" }}
                >
                  In Transit
                </p>
                <p
                  className="mt-2 text-ink-2"
                  style={{ fontSize: "14px", lineHeight: "1.6" }}
                >
                  TLS 1.3 enforced on all connections. We support only modern cipher suites and
                  enforce HSTS with a minimum one-year policy. All API endpoints require HTTPS.
                </p>
              </div>
            </div>
          </section>

          {/* Infrastructure */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              Infrastructure Security
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              Our infrastructure is designed with defense-in-depth principles, incorporating multiple
              layers of security controls to protect against threats.
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
                Hosted on SOC 2-certified cloud infrastructure with isolated virtual private clouds.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Network segmentation with strict firewall rules and least-privilege access policies.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Automated intrusion detection and real-time monitoring of all production systems.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Immutable infrastructure with automated patching and zero-downtime deployments.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Comprehensive audit logging with tamper-proof storage and retention policies.
              </li>
            </ul>
          </section>

          {/* Access Control */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              Access Control
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We enforce strict access controls to ensure that only authorized personnel can access
              sensitive systems and data.
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
                Role-based access control (RBAC) across all internal systems.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Multi-factor authentication (MFA) required for all employee accounts.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Just-in-time access provisioning for production environments.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Quarterly access reviews and automatic deprovisioning for offboarded employees.
              </li>
            </ul>
          </section>

          {/* Penetration Testing */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              Penetration Testing
            </h2>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We conduct regular penetration testing through independent third-party security firms.
              Testing covers our web application, API endpoints, infrastructure, and mobile
              integrations. All findings are triaged, remediated, and verified within defined SLAs.
              Critical and high-severity vulnerabilities are addressed within 24 and 72 hours
              respectively. We also run continuous automated vulnerability scanning across our entire
              attack surface.
            </p>
          </section>

          {/* Data Handling */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              Data Handling
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We follow strict data handling practices to minimize risk and protect your information
              throughout its lifecycle.
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
                Data classification policies that categorize information by sensitivity level.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Automated data retention and deletion workflows.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Secure data disposal procedures for decommissioned systems and storage media.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Regular backups with encrypted off-site storage and tested recovery procedures.
              </li>
            </ul>
          </section>

          {/* Incident Response */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              Incident Response
            </h2>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We maintain a documented incident response plan that outlines procedures for
              detecting, containing, and recovering from security incidents. Our security team is
              available 24/7 and follows established escalation procedures. In the event of a data
              breach affecting your information, we will notify you within 72 hours in accordance
              with applicable regulations. Post-incident reviews are conducted to identify root
              causes and implement preventive measures.
            </p>
          </section>

          {/* Responsible Disclosure */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              Responsible Disclosure Program
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We value the work of security researchers and welcome responsible disclosure of
              vulnerabilities. If you believe you have found a security issue in our Services, we
              encourage you to report it to us. We ask that you:
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
                Provide a detailed description of the vulnerability, including steps to reproduce.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Allow us reasonable time to investigate and address the issue before public
                disclosure.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Avoid accessing or modifying other users&apos; data during your research.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Act in good faith and comply with all applicable laws.
              </li>
            </ul>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We will not take legal action against researchers who follow these guidelines. We are
              committed to working with the security community to keep our platform safe.
            </p>
          </section>

          {/* Report a Vulnerability */}
          <section>
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              Report a Vulnerability
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              If you have discovered a security vulnerability, please report it directly to our
              security team. We aim to acknowledge all reports within one business day and provide an
              initial assessment within five business days.
            </p>
            <div
              className="rounded-lg border border-line"
              style={{ padding: "24px" }}
            >
              <p className="font-bold text-ink" style={{ fontSize: "15px" }}>
                Top Viso INC -- Security Team
              </p>
              <p className="mt-1 text-ink-2" style={{ fontSize: "15px" }}>
                Email:{" "}
                <a href="mailto:info@donkeyideas.com" className="text-accent hover:underline">
                  info@donkeyideas.com
                </a>
              </p>
              <p
                className="mt-3 text-ink-3"
                style={{ fontSize: "13px", lineHeight: "1.5" }}
              >
                Please include &quot;Security Disclosure&quot; in the subject line. Encrypt sensitive
                details when possible.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
