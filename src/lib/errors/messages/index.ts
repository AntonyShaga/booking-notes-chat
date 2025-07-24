import en from "./en.json";
import ru from "./ru.json";

/**
 * A mapping of available languages to their respective translation objects.
 */
const messagesMap = {
  en,
  ru,
};

/**
 * Type representing the structure of the messages map.
 */
type MessagesMap = typeof messagesMap;

/**
 * Union type of supported language codes (e.g., `'en' | 'ru'`).
 */
type Languages = keyof MessagesMap;

/**
 * Recursively extracts all dot-separated keys from a nested object.
 *
 * For example, `{ a: { b: { c: "..."}}}` → `"a" | "a.b" | "a.b.c"`
 */
type DeepKeys<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}` | `${K}.${DeepKeys<T[K]>}`
          : `${K}`
        : never;
    }[keyof T]
  : never;

/**
 * Type representing all valid message keys from the `en` locale file.
 * Used to ensure that only valid translation keys are used.
 */
type MessageKey = DeepKeys<typeof en>;

/**
 * Retrieves the value at a given dot-separated path within a nested object type.
 *
 * For example, GetDeepValue<{ a: { b: string } }, 'a.b'> resolves to `string`.
 */
type GetDeepValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? T[K] extends object
      ? GetDeepValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

/**
 * Safely retrieves a deeply nested value from an object using a dot-separated path.
 *
 * @template TObj - The object type.
 * @template TPath - The dot-separated key path (e.g., `'auth.login.title'`).
 *
 * @param {TObj} obj - The source object to extract the value from.
 * @param {TPath} path - Dot-separated key string representing the path to the desired value.
 *
 * @returns {GetDeepValue<TObj, TPath> | undefined} - The value found at the specified path, or `undefined` if not found.
 *
 * @example
 * getNestedValue({ a: { b: "value" } }, "a.b"); // → "value"
 */
function getNestedValue<TObj extends object, TPath extends string>(
  obj: TObj,
  path: TPath
): GetDeepValue<TObj, TPath> | undefined {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj) as GetDeepValue<TObj, TPath> | undefined;
}

/**
 * Retrieves a translation string from the locale files based on the language and key.
 *
 * Ensures full TypeScript safety by validating the key and language at compile time.
 * Falls back to English if the provided language is not supported or the key is missing.
 *
 * @template TKey - A valid nested translation key.
 *
 * @param {Languages} lang - The desired language code (`'en'` or `'ru'`).
 * @param {TKey} key - Dot-separated key to the translation string (e.g., `'auth.login.title'`).
 * @param {string} [defaultValue] - Optional fallback string to return if the key is not found or not a string.
 *
 * @returns {string} - The translation string or a fallback (default or error message).
 *
 * @example
 * getTranslation("en", "home.title");
 * getTranslation("ru", "dashboard.stats.users");
 */
export const getTranslation = <TKey extends MessageKey>(
  lang: Languages,
  key: TKey,
  defaultValue?: string
): GetDeepValue<typeof en, TKey> extends string ? string : string => {
  const fallbackLang: Languages = "en";
  const messages = messagesMap[lang] ?? messagesMap[fallbackLang];

  const message = getNestedValue(messages, key);

  if (typeof message === "string") return message;
  if (defaultValue) return defaultValue;

  return `Error: '${key}' not found for '${lang}'`;
};
