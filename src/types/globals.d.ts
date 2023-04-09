import { Job } from "bullmq";

declare module "dotenv-vault-core" {
  export function config(): void;
}

declare module "m3u8-parser" {
  interface Byterange {
    length: number;
    offset: number;
  }

  interface Key {
    method: string;
    uri: string;
    iv: string;
  }

  interface Map {
    uri: string;
    byterange: Byterange;
  }

  interface ParsedSegment {
    byterange?: Byterange;
    duration: number;
    attributes: Record<string, string>;
    discontinuity: number;
    uri: string;
    timeline: number;
    key?: Key;
    map?: Map;
    "cue-out"?: string;
    "cue-out-cont"?: string;
    "cue-in"?: string;
    custom: Record<string, unknown>;
  }

  interface ParsedPlaylist {
    version: number;
    targetDuration: number;
    mediaSequence: number;
    discontinuitySequence: number;
    endList: boolean;
    playlistType: string;
    allowCache: boolean;
    segments: ParsedSegment[];
    resolution?: {
      width: number;
      height: number;
    };
    totalDuration?: number;
    discontinuityStarts?: number[];
  }

  export class Parser {
    manifest: ParsedPlaylist;

    constructor();

    push(text: string): void;

    end(): void;
  }
}

declare type BullMqJob = Omit<
  Job,
  | "toJSON"
  | "scripts"
  | "addJob"
  | "changeDelay"
  | "extendLock"
  | "getState"
  | "moveToDelayed"
  | "moveToWaitingChildren"
  | "promote"
  | "updateProgress"
  | "discard"
  | "queue"
  | "asJSON"
  | "asJSONSandbox"
  | "update"
  | "log"
  | "clearLogs"
  | "remove"
  | "moveToCompleted"
  | "moveToFailed"
  | "isCompleted"
  | "isFailed"
  | "isDelayed"
  | "isWaitingChildren"
  | "isActive"
  | "isWaiting"
  | "queueName"
  | "prefix"
  | "queueQualifiedName"
  | "getChildrenValues"
  | "getDependencies"
  | "getDependenciesCount"
  | "waitUntilFinished"
  | "retry"
>;
