/** Filter for exposing commands as MCP tools on the remote endpoint. */
export declare function isRemoteMcpCommand(name: string): boolean;
export declare function createCli({ version }?: {
    version?: string;
}): import("goke").Goke<{
    apiKey?: string | undefined;
} & {
    apiUrl?: string | undefined;
} & {
    profile?: string | undefined;
} & {
    json?: boolean | undefined;
}>;
//# sourceMappingURL=create-cli.d.ts.map