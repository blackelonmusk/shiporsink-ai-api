import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert change management coach with deep knowledge of Prosci's ADKAR model and organizational change best practices. You're helping a change manager navigate their project.

ADKAR Framework:
- Awareness: Does the person understand WHY the change is needed?
- Desire: Do they WANT to support and participate in the change?
- Knowledge: Do they know HOW to change?
- Ability: Can they actually IMPLEMENT the required skills and behaviors?
- Reinforcement: Are there systems to SUSTAIN the change?

Your coaching style:
1. Be specific and actionable - give exact phrases and questions to use
2. Reference the actual stakeholder data provided
3. Identify which ADKAR stage each stakeholder is likely stuck at
4. Provide conversation starters for difficult discussions
5. Be encouraging but realistic about challenges
6. Keep responses concise (2-3 paragraphs max unless asked for more detail)

When analyzing stakeholders:
- Engagement score < 30: Likely stuck at Awareness or Desire stage
- Engagement 30-60: May have Awareness but lacking Desire or Knowledge
- Engagement 60-80: Probably has Knowledge, working on Ability
- Engagement > 80: Focus on Reinforcement to maintain momentum

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

Stakeholders:
${
  projectContext.stakeholders?.length > 0
    ? projectContext.stakeholders
        .map(
          (s) =>
            `- ${s.name} (${s.role}): Engagement ${s.engagement}/100, Performance ${s.performance}/100${s.comments ? ` - Notes: ${s.comments}` : ""}`
        )
        .join("\n")
    : "No stakeholders added yet."
}`;
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: question + contextMessage,
        },
      ],
    });

    const response = message.content[0].text;

    return res.status(200).json({ response });
  } catch (error) {
    console.error("Claude API error:", error);
    return res.status(500).json({ error: "Failed to get AI response" });
  }
}
