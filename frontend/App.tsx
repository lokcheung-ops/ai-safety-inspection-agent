import { useEffect, useMemo, useState } from "react";

import { AgentDemo } from "./AgentDemo.js";
import {
  labelFindingType,
  loadDashboardData,
  reportIdForFinding,
  toPublicArtifactUrl,
} from "./data.js";
import type { DashboardData } from "./data.js";
import type { Evidence, Finding } from "./types.js";

type IconName = "check" | "chevron" | "document" | "external" | "shield";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    check: <path d="m5 12 4 4L19 6" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    document: <><path d="M6 2h9l3 3v17H6z" /><path d="M14 2v5h4M9 12h6M9 16h6" /></>,
    external: <><path d="M14 3h7v7M21 3l-9 9" /><path d="M18 13v7a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h7" /></>,
    shield: <><path d="M12 3 4 6v5c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V6z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
  };
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24">{paths[name]}</svg>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function reportShortId(reportId: string) {
  return reportId.replace("F3A-", "");
}

function FindingCard({ finding, selected, onSelect }: { finding: Finding; selected: boolean; onSelect: () => void }) {
  return (
    <button className={`finding-card${selected ? " selected" : ""}`} onClick={onSelect} type="button">
      <span className="finding-card-top">
        <span className="finding-index">{finding.finding_id.replace("FINDING-", "")}</span>
        <span className="status"><span />{finding.safety_review_status}</span>
      </span>
      <strong>{finding.title}</strong>
      <span className="finding-theme">{labelFindingType(finding.finding_type)}</span>
      <span className="finding-card-bottom">
        {finding.verified_evidence.length} evidence {finding.verified_evidence.length === 1 ? "reference" : "references"}
        <Icon name="chevron" />
      </span>
    </button>
  );
}

function EvidenceRecord({ evidence, active, onSelect }: { evidence: Evidence; active: boolean; onSelect: () => void }) {
  return (
    <button className={`evidence-tab${active ? " active" : ""}`} onClick={onSelect} type="button">
      {reportShortId(evidence.report_id)} · p.{evidence.page_number}
    </button>
  );
}

