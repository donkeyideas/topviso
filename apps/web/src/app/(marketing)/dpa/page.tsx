import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export default function DpaPage() {
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
              Data Processing Agreement
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
              This Data Processing Agreement (&quot;DPA&quot;) forms part of the Terms of Service
              (the &quot;Agreement&quot;) between Top Viso INC (&quot;Data Processor,&quot; &quot;we,&quot;
              &quot;us,&quot; or &quot;our&quot;) and the entity or individual agreeing to these
              terms (&quot;Data Controller,&quot; &quot;you,&quot; or &quot;your&quot;). This DPA
              applies to the extent that we process Personal Data on your behalf in connection with
              providing our Services, as defined in the Agreement.
            </p>
          </div>

          {/* 1. Definitions */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              1. Definitions
            </h2>
            <ul
              className="list-none text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              <li className="mb-3" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">&quot;Personal Data&quot;</strong> means any information
                relating to an identified or identifiable natural person (&quot;Data Subject&quot;)
                that is processed by us on your behalf in connection with the Services.
              </li>
              <li className="mb-3" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">&quot;Processing&quot;</strong> means any operation or
                set of operations performed on Personal Data, whether by automated means or
                otherwise, including collection, recording, organization, structuring, storage,
                adaptation, retrieval, consultation, use, disclosure, dissemination, restriction,
                erasure, or destruction.
              </li>
              <li className="mb-3" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">&quot;Data Controller&quot;</strong> means the entity
                that determines the purposes and means of the Processing of Personal Data.
              </li>
              <li className="mb-3" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">&quot;Data Processor&quot;</strong> means the entity
                that Processes Personal Data on behalf of the Data Controller.
              </li>
              <li className="mb-3" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">&quot;Sub-processor&quot;</strong> means any third party
                engaged by the Data Processor to Process Personal Data on behalf of the Data
                Controller.
              </li>
              <li className="mb-3" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">&quot;Data Protection Laws&quot;</strong> means all
                applicable legislation relating to data protection and privacy, including the EU
                General Data Protection Regulation (GDPR), the California Consumer Privacy Act
                (CCPA), and any other applicable national or state data protection laws.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                <strong className="text-ink">&quot;Data Breach&quot;</strong> means a breach of
                security leading to the accidental or unlawful destruction, loss, alteration,
                unauthorized disclosure of, or access to, Personal Data transmitted, stored, or
                otherwise Processed.
              </li>
            </ul>
          </section>

          {/* 2. Scope and Purpose */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              2. Scope and Purpose
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              This DPA applies to the Processing of Personal Data by us on your behalf in the
              context of providing the Services. We will Process Personal Data only as necessary to
              perform the Services described in the Agreement and in accordance with your documented
              instructions.
            </p>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              The purpose of Processing is to provide app store optimization analytics, keyword
              tracking, review monitoring, AI visibility tracking, and related services as described
              in the Agreement. We will not Process Personal Data for any purpose other than those
              set out in this DPA and the Agreement, unless required by applicable law.
            </p>
          </section>

          {/* 3. Data Processing Details */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              3. Data Processing Details
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              The following details describe the nature and scope of data Processing under this DPA:
            </p>

            <h3
              className="mb-2 mt-6 font-bold text-ink"
              style={{ fontSize: "17px" }}
            >
              Categories of Data Subjects
            </h3>
            <p
              className="mb-3 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              End users of the Data Controller&apos;s applications, employees and authorized users of
              the Data Controller&apos;s account, and app store reviewers whose publicly available
              review data is analyzed.
            </p>

            <h3
              className="mb-2 mt-6 font-bold text-ink"
              style={{ fontSize: "17px" }}
            >
              Categories of Personal Data
            </h3>
            <p
              className="mb-3 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              Account registration data (name, email, company), billing information, usage and
              analytics data, app metadata and performance metrics, and publicly available app store
              review data (reviewer display names and review content).
            </p>

            <h3
              className="mb-2 mt-6 font-bold text-ink"
              style={{ fontSize: "17px" }}
            >
              Duration of Processing
            </h3>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              Processing will continue for the duration of the Agreement and for such additional
              period as necessary to fulfill our obligations under this DPA, including data deletion
              or return upon termination.
            </p>
          </section>

          {/* 4. Security Measures */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              4. Security Measures
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We implement and maintain appropriate technical and organizational measures to protect
              Personal Data against unauthorized or unlawful Processing, accidental loss,
              destruction, or damage. These measures include, but are not limited to:
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
                Encryption of Personal Data at rest (AES-256) and in transit (TLS 1.3).
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                SOC 2 Type II certified infrastructure and operational controls.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Role-based access controls with multi-factor authentication.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Regular penetration testing and vulnerability assessments by independent third
                parties.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Comprehensive audit logging and monitoring of all access to Personal Data.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Business continuity and disaster recovery procedures with regular testing.
              </li>
            </ul>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We regularly review and update these measures to ensure they remain appropriate in
              light of the nature, scope, context, and purposes of Processing, as well as the risks
              to the rights and freedoms of Data Subjects.
            </p>
          </section>

          {/* 5. Sub-processors */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              5. Sub-processors
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              You provide general authorization for us to engage Sub-processors to assist in
              providing the Services, subject to the following conditions:
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
                We will maintain an up-to-date list of Sub-processors, which is available upon
                request.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                We will notify you at least 30 days in advance of engaging any new Sub-processor,
                giving you the opportunity to object.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                We will impose data protection obligations on each Sub-processor that are no less
                protective than those set out in this DPA.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                We remain fully liable for the acts and omissions of our Sub-processors with respect
                to the Processing of Personal Data.
              </li>
            </ul>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              If you object to a new Sub-processor on reasonable data protection grounds, we will
              make reasonable efforts to make available an alternative arrangement. If no alternative
              is feasible, either party may terminate the affected portion of the Services.
            </p>
          </section>

          {/* 6. Data Subject Rights */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              6. Data Subject Rights
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We will assist you in fulfilling your obligations to respond to Data Subject requests
              to exercise their rights under applicable Data Protection Laws. These rights may
              include:
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
                Right of access to their Personal Data.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Right to rectification of inaccurate Personal Data.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Right to erasure (&quot;right to be forgotten&quot;).
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Right to restrict Processing.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Right to data portability.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Right to object to Processing.
              </li>
            </ul>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              If we receive a request directly from a Data Subject, we will promptly notify you and
              will not respond to the request without your prior authorization, unless required to do
              so by applicable law.
            </p>
          </section>

          {/* 7. Data Breach Notification */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              7. Data Breach Notification
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              In the event of a Data Breach affecting Personal Data Processed under this DPA, we
              will:
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
                Notify you without undue delay and in any event within 48 hours of becoming aware of
                the Data Breach.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Provide you with sufficient information to enable you to meet your obligations to
                report the breach to supervisory authorities and affected Data Subjects.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Take immediate steps to contain and mitigate the effects of the Data Breach.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Cooperate with you and provide reasonable assistance in investigating the breach and
                in any regulatory notifications or communications.
              </li>
            </ul>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              The notification will include, to the extent available: the nature of the Data Breach,
              categories and approximate number of Data Subjects affected, likely consequences, and
              measures taken or proposed to address the breach.
            </p>
          </section>

          {/* 8. Audit Rights */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              8. Audit Rights
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We will make available to you all information necessary to demonstrate compliance with
              the obligations laid down in this DPA and applicable Data Protection Laws. You have the
              right to conduct audits, including inspections, to verify our compliance, subject to
              the following conditions:
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
                You must provide at least 30 days&apos; written notice before conducting an audit.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Audits must be conducted during normal business hours and shall not unreasonably
                disrupt our operations.
              </li>
              <li className="mb-2" style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                You may engage a qualified, independent third-party auditor, subject to reasonable
                confidentiality obligations.
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Audit frequency shall be limited to once per calendar year, unless a Data Breach or
                regulatory requirement necessitates additional audits.
              </li>
            </ul>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We will also provide copies of relevant third-party audit reports (such as SOC 2 Type
              II reports) upon request, subject to confidentiality obligations.
            </p>
          </section>

          {/* 9. International Transfers */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              9. International Data Transfers
            </h2>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We will not transfer Personal Data to a country or territory outside the European
              Economic Area (EEA) or the United Kingdom unless appropriate safeguards are in place,
              as required by applicable Data Protection Laws. Such safeguards may include Standard
              Contractual Clauses (SCCs) approved by the European Commission, binding corporate
              rules, or an adequacy decision by the relevant supervisory authority. Upon request, we
              will provide details of the safeguards in place for any international transfer of
              Personal Data.
            </p>
          </section>

          {/* 10. Term and Termination */}
          <section className="mb-10">
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              10. Term and Termination
            </h2>
            <p
              className="mb-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              This DPA shall remain in effect for the duration of the Agreement and for as long as
              we Process Personal Data on your behalf. Upon termination of the Agreement, we will, at
              your election:
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
                Return all Personal Data to you in a commonly used, machine-readable format; or
              </li>
              <li style={{ paddingLeft: "20px", position: "relative" }}>
                <span
                  className="text-ink-3"
                  style={{ position: "absolute", left: "0" }}
                >
                  --
                </span>
                Securely delete all Personal Data within 30 days and provide written certification of
                deletion upon request.
              </li>
            </ul>
            <p
              className="mt-4 text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              We may retain Personal Data to the extent required by applicable law, provided that
              such data remains subject to the protections of this DPA. Provisions of this DPA that
              by their nature should survive termination -- including confidentiality, security
              obligations, and liability -- shall survive.
            </p>
          </section>

          {/* 11. Contact */}
          <section>
            <h2
              className="mb-4 font-bold text-ink"
              style={{ fontSize: "22px", lineHeight: "1.3" }}
            >
              11. Contact
            </h2>
            <p
              className="text-ink-2"
              style={{ fontSize: "15px", lineHeight: "1.75" }}
            >
              For questions about this Data Processing Agreement or to exercise any rights under this
              DPA, please contact us at:
            </p>
            <div
              className="mt-4 rounded-lg border border-line bg-paper"
              style={{ padding: "24px" }}
            >
              <p className="font-bold text-ink" style={{ fontSize: "15px" }}>
                Top Viso INC -- Data Protection
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
                Please include &quot;DPA Inquiry&quot; in the subject line for prompt routing to our
                data protection team.
              </p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
