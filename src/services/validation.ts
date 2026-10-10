import type {
  EntryType,
  JsonValue,
  Questions,
  SystemOneRequest,
} from "@typesafe-ai/sdk";
import { z } from "zod";

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

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

const entryTypeSchema: z.ZodType<EntryType> = z.union([
  z.string(),
  z.record(z.string(), jsonValueSchema),
  z.array(jsonValueSchema),
  z.null(),
]);

const choiceQuestionSchema = z
  .object({
    type: z.literal("choice"),
    instructions: entryTypeSchema.optional(),
    criteria: z
      .record(z.string(), entryTypeSchema)
      .refine((criteria) => Object.keys(criteria).length > 0, {
        message: "At least one choice option is required.",
      })
      .refine((criteria) => Object.keys(criteria).length <= 255, {
        message: "A maximum of 255 choice options is allowed.",
      }),
  })
  .loose();

const scoreQuestionSchema = z
  .object({
    type: z.literal("score"),
    instructions: entryTypeSchema.optional(),
    criteria: z.tuple([entryTypeSchema, entryTypeSchema]).rest(entryTypeSchema),
  })
  .loose();

const noulQuestionSchema = z
  .object({
    type: z.literal("noul"),
    instructions: entryTypeSchema.optional(),
    criteria: z
      .object({
        true: entryTypeSchema.optional(),
        false: entryTypeSchema.optional(),
      })
      .strict()
      .nullable()
      .optional(),
  })
  .loose();

const questionSchema = z.discriminatedUnion("type", [
  choiceQuestionSchema,
  scoreQuestionSchema,
  noulQuestionSchema,
]);

const payloadSchema = z
  .object({
    state: entryTypeSchema,
    model: z
      .string()
      .refine((model) => model.trim().length > 0, {
        message:
          "Property 'model' must be a non-empty string (e.g. 'jev-latest' or 'jev-1.13.0').",
      })
      .optional(),
    questions: z
      .record(z.string(), questionSchema)
      .refine((questions) => Object.keys(questions).length > 0, {
        message: "At least one question is required in 'questions'.",
      }),
  })
  .loose();

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

const getValueAtPath = (value: unknown, path: PropertyKey[]): unknown =>
  path.reduce<unknown>((current, segment) => {
    if (
      current === null ||
      (typeof current !== "object" && typeof current !== "function")
    ) {
      return undefined;
    }
    return Reflect.get(current, segment);
  }, value);

const toValidationError = (
  issue: z.core.$ZodIssue,
  payload: Record<string, unknown>,
): ValidationError => {
  let path = issue.path.map(String).join(".") || "root";
  const [root, questionName, field] = issue.path.map(String);
  const question =
    questionName && isRecord(payload.questions)
      ? payload.questions[questionName]
      : undefined;
  const criteria =
    isRecord(question) && field === "criteria" ? question.criteria : undefined;
  let message = issue.message;

  if (root === "state") {
    message =
      getValueAtPath(payload, issue.path) === undefined
        ? "Missing required property 'state' (can be text string, JSON object, array, or null)."
        : "Property 'state' must be a string, JSON object, array, or null.";
  } else if (root === "model") {
    message =
      "Property 'model' must be a non-empty string (e.g. 'jev-latest' or 'jev-1.13.0').";
  } else if (root === "questions" && issue.path.length === 1) {
    if (payload.questions === undefined) {
      message = "Missing required property 'questions' map.";
    } else if (
      isRecord(payload.questions) &&
      Object.keys(payload.questions).length === 0
    ) {
      message = "At least one question is required in 'questions'.";
    } else {
      message =
        "Property 'questions' must be an object map of question IDs to Question objects.";
    }
  } else if (root === "questions" && questionName) {
    if (issue.path.length === 2) {
      if (!isRecord(question)) {
        message = `Question '${questionName}' must be an object.`;
      } else if (typeof question.type !== "string" || !question.type) {
        message = `Question '${questionName}' must have a 'type' property ('choice', 'noul', or 'score').`;
      } else {
        message = `Invalid question type '${question.type}'. Supported types: 'choice', 'noul', 'score'.`;
      }
    } else if (field === "type") {
      const questionType = isRecord(question) ? question.type : undefined;
      if (typeof questionType !== "string" || !questionType) {
        message = `Question '${questionName}' must have a 'type' property ('choice', 'noul', or 'score').`;
      } else {
        message = `Invalid question type '${questionType}'. Supported types: 'choice', 'noul', 'score'.`;
      }
    } else if (field === "instructions") {
      message = `Question '${questionName}' instructions must be a string, JSON object, array, or null.`;
    } else if (field === "criteria" && isRecord(question)) {
      if (question.type === "choice") {
        if (criteria === undefined || criteria === null) {
          message = `Choice question '${questionName}' must have a 'criteria' object mapping labels to descriptions.`;
        } else if (!isRecord(criteria)) {
          message = `Choice criteria for '${questionName}' must be a map of labels to descriptions, not a list.`;
        } else if (Object.keys(criteria).length === 0) {
          message = `Choice question '${questionName}' must define at least one option label in 'criteria'.`;
        } else if (Object.keys(criteria).length > 255) {
          message = `Choice question '${questionName}' has ${Object.keys(criteria).length} options. Maximum allowed is 255.`;
        } else {
          message = `Choice criteria for '${questionName}' must contain valid descriptions.`;
        }
      } else if (question.type === "score") {
        if (Array.isArray(criteria) && criteria.length < 2) {
          path = `questions.${questionName}.criteria`;
        }
        if (criteria === undefined || criteria === null) {
          message = `Score question '${questionName}' must have a 'criteria' array with at least 2 rubric levels.`;
        } else if (!Array.isArray(criteria)) {
          message = `Score criteria for '${questionName}' must be an array of ordered descriptions, not an object.`;
        } else if (criteria.length < 2) {
          message = `Score question '${questionName}' has ${criteria.length} criteria; at least two score levels are required.`;
        } else {
          message = `Score criteria for '${questionName}' must contain valid descriptions.`;
        }
      } else if (question.type === "noul") {
        message = `Noul criteria for '${questionName}' must be an object with optional 'true' and 'false' keys.`;
      }
    }
  }

  return {
    path,
    message,
    severity: "error",
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const collectWarnings = (questions: unknown): ValidationError[] => {
  if (!isRecord(questions)) return [];

  return Object.entries(questions).flatMap(([name, question]) => {
    if (
      isRecord(question) &&
      question.type === "score" &&
      Array.isArray(question.criteria) &&
      question.criteria.length > 10
    ) {
      return [
        {
          path: `questions.${name}.criteria`,
          message: `Score question '${name}' has ${question.criteria.length} criteria. The Jev API accepts up to 10 score levels.`,
          severity: "warning" as const,
        },
      ];
    }

    return [];
  });
};

/**
 * Validates a raw JSON payload against the System One request specification.
 */
export function validateJevPayload(rawJson: string): ValidationResult {
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

  if (!isRecord(parsed)) {
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

  const result = payloadSchema.safeParse(parsed);
  const warnings = collectWarnings(parsed.questions);

  if (!result.success) {
    return {
      isValid: false,
      errors: [
        ...result.error.issues.map((issue) => toValidationError(issue, parsed)),
        ...warnings,
      ],
    };
  }

  return {
    isValid: true,
    parsedPayload: result.data as SystemOneRequest,
    errors: warnings,
  };
}
