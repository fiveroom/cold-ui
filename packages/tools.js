export function numToFixed(data, num = 3) {
    let a = Number(data);
    if (Number.isNaN(a)) {
        return 0
    }
    return Number(a.toFixed(num))
}


export function setStyle(ele, name, value){
    ele.style[name] = value;
}

export function uId(){
    return `${s4()}-${s4()}`
}

export function s4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}
