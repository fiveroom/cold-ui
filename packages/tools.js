export function numToFixed(data, num = 0) {
    let a = Number(data);
    if (Number.isNaN(a)) {
        return 0
    }
    return Number(a.toFixed(num))
}

export function uId(){
    return `${s4()}-${s4()}`
}

export function s4() {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

export function getMiDiff(arrData, tar, hint){
    let arr = arrData.sort((a, b) => Math.abs(tar - a) - Math.abs(tar - b));
    return {val: arr[0], hint, diffV: Math.abs(tar - arr[0])}
}

/**
 * 验证CSS颜色
 * @param val {string} 需要验证
 * @param defVal {string} 验证失败应使用的值
 * @return {string} 颜色
 */
export function verifyColor(val, defVal){
    if(/^(#[0-9a-f]{6}|#[0-9a-f]{3}|rgb\([0-5]{1,3},[0-5]{1,3},[0-5]{1,3}\))$/i.test(val.toString())){
        return val
    }
    return defVal
}
