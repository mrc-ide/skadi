export const pushIfNotIn = <T>(arr: T[], el: T) => {
  if (!arr.includes(el)) arr.push(el);
};

export const deepCopy = (obj: object) => {
  return JSON.parse(JSON.stringify(obj));
};

export const getJson = async <T>(storeName: string, fileName: string): Promise<T> => {
  const res = await fetch(`./stores/${storeName}/${fileName}.json`);
  return await res.json();
};
