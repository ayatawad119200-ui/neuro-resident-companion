import { EngineError, type AlgorithmDef, type AlgorithmNode } from './types';

export interface WalkStep {
  nodeId: string;
  prompt: string;
  choiceId: string;
  choiceLabel: string;
}

export type WalkOutcome =
  | { status: 'question'; node: AlgorithmNode; path: WalkStep[] }
  | { status: 'result'; node: AlgorithmNode; path: WalkStep[] }
  | { status: 'error'; error: EngineError; path: WalkStep[] };

/**
 * Walks a decision tree (FR-401/402). `choices` holds the option ids answered
 * so far, in order. The function is pure: the UI keeps the answer array and
 * re-walks after each tap, which keeps every intermediate screen reproducible.
 *
 * Safety properties:
 * - unknown nodes/options produce a typed error instead of a silent stop;
 * - revisiting a question node is treated as a cycle;
 * - the walk is bounded by the number of nodes.
 */
export function walkAlgorithm(
  def: AlgorithmDef,
  choices: readonly string[],
): WalkOutcome {
  const byId = new Map(def.nodes.map((node) => [node.id, node]));
  const path: WalkStep[] = [];
  const visited = new Set<string>();
  let currentId = def.start;

  for (let guard = 0; guard <= def.nodes.length; guard += 1) {
    const node = byId.get(currentId);
    if (!node) {
      return {
        status: 'error',
        error: new EngineError(
          'UNKNOWN_NODE',
          `Algorithm points to a node that does not exist: "${currentId}"`,
          def.id,
        ),
        path,
      };
    }

    if (node.kind === 'result') {
      return { status: 'result', node, path };
    }

    if (visited.has(node.id)) {
      return {
        status: 'error',
        error: new EngineError(
          'CYCLE_DETECTED',
          `Decision tree loops back to "${node.id}"`,
          node.id,
        ),
        path,
      };
    }
    visited.add(node.id);

    const answerId = choices[path.length];
    if (answerId === undefined) {
      return { status: 'question', node, path };
    }

    const option = (node.options ?? []).find((candidate) => candidate.id === answerId);
    if (!option) {
      return {
        status: 'error',
        error: new EngineError(
          'UNKNOWN_OPTION',
          `Option "${answerId}" does not exist on node "${node.id}"`,
          node.id,
        ),
        path,
      };
    }

    if (!byId.has(option.next)) {
      return {
        status: 'error',
        error: new EngineError(
          'UNKNOWN_NODE',
          `Option "${option.id}" points to a missing node "${option.next}"`,
          node.id,
        ),
        path,
      };
    }

    path.push({
      nodeId: node.id,
      prompt: node.prompt,
      choiceId: option.id,
      choiceLabel: option.label,
    });
    currentId = option.next;
  }

  return {
    status: 'error',
    error: new EngineError('CYCLE_DETECTED', 'Decision tree did not terminate'),
    path,
  };
}

/**
 * Structural validation for algorithm content. Returns a list of
 * human-readable problems (empty array = valid).
 */
export function validateAlgorithm(def: AlgorithmDef): string[] {
  const issues: string[] = [];
  const ids = new Set<string>();

  for (const node of def.nodes) {
    if (ids.has(node.id)) issues.push(`Duplicate node id "${node.id}"`);
    ids.add(node.id);
  }

  if (!ids.has(def.start)) {
    issues.push(`Start node "${def.start}" does not exist`);
  }

  for (const node of def.nodes) {
    const options = node.options ?? [];
    if (node.kind === 'question') {
      if (!options.length) {
        issues.push(`Question node "${node.id}" has no options`);
      }
      if (node.result) {
        issues.push(`Question node "${node.id}" must not carry a result payload`);
      }
    } else {
      if (!node.result) {
        issues.push(`Result node "${node.id}" has no result payload`);
      }
      if (options.length) {
        issues.push(`Result node "${node.id}" must not have options`);
      }
    }

    for (const option of options) {
      if (!ids.has(option.next)) {
        issues.push(
          `Option "${node.id}/${option.id}" points to missing node "${option.next}"`,
        );
      }
    }
  }

  // Reachability (warnings are still useful while authoring content).
  if (ids.has(def.start)) {
    const reachable = new Set<string>();
    const queue = [def.start];
    while (queue.length) {
      const id = queue.shift() as string;
      if (reachable.has(id)) continue;
      reachable.add(id);
      const node = def.nodes.find((candidate) => candidate.id === id);
      if (!node) continue;
      for (const option of node.options ?? []) {
        if (!reachable.has(option.next)) queue.push(option.next);
      }
    }
    for (const node of def.nodes) {
      if (!reachable.has(node.id)) {
        issues.push(`Node "${node.id}" is unreachable from the start node`);
      }
    }
  }

  return issues;
}
