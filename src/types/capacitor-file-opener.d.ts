// Declaración de tipos para @capacitor-community/file-opener
// El paquete es opcional — si no está instalado, el hook usa window.open como fallback
declare module '@capacitor-community/file-opener' {
  interface FileOpenerPlugin {
    open(options: { filePath: string; contentType: string }): Promise<void>;
  }
  const FileOpener: FileOpenerPlugin;
  export { FileOpener };
}
