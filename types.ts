export enum LogLevel {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR'
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
  details?: string;
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW',
  SPLIT = 'SPLIT'
}

export type DiagramType = 
  | 'Auto'
  | 'Flowchart'
  | 'Sequence'
  | 'Class'
  | 'State'
  | 'ER Relationship'
  | 'Gantt'
  | 'User Journey'
  | 'Mindmap'
  | 'Pie'
  | 'Gitgraph';