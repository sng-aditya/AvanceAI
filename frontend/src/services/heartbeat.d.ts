declare class HeartbeatService {
  start(): void;
  stop(): void;
  sendHeartbeat(): Promise<void>;
}

declare const heartbeatService: HeartbeatService;
export default heartbeatService;
