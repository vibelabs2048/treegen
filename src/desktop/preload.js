import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("treegenDesktop", {
  isDesktop: true,
  openYamlFile() {
    return ipcRenderer.invoke("treegen:open-yaml");
  },
  openProjectFile() {
    return ipcRenderer.invoke("treegen:open-project");
  },
  saveProjectFile(payload) {
    return ipcRenderer.invoke("treegen:save-project", payload);
  },
  saveProjectFileAs(payload) {
    return ipcRenderer.invoke("treegen:save-project-as", payload);
  },
  readAutosave() {
    return ipcRenderer.invoke("treegen:read-autosave");
  },
  writeAutosave(payload) {
    return ipcRenderer.invoke("treegen:write-autosave", payload);
  },
  saveFile(payload) {
    return ipcRenderer.invoke("treegen:save-file", payload);
  },
});
