import { ElectronAPI } from '@electron-toolkit/preload'
import { FileAPI } from '../global_model'

declare global {
  interface Window {
    electron: ElectronAPI
    api: FileAPI
  }
}
