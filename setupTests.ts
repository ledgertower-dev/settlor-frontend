import '@testing-library/jest-dom'
import 'whatwg-fetch'

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
