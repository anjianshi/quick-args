"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Program = exports.Command = void 0;
const path = __importStar(require("node:path"));
function combine(...arrayList) {
    return arrayList.reduce((result, arr) => [...result, ...arr], []);
}
class Command {
    name;
    desc;
    cmdHandler;
    superCommand = null; // 根节点此值为 null
    subCommands = [];
    options = {
        flag: [],
        named: [],
        pos: [],
        rest: null,
    };
    constructor(def) {
        this.name = def.name;
        this.desc = def.describe ?? '';
        this.cmdHandler = def.handler ?? null;
    }
    // ===== register =====
    command(subCommand) {
        this.subCommands.push(subCommand);
        subCommand._registerToSuper(this);
        return this;
    }
    _registerToSuper(superCommand) {
        this.superCommand = superCommand;
    }
    handler(handler) {
        this.cmdHandler = handler;
        return this;
    }
    flag(def) {
        // name 为一个字符时，自动设为 short
        if (def.name.length === 1 && !def.short)
            def = { ...def, short: def.name };
        this._confirmUnique(def);
        // flag 不可设为必填、默认值固定为 false
        def = { ...def, required: false, default: false };
        this.options.flag.push(def);
        return this;
    }
    named(def) {
        // name 为一个字符时，自动设为 short
        if (def.name.length === 1 && !def.short)
            def = { ...def, short: def.name };
        this._confirmUnique(def);
        this.options.named.push(def);
        return this;
    }
    pos(def) {
        this._confirmUnique(def);
        // pos 参数默认 required
        if (!('required' in def))
            def = { ...def, required: true };
        this.options.pos.push(def);
        return this;
    }
    rest(def) {
        this._confirmUnique(def);
        // rest 参数默认 required
        if (!('required' in def))
            def = { ...def, required: true };
        this.options.rest = def;
        return this;
    }
    _confirmUnique(opt) {
        const { flag, named, pos, rest } = this.options;
        if (combine(flag, named, pos, rest ? [rest] : []).find(o => o.name === opt.name))
            return void console.warn(`参数名称重复：${opt.name}`);
        if ('short' in opt &&
            (opt.short ?? '') &&
            combine(flag, named).find(o => o.short === opt.short))
            return void console.warn(`参数短名称重复：-${opt.short}`);
        // 非 named 参数的 name 不能和 named 参数的 name 或 value 有重名
        // named 参数的 name 不能和 named 参数的 name 重名，但可以和 value 重名；value 不能和 value 重名，但可以和 name 重名。
        if ('value' in opt) {
            if (named.find(o => o.value === opt.value))
                return void console.warn(`参数 "${opt.name}" 的 value "${opt.value ?? ''}" 与其他 named option 的 value 重名`);
            if (combine(flag, named, pos, rest ? [rest] : []).find(o => o.name === opt.value))
                return void console.warn(`参数 ${opt.name} 的 value "${opt.value ?? ''}" 与其他 option 的 name 重名`);
        }
        else if (named.find(o => o.value === opt.name))
            return void console.warn(`参数 "${opt.name}" 与其他 named option 的 value 重名`);
        return undefined;
    }
    // ===== parse =====
    parse(argv) {
        // 拦截 -h 和 --help 参数
        if (argv[0] === '-h' || argv[0] === '--help')
            this.help();
        // 其下有子命令
        if (this.subCommands.length) {
            if (!argv.length)
                this.help(1);
            const name = argv[0];
            const command = this.subCommands.find(c => c.name === name);
            if (command)
                return command.parse(argv.slice(1));
            console.error(`命令 "${name}" 不存在！`);
            this.help(1);
        }
        // 最底级子命令
        if (this.superCommand) {
            if (this.cmdHandler)
                this.cmdHandler(this.matchArgs(argv));
            else
                console.warn(`命令 "${this.execPath}" 未设置 handler！`);
            return null;
        }
        // 没有子命令的根节点
        return this.matchArgs(argv);
    }
    matchArgs(argv) {
        const matched = {};
        const posValues = []; // positional 参数值先收集到一起，等 flag、named option 匹配完再处理
        argv = [...argv];
        // 匹配 flag 和 named option
        while (argv.length) {
            const item = argv.shift();
            if (item.startsWith('-')) {
                const flag = this.matchFlag(item);
                if (flag) {
                    matched[flag.name] = true;
                    continue;
                }
                const [named, value] = this.matchNamed(item, argv);
                if (named) {
                    matched[(named.value ?? '') || named.name] = this.parseValue(value, named);
                    continue;
                }
            }
            // 值不以 - 开头，或没有匹配上任何 flag、named 参数，则视为 positional 参数
            posValues.push(item);
        }
        // 匹配 positional option
        for (const pos of this.options.pos) {
            if (!posValues.length)
                break;
            matched[pos.name] = this.parseValue(posValues.shift(), pos);
        }
        if (posValues.length) {
            // 余下的 posValues 归入 rest
            const rest = this.options.rest;
            if (rest) {
                matched[rest.name] = posValues.map(v => this.parseValue(v, rest));
            }
            else {
                console.warn(`多余的 positional 参数：${posValues.join(' ')}`);
            }
        }
        // 检查必填；填充默认值
        const allOptions = combine(this.options.flag, this.options.named, this.options.pos, this.options.rest ? [this.options.rest] : []);
        allOptions.forEach(o => {
            const key = 'value' in o ? o.value ?? '' : o.name;
            if (!(key in matched)) {
                if ('default' in o)
                    matched[key] = o.default;
                else if (o.required) {
                    console.error(`缺少必填参数 ${o.name}！`);
                    this.help(1);
                }
            }
        });
        return matched;
    }
    matchFlag(arg) {
        const [name, long] = arg.startsWith('--') ? [arg.slice(2), true] : [arg.slice(1), false];
        for (const opt of this.options.flag) {
            if (long ? opt.name === name : opt.short === name)
                return opt;
        }
        return null;
    }
    matchNamed(arg, restArgs) {
        if (arg.startsWith('--')) {
            // --name=value
            const splitIdx = arg.indexOf('=');
            if (splitIdx === -1)
                return [null, null]; // 未匹配到等号，不是 named 参数
            const name = arg.slice(2, splitIdx);
            const value = arg.slice(splitIdx + 1);
            for (const opt of this.options.named) {
                if (opt.name === name)
                    return [opt, value];
            }
        }
        else {
            // -n value
            const name = arg.slice(1);
            if (!restArgs.length)
                return [null, null]; // 后续已没有值，无法成功匹配成 named
            for (const opt of this.options.named) {
                if (opt.short === name)
                    return [opt, restArgs.shift()]; // 这里直接修改 resetArgs 来提取 value 了，因为 value 不应再参与接下来的匹配
            }
        }
        return [null, null];
    }
    parseValue(rawValue, opt) {
        try {
            return opt.parse ? opt.parse(rawValue) : rawValue;
        }
        catch (e) {
            console.error(`参数值格式化失败（${opt.name}）：${rawValue}`);
            console.error(e);
            return this.help(1);
        }
    }
    // ===== help =====
    help(exitCode = 0) {
        console.log('');
        if (!this.subCommands.length) {
            console.log(`Usage: ${this.execPath} ${this.optionOverview}`);
            if (this.desc)
                console.log(`\n${this.desc}`);
            const desc = this.optionDescribes;
            if (desc)
                console.log(`\nOptions:\n\n${desc}`);
        }
        else {
            console.log(`Usage: ${this.execPath} [command] [arguments]`);
            if (this.desc)
                console.log(`\n${this.desc}`);
            console.log(`\nCommands:\n\n${this.commandDescribes}`);
        }
        console.log('');
        process.exit(exitCode);
    }
    get execPath() {
        return (this.superCommand ? `${this.superCommand.execPath} ` : '') + this.name;
    }
    get optionOverview() {
        const { flag, named, pos, rest } = this.options;
        const decorate = (o, text) => (o.required ? text : `[${text}]`);
        const items = [
            ...flag.map(o => decorate(o, o.short ? `-${o.short}` : `--${o.name}`)),
            ...named.map(o => decorate(o, o.short
                ? `-${o.short} ${(o.value ?? '') || 'value'}`
                : `--${o.name}=${(o.value ?? '') || 'value'}`)),
            ...pos.map(o => decorate(o, o.name)),
        ];
        if (rest)
            items.push(decorate(rest, `...${rest.name}`));
        return items.join(' ');
    }
    get optionDescribes() {
        const { flag, named, pos, rest } = this.options;
        const clear = (list) => list.filter(o => o);
        const flagName = (o) => clear([o.short && `-${o.short}`, o.name && `--${o.name}`]).join(', ');
        const namedName = (o) => `${clear([o.short && `-${o.short}`, o.name && `--${o.name}`]).join(' ')}<${(o.value ?? '') || 'value'}>`;
        const items = clear([
            ...flag.map(o => [o, flagName(o)]),
            ...named.map(o => [o, namedName(o)]),
            ...pos.map(o => [o, o.name]),
            rest && [rest, `...${rest.name}`],
        ]);
        const longestName = items
            .map(o => o[1])
            .reduce((longest, name) => Math.max(longest, name.length), 0);
        const space = (len) => (len ? ` ${space(len - 1)}` : '');
        const fill = ([o, text]) => `  ${text}${space(longestName - text.length + 4)}${o.required ?? false ? '[required] ' : ''}${o.describe ?? ''}`;
        return items.map(i => fill(i)).join('\n');
    }
    get commandDescribes() {
        return this.subCommands.map(cmd => `  - ${cmd.name}\t\t${cmd.desc}`).join('\n');
    }
}
exports.Command = Command;
class Program extends Command {
    constructor() {
        super({
            name: (process.env._ ?? '') ? path.basename(process.env._) : process.argv[1] ?? '',
        });
    }
    program(name) {
        this.name = name;
        return this;
    }
    describe(desc) {
        this.desc = desc;
        return this;
    }
    parse() {
        return super.parse(process.argv.slice(2));
    }
}
exports.Program = Program;
const defaultProgram = new Program();
exports.default = defaultProgram;
