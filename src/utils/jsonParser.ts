import { FlowGraphNode, JsonDataType, JsonParseResult, JsonStats } from '../types';

export function getDataType(value: any): JsonDataType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const type = typeof value;
  if (type === 'object') return 'object';
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  return 'string';
}

export function formatPreviewValue(value: any, type: JsonDataType): string {
  switch (type) {
    case 'string':
      return `"${value.length > 28 ? value.slice(0, 25) + '...' : value}"`;
    case 'number':
      return String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'null':
      return 'null';
    case 'array':
      return `Array (${(value as any[]).length})`;
    case 'object':
      return `Object (${Object.keys(value || {}).length})`;
    default:
      return String(value);
  }
}

/**
 * Extracts line and column information from JSON parse error message
 */
export function parseJsonError(raw: string, err: Error): { message: string; line?: number; column?: number; snippet?: string } {
  const errMsg = err.message || 'Invalid JSON syntax';
  const lines = raw.split(/\r?\n/);
  
  let lineNum: number | undefined;
  let colNum: number | undefined;

  // Patterns like "at position 124" or "at line 5 column 12"
  const lineColMatch = errMsg.match(/line (\d+) column (\d+)/i);
  if (lineColMatch) {
    lineNum = parseInt(lineColMatch[1], 10);
    colNum = parseInt(lineColMatch[2], 10);
  } else {
    const posMatch = errMsg.match(/position (\d+)/i);
    if (posMatch) {
      const position = parseInt(posMatch[1], 10);
      let currentPos = 0;
      for (let i = 0; i < lines.length; i++) {
        const lineLen = lines[i].length + 1; // +1 for newline
        if (currentPos + lineLen > position) {
          lineNum = i + 1;
          colNum = position - currentPos + 1;
          break;
        }
        currentPos += lineLen;
      }
      if (!lineNum) {
        lineNum = lines.length;
        colNum = (lines[lines.length - 1] || '').length;
      }
    }
  }

  // Friendly human explanation based on common JSON errors
  let friendlyExplanation = errMsg;
  if (lineNum !== undefined && lines[lineNum - 1]) {
    const errorLineText = lines[lineNum - 1];
    
    if (errMsg.includes('Unexpected token') && errorLineText.trim().endsWith(',')) {
      friendlyExplanation = `Possible trailing comma near line ${lineNum}, column ${colNum || 1}. JSON does not allow trailing commas.`;
    } else if (errorLineText.includes("'")) {
      friendlyExplanation = `Possible single quotes used near line ${lineNum}. JSON requires double quotes ("") for string values and keys.`;
    } else if (errMsg.includes('Unexpected token }') || errMsg.includes('Unexpected token ]')) {
      friendlyExplanation = `Unexpected closing bracket or trailing comma at line ${lineNum}, column ${colNum || 1}.`;
    } else if (lineNum !== undefined && colNum !== undefined) {
      friendlyExplanation = `Syntax error at line ${lineNum}, column ${colNum}.`;
    }
  }

  let snippet = '';
  if (lineNum !== undefined && lines[lineNum - 1]) {
    snippet = lines[lineNum - 1].trim();
  }

  return {
    message: friendlyExplanation,
    line: lineNum,
    column: colNum,
    snippet,
  };
}

export function validateAndParseJson(raw: string): JsonParseResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return {
      isValid: false,
      parsedData: null,
      error: { message: 'Input is empty. Paste or select a sample JSON to visualize.' },
      stats: null,
    };
  }

  try {
    const parsedData = JSON.parse(trimmed);
    const stats = calculateJsonStats(parsedData, raw);
    return {
      isValid: true,
      parsedData,
      error: null,
      stats,
    };
  } catch (err: any) {
    const parsedErr = parseJsonError(raw, err);
    return {
      isValid: false,
      parsedData: null,
      error: parsedErr,
      stats: null,
    };
  }
}

