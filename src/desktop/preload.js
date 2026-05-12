import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("treegenDesktop", {
  isDesktop: true,
  openYamlFile() {
    return ipcRenderer.invoke("treegen:open-yaml");
  },
  saveFile(payload) {
    return ipcRenderer.invoke("treegen:save-file", payload);
  },
});
