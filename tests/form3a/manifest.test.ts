import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

type ManifestArtifact = {
  path: string;
  purpose: string;
  media_type: string;
  sha256: string;
};

type WorkPackageManifest = {
  schema_version: string;
  work_package: string;
  fixture_version: string;
  source_catalogue_version: string;
  canonical_source_path: string;
  catalogue_source_path: string;
  manifest_path: string;
  generation: {
    deterministic: boolean;
    orchestrator_command: string;
    stage_commands: string[];
    checksum_algorithm: string;
    reproducibility_mode: string;
  };
  counts: Record<string, number>;
  artifacts: ManifestArtifact[];
};

const MANIFEST_PATH = "generated/work-package-1/manifest.json";
const GENERATOR_PATH = "src/form3a/generate-gate6.ts";
const HANDOFF_PATH = "docs/work-package-1-handoff.md";
const EXPECTED_ARTIFACT_PATHS = [
  "generated/work-package-1/normalized-data.json",
  "generated/work-package-1/extraction-review-cases.json",
  "generated/work-package-1/normalized-data.xlsx",
  "generated/work-package-1/pdfs/F3A-R01.pdf",
  "generated/work-package-1/pdfs/F3A-R02.pdf",
  "generated/work-package-1/pdfs/F3A-R03.pdf",
  "generated/work-package-1/pdfs/F3A-R04.pdf",
  "generated/work-package-1/pdfs/F3A-R05.pdf",
  "generated/work-package-1/pdfs/form3a-five-week-combined.pdf",
  "generated/work-package-1/ui-projection.json",
  "generated/work-package-1/safety-review-brief.json",
];

describe("Gate 6 Work Package 1 manifest and handoff", () => {
  it("declares one closeout command, generator, manifest, and handoff", async () => {
    const packageJson = await loadJson<{ scripts?: Record<string, string> }>("package.json");

    expect(existsSync(GENERATOR_PATH), GENERATOR_PATH).toBe(true);
    expect(existsSync(MANIFEST_PATH), MANIFEST_PATH).toBe(true);
    expect(existsSync(HANDOFF_PATH), HANDOFF_PATH).toBe(true);
    expect(packageJson.scripts?.["generate:gate6"]).toBe(
      "node --import tsx src/form3a/generate-gate6.ts",
    );
    expect(packageJson.scripts?.["test:gate6"]).toBe(
      "vitest run tests/form3a/manifest.test.ts",
    );
  });

  it("inventories every generated artifact with matching SHA-256 and no self-checksum", async () => {
    if (!existsSync(MANIFEST_PATH)) return;
    const manifest = await loadJson<WorkPackageManifest>(MANIFEST_PATH);

    expect(manifest.artifacts.map((artifact) => artifact.path)).toEqual(
      EXPECTED_ARTIFACT_PATHS,
    );
    expect(manifest.artifacts.some((artifact) => artifact.path === MANIFEST_PATH)).toBe(false);
    expect(JSON.stringify(manifest.artifacts)).not.toContain(path.basename(MANIFEST_PATH));
    for (const artifact of manifest.artifacts) {
      expect(existsSync(artifact.path), artifact.path).toBe(true);
      expect(artifact.purpose.length).toBeGreaterThan(0);
      expect(artifact.media_type.length).toBeGreaterThan(0);
      expect(artifact.sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(artifact.sha256, artifact.path).toBe(sha256(await fs.readFile(artifact.path)));
    }
  });

  it("records deterministic metadata, source paths, and verified counts", async () => {
    if (!existsSync(MANIFEST_PATH)) return;
    const manifest = await loadJson<WorkPackageManifest>(MANIFEST_PATH);

    expect(manifest).toMatchObject({
      schema_version: "1.0.0",
      work_package: "Work Package 1",
      canonical_source_path: "data/form3a/canonical-five-week-fixture.json",
      catalogue_source_path: "data/form3a/field-catalogue.json",
      manifest_path: MANIFEST_PATH,
      generation: {
        deterministic: true,
        orchestrator_command: "corepack pnpm generate:gate6",
        stage_commands: [
          "corepack pnpm generate:gate4a",
          "corepack pnpm generate:gate4b",
          "corepack pnpm generate:gate4c",
          "corepack pnpm generate:gate4d",
          "corepack pnpm generate:gate5",
        ],
        checksum_algorithm: "SHA-256",
        reproducibility_mode: "byte-identical committed artifacts",
      },
      counts: {
        report_count: 5,
        pdf_file_count: 6,
        individual_pdf_count: 5,
        individual_pdf_page_count: 20,
        combined_pdf_page_count: 20,
        observation_count: 2275,
        weekly_summary_count: 325,
        recommendation_count: 8,
        extraction_review_case_count: 3,
        finding_count: 5,
        finding_evidence_reference_count: 8,
        ui_report_count: 5,
        ui_page_reference_count: 20,
      },
    });
    expect(JSON.stringify(manifest)).not.toMatch(/generated_at|timestamp/i);
  });

  it("documents reproducibility, evidence rules, statuses, QA, and hard boundaries", async () => {
    if (!existsSync(HANDOFF_PATH)) return;
    const handoff = await fs.readFile(HANDOFF_PATH, "utf8");

    for (const command of [
      "corepack pnpm install --frozen-lockfile",
      "corepack pnpm generate:gate6",
      "corepack pnpm test:gate6",
      "corepack pnpm test",
      "corepack pnpm render:gate4c",
    ]) {
      expect(handoff).toContain(command);
    }
    for (const topic of [
      "canonical synthetic Form 3A",
      "N/A and blank",
      "extraction_status",
      "safety_review_status",
      "source references",
      "visual QA",
      "OCR is not implemented",
      "ADK is not implemented",
      "MCP is not implemented",
      "weather context is not implemented",
      "safety-alert context is not implemented",
      "frontend is not implemented",
      "database is not implemented",
      "authentication is not implemented",
      "deployment is not implemented",
      "Kaggle submission is not implemented",
    ]) {
      expect(handoff).toContain(topic);
    }
    expect(handoff).not.toMatch(/YouTube link|full Kaggle essay|video script/i);
  });

  it("regenerates all artifacts and manifest byte-for-byte with one command", async () => {
    if (!existsSync(GENERATOR_PATH) || !existsSync(MANIFEST_PATH)) return;
    const trackedPaths = [...EXPECTED_ARTIFACT_PATHS, MANIFEST_PATH];
    const before = await hashes(trackedPaths);
    const manifestBefore = await fs.readFile(MANIFEST_PATH);

    const result = spawnSync("corepack", ["pnpm", "generate:gate6"], {
      cwd: process.cwd(),
      env: { ...process.env, CI: "true" },
      encoding: "utf8",
    });
    expect(result.status, result.stderr).toBe(0);

    expect(await hashes(trackedPaths)).toEqual(before);
    expect(await fs.readFile(MANIFEST_PATH)).toEqual(manifestBefore);
  }, 30_000);
});

async function loadJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as T;
}

async function hashes(filePaths: string[]): Promise<Record<string, string>> {
  return Object.fromEntries(
    await Promise.all(
      filePaths.map(async (filePath) => [filePath, sha256(await fs.readFile(filePath))]),
    ),
  );
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