export function calculateJsonStats(data: any, rawString: string): JsonStats {
  let objectCount = 0;
  let arrayCount = 0;
  let keyCount = 0;
  let primitiveCount = 0;
  let maxDepth = 0;
  let totalNodes = 0;

  function traverse(val: any, depth: number) {
    totalNodes++;
    if (depth > maxDepth) maxDepth = depth;

    if (val === null || typeof val !== 'object') {
      primitiveCount++;
      return;
    }

    if (Array.isArray(val)) {
      arrayCount++;
      val.forEach((item) => traverse(item, depth + 1));
    } else {
      objectCount++;
      const keys = Object.keys(val);
      keyCount += keys.length;
      keys.forEach((k) => traverse(val[k], depth + 1));
    }
  }

  traverse(data, 1);

  const lines = rawString.split(/\r?\n/).length;
  const charCount = rawString.length;

  return {
    objectCount,
    arrayCount,
    keyCount,
    maxDepth,
    primitiveCount,
    totalNodes,
    charCount,
    lineCount: lines,
  };
}

export function buildJsonGraph(data: any): {
  nodes: Map<string, FlowGraphNode>;
  rootId: string;
  stats: JsonStats;
} {
  const nodes = new Map<string, FlowGraphNode>();
  let idCounter = 0;

  function generateNode(
    key: string,
    displayKey: string,
    value: any,
    parentId: string | null,
    currentPath: string,
    depth: number,
    isArrayItem: boolean,
    arrayIndex?: number
  ): FlowGraphNode {
    const id = `node_${idCounter++}_${key}`;
    const type = getDataType(value);
    const isLeaf = type !== 'object' && type !== 'array';

    const childIds: string[] = [];
    const childCount =
      type === 'array'
        ? (value as any[]).length
        : type === 'object' && value !== null
        ? Object.keys(value).length
        : 0;

    const node: FlowGraphNode = {
      id,
      parentId,
      key,
      displayKey,
      isArrayItem,
      arrayIndex,
      type,
      value: isLeaf ? value : undefined,
      previewValue: formatPreviewValue(value, type),
      rawStringValue: isLeaf ? String(value) : '',
      path: currentPath,
      depth,
      childIds,
      childCount,
      isLeaf,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      subtreeWidth: 0,
      subtreeHeight: 0,
      collapsed: false,
    };

    nodes.set(id, node);

    // Recursively process children
    if (type === 'array') {
      const arr = value as any[];
      arr.forEach((item, idx) => {
        const itemKey = `[${idx}]`;
        const itemPath = `${currentPath}[${idx}]`;
        const childNode = generateNode(
          itemKey,
          itemKey,
          item,
          id,
          itemPath,
          depth + 1,
          true,
          idx
        );
        childIds.push(childNode.id);
      });
    } else if (type === 'object' && value !== null) {
      const obj = value as Record<string, any>;
      const keys = Object.keys(obj);
      keys.forEach((k) => {
        const childPath = currentPath ? `${currentPath}.${k}` : k;
        const childNode = generateNode(
          k,
          k,
          obj[k],
          id,
          childPath,
          depth + 1,
          false
        );
        childIds.push(childNode.id);
      });
    }

    return node;
  }

  const rootType = getDataType(data);
  const rootKey = rootType === 'array' ? 'Root Array' : rootType === 'object' ? 'Root Object' : 'Root';
  const rootNode = generateNode(rootKey, rootKey, data, null, '', 1, false);

  const rawJson = JSON.stringify(data, null, 2);
  const stats = calculateJsonStats(data, rawJson);

  return {
    nodes,
    rootId: rootNode.id,
    stats,
  };
}

/**
 * Attempts to repair common JSON syntax issues like trailing commas or single quotes
 */
export function tryRepairJson(input: string): string {
  let cleaned = input;
  // Replace single quotes surrounding keys or strings (careful heuristic)
  cleaned = cleaned.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');
  // Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  return cleaned;
}
