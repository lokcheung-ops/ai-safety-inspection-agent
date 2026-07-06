import { createHash } from "node:crypto";
import fs from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  EVIDENCE_TOOLS,
  getFindingEvidence,
  getManifestSummary,
  getReportPageReference,
  listFindings,
  verifyArtifactChecksums,
} from "../../src/mcp/evidence-tools.js";

const BOUNDARY_NOTES = [
  "no source record change",
  "no rating change",
  "no finding status change",
  "no recommendation edit",
  "human confirmation required",
];

describe("MCP-style read-only evidence tools", () => {
  it("exposes the required MCP-style tool names", () => {
    expect(Object.keys(EVIDENCE_TOOLS)).toEqual([
      "get_manifest_summary",
      "list_findings",
      "get_finding_evidence",
      "get_report_page_reference",
      "verify_artifact_checksums",
    ]);
  });

  it("summarizes the approved manifest and lists the five Pending findings", () => {
    const manifest = getManifestSummary();
    const findings = listFindings();

    expect(manifest.counts).toMatchObject({
      report_count: 5,
      observation_count: 2_275,
      finding_count: 5,
    });
    expect(manifest.artifact_count).toBe(11);
    expect(manifest.boundary_notes).toEqual(BOUNDARY_NOTES);
    expect(findings.findings).toHaveLength(5);
    expect(findings.findings.every((finding) => finding.safety_review_status === "Pending"))
      .toBe(true);
    expect(findings.boundary_notes).toEqual(BOUNDARY_NOTES);
  });

  it("returns approved finding evidence and resolves R03 PDF page references", () => {
    const finding = getFindingEvidence("FINDING-01");
    const page = getReportPageReference("R03", 1);

    expect(finding.finding.finding_id).toBe("FINDING-01");
    expect(finding.finding.verified_evidence.some((entry) => entry.report_id === "F3A-R03"))
      .toBe(true);
    expect(finding.boundary_notes).toEqual(BOUNDARY_NOTES);
    expect(page).toMatchObject({
      report_id: "F3A-R03",
      page_number: 1,
      individual_pdf_reference: {
        artifact_path: "generated/work-package-1/pdfs/F3A-R03.pdf",
        page_number: 1,
      },
      combined_pdf_reference: {
        artifact_path: "generated/work-package-1/pdfs/form3a-five-week-combined.pdf",
        page_number: 9,
      },
      boundary_notes: BOUNDARY_NOTES,
    });
  });

  it("verifies every manifest checksum without modifying generated artifacts", async () => {
    const manifest = JSON.parse(
      await fs.readFile("generated/work-package-1/manifest.json", "utf8"),
    ) as { artifacts: Array<{ path: string }> };
    const before = await hashes(manifest.artifacts.map((artifact) => artifact.path));

    const result = verifyArtifactChecksums();

    expect(result.verified).toBe(true);
    expect(result.artifacts).toHaveLength(11);
    expect(result.artifacts.every((artifact) => artifact.matches)).toBe(true);
    expect(result.boundary_notes).toEqual(BOUNDARY_NOTES);
    expect(await hashes(Object.keys(before))).toEqual(before);
  });
});

async function hashes(paths: string[]): Promise<Record<string, string>> {
  return Object.fromEntries(
    await Promise.all(
      paths.map(async (path) => [path, createHash("sha256").update(await fs.readFile(path)).digest("hex")]),
    ),
  );
}
