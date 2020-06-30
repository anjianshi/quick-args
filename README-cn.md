# quick-args: Easy parse arguments.
市面上没找到用起来舒服的命令行参数解析类库，所以自己写一个。


## 命令行参数构成
```sh
./script pos_arg ... -f --flag -o 1 --opt=1 pos_arg
./script command pos_arg -f -o 1
./script command deeper-command ... pos_arg -f -o 1
```

分四个部分：
- `flag`，开关，最终识别为布尔值；可以是短形式 `-f`，也可以是长形式 `--flag`
- `named option`，通过名称来接收值的参数，可以是短形式 `-n value`，也可以是长形式 `--name=value`
- `positional option`，按位置传值的参数；此类参数有一种特殊形式：`rest options`，会把没明确定义的 `positional option` 值都收纳进来。
- `command`，子命令，可以有多级子命令。定义了子命令的情况下，父级命令无法自行被触发；参数只能在最后一个命令名后面传入。


## Usage
```js
import quickArgs from 'quick-args'
const args = quickArgs
  .program('my-cli')
  .describe('This is an example cli')
  .flag({ name: 'fff', short: 'f' })
  .named({ name: 'yyy', value: 'vvv' })
  .pos({ name: 'ppp' })
  .rest({ name: 'rrr' })
  .parse()

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
        // 嵌套子命令
        new Command({ name: 'deeper-cmd', describe: 'do something', handler: (args) => {} })
          .pos({ name: 'pos-option' })
          .named({ name: 'named-option' })
      )
  )
  .parse()   // 不再返回 args，变为触发对应的 handler
```

### 帮助信息
quickArgs 自动监听 `-h` 和 `--help` 参数，输出帮助信息，无需手动注册。


## API

### quickArgs object

#### .program(name)
设置命令行工具名称，会出现在帮助信息的 Usage 里。  
若未手动设置，会尝试将脚本名作为 program 名称。

```js
/*
$ my-cli -h

Usage: my-cli [command] [arguments]

*/
quickArgs.program('my-cli')   
```

#### .describe(content)
设置工具描述。

```js
/*
$ my-cli -h

Usage: my-cli [command] [arguments]
This is my cli.

*/
quickArgs
  .program('my-cli')
  .describe('This is my cli.)
```

#### .parse(argv)
执行命令行参数解析。  
没有子命令的情况下，此方法返回解析好的参数对象。  
若有子命令，不再返回值，改为触发对应命令的 `handler`。

例子见上面的 `Usage`。

#### 其他方法
参见 `Command`


### Command
Command 对象的所有方法，均返回其自身，因此可以链式调用。

#### new Command({ name, describe?, handler？ })
创建一个命令

- `name`: 命令名称
- `describe`: 可选，命令描述
- `handler(args)`: 可选，命令回调（可后续调用 `command.handler()` 注册）。接收一个参数，是解析好的命令行参数值。

```js
/*
$ my-cli run -h

Usage: my-cli run

运行项目

*/
quickArgs.command(
  new Command({ name: 'run', describe: '运行项目', handler: args => {} })
)
```

#### .handler((args) => {})
注册命令回调。  
此操作对 `quickArgs` 对象无意义。

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
注册一个子命令。  
有子命令的命令，自身的 `handler` 和登记的命令行参数都会被忽略。

例子见 `Usage` 的 `with command` 部分。

#### .flag({ name, short?, describe? })
注册一个 flag 参数。  
此类参数会被转换为布尔值：用户指定了即为 `true`，未指定即为 `false`

- `name`: 参数名，会作为解析好的参数对象里的 `key`，传参时以 `--name` 格式指定
- `short`: 短名，作为长参数名的代替，传参时以 `-s` 格式指定。
- `describe`: 参数介绍

#### .named({ name, short?, describe?, value?, required?, default?, parse? })
注册一个通过名称传值的参数。  

- `name`: 参数名，会作为解析好的参数对象里的 `key`，传参时以 `--name=value` 格式指定
- `short`: 短名，作为长参数名的代替，传参时以 `-n value` 格式指定。
- `describe`: 参数介绍
- `value`: 代替 name，作为最终写入参数对象的 `key`。
- `required`: 设为 true 表示此参数必须传参，默认为 false
- `default`: 参数默认值，有默认值的情况下 required 无意义。
- `parse(raw: string): result`：将字符串形式的原始参数值解析成想要的格式，如整数。解析过程中抛出异常视为参数值不合法。

#### .pos({ name, describe?, required?, default?, parse? })
注册一个 positional 参数

- `name`: 见 `.named()`
- `describe`: 见 `.named()`
- `required`: 见 `.named()`
- `default`: 见 `.named()`
- `parse(raw: string): result`：见 `.named()`

#### .rest({ name, describe?, required?, default?, parse? })
所有通过 `.pos()` 注册的参数都匹配到参数值后，剩下的参数值会统一收纳进 `rest` 参数。
rest 参数只能有一个，其最终值是一个数组。

- `name`: 见 `.named()`
- `describe`: 见 `.named()`
- `required`: required 为 `true` 代表 rest 里必须至少匹配到一个值
- `default`: 见 `.named()`
- `parse(raw: string): result`：rest 里的每个值都会通过 `parse()` 格式化一次。
