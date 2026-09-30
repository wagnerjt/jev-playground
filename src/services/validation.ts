import type { Questions, SystemOneRequest } from "@typesafe-ai/sdk";

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  isValid: boolean;
  parsedPayload?: SystemOneRequest;
  errors: ValidationError[];
}

/**
 * Validates a questions map using SDK rules:
 * - Rejects empty question sets
 * - Score questions must have a criteria array of at least 2 entries
 * - Choice questions must have a criteria object
 */
export const validateQuestionsHelper = (questions: Questions): void => {
  if (Object.keys(questions).length === 0) {
    throw new Error("At least one question is required.");
  }
  for (const [name, question] of Object.entries(questions)) {
    if (question.type === "score") {
      if (!Array.isArray(question.criteria)) {
        throw new Error(
          `Score question "${name}" has criteria that are not a list; score criteria must be a list of descriptions indexed by score from zero.`,
        );
      }
      if (question.criteria.length < 2) {
        throw new Error(
          `Score question "${name}" has ${question.criteria.length} criteria; at least two scores are required.`,
        );
      }
    }
  }
};

/**
 * Validates a raw JSON payload intended for the TypeSafe Jev model.
 * Uses @typesafe-ai/sdk types and validation routines alongside thorough structural checks.
 */
export function validateJevPayload(rawJson: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!rawJson.trim()) {
    return {
      isValid: false,
      errors: [
        {
          path: "root",
          message: "Payload cannot be empty. Please enter a valid JSON object.",
          severity: "error",
        },
      ],
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      isValid: false,
      errors: [
        {
          path: "syntax",
          message: `Invalid JSON syntax: ${errorMsg}`,
          severity: "error",
        },
      ],
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      isValid: false,
      errors: [
        {
          path: "root",
          message:
            "Root of the payload must be a JSON object containing 'state' and 'questions'.",
          severity: "error",
        },
      ],
    };
  }

  const obj = parsed as Record<string, unknown>;

  // Check state
  if (!("state" in obj)) {
    errors.push({
      path: "state",
      message:
        "Missing required property 'state' (can be text string, JSON object, array, or null).",
      severity: "error",
    });
  }

  // Check model if provided
  if ("model" in obj && obj.model !== undefined) {
    if (typeof obj.model !== "string" || !obj.model.trim()) {
      errors.push({
        path: "model",
        message:
          "Property 'model' must be a non-empty string (e.g. 'jev-latest' or 'jev-1.13.0').",
        severity: "error",
      });
    }
  }

  // Check questions
  if (!("questions" in obj)) {
    errors.push({
      path: "questions",
      message: "Missing required property 'questions' map.",
      severity: "error",
    });
    return { isValid: false, errors };
  }

  if (
    typeof obj.questions !== "object" ||
    obj.questions === null ||
    Array.isArray(obj.questions)
  ) {
    errors.push({
      path: "questions",
      message:
        "Property 'questions' must be an object map of question IDs to Question objects.",
      severity: "error",
    });
    return { isValid: false, errors };
  }

  const questionsMap = obj.questions as Record<string, unknown>;
  const questionKeys = Object.keys(questionsMap);

  if (questionKeys.length === 0) {
    errors.push({
      path: "questions",
      message: "At least one question is required in 'questions'.",
      severity: "error",
    });
    return { isValid: false, errors };
  }

  // Per-question validation
  for (const [key, qRaw] of Object.entries(questionsMap)) {
    const qPath = `questions.${key}`;

    if (typeof qRaw !== "object" || qRaw === null || Array.isArray(qRaw)) {
      errors.push({
        path: qPath,
        message: `Question '${key}' must be an object.`,
        severity: "error",
      });
      continue;
    }

    const q = qRaw as Record<string, unknown>;

    // Type field
    if (!q.type || typeof q.type !== "string") {
      errors.push({
        path: `${qPath}.type`,
        message: `Question '${key}' must have a 'type' property ('choice', 'noul', or 'score').`,
        severity: "error",
      });
      continue;
    }

    if (!["choice", "noul", "score"].includes(q.type)) {
      errors.push({
        path: `${qPath}.type`,
        message: `Invalid question type '${q.type}'. Supported types: 'choice', 'noul', 'score'.`,
        severity: "error",
      });
      continue;
    }

    // Instructions field
    if (!("instructions" in q) || q.instructions === undefined) {
      errors.push({
        path: `${qPath}.instructions`,
        message: `Question '${key}' is missing required 'instructions'.`,
        severity: "error",
      });
    }

    // Type-specific validations
    if (q.type === "choice") {
      if (
        !("criteria" in q) ||
        q.criteria === undefined ||
        q.criteria === null
      ) {
        errors.push({
          path: `${qPath}.criteria`,
          message: `Choice question '${key}' must have a 'criteria' object mapping labels to descriptions.`,
          severity: "error",
        });
      } else if (typeof q.criteria !== "object" || Array.isArray(q.criteria)) {
        errors.push({
          path: `${qPath}.criteria`,
          message: `Choice criteria for '${key}' must be a map of labels to descriptions, not a list.`,
          severity: "error",
        });
      } else {
        const optionKeys = Object.keys(q.criteria as Record<string, unknown>);
        if (optionKeys.length === 0) {
          errors.push({
            path: `${qPath}.criteria`,
            message: `Choice question '${key}' must define at least one option label in 'criteria'.`,
            severity: "error",
          });
        } else if (optionKeys.length > 255) {
          errors.push({
            path: `${qPath}.criteria`,
            message: `Choice question '${key}' has ${optionKeys.length} options. Maximum allowed is 255.`,
            severity: "error",
          });
        }
      }
    } else if (q.type === "score") {
      if (
        !("criteria" in q) ||
        q.criteria === undefined ||
        q.criteria === null
      ) {
        errors.push({
          path: `${qPath}.criteria`,
          message: `Score question '${key}' must have a 'criteria' array with at least 2 rubric levels.`,
          severity: "error",
        });
      } else if (!Array.isArray(q.criteria)) {
        errors.push({
          path: `${qPath}.criteria`,
          message: `Score criteria for '${key}' must be an array of ordered descriptions, not an object.`,
          severity: "error",
        });
      } else if (q.criteria.length < 2) {
        errors.push({
          path: `${qPath}.criteria`,
          message: `Score question '${key}' has ${q.criteria.length} criteria; at least two score levels are required.`,
          severity: "error",
        });
      } else if (q.criteria.length > 10) {
        errors.push({
          path: `${qPath}.criteria`,
          message: `Score question '${key}' has ${q.criteria.length} criteria. The Jev API accepts up to 10 score levels.`,
          severity: "warning",
        });
      }
    } else if (q.type === "noul") {
      if ("criteria" in q && q.criteria !== null && q.criteria !== undefined) {
        if (typeof q.criteria !== "object" || Array.isArray(q.criteria)) {
          errors.push({
            path: `${qPath}.criteria`,
            message: `Noul criteria for '${key}' must be an object with optional 'true' and 'false' keys.`,
            severity: "error",
          });
        }
      }
    }
  }

  // Also invoke SDK question validation rules
  try {
    validateQuestionsHelper(questionsMap as unknown as Questions);
  } catch (sdkErr) {
    const sdkMsg = sdkErr instanceof Error ? sdkErr.message : String(sdkErr);
    // Only add if not already covered
    if (!errors.some((e) => e.message === sdkMsg)) {
      errors.push({
        path: "questions",
        message: `SDK validation: ${sdkMsg}`,
        severity: "error",
      });
    }
  }

  const hasFatalErrors = errors.some((e) => e.severity === "error");

  return {
    isValid: !hasFatalErrors,
    parsedPayload: hasFatalErrors
      ? undefined
      : (obj as unknown as SystemOneRequest),
    errors,
  };
}
