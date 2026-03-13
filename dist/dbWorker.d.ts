interface MessageListenerOptions {
    operations?: Record<string, any>;
}
declare const getMessageListener: (options?: MessageListenerOptions) => (event: MessageEvent) => Promise<void>;
export { getMessageListener };
//# sourceMappingURL=dbWorker.d.ts.map