export const hasProperty = <T, PKey extends string | number | symbol>(
  d: T,
  key: PKey
): d is T & { [key in PKey]: unknown } => {
  return d != null && typeof d === "object" && key in d;
};

export const validateNonNullableObject = <T>(
  obj: T
): obj is { [P in keyof T]: NonNullable<T[P]> } => {
  return !Object.values(obj).every((v) => v != null);
};
