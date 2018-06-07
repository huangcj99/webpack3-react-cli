## 一、快速开始

推荐环境：node >= 8.x

```
npm install
npm run start
```

## 二、组件树服务注入

### 1、顶层注入全局方法
```
/* src/test/test.js */

// 设置Provider的函数
import { setProvider } from 'provider'
import dateFormat from 'provider/format/date-format'

// 顶层需要注入的方法
let providers = Object.assign(
  {},
  dateFormat
)

render(
  // Context.Provider注入方法，供子组件使用
  setProvider(App, providers),
  document.getElementById('app')
)

/* src/provider/index.js */

export const setProvider = (RootComponent, providers) => {
  return (
    // 详情可以查看react 16.3.0版本新的Context api
    <Context.Provider value={providers}>
      <RootComponent></RootComponent>
    </Context.Provider>
  )
}
```

### 2、子组件中注入providers中注册的方法
```
/* src/test/components/test-provider.jsx */

import { injectMethods } from 'provider'

@injectMethods
export default class TestProvider extends Component {
  render () {
    // 使用injectMethods注解后，props中就会注入顶层中注册的方法
    let { $dateFormat } = this.props;

    return (
      <div> 
        <p>test-provider</p>
        <p>{ $dateFormat(new Date()) }</p>
      </div>
    )
  }
}

/* src/provider/index.js */

export const injectMethods = (RealComponent) => {
  return class extends Component {
    render () {
      return (
        // value可以获取到顶层provider中注入的方法，this.props则为组件自身注入的props
        <Context.Consumer>
          { value => <RealComponent {...value} {...this.props}></RealComponent> }
        </Context.Consumer>
      )
    }
  }
}
```