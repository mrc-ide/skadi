import { JsonPayload } from "../schemas/json/types";
import { iterate, objFromVals } from "../utils";

const getJson = async <T>(storeName: string, fileName: string): Promise<T> => {
  const res = await fetch(`./stores/${storeName}/${fileName}.json`);
  return await res.json();
};

export const readJsonForStores = async (
  storeTypes: readonly string[]
): Promise<Record<string, JsonPayload>> => {
  const jsonFiles = ["config", "model", "fixedParamSets", "forms"] as const;
  const pArr: Promise<any>[][] = Array.from({ length: jsonFiles.length })
    .map(() => []);

  iterate(jsonFiles, storeTypes, (f, s, fIdx) => {
    pArr[fIdx].push(getJson(s, f));
  });

  const res = await Promise.all(pArr.map(p => Promise.all(p)));

  return objFromVals(
    storeTypes,
    (_, idx) => objFromVals(
      jsonFiles,
      (_, fIdx) => res[fIdx][idx]
    )
  );
};
