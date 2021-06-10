# quick-args: Easy parse arguments.
Another `easy to use` arguments parser.

中文文档在[这里](./README-cn.md)。


## Arguments's structure
```sh
./script pos_arg ... -f --flag -o 1 --opt=1 pos_arg
./script command pos_arg -f -o 1
./script command deeper-command ... pos_arg -f -o 1
```

There's four kind of components:
- `flag`, can be short form `-f`, or long form `--flag`, will be transform to `boolean` value.
- `named option`, pass value by name, order independent. Can be short form `-n value`, or long form `--name=value`.
- `positional option`, pass value by arguments position. It has a special form: `rest options`, all positional arguments that has no definition, will place into it. 
- `sub-command`, or shortly says `command`. There can be levels of sub-commands. If a command has sub-commands, the command itself cannot be triggered; Arguments can only passed after latest command name.


## Usage
```js
import quickArgs from 'quick-args'
quickArgs
  .program('my-cli')
  .describe('This is an example cli')
  .flag({ name: 'fff', short: 'f' })
  .named({ name: 'yyy', value: 'vvv' })
  .pos({ name: 'ppp' })
  .rest({ name: 'rrr' })
  .parse()
  .then(args => {})   // .parse() returns a promise

// run: my-cli -f --yyy=1 2 3 4 5
// args: { fff: true, vvv: 1, ppp: 2, rest: [3,4,5] }
```

### with command
```js
import quickArgs, { Command } from 'quick-args'

quickArgs
  .describe('This is an example cli')
  .command(
    new Command({ name: 'cmd', describe: 'do something', handler: (args) => {} })
      .pos({ name: 'pos-option' })
      .named({ name: 'named-option' })
  )
  .command(
    new Command({ name: 'cmd-2', describe: 'do something' })
      .command(
        // nested sub-command
        new Command({ name: 'deeper-cmd', describe: 'do something', handler: (args) => {} })
          .pos({ name: 'pos-option' })
          .named({ name: 'named-option' })
      )
  )
  .parse()   // this will trigger handler instead of return args
```

### help message
`quickArgs` will handle `-h` and `--help` to output help message, you don't need handle it by yourself.


## API

### quickArgs object

#### .program(name)
Set your command line tool's name, it will appears in help message.  
If you havn't set it, the script name will be use.

```js
/*
$ my-cli -h

Usage: my-cli [command] [arguments]

*/
quickArgs.program('my-cli')   
```

#### .describe(content)
Describe your command line tools.

```js
/*
$ my-cli -h

Usage: my-cli [command] [arguments]
This is my cli.

*/
quickArgs
  .program('my-cli')
  .describe('This is my cli.')
```

#### .parse(argv)
Do argumments parse.  
If theres no sub-commands defined, it will return parsed arguments object.  
If theres sub-commands, it will no longer return a value, but trigger the `handler` of the command.  

Example: see the `Usage` section before.

#### Other methods
See the `Command` section below.


### Command
All methods of `Command` object will return itself, to support chaining call.

#### new Command({ name, describe?, handler？ })
Create a command.

- `name`: command name.
- `describe`: optional，command describe.
- `handler(args)`: optional，command's handler（can also register by `command.handler(xxx)`, after command created）. It will receive parsed arguments value.

```js
/*
$ my-cli run -h

Usage: my-cli run

run app

*/
quickArgs.command(
  new Command({ name: 'run', describe: 'run app', handler: args => {} })
)
```

#### command.handler((args) => {})
Register command handler.  
Notice: This method cannot called with `quickArgs` object.

```js
/*
$ my-cli run
running
*/
quickArgs.command(
  new Command({ name: 'run', describe: '运行项目' })
    .handler(args => console.log('running'))
)
```

#### .command(command)
Register a command.  
Call it with `quickArgs` object, will register a top-level command: `quickArgs.command(xxx)`.  
Call it with a `command` object, will register the command's sub-command: `someCommand.command(xxx)`.  
If a command has sub-commands, it's handler and arguments will be ignore.  

Example: see `with command` in `Usage` section.

#### .flag({ name, short?, describe? })
Register a flag option.  
This kind of option will be transformed to boolean value. `true` when user specified, otherwise `false`.

- `name`: option name，will be the `key` into parsed arguments object, use `--name` format to pass it's value.
- `short`: short name, as an alternative to long option name, use `-s` format to pass it's value.
- `describe`: option description.

#### .named({ name, short?, describe?, value?, required?, default?, parse? })
Register an option that pass value by it's name.

- `name`: option name，will be the `key` into parsed arguments object, use `--name=value` format to pass it's value.
- `short`: short name, as an alternative to long option name, use `-n value` format to pass it's value.
- `describe`: option description.
- `value`: optional, if set, will use this name instead of `name` to be arguments object key.
- `required`: is this option required, default value is false.
- `default`: option's default value, don't need pass this if `required` is `true`.
- `parse(raw: string): result`：transform argument's raw value with `string` type, eg. convert to `number` or `date`. If argument value is invalid, this should throw an error.

#### .pos({ name, describe?, required?, default?, parse? })
Register an positional option.

- `name`: see `.named()`
- `describe`: see `.named()`
- `required`: see `.named()`
- `default`: see `.named()`
- `parse(raw: string): result`：see `.named()`

#### .rest({ name, describe?, required?, default?, parse? })
After all positional options matched it's value, the rest values will be collected into this `rest` option.  
There can be only one `rest` option, it's value is always an `array`.

- `name`: see `.named()`
- `describe`: see `.named()`
- `required`:  set `required` to `true`, means there must be at least one value pass to `rest` option.
- `default`: see `.named()`
- `parse(raw: string): result`: format every value in `rest` option.
