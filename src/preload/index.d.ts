import { ElectronAPI } from '@electron-toolkit/preload'
import { FileAPI } from '../shared/model'

declare global {
  interface Window {
    electron: ElectronAPI
    api: FileAPI
  }
}
