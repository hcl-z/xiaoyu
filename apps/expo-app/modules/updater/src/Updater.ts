/**
 * Updater 原生模块的 JS 绑定。只在 Android 上存在；调用方必须先判
 * updatesSupported（src/data/updates.ts），不要在 Web / iOS 上 import 原生侧。
 */
import { NativeModule, requireNativeModule } from 'expo';

export type DownloadProgress = { bytesWritten: number; totalBytes: number };

declare class UpdaterModule extends NativeModule<{
  onDownloadProgress: (progress: DownloadProgress) => void;
}> {
  /** 下载 APK 到 cacheDir/updates，进度走 onDownloadProgress 事件；返回落盘路径 */
  download(url: string, fileName: string, expectedBytes: number): Promise<string>;
  /** 把已下载的 APK 交给系统包安装器 */
  install(fileName: string): void;
}

export default requireNativeModule<UpdaterModule>('Updater');
