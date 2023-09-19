interface Option<T> {
    name: string;
    describe?: string;
    required?: boolean;
    default?: T;
}
interface Flag extends Option<boolean> {
    short?: string;
}
interface Named<T> extends Option<T> {
    short?: string;
    value?: string;
    parse?: (raw: string) => T;
}
interface Pos<T> extends Option<T> {
    parse?: (raw: string) => T;
}
interface Rest<T> extends Option<T[]> {
    parse?: (raw: string) => T;
}
interface CommandDef<ArgT> {
    name: string;
    describe?: string;
    handler?: (args: ArgT) => void;
}
type ParsedArguments = {
    [key: string]: unknown;
};
declare class Command<ArgT> {
    name: string;
    desc: string;
    cmdHandler: ((args: ArgT) => void) | null;
    superCommand: Command<unknown> | null;
    subCommands: Command<unknown>[];
    options: {
        flag: Flag[];
        named: Named<unknown>[];
        pos: Pos<unknown>[];
        rest: Rest<unknown> | null;
    };
    constructor(def: CommandDef<ArgT>);
    command(subCommand: Command<unknown>): this;
    _registerToSuper(superCommand: Command<unknown>): void;
    handler(handler: (args: ArgT) => void): this;
    flag(def: Flag): this;
    named<T>(def: Named<T>): this;
    pos<T>(def: Pos<T>): this;
    rest<T>(def: Rest<T>): this;
    _confirmUnique<T>(opt: Flag | Named<T> | Pos<T> | Rest<T>): undefined;
    parse(argv: string[]): ParsedArguments | null;
    matchArgs(argv: string[]): ArgT;
    matchFlag(arg: string): Flag | null;
    matchNamed(arg: string, restArgs: string[]): [Named<unknown>, string] | [null, null];
    parseValue<T>(rawValue: string, opt: Named<T> | Pos<T> | Rest<T>): T | string;
    help(exitCode?: number): unknown;
    get execPath(): string;
    get optionOverview(): string;
    get optionDescribes(): string;
    get commandDescribes(): string;
}
declare class Program extends Command<ParsedArguments> {
    constructor();
    program(name: string): this;
    describe(desc: string): this;
    parse(): ParsedArguments | null;
}
declare const defaultProgram: Program;
export default defaultProgram;
export { type ParsedArguments as Arguments, Command, Program };