function Dashboard({ dashboardData }: { dashboardData: DashboardData }) {
  const [selectedReportId, setSelectedReportId] = useState(dashboardData.reports[0]!.report_id);
  const [selectedFindingId, setSelectedFindingId] = useState(dashboardData.findings[0]!.finding_id);
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0);

  const selectedReport = dashboardData.reports.find((report) => report.report_id === selectedReportId)!;
  const selectedFinding = dashboardData.findings.find((finding) => finding.finding_id === selectedFindingId)!;
  const selectedEvidence = selectedFinding.verified_evidence[selectedEvidenceIndex] ?? selectedFinding.verified_evidence[0]!;
  const selectedPage = selectedEvidence.report_id === selectedReportId ? selectedEvidence.page_number : 1;
  const reportPdfUrl = `${toPublicArtifactUrl(selectedReport.artifacts.individual_pdf.artifact_path)}#page=${selectedPage}&view=FitH`;
  const combinedUrl = `${toPublicArtifactUrl(selectedReport.artifacts.combined_pdf.artifact_path)}#page=${selectedEvidence.combined_pdf_reference.page_number}`;

  const metrics = useMemo(() => [
    [dashboardData.counts.reports, "Reports"],
    [dashboardData.counts.pages, "Pages"],
    [dashboardData.counts.observations.toLocaleString("en-US"), "Observations"],
    [dashboardData.counts.summaries, "Summaries"],
    [dashboardData.counts.findings, "Findings"],
    [dashboardData.counts.tests, "Tests passing"],
  ], []);

  function chooseFinding(finding: Finding) {
    setSelectedFindingId(finding.finding_id);
    setSelectedEvidenceIndex(0);
    setSelectedReportId(reportIdForFinding(finding));
  }

  function chooseEvidence(index: number) {
    setSelectedEvidenceIndex(index);
    setSelectedReportId(selectedFinding.verified_evidence[index]!.report_id);
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Icon name="shield" /></span>
          <span><strong>AI Safety Inspection Agent</strong><small>Synthetic Form 3A Review Package</small></span>
        </div>
        <div className="header-actions">
          <a className="agent-demo-link" href="/agent-demo">Agent demo</a>
          <div className="read-only"><span />Public demo · Read-only</div>
        </div>
      </header>

      <main>
        <section className="intro">
          <div>
            <p className="eyebrow">Professional review workspace</p>
            <h1>Five weeks of inspection evidence,<br /> one traceable review.</h1>
            <p className="lede">Explore synthetic Form 3A reports, review deterministic findings, and follow every statement back to its approved source.</p>
            <div className="intro-actions">
              <a className="primary-action" href="#review"><Icon name="document" />Start review</a>
              <a className="secondary-action" href="#findings">View findings <Icon name="chevron" /></a>
            </div>
          </div>
          <div className="metric-grid" aria-label="Package counts">
            {metrics.map(([value, label]) => <div className="metric" key={label}><strong>{value}</strong><span>{label}</span></div>)}
          </div>
        </section>

        <section className="report-nav card" id="review">
          <div className="section-heading compact"><div><p className="eyebrow">Step 1 · Choose a report</p><h2>Weekly reports</h2></div><span>5 × 4-page PDFs</span></div>
          <div className="report-tabs">
            {dashboardData.reports.map((report) => (
              <button className={selectedReportId === report.report_id ? "active" : ""} key={report.report_id} onClick={() => setSelectedReportId(report.report_id)} type="button">
                <strong>{reportShortId(report.report_id)}</strong>
                <span>{formatDate(report.metadata.week_start_date)}</span>
              </button>
            ))}
          </div>
          <div className="report-meta">
            <div><span>Review period</span><strong>{formatDate(selectedReport.metadata.week_start_date)} — {formatDate(selectedReport.metadata.week_end_date)}</strong></div>
            <div><span>Workforce</span><strong>{selectedReport.metadata.number_of_workers} workers</strong></div>
            <div><span>Project</span><strong>{selectedReport.metadata.project.project_name}</strong></div>
          </div>
        </section>

        <section className="workspace-grid">
          <article className="card pdf-panel">
            <div className="section-heading"><div><p className="eyebrow">Source document</p><h2>{reportShortId(selectedReport.report_id)} Form 3A</h2></div><a href={combinedUrl} target="_blank" rel="noreferrer"><Icon name="external" />Combined PDF</a></div>
            <object aria-label={`${selectedReport.report_id} PDF preview`} data={reportPdfUrl} type="application/pdf">
              <p>PDF preview is unavailable. <a href={reportPdfUrl}>Open the report PDF</a>.</p>
            </object>
            <div className="pdf-footer"><span><Icon name="document" />4-page bilingual report</span><a href={reportPdfUrl} target="_blank" rel="noreferrer">Open PDF <Icon name="external" /></a></div>
          </article>

          <aside className="card findings-panel" id="findings">
            <div className="section-heading"><div><p className="eyebrow">Step 2 · Review evidence</p><h2>Pending findings</h2></div><span className="count-pill">5</span></div>
            <p className="panel-intro">Select a finding to inspect its verified evidence. No rating is changed by this viewer.</p>
            <div className="finding-list">
              {dashboardData.findings.map((finding) => <FindingCard finding={finding} key={finding.finding_id} selected={finding.finding_id === selectedFindingId} onSelect={() => chooseFinding(finding)} />)}
            </div>
          </aside>
        </section>

        <section className="card evidence-panel">
          <div className="section-heading"><div><p className="eyebrow">Evidence detail</p><h2>{selectedFinding.title}</h2></div><span className="status large"><span />{selectedFinding.safety_review_status}</span></div>
          <p className="interpretation">{selectedFinding.interpretation}</p>
          <div className="evidence-tabs">{selectedFinding.verified_evidence.map((evidence, index) => <EvidenceRecord active={index === selectedEvidenceIndex} evidence={evidence} key={evidence.observation_id} onSelect={() => chooseEvidence(index)} />)}</div>
          <div className="evidence-grid">
            <dl>
              <div><dt>Report / page</dt><dd>{reportShortId(selectedEvidence.report_id)} / {selectedEvidence.page_number}</dd></div>
              <div><dt>Item</dt><dd>{selectedEvidence.item_label}</dd></div>
              <div><dt>Date / weekday</dt><dd>{formatDate(selectedEvidence.inspection_date)} / {selectedEvidence.weekday}</dd></div>
              <div><dt>Recorded rating</dt><dd><span className={`rating rating-${selectedEvidence.rating.toLowerCase()}`}>{selectedEvidence.rating}</span></dd></div>
            </dl>
            <div className="recommendation"><span>Recommendation</span><p>{selectedEvidence.recommendation ?? "No linked recommendation or follow-up evidence is recorded."}</p></div>
            <div className="source-links">
              <span>Traceable source</span>
              <code>{selectedEvidence.source_reference.display_reference}</code>
              <a href={`${toPublicArtifactUrl(selectedEvidence.individual_pdf_reference.artifact_path)}#page=${selectedEvidence.individual_pdf_reference.page_number}`} target="_blank" rel="noreferrer">Individual PDF · p.{selectedEvidence.individual_pdf_reference.page_number}<Icon name="external" /></a>
              <a href={`${toPublicArtifactUrl(selectedEvidence.combined_pdf_reference.artifact_path)}#page=${selectedEvidence.combined_pdf_reference.page_number}`} target="_blank" rel="noreferrer">Combined PDF · p.{selectedEvidence.combined_pdf_reference.page_number}<Icon name="external" /></a>
            </div>
          </div>
          <div className="suggested-action"><strong>Suggested review action</strong><span>{selectedFinding.suggested_action}</span></div>
        </section>

        <section className="assurance-grid">
          <article className="card assurance-card">
            <div className="section-heading"><div><p className="eyebrow">Verification</p><h2>Package integrity</h2></div><span className="brand-mark small"><Icon name="check" /></span></div>
            <div className="verification-list">
              <div><strong>{dashboardData.manifest.artifacts.length}</strong><span>checksummed artifacts</span></div>
              <div><strong>SHA-256</strong><span>checksum algorithm</span></div>
              <div><strong>Byte-identical</strong><span>deterministic regeneration</span></div>
              <div><strong>{dashboardData.counts.tests}</strong><span>tests passing</span></div>
            </div>
            <p>{dashboardData.manifest.counts.finding_evidence_reference_count} finding evidence references link the brief to approved report pages.</p>
          </article>
          <article className="card boundary-card">
            <div className="section-heading"><div><p className="eyebrow">Boundaries</p><h2>What this demo does not do</h2></div></div>
            <ul>{dashboardData.boundaries.map((boundary) => <li key={boundary}><Icon name="check" />{boundary}</li>)}</ul>
          </article>
        </section>
      </main>

      <footer><span>Synthetic data · For demonstration only</span><span>Work Package 1 · Schema v{dashboardData.manifest.schema_version}</span></footer>
    </div>
  );
}

function DashboardLoader() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadDashboardData().then(setDashboardData).catch((reason: unknown) => {
      setError(reason instanceof Error ? reason.message : "Unable to load approved artifacts.");
    });
  }, []);

  if (error) return <main className="load-state"><h1>Review package unavailable</h1><p>{error}</p></main>;
  if (!dashboardData) return <main className="load-state"><p className="eyebrow">Loading verified package</p><h1>Preparing review workspace…</h1></main>;
  return <Dashboard dashboardData={dashboardData} />;
}

export function App() {
  if (window.location.pathname === "/agent-demo") return <AgentDemo />;
  return <DashboardLoader />;
}
