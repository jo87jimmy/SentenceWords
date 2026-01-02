export function cloneDeep<T>(val: T) {
    return JSON.parse(JSON.stringify(val))
}