import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const SYSTEM_PROMPT = `You are an expert change management coach with deep knowledge of Prosci's ADKAR model and organizational change best practices. You're helping a change manager navigate their project.

You have access to CROSS-PROJECT DATA - you can see patterns across all of the user's projects, including which stakeholders have been resistant or champions in previous projects, and how groups have performed historically.

ADKAR Framework:
- Awareness: Does the person understand WHY the change is needed?
- Desire: Do they WANT to support and participate in the change?
- Knowledge: Do they know HOW to change?
- Ability: Can they actually IMPLEMENT the required skills and behaviors?
- Reinforcement: Are there systems to SUSTAIN the change?

Your coaching style:
1. Be specific and actionable - give exact phrases and questions to use
2. Reference the actual stakeholder data provided
3. Use CROSS-PROJECT HISTORY when available - if someone was resistant before, mention it and suggest what worked
4. Identify which ADKAR stage each stakeholder is likely stuck at
5. Provide conversation starters for difficult discussions
6. Be encouraging but realistic about challenges
7. Keep responses concise (2-3 paragraphs max unless asked for more detail)

When analyzing stakeholders:
- Engagement score < 30: Likely stuck at Awareness or Desire stage
- Engagement 30-60: May have Awareness but lacking Desire or Knowledge
- Engagement 60-80: Probably has Knowledge, working on Ability
- Engagement > 80: Focus on Reinforcement to maintain momentum

Cross-Project Insights:
- If a stakeholder was resistant in past projects, acknowledge this pattern
- If someone has been a champion before, suggest leveraging them again
- If a group (department/team) has historically resisted change, prepare extra support
- Look for what worked in previous projects to apply here

Common objections and responses:
- "We tried this before" → Acknowledge the past, ask what specifically failed, show how this is different
- "I don't have time" → Validate their workload, show how change reduces future burden
- "My team won't go for it" → Ask what specific concerns they anticipate, offer to help address them
- "This isn't a priority" → Connect to their personal/team goals, show business impact

Always end with a specific next action the change manager can take.`;

export default async function handler(req, res) {
  // Handle CORS for cross-origin requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { question, projectContext } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    // Build context message from project data
    let contextMessage = "";

    if (projectContext) {
      contextMessage = `\n\nCurrent Project Context:
Project: ${projectContext.projectName || "Unnamed Project"}
Status: ${projectContext.status || "Unknown"}
Risk Level: ${projectContext.riskLevel || 0}%
Total Engagement: ${projectContext.totalEngagement || 0}

Stakeholders in this project:
${
  projectContext.stakeholders?.length > 0
    ? projectContext.stakeholders
        .map(
          (s) =>
            `- ${s.name} (${s.role}): Engagement ${s.engagement}/100, Performance ${s.performance}/100${s.stakeholder_type ? `, Type: ${s.stakeholder_type}` : ""}${s.comments ? ` - Notes: ${s.comments}` : ""}`
        )
        .join("\n")
    : "No stakeholders added yet."
}`;

      // Add milestone context if available
      if (projectContext.milestones?.length > 0) {
        contextMessage += `\n\nUpcoming Milestones:
${projectContext.milestones
  .map((m) => `- ${m.name} (${m.date}): ${m.status}${m.description ? ` - ${m.description}` : ""}`)
  .join("\n")}`;
      }

      // ADD CROSS-PROJECT INSIGHTS
      if (projectContext.crossProjectInsights) {
        const insights = projectContext.crossProjectInsights;
        
        contextMessage += `\n\n=== CROSS-PROJECT INTELLIGENCE ===`;
        contextMessage += `\nTotal Projects: ${insights.totalProjects || 0} (${insights.activeProjects || 0} active)`;
        
        // Other projects
        if (insights.otherProjects?.length > 0) {
          contextMessage += `\n\nOther Projects:
${insights.otherProjects.map((p) => `- ${p.name} (${p.status})`).join("\n")}`;
        }

        // Stakeholder history across projects
        if (insights.globalStakeholders?.length > 0) {
          const stakeholdersWithHistory = insights.globalStakeholders.filter(
            (s) => s.projectHistory && s.projectHistory.length > 0
          );
          
          if (stakeholdersWithHistory.length > 0) {
            contextMessage += `\n\nStakeholder Cross-Project History:`;
            stakeholdersWithHistory.forEach((s) => {
              contextMessage += `\n- ${s.name}${s.group ? ` (${s.group})` : ""}:`;
              s.projectHistory.forEach((h) => {
                contextMessage += `\n  • ${h.project}: ${h.type || "neutral"}, Engagement: ${h.engagement || 0}, Barrier: ${h.lowestADKAR || "Unknown"}`;
              });
            });
          }
        }

        // Group history
        if (insights.groups?.length > 0) {
          const groupsWithHistory = insights.groups.filter(
            (g) => g.projectHistory && g.projectHistory.length > 0
          );
          
          if (groupsWithHistory.length > 0) {
            contextMessage += `\n\nGroup/Department History:`;
            groupsWithHistory.forEach((g) => {
              contextMessage += `\n- ${g.name} (${g.memberCount} members):`;
              g.projectHistory.forEach((h) => {
                contextMessage += `\n  • ${h.project}: Sentiment: ${h.sentiment || "neutral"}, Barrier: ${h.lowestADKAR || "Unknown"}`;
              });
            });
          }
        }

        // Detected patterns
        if (insights.patterns) {
          if (insights.patterns.resistant?.length > 0) {
            contextMessage += `\n\n⚠️ RESISTANCE PATTERNS DETECTED:
${insights.patterns.resistant.map((p) => `- ${p}`).join("\n")}`;
          }
          
          if (insights.patterns.champions?.length > 0) {
            contextMessage += `\n\n🌟 CHAMPION PATTERNS DETECTED:
${insights.patterns.champions.map((p) => `- ${p}`).join("\n")}`;
          }
        }
        
        contextMessage += `\n=== END CROSS-PROJECT INTELLIGENCE ===`;
      }
    }

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,

    const response = message.content[0].text;

    return res.status(200).json({ response });
  } catch (error) {
    console.error("Claude API error:", error);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
}
