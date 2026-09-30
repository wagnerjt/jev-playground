export interface PresetPayload {
  id: string;
  name: string;
  description: string;
  category: "noul" | "choice" | "score" | "combined" | "local";
  json: string;
}

export const SAMPLE_PRESETS: PresetPayload[] = [
  {
    id: "noul-urgent",
    name: "Noul: Urgency & Escalation",
    category: "noul",
    description:
      "Binary yes/no decisions with optional true/false criteria definitions.",
    json: JSON.stringify(
      {
        state:
          "I have asked three times now. Can I please just talk to a real person?",
        model: "jev-latest",
        questions: {
          is_human_escalation: {
            type: "noul",
            instructions: "Is the customer asking for a human agent?",
          },
          is_repeat_contact: {
            type: "noul",
            instructions:
              "Has the customer contacted support about this before?",
            criteria: {
              true: "Mentions a prior attempt, ticket, or that they have asked before",
              false: "No sign of any previous contact",
            },
          },
        },
      },
      null,
      2,
    ),
  },
  {
    id: "choice-routing",
    name: "Choice: Ticket Department Routing",
    category: "choice",
    description:
      "Categorical routing among named options with descriptive criteria.",
    json: JSON.stringify(
      {
        state:
          "Our API integration started returning 500 errors on every request about 20 minutes ago, and we can't process any customer orders until this is fixed.",
        model: "jev-latest",
        questions: {
          department: {
            type: "choice",
            instructions: "Which team should handle this issue?",
            criteria: {
              billing:
                "Payments, invoices, duplicate charges, or subscription issues",
              technical:
                "Bugs, outages, 500 errors, or API integration problems",
              sales:
                "Pricing inquiries, contract upgrades, or enterprise sales",
              general: "General account questions not covered above",
            },
          },
        },
      },
      null,
      2,
    ),
  },
  {
    id: "score-frustration",
    name: "Score: Customer Frustration Level",
    category: "score",
    description:
      "Ordered rubric rating returning a calibrated position and distribution.",
    json: JSON.stringify(
      {
        state:
          "Why do I have to explain this again?! This is the third time you've charged my credit card without authorization!",
        model: "jev-latest",
        questions: {
          frustration_level: {
            type: "score",
            instructions:
              "How frustrated does the customer appear in this message?",
            criteria: [
              "Calm, neutral, just stating facts",
              "Slightly annoyed or impatient",
              "Frustrated but polite and civil",
              "Extremely angry, aggressive, or using strong language",
            ],
          },
        },
      },
      null,
      2,
    ),
  },
  {
    id: "combined-support-workflow",
    name: "Combined: Choice + Noul + Score Workflow",
    category: "combined",
    description:
      "Real-world System One call evaluating multiple questions in parallel against one state.",
    json: JSON.stringify(
      {
        state: {
          ticket_id: "TICK-8492",
          customer_tier: "Enterprise",
          message:
            "Our checkout service crashed during peak traffic! We've lost $50,000 in the last 15 minutes. Fix this immediately or cancel our contract!",
        },
        model: "jev-latest",
        questions: {
          priority: {
            type: "choice",
            instructions: "Determine the SLA priority tier for this ticket.",
            criteria: {
              p0_critical:
                "System outage or revenue loss for enterprise customers",
              p1_high: "Major impairment without complete outage",
              p2_normal: "Standard inquiry or minor bug",
            },
          },
          demands_refund_or_cancellation: {
            type: "noul",
            instructions:
              "Does the customer threaten contract cancellation or demand immediate financial remedy?",
            criteria: {
              true: "Mentions contract cancellation or lost revenue compensation",
              false:
                "Standard technical problem without financial cancellation threats",
            },
          },
          sentiment_severity: {
            type: "score",
            instructions:
              "Rate the emotional intensity of the customer's message.",
            criteria: [
              "Objective and calm",
              "Concerned and urgent",
              "Highly agitated or demanding",
            ],
          },
        },
      },
      null,
      2,
    ),
  },
  {
    id: "local-ollama-tev1",
    name: "Local Ollama: tev1:0.8b (System One)",
    category: "local",
    description:
      "Run locally with Ollama (ollama run tev1:0.8b) at http://localhost:11434/v1/systemone",
    json: JSON.stringify(
      {
        state:
          "Customer reported issue: unable to log in after password reset email arrived.",
        model: "tev1:0.8b",
        questions: {
          category: {
            type: "choice",
            instructions: "Which category does this ticket belong to?",
            criteria: {
              auth: "Login, password, authentication issues",
              billing: "Subscription or invoicing questions",
              other: "General inquiries",
            },
          },
          is_blocking: {
            type: "noul",
            instructions: "Is this issue completely blocking user access?",
            criteria: {
              true: "User cannot log in or access the application",
              false: "User can still use parts of the application",
            },
          },
        },
      },
      null,
      2,
    ),
  },
];
