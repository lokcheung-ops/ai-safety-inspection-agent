import { existsSync } from "node:fs";
import fs from "node:fs/promises";

import { describe, expect, it } from "vitest";

const DATA_MODULE = "../../frontend/data.ts";

async function loadApprovedData() {
  const [{ createDashboardData }, projection, brief, manifest] = await Promise.all([
    import(DATA_MODULE),
    fs.readFile("generated/work-package-1/ui-projection.json", "utf8").then(JSON.parse),
    fs.readFile("generated/work-package-1/safety-review-brief.json", "utf8").then(JSON.parse),
    fs.readFile("generated/work-package-1/manifest.json", "utf8").then(JSON.parse),
  ]);
  return createDashboardData(projection, brief, manifest);
}

describe("static reviewer dashboard data", () => {
  it("declares the Vite React frontend and build scripts", async () => {
    const packageJson = JSON.parse(await fs.readFile("package.json", "utf8")) as {
      scripts?: Record<string, string>;
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(existsSync("index.html")).toBe(true);
    expect(existsSync("frontend/App.tsx")).toBe(true);
    expect(existsSync("frontend/data.ts")).toBe(true);
    expect(existsSync("frontend/styles.css")).toBe(true);
    expect(packageJson.scripts?.dev).toBe("vite");
    expect(packageJson.scripts?.["build:frontend"]).toBe("vite build");
    expect(packageJson.dependencies?.react).toBeDefined();
    expect(packageJson.dependencies?.["react-dom"]).toBeDefined();
    expect(packageJson.devDependencies?.vite).toBeDefined();
  });

  it("derives required counts and report metadata from approved artifacts", async () => {
    if (!existsSync("frontend/data.ts")) return;
    const dashboardData = await loadApprovedData();

    expect(dashboardData.counts).toEqual({
      reports: 5,
      pages: 20,
      observations: 2_275,
      summaries: 325,
      findings: 5,
      tests: 82,
    });
    expect(dashboardData.reports.map((report: { report_id: string }) => report.report_id)).toEqual([
      "F3A-R01",
      "F3A-R02",
      "F3A-R03",
      "F3A-R04",
      "F3A-R05",
    ]);
    expect(
      dashboardData.reports.every(
        (report: { artifacts: { individual_pdf: { page_count: number } } }) =>
          report.artifacts.individual_pdf.page_count === 4,
      ),
    ).toBe(true);
    expect(dashboardData.reports[0]?.metadata.number_of_workers).toBe(42);
  });

  it("keeps five Pending findings and resolves finding reports and PDF URLs", async () => {
    if (!existsSync("frontend/data.ts")) return;
    const dashboardData = await loadApprovedData();
    const { reportIdForFinding, toPublicArtifactUrl } = await import(DATA_MODULE);

    expect(dashboardData.findings).toHaveLength(5);
    expect(
      dashboardData.findings.every(
        (finding: { safety_review_status: string }) => finding.safety_review_status === "Pending",
      ),
    ).toBe(true);
    expect(reportIdForFinding(dashboardData.findings[0]!)).toBe("F3A-R02");
    expect(toPublicArtifactUrl("generated/work-package-1/pdfs/F3A-R03.pdf")).toBe(
      "/pdfs/F3A-R03.pdf",
    );
  });

  it("exposes verified manifest totals and hard boundaries", async () => {
    if (!existsSync("frontend/data.ts")) return;
    const dashboardData = await loadApprovedData();

    expect(dashboardData.manifest.artifacts).toHaveLength(11);
    expect(dashboardData.manifest.counts.finding_evidence_reference_count).toBe(8);
    expect(dashboardData.boundaries).toEqual([
      "OCR not implemented",
      "ADK / MCP live integration not implemented",
      "Weather and safety-alert context are future tool context",
      "Read-only demo viewer",
      "No legal, audit, compliance, or accident-causation conclusions",
      "Ratings remain unchanged",
    ]);
  });
});
