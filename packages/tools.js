export function numToFixed(data, num = 3) {
    let a = Number(data);
    if (Number.isNaN(a)) {
        return 0
    }
    return Number(a.toFixed(num))
}
