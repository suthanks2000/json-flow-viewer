export type JsonDataType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';

export interface FlowGraphNode {
  id: string;
  parentId: string | null;
  key: string;
  displayKey: string;
  isArrayItem: boolean;
  arrayIndex?: number;
  type: JsonDataType;
  value: any;
  previewValue: string;
  rawStringValue: string;
  path: string;
  depth: number;
  childIds: string[];
  childCount: number;
  isLeaf: boolean;
  
  // Computed layout attributes
  x: number;
  y: number;
  width: number;
  height: number;
  subtreeWidth: number;
  subtreeHeight: number;
  
  // Interactive state
  collapsed: boolean;
}

export interface FlowEdge {
  id: string;
  sourceId: string;
  targetId: string;
  sourceType: JsonDataType;
  targetType: JsonDataType;
  path: string;
}

export interface JsonStats {
  objectCount: number;
  arrayCount: number;
  keyCount: number;
  maxDepth: number;
  primitiveCount: number;
  totalNodes: number;
  charCount: number;
  lineCount: number;
}

export interface JsonParseResult {
  isValid: boolean;
  parsedData: any;
  error: {
    message: string;
    line?: number;
    column?: number;
    snippet?: string;
  } | null;
  stats: JsonStats | null;
}

export type LayoutDirection = 'horizontal' | 'vertical';

export interface SearchMatch {
  nodeId: string;
  matchField: 'key' | 'value' | 'path';
  path: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  text: string;
}
