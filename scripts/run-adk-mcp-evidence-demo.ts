import { runEvidenceReviewAgent } from "../src/adk/evidence-review-agent.js";

const reportFlagIndex = process.argv.indexOf("--report");
const reportId = reportFlagIndex >= 0 ? process.argv[reportFlagIndex + 1] : "R03";
if (!reportId) throw new Error("Usage: corepack pnpm adk:mcp:demo -- --report R03");

const result = runEvidenceReviewAgent({ reportId });
const shortReportId = reportId.toUpperCase().replace(/^F3A-/, "");

console.log(result.product_name);
console.log("\nUser request:");
console.log(result.user_request);
console.log("\nTool flow:");
console.log(`✓ get_weather_context(${shortReportId})`);
console.log("✓ list_findings()");
console.log("✓ get_finding_evidence(...)");
console.log("✓ get_report_page_reference(...)");
console.log("✓ verify_artifact_checksums()");
console.log(`\n${result.brief.title}:`);
console.log(`- ${result.brief.summary}`);
console.log(`- Relevant review topics: ${result.brief.relevant_review_topics.join(", ")}.`);
console.log(`- Existing safety evidence / findings reviewed: ${result.brief.existing_findings_reviewed.map((finding) => finding.finding_id).join(", ")}.`);
for (const item of result.brief.potential_follow_up_items) console.log(`- ${item}`);
console.log("- Suggested human review actions:");
for (const action of result.brief.suggested_human_review_actions) console.log(`  - ${action}`);
console.log("- Boundary notes:");
for (const note of result.brief.boundary_notes) console.log(`  - ${note}`);
