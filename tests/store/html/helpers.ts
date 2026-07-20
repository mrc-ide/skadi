export const htmlAppend = (html: string) => {
    const el = document.createElement("div");
    el.innerHTML = html;
    document.body.append(el);
}

export const htmlClear = () => document.body.innerHTML = "";
