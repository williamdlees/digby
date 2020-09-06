import {Injectable} from '@angular/core';


@Injectable()
export class TableParamsStorageService {
  loadSavedInfo(columnInfo: Map<string, string>, saveName?: string): Map<string, string>{
    // Only load if a save name is passed in
    if (saveName) {
      if (!localStorage) {
        return;
      }

      let loadedInfo = localStorage.getItem(`table-params-${saveName}`);

      if (loadedInfo && loadedInfo !== '{}') {
        try {
          let kvs = JSON.parse(loadedInfo);
          kvs = new Map(kvs);
          return kvs;
        } catch {
          loadedInfo = null;
        }
      }

      if (!loadedInfo && saveName) {
        this.saveInfo(columnInfo, saveName);
      }
      return columnInfo;
    }
  }

  saveInfo(columnInfo: Map<string, string>, saveName?: string): void {
    // Only save if a save name is passed in
    if (saveName) {
      if (!localStorage) {
        return;
      }

      const xx = Array.from(columnInfo);
      const kvs = JSON.stringify(xx);
      localStorage.setItem(`table-params-${saveName}`, kvs);
    }
  }

  mapToObj(m) {
    return Array.from(m).reduce((obj, [key, value]) => {
      obj[key] = value;
      return obj;
    }, {});
  }
}
