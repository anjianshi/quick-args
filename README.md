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
- `named option`，指定名称的参数
- `positional option`，按位置传值的参数
- `command`，子命令，可以有多级子命令。定义了子命令的情况下，父级命令无法自行被触发；参数只能在最后一个命令名后面传入。


## Usage
```js
import quickArgs from 'quick-args'
const args = quickArgs
  .describe('This is an example cli')
  .named({ name: 'yyy' })
  .pos({ name: 'xxx' })
  .rest({ name: 'xxx' })
  .parse()
```

### Or with command
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
  .parse()   // 对应的 handler 会被触发

// 有子命令的命令，其 options、handler 都无效
```

### args 格式
```json
{
  // 一个参数有 short、long 两种名字时，两个 key 都会出现在对象里
  "name": "value",
  ...
}
```

### 帮助文档
quickArgs 会在适当的节点自动增加名为 help 的 option 或 command 以显示帮助内容


## API
