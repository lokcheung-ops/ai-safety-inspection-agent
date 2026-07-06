import { AGENT_DEMO_TRACE } from "./agent-demo-data.js";

export function AgentDemo() {
  return (
    <div className="agent-demo-shell">
      <header className="agent-demo-topbar">
        <a href="/">← Review console</a>
        <span>Public demo · Read-only</span>
      </header>
      <main className="agent-demo-main">
        <section className="agent-demo-intro">
          <p className="eyebrow">{AGENT_DEMO_TRACE.mode}</p>
          <h1>{AGENT_DEMO_TRACE.title}</h1>
          <p>
            A deterministic local demonstration of an agent retrieving approved evidence and
            synthetic weather-review context to draft a tentative brief for a human auditor.
          </p>
          <div className="agent-runtime-grid">
            <div><strong>ADK</strong><span>ADK = reviewer-agent runtime</span></div>
            <div><strong>MCP</strong><span>MCP = read-only evidence and weather-context tools</span></div>
          </div>
        </section>

        <section className="agent-demo-grid">
          <article className="agent-trace-card">
            <span className="agent-card-label">Example input</span>
            <blockquote>“{AGENT_DEMO_TRACE.input}”</blockquote>
            <span className="agent-card-label">MCP-style tool calls</span>
            <ol className="tool-call-list">
              {AGENT_DEMO_TRACE.tool_calls.map((toolCall) => (
                <li key={toolCall}><span>✓</span><code>{toolCall}</code></li>
              ))}
            </ol>
          </article>

          <article className="agent-brief-card">
            <span className="agent-card-label">Tentative agent output</span>
            <h2>{AGENT_DEMO_TRACE.brief.title}</h2>
            <p>{AGENT_DEMO_TRACE.brief.summary}</p>
            <h3>Reviewer topics</h3>
            <ul>{AGENT_DEMO_TRACE.brief.topics.map((topic) => <li key={topic}>{topic}</li>)}</ul>
            <div className="potential-gap"><strong>Potential follow-up prompt</strong><p>{AGENT_DEMO_TRACE.brief.potential_gap}</p></div>
            <h3>Suggested human review actions</h3>
            <ul>{AGENT_DEMO_TRACE.brief.actions.map((action) => <li key={action}>{action}</li>)}</ul>
          </article>
        </section>

        <section className="agent-boundary-card">
          <div><p className="eyebrow">Safety and honesty boundaries</p><h2>Human auditor remains in control</h2></div>
          <ul>{AGENT_DEMO_TRACE.boundary_notes.map((note) => <li key={note}>✓ {note}</li>)}</ul>
        </section>
      </main>
    </div>
  );
}
