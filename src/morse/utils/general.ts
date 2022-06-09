export class GeneralUtils {
  static booleanize = (x) => {
    if (x === 'true ' || x === 'false') {
      return x === 'true'
    } else {
      return x
    }
  }
}
