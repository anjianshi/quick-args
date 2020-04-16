#!/usr/bin/env node
interface Option<T> {
    name: string;
    required?: boolean;
    default?: T;
    describe?: string;
}
interface Flag extends Option<Boolean> {
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
interface CommandDef {
    name: string;
    describe?: string;
    handler?: (args: ParsedArguments) => void;
}
declare type ParsedArguments = {
    [key: string]: any;
};
declare class Command {
    name: string;
    desc: string;
    handler: ((args: ParsedArguments) => void) | null;
    superCommand: Command | null;
    subCommands: Command[];
    options: {
        flag: Flag[];
        named: Named<any>[];
        pos: Pos<any>[];
        rest: Rest<any> | null;
    };
    constructor(def: CommandDef);
    command(subCommand: Command): this;
    _registerToSuper(superCommand: Command): void;
    flag(def: Flag): this;
    named<T>(def: Named<T>): this;
    pos<T>(def: Pos<T>): this;
    rest<T>(def: Rest<T>): this;
    _confirmUnique<T>(opt: Flag | Named<T> | Pos<T> | Rest<T>): void;
    parse(argv: string[]): ParsedArguments | null;
    matchArgs(argv: string[]): ParsedArguments;
    matchFlagOrNamed(arg: string, options: Flag[]): Flag | null;
    matchFlagOrNamed<T>(arg: string, options: Named<T>[]): Named<T> | null;
    parseValue<T>(rawValue: string, opt: Named<T> | Pos<T> | Rest<T>): T | string;
    help(exitCode?: number): any;
    get execPath(): string;
    get optionOverview(): string;
    get optionDescribes(): string;
    get commandDescribes(): string[];
}
declare class Program extends Command {
    constructor();
    program(name: string): void;
    describe(desc: string): this;
    parse(): ParsedArguments | null;
}
declare const _default: Program;
export default _default;
export { Command };
